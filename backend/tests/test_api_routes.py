"""
Tests for every /api/v1/*/status endpoint added in Step 2.

Each module is verified for:
  - HTTP 200 response
  - response body contains "module" with the correct module name
  - response body contains "status": "ready"

The shared TestClient fixture is module-scoped to avoid spinning up the ASGI
app once per test class.
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
# Helper
# ---------------------------------------------------------------------------

def assert_status_endpoint(client: TestClient, path: str, expected_module: str) -> None:
    """Shared assertions for every /api/v1/*/status endpoint."""
    response = client.get(path)

    assert response.status_code == 200, (
        f"Expected HTTP 200 from {path}, got {response.status_code}"
    )

    body = response.json()

    assert "module" in body, f"Response from {path} missing 'module' key: {body}"
    assert "status" in body, f"Response from {path} missing 'status' key: {body}"

    assert body["module"] == expected_module, (
        f"Expected module='{expected_module}', got '{body['module']}'"
    )
    assert body["status"] == "ready", (
        f"Expected status='ready', got '{body['status']}'"
    )


# ---------------------------------------------------------------------------
# GET /api/v1/auth/status
# ---------------------------------------------------------------------------

class TestAuthStatus:
    PATH = "/api/v1/auth/status"
    MODULE = "auth"

    def test_http_200(self, client: TestClient) -> None:
        assert client.get(self.PATH).status_code == 200

    def test_module_name(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["module"] == self.MODULE

    def test_status_ready(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["status"] == "ready"


# ---------------------------------------------------------------------------
# GET /api/v1/users/status
# ---------------------------------------------------------------------------

class TestUsersStatus:
    PATH = "/api/v1/users/status"
    MODULE = "users"

    def test_http_200(self, client: TestClient) -> None:
        assert client.get(self.PATH).status_code == 200

    def test_module_name(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["module"] == self.MODULE

    def test_status_ready(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["status"] == "ready"


# ---------------------------------------------------------------------------
# GET /api/v1/languages/status
# ---------------------------------------------------------------------------

class TestLanguagesStatus:
    PATH = "/api/v1/languages/status"
    MODULE = "languages"

    def test_http_200(self, client: TestClient) -> None:
        assert client.get(self.PATH).status_code == 200

    def test_module_name(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["module"] == self.MODULE

    def test_status_ready(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["status"] == "ready"


# ---------------------------------------------------------------------------
# GET /api/v1/vocabulary/status
# ---------------------------------------------------------------------------

class TestVocabularyStatus:
    PATH = "/api/v1/vocabulary/status"
    MODULE = "vocabulary"

    def test_http_200(self, client: TestClient) -> None:
        assert client.get(self.PATH).status_code == 200

    def test_module_name(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["module"] == self.MODULE

    def test_status_ready(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["status"] == "ready"


# ---------------------------------------------------------------------------
# GET /api/v1/tutor/status
# ---------------------------------------------------------------------------

class TestTutorStatus:
    PATH = "/api/v1/tutor/status"
    MODULE = "tutor"

    def test_http_200(self, client: TestClient) -> None:
        assert client.get(self.PATH).status_code == 200

    def test_module_name(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["module"] == self.MODULE

    def test_status_ready(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["status"] == "ready"


# ---------------------------------------------------------------------------
# GET /api/v1/translation/status
# ---------------------------------------------------------------------------

class TestTranslationStatus:
    PATH = "/api/v1/translation/status"
    MODULE = "translation"

    def test_http_200(self, client: TestClient) -> None:
        assert client.get(self.PATH).status_code == 200

    def test_module_name(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["module"] == self.MODULE

    def test_status_ready(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["status"] == "ready"


# ---------------------------------------------------------------------------
# GET /api/v1/voice/status
# ---------------------------------------------------------------------------

class TestVoiceStatus:
    PATH = "/api/v1/voice/status"
    MODULE = "voice"

    def test_http_200(self, client: TestClient) -> None:
        assert client.get(self.PATH).status_code == 200

    def test_module_name(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["module"] == self.MODULE

    def test_status_ready(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["status"] == "ready"


# ---------------------------------------------------------------------------
# GET /api/v1/quizzes/status
# ---------------------------------------------------------------------------

class TestQuizzesStatus:
    PATH = "/api/v1/quizzes/status"
    MODULE = "quizzes"

    def test_http_200(self, client: TestClient) -> None:
        assert client.get(self.PATH).status_code == 200

    def test_module_name(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["module"] == self.MODULE

    def test_status_ready(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["status"] == "ready"


# ---------------------------------------------------------------------------
# GET /api/v1/progress/status
# ---------------------------------------------------------------------------

class TestProgressStatus:
    PATH = "/api/v1/progress/status"
    MODULE = "progress"

    def test_http_200(self, client: TestClient) -> None:
        assert client.get(self.PATH).status_code == 200

    def test_module_name(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["module"] == self.MODULE

    def test_status_ready(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["status"] == "ready"


# ---------------------------------------------------------------------------
# GET /api/v1/recommendations/status
# ---------------------------------------------------------------------------

class TestRecommendationsStatus:
    PATH = "/api/v1/recommendations/status"
    MODULE = "recommendations"

    def test_http_200(self, client: TestClient) -> None:
        assert client.get(self.PATH).status_code == 200

    def test_module_name(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["module"] == self.MODULE

    def test_status_ready(self, client: TestClient) -> None:
        assert client.get(self.PATH).json()["status"] == "ready"
