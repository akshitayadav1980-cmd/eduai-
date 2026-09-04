"""
Tests for Roadmap Item: Interactive AI Tutor Chat Session.

Covers all required acceptance criteria:
1.  Tutor routes are registered (/status, /session, /chat).
2.  Unauthenticated chat request is rejected (HTTP 401).
3.  Unauthenticated session request is rejected (HTTP 401).
4.  Valid authenticated chat request succeeds with proper response structure.
5.  Valid session creation succeeds (HTTP 201) with welcome message and unique ID.
6.  Empty and whitespace-only message validation (HTTP 422).
7.  Invalid language and education_level validation (HTTP 422).
8.  Multi-turn conversation history is maintained and passed to LLM.
9.  Authenticated user context (username and role) is incorporated into prompt.
10. RAG vocabulary context and adaptive pedagogy guidance are integrated.
11. LLM/Service failure handling (GroqNotConfiguredError and GroqTranslationError).
12. Existing platform endpoints remain unaffected.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.ai.groq_client import GroqNotConfiguredError, GroqTranslationError
from app.core.security import create_access_token, get_current_user
from app.database import get_db
from app.main import app as fastapi_app
from app.models.user import User
from app.rag.retriever import RetrievedEntry
from app.schemas.tutor import (
    ChatMessage,
    CreateSessionRequest,
    SessionResponse,
    TutorChatRequest,
    TutorChatResponse,
)
from app.services import tutor_service

STATUS_PATH = "/api/v1/tutor/status"
SESSION_PATH = "/api/v1/tutor/session"
CHAT_PATH = "/api/v1/tutor/chat"


# ── Shared fixtures & helpers ──────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def clean_overrides():
    """Ensure dependency overrides are always reset after each test."""
    yield
    fastapi_app.dependency_overrides.clear()


@pytest.fixture
def client() -> TestClient:
    with TestClient(fastapi_app, raise_server_exceptions=False) as c:
        yield c


def _make_user(
    id: int = 1,
    username: str = "anita_student",
    role: str = "student",
) -> User:
    user = MagicMock(spec=User)
    user.id = id
    user.username = username
    user.role = role
    return user


def _auth_headers(username: str = "anita_student", role: str = "student") -> dict[str, str]:
    token = create_access_token(subject=username, role=role)
    return {"Authorization": f"Bearer {token}"}


# ── 1. Route Registration ──────────────────────────────────────────────────────

class TestTutorRouteRegistration:
    def test_status_endpoint_returns_200(self, client: TestClient) -> None:
        r = client.get(STATUS_PATH)
        assert r.status_code == 200
        data = r.json()
        assert data["module"] == "tutor"
        assert data["status"] == "ready"

    def test_session_route_exists(self, client: TestClient) -> None:
        """Route exists — returns 401 without auth, not 404."""
        r = client.post(SESSION_PATH, json={})
        assert r.status_code == 401

    def test_chat_route_exists(self, client: TestClient) -> None:
        """Route exists — returns 401 without auth, not 404."""
        r = client.post(CHAT_PATH, json={"message": "hello"})
        assert r.status_code == 401


# ── 2 & 3. Authentication Enforcement ──────────────────────────────────────────

class TestTutorAuthentication:
    def test_unauthenticated_chat_rejected(self, client: TestClient) -> None:
        r = client.post(CHAT_PATH, json={"message": "What is water in Kurukh?"})
        assert r.status_code == 401
        assert r.json().get("detail") in ("Not authenticated", "Could not validate credentials.")

    def test_unauthenticated_session_rejected(self, client: TestClient) -> None:
        r = client.post(SESSION_PATH, json={"language": "hin"})
        assert r.status_code == 401
        assert r.json().get("detail") in ("Not authenticated", "Could not validate credentials.")


    def test_invalid_bearer_token_rejected(self, client: TestClient) -> None:
        headers = {"Authorization": "Bearer invalid_garbage_token"}
        r = client.post(CHAT_PATH, json={"message": "test"}, headers=headers)
        assert r.status_code == 401


# ── 4. Session Creation ────────────────────────────────────────────────────────

class TestTutorSessionCreation:
    def test_create_session_success(self, client: TestClient) -> None:
        mock_user = _make_user(id=10, username="suman_learner", role="student")
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user

        payload = {
            "language": "hin",
            "education_level": "secondary",
            "topic": "Environment & Nature",
        }
        r = client.post(SESSION_PATH, json=payload)
        assert r.status_code == 201
        data = r.json()

        assert "session_id" in data
        assert len(data["session_id"]) > 10
        assert data["username"] == "suman_learner"
        assert data["role"] == "student"
        assert data["language"] == "hin"
        assert data["education_level"] == "secondary"
        assert data["topic"] == "Environment & Nature"
        assert "नमस्ते suman_learner" in data["welcome_message"]
        assert data["message_count"] == 1

    def test_create_session_kurukh_welcome(self, client: TestClient) -> None:
        mock_user = _make_user(id=11, username="birsa", role="student")
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user

        payload = {"language": "kru", "education_level": "primary"}
        r = client.post(SESSION_PATH, json=payload)
        assert r.status_code == 201
        data = r.json()
        assert "Ne-hài birsa" in data["welcome_message"]

    def test_create_session_english_welcome(self, client: TestClient) -> None:
        mock_user = _make_user(id=12, username="john_educator", role="teacher")
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user

        payload = {"language": "eng", "education_level": "college"}
        r = client.post(SESSION_PATH, json=payload)
        assert r.status_code == 201
        data = r.json()
        assert "Hello john_educator" in data["welcome_message"]


# ── 5. Request Validation ──────────────────────────────────────────────────────

class TestTutorValidation:
    def test_blank_message_rejected(self, client: TestClient) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user

        r = client.post(CHAT_PATH, json={"message": "   "})
        assert r.status_code == 422

    def test_missing_message_rejected(self, client: TestClient) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user

        r = client.post(CHAT_PATH, json={"language": "hin"})
        assert r.status_code == 422

    def test_invalid_language_code_rejected(self, client: TestClient) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user

        r = client.post(CHAT_PATH, json={"message": "Hello", "language": "french"})
        assert r.status_code == 422

    def test_invalid_education_level_rejected(self, client: TestClient) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user

        r = client.post(CHAT_PATH, json={"message": "Hello", "education_level": "phd"})
        assert r.status_code == 422

    def test_session_invalid_language_rejected(self, client: TestClient) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user

        r = client.post(SESSION_PATH, json={"language": "spanish"})
        assert r.status_code == 422


# ── 6. Chat Interaction & Response Structure ───────────────────────────────────

class TestTutorChatInteraction:
    def test_valid_chat_turn_success(self, client: TestClient) -> None:
        mock_user = _make_user(username="aarav", role="student")
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user
        mock_db = AsyncMock()
        fastapi_app.dependency_overrides[get_db] = lambda: mock_db

        expected_reply = "कुड़ुख भाषा में पानी को 'ड़ी' (Amrit/Water) कहते हैं।"

        with patch("app.services.tutor_service.retrieve_context", new=AsyncMock(return_value=[])), \
             patch("app.services.tutor_service._call_groq_chat", new=AsyncMock(return_value=expected_reply)):

            r = client.post(
                CHAT_PATH,
                json={
                    "message": "पानी को कुड़ुख में क्या कहते हैं?",
                    "language": "hin",
                    "education_level": "secondary",
                },
            )

        assert r.status_code == 200
        data = r.json()
        assert data["response"] == expected_reply
        assert data["message"] == "पानी को कुड़ुख में क्या कहते हैं?"
        assert data["language"] == "hin"
        assert data["education_level"] == "secondary"
        assert data["method"] == "tutor_llm"
        assert "session_id" in data
        assert len(data["history"]) >= 2  # user turn + assistant turn

    def test_chat_turn_with_rag_context(self, client: TestClient) -> None:
        mock_user = _make_user(username="rohit", role="student")
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user
        mock_db = AsyncMock()
        fastapi_app.dependency_overrides[get_db] = lambda: mock_db

        mock_entry = RetrievedEntry(
            entry_id="KUR-0001",
            kurukh="ड़ी",
            hindi="पानी",
            english="water",
            part_of_speech="noun",
            category="nature",
            verified=True,
        )

        with patch("app.services.tutor_service.retrieve_context", new=AsyncMock(return_value=[mock_entry])), \
             patch("app.services.tutor_service._call_groq_chat", new=AsyncMock(return_value="Water is called ड़ी.")):

            r = client.post(
                CHAT_PATH,
                json={
                    "message": "What is water in Kurukh?",
                    "language": "eng",
                    "education_level": "primary",
                },
            )

        assert r.status_code == 200
        data = r.json()
        assert data["method"] == "tutor_rag"
        assert data["context_count"] == 1
        assert data["retrieved_context"][0]["entry_id"] == "KUR-0001"
        assert data["retrieved_context"][0]["kurukh"] == "ड़ी"


# ── 7. Multi-Turn Conversation History ─────────────────────────────────────────

class TestTutorMultiTurnConversation:
    def test_multi_turn_history_preserved_in_session(self, client: TestClient) -> None:
        mock_user = _make_user(username="priya", role="student")
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user
        mock_db = AsyncMock()
        fastapi_app.dependency_overrides[get_db] = lambda: mock_db

        # Turn 1: Create session
        sess_resp = client.post(SESSION_PATH, json={"language": "eng", "education_level": "secondary"})
        session_id = sess_resp.json()["session_id"]

        # Turn 2: First question
        with patch("app.services.tutor_service.retrieve_context", new=AsyncMock(return_value=[])), \
             patch("app.services.tutor_service._call_groq_chat", new=AsyncMock(return_value="Animals are fascinating.")):
            turn1 = client.post(
                CHAT_PATH,
                json={"session_id": session_id, "message": "Let's learn animal names."},
            )
        assert turn1.status_code == 200
        history1 = turn1.json()["history"]

        # Turn 3: Second follow-up question
        captured_messages: list[list[dict[str, str]]] = []

        async def fake_groq(messages):
            captured_messages.append(messages)
            return "A dog is called Alla in Kurukh."

        with patch("app.services.tutor_service.retrieve_context", new=AsyncMock(return_value=[])), \
             patch("app.services.tutor_service._call_groq_chat", new=fake_groq):
            turn2 = client.post(
                CHAT_PATH,
                json={"session_id": session_id, "message": "What about a dog?"},
            )

        assert turn2.status_code == 200
        history2 = turn2.json()["history"]
        assert len(history2) > len(history1)

        # Check that previous turns were sent to Groq
        assert len(captured_messages) == 1
        sent_roles = [m["role"] for m in captured_messages[0]]
        assert "system" in sent_roles
        assert "user" in sent_roles
        assert "assistant" in sent_roles

        # Ensure prior message was present
        all_content = " ".join(m["content"] for m in captured_messages[0])
        assert "Let's learn animal names." in all_content
        assert "What about a dog?" in all_content

    def test_client_provided_history_supported(self, client: TestClient) -> None:
        mock_user = _make_user(username="kavita", role="student")
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user
        mock_db = AsyncMock()
        fastapi_app.dependency_overrides[get_db] = lambda: mock_db

        captured_messages = []

        async def fake_groq(messages):
            captured_messages.append(messages)
            return "Good follow up."

        client_history = [
            {"role": "user", "content": "I want to study mathematics."},
            {"role": "assistant", "content": "Sure! What topic in math?"},
        ]

        with patch("app.services.tutor_service.retrieve_context", new=AsyncMock(return_value=[])), \
             patch("app.services.tutor_service._call_groq_chat", new=fake_groq):
            r = client.post(
                CHAT_PATH,
                json={
                    "message": "Fractions and ratios.",
                    "history": client_history,
                },
            )

        assert r.status_code == 200
        assert len(captured_messages) == 1
        all_sent_content = " ".join(m["content"] for m in captured_messages[0])
        assert "I want to study mathematics." in all_sent_content
        assert "Fractions and ratios." in all_sent_content


# ── 8. User Context and Adaptive Pedagogy in Prompt ────────────────────────────

class TestTutorContextAndPedagogy:
    def test_user_profile_and_pedagogy_in_system_prompt(self) -> None:
        prompt = tutor_service.build_tutor_system_prompt(
            username="deepak_mathur",
            role="teacher",
            language="hin",
            education_level="higher_secondary",
            retrieved_entries=[],
            topic="Pedagogy & Classroom Methods",
        )

        assert "deepak_mathur" in prompt
        assert "teacher" in prompt
        assert "Hindi" in prompt
        assert "HIGHER SECONDARY" in prompt
        assert "Pedagogy & Classroom Methods" in prompt

    def test_primary_level_guidance_present_for_primary_student(self) -> None:
        prompt = tutor_service.build_tutor_system_prompt(
            username="little_chhotu",
            role="student",
            language="eng",
            education_level="primary",
            retrieved_entries=[],
        )

        assert "little_chhotu" in prompt
        assert "PRIMARY" in prompt
        assert "simplest" in prompt.lower()


# ── 9. Error Handling without Secret Leakage ───────────────────────────────────

class TestTutorErrorHandling:
    def test_groq_not_configured_handled_safely(self, client: TestClient) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user
        mock_db = AsyncMock()
        fastapi_app.dependency_overrides[get_db] = lambda: mock_db

        with patch("app.services.tutor_service.retrieve_context", new=AsyncMock(return_value=[])), \
             patch("app.services.tutor_service._call_groq_chat", new=AsyncMock(side_effect=GroqNotConfiguredError())):

            r = client.post(CHAT_PATH, json={"message": "Explain solar system"})

        assert r.status_code == 200
        data = r.json()
        assert data["method"] == "not_configured"
        assert "GROQ_API_KEY" in data["response"]

    def test_groq_service_failure_handled_safely(self, client: TestClient) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user
        mock_db = AsyncMock()
        fastapi_app.dependency_overrides[get_db] = lambda: mock_db

        with patch("app.services.tutor_service.retrieve_context", new=AsyncMock(return_value=[])), \
             patch("app.services.tutor_service._call_groq_chat", new=AsyncMock(side_effect=GroqTranslationError("Timeout"))):

            r = client.post(CHAT_PATH, json={"message": "Explain photosynthesis"})

        assert r.status_code == 200
        data = r.json()
        assert data["method"] == "ai_error"
        assert "service error" in data["response"]


# ── 10. Existing Endpoints Unaffected ──────────────────────────────────────────

class TestExistingEndpointsUnaffected:
    def test_auth_status_unaffected(self, client: TestClient) -> None:
        r = client.get("/api/v1/auth/status")
        assert r.status_code == 200
        assert r.json()["status"] == "ready"

    def test_translation_status_unaffected(self, client: TestClient) -> None:
        r = client.get("/api/v1/translation/status")
        assert r.status_code == 200
        assert r.json()["status"] == "ready"

    def test_vocabulary_status_unaffected(self, client: TestClient) -> None:
        r = client.get("/api/v1/vocabulary/status")
        assert r.status_code == 200
        assert r.json()["status"] == "ready"

    def test_qa_status_unaffected(self, client: TestClient) -> None:
        r = client.get("/api/v1/qa/status")
        assert r.status_code == 200
        assert r.json()["status"] == "ready"

    def test_voice_status_unaffected(self, client: TestClient) -> None:
        r = client.get("/api/v1/voice/status")
        assert r.status_code == 200
        assert r.json()["status"] == "ready"
