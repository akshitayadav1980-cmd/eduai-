"""
Tests for the root endpoints defined in app/main.py.

Uses FastAPI's built-in TestClient (backed by httpx) so no running server
is needed — the ASGI app is called in-process.
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
    """Return a TestClient wired to the FastAPI application."""
    with TestClient(app) as c:
        yield c


# ---------------------------------------------------------------------------
# GET /
# ---------------------------------------------------------------------------

class TestRoot:
    def test_status_code(self, client: TestClient) -> None:
        response = client.get("/")
        assert response.status_code == 200

    def test_response_shape(self, client: TestClient) -> None:
        body = client.get("/").json()
        assert "message" in body
        assert "status" in body

    def test_message_content(self, client: TestClient) -> None:
        body = client.get("/").json()
        assert body["message"] == "Vernacular AI Backend is running!"

    def test_status_value(self, client: TestClient) -> None:
        body = client.get("/").json()
        assert body["status"] == "success"


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------

class TestHealth:
    def test_status_code(self, client: TestClient) -> None:
        response = client.get("/health")
        assert response.status_code == 200

    def test_response_shape(self, client: TestClient) -> None:
        body = client.get("/health").json()
        assert "status" in body

    def test_status_value(self, client: TestClient) -> None:
        body = client.get("/health").json()
        assert body["status"] == "healthy"


# ---------------------------------------------------------------------------
# OpenAPI schema availability
# ---------------------------------------------------------------------------

class TestDocs:
    def test_openapi_json_accessible(self, client: TestClient) -> None:
        response = client.get("/openapi.json")
        assert response.status_code == 200

    def test_docs_page_accessible(self, client: TestClient) -> None:
        response = client.get("/docs")
        assert response.status_code == 200

    def test_redoc_page_accessible(self, client: TestClient) -> None:
        response = client.get("/redoc")
        assert response.status_code == 200
