"""
STT provider client — Groq Whisper Speech-to-Text.

Architecture:
    This module is the single integration point for STT transcription.
    The service and route layers call transcribe_audio() only;
    they never import from groq directly.

Provider: Groq audio.transcriptions (Whisper Large V3 Turbo)
    Reuses the existing GROQ_API_KEY already configured for translation.
    No new API key or package required.

    Groq's audio.transcriptions.create() accepts:
        file     — audio bytes with a filename hint for format detection
        model    — Groq Whisper model ID
        language — BCP-47 tag (optional; auto-detects if omitted)
        response_format — "verbose_json" | "json" | "text"

Language support (VERIFIED — Groq/OpenAI Whisper documentation):
    hin (Hindi)   → BCP-47 "hi" — ✅ Whisper multilingual, trained on Hindi
    eng (English) → BCP-47 "en" — ✅ Whisper multilingual, trained on English
    kru (Kurukh)  → ❌ Whisper has NO Kurukh training data.
                     This is declared explicitly. Raises
                     STTProviderUnsupportedLanguageError so the service layer
                     can return a clear 'unsupported_language' response.

Secrets:
    GROQ_API_KEY is read from settings — never logged or exposed.
"""

from __future__ import annotations

import logging

from app.core.config import settings
from app.voice.stt_schemas import (
    LANG_CODE_TO_WHISPER_TAG,
    STT_PROVIDER_SUPPORTED_LANGS,
)

logger = logging.getLogger(__name__)


# ── Custom exceptions ─────────────────────────────────────────────────────────


class STTNotConfiguredError(Exception):
    """Raised when GROQ_API_KEY is not set."""


class STTProviderUnsupportedLanguageError(Exception):
    """Raised when the language is not supported by the STT provider."""

    def __init__(self, lang_code: str) -> None:
        self.lang_code = lang_code
        super().__init__(
            f"Language '{lang_code}' is not supported by the STT provider (Groq Whisper)."
        )


class STTProviderError(Exception):
    """Raised when the Groq STT API call fails."""


class STTTimeoutError(STTProviderError):
    """Raised when the Groq STT API call times out."""


# ── Transcription result ──────────────────────────────────────────────────────


class TranscriptionResult:
    """Raw result returned by the STT provider."""

    __slots__ = ("text", "detected_language", "model")

    def __init__(
        self,
        text: str,
        detected_language: str | None,
        model: str,
    ) -> None:
        self.text = text
        self.detected_language = detected_language
        self.model = model


# ── Main transcription function ───────────────────────────────────────────────


async def transcribe_audio(
    audio_bytes: bytes,
    filename: str,
    language: str,
) -> TranscriptionResult:
    """
    Transcribe *audio_bytes* using Groq Whisper.

    Args:
        audio_bytes: Raw audio file content.
        filename:    Original filename (used by Groq for format detection, e.g. "audio.mp3").
        language:    ISO 639-3 language code (kru / hin / eng).

    Returns:
        TranscriptionResult with transcript text and detected language.

    Raises:
        STTNotConfiguredError               — GROQ_API_KEY not set.
        STTProviderUnsupportedLanguageError — language not supported by Whisper.
        STTTimeoutError                     — request timed out.
        STTProviderError                    — other API error.
    """
    # ── Check configuration ────────────────────────────────────────────────────
    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise STTNotConfiguredError(
            "GROQ_API_KEY is not configured. "
            "Add it to backend/.env to enable speech-to-text."
        )

    # ── Verify language support (honest, explicit) ─────────────────────────────
    if language not in STT_PROVIDER_SUPPORTED_LANGS:
        raise STTProviderUnsupportedLanguageError(language)

    whisper_lang = LANG_CODE_TO_WHISPER_TAG[language]
    model = settings.GROQ_STT_MODEL
    timeout = settings.GROQ_STT_TIMEOUT_SECONDS

    # ── Call Groq Whisper ──────────────────────────────────────────────────────
    try:
        from groq import AsyncGroq, APIError, APITimeoutError  # type: ignore[import]

        client = AsyncGroq(api_key=api_key, timeout=timeout)
        response = await client.audio.transcriptions.create(
            file=(filename, audio_bytes),
            model=model,
            language=whisper_lang,
            response_format="verbose_json",
            temperature=0.0,
        )
    except APITimeoutError as exc:
        logger.warning("Groq STT request timed out after %.1f s: %s", timeout, exc)
        raise STTTimeoutError(
            f"STT provider timed out after {timeout}s."
        ) from exc
    except APIError as exc:
        logger.warning("Groq STT API error: %s", exc)
        # Distinguish auth errors from generic API errors
        status = getattr(exc, "status_code", None)
        if status == 401:
            raise STTProviderError(
                "STT authentication failed. Check GROQ_API_KEY."
            ) from exc
        raise STTProviderError(
            f"STT provider returned an error (HTTP {status})."
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error calling Groq STT API")
        raise STTProviderError(f"Unexpected STT error: {type(exc).__name__}.") from exc

    transcript_text = (getattr(response, "text", "") or "").strip()
    detected = getattr(response, "language", None)

    return TranscriptionResult(
        text=transcript_text,
        detected_language=detected,
        model=model,
    )
