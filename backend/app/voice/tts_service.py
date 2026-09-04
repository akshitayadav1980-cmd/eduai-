"""
TTS service — orchestrates the text-to-speech pipeline.

Pipeline:
    text + language
        → check language support
        → call TTS provider
        → return TTSResponse

The TTS provider is isolated in app/voice/tts_provider.py.
This service layer handles all error translation into clean TTSResponse values,
matching the pattern established by the translation and RAG services.
"""

from __future__ import annotations

import logging

from app.voice.tts_provider import (
    TTSNotConfiguredError,
    TTSProviderError,
    TTSProviderUnsupportedLanguageError,
    synthesise_speech,
)
from app.voice.tts_schemas import (
    LANG_CODE_TO_NAME,
    TTS_PROVIDER_SUPPORTED_LANGS,
    TTSResponse,
)

logger = logging.getLogger(__name__)


async def text_to_speech(text: str, language: str) -> TTSResponse:
    """
    Synthesise *text* in *language* and return a TTSResponse.

    Args:
        text:     Trimmed, validated text (≤ TTS_MAX_TEXT_LENGTH chars).
        language: ISO 639-3 language code, pre-validated by the schema.

    Returns:
        TTSResponse — method='tts' on success, descriptive method on failure.
    """
    try:
        audio_b64 = await synthesise_speech(text=text, language=language)

    except TTSNotConfiguredError:
        logger.info("TTS not configured; returning not_configured for language=%s", language)
        return TTSResponse(
            text=text,
            language=language,
            method="not_configured",
            message=(
                "Text-to-speech is not configured. "
                "Set TTS_API_URL in backend/.env to enable speech synthesis."
            ),
        )

    except TTSProviderUnsupportedLanguageError as exc:
        lang_name = LANG_CODE_TO_NAME.get(exc.lang_code, exc.lang_code)
        logger.info("TTS language not supported: %s", exc.lang_code)

        # Special guidance for Kurukh — be explicit about the situation.
        if exc.lang_code == "kru":
            msg = (
                "Kurukh (kru) text-to-speech is not currently supported. "
                "No TTS provider in this integration supports Kurukh. "
                "Kurukh support can be added when a suitable model becomes available. "
                "Hindi (hin) or English (eng) may be used in the meantime."
            )
        else:
            supported_names = sorted(
                LANG_CODE_TO_NAME[c]
                for c in TTS_PROVIDER_SUPPORTED_LANGS
                if c in LANG_CODE_TO_NAME
            )
            msg = (
                f"The TTS provider does not support {lang_name}. "
                f"Currently supported languages: {', '.join(supported_names)}."
            )

        return TTSResponse(
            text=text,
            language=language,
            method="unsupported_language",
            message=msg,
        )

    except TTSProviderError as exc:
        logger.warning("TTS provider error: %s", exc)
        return TTSResponse(
            text=text,
            language=language,
            method="provider_error",
            message="The TTS provider encountered an error. Please try again.",
        )

    return TTSResponse(
        text=text,
        language=language,
        method="tts",
        audio_base64=audio_b64,
        audio_format="audio/mpeg",
        message=None,
    )
