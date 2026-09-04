"""
Database-independent tests for the vocabulary and language route status endpoints.

These tests hit only the /status endpoints, which have no database dependency
and run without DATABASE_URL being set. They verify:
  - The routes are registered correctly in the API router.
  - Each endpoint returns HTTP 200.
  - Each response contains the correct module name and "status": "ready".

DB-backed endpoints (GET /api/v1/languages, GET /api/v1/vocabulary, etc.)
require a live PostgreSQL database and are not tested here. They will be
covered by integration tests once the database is provisioned.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app

# ---------------------------------------------------------------------------
# Shared client fixture
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def client() -> TestClient:
    """
    Return a TestClient wired to the FastAPI application.

    raise_server_exceptions=False lets DB-backed endpoints return HTTP 500
    (instead of re-raising RuntimeError) when DATABASE_URL is not set,
    which is the correct behaviour to assert against in TestDbRoutesRegistered.
    """
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


# ---------------------------------------------------------------------------
# GET /api/v1/languages/status
# ---------------------------------------------------------------------------

class TestLanguagesStatus:
    PATH = "/api/v1/languages/status"

    def test_returns_http_200(self, client: TestClient) -> None:
        assert client.get(self.PATH).status_code == 200

    def test_module_name_is_languages(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["module"] == "languages"

    def test_status_is_ready(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["status"] == "ready"

    def test_response_has_no_extra_keys(self, client: TestClient) -> None:
        body = client.get(self.PATH).json()
        assert set(body.keys()) == {"module", "status"}


# ---------------------------------------------------------------------------
# GET /api/v1/vocabulary/status
# ---------------------------------------------------------------------------

class TestVocabularyStatus:
    PATH = "/api/v1/vocabulary/status"

    def test_returns_http_200(self, client: TestClient) -> None:
        assert client.get(self.PATH).status_code == 200

    def test_module_name_is_vocabulary(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["module"] == "vocabulary"

    def test_status_is_ready(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["status"] == "ready"

    def test_response_has_no_extra_keys(self, client: TestClient) -> None:
        body = client.get(self.PATH).json()
        assert set(body.keys()) == {"module", "status"}


# ---------------------------------------------------------------------------
# Verify DB-backed routes are registered (404 without DB, not 405/422/500)
# ---------------------------------------------------------------------------

class TestDbRoutesRegistered:
    """
    Confirm the DB-backed routes are wired into the router.
    Without DATABASE_URL set, get_db raises RuntimeError which FastAPI
    converts to HTTP 500. The important thing is they are NOT 404
    (which would mean the route is missing) and NOT 405 (wrong method).
    """

    def test_languages_list_is_registered(self, client: TestClient) -> None:
        response = client.get("/api/v1/languages")
        # Route exists — either 200 (DB connected) or 500 (no DB), never 404
        assert response.status_code != 404
        assert response.status_code != 405

    def test_vocabulary_list_is_registered(self, client: TestClient) -> None:
        response = client.get("/api/v1/vocabulary")
        assert response.status_code != 404
        assert response.status_code != 405

    def test_vocabulary_categories_is_registered(self, client: TestClient) -> None:
        response = client.get("/api/v1/vocabulary/categories")
        assert response.status_code != 404
        assert response.status_code != 405

    def test_single_language_route_is_registered(self, client: TestClient) -> None:
        response = client.get("/api/v1/languages/kru")
        assert response.status_code != 404
        assert response.status_code != 405

    def test_single_vocabulary_entry_route_is_registered(
        self, client: TestClient
    ) -> None:
        response = client.get("/api/v1/vocabulary/KUR-0001")
        assert response.status_code != 404
        assert response.status_code != 405
