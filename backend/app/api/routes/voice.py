"""
Voice router — /api/v1/voice

Endpoints:
    GET  /api/v1/voice/status   — module health check (no provider required)
    POST /api/v1/voice/tts      — text-to-speech synthesis (Step 13)
    POST /api/v1/voice/stt      — speech-to-text transcription (Step 14)

Planned future endpoints:
    POST /api/v1/voice/pronunciation — pronunciation evaluation
"""

from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.voice.stt_schemas import (
    ACCEPTED_AUDIO_MIME_TYPES,
    STT_MAX_FILE_SIZE_BYTES,
    SUPPORTED_REQUEST_LANG_CODES,
    STTResponse,
)
from app.voice.stt_service import speech_to_text
from app.voice.tts_schemas import TTSRequest, TTSResponse
from app.voice.tts_service import text_to_speech

router = APIRouter(prefix="/voice", tags=["Voice"])

MODULE_NAME = "voice"


# ── Status ────────────────────────────────────────────────────────────────────


@router.get(
    "/status",
    summary="Voice module status",
    response_description="Confirms the voice module is reachable.",
)
def voice_status() -> dict[str, str]:
    """Architecture verification endpoint for the voice module."""
    return {"module": MODULE_NAME, "status": "ready"}


# ── TTS ───────────────────────────────────────────────────────────────────────


@router.post(
    "/tts",
    response_model=TTSResponse,
    status_code=status.HTTP_200_OK,
    summary="Synthesise text to speech",
    response_description="Base64-encoded audio (audio/mpeg) or a descriptive error response.",
)
async def tts(request: TTSRequest) -> TTSResponse:
    """
    Convert text to speech using the configured TTS provider.

    **Supported language codes** (`language`):
    | Code  | Language | TTS Support |
    |-------|----------|-------------|
    | `hin` | Hindi    | ✅ Supported |
    | `eng` | English  | ✅ Supported |
    | `kru` | Kurukh   | ❌ Not supported — no provider currently supports Kurukh |

    Kurukh (`kru`) is accepted by the API schema so the frontend can send it
    and receive an honest `unsupported_language` response rather than a
    confusing HTTP error.

    **Response `method` values:**
    - `tts`                  — audio synthesised; `audio_base64` is populated
    - `unsupported_language` — language not supported by the current provider
    - `not_configured`       — `TTS_API_URL` not set in backend/.env
    - `provider_error`       — TTS provider HTTP call failed

    **Audio format:** `audio/mpeg` (MP3), base64-encoded in `audio_base64`.

    To configure TTS, add to `backend/.env`:
    ```
    TTS_API_URL=http://your-tts-server/synthesise
    ```

    **Example request:**
    ```json
    { "text": "नमस्ते", "language": "hin" }
    ```
    """
    return await text_to_speech(text=request.text, language=request.language)


# ── STT ───────────────────────────────────────────────────────────────────────


@router.post(
    "/stt",
    response_model=STTResponse,
    status_code=status.HTTP_200_OK,
    summary="Transcribe speech to text",
    response_description="Transcript text or a descriptive error response.",
)
async def stt(
    audio: UploadFile = File(..., description="Audio file to transcribe."),
    language: str = Form(..., description="ISO 639-3 language code: hin, eng, or kru."),
) -> STTResponse:
    """
    Transcribe an audio file to text using Groq Whisper.

    **Request format:** `multipart/form-data`
    - `audio` — audio file (mp3, wav, m4a, ogg, webm, flac)
    - `language` — ISO 639-3 language code

    **Language support (Groq Whisper — verified):**
    | Code  | Language | STT Support |
    |-------|----------|-------------|
    | `hin` | Hindi    | ✅ Supported |
    | `eng` | English  | ✅ Supported |
    | `kru` | Kurukh   | ❌ Not supported — Whisper has no Kurukh training data |

    Kurukh (`kru`) is accepted so the frontend receives a clear
    `unsupported_language` response with guidance, not a confusing HTTP error.

    **Response `method` values:**
    - `stt`                  — transcription succeeded; `transcript` is populated
    - `unsupported_language` — language not supported by Whisper
    - `not_configured`       — `GROQ_API_KEY` not set in backend/.env
    - `invalid_audio`        — audio missing, empty, or exceeds 25 MB
    - `unsupported_format`   — audio MIME type not accepted
    - `provider_error`       — Groq API returned an error (incl. auth failure)
    - `timeout`              — Groq API timed out

    **Configuration:** uses the existing `GROQ_API_KEY` from backend/.env.
    Optionally override the model with `GROQ_STT_MODEL` (default: `whisper-large-v3-turbo`).
    """
    # ── Validate language code ─────────────────────────────────────────────────
    lang = language.strip().lower()
    if lang not in SUPPORTED_REQUEST_LANG_CODES:
        raise HTTPException(
            status_code=422,
            detail=(
                f"language '{lang}' is not a valid project language code. "
                f"Accepted codes: {sorted(SUPPORTED_REQUEST_LANG_CODES)}."
            ),
        )

    # ── Validate audio presence ────────────────────────────────────────────────
    if audio.filename is None or audio.filename == "":
        return STTResponse(
            transcript="",
            language=lang,
            method="invalid_audio",
            message="No audio file was provided.",
        )

    # ── Validate MIME type ─────────────────────────────────────────────────────
    content_type = (audio.content_type or "").lower()
    if content_type and content_type not in ACCEPTED_AUDIO_MIME_TYPES:
        return STTResponse(
            transcript="",
            language=lang,
            method="unsupported_format",
            message=(
                f"Audio format '{content_type}' is not supported. "
                f"Accepted types: {sorted(ACCEPTED_AUDIO_MIME_TYPES)}."
            ),
        )

    # ── Read audio bytes ───────────────────────────────────────────────────────
    audio_bytes = await audio.read()

    if not audio_bytes:
        return STTResponse(
            transcript="",
            language=lang,
            method="invalid_audio",
            message="The uploaded audio file is empty.",
        )

    if len(audio_bytes) > STT_MAX_FILE_SIZE_BYTES:
        max_mb = STT_MAX_FILE_SIZE_BYTES // (1024 * 1024)
        return STTResponse(
            transcript="",
            language=lang,
            method="invalid_audio",
            message=f"Audio file exceeds maximum size of {max_mb} MB.",
        )

    # ── Transcribe ─────────────────────────────────────────────────────────────
    return await speech_to_text(
        audio_bytes=audio_bytes,
        filename=audio.filename or "audio.mp3",
        language=lang,
    )

