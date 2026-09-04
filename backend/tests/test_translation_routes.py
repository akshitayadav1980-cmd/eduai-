"""
Tests for the Translation API — /api/v1/translation/*

Test classes
────────────
TestTranslationStatus       — GET /status (no DB required)
TestTranslationLanguages    — GET /languages route is registered
TestTranslationTranslate    — POST /translate route is registered
TestTranslationSchemas      — Pydantic schema validation (pure-Python, no DB)
TestTranslationService      — Service logic unit tests (pure-Python, no DB)

DB-backed integration tests (live data from vernacular_ai) are in:
  test_translation_integration.py  (run only when DATABASE_URL is set)

All tests in this file pass without a live database.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.schemas.translation import TranslationRequest, TranslationResponse


# ── Client fixture ────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def client() -> TestClient:
    """
    TestClient with raise_server_exceptions=False so DB-backed endpoints
    return HTTP 500 instead of raising RuntimeError when no DB is available.
    """
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


# ── GET /api/v1/translation/status ───────────────────────────────────────────

class TestTranslationStatus:
    PATH = "/api/v1/translation/status"

    def test_returns_200(self, client: TestClient) -> None:
        assert client.get(self.PATH).status_code == 200

    def test_module_name(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["module"] == "translation"

    def test_status_ready(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["status"] == "ready"

    def test_response_keys(self, client: TestClient) -> None:
        assert set(client.get(self.PATH).json().keys()) == {"module", "status"}


# ── GET /api/v1/translation/languages (route registration) ───────────────────

class TestTranslationLanguages:
    PATH = "/api/v1/translation/languages"

    def test_route_is_registered(self, client: TestClient) -> None:
        """Route must exist — 200 (DB up) or 500 (no DB), never 404/405."""
        r = client.get(self.PATH)
        assert r.status_code != 404
        assert r.status_code != 405

    def test_method_post_not_allowed(self, client: TestClient) -> None:
        """Only GET is defined on this endpoint."""
        assert client.post(self.PATH).status_code == 405


# ── POST /api/v1/translation/translate (route registration) ──────────────────

class TestTranslationTranslate:
    PATH = "/api/v1/translation/translate"

    def test_route_is_registered(self, client: TestClient) -> None:
        """Route must exist — any HTTP response except 404."""
        payload = {"text": "अल्ला", "source_language": "kru", "target_language": "hin"}
        r = client.post(self.PATH, json=payload)
        assert r.status_code != 404

    def test_get_method_not_allowed(self, client: TestClient) -> None:
        """Only POST is defined on this endpoint."""
        assert client.get(self.PATH).status_code == 405

    def test_missing_body_returns_422(self, client: TestClient) -> None:
        """No body → FastAPI validation error."""
        r = client.post(self.PATH)
        assert r.status_code == 422

    def test_missing_field_returns_422(self, client: TestClient) -> None:
        """Missing target_language → FastAPI validation error."""
        r = client.post(self.PATH, json={"text": "अल्ला", "source_language": "kru"})
        assert r.status_code == 422


# ── TranslationRequest schema validation (pure Python) ───────────────────────

class TestTranslationSchemas:
    """Validate Pydantic schema logic without touching the DB or HTTP."""

    def test_valid_request(self) -> None:
        req = TranslationRequest(
            text="अल्ला", source_language="kru", target_language="hin"
        )
        assert req.text == "अल्ला"
        assert req.source_language == "kru"
        assert req.target_language == "hin"

    def test_text_is_stripped(self) -> None:
        req = TranslationRequest(
            text="  dog  ", source_language="eng", target_language="kru"
        )
        assert req.text == "dog"

    def test_language_codes_lowercased(self) -> None:
        req = TranslationRequest(
            text="water", source_language="ENG", target_language="KRU"
        )
        assert req.source_language == "eng"
        assert req.target_language == "kru"

    def test_empty_text_raises(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            TranslationRequest(
                text="   ", source_language="kru", target_language="hin"
            )
        assert "empty or whitespace" in str(exc_info.value)

    def test_empty_source_language_raises(self) -> None:
        with pytest.raises(ValidationError):
            TranslationRequest(text="dog", source_language="", target_language="kru")

    def test_empty_target_language_raises(self) -> None:
        with pytest.raises(ValidationError):
            TranslationRequest(text="dog", source_language="eng", target_language="")

    def test_all_three_valid_codes_accepted(self) -> None:
        for code in ("kru", "hin", "eng"):
            other = "hin" if code != "hin" else "kru"
            req = TranslationRequest(text="test", source_language=code, target_language=other)
            assert req.source_language == code

    def test_response_schema_not_found(self) -> None:
        resp = TranslationResponse(
            original_text="xyz",
            translated_text="",
            source_language="kru",
            target_language="hin",
            method="not_found",
            matches=[],
            message="No dictionary entry found.",
        )
        assert resp.method == "not_found"
        assert resp.translated_text == ""
        assert resp.matches == []

    def test_response_schema_dictionary_hit(self) -> None:
        from app.schemas.translation import TranslationMatch
        match = TranslationMatch(
            entry_id="KUR-0003",
            source_text="अल्ला",
            translated_text="कुत्ता",
            part_of_speech="noun",
            category="everyday-words",
            verified_by_native_speaker=False,
        )
        resp = TranslationResponse(
            original_text="अल्ला",
            translated_text="कुत्ता",
            source_language="kru",
            target_language="hin",
            method="dictionary",
            matches=[match],
        )
        assert resp.method == "dictionary"
        assert resp.translated_text == "कुत्ता"
        assert len(resp.matches) == 1
        assert resp.matches[0].entry_id == "KUR-0003"
