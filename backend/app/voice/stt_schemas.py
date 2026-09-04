"""
Pydantic schemas for the Voice / STT API.

Endpoint:
    POST /api/v1/voice/stt

Audio is accepted as a multipart/form-data file upload — the simplest
FastAPI-native mechanism that works with any HTTP client and browser form.

Language support (VERIFIED against Groq/Whisper documentation):
    eng (English) → Whisper BCP-47 "en" — ✅ SUPPORTED
    hin (Hindi)   → Whisper BCP-47 "hi" — ✅ SUPPORTED
    kru (Kurukh)  → ❌ NOT SUPPORTED
                     OpenAI Whisper (and all Groq Whisper models) were not
                     trained on Kurukh.  There is no reliable Kurukh ASR
                     model available via any integrated provider.
                     Returns 'unsupported_language' rather than silent failure.

Accepted audio formats (MIME types checked at schema level):
    audio/mpeg   (mp3)
    audio/wav    (wav)
    audio/x-wav
    audio/mp4    (m4a)
    audio/ogg    (ogg)
    audio/webm   (webm — common from browser MediaRecorder)
    audio/flac   (flac)
"""

from __future__ import annotations

from pydantic import BaseModel, Field


# ── Language support registry ─────────────────────────────────────────────────

# All project language codes accepted by the API (for schema validation).
SUPPORTED_REQUEST_LANG_CODES: frozenset[str] = frozenset({"kru", "hin", "eng"})

# Languages actually transcribable by the current STT provider (Groq Whisper).
# Verified against Groq/OpenAI Whisper multilingual model documentation.
STT_PROVIDER_SUPPORTED_LANGS: frozenset[str] = frozenset({"hin", "eng"})

# Project ISO 639-3 code → BCP-47 tag used by Whisper.
LANG_CODE_TO_WHISPER_TAG: dict[str, str] = {
    "hin": "hi",
    "eng": "en",
}

# Human-readable language names for error messages.
LANG_CODE_TO_NAME: dict[str, str] = {
    "kru": "Kurukh",
    "hin": "Hindi",
    "eng": "English",
}

# Accepted audio MIME types.
ACCEPTED_AUDIO_MIME_TYPES: frozenset[str] = frozenset({
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/ogg",
    "audio/webm",
    "audio/flac",
    # Some clients send these content-types for the same formats:
    "audio/mp3",
    "audio/x-m4a",
    "video/webm",   # browser MediaRecorder sometimes uses this for webm audio
})

# Maximum accepted audio file size: 25 MB (Groq's documented limit).
STT_MAX_FILE_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB


# ── Response schema ───────────────────────────────────────────────────────────


class STTResponse(BaseModel):
    """Response for POST /api/v1/voice/stt."""

    transcript: str = Field(
        description=(
            "The transcribed text. "
            "Empty string when transcription was not possible."
        ),
    )
    language: str = Field(
        description="ISO 639-3 language code of the requested transcription language.",
    )
    detected_language: str | None = Field(
        default=None,
        description=(
            "BCP-47 language tag detected by the STT model, if provided by the provider. "
            "May differ from the requested language."
        ),
    )
    method: str = Field(
        description=(
            "'stt'                  — transcription succeeded. "
            "'unsupported_language' — language not supported by the STT provider. "
            "'not_configured'       — GROQ_API_KEY is not set. "
            "'invalid_audio'        — audio file is missing, empty, or too large. "
            "'unsupported_format'   — audio MIME type is not accepted. "
            "'provider_error'       — STT provider returned an error. "
            "'timeout'              — STT provider timed out."
        ),
    )
    provider: str = Field(
        default="groq_whisper",
        description="Identifier of the STT provider used.",
    )
    model: str | None = Field(
        default=None,
        description="STT model name used for transcription.",
    )
    message: str | None = Field(
        default=None,
        description="Human-readable note, especially when transcription was not possible.",
    )
