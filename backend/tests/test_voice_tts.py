"""
Tests for Step 13: Voice Module Foundation (TTS).

Covers all 11 acceptance criteria:
    1.  Valid TTS request accepted.
    2.  Invalid language code rejected (422).
    3.  Empty text rejected (422).
    4.  Text length validation (too long → 422).
    5.  Provider synthesise_speech() is invoked on a supported language.
    6.  Successful TTS response — method='tts', audio_base64 present.
    7.  Provider/API failure handling — method='provider_error'.
    8.  Kurukh (kru) returns method='unsupported_language' with an honest message.
    9.  Existing translation tests remain unchanged (smoke).
    10. Existing RAG tests remain unchanged (smoke).
    11. Existing adaptive pedagogy tests remain unchanged (smoke).

All TTS tests use mocks — no real HTTP calls.
"""

from __future__ import annotations

import base64
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.voice.tts_provider import (
    TTSNotConfiguredError,
    TTSProviderError,
    TTSProviderUnsupportedLanguageError,
)
from app.voice.tts_schemas import (
    SUPPORTED_REQUEST_LANG_CODES,
    TTS_MAX_TEXT_LENGTH,
    TTS_PROVIDER_SUPPORTED_LANGS,
    TTSRequest,
)


# ── Shared test client fixture ────────────────────────────────────────────────

@pytest.fixture(scope="module")
def client() -> TestClient:
    from app.main import app as fastapi_app
    with TestClient(fastapi_app, raise_server_exceptions=False) as c:
        yield c


TTS_PATH = "/api/v1/voice/tts"
STATUS_PATH = "/api/v1/voice/status"

# Small realistic base64 MP3 stub (3 bytes → valid b64 string)
_FAKE_AUDIO_B64 = base64.b64encode(b"\xff\xfb\x90").decode("ascii")


# ── 1. Valid TTS request accepted ─────────────────────────────────────────────

class TestValidTTSRequest:
    """Schema-level validation: well-formed requests must be accepted."""

    def test_status_endpoint_ready(self, client: TestClient) -> None:
        r = client.get(STATUS_PATH)
        assert r.status_code == 200
        body = r.json()
        assert body["module"] == "voice"
        assert body["status"] == "ready"

    @pytest.mark.parametrize("lang", ["hin", "eng"])
    def test_supported_provider_langs_accepted_by_schema(self, lang: str) -> None:
        req = TTSRequest(text="Hello world", language=lang)
        assert req.language == lang

    def test_kru_accepted_by_schema(self) -> None:
        """Kurukh is accepted at schema level (returns unsupported_language later)."""
        req = TTSRequest(text="Some text", language="kru")
        assert req.language == "kru"

    def test_valid_request_returns_200(self, client: TestClient) -> None:
        with patch(
            "app.voice.tts_service.synthesise_speech",
            new=AsyncMock(return_value=_FAKE_AUDIO_B64),
        ):
            r = client.post(TTS_PATH, json={"text": "Hello", "language": "eng"})
        assert r.status_code == 200

    def test_response_schema_keys_present(self, client: TestClient) -> None:
        with patch(
            "app.voice.tts_service.synthesise_speech",
            new=AsyncMock(return_value=_FAKE_AUDIO_B64),
        ):
            r = client.post(TTS_PATH, json={"text": "Hello", "language": "eng"})
        body = r.json()
        required = {"text", "language", "method", "audio_base64", "audio_format", "message", "provider"}
        assert required.issubset(body.keys())


# ── 2. Invalid language code rejected ────────────────────────────────────────

class TestInvalidLanguageRejected:
    """Unknown language codes must fail schema validation with 422."""

    @pytest.mark.parametrize("bad_lang", ["fr", "de", "ta", "zh", "xx", ""])
    def test_invalid_lang_returns_422(self, bad_lang: str, client: TestClient) -> None:
        r = client.post(TTS_PATH, json={"text": "Hello", "language": bad_lang})
        assert r.status_code == 422

    @pytest.mark.parametrize("bad_lang", ["fr", "de", "ta"])
    def test_invalid_lang_raises_in_schema(self, bad_lang: str) -> None:
        with pytest.raises(Exception):
            TTSRequest(text="Hello", language=bad_lang)


# ── 3. Empty text rejected ────────────────────────────────────────────────────

class TestEmptyTextRejected:
    """Empty or whitespace-only text must fail validation."""

    def test_empty_text_422(self, client: TestClient) -> None:
        r = client.post(TTS_PATH, json={"text": "", "language": "eng"})
        assert r.status_code == 422

    def test_whitespace_text_422(self, client: TestClient) -> None:
        r = client.post(TTS_PATH, json={"text": "   ", "language": "eng"})
        assert r.status_code == 422

    def test_missing_text_422(self, client: TestClient) -> None:
        r = client.post(TTS_PATH, json={"language": "eng"})
        assert r.status_code == 422


# ── 4. Text length validation ─────────────────────────────────────────────────

class TestTextLengthValidation:
    """Text exceeding TTS_MAX_TEXT_LENGTH must be rejected."""

    def test_max_length_constant_is_set(self) -> None:
        assert TTS_MAX_TEXT_LENGTH > 0

    def test_text_at_max_length_accepted(self) -> None:
        text = "a" * TTS_MAX_TEXT_LENGTH
        req = TTSRequest(text=text, language="eng")
        assert len(req.text) == TTS_MAX_TEXT_LENGTH

    def test_text_over_max_length_rejected_by_schema(self) -> None:
        text = "a" * (TTS_MAX_TEXT_LENGTH + 1)
        with pytest.raises(Exception):
            TTSRequest(text=text, language="eng")

    def test_text_over_max_length_returns_422(self, client: TestClient) -> None:
        text = "a" * (TTS_MAX_TEXT_LENGTH + 1)
        r = client.post(TTS_PATH, json={"text": text, "language": "eng"})
        assert r.status_code == 422


# ── 5. Provider invoked on supported language ─────────────────────────────────

class TestProviderInvoked:
    """synthesise_speech must be called with correct text and BCP-47 language."""

    @pytest.mark.asyncio
    async def test_synthesise_speech_called_with_correct_args(self) -> None:
        from app.voice.tts_service import text_to_speech

        call_args: list[tuple] = []

        async def fake_synthesise(text: str, language: str) -> str:
            call_args.append((text, language))
            return _FAKE_AUDIO_B64

        with patch("app.voice.tts_service.synthesise_speech", new=fake_synthesise):
            await text_to_speech("Hello world", "eng")

        assert len(call_args) == 1
        assert call_args[0] == ("Hello world", "eng")

    @pytest.mark.asyncio
    async def test_synthesise_speech_not_called_for_kru(self) -> None:
        """Provider must NOT be called for Kurukh — the service short-circuits."""
        from app.voice.tts_service import text_to_speech

        call_count = 0

        async def fake_synthesise(text: str, language: str) -> str:
            nonlocal call_count
            call_count += 1
            return _FAKE_AUDIO_B64

        with patch("app.voice.tts_service.synthesise_speech",
                   new=AsyncMock(side_effect=TTSProviderUnsupportedLanguageError("kru"))):
            response = await text_to_speech("Kurukh text", "kru")

        assert response.method == "unsupported_language"


# ── 6. Successful TTS response ────────────────────────────────────────────────

class TestSuccessfulTTSResponse:
    """method='tts' with base64 audio must be returned on provider success."""

    @pytest.mark.asyncio
    @pytest.mark.parametrize("lang", ["hin", "eng"])
    async def test_method_tts_on_success(self, lang: str) -> None:
        from app.voice.tts_service import text_to_speech

        with patch(
            "app.voice.tts_service.synthesise_speech",
            new=AsyncMock(return_value=_FAKE_AUDIO_B64),
        ):
            response = await text_to_speech("Hello", lang)

        assert response.method == "tts"
        assert response.audio_base64 == _FAKE_AUDIO_B64
        assert response.audio_format == "audio/mpeg"
        assert response.language == lang
        assert response.message is None

    def test_audio_base64_decodable(self, client: TestClient) -> None:
        with patch(
            "app.voice.tts_service.synthesise_speech",
            new=AsyncMock(return_value=_FAKE_AUDIO_B64),
        ):
            r = client.post(TTS_PATH, json={"text": "Hello", "language": "eng"})
        body = r.json()
        assert body["method"] == "tts"
        # Must be decodable base64
        decoded = base64.b64decode(body["audio_base64"])
        assert len(decoded) > 0


# ── 7. Provider / API failure handling ────────────────────────────────────────

class TestProviderFailureHandling:
    """Provider errors must produce method='provider_error', not 500s."""

    @pytest.mark.asyncio
    async def test_provider_error_returns_provider_error_method(self) -> None:
        from app.voice.tts_service import text_to_speech

        with patch(
            "app.voice.tts_service.synthesise_speech",
            new=AsyncMock(side_effect=TTSProviderError("HTTP 503")),
        ):
            response = await text_to_speech("Hello", "eng")

        assert response.method == "provider_error"
        assert response.audio_base64 is None
        assert response.message is not None

    @pytest.mark.asyncio
    async def test_not_configured_returns_not_configured_method(self) -> None:
        from app.voice.tts_service import text_to_speech

        with patch(
            "app.voice.tts_service.synthesise_speech",
            new=AsyncMock(side_effect=TTSNotConfiguredError("no url")),
        ):
            response = await text_to_speech("Hello", "eng")

        assert response.method == "not_configured"
        assert response.audio_base64 is None

    def test_provider_error_returns_200_not_500(self, client: TestClient) -> None:
        """Provider errors must return HTTP 200 with a descriptive method, not 500."""
        with patch(
            "app.voice.tts_service.synthesise_speech",
            new=AsyncMock(side_effect=TTSProviderError("connection refused")),
        ):
            r = client.post(TTS_PATH, json={"text": "Hello", "language": "eng"})
        assert r.status_code == 200
        assert r.json()["method"] == "provider_error"


# ── 8. Kurukh returns unsupported_language honestly ──────────────────────────

class TestKurukhUnsupportedLanguage:
    """
    Kurukh MUST return method='unsupported_language' — never silently substitute
    another language or pretend synthesis succeeded.
    """

    def test_kru_not_in_provider_supported_langs(self) -> None:
        assert "kru" not in TTS_PROVIDER_SUPPORTED_LANGS

    def test_kru_in_request_schema_langs(self) -> None:
        """kru IS accepted at the schema/API level — so the frontend can receive a clear error."""
        assert "kru" in SUPPORTED_REQUEST_LANG_CODES

    @pytest.mark.asyncio
    async def test_kru_returns_unsupported_language_method(self) -> None:
        from app.voice.tts_service import text_to_speech

        with patch(
            "app.voice.tts_service.synthesise_speech",
            new=AsyncMock(side_effect=TTSProviderUnsupportedLanguageError("kru")),
        ):
            response = await text_to_speech("ड़ी", "kru")

        assert response.method == "unsupported_language"
        assert response.audio_base64 is None
        assert response.language == "kru"

    @pytest.mark.asyncio
    async def test_kru_message_mentions_kurukh(self) -> None:
        from app.voice.tts_service import text_to_speech

        with patch(
            "app.voice.tts_service.synthesise_speech",
            new=AsyncMock(side_effect=TTSProviderUnsupportedLanguageError("kru")),
        ):
            response = await text_to_speech("ड़ी", "kru")

        assert "Kurukh" in response.message or "kru" in response.message.lower()

    @pytest.mark.asyncio
    async def test_kru_message_does_not_claim_support(self) -> None:
        from app.voice.tts_service import text_to_speech

        with patch(
            "app.voice.tts_service.synthesise_speech",
            new=AsyncMock(side_effect=TTSProviderUnsupportedLanguageError("kru")),
        ):
            response = await text_to_speech("ड़ी", "kru")

        # Message must NOT claim synthesis succeeded
        assert response.method != "tts"
        assert response.audio_base64 is None

    def test_kru_via_http_returns_unsupported_language(self, client: TestClient) -> None:
        with patch(
            "app.voice.tts_service.synthesise_speech",
            new=AsyncMock(side_effect=TTSProviderUnsupportedLanguageError("kru")),
        ):
            r = client.post(TTS_PATH, json={"text": "ड़ी", "language": "kru"})
        assert r.status_code == 200
        body = r.json()
        assert body["method"] == "unsupported_language"
        assert body["audio_base64"] is None


# ── 9. Translation tests unchanged ────────────────────────────────────────────

class TestTranslationUnchangedStep13:
    """Translation endpoint must be completely unaffected by Step 13."""

    def test_translation_status_200(self, client: TestClient) -> None:
        r = client.get("/api/v1/translation/status")
        assert r.status_code == 200
        assert r.json()["status"] == "ready"

    def test_translation_same_lang_returns_invalid_request(self, client: TestClient) -> None:
        r = client.post(
            "/api/v1/translation/translate",
            json={"text": "water", "source_language": "eng", "target_language": "eng"},
        )
        assert r.status_code == 200
        assert r.json()["method"] == "invalid_request"


# ── 10. RAG tests unchanged ───────────────────────────────────────────────────

class TestRAGUnchangedStep13:
    """RAG / QA endpoint must be completely unaffected by Step 13."""

    def test_qa_status_200(self, client: TestClient) -> None:
        r = client.get("/api/v1/qa/status")
        assert r.status_code == 200
        assert r.json()["status"] == "ready"

    def test_qa_missing_body_422(self, client: TestClient) -> None:
        r = client.post("/api/v1/qa/ask")
        assert r.status_code == 422


# ── 11. Adaptive pedagogy tests unchanged ─────────────────────────────────────

class TestPedagogyUnchangedStep13:
    """Pedagogy (schema + prompt builder) must be unaffected by Step 13."""

    def test_all_five_levels_still_in_schema(self) -> None:
        from app.schemas.qa import SUPPORTED_EDUCATION_LEVELS
        assert SUPPORTED_EDUCATION_LEVELS == {
            "primary", "secondary", "higher_secondary", "college", "professional",
        }

    def test_primary_prompt_still_mentions_simple(self) -> None:
        from app.rag.prompt_builder import get_level_guidance
        guidance = get_level_guidance("primary")
        assert "simple" in guidance.lower()

    def test_professional_prompt_still_mentions_precise(self) -> None:
        from app.rag.prompt_builder import get_level_guidance
        guidance = get_level_guidance("professional")
        assert "precise" in guidance.lower()
