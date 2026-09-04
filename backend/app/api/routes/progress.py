"""
Progress router — /api/v1/progress

Endpoints:
  GET  /api/v1/progress/status       — architecture health check
  GET  /api/v1/progress/me           — authenticated student's progress summary
  POST /api/v1/progress/record       — record a completed learning activity
  GET  /api/v1/progress/students     — teacher-only view of all students' progress
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user, require_role
from app.database import get_db
from app.models.user import User
from app.schemas.progress import (
    ActivityResponse,
    RecordActivityRequest,
    StudentListProgressResponse,
    StudentProgressSummary,
)
import app.services.progress_service as progress_service

router = APIRouter(prefix="/progress", tags=["Progress"])

MODULE_NAME = "progress"


# ── Status ────────────────────────────────────────────────────────────────────

@router.get(
    "/status",
    summary="Progress module status",
    response_description="Confirms the progress module is reachable.",
)
def progress_status() -> dict[str, str]:
    """Architecture verification endpoint for the progress module."""
    return {"module": MODULE_NAME, "status": "ready"}


# ── GET /me — student personal progress summary ───────────────────────────────

@router.get(
    "/me",
    response_model=StudentProgressSummary,
    summary="Get my learning progress",
    response_description="Aggregated learning progress for the authenticated user.",
)
async def get_my_progress_endpoint(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StudentProgressSummary:
    """
    Return the authenticated user's cumulative learning progress.

    Includes: total activities, completed activities, quizzes, lessons, practice
    sessions, average quiz percentage, and total XP earned.
    """
    return await progress_service.get_my_progress(current_user, db)


# ── POST /record — record a learning activity ─────────────────────────────────

@router.post(
    "/record",
    response_model=ActivityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record a learning activity",
    response_description="The newly created activity record including XP earned.",
)
async def record_activity_endpoint(
    request: RecordActivityRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ActivityResponse:
    """
    Record a completed learning activity for the authenticated user.

    Security: The activity is always attributed to the authenticated user.
    The client cannot specify another user's ID.

    Validates:
    - activity_type (quiz, lesson, practice)
    - score (>= 0)
    - percentage (0.0–100.0)
    - language code (kru, hin, eng)
    - education_level (primary, secondary, higher_secondary, college, professional)
    """
    return await progress_service.record_activity(request, current_user, db)


# ── GET /students — teacher view of student progress ─────────────────────────

@router.get(
    "/students",
    response_model=StudentListProgressResponse,
    summary="List all students' progress (Teacher only)",
    response_description="Aggregated progress summary for every registered student.",
)
async def list_students_progress_endpoint(
    current_user: User = Depends(require_role("teacher")),  # noqa: ARG001
    db: AsyncSession = Depends(get_db),
) -> StudentListProgressResponse:
    """
    Return an overview of all students and their learning progress.

    Requires **teacher** role. Does NOT expose password hashes or secrets.

    Returns per-student: total activities, lessons completed, quizzes completed,
    average quiz percentage, and total XP.
    """
    return await progress_service.list_students_progress(db)
