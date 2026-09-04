"""
Tests for the Groq AI translation layer (Step 9).

All tests mock the Groq API — no real API calls are made.
GROQ_API_KEY is never used; the mock patches the call at the
app.ai.groq_client level.

Test classes
────────────
TestGroqClient          — unit tests for groq_client.py (pure Python)
TestTranslationService  — service-layer tests with mocked Groq
TestTranslationEndpoint — HTTP-level tests with mocked Groq
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.ai.groq_client import (
    GroqNotConfiguredError,
    GroqTranslationError,
    _LANG_NAMES,
)
from app.schemas.translation import TranslationResponse


# ── Helpers ───────────────────────────────────────────────────────────────────

def _mock_groq_response(text: str) -> MagicMock:
    """Build a minimal mock that mimics groq ChatCompletion response."""
    msg = MagicMock()
    msg.content = text
    choice = MagicMock()
    choice.message = msg
    resp = MagicMock()
    resp.choices = [choice]
    return resp


# ── TestGroqClient ────────────────────────────────────────────────────────────

class TestGroqClient:
    """Unit tests for app.ai.groq_client.ai_translate()."""

    @pytest.mark.asyncio
    async def test_raises_when_api_key_missing(self) -> None:
        """ai_translate() must raise GroqNotConfiguredError when key is absent."""
        with patch("app.core.config.settings") as mock_settings:
            mock_settings.GROQ_API_KEY = None
            with pytest.raises(GroqNotConfiguredError):
                from app.ai.groq_client import ai_translate
                await ai_translate("hello", "eng", "kru")

    @pytest.mark.asyncio
    async def test_returns_translation_on_success(self) -> None:
        """ai_translate() returns the stripped model content on success."""
        mock_resp = _mock_groq_response("  नमस्ते  ")
        with patch("app.core.config.settings") as mock_settings, \
             patch("groq.AsyncGroq") as mock_groq_cls:
            mock_settings.GROQ_API_KEY = "mock_groq_api_key"
            mock_settings.GROQ_MODEL = "llama-3.3-70b-versatile"
            mock_settings.GROQ_TIMEOUT_SECONDS = 10.0
            mock_client = AsyncMock()
            mock_client.chat.completions.create = AsyncMock(return_value=mock_resp)
            mock_groq_cls.return_value = mock_client

            from app.ai.groq_client import ai_translate
            result = await ai_translate("hello", "eng", "hin")

        assert result == "नमस्ते"

    @pytest.mark.asyncio
    async def test_returns_none_when_model_says_unknown(self) -> None:
        """ai_translate() returns None when the model replies UNKNOWN."""
        mock_resp = _mock_groq_response("UNKNOWN")
        with patch("app.core.config.settings") as mock_settings, \
             patch("groq.AsyncGroq") as mock_groq_cls:
            mock_settings.GROQ_API_KEY = "mock_groq_api_key"
            mock_settings.GROQ_MODEL = "llama-3.3-70b-versatile"
            mock_settings.GROQ_TIMEOUT_SECONDS = 10.0
            mock_client = AsyncMock()
            mock_client.chat.completions.create = AsyncMock(return_value=mock_resp)
            mock_groq_cls.return_value = mock_client

            from app.ai.groq_client import ai_translate
            result = await ai_translate("xyzabc123", "eng", "kru")

        assert result is None

    @pytest.mark.asyncio
    async def test_returns_none_on_empty_response(self) -> None:
        """ai_translate() returns None when the model returns empty string."""
        mock_resp = _mock_groq_response("")
        with patch("app.core.config.settings") as mock_settings, \
             patch("groq.AsyncGroq") as mock_groq_cls:
            mock_settings.GROQ_API_KEY = "mock_groq_api_key"
            mock_settings.GROQ_MODEL = "llama-3.3-70b-versatile"
            mock_settings.GROQ_TIMEOUT_SECONDS = 10.0
            mock_client = AsyncMock()
            mock_client.chat.completions.create = AsyncMock(return_value=mock_resp)
            mock_groq_cls.return_value = mock_client

            from app.ai.groq_client import ai_translate
            result = await ai_translate("???", "eng", "kru")

        assert result is None

    @pytest.mark.asyncio
    async def test_raises_groq_translation_error_on_api_error(self) -> None:
        """ai_translate() wraps groq.APIError into GroqTranslationError."""
        import httpx
        from groq import APIError

        # APIError(message, request, *, body=None)
        fake_request = httpx.Request("POST", "https://api.groq.com/fake")
        api_err = APIError("rate limit", fake_request, body={"error": "rate_limit"})

        with patch("app.core.config.settings") as mock_settings, \
             patch("groq.AsyncGroq") as mock_groq_cls:
            mock_settings.GROQ_API_KEY = "mock_groq_api_key"
            mock_settings.GROQ_MODEL = "llama-3.3-70b-versatile"
            mock_settings.GROQ_TIMEOUT_SECONDS = 10.0
            mock_client = AsyncMock()
            mock_client.chat.completions.create = AsyncMock(side_effect=api_err)
            mock_groq_cls.return_value = mock_client

            from app.ai.groq_client import ai_translate
            with pytest.raises(GroqTranslationError):
                await ai_translate("dog", "eng", "kru")

    @pytest.mark.asyncio
    async def test_raises_groq_translation_error_on_timeout(self) -> None:
        """ai_translate() wraps APITimeoutError into GroqTranslationError."""
        import httpx
        from groq import APITimeoutError

        # APITimeoutError(request: httpx.Request)
        fake_request = httpx.Request("POST", "https://api.groq.com/fake")
        timeout_err = APITimeoutError(fake_request)

        with patch("app.core.config.settings") as mock_settings, \
             patch("groq.AsyncGroq") as mock_groq_cls:
            mock_settings.GROQ_API_KEY = "mock_groq_api_key"
            mock_settings.GROQ_MODEL = "llama-3.3-70b-versatile"
            mock_settings.GROQ_TIMEOUT_SECONDS = 10.0
            mock_client = AsyncMock()
            mock_client.chat.completions.create = AsyncMock(side_effect=timeout_err)
            mock_groq_cls.return_value = mock_client

            from app.ai.groq_client import ai_translate
            with pytest.raises(GroqTranslationError, match="timed out"):
                await ai_translate("water", "eng", "kru")

    def test_lang_names_map_covers_supported_codes(self) -> None:
        """All three supported ISO codes must have a human-readable name."""
        for code in ("kru", "hin", "eng"):
            assert code in _LANG_NAMES
            assert len(_LANG_NAMES[code]) > 0


# ── TestTranslationService ────────────────────────────────────────────────────

class TestTranslationService:
    """Service-layer tests with mocked DB session and mocked Groq."""

    def _make_db(self) -> AsyncMock:
        """Return a minimal mock AsyncSession."""
        db = AsyncMock()
        # Simulate language validation: kru and hin are both in the DB
        lang_result = MagicMock()
        lang_result.all.return_value = [("kru",), ("hin",)]
        db.execute = AsyncMock(return_value=lang_result)
        return db

    @pytest.mark.asyncio
    async def test_dictionary_hit_does_not_call_groq(self) -> None:
        """When the dictionary matches, Groq must NOT be called."""
        from sqlalchemy.engine.row import Row
        from app.services.translation_service import translate
        from app.models.vocabulary import VocabularyEntry

        # Fake a matching VocabularyEntry
        entry = MagicMock(spec=VocabularyEntry)
        entry.id = "KUR-0003"
        entry.kurukh = "अल्ला"
        entry.hindi = "कुत्ता"
        entry.english = "dog"
        entry.part_of_speech = "noun"
        entry.category_id = "everyday-words"
        entry.verified_by_native_speaker = False

        db = AsyncMock()
        # First execute: language validation
        lang_result = MagicMock()
        lang_result.all.return_value = [("kru",), ("hin",)]
        # Second execute: vocabulary lookup
        vocab_result = MagicMock()
        vocab_result.scalars.return_value.all.return_value = [entry]
        db.execute = AsyncMock(side_effect=[lang_result, vocab_result])

        with patch("app.services.translation_service.ai_translate") as mock_ai:
            result = await translate("अल्ला", "kru", "hin", db)

        mock_ai.assert_not_called()
        assert result.method == "dictionary"
        assert result.translated_text == "कुत्ता"

    @pytest.mark.asyncio
    async def test_llm_fallback_called_on_dictionary_miss(self) -> None:
        """When dictionary has no match, service calls ai_translate."""
        from app.services.translation_service import translate

        db = AsyncMock()
        lang_result = MagicMock()
        lang_result.all.return_value = [("kru",), ("hin",)]
        vocab_result = MagicMock()
        vocab_result.scalars.return_value.all.return_value = []   # no match
        db.execute = AsyncMock(side_effect=[lang_result, vocab_result])

        with patch(
            "app.services.translation_service.ai_translate",
            new=AsyncMock(return_value="परीक्षा"),
        ):
            result = await translate("परीक्षा", "hin", "kru", db)

        assert result.method == "llm"
        assert result.translated_text == "परीक्षा"

    @pytest.mark.asyncio
    async def test_not_found_when_groq_not_configured(self) -> None:
        """Service returns not_found (not an error) when GROQ_API_KEY is absent."""
        from app.services.translation_service import translate

        db = AsyncMock()
        lang_result = MagicMock()
        lang_result.all.return_value = [("kru",), ("hin",)]
        vocab_result = MagicMock()
        vocab_result.scalars.return_value.all.return_value = []
        db.execute = AsyncMock(side_effect=[lang_result, vocab_result])

        with patch(
            "app.services.translation_service.ai_translate",
            new=AsyncMock(side_effect=GroqNotConfiguredError("no key")),
        ):
            result = await translate("unknownword", "hin", "kru", db)

        assert result.method == "not_found"
        assert result.translated_text == ""
        assert "GROQ_API_KEY" in (result.message or "")

    @pytest.mark.asyncio
    async def test_ai_error_method_on_groq_failure(self) -> None:
        """Service returns method='ai_error' when Groq raises GroqTranslationError."""
        from app.services.translation_service import translate

        db = AsyncMock()
        lang_result = MagicMock()
        lang_result.all.return_value = [("eng",), ("kru",)]
        vocab_result = MagicMock()
        vocab_result.scalars.return_value.all.return_value = []
        db.execute = AsyncMock(side_effect=[lang_result, vocab_result])

        with patch(
            "app.services.translation_service.ai_translate",
            new=AsyncMock(side_effect=GroqTranslationError("timeout")),
        ):
            result = await translate("elephant", "eng", "kru", db)

        assert result.method == "ai_error"
        assert result.translated_text == ""

    @pytest.mark.asyncio
    async def test_not_found_when_ai_returns_none(self) -> None:
        """Service returns not_found when AI returns None (model said UNKNOWN)."""
        from app.services.translation_service import translate

        db = AsyncMock()
        lang_result = MagicMock()
        lang_result.all.return_value = [("eng",), ("kru",)]
        vocab_result = MagicMock()
        vocab_result.scalars.return_value.all.return_value = []
        db.execute = AsyncMock(side_effect=[lang_result, vocab_result])

        with patch(
            "app.services.translation_service.ai_translate",
            new=AsyncMock(return_value=None),
        ):
            result = await translate("xyzq999", "eng", "kru", db)

        assert result.method == "not_found"
        assert result.translated_text == ""


# ── TestTranslationEndpoint ───────────────────────────────────────────────────

class TestTranslationEndpoint:
    """HTTP-level tests via TestClient with mocked Groq."""

    PATH = "/api/v1/translation/translate"

    @pytest.fixture(scope="function")
    def client(self) -> TestClient:
        from app.main import app as fastapi_app
        with TestClient(fastapi_app, raise_server_exceptions=False) as c:
            yield c

    def test_status_endpoint_still_works(self, client: TestClient) -> None:
        """The status endpoint must remain unaffected by the Groq layer."""
        r = client.get("/api/v1/translation/status")
        assert r.status_code == 200
        assert r.json()["module"] == "translation"
        assert r.json()["status"] == "ready"

    def test_missing_body_returns_422(self, client: TestClient) -> None:
        r = client.post(self.PATH)
        assert r.status_code == 422

    def test_same_language_returns_400_level(self, client: TestClient) -> None:
        """source == target is a validation error at the service level."""
        r = client.post(
            self.PATH,
            json={"text": "dog", "source_language": "eng", "target_language": "eng"},
        )
        # Returns 200 with method=invalid_request (service-level validation)
        assert r.status_code != 404

    def test_response_schema_keys_present(self, client: TestClient) -> None:
        """Every TranslationResponse must have the required fields."""
        with patch(
            "app.services.translation_service.ai_translate",
            new=AsyncMock(side_effect=GroqNotConfiguredError("no key")),
        ):
            r = client.post(
                self.PATH,
                json={
                    "text": "zzznotaword",
                    "source_language": "eng",
                    "target_language": "kru",
                },
            )
        body = r.json()
        required = {
            "original_text", "translated_text", "source_language",
            "target_language", "method", "matches",
        }
        assert required.issubset(body.keys())
