"""
Progress Service — Learning Activity Recording and Aggregation.

XP Rules (deterministic, no LLM):
    Completed quiz     → 20 XP
    Completed lesson   → 30 XP
    Completed practice → 10 XP
    Incomplete activity → 0 XP

These rules are intentionally simple so the frontend can display progress
immediately. A more sophisticated XP system can be built on top of this
foundation by updating _XP_RULES without changing the database schema.
"""

from __future__ import annotations

import uuid
from typing import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.progress import LearningActivity
from app.models.user import User, UserRole
from app.schemas.progress import (
    ActivityResponse,
    RecordActivityRequest,
    StudentListProgressResponse,
    StudentProgressListItem,
    StudentProgressSummary,
)

# ── XP Award Rules ────────────────────────────────────────────────────────────
# Deterministic lookup. Only awarded when the activity is marked completed=True.
_XP_RULES: dict[str, int] = {
    "quiz": 20,
    "lesson": 30,
    "practice": 10,
}


def _calculate_xp(activity_type: str, completed: bool) -> int:
    """Return XP earned for one activity based on type and completion status."""
    if not completed:
        return 0
    return _XP_RULES.get(activity_type, 0)


def _aggregate_activities(activities: Sequence[LearningActivity]) -> dict:
    """
    Compute aggregated progress statistics from a list of activity records.
    Returns a dict with all fields needed by StudentProgressSummary.
    """
    total = len(activities)
    completed = sum(1 for a in activities if a.completed)
    quizzes = sum(1 for a in activities if a.activity_type == "quiz" and a.completed)
    lessons = sum(1 for a in activities if a.activity_type == "lesson" and a.completed)
    practices = sum(1 for a in activities if a.activity_type == "practice" and a.completed)

    quiz_scores = [
        a.percentage
        for a in activities
        if a.activity_type == "quiz" and a.completed and a.percentage is not None
    ]
    avg_quiz_pct = round(sum(quiz_scores) / len(quiz_scores), 2) if quiz_scores else 0.0

    total_xp = sum(_calculate_xp(a.activity_type, a.completed) for a in activities)

    return {
        "total_activities": total,
        "completed_activities": completed,
        "quizzes_completed": quizzes,
        "lessons_completed": lessons,
        "practice_sessions": practices,
        "average_quiz_percentage": avg_quiz_pct,
        "total_xp": total_xp,
    }


# ── Record Activity ───────────────────────────────────────────────────────────

async def record_activity(
    request: RecordActivityRequest,
    user: User,
    db: AsyncSession,
) -> ActivityResponse:
    """
    Persist a new learning activity record for the authenticated user.

    Security: user_id is always taken from the authenticated User object.
    The client cannot supply or override the user_id.
    """
    activity_id_str = str(uuid.uuid4())
    xp = _calculate_xp(request.activity_type, request.completed)

    activity = LearningActivity(
        id=activity_id_str,
        user_id=user.id,
        activity_type=request.activity_type,
        activity_id=request.activity_id,
        score=request.score,
        percentage=request.percentage,
        completed=request.completed,
        language=request.language,
        education_level=request.education_level,
    )
    db.add(activity)
    await db.commit()
    await db.refresh(activity)

    return ActivityResponse(
        id=activity.id,
        user_id=activity.user_id,
        activity_type=activity.activity_type,
        activity_id=activity.activity_id,
        score=activity.score,
        percentage=activity.percentage,
        completed=activity.completed,
        language=activity.language,
        education_level=activity.education_level,
        xp_earned=xp,
        created_at=activity.created_at,
    )


# ── Get My Progress ───────────────────────────────────────────────────────────

async def get_my_progress(user: User, db: AsyncSession) -> StudentProgressSummary:
    """Return the authenticated student's personal progress summary."""
    result = await db.execute(
        select(LearningActivity)
        .where(LearningActivity.user_id == user.id)
        .order_by(LearningActivity.created_at.desc())
    )
    activities = list(result.scalars().all())

    stats = _aggregate_activities(activities)

    return StudentProgressSummary(
        user_id=user.id,
        username=user.username,
        role=user.role if isinstance(user.role, str) else user.role.value,
        **stats,
    )


# ── Teacher: List Students' Progress ─────────────────────────────────────────

async def list_students_progress(db: AsyncSession) -> StudentListProgressResponse:
    """
    Return an overview of all students for teacher/educator view.

    Fetches all users with role='student', then for each fetches their
    learning activities and computes aggregated stats.

    Does NOT expose password_hash or any authentication secrets.
    """
    students_result = await db.execute(
        select(User)
        .where(User.role == UserRole.student.value)
        .order_by(User.username)
    )
    students: list[User] = list(students_result.scalars().all())

    items: list[StudentProgressListItem] = []
    for student in students:
        acts_result = await db.execute(
            select(LearningActivity).where(LearningActivity.user_id == student.id)
        )
        activities = list(acts_result.scalars().all())
        stats = _aggregate_activities(activities)

        items.append(
            StudentProgressListItem(
                student_id=student.id,
                username=student.username,
                total_activities=stats["total_activities"],
                lessons_completed=stats["lessons_completed"],
                quizzes_completed=stats["quizzes_completed"],
                average_quiz_percentage=stats["average_quiz_percentage"],
                total_xp=stats["total_xp"],
            )
        )

    return StudentListProgressResponse(students=items, total_students=len(items))
