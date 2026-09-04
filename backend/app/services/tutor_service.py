"""
Interactive AI Tutor service.

Orchestrates multi-turn conversational tutoring grounded in:
1. The authenticated student/teacher profile context.
2. Verified regional vocabulary (PostgreSQL RAG retrieval via app.rag.retriever).
3. Adaptive pedagogical calibration (5-level education tiering from app.rag.prompt_builder).
4. Conversational dialogue history management.
5. Groq LLM integration.
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

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
from app.schemas.tutor import (
    ChatMessage,
    CreateSessionRequest,
    SessionResponse,
    TutorChatRequest,
    TutorChatResponse,
)

logger = logging.getLogger(__name__)


# ── In-memory Session Storage ──────────────────────────────────────────────────
# Lightweight session store compatible with future database-backed storage.

@dataclass
class TutorSessionData:
    session_id: str
    user_id: int
    username: str
    role: str
    language: str
    education_level: str
    topic: Optional[str]
    created_at: datetime
    history: list[ChatMessage] = field(default_factory=list)


_SESSIONS: dict[str, TutorSessionData] = {}


def generate_welcome_message(
    username: str,
    role: str,
    language: str,
    topic: Optional[str] = None,
) -> str:
    """Generate a culturally welcoming initial greeting in the chosen language."""
    topic_clause = f" on '{topic}'" if topic else ""
    if language == "kru":
        topic_kru = f" '{topic}' gahi baare nu" if topic else ""
        return (
            f"Ne-hài {username}! En Vernacular AI Tutor taldan. "
            f"Neem endr sikhrina chaahi{topic_kru}?"
        )
    elif language == "hin":
        topic_hin = f" '{topic}' विषय पर" if topic else ""
        return (
            f"नमस्ते {username}! मैं आपका वर्नाक्युलर एआई ट्यूटर हूँ। "
            f"आज आप{topic_hin} क्या सीखना या समझना चाहते हैं?"
        )
    else:  # eng
        return (
            f"Hello {username}! I am your Vernacular AI Tutor. "
            f"What would you like to explore or learn today{topic_clause}?"
        )


def create_session(
    user: User,
    request: CreateSessionRequest,
) -> SessionResponse:
    """Create a new conversational tutoring session."""
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    welcome = generate_welcome_message(
        username=user.username,
        role=user.role,
        language=request.language,
        topic=request.topic,
    )

    initial_history: list[ChatMessage] = [
        ChatMessage(
            role="assistant",
            content=welcome,
            timestamp=now,
        )
    ]

    session_data = TutorSessionData(
        session_id=session_id,
        user_id=user.id,
        username=user.username,
        role=user.role,
        language=request.language,
        education_level=request.education_level,
        topic=request.topic,
        created_at=now,
        history=initial_history,
    )
    _SESSIONS[session_id] = session_data

    return SessionResponse(
        session_id=session_id,
        user_id=user.id,
        username=user.username,
        role=user.role,
        language=request.language,
        education_level=request.education_level,
        topic=request.topic,
        welcome_message=welcome,
        created_at=now,
        message_count=len(initial_history),
    )


def get_session(session_id: str) -> Optional[TutorSessionData]:
    """Retrieve an active tutoring session by session_id."""
    return _SESSIONS.get(session_id)


def get_or_create_session(
    user: User,
    session_id: Optional[str] = None,
    language: Optional[str] = None,
    education_level: Optional[str] = None,
) -> TutorSessionData:
    """Retrieve an existing session or initialize a new one for the user."""
    if session_id and session_id in _SESSIONS:
        session = _SESSIONS[session_id]
        # Update settings if explicitly overridden
        if language:
            session.language = language
        if education_level:
            session.education_level = education_level
        return session

    new_id = session_id or str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    lang = language or "hin"
    level = education_level or "secondary"
    welcome = generate_welcome_message(
        username=user.username,
        role=user.role,
        language=lang,
    )

    session = TutorSessionData(
        session_id=new_id,
        user_id=user.id,
        username=user.username,
        role=user.role,
        language=lang,
        education_level=level,
        topic=None,
        created_at=now,
        history=[ChatMessage(role="assistant", content=welcome, timestamp=now)],
    )
    _SESSIONS[new_id] = session
    return session


# ── Prompt Construction ────────────────────────────────────────────────────────

def build_tutor_system_prompt(
    username: str,
    role: str,
    language: str,
    education_level: str,
    retrieved_entries: list[RetrievedEntry],
    topic: Optional[str] = None,
) -> str:
    """
    Construct a grounded system prompt combining adaptive pedagogy,
    user profile context, and retrieved verified dictionary vocabulary.
    """
    lang_name = _LANG_NAMES.get(language, language)
    level_label = get_level_label(education_level)
    level_guidance = get_level_guidance(education_level)
    context_block = _build_context_block(retrieved_entries)

    topic_line = f"\nCURRENT TUTORING FOCUS/TOPIC: {topic}" if topic else ""

    return f"""\
You are an encouraging, empathetic, and expert interactive AI Tutor on the Vernacular AI platform.
You are actively tutoring {username} (Platform Role: {role}).{topic_line}

LANGUAGE REQUIREMENT:
Respond primarily in {lang_name}. If the language is Kurukh (kru), provide native Kurukh terminology \
with Devanagari script and romanised spellings where helpful, and use Hindi or English bridges when explaining complex concepts.

ADAPTIVE EDUCATION LEVEL: {level_label}
Calibrate your vocabulary complexity, explanation depth, sentence structure, examples, and terminology according to these exact guidelines:
{level_guidance}

TUTORING METHODOLOGY:
1. Act as a dialogue-based educator: explain clearly, use step-by-step reasoning, and ask thoughtful check-for-understanding questions.
2. If verified vocabulary context entries are provided below, prioritize their exact spellings and definitions. Do NOT fabricate linguistic facts.
3. If the context does not contain the answer or is empty, answer honestly from general educational knowledge while maintaining your supportive tutor persona.
4. Keep explanations engaging, constructive, and culturally affirming.

VOCABULARY CONTEXT FROM VERIFIED DICTIONARY:
{context_block}
"""


# ── Groq LLM Execution ─────────────────────────────────────────────────────────

async def _call_groq_chat(messages: list[dict[str, str]]) -> str | None:
    """
    Send conversation messages to the Groq chat completions API.

    Raises:
        GroqNotConfiguredError: If GROQ_API_KEY is not set.
        GroqTranslationError: On API timeout or request failure.
    """
    from groq import AsyncGroq, APIError, APITimeoutError

    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise GroqNotConfiguredError(
            "GROQ_API_KEY is not configured. Add it to backend/.env to enable AI tutoring."
        )

    model = settings.GROQ_MODEL
    timeout = settings.GROQ_TIMEOUT_SECONDS

    try:
        client = AsyncGroq(api_key=api_key, timeout=timeout)
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=1024,
            temperature=0.4,
        )
    except APITimeoutError as exc:
        logger.warning("Groq Tutor API request timed out: %s", exc)
        raise GroqTranslationError(f"Groq API request timed out ({timeout}s).") from exc
    except APIError as exc:
        logger.warning("Groq Tutor API error: %s", exc)
        raise GroqTranslationError(f"Groq API returned an error: {exc}") from exc
    except Exception as exc:
        logger.exception("Unexpected error calling Groq for Tutor")
        raise GroqTranslationError(f"Unexpected error: {exc}") from exc

    result = (response.choices[0].message.content or "").strip()
    return result if result else None


# ── Main Chat Turn Processing ──────────────────────────────────────────────────

async def chat_with_tutor(
    user: User,
    db: AsyncSession,
    request: TutorChatRequest,
) -> TutorChatResponse:
    """
    Process a student/teacher chat turn:
    1. Resolve or create session.
    2. Retrieve relevant vocabulary via RAG.
    3. Construct adaptive dialogue prompt with history.
    4. Execute Groq LLM.
    5. Update session history and return structured response.
    """
    session = get_or_create_session(
        user=user,
        session_id=request.session_id,
        language=request.language,
        education_level=request.education_level,
    )

    lang = session.language
    level = session.education_level

    # 1. Retrieve vocabulary context from PostgreSQL
    retrieved_entries = await retrieve_context(request.message, db)
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

    # 2. Build system prompt
    system_prompt = build_tutor_system_prompt(
        username=user.username,
        role=user.role,
        language=lang,
        education_level=level,
        retrieved_entries=retrieved_entries,
        topic=session.topic,
    )

    # 3. Assemble messages including multi-turn history
    llm_messages: list[dict[str, str]] = [
        {"role": "system", "content": system_prompt}
    ]

    # Incorporate client-provided history if given, otherwise session history
    prior_history = request.history if request.history is not None else session.history
    # Include up to the last 10 messages for conversational continuity without exceeding context
    for msg in prior_history[-10:]:
        if msg.role in ("user", "assistant"):
            llm_messages.append({"role": msg.role, "content": msg.content})

    # Add the current user turn
    llm_messages.append({"role": "user", "content": request.message})

    # 4. Call Groq
    now = datetime.now(timezone.utc)
    try:
        tutor_reply = await _call_groq_chat(llm_messages)
        if not tutor_reply:
            method = "ai_error"
            reply_text = (
                "The AI tutor could not generate a response. "
                "Please try rephrasing your question."
            )
        else:
            method = "tutor_rag" if context_entries else "tutor_llm"
            reply_text = tutor_reply

    except GroqNotConfiguredError:
        logger.info("Groq not configured for AI Tutor")
        method = "not_configured"
        reply_text = (
            "AI tutor is currently not configured. "
            "Set GROQ_API_KEY in backend/.env to enable tutoring interactions."
        )
    except GroqTranslationError as exc:
        logger.warning("Groq Tutor execution error: %s", exc)
        method = "ai_error"
        reply_text = "The AI tutor encountered a service error. Please try again shortly."

    # 5. Append to session history
    user_turn = ChatMessage(role="user", content=request.message, timestamp=now)
    assistant_turn = ChatMessage(role="assistant", content=reply_text, timestamp=now)
    session.history.append(user_turn)
    session.history.append(assistant_turn)

    return TutorChatResponse(
        session_id=session.session_id,
        message=request.message,
        response=reply_text,
        language=lang,
        education_level=level,
        method=method,
        retrieved_context=context_entries,
        context_count=len(context_entries),
        history=session.history,
        created_at=now,
    )
