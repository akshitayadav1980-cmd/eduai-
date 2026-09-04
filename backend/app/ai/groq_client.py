"""
Groq API client for AI-assisted translation.

This module is the single integration point for the Groq SDK.
All other code interacts with Groq through the functions here;
none of the service or route layer imports groq directly.

Future replacements (IndicTrans2, another LLM, RAG) only need to
swap this file, not touch the service or route layer.

Environment variables (set in backend/.env):
  GROQ_API_KEY         — required to enable AI translation
  GROQ_MODEL           — model ID (default: llama-3.3-70b-versatile)
  GROQ_TIMEOUT_SECONDS — per-request timeout in seconds (default: 10.0)

If GROQ_API_KEY is absent the module is importable but calling
ai_translate() will raise GroqNotConfiguredError immediately.
"""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

# ── Custom exceptions ─────────────────────────────────────────────────────────

class GroqNotConfiguredError(Exception):
    """Raised when GROQ_API_KEY is not set in the environment."""


class GroqTranslationError(Exception):
    """Raised when the Groq API call fails for any reason."""


# ── Translation prompt template ───────────────────────────────────────────────

_SYSTEM_PROMPT = (
    "You are an expert translator specialising in Indian regional languages, "
    "particularly Kurukh (also known as Oraon), Hindi, and English. "
    "Your task is to translate a single word or short phrase accurately. "
    "Reply with ONLY the translated word or phrase — no explanation, "
    "no punctuation beyond what is part of the translation itself, "
    "no surrounding quotes. If you cannot translate it, reply with exactly: "
    "UNKNOWN"
)

_USER_PROMPT_TEMPLATE = (
    "Translate the following from {source_lang_name} to {target_lang_name}:\n"
    "{text}"
)

_LANG_NAMES: dict[str, str] = {
    "kru": "Kurukh",
    "hin": "Hindi",
    "eng": "English",
}


# ── Main function ─────────────────────────────────────────────────────────────

async def ai_translate(
    text: str,
    source_language: str,
    target_language: str,
) -> str | None:
    """
    Ask Groq to translate *text* from *source_language* to *target_language*.

    Returns:
        The translated string on success.
        None if Groq says it cannot translate the text (replies 'UNKNOWN').

    Raises:
        GroqNotConfiguredError  — GROQ_API_KEY is not set.
        GroqTranslationError    — API call failed (network, rate limit, etc.).

    The GROQ_API_KEY is read from config every call so a hot-reload of the
    .env file in development takes effect without restarting the server.
    """
    # Import here so the module is importable even when groq isn't installed
    # (makes testing with mocks simpler).
    from groq import AsyncGroq, APIError, APITimeoutError  # type: ignore[import]
    from app.core.config import settings

    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise GroqNotConfiguredError(
            "GROQ_API_KEY is not configured. "
            "Add it to backend/.env to enable AI fallback translation."
        )

    model = settings.GROQ_MODEL
    timeout = settings.GROQ_TIMEOUT_SECONDS

    src_name = _LANG_NAMES.get(source_language, source_language)
    tgt_name = _LANG_NAMES.get(target_language, target_language)
    user_prompt = _USER_PROMPT_TEMPLATE.format(
        source_lang_name=src_name,
        target_lang_name=tgt_name,
        text=text,
    )

    try:
        client = AsyncGroq(api_key=api_key, timeout=timeout)
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=128,
            temperature=0.1,   # low temperature for deterministic translation
        )
    except APITimeoutError as exc:
        logger.warning("Groq API request timed out after %.1f s: %s", timeout, exc)
        raise GroqTranslationError(f"Groq API request timed out ({timeout}s).") from exc
    except APIError as exc:
        logger.warning("Groq API error: %s", exc)
        raise GroqTranslationError(
            f"Groq API returned an error: {exc}"
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error calling Groq API")
        raise GroqTranslationError(f"Unexpected error: {exc}") from exc

    result = response.choices[0].message.content or ""
    result = result.strip()

    if result.upper() == "UNKNOWN" or not result:
        return None

    return result
