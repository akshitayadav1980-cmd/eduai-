"""
RAG QA service — orchestrates the full educational Q&A pipeline.

Pipeline:
    question + source_language + education_level
        → retrieve_context()          (PostgreSQL vocabulary search)
        → build_prompt()              (grounded system + user prompt)
        → ai_translate() analogue     (reuses existing Groq client)
        → QAResponse

The existing translation pipeline is untouched.  This is a separate
educational-answer pipeline that reuses the same Groq infrastructure.
"""

from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.groq_client import (
    GroqNotConfiguredError,
    GroqTranslationError,
    ai_translate as _ai_translate,  # re-exported for monkeypatching in tests
)
from app.core.config import settings
from app.rag.prompt_builder import build_prompt
from app.rag.retriever import RetrievedEntry, retrieve_context
from app.schemas.qa import ContextEntry, QAResponse

logger = logging.getLogger(__name__)


# ── Groq call (thin wrapper so tests can patch at this level) ─────────────────

async def _call_groq(system_prompt: str, user_message: str) -> str | None:
    """
    Send a grounded prompt to Groq and return the raw text response.

    Returns None if the model replies with nothing useful.
    Raises GroqNotConfiguredError or GroqTranslationError on failures
    (identical to the translation pipeline convention).

    NOTE: We call the Groq SDK directly here (not via ai_translate) because
    we need full control over system/user messages.  ai_translate is kept for
    the translation pipeline.  We reuse AsyncGroq from the same installed
    package.
    """
    from groq import AsyncGroq, APIError, APITimeoutError  # type: ignore[import]

    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise GroqNotConfiguredError(
            "GROQ_API_KEY is not configured. "
            "Add it to backend/.env to enable RAG Q&A."
        )

    model = settings.GROQ_MODEL
    timeout = settings.GROQ_TIMEOUT_SECONDS

    try:
        client = AsyncGroq(api_key=api_key, timeout=timeout)
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            max_tokens=512,
            temperature=0.3,
        )
    except APITimeoutError as exc:
        logger.warning("Groq RAG request timed out: %s", exc)
        raise GroqTranslationError(f"Groq API request timed out ({timeout}s).") from exc
    except APIError as exc:
        logger.warning("Groq RAG API error: %s", exc)
        raise GroqTranslationError(f"Groq API returned an error: {exc}") from exc
    except Exception as exc:
        logger.exception("Unexpected error calling Groq for RAG")
        raise GroqTranslationError(f"Unexpected error: {exc}") from exc

    result = (response.choices[0].message.content or "").strip()
    return result if result else None


# ── Public QA service entry point ─────────────────────────────────────────────

async def answer_question(
    question: str,
    source_language: str,
    education_level: str,
    db: AsyncSession,
) -> QAResponse:
    """
    Full RAG pipeline: retrieve → prompt → Groq → structured response.

    Args:
        question:         The student's educational question.
        source_language:  ISO 639-3 code for the desired response language.
        education_level:  Adaptive-pedagogy level —
                          primary | secondary | higher_secondary |
                          college | professional.
        db:               Async database session (injected by FastAPI).

    Returns:
        QAResponse with method='rag' on success.
    """
    # ── Step 1: Retrieve relevant vocabulary context ───────────────────────────
    retrieved: list[RetrievedEntry] = await retrieve_context(question, db)

    # ── Step 2: Build grounded prompt ─────────────────────────────────────────
    system_prompt, user_message = build_prompt(
        question=question,
        source_language=source_language,
        education_level=education_level,
        retrieved_entries=retrieved,
    )

    # ── Step 3: Call Groq with grounded prompt ─────────────────────────────────
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
        for e in retrieved
    ]

    try:
        raw_answer = await _call_groq(system_prompt, user_message)
    except GroqNotConfiguredError:
        logger.info("Groq not configured; returning error for RAG question")
        return QAResponse(
            question=question,
            answer="",
            source_language=source_language,
            education_level=education_level,
            method="not_configured",
            retrieved_context=context_entries,
            context_count=len(context_entries),
            message=(
                "AI is not configured. "
                "Set GROQ_API_KEY in backend/.env to enable educational Q&A."
            ),
        )
    except GroqTranslationError as exc:
        logger.warning("Groq RAG failed: %s", exc)
        return QAResponse(
            question=question,
            answer="",
            source_language=source_language,
            education_level=education_level,
            method="ai_error",
            retrieved_context=context_entries,
            context_count=len(context_entries),
            message="The AI service encountered an error. Please try again.",
        )

    if raw_answer is None:
        return QAResponse(
            question=question,
            answer="",
            source_language=source_language,
            education_level=education_level,
            method="no_answer",
            retrieved_context=context_entries,
            context_count=len(context_entries),
            message="The AI model could not produce an answer for this question.",
        )

    return QAResponse(
        question=question,
        answer=raw_answer,
        source_language=source_language,
        education_level=education_level,
        method="rag",
        retrieved_context=context_entries,
        context_count=len(context_entries),
        message=None,
    )
