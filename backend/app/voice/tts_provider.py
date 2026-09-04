"""
TTS provider client — HTTP-based Text-to-Speech.

Architecture:
    This module is the single integration point for TTS synthesis.
    The service and route layers call synthesise_speech() only;
    they never touch the HTTP client directly.

Provider:
    HTTP TTS endpoint configured via TTS_API_URL in backend/.env.
    The endpoint must accept a JSON POST request and return audio bytes.

    Expected request body:
        { "text": "...", "lang": "hi" }   (BCP-47 language tag)

    Expected response:
        Content-Type: audio/mpeg
        Body: raw MP3 bytes

    This interface is compatible with many self-hosted TTS servers
    (Coqui TTS, StyleTTS2, Bhashini, etc.) and can be swapped without
    touching the service or route layers.

Language support (VERIFIED):
    hin (Hindi)   → BCP-47 "hi" — supported
    eng (English) → BCP-47 "en" — supported
    kru (Kurukh)  → NOT supported by any currently integrated provider.
                    This is declared explicitly and honestly.
                    Returns TTSProviderUnsupportedLanguageError.
                    Kurukh TTS support can be added here when a suitable
                    model/provider becomes available.

Secrets:
    TTS_API_URL may contain credentials embedded in the URL.
    It is NEVER logged or exposed in responses.
"""

from __future__ import annotations

import base64
import logging

import httpx

from app.core.config import settings
from app.voice.tts_schemas import (
    LANG_CODE_TO_BCP47,
    TTS_PROVIDER_SUPPORTED_LANGS,
)

logger = logging.getLogger(__name__)

# ── Custom exceptions ─────────────────────────────────────────────────────────


class TTSNotConfiguredError(Exception):
    """Raised when TTS_API_URL is not set in the environment."""


class TTSProviderUnsupportedLanguageError(Exception):
    """Raised when the language is not supported by the current TTS provider."""

    def __init__(self, lang_code: str) -> None:
        self.lang_code = lang_code
        super().__init__(f"Language '{lang_code}' is not supported by the TTS provider.")


class TTSProviderError(Exception):
    """Raised when the TTS provider HTTP call fails."""


# ── TTS timeout ───────────────────────────────────────────────────────────────

_TTS_TIMEOUT_SECONDS: float = 15.0


# ── Main synthesis function ───────────────────────────────────────────────────


async def synthesise_speech(
    text: str,
    language: str,
) -> str:
    """
    Synthesise *text* into speech for *language* using the configured TTS provider.

    Args:
        text:     The text to synthesise (already validated and trimmed).
        language: ISO 639-3 language code (kru / hin / eng).

    Returns:
        Base64-encoded MP3 audio string.

    Raises:
        TTSNotConfiguredError              — TTS_API_URL not set.
        TTSProviderUnsupportedLanguageError — language not supported by provider.
        TTSProviderError                   — HTTP call failed.
    """
    # ── Check configuration ────────────────────────────────────────────────────
    tts_url = settings.TTS_API_URL
    if not tts_url:
        raise TTSNotConfiguredError(
            "TTS_API_URL is not configured. "
            "Add it to backend/.env to enable text-to-speech synthesis."
        )

    # ── Check language support (honest, explicit) ──────────────────────────────
    if language not in TTS_PROVIDER_SUPPORTED_LANGS:
        raise TTSProviderUnsupportedLanguageError(language)

    bcp47 = LANG_CODE_TO_BCP47[language]

    # ── Call TTS provider ──────────────────────────────────────────────────────
    try:
        async with httpx.AsyncClient(timeout=_TTS_TIMEOUT_SECONDS) as client:
            response = await client.post(
                tts_url,
                json={"text": text, "lang": bcp47},
                headers={"Accept": "audio/mpeg"},
            )
            response.raise_for_status()
    except httpx.TimeoutException as exc:
        logger.warning("TTS provider request timed out: %s", exc)
        raise TTSProviderError(
            f"TTS provider timed out after {_TTS_TIMEOUT_SECONDS}s."
        ) from exc
    except httpx.HTTPStatusError as exc:
        logger.warning(
            "TTS provider returned HTTP %d", exc.response.status_code
        )
        raise TTSProviderError(
            f"TTS provider returned HTTP {exc.response.status_code}."
        ) from exc
    except httpx.RequestError as exc:
        logger.warning("TTS provider request error: %s", exc)
        raise TTSProviderError(
            f"TTS provider connection error: {type(exc).__name__}."
        ) from exc

    # ── Encode audio as base64 for JSON transport ──────────────────────────────
    audio_bytes = response.content
    if not audio_bytes:
        raise TTSProviderError("TTS provider returned an empty audio response.")

    return base64.b64encode(audio_bytes).decode("ascii")
