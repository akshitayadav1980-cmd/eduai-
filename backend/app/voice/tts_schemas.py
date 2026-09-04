"""
Pydantic schemas for the Voice / TTS API.

Endpoint:
    POST /api/v1/voice/tts

Supported languages are those for which the configured TTS provider
explicitly provides audio synthesis support.  Kurukh (kru) is currently
NOT supported by any integrated TTS provider and returns a clear
'unsupported_language' response rather than silently substituting another
language or fabricating audio.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


# ── Language support registry ─────────────────────────────────────────────────

# Languages accepted by the TTS request schema (project-level codes).
SUPPORTED_REQUEST_LANG_CODES: frozenset[str] = frozenset({"kru", "hin", "eng"})

# Languages actually synthesisable by the current TTS provider.
# Kurukh is honestly declared as NOT supported.
TTS_PROVIDER_SUPPORTED_LANGS: frozenset[str] = frozenset({"hin", "eng"})

# Project code → BCP-47 tag used by the TTS provider HTTP API.
LANG_CODE_TO_BCP47: dict[str, str] = {
    "hin": "hi",
    "eng": "en",
}

# Human-readable names for error messages.
LANG_CODE_TO_NAME: dict[str, str] = {
    "kru": "Kurukh",
    "hin": "Hindi",
    "eng": "English",
}

# Maximum text length accepted by the TTS endpoint (characters).
TTS_MAX_TEXT_LENGTH: int = 500


# ── Request ───────────────────────────────────────────────────────────────────


class TTSRequest(BaseModel):
    """
    Body for POST /api/v1/voice/tts.

    Fields:
        text:     The text to synthesise into speech.
        language: ISO 639-3 code of the language to synthesise.
                  Must be one of: kru (Kurukh), hin (Hindi), eng (English).
                  Note: kru is accepted by the schema but returns
                  'unsupported_language' because no TTS provider currently
                  supports Kurukh.  This is intentional — not a bug.
    """

    text: str = Field(
        ...,
        description=(
            "The text to synthesise into speech. "
            f"Maximum {TTS_MAX_TEXT_LENGTH} characters."
        ),
        examples=["नमस्ते, कैसे हैं आप?", "Hello, how are you?"],
    )
    language: str = Field(
        ...,
        description=(
            "ISO 639-3 language code. "
            "Supported for synthesis: hin (Hindi), eng (English). "
            "kru (Kurukh) is accepted but currently returns unsupported_language."
        ),
        examples=["hin", "eng"],
    )

    @field_validator("text")
    @classmethod
    def text_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("text must not be empty or whitespace-only.")
        if len(v) > TTS_MAX_TEXT_LENGTH:
            raise ValueError(
                f"text exceeds maximum length of {TTS_MAX_TEXT_LENGTH} characters "
                f"(received {len(v)})."
            )
        return v

    @field_validator("language")
    @classmethod
    def language_must_be_supported(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in SUPPORTED_REQUEST_LANG_CODES:
            raise ValueError(
                f"language '{v}' is not a valid project language code. "
                f"Accepted codes: {sorted(SUPPORTED_REQUEST_LANG_CODES)}."
            )
        return v


# ── Response ──────────────────────────────────────────────────────────────────


class TTSResponse(BaseModel):
    """Response for POST /api/v1/voice/tts."""

    text: str = Field(description="The original text that was synthesised (trimmed).")
    language: str = Field(description="ISO 639-3 language code of the synthesised speech.")
    method: str = Field(
        description=(
            "'tts'                  — audio synthesised successfully. "
            "'unsupported_language' — the TTS provider does not support this language. "
            "'not_configured'       — TTS_API_URL is not set in .env. "
            "'provider_error'       — the TTS provider returned an error."
        )
    )
    audio_base64: str | None = Field(
        default=None,
        description=(
            "Base64-encoded audio bytes (audio/mpeg). "
            "Present only when method='tts'. "
            "Decode and play directly in the frontend."
        ),
    )
    audio_format: str | None = Field(
        default=None,
        description="MIME type of the audio data, e.g. 'audio/mpeg'.",
    )
    message: str | None = Field(
        default=None,
        description="Human-readable note, especially when synthesis was not possible.",
    )
    provider: str = Field(
        default="http_tts",
        description="Identifier of the TTS provider used.",
    )
