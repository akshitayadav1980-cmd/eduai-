"""
Pydantic schemas for Student Learning Progress and Activity Recording.

Endpoints:
    GET  /api/v1/progress/status   — health check
    GET  /api/v1/progress/me       — student's personal learning progress summary
    POST /api/v1/progress/record   — record a completed learning activity
    GET  /api/v1/progress/students — teacher overview of student progress
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.qa import SUPPORTED_EDUCATION_LEVELS, SUPPORTED_LANG_CODES

SUPPORTED_ACTIVITY_TYPES: frozenset[str] = frozenset({"quiz", "lesson", "practice"})


# ── Activity Recording Request & Response ──────────────────────────────────────

class RecordActivityRequest(BaseModel):
    """
    Body for POST /api/v1/progress/record.

    Security rule: The client CANNOT supply a user_id. The activity is always
    associated with the authenticated user from get_current_user.
    """

    activity_type: str = Field(
        ...,
        description="Type of activity: quiz, lesson, or practice.",
        examples=["quiz", "lesson", "practice"],
    )
    activity_id: Optional[str] = Field(
        default=None,
        description="Optional identifier of the lesson, quiz, or topic.",
        examples=["lesson-hi-001", "quiz-nature-01"],
    )
    score: Optional[int] = Field(
        default=None,
        description="Score achieved (e.g. number of correct questions). Must be >= 0.",
        ge=0,
        examples=[4],
    )
    percentage: Optional[float] = Field(
        default=None,
        description="Percentage achieved (0.0 to 100.0).",
        ge=0.0,
        le=100.0,
        examples=[80.0],
    )
    completed: bool = Field(
        default=True,
        description="Whether the activity was completed.",
    )
    language: Optional[str] = Field(
        default=None,
        description="Language code used during the activity (kru, hin, eng).",
        examples=["hin", "kru", "eng"],
    )
    education_level: Optional[str] = Field(
        default=None,
        description="Education level calibrated for the activity.",
        examples=["primary", "secondary", "higher_secondary", "college", "professional"],
    )

    @field_validator("activity_type")
    @classmethod
    def validate_activity_type(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in SUPPORTED_ACTIVITY_TYPES:
            raise ValueError(
                f"activity_type '{v}' is invalid. Supported types: {sorted(SUPPORTED_ACTIVITY_TYPES)}."
            )
        return v

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip().lower()
            if v not in SUPPORTED_LANG_CODES:
                raise ValueError(
                    f"language '{v}' is not supported. Supported codes: {sorted(SUPPORTED_LANG_CODES)}."
                )
        return v

    @field_validator("education_level")
    @classmethod
    def validate_education_level(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip().lower()
            if v not in SUPPORTED_EDUCATION_LEVELS:
                raise ValueError(
                    f"education_level '{v}' is not supported. Supported values: {sorted(SUPPORTED_EDUCATION_LEVELS)}."
                )
        return v


class ActivityResponse(BaseModel):
    """Response returned when an activity is recorded."""

    id: str = Field(description="Unique activity record identifier.")
    user_id: int = Field(description="Authenticated user ID.")
    activity_type: str = Field(description="Activity type: quiz, lesson, or practice.")
    activity_id: Optional[str] = Field(default=None, description="Topic or activity identifier.")
    score: Optional[int] = Field(default=None, description="Score achieved.")
    percentage: Optional[float] = Field(default=None, description="Percentage achieved.")
    completed: bool = Field(description="Completion status.")
    language: Optional[str] = Field(default=None, description="Language code.")
    education_level: Optional[str] = Field(default=None, description="Education level.")
    xp_earned: int = Field(description="XP awarded for this activity.")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp when the activity was completed/recorded.",
    )


# ── Student Personal Progress Summary ──────────────────────────────────────────

class StudentProgressSummary(BaseModel):
    """Response for GET /api/v1/progress/me."""

    user_id: int = Field(description="Authenticated user ID.")
    username: str = Field(description="Username.")
    role: str = Field(description="User role (student or teacher).")
    total_activities: int = Field(description="Total recorded activities.")
    completed_activities: int = Field(description="Count of completed activities.")
    quizzes_completed: int = Field(description="Count of completed quizzes.")
    lessons_completed: int = Field(description="Count of completed lessons.")
    practice_sessions: int = Field(description="Count of completed practice sessions.")
    average_quiz_percentage: float = Field(
        description="Average percentage across completed quizzes (0.0 if none)."
    )
    total_xp: int = Field(description="Total experience points (XP) accumulated.")


# ── Teacher Classroom Overview ─────────────────────────────────────────────────

class StudentProgressListItem(BaseModel):
    """Summary of an individual student for teacher overview."""

    student_id: int = Field(description="Student user ID.")
    username: str = Field(description="Student username.")
    total_activities: int = Field(description="Total recorded activities.")
    lessons_completed: int = Field(description="Count of completed lessons.")
    quizzes_completed: int = Field(description="Count of completed quizzes.")
    average_quiz_percentage: float = Field(
        description="Average quiz percentage (0.0 if none)."
    )
    total_xp: int = Field(description="Total experience points (XP).")


class StudentListProgressResponse(BaseModel):
    """Response for GET /api/v1/progress/students (Teacher view)."""

    students: list[StudentProgressListItem] = Field(
        default_factory=list,
        description="List of student progress summaries.",
    )
    total_students: int = Field(description="Total number of students found.")
