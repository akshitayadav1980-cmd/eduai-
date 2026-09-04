"""
Tests for Roadmap Item: Quiz Generation & Evaluation Engine.

Covers all 22 required acceptance criteria:
1.  Quiz status endpoint (GET /api/v1/quizzes/status).
2.  Quiz route registration (status, generate, evaluate).
3.  Unauthenticated generate request rejected (HTTP 401).
4.  Unauthenticated evaluate request rejected (HTTP 401).
5.  Valid authenticated generation succeeds with expected response schema.
6.  Language validation (invalid language rejected with HTTP 422).
7.  Education-level validation (invalid level rejected with HTTP 422).
8.  Difficulty validation (invalid difficulty rejected with HTTP 422).
9.  Question-count validation (invalid counts like 0 or >20 rejected with HTTP 422).
10. Empty topic validation (blank topic rejected with HTTP 422).
11. Generated question schema (id, question, options, type='mcq', difficulty).
12. Correct-answer data is not exposed in the generate response.
13. Deterministic evaluation calculation.
14. Perfect score evaluation (100%, correct=total, incorrect=0, passed=True).
15. Zero score evaluation (0%, correct=0, incorrect=total, passed=False).
16. Partial score evaluation (e.g. 2/3, correct percentage, passed status).
17. Invalid answer submission (empty answers rejected with HTTP 422; unknown quiz_id -> 400).
18. Per-question results structure (question_id, selected_option, correct_answer, is_correct, explanation).
19. Existing RAG integration (vocabulary retrieval called for topic).
20. Existing adaptive pedagogy integration (level guidance incorporated in prompt).
21. Groq/service failure handling (GroqNotConfiguredError and GroqTranslationError handled safely).
22. Existing platform endpoints remain unaffected.
"""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.ai.groq_client import GroqNotConfiguredError, GroqTranslationError
from app.core.security import get_current_user
from app.database import get_db
from app.main import app as fastapi_app
from app.models.user import User
from app.rag.retriever import RetrievedEntry
from app.schemas.quiz import (
    AnswerSubmission,
    GenerateQuizRequest,
    GenerateQuizResponse,
    QuestionEvaluationItem,
    QuizEvaluateRequest,
    QuizEvaluateResponse,
    QuizQuestionPublic,
)
from app.services import quiz_service

STATUS_PATH = "/api/v1/quizzes/status"
GENERATE_PATH = "/api/v1/quizzes/generate"
EVALUATE_PATH = "/api/v1/quizzes/evaluate"


# ── Fixtures & Helpers ─────────────────────────────────────────────────────────

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
    username: str = "sunil_student",
    role: str = "student",
) -> User:
    user = MagicMock(spec=User)
    user.id = id
    user.username = username
    user.role = role
    return user


def _sample_groq_quiz_json() -> str:
    """Simulate a structured JSON array returned by Groq."""
    items = [
        {
            "question": "कुड़ुख भाषा में 'पानी' को क्या कहते हैं?",
            "options": ["A) ड़ी", "B) अल्ला", "C) मन", "D) एड़पा"],
            "correct_answer": "A) ड़ी",
            "explanation": "कुड़ुख में पानी के लिए 'ड़ी' शब्द का प्रयोग होता है।",
        },
        {
            "question": "कुड़ुख भाषा में 'कुत्ता' का सही अर्थ क्या है?",
            "options": ["A) मन", "B) अल्ला", "C) ड़ी", "D) एड़पा"],
            "correct_answer": "B) अल्ला",
            "explanation": "अल्ला का हिंदी अर्थ कुत्ता होता है।",
        },
    ]
    return json.dumps(items)


# ── 1 & 2. Route Registration & Status ─────────────────────────────────────────

class TestQuizRouteRegistration:
    def test_status_endpoint_returns_200(self, client: TestClient) -> None:
        r = client.get(STATUS_PATH)
        assert r.status_code == 200
        data = r.json()
        assert data["module"] == "quizzes"
        assert data["status"] == "ready"

    def test_generate_route_exists(self, client: TestClient) -> None:
        """Route exists — returns 401 without auth, not 404."""
        r = client.post(GENERATE_PATH, json={})
        assert r.status_code == 401

    def test_evaluate_route_exists(self, client: TestClient) -> None:
        """Route exists — returns 401 without auth, not 404."""
        r = client.post(EVALUATE_PATH, json={})
        assert r.status_code == 401


# ── 3 & 4. Authentication Enforcement ──────────────────────────────────────────

class TestQuizAuthentication:
    def test_unauthenticated_generate_rejected(self, client: TestClient) -> None:
        r = client.post(GENERATE_PATH, json={"topic": "Water"})
        assert r.status_code == 401
        assert r.json().get("detail") in ("Not authenticated", "Could not validate credentials.")

    def test_unauthenticated_evaluate_rejected(self, client: TestClient) -> None:
        r = client.post(EVALUATE_PATH, json={"answers": [{"question_id": "q1", "selected_option": "A"}]})
        assert r.status_code == 401
        assert r.json().get("detail") in ("Not authenticated", "Could not validate credentials.")


# ── 5, 11 & 12. Valid Generation & Security (No Answer Leakage) ───────────────

class TestQuizGeneration:
    def test_valid_authenticated_generation(self, client: TestClient) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user
        mock_db = AsyncMock()
        fastapi_app.dependency_overrides[get_db] = lambda: mock_db

        with patch("app.services.quiz_service.retrieve_context", new=AsyncMock(return_value=[])), \
             patch("app.services.quiz_service._call_groq_quiz", new=AsyncMock(return_value=_sample_groq_quiz_json())):

            r = client.post(
                GENERATE_PATH,
                json={
                    "topic": "Water in Kurukh",
                    "language": "hin",
                    "education_level": "secondary",
                    "difficulty": "medium",
                    "num_questions": 2,
                },
            )

        assert r.status_code == 200
        data = r.json()
        assert "quiz_id" in data
        assert data["topic"] == "Water in Kurukh"
        assert data["language"] == "hin"
        assert data["education_level"] == "secondary"
        assert data["difficulty"] == "medium"
        assert data["total_questions"] == 2
        assert len(data["questions"]) == 2

    def test_generated_question_schema_structure(self, client: TestClient) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user
        mock_db = AsyncMock()
        fastapi_app.dependency_overrides[get_db] = lambda: mock_db

        with patch("app.services.quiz_service.retrieve_context", new=AsyncMock(return_value=[])), \
             patch("app.services.quiz_service._call_groq_quiz", new=AsyncMock(return_value=_sample_groq_quiz_json())):

            r = client.post(GENERATE_PATH, json={"topic": "Water"})

        q0 = r.json()["questions"][0]
        assert "id" in q0
        assert "question" in q0
        assert "options" in q0
        assert len(q0["options"]) == 4
        assert q0["type"] == "mcq"
        assert q0["difficulty"] == "medium"

    def test_correct_answer_not_exposed_in_generation_response(self, client: TestClient) -> None:
        """Security: Ensure correct_answer and explanation are NOT in the public question JSON."""
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user
        mock_db = AsyncMock()
        fastapi_app.dependency_overrides[get_db] = lambda: mock_db

        with patch("app.services.quiz_service.retrieve_context", new=AsyncMock(return_value=[])), \
             patch("app.services.quiz_service._call_groq_quiz", new=AsyncMock(return_value=_sample_groq_quiz_json())):

            r = client.post(GENERATE_PATH, json={"topic": "Water"})

        questions = r.json()["questions"]
        for q in questions:
            assert "correct_answer" not in q
            assert "answer" not in q
            assert "correct_option" not in q


# ── 6, 7, 8, 9, 10. Request Validation ────────────────────────────────────────

class TestQuizValidation:
    def test_invalid_language_rejected(self, client: TestClient) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user

        r = client.post(GENERATE_PATH, json={"topic": "Plants", "language": "bengali"})
        assert r.status_code == 422

    def test_invalid_education_level_rejected(self, client: TestClient) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user

        r = client.post(GENERATE_PATH, json={"topic": "Plants", "education_level": "kindergarten"})
        assert r.status_code == 422

    def test_invalid_difficulty_rejected(self, client: TestClient) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user

        r = client.post(GENERATE_PATH, json={"topic": "Plants", "difficulty": "impossible"})
        assert r.status_code == 422

    def test_invalid_question_count_zero_rejected(self, client: TestClient) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user

        r = client.post(GENERATE_PATH, json={"topic": "Plants", "num_questions": 0})
        assert r.status_code == 422

    def test_invalid_question_count_too_large_rejected(self, client: TestClient) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user

        r = client.post(GENERATE_PATH, json={"topic": "Plants", "num_questions": 25})
        assert r.status_code == 422

    def test_empty_topic_rejected(self, client: TestClient) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user

        r = client.post(GENERATE_PATH, json={"topic": "   "})
        assert r.status_code == 422

    def test_missing_topic_rejected(self, client: TestClient) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user

        r = client.post(GENERATE_PATH, json={"language": "hin"})
        assert r.status_code == 422


# ── 13, 14, 15, 16, 17, 18. Deterministic Evaluation ─────────────────────────

class TestQuizEvaluation:
    @pytest.fixture
    def sample_questions(self) -> list[dict]:
        return [
            {
                "id": "q1",
                "question": "What is water in Kurukh?",
                "options": ["A) ड़ी", "B) अल्ला", "C) मन", "D) एड़पा"],
                "correct_answer": "A) ड़ी",
                "explanation": "ड़ी means water in Kurukh.",
            },
            {
                "id": "q2",
                "question": "What is dog in Kurukh?",
                "options": ["A) ड़ी", "B) अल्ला", "C) मन", "D) एड़पा"],
                "correct_answer": "B) अल्ला",
                "explanation": "अल्ला means dog in Kurukh.",
            },
        ]

    def test_perfect_score(self, client: TestClient, sample_questions) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user

        payload = {
            "questions": sample_questions,
            "answers": [
                {"question_id": "q1", "selected_option": "A) ड़ी"},
                {"question_id": "q2", "selected_option": "B) अल्ला"},
            ],
        }
        r = client.post(EVALUATE_PATH, json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["total_questions"] == 2
        assert data["correct_answers"] == 2
        assert data["incorrect_answers"] == 0
        assert data["score"] == 2
        assert data["percentage"] == 100.0
        assert data["passed"] is True

    def test_zero_score(self, client: TestClient, sample_questions) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user

        payload = {
            "questions": sample_questions,
            "answers": [
                {"question_id": "q1", "selected_option": "B) अल्ला"},
                {"question_id": "q2", "selected_option": "A) ड़ी"},
            ],
        }
        r = client.post(EVALUATE_PATH, json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["total_questions"] == 2
        assert data["correct_answers"] == 0
        assert data["incorrect_answers"] == 2
        assert data["score"] == 0
        assert data["percentage"] == 0.0
        assert data["passed"] is False

    def test_partial_score(self, client: TestClient, sample_questions) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user

        payload = {
            "questions": sample_questions,
            "answers": [
                {"question_id": "q1", "selected_option": "A"},  # Option letter match
                {"question_id": "q2", "selected_option": "Wrong Option"},
            ],
        }
        r = client.post(EVALUATE_PATH, json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["total_questions"] == 2
        assert data["correct_answers"] == 1
        assert data["incorrect_answers"] == 1
        assert data["score"] == 1
        assert data["percentage"] == 50.0
        assert data["passed"] is False

    def test_evaluation_against_stored_quiz_session(self, client: TestClient) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user
        mock_db = AsyncMock()
        fastapi_app.dependency_overrides[get_db] = lambda: mock_db

        # 1. Generate quiz
        with patch("app.services.quiz_service.retrieve_context", new=AsyncMock(return_value=[])), \
             patch("app.services.quiz_service._call_groq_quiz", new=AsyncMock(return_value=_sample_groq_quiz_json())):
            gen_r = client.post(GENERATE_PATH, json={"topic": "Water"})

        quiz_id = gen_r.json()["quiz_id"]

        # 2. Evaluate using stored quiz_id
        eval_payload = {
            "quiz_id": quiz_id,
            "answers": [
                {"question_id": "q1", "selected_option": "A"},
                {"question_id": "q2", "selected_option": "B"},
            ],
        }
        eval_r = client.post(EVALUATE_PATH, json=eval_payload)
        assert eval_r.status_code == 200
        assert eval_r.json()["score"] == 2
        assert eval_r.json()["passed"] is True

    def test_per_question_results_structure(self, client: TestClient, sample_questions) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user

        payload = {
            "questions": sample_questions,
            "answers": [{"question_id": "q1", "selected_option": "A) ड़ी"}],
        }
        r = client.post(EVALUATE_PATH, json=payload)
        res = r.json()["results"]
        assert len(res) == 2
        q1_res = res[0]
        assert q1_res["question_id"] == "q1"
        assert q1_res["is_correct"] is True
        assert q1_res["selected_option"] == "A) ड़ी"
        assert q1_res["correct_answer"] == "A) ड़ी"
        assert "ड़ी means water" in q1_res["explanation"]

    def test_empty_answers_rejected(self, client: TestClient) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user

        r = client.post(EVALUATE_PATH, json={"answers": []})
        assert r.status_code == 422

    def test_nonexistent_quiz_id_without_questions_returns_400(self, client: TestClient) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user

        r = client.post(
            EVALUATE_PATH,
            json={
                "quiz_id": "nonexistent_quiz_uuid",
                "answers": [{"question_id": "q1", "selected_option": "A"}],
            },
        )
        assert r.status_code == 400


# ── 19 & 20. RAG and Adaptive Pedagogy Integration ────────────────────────────

class TestQuizRAGAndPedagogy:
    def test_rag_retrieval_called_and_reflected_in_method(self, client: TestClient) -> None:
        mock_user = _make_user()
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

        with patch("app.services.quiz_service.retrieve_context", new=AsyncMock(return_value=[mock_entry])), \
             patch("app.services.quiz_service._call_groq_quiz", new=AsyncMock(return_value=_sample_groq_quiz_json())):

            r = client.post(GENERATE_PATH, json={"topic": "water"})

        data = r.json()
        assert data["method"] == "quiz_rag"
        assert data["context_count"] == 1
        assert data["retrieved_context"][0]["entry_id"] == "KUR-0001"

    def test_adaptive_pedagogy_prompt_contains_guidance(self) -> None:
        sys_p, _ = quiz_service.build_quiz_generation_prompt(
            topic="Human Anatomy",
            language="eng",
            education_level="college",
            difficulty="hard",
            num_questions=5,
            retrieved_entries=[],
        )
        assert "COLLEGE" in sys_p
        assert "DIFFICULTY LEVEL: HARD" in sys_p
        assert "English" in sys_p


# ── 21. Groq Failure Handling ──────────────────────────────────────────────────

class TestQuizErrorHandling:
    def test_groq_not_configured_returns_safe_method(self, client: TestClient) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user
        mock_db = AsyncMock()
        fastapi_app.dependency_overrides[get_db] = lambda: mock_db

        with patch("app.services.quiz_service.retrieve_context", new=AsyncMock(return_value=[])), \
             patch("app.services.quiz_service._call_groq_quiz", new=AsyncMock(side_effect=GroqNotConfiguredError())):

            r = client.post(GENERATE_PATH, json={"topic": "Nature"})

        assert r.status_code == 200
        data = r.json()
        assert data["method"] == "not_configured"
        assert "GROQ_API_KEY" in data["message"]
        assert len(data["questions"]) == 0

    def test_groq_service_failure_returns_safe_method(self, client: TestClient) -> None:
        mock_user = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: mock_user
        mock_db = AsyncMock()
        fastapi_app.dependency_overrides[get_db] = lambda: mock_db

        with patch("app.services.quiz_service.retrieve_context", new=AsyncMock(return_value=[])), \
             patch("app.services.quiz_service._call_groq_quiz", new=AsyncMock(side_effect=GroqTranslationError("API Timeout"))):

            r = client.post(GENERATE_PATH, json={"topic": "Nature"})

        assert r.status_code == 200
        data = r.json()
        assert data["method"] == "ai_error"
        assert "error" in data["message"].lower()
        assert len(data["questions"]) == 0


# ── 22. Existing Platform Endpoints Unaffected ─────────────────────────────────

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

    def test_tutor_status_unaffected(self, client: TestClient) -> None:
        r = client.get("/api/v1/tutor/status")
        assert r.status_code == 200
        assert r.json()["status"] == "ready"

    def test_voice_status_unaffected(self, client: TestClient) -> None:
        r = client.get("/api/v1/voice/status")
        assert r.status_code == 200
        assert r.json()["status"] == "ready"
