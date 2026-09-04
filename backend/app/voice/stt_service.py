"""
STT service — orchestrates the Speech-to-Text pipeline.

Pipeline:
    audio_bytes + filename + language
        → validate language support
        → call STT provider (Groq Whisper)
        → return STTResponse

All provider exceptions are mapped to clean STTResponse values here,
matching the convention established by the translation and TTS services.
"""

from __future__ import annotations

import logging

from app.voice.stt_provider import (
    STTNotConfiguredError,
    STTProviderError,
    STTProviderUnsupportedLanguageError,
    STTTimeoutError,
    transcribe_audio,
)
from app.voice.stt_schemas import (
    LANG_CODE_TO_NAME,
    STT_PROVIDER_SUPPORTED_LANGS,
    STTResponse,
)

logger = logging.getLogger(__name__)


async def speech_to_text(
    audio_bytes: bytes,
    filename: str,
    language: str,
) -> STTResponse:
    """
    Transcribe *audio_bytes* in *language* and return an STTResponse.

    Args:
        audio_bytes: Raw audio content.
        filename:    Original filename for MIME detection by the provider.
        language:    ISO 639-3 language code (pre-validated by the route).

    Returns:
        STTResponse — method='stt' on success, descriptive method on failure.
    """
    try:
        result = await transcribe_audio(
            audio_bytes=audio_bytes,
            filename=filename,
            language=language,
        )

    except STTNotConfiguredError:
        logger.info("STT not configured (GROQ_API_KEY missing)")
        return STTResponse(
            transcript="",
            language=language,
            method="not_configured",
            message=(
                "Speech-to-text is not configured. "
                "Set GROQ_API_KEY in backend/.env to enable transcription."
            ),
        )

    except STTProviderUnsupportedLanguageError as exc:
        lang_name = LANG_CODE_TO_NAME.get(exc.lang_code, exc.lang_code)
        logger.info("STT language not supported: %s", exc.lang_code)

        if exc.lang_code == "kru":
            msg = (
                "Kurukh (kru) speech-to-text is not currently supported. "
                "OpenAI Whisper (used via Groq) was not trained on Kurukh audio. "
                "There is no reliable Kurukh ASR model available in this integration. "
                "Kurukh STT support can be added when a suitable model becomes available. "
                "Hindi (hin) or English (eng) may be used in the meantime."
            )
        else:
            supported_names = sorted(
                LANG_CODE_TO_NAME[c]
                for c in STT_PROVIDER_SUPPORTED_LANGS
                if c in LANG_CODE_TO_NAME
            )
            msg = (
                f"The STT provider does not support {lang_name}. "
                f"Currently supported languages: {', '.join(supported_names)}."
            )

        return STTResponse(
            transcript="",
            language=language,
            method="unsupported_language",
            message=msg,
        )

    except STTTimeoutError as exc:
        logger.warning("STT timeout: %s", exc)
        return STTResponse(
            transcript="",
            language=language,
            method="timeout",
            message="The STT provider timed out. Please try again with a shorter audio clip.",
        )

    except STTProviderError as exc:
        logger.warning("STT provider error: %s", exc)
        # Propagate auth-failure hint in the message without exposing the key
        msg_lower = str(exc).lower()
        if "authentication" in msg_lower or "401" in msg_lower:
            message = "STT authentication failed. Check GROQ_API_KEY in backend/.env."
        else:
            message = "The STT provider encountered an error. Please try again."
        return STTResponse(
            transcript="",
            language=language,
            method="provider_error",
            message=message,
        )

    return STTResponse(
        transcript=result.text,
        language=language,
        detected_language=result.detected_language,
        method="stt",
        model=result.model,
        message=None,
    )
