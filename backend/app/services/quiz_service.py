"""
Quiz Generation & Evaluation Service.

Features:
1. Multilingual, level-adaptive educational MCQ generation powered by Groq LLM.
2. Verified regional vocabulary grounding via PostgreSQL RAG retrieval.
3. Adaptive pedagogical calibration for 5 education levels.
4. Server-side answer security (correct answers omitted from generation responses).
5. 100% deterministic, instant answer evaluation without external LLM calls.
"""

from __future__ import annotations

import json
import logging
import re
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.groq_client import GroqNotConfiguredError, GroqTranslationError
from app.core.config import settings
from app.models.user import User
from app.rag.prompt_builder import (
    _build_context_block,
    _LANG_NAMES,
    get_level_guidance,
    get_level_label,
)
from app.rag.retriever import RetrievedEntry, retrieve_context
from app.schemas.qa import ContextEntry
from app.schemas.quiz import (
    GenerateQuizRequest,
    GenerateQuizResponse,
    QuestionEvaluationItem,
    QuestionResult,
    QuizEvaluateRequest,
    QuizEvaluateResponse,
    QuizQuestionPublic,
)

logger = logging.getLogger(__name__)


# ── Server-side Storage for Quizzes ────────────────────────────────────────────

@dataclass
class StoredQuestion:
    id: str
    question: str
    options: list[str]
    correct_answer: str
    explanation: Optional[str] = None
    type: str = "mcq"
    difficulty: str = "medium"


@dataclass
class StoredQuiz:
    quiz_id: str
    user_id: int
    topic: str
    language: str
    education_level: str
    difficulty: str
    questions: list[StoredQuestion]
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


_QUIZZES: dict[str, StoredQuiz] = {}


def store_quiz(quiz: StoredQuiz) -> None:
    """Save a quiz into the server memory store."""
    _QUIZZES[quiz.quiz_id] = quiz


def get_quiz(quiz_id: str) -> Optional[StoredQuiz]:
    """Retrieve a stored quiz by its quiz_id."""
    return _QUIZZES.get(quiz_id)


def clear_quizzes() -> None:
    """Clear in-memory quizzes (primarily for testing)."""
    _QUIZZES.clear()


# ── Prompt Builder ─────────────────────────────────────────────────────────────

def build_quiz_generation_prompt(
    topic: str,
    language: str,
    education_level: str,
    difficulty: str,
    num_questions: int,
    retrieved_entries: list[RetrievedEntry],
) -> tuple[str, str]:
    """
    Build a grounded system prompt and user message to instruct Groq to output
    a strict JSON array of quiz questions.
    """
    lang_name = _LANG_NAMES.get(language, language)
    level_label = get_level_label(education_level)
    level_guidance = get_level_guidance(education_level)
    context_block = _build_context_block(retrieved_entries)

    system_prompt = f"""\
You are an expert pedagogical quiz creator for the Vernacular AI educational platform.
Your task is to generate high-quality, culturally relevant multiple-choice questions (MCQs).

LANGUAGE REQUIREMENT:
Write all questions, options, and explanations in {lang_name}.
If the language is Kurukh (kru), use native Kurukh and/or Devanagari script, along with romanized Kurukh where helpful, and provide Hindi/English translations in the options or explanations where appropriate.

ADAPTIVE EDUCATION LEVEL: {level_label}
Calibrate question complexity, vocabulary, and depth according to this guidance:
{level_guidance}

DIFFICULTY LEVEL: {difficulty.upper()}

VERIFIED VOCABULARY GROUNDING:
When verified dictionary entries are provided below, prioritize using them to create accurate vocabulary, meaning, and usage questions.
Do NOT invent false linguistic facts.

VOCABULARY CONTEXT FROM VERIFIED DICTIONARY:
{context_block}

OUTPUT FORMAT REQUIREMENT:
You must respond with ONLY a valid JSON array of objects. Do not include any introductory or concluding conversational prose.
Each JSON object must have exactly these keys:
- "question": string, the question text.
- "options": array of 4 distinct strings.
- "correct_answer": string, which MUST be one of the strings in "options".
- "explanation": string, a helpful pedagogical explanation of why this answer is correct.
"""

    user_prompt = (
        f"Generate exactly {num_questions} {difficulty} multiple-choice questions "
        f"on the topic '{topic}' for education level '{level_label}' in {lang_name}."
    )

    return system_prompt, user_prompt


# ── Groq LLM Execution ─────────────────────────────────────────────────────────

async def _call_groq_quiz(system_prompt: str, user_prompt: str) -> str | None:
    """
    Invoke Groq LLM chat completions for quiz generation.
    """
    from groq import AsyncGroq, APIError, APITimeoutError

    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise GroqNotConfiguredError(
            "GROQ_API_KEY is not configured. Add it to backend/.env to enable quiz generation."
        )

    model = settings.GROQ_MODEL
    timeout = settings.GROQ_TIMEOUT_SECONDS

    try:
        client = AsyncGroq(api_key=api_key, timeout=timeout)
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=1500,
            temperature=0.3,
        )
    except APITimeoutError as exc:
        logger.warning("Groq Quiz API request timed out: %s", exc)
        raise GroqTranslationError(f"Groq API request timed out ({timeout}s).") from exc
    except APIError as exc:
        logger.warning("Groq Quiz API error: %s", exc)
        raise GroqTranslationError(f"Groq API returned an error: {exc}") from exc
    except Exception as exc:
        logger.exception("Unexpected error calling Groq for Quiz")
        raise GroqTranslationError(f"Unexpected error: {exc}") from exc

    return (response.choices[0].message.content or "").strip()


def _extract_json_array(raw_text: str) -> list[dict]:
    """Extract and parse a JSON array from LLM output, handling markdown code fences."""
    text = raw_text.strip()
    # Strip markdown ```json ... ``` blocks if present
    if "```" in text:
        match = re.search(r"```(?:json)?\s*(\[.*?\])\s*```", text, re.DOTALL)
        if match:
            text = match.group(1)
        else:
            text = re.sub(r"^```[a-zA-Z]*\n", "", text)
            text = re.sub(r"\n```$", "", text).strip()

    # Locate the outer JSON brackets [ ... ]
    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end != -1 and end > start:
        text = text[start : end + 1]

    data = json.loads(text)
    if not isinstance(data, list):
        raise ValueError("Parsed JSON is not a list")
    return data


# ── Quiz Generation Pipeline ───────────────────────────────────────────────────

async def generate_quiz(
    user: User,
    db: AsyncSession,
    request: GenerateQuizRequest,
) -> GenerateQuizResponse:
    """
    Generate an educational quiz:
    1. Retrieve relevant vocabulary from PostgreSQL.
    2. Build prompt with adaptive pedagogy and dictionary context.
    3. Query Groq LLM.
    4. Parse questions and store answer keys server-side.
    5. Return public questions to the client (without correct answers).
    """
    quiz_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    # 1. RAG retrieval from PostgreSQL vocabulary
    retrieved_entries = await retrieve_context(request.topic, db)
    context_entries = [
        ContextEntry(
            entry_id=e.entry_id,
            kurukh=e.kurukh,
            hindi=e.hindi,
            english=e.english,
            part_of_speech=e.part_of_speech,
            category=e.category,
            verified=e.verified,
        )
        for e in retrieved_entries
    ]

    # 2. Build system and user prompt
    system_prompt, user_prompt = build_quiz_generation_prompt(
        topic=request.topic,
        language=request.language,
        education_level=request.education_level,
        difficulty=request.difficulty,
        num_questions=request.num_questions,
        retrieved_entries=retrieved_entries,
    )

    # 3. Call Groq
    try:
        raw_output = await _call_groq_quiz(system_prompt, user_prompt)
        if not raw_output:
            return GenerateQuizResponse(
                quiz_id=quiz_id,
                topic=request.topic,
                language=request.language,
                education_level=request.education_level,
                difficulty=request.difficulty,
                total_questions=0,
                questions=[],
                method="ai_error",
                retrieved_context=context_entries,
                context_count=len(context_entries),
                message="The AI service returned an empty response.",
                created_at=now,
            )

        parsed_items = _extract_json_array(raw_output)
    except GroqNotConfiguredError:
        return GenerateQuizResponse(
            quiz_id=quiz_id,
            topic=request.topic,
            language=request.language,
            education_level=request.education_level,
            difficulty=request.difficulty,
            total_questions=0,
            questions=[],
            method="not_configured",
            retrieved_context=context_entries,
            context_count=len(context_entries),
            message="AI service is not configured. Set GROQ_API_KEY in backend/.env.",
            created_at=now,
        )
    except (GroqTranslationError, Exception) as exc:
        logger.warning("Quiz generation failed: %s", exc)
        return GenerateQuizResponse(
            quiz_id=quiz_id,
            topic=request.topic,
            language=request.language,
            education_level=request.education_level,
            difficulty=request.difficulty,
            total_questions=0,
            questions=[],
            method="ai_error",
            retrieved_context=context_entries,
            context_count=len(context_entries),
            message="The AI service encountered an error generating the quiz.",
            created_at=now,
        )

    # 4. Process and store questions
    stored_questions: list[StoredQuestion] = []
    public_questions: list[QuizQuestionPublic] = []

    for idx, item in enumerate(parsed_items, start=1):
        q_id = f"q{idx}"
        q_text = str(item.get("question", "")).strip()
        raw_options = item.get("options", [])
        options = [str(opt).strip() for opt in raw_options if str(opt).strip()]
        correct_ans = str(item.get("correct_answer", "")).strip()
        explanation = str(item.get("explanation", "")).strip() or None

        if not q_text or len(options) < 2:
            continue

        stored_questions.append(
            StoredQuestion(
                id=q_id,
                question=q_text,
                options=options,
                correct_answer=correct_ans,
                explanation=explanation,
                type="mcq",
                difficulty=request.difficulty,
            )
        )
        # Public question: omit correct_answer and explanation
        public_questions.append(
            QuizQuestionPublic(
                id=q_id,
                question=q_text,
                options=options,
                type="mcq",
                difficulty=request.difficulty,
            )
        )

    # Save to server store
    stored_quiz = StoredQuiz(
        quiz_id=quiz_id,
        user_id=user.id,
        topic=request.topic,
        language=request.language,
        education_level=request.education_level,
        difficulty=request.difficulty,
        questions=stored_questions,
        created_at=now,
    )
    store_quiz(stored_quiz)

    method = "quiz_rag" if context_entries else "quiz_llm"

    return GenerateQuizResponse(
        quiz_id=quiz_id,
        topic=request.topic,
        language=request.language,
        education_level=request.education_level,
        difficulty=request.difficulty,
        total_questions=len(public_questions),
        questions=public_questions,
        method=method,
        retrieved_context=context_entries,
        context_count=len(context_entries),
        message=None,
        created_at=now,
    )


# ── Answer Matching & Evaluation ───────────────────────────────────────────────

def _is_match(selected: str, correct: str, options: list[str]) -> bool:
    """
    Deterministically compare a submitted answer against the correct answer.
    Supports option letters (A, B, C, D), prefixed text ('A) Water'), and exact text.
    """
    s = selected.strip().lower()
    c = correct.strip().lower()

    if s == c:
        return True

    # Strip prefixes like "a) ", "b. ", "(c) "
    def _strip_prefix(text: str) -> str:
        return re.sub(r"^[a-d][\)\.\:\-]\s*|\([a-d]\)\s*", "", text).strip()

    s_clean = _strip_prefix(s)
    c_clean = _strip_prefix(c)
    if s_clean and c_clean and s_clean == c_clean:
        return True

    # Check if selected is single letter (A, B, C, D)
    letter_map = {"a": 0, "b": 1, "c": 2, "d": 3}
    if s in letter_map and letter_map[s] < len(options):
        opt_text = options[letter_map[s]].strip().lower()
        if opt_text == c or _strip_prefix(opt_text) == c_clean:
            return True

    # Check if correct is single letter
    if c in letter_map and letter_map[c] < len(options):
        opt_text = options[letter_map[c]].strip().lower()
        if opt_text == s or _strip_prefix(opt_text) == s_clean:
            return True

    return False


def evaluate_quiz(request: QuizEvaluateRequest) -> QuizEvaluateResponse:
    """
    Deterministically evaluate submitted answers against the stored quiz or provided questions.
    Does NOT invoke external LLMs.
    """
    questions_to_evaluate: list[StoredQuestion | QuestionEvaluationItem] = []
    quiz_id = request.quiz_id

    # 1. Resolve quiz questions
    if quiz_id and quiz_id in _QUIZZES:
        questions_to_evaluate = _QUIZZES[quiz_id].questions
    elif request.questions:
        questions_to_evaluate = request.questions
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Quiz session '{quiz_id}' not found in active session store "
                "and no questions were provided in the evaluation request."
            ),
        )

    if not questions_to_evaluate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The quiz has no questions to evaluate.",
        )

    # 2. Map user answers by question ID
    submitted_answers: dict[str, str] = {
        a.question_id.strip(): a.selected_option.strip() for a in request.answers
    }

    results: list[QuestionResult] = []
    correct_count = 0

    # 3. Evaluate each question
    for q in questions_to_evaluate:
        q_id = q.id.strip()
        selected = submitted_answers.get(q_id)
        is_correct = False

        if selected is not None:
            is_correct = _is_match(selected, q.correct_answer, q.options)

        if is_correct:
            correct_count += 1

        results.append(
            QuestionResult(
                question_id=q.id,
                question=q.question,
                selected_option=selected,
                correct_answer=q.correct_answer,
                is_correct=is_correct,
                explanation=q.explanation,
            )
        )

    total_questions = len(questions_to_evaluate)
    incorrect_count = total_questions - correct_count
    score = correct_count
    percentage = round((score / total_questions) * 100, 1) if total_questions > 0 else 0.0
    passed = percentage >= 60.0

    return QuizEvaluateResponse(
        quiz_id=quiz_id,
        total_questions=total_questions,
        correct_answers=correct_count,
        incorrect_answers=incorrect_count,
        score=score,
        percentage=percentage,
        passed=passed,
        results=results,
    )
