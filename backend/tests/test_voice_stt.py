"""
Tests for Step 14: Speech-to-Text Foundation.

Covers all 15 acceptance criteria:
    1.  Valid STT request accepted (correct language, audio bytes).
    2.  Missing audio returns invalid_audio.
    3.  Empty audio returns invalid_audio.
    4.  Invalid language code returns 422.
    5.  Unsupported language (kru) returns unsupported_language.
    6.  Invalid file type returns unsupported_format.
    7.  Provider invoked with correct args on supported language.
    8.  Successful transcription — method='stt', transcript present.
    9.  Provider authentication failure — method='provider_error' (no key leak).
    10. Provider/API failure — method='provider_error'.
    11. Timeout — method='timeout'.
    12. Existing translation tests unchanged.
    13. Existing RAG tests unchanged.
    14. Existing pedagogy tests unchanged.
    15. Existing TTS tests unchanged.

All STT tests use mocks — no real Groq API calls.
"""

from __future__ import annotations

import io
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.voice.stt_provider import (
    STTNotConfiguredError,
    STTProviderError,
    STTProviderUnsupportedLanguageError,
    STTTimeoutError,
    TranscriptionResult,
)
from app.voice.stt_schemas import (
    ACCEPTED_AUDIO_MIME_TYPES,
    STT_MAX_FILE_SIZE_BYTES,
    STT_PROVIDER_SUPPORTED_LANGS,
    SUPPORTED_REQUEST_LANG_CODES,
)

STT_PATH = "/api/v1/voice/stt"

# ── Minimal fake audio bytes (3 bytes — not a real audio file, just non-empty)
_FAKE_AUDIO = b"\xff\xfb\x90"
_FAKE_AUDIO_FILENAME = "test.mp3"
_FAKE_AUDIO_CONTENT_TYPE = "audio/mpeg"


# ── Shared client fixture ─────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def client() -> TestClient:
    from app.main import app as fastapi_app
    with TestClient(fastapi_app, raise_server_exceptions=False) as c:
        yield c


def _stt_files(audio: bytes = _FAKE_AUDIO,
               filename: str = _FAKE_AUDIO_FILENAME,
               content_type: str = _FAKE_AUDIO_CONTENT_TYPE):
    """Build multipart files dict for TestClient."""
    return {"audio": (filename, io.BytesIO(audio), content_type)}


def _stt_data(language: str = "eng"):
    return {"language": language}


def _fake_result(text: str = "Hello world") -> TranscriptionResult:
    return TranscriptionResult(text=text, detected_language="en", model="whisper-large-v3-turbo")


# ── 1. Valid request accepted ─────────────────────────────────────────────────

class TestValidSTTRequest:
    """Well-formed requests with supported languages must be accepted."""

    def test_status_endpoint_still_ready(self, client: TestClient) -> None:
        r = client.get("/api/v1/voice/status")
        assert r.status_code == 200
        assert r.json()["status"] == "ready"

    @pytest.mark.parametrize("lang", ["hin", "eng"])
    def test_supported_langs_in_schema_constants(self, lang: str) -> None:
        assert lang in SUPPORTED_REQUEST_LANG_CODES
        assert lang in STT_PROVIDER_SUPPORTED_LANGS

    @pytest.mark.parametrize("lang", ["hin", "eng"])
    def test_valid_request_returns_200(self, lang: str, client: TestClient) -> None:
        with patch(
            "app.voice.stt_service.transcribe_audio",
            new=AsyncMock(return_value=_fake_result("नमस्ते" if lang == "hin" else "Hello")),
        ):
            r = client.post(
                STT_PATH,
                files=_stt_files(),
                data=_stt_data(lang),
            )
        assert r.status_code == 200

    def test_response_schema_keys_present(self, client: TestClient) -> None:
        with patch(
            "app.voice.stt_service.transcribe_audio",
            new=AsyncMock(return_value=_fake_result()),
        ):
            r = client.post(STT_PATH, files=_stt_files(), data=_stt_data("eng"))
        body = r.json()
        required = {"transcript", "language", "method", "provider", "model",
                    "message", "detected_language"}
        assert required.issubset(body.keys())


# ── 2. Missing audio ──────────────────────────────────────────────────────────

class TestMissingAudio:
    """Requests without an audio file must be rejected."""

    def test_missing_audio_field_returns_422(self, client: TestClient) -> None:
        r = client.post(STT_PATH, data=_stt_data("eng"))
        assert r.status_code == 422

    def test_missing_language_field_returns_422(self, client: TestClient) -> None:
        r = client.post(STT_PATH, files=_stt_files())
        assert r.status_code == 422


# ── 3. Empty audio ────────────────────────────────────────────────────────────

class TestEmptyAudio:
    """Empty audio bytes must return method='invalid_audio'."""

    def test_empty_audio_returns_invalid_audio(self, client: TestClient) -> None:
        r = client.post(
            STT_PATH,
            files=_stt_files(audio=b""),
            data=_stt_data("eng"),
        )
        assert r.status_code == 200
        assert r.json()["method"] == "invalid_audio"

    def test_empty_audio_transcript_is_empty_string(self, client: TestClient) -> None:
        r = client.post(
            STT_PATH,
            files=_stt_files(audio=b""),
            data=_stt_data("eng"),
        )
        assert r.json()["transcript"] == ""


# ── 4. Invalid language code ──────────────────────────────────────────────────

class TestInvalidLanguageCode:
    """Unknown language codes must return 422."""

    @pytest.mark.parametrize("bad_lang", ["fr", "de", "ta", "zh", "xx"])
    def test_unknown_lang_returns_422(self, bad_lang: str, client: TestClient) -> None:
        r = client.post(
            STT_PATH,
            files=_stt_files(),
            data={"language": bad_lang},
        )
        assert r.status_code == 422

    def test_lang_constants_cover_three_codes(self) -> None:
        assert SUPPORTED_REQUEST_LANG_CODES == {"kru", "hin", "eng"}


# ── 5. Unsupported language (Kurukh) ─────────────────────────────────────────

class TestKurukhUnsupportedSTT:
    """kru must return unsupported_language — never silently proceed or fake support."""

    def test_kru_not_in_provider_supported_langs(self) -> None:
        assert "kru" not in STT_PROVIDER_SUPPORTED_LANGS

    def test_kru_in_request_schema_langs(self) -> None:
        assert "kru" in SUPPORTED_REQUEST_LANG_CODES

    def test_kru_returns_unsupported_language_method(self, client: TestClient) -> None:
        with patch(
            "app.voice.stt_service.transcribe_audio",
            new=AsyncMock(side_effect=STTProviderUnsupportedLanguageError("kru")),
        ):
            r = client.post(STT_PATH, files=_stt_files(), data=_stt_data("kru"))
        assert r.status_code == 200
        body = r.json()
        assert body["method"] == "unsupported_language"
        assert body["transcript"] == ""

    def test_kru_message_mentions_kurukh(self, client: TestClient) -> None:
        with patch(
            "app.voice.stt_service.transcribe_audio",
            new=AsyncMock(side_effect=STTProviderUnsupportedLanguageError("kru")),
        ):
            r = client.post(STT_PATH, files=_stt_files(), data=_stt_data("kru"))
        msg = r.json()["message"]
        assert "Kurukh" in msg or "kru" in msg.lower()

    def test_kru_message_mentions_whisper_training(self, client: TestClient) -> None:
        with patch(
            "app.voice.stt_service.transcribe_audio",
            new=AsyncMock(side_effect=STTProviderUnsupportedLanguageError("kru")),
        ):
            r = client.post(STT_PATH, files=_stt_files(), data=_stt_data("kru"))
        msg = r.json()["message"].lower()
        assert "whisper" in msg or "not supported" in msg or "no" in msg

    @pytest.mark.asyncio
    async def test_kru_returns_unsupported_in_service_layer(self) -> None:
        from app.voice.stt_service import speech_to_text
        with patch(
            "app.voice.stt_service.transcribe_audio",
            new=AsyncMock(side_effect=STTProviderUnsupportedLanguageError("kru")),
        ):
            response = await speech_to_text(b"\xff\xfb", "audio.mp3", "kru")
        assert response.method == "unsupported_language"
        assert response.transcript == ""


# ── 6. Invalid file type ──────────────────────────────────────────────────────

class TestInvalidFileType:
    """Non-audio MIME types must return method='unsupported_format'."""

    @pytest.mark.parametrize("bad_type", ["image/png", "text/plain", "application/pdf"])
    def test_non_audio_mime_returns_unsupported_format(
        self, bad_type: str, client: TestClient
    ) -> None:
        r = client.post(
            STT_PATH,
            files=_stt_files(content_type=bad_type),
            data=_stt_data("eng"),
        )
        assert r.status_code == 200
        assert r.json()["method"] == "unsupported_format"

    def test_accepted_mime_types_are_audio(self) -> None:
        for mime in ACCEPTED_AUDIO_MIME_TYPES:
            assert "audio" in mime or "video/webm" == mime, \
                f"Unexpected non-audio MIME in accepted set: {mime}"


# ── 7. Provider invoked with correct args ────────────────────────────────────

class TestProviderInvokedCorrectly:
    """transcribe_audio must be called with correct audio bytes, filename, and lang."""

    @pytest.mark.asyncio
    async def test_transcribe_audio_called_with_correct_args(self) -> None:
        from app.voice.stt_service import speech_to_text

        captured: list[tuple] = []

        async def fake_transcribe(audio_bytes, filename, language):
            captured.append((audio_bytes, filename, language))
            return _fake_result("Hello")

        with patch("app.voice.stt_service.transcribe_audio", new=fake_transcribe):
            await speech_to_text(b"\xff\xfb\x90", "test.mp3", "eng")

        assert len(captured) == 1
        assert captured[0][0] == b"\xff\xfb\x90"
        assert captured[0][1] == "test.mp3"
        assert captured[0][2] == "eng"

    @pytest.mark.asyncio
    async def test_transcribe_audio_called_for_hindi(self) -> None:
        from app.voice.stt_service import speech_to_text

        captured: list[str] = []

        async def fake_transcribe(audio_bytes, filename, language):
            captured.append(language)
            return _fake_result("नमस्ते")

        with patch("app.voice.stt_service.transcribe_audio", new=fake_transcribe):
            await speech_to_text(b"\xff\xfb\x90", "hindi.wav", "hin")

        assert captured == ["hin"]


# ── 8. Successful transcription ───────────────────────────────────────────────

class TestSuccessfulTranscription:
    """method='stt' with non-empty transcript must be returned on success."""

    @pytest.mark.asyncio
    @pytest.mark.parametrize("lang,text", [("eng", "Hello world"), ("hin", "नमस्ते दुनिया")])
    async def test_method_stt_on_success(self, lang: str, text: str) -> None:
        from app.voice.stt_service import speech_to_text

        with patch(
            "app.voice.stt_service.transcribe_audio",
            new=AsyncMock(return_value=_fake_result(text)),
        ):
            response = await speech_to_text(b"\xff\xfb\x90", "audio.mp3", lang)

        assert response.method == "stt"
        assert response.transcript == text
        assert response.language == lang

    def test_successful_response_via_http(self, client: TestClient) -> None:
        with patch(
            "app.voice.stt_service.transcribe_audio",
            new=AsyncMock(return_value=_fake_result("Hello world")),
        ):
            r = client.post(STT_PATH, files=_stt_files(), data=_stt_data("eng"))
        body = r.json()
        assert body["method"] == "stt"
        assert body["transcript"] == "Hello world"
        assert body["language"] == "eng"

    def test_model_name_in_response(self, client: TestClient) -> None:
        with patch(
            "app.voice.stt_service.transcribe_audio",
            new=AsyncMock(return_value=_fake_result("Hi")),
        ):
            r = client.post(STT_PATH, files=_stt_files(), data=_stt_data("eng"))
        assert r.json()["model"] == "whisper-large-v3-turbo"


# ── 9. Provider authentication failure ───────────────────────────────────────

class TestAuthFailure:
    """401/auth errors must return method='provider_error' — key never exposed."""

    @pytest.mark.asyncio
    async def test_auth_error_returns_provider_error(self) -> None:
        from app.voice.stt_service import speech_to_text

        with patch(
            "app.voice.stt_service.transcribe_audio",
            new=AsyncMock(side_effect=STTProviderError("STT authentication failed. Check GROQ_API_KEY.")),
        ):
            response = await speech_to_text(b"\xff\xfb", "a.mp3", "eng")

        assert response.method == "provider_error"
        assert response.transcript == ""

    @pytest.mark.asyncio
    async def test_auth_error_message_does_not_contain_key_value(self) -> None:
        from app.voice.stt_service import speech_to_text

        with patch(
            "app.voice.stt_service.transcribe_audio",
            new=AsyncMock(side_effect=STTProviderError("STT authentication failed. Check GROQ_API_KEY.")),
        ):
            response = await speech_to_text(b"\xff\xfb", "a.mp3", "eng")

        # The message may mention 'GROQ_API_KEY' as a config hint, but must not contain a real key value
        # A real key starts with "gsk_" — ensure that pattern is not present
        assert "gsk_" not in (response.message or "")

    def test_not_configured_returns_not_configured_method(self, client: TestClient) -> None:
        with patch(
            "app.voice.stt_service.transcribe_audio",
            new=AsyncMock(side_effect=STTNotConfiguredError("no key")),
        ):
            r = client.post(STT_PATH, files=_stt_files(), data=_stt_data("eng"))
        body = r.json()
        assert body["method"] == "not_configured"
        assert body["transcript"] == ""


# ── 10. Provider/API failure ──────────────────────────────────────────────────

class TestProviderFailure:
    """Generic provider errors must return method='provider_error', not 500."""

    @pytest.mark.asyncio
    async def test_provider_error_returns_provider_error_method(self) -> None:
        from app.voice.stt_service import speech_to_text

        with patch(
            "app.voice.stt_service.transcribe_audio",
            new=AsyncMock(side_effect=STTProviderError("HTTP 503")),
        ):
            response = await speech_to_text(b"\xff\xfb", "a.mp3", "eng")

        assert response.method == "provider_error"

    def test_provider_error_returns_200_not_500_via_http(self, client: TestClient) -> None:
        with patch(
            "app.voice.stt_service.transcribe_audio",
            new=AsyncMock(side_effect=STTProviderError("connection failed")),
        ):
            r = client.post(STT_PATH, files=_stt_files(), data=_stt_data("eng"))
        assert r.status_code == 200
        assert r.json()["method"] == "provider_error"


# ── 11. Timeout ───────────────────────────────────────────────────────────────

class TestTimeoutHandling:
    """STT timeouts must return method='timeout', not 500."""

    @pytest.mark.asyncio
    async def test_timeout_returns_timeout_method(self) -> None:
        from app.voice.stt_service import speech_to_text

        with patch(
            "app.voice.stt_service.transcribe_audio",
            new=AsyncMock(side_effect=STTTimeoutError("timed out")),
        ):
            response = await speech_to_text(b"\xff\xfb", "a.mp3", "eng")

        assert response.method == "timeout"
        assert response.transcript == ""

    def test_timeout_returns_200_not_500_via_http(self, client: TestClient) -> None:
        with patch(
            "app.voice.stt_service.transcribe_audio",
            new=AsyncMock(side_effect=STTTimeoutError("timed out")),
        ):
            r = client.post(STT_PATH, files=_stt_files(), data=_stt_data("eng"))
        assert r.status_code == 200
        assert r.json()["method"] == "timeout"

    def test_timeout_message_is_helpful(self, client: TestClient) -> None:
        with patch(
            "app.voice.stt_service.transcribe_audio",
            new=AsyncMock(side_effect=STTTimeoutError("timed out")),
        ):
            r = client.post(STT_PATH, files=_stt_files(), data=_stt_data("eng"))
        msg = r.json().get("message", "")
        assert msg  # not empty


# ── 12. Translation pipeline unchanged ───────────────────────────────────────

class TestTranslationUnchangedStep14:
    def test_translation_status_200(self, client: TestClient) -> None:
        r = client.get("/api/v1/translation/status")
        assert r.status_code == 200
        assert r.json()["status"] == "ready"

    def test_translation_same_lang_invalid_request(self, client: TestClient) -> None:
        r = client.post(
            "/api/v1/translation/translate",
            json={"text": "water", "source_language": "eng", "target_language": "eng"},
        )
        assert r.status_code == 200
        assert r.json()["method"] == "invalid_request"


# ── 13. RAG pipeline unchanged ────────────────────────────────────────────────

class TestRAGUnchangedStep14:
    def test_qa_status_200(self, client: TestClient) -> None:
        r = client.get("/api/v1/qa/status")
        assert r.status_code == 200
        assert r.json()["status"] == "ready"

    def test_qa_missing_body_422(self, client: TestClient) -> None:
        r = client.post("/api/v1/qa/ask")
        assert r.status_code == 422


# ── 14. Pedagogy unchanged ────────────────────────────────────────────────────

class TestPedagogyUnchangedStep14:
    def test_five_education_levels_still_exist(self) -> None:
        from app.schemas.qa import SUPPORTED_EDUCATION_LEVELS
        assert SUPPORTED_EDUCATION_LEVELS == {
            "primary", "secondary", "higher_secondary", "college", "professional",
        }

    def test_primary_prompt_still_correct(self) -> None:
        from app.rag.prompt_builder import get_level_guidance
        assert "simple" in get_level_guidance("primary").lower()


# ── 15. TTS unchanged ────────────────────────────────────────────────────────

class TestTTSUnchangedStep14:
    def test_tts_status_still_ready(self, client: TestClient) -> None:
        r = client.get("/api/v1/voice/status")
        assert r.status_code == 200

    def test_tts_kru_still_returns_unsupported(self, client: TestClient) -> None:
        from app.voice.tts_provider import TTSProviderUnsupportedLanguageError
        with patch(
            "app.voice.tts_service.synthesise_speech",
            new=AsyncMock(side_effect=TTSProviderUnsupportedLanguageError("kru")),
        ):
            r = client.post("/api/v1/voice/tts", json={"text": "test", "language": "kru"})
        assert r.status_code == 200
        assert r.json()["method"] == "unsupported_language"

    def test_tts_provider_supported_langs_unchanged(self) -> None:
        from app.voice.tts_schemas import TTS_PROVIDER_SUPPORTED_LANGS
        assert "hin" in TTS_PROVIDER_SUPPORTED_LANGS
        assert "eng" in TTS_PROVIDER_SUPPORTED_LANGS
        assert "kru" not in TTS_PROVIDER_SUPPORTED_LANGS
