"""
Tests for Student Learning Progress & Activity Engine.

Covers all 20 required acceptance criteria:
1.  Progress status endpoint (GET /api/v1/progress/status)
2.  /progress/me requires authentication (HTTP 401 without token)
3.  /progress/record requires authentication (HTTP 401 without token)
4.  /progress/students requires authentication (HTTP 401 without token)
5.  Student role cannot access /progress/students (HTTP 403)
6.  Teacher role can access /progress/students
7.  Valid activity recording succeeds with expected response schema
8.  Invalid activity type rejected (HTTP 422)
9.  Invalid score (negative) rejected (HTTP 422)
10. Invalid percentage (> 100 or < 0) rejected (HTTP 422)
11. Authenticated user's ID is always used (client cannot override user_id)
12. XP calculation: quiz=20, lesson=30, practice=10, incomplete=0
13. Progress aggregation returns correct total counts
14. Multiple activities accumulate correctly across types
15. Quiz average percentage calculation (across completed quizzes only)
16. Lesson completion count is accurate
17. Practice session count is accurate
18. Empty student progress returns zero-valued summary
19. Malformed request body returns HTTP 422
20. Existing platform endpoints are unaffected by progress module addition
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.core.security import get_current_user, require_role
from app.database import get_db
from app.main import app as fastapi_app
from app.models.progress import LearningActivity
from app.models.user import User
from app.schemas.progress import (
    ActivityResponse,
    RecordActivityRequest,
    StudentListProgressResponse,
    StudentProgressSummary,
)
from app.services import progress_service

STATUS_PATH = "/api/v1/progress/status"
ME_PATH = "/api/v1/progress/me"
RECORD_PATH = "/api/v1/progress/record"
STUDENTS_PATH = "/api/v1/progress/students"


# ── Fixtures ───────────────────────────────────────────────────────────────────

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
    username: str = "test_student",
    role: str = "student",
) -> User:
    user = MagicMock(spec=User)
    user.id = id
    user.username = username
    user.role = role
    return user


def _make_teacher(
    id: int = 99,
    username: str = "test_teacher",
) -> User:
    return _make_user(id=id, username=username, role="teacher")


def _make_activity(
    id: str = "act-001",
    user_id: int = 1,
    activity_type: str = "quiz",
    activity_id: Optional[str] = None,
    score: Optional[int] = 4,
    percentage: Optional[float] = 80.0,
    completed: bool = True,
    language: Optional[str] = "hin",
    education_level: Optional[str] = "secondary",
    created_at: Optional[datetime] = None,
) -> LearningActivity:
    act = MagicMock(spec=LearningActivity)
    act.id = id
    act.user_id = user_id
    act.activity_type = activity_type
    act.activity_id = activity_id
    act.score = score
    act.percentage = percentage
    act.completed = completed
    act.language = language
    act.education_level = education_level
    act.created_at = created_at or datetime.now(timezone.utc)
    return act


def _sample_activity_response(**kwargs) -> ActivityResponse:
    defaults = dict(
        id="act-001",
        user_id=1,
        activity_type="quiz",
        activity_id=None,
        score=4,
        percentage=80.0,
        completed=True,
        language="hin",
        education_level="secondary",
        xp_earned=20,
        created_at=datetime.now(timezone.utc),
    )
    defaults.update(kwargs)
    return ActivityResponse(**defaults)


def _sample_progress_summary(**kwargs) -> StudentProgressSummary:
    defaults = dict(
        user_id=1,
        username="test_student",
        role="student",
        total_activities=3,
        completed_activities=3,
        quizzes_completed=1,
        lessons_completed=1,
        practice_sessions=1,
        average_quiz_percentage=80.0,
        total_xp=60,
    )
    defaults.update(kwargs)
    return StudentProgressSummary(**defaults)


# ── 1. Progress Status Endpoint ────────────────────────────────────────────────

class TestProgressStatus:
    def test_status_returns_200(self, client: TestClient) -> None:
        r = client.get(STATUS_PATH)
        assert r.status_code == 200
        data = r.json()
        assert data["module"] == "progress"
        assert data["status"] == "ready"

    def test_status_no_auth_required(self, client: TestClient) -> None:
        """Status endpoint must be publicly accessible without authentication."""
        r = client.get(STATUS_PATH)
        assert r.status_code == 200


# ── 2 & 3 & 4. Authentication Enforcement ──────────────────────────────────────

class TestProgressAuthentication:
    def test_me_requires_auth(self, client: TestClient) -> None:
        r = client.get(ME_PATH)
        assert r.status_code == 401
        detail = r.json().get("detail", "")
        assert detail in ("Not authenticated", "Could not validate credentials.")

    def test_record_requires_auth(self, client: TestClient) -> None:
        r = client.post(RECORD_PATH, json={"activity_type": "quiz"})
        assert r.status_code == 401

    def test_students_requires_auth(self, client: TestClient) -> None:
        r = client.get(STUDENTS_PATH)
        assert r.status_code == 401


# ── 5 & 6. Role Enforcement on /students ──────────────────────────────────────

class TestRoleEnforcement:
    def test_student_cannot_access_students_endpoint(self, client: TestClient) -> None:
        """Students must receive HTTP 403 when accessing the teacher-only endpoint."""
        student = _make_user(role="student")
        fastapi_app.dependency_overrides[get_current_user] = lambda: student

        r = client.get(STUDENTS_PATH)
        assert r.status_code == 403
        assert "403" in str(r.status_code)

    def test_teacher_can_access_students_endpoint(self, client: TestClient) -> None:
        """Teachers must receive HTTP 200 with a valid students list."""
        teacher = _make_teacher()
        fastapi_app.dependency_overrides[get_current_user] = lambda: teacher
        mock_db = AsyncMock()

        async def _mock_list_students_progress(db) -> StudentListProgressResponse:
            return StudentListProgressResponse(students=[], total_students=0)

        with patch.object(
            progress_service,
            "list_students_progress",
            new=_mock_list_students_progress,
        ):
            fastapi_app.dependency_overrides[get_db] = lambda: mock_db
            r = client.get(STUDENTS_PATH)

        assert r.status_code == 200
        data = r.json()
        assert "students" in data
        assert "total_students" in data


# ── 7. Valid Activity Recording ────────────────────────────────────────────────

class TestActivityRecording:
    def test_valid_quiz_activity_recorded(self, client: TestClient) -> None:
        student = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: student
        mock_db = AsyncMock()

        async def _mock_record(request, user, db) -> ActivityResponse:
            return _sample_activity_response(
                activity_type=request.activity_type,
                user_id=user.id,
                xp_earned=20,
            )

        with patch.object(progress_service, "record_activity", new=_mock_record):
            fastapi_app.dependency_overrides[get_db] = lambda: mock_db
            r = client.post(
                RECORD_PATH,
                json={
                    "activity_type": "quiz",
                    "score": 4,
                    "percentage": 80.0,
                    "completed": True,
                    "language": "hin",
                    "education_level": "secondary",
                },
            )

        assert r.status_code == 201
        data = r.json()
        assert data["activity_type"] == "quiz"
        assert data["user_id"] == 1
        assert "id" in data
        assert "xp_earned" in data
        assert "created_at" in data

    def test_valid_lesson_activity_recorded(self, client: TestClient) -> None:
        student = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: student
        mock_db = AsyncMock()

        async def _mock_record(request, user, db) -> ActivityResponse:
            return _sample_activity_response(activity_type="lesson", xp_earned=30)

        with patch.object(progress_service, "record_activity", new=_mock_record):
            fastapi_app.dependency_overrides[get_db] = lambda: mock_db
            r = client.post(RECORD_PATH, json={"activity_type": "lesson", "completed": True})

        assert r.status_code == 201
        assert r.json()["xp_earned"] == 30

    def test_valid_practice_activity_recorded(self, client: TestClient) -> None:
        student = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: student
        mock_db = AsyncMock()

        async def _mock_record(request, user, db) -> ActivityResponse:
            return _sample_activity_response(activity_type="practice", xp_earned=10)

        with patch.object(progress_service, "record_activity", new=_mock_record):
            fastapi_app.dependency_overrides[get_db] = lambda: mock_db
            r = client.post(RECORD_PATH, json={"activity_type": "practice", "completed": True})

        assert r.status_code == 201
        assert r.json()["xp_earned"] == 10

    def test_response_schema_complete(self, client: TestClient) -> None:
        """Response must include all required fields."""
        student = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: student
        mock_db = AsyncMock()

        async def _mock_record(request, user, db) -> ActivityResponse:
            return _sample_activity_response()

        with patch.object(progress_service, "record_activity", new=_mock_record):
            fastapi_app.dependency_overrides[get_db] = lambda: mock_db
            r = client.post(RECORD_PATH, json={"activity_type": "quiz"})

        data = r.json()
        required_fields = {
            "id", "user_id", "activity_type", "completed",
            "xp_earned", "created_at",
        }
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"


# ── 8. Invalid Activity Type ───────────────────────────────────────────────────

class TestActivityTypeValidation:
    def test_invalid_activity_type_rejected(self, client: TestClient) -> None:
        student = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: student

        r = client.post(RECORD_PATH, json={"activity_type": "exam"})
        assert r.status_code == 422

    def test_empty_activity_type_rejected(self, client: TestClient) -> None:
        student = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: student

        r = client.post(RECORD_PATH, json={"activity_type": ""})
        assert r.status_code == 422

    def test_missing_activity_type_rejected(self, client: TestClient) -> None:
        student = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: student

        r = client.post(RECORD_PATH, json={"completed": True})
        assert r.status_code == 422


# ── 9. Invalid Score Validation ────────────────────────────────────────────────

class TestScoreValidation:
    def test_negative_score_rejected(self, client: TestClient) -> None:
        student = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: student

        r = client.post(RECORD_PATH, json={"activity_type": "quiz", "score": -1})
        assert r.status_code == 422

    def test_zero_score_accepted(self, client: TestClient) -> None:
        """Score of 0 is valid (student got nothing correct)."""
        student = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: student
        mock_db = AsyncMock()

        async def _mock_record(request, user, db) -> ActivityResponse:
            return _sample_activity_response(score=0, percentage=0.0, xp_earned=20)

        with patch.object(progress_service, "record_activity", new=_mock_record):
            fastapi_app.dependency_overrides[get_db] = lambda: mock_db
            r = client.post(
                RECORD_PATH,
                json={"activity_type": "quiz", "score": 0, "percentage": 0.0, "completed": True},
            )

        assert r.status_code == 201


# ── 10. Invalid Percentage Validation ─────────────────────────────────────────

class TestPercentageValidation:
    def test_percentage_above_100_rejected(self, client: TestClient) -> None:
        student = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: student

        r = client.post(
            RECORD_PATH,
            json={"activity_type": "quiz", "percentage": 101.0},
        )
        assert r.status_code == 422

    def test_negative_percentage_rejected(self, client: TestClient) -> None:
        student = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: student

        r = client.post(
            RECORD_PATH,
            json={"activity_type": "quiz", "percentage": -5.0},
        )
        assert r.status_code == 422

    def test_percentage_100_accepted(self, client: TestClient) -> None:
        student = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: student
        mock_db = AsyncMock()

        async def _mock_record(request, user, db) -> ActivityResponse:
            return _sample_activity_response(percentage=100.0)

        with patch.object(progress_service, "record_activity", new=_mock_record):
            fastapi_app.dependency_overrides[get_db] = lambda: mock_db
            r = client.post(
                RECORD_PATH,
                json={"activity_type": "quiz", "percentage": 100.0, "completed": True},
            )
        assert r.status_code == 201

    def test_percentage_0_accepted(self, client: TestClient) -> None:
        student = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: student
        mock_db = AsyncMock()

        async def _mock_record(request, user, db) -> ActivityResponse:
            return _sample_activity_response(percentage=0.0, xp_earned=20)

        with patch.object(progress_service, "record_activity", new=_mock_record):
            fastapi_app.dependency_overrides[get_db] = lambda: mock_db
            r = client.post(
                RECORD_PATH,
                json={"activity_type": "quiz", "percentage": 0.0, "completed": True},
            )
        assert r.status_code == 201


# ── 11. User ID Security (server-side always) ──────────────────────────────────

class TestUserIdSecurity:
    def test_authenticated_user_id_always_used(self, client: TestClient) -> None:
        """The service must use user.id from get_current_user, not any submitted value."""
        student = _make_user(id=42, username="real_student")
        fastapi_app.dependency_overrides[get_current_user] = lambda: student
        mock_db = AsyncMock()

        captured_user_id = {}

        async def _mock_record(request, user, db) -> ActivityResponse:
            captured_user_id["id"] = user.id  # must be 42
            return _sample_activity_response(user_id=user.id)

        with patch.object(progress_service, "record_activity", new=_mock_record):
            fastapi_app.dependency_overrides[get_db] = lambda: mock_db
            r = client.post(
                RECORD_PATH,
                json={"activity_type": "quiz", "completed": True},
            )

        assert r.status_code == 201
        assert captured_user_id["id"] == 42
        assert r.json()["user_id"] == 42

    def test_user_id_in_response_matches_authenticated_user(self, client: TestClient) -> None:
        student = _make_user(id=7, username="student_7")
        fastapi_app.dependency_overrides[get_current_user] = lambda: student
        mock_db = AsyncMock()

        async def _mock_record(request, user, db) -> ActivityResponse:
            return _sample_activity_response(user_id=7)

        with patch.object(progress_service, "record_activity", new=_mock_record):
            fastapi_app.dependency_overrides[get_db] = lambda: mock_db
            r = client.post(RECORD_PATH, json={"activity_type": "lesson"})

        assert r.json()["user_id"] == 7


# ── 12. XP Calculation (Unit Tests on Service) ────────────────────────────────

class TestXPCalculation:
    def test_completed_quiz_earns_20_xp(self) -> None:
        xp = progress_service._calculate_xp("quiz", completed=True)
        assert xp == 20

    def test_completed_lesson_earns_30_xp(self) -> None:
        xp = progress_service._calculate_xp("lesson", completed=True)
        assert xp == 30

    def test_completed_practice_earns_10_xp(self) -> None:
        xp = progress_service._calculate_xp("practice", completed=True)
        assert xp == 10

    def test_incomplete_quiz_earns_zero_xp(self) -> None:
        xp = progress_service._calculate_xp("quiz", completed=False)
        assert xp == 0

    def test_incomplete_lesson_earns_zero_xp(self) -> None:
        xp = progress_service._calculate_xp("lesson", completed=False)
        assert xp == 0

    def test_incomplete_practice_earns_zero_xp(self) -> None:
        xp = progress_service._calculate_xp("practice", completed=False)
        assert xp == 0

    def test_xp_rules_dict_is_complete(self) -> None:
        """Ensure XP rules cover all 3 supported activity types."""
        for act_type in ("quiz", "lesson", "practice"):
            assert act_type in progress_service._XP_RULES
            assert progress_service._XP_RULES[act_type] > 0


# ── 13 & 14. Progress Aggregation ─────────────────────────────────────────────

class TestProgressAggregation:
    def test_aggregate_single_quiz(self) -> None:
        activities = [_make_activity(activity_type="quiz", percentage=80.0, completed=True)]
        stats = progress_service._aggregate_activities(activities)
        assert stats["total_activities"] == 1
        assert stats["completed_activities"] == 1
        assert stats["quizzes_completed"] == 1
        assert stats["lessons_completed"] == 0
        assert stats["practice_sessions"] == 0
        assert stats["average_quiz_percentage"] == 80.0
        assert stats["total_xp"] == 20

    def test_aggregate_multiple_types(self) -> None:
        activities = [
            _make_activity(id="a1", activity_type="quiz", percentage=80.0, completed=True),
            _make_activity(id="a2", activity_type="lesson", percentage=None, completed=True),
            _make_activity(id="a3", activity_type="practice", percentage=None, completed=True),
        ]
        stats = progress_service._aggregate_activities(activities)
        assert stats["total_activities"] == 3
        assert stats["completed_activities"] == 3
        assert stats["quizzes_completed"] == 1
        assert stats["lessons_completed"] == 1
        assert stats["practice_sessions"] == 1
        assert stats["total_xp"] == 60  # 20 + 30 + 10

    def test_aggregate_mix_of_complete_and_incomplete(self) -> None:
        activities = [
            _make_activity(id="a1", activity_type="quiz", percentage=90.0, completed=True),
            _make_activity(id="a2", activity_type="quiz", percentage=60.0, completed=False),
            _make_activity(id="a3", activity_type="lesson", percentage=None, completed=True),
        ]
        stats = progress_service._aggregate_activities(activities)
        assert stats["total_activities"] == 3
        assert stats["completed_activities"] == 2
        assert stats["quizzes_completed"] == 1  # Only completed quizzes
        assert stats["lessons_completed"] == 1
        assert stats["total_xp"] == 50  # 20 (quiz) + 30 (lesson) + 0 (incomplete quiz)


# ── 15. Quiz Average Percentage ───────────────────────────────────────────────

class TestQuizAveragePercentage:
    def test_average_quiz_percentage_single_quiz(self) -> None:
        activities = [_make_activity(activity_type="quiz", percentage=75.0, completed=True)]
        stats = progress_service._aggregate_activities(activities)
        assert stats["average_quiz_percentage"] == 75.0

    def test_average_quiz_percentage_multiple_quizzes(self) -> None:
        activities = [
            _make_activity(id="a1", activity_type="quiz", percentage=80.0, completed=True),
            _make_activity(id="a2", activity_type="quiz", percentage=60.0, completed=True),
            _make_activity(id="a3", activity_type="quiz", percentage=100.0, completed=True),
        ]
        stats = progress_service._aggregate_activities(activities)
        assert stats["average_quiz_percentage"] == 80.0  # (80+60+100)/3

    def test_average_quiz_percentage_excludes_no_percentage(self) -> None:
        """Quizzes without a percentage recorded don't count toward average."""
        activities = [
            _make_activity(id="a1", activity_type="quiz", percentage=90.0, completed=True),
            _make_activity(id="a2", activity_type="quiz", percentage=None, completed=True),
        ]
        stats = progress_service._aggregate_activities(activities)
        assert stats["average_quiz_percentage"] == 90.0

    def test_average_quiz_percentage_excludes_incomplete_quizzes(self) -> None:
        activities = [
            _make_activity(id="a1", activity_type="quiz", percentage=80.0, completed=True),
            _make_activity(id="a2", activity_type="quiz", percentage=20.0, completed=False),
        ]
        stats = progress_service._aggregate_activities(activities)
        assert stats["average_quiz_percentage"] == 80.0

    def test_average_quiz_percentage_no_quizzes_returns_zero(self) -> None:
        activities = [_make_activity(activity_type="lesson", completed=True)]
        stats = progress_service._aggregate_activities(activities)
        assert stats["average_quiz_percentage"] == 0.0


# ── 16. Lesson Completion Count ───────────────────────────────────────────────

class TestLessonCompletion:
    def test_lesson_count_correct(self) -> None:
        activities = [
            _make_activity(id="l1", activity_type="lesson", completed=True),
            _make_activity(id="l2", activity_type="lesson", completed=True),
            _make_activity(id="l3", activity_type="lesson", completed=False),
            _make_activity(id="q1", activity_type="quiz", completed=True),
        ]
        stats = progress_service._aggregate_activities(activities)
        assert stats["lessons_completed"] == 2

    def test_lesson_count_zero_when_none(self) -> None:
        activities = [_make_activity(activity_type="quiz", completed=True)]
        stats = progress_service._aggregate_activities(activities)
        assert stats["lessons_completed"] == 0


# ── 17. Practice Count ────────────────────────────────────────────────────────

class TestPracticeCount:
    def test_practice_count_correct(self) -> None:
        activities = [
            _make_activity(id="p1", activity_type="practice", completed=True),
            _make_activity(id="p2", activity_type="practice", completed=True),
            _make_activity(id="p3", activity_type="practice", completed=False),
        ]
        stats = progress_service._aggregate_activities(activities)
        assert stats["practice_sessions"] == 2

    def test_practice_count_zero_when_none(self) -> None:
        activities = [_make_activity(activity_type="quiz", completed=True)]
        stats = progress_service._aggregate_activities(activities)
        assert stats["practice_sessions"] == 0


# ── 18. Empty Student Progress ────────────────────────────────────────────────

class TestEmptyProgress:
    def test_empty_activities_returns_all_zeros(self) -> None:
        stats = progress_service._aggregate_activities([])
        assert stats["total_activities"] == 0
        assert stats["completed_activities"] == 0
        assert stats["quizzes_completed"] == 0
        assert stats["lessons_completed"] == 0
        assert stats["practice_sessions"] == 0
        assert stats["average_quiz_percentage"] == 0.0
        assert stats["total_xp"] == 0

    def test_me_endpoint_returns_zeros_for_new_user(self, client: TestClient) -> None:
        student = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: student
        mock_db = AsyncMock()

        empty_summary = StudentProgressSummary(
            user_id=1,
            username="test_student",
            role="student",
            total_activities=0,
            completed_activities=0,
            quizzes_completed=0,
            lessons_completed=0,
            practice_sessions=0,
            average_quiz_percentage=0.0,
            total_xp=0,
        )

        async def _mock_get_progress(user, db) -> StudentProgressSummary:
            return empty_summary

        with patch.object(progress_service, "get_my_progress", new=_mock_get_progress):
            fastapi_app.dependency_overrides[get_db] = lambda: mock_db
            r = client.get(ME_PATH)

        assert r.status_code == 200
        data = r.json()
        assert data["total_activities"] == 0
        assert data["total_xp"] == 0
        assert data["average_quiz_percentage"] == 0.0


# ── 19. Malformed Request Handling ────────────────────────────────────────────

class TestMalformedRequests:
    def test_completely_empty_body_rejected(self, client: TestClient) -> None:
        student = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: student
        r = client.post(RECORD_PATH, json={})
        assert r.status_code == 422

    def test_invalid_language_rejected(self, client: TestClient) -> None:
        student = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: student
        r = client.post(
            RECORD_PATH,
            json={"activity_type": "quiz", "language": "francais"},
        )
        assert r.status_code == 422

    def test_invalid_education_level_rejected(self, client: TestClient) -> None:
        student = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: student
        r = client.post(
            RECORD_PATH,
            json={"activity_type": "quiz", "education_level": "kindergarten"},
        )
        assert r.status_code == 422

    def test_non_json_body_rejected(self, client: TestClient) -> None:
        student = _make_user()
        fastapi_app.dependency_overrides[get_current_user] = lambda: student
        r = client.post(
            RECORD_PATH,
            content="this is not json",
            headers={"Content-Type": "application/json"},
        )
        assert r.status_code == 422


# ── 20. Existing Endpoints Remain Unaffected ──────────────────────────────────

class TestExistingEndpointsUnaffected:
    def test_auth_status_unaffected(self, client: TestClient) -> None:
        r = client.get("/api/v1/auth/status")
        assert r.status_code == 200

    def test_translation_status_unaffected(self, client: TestClient) -> None:
        r = client.get("/api/v1/translation/status")
        assert r.status_code == 200

    def test_vocabulary_status_unaffected(self, client: TestClient) -> None:
        r = client.get("/api/v1/vocabulary/status")
        assert r.status_code == 200

    def test_qa_status_unaffected(self, client: TestClient) -> None:
        r = client.get("/api/v1/qa/status")
        assert r.status_code == 200

    def test_tutor_status_unaffected(self, client: TestClient) -> None:
        r = client.get("/api/v1/tutor/status")
        assert r.status_code == 200

    def test_voice_status_unaffected(self, client: TestClient) -> None:
        r = client.get("/api/v1/voice/status")
        assert r.status_code == 200

    def test_quizzes_status_unaffected(self, client: TestClient) -> None:
        r = client.get("/api/v1/quizzes/status")
        assert r.status_code == 200

    def test_progress_status_returns_module_field(self, client: TestClient) -> None:
        r = client.get(STATUS_PATH)
        assert r.json()["module"] == "progress"
