"""
SQLAlchemy ORM model for learning activities and student progress.

Mirrors the `learning_activities` table.
Created via Base.metadata.create_all(checkfirst=True) in app/database/__init__.py
(safe — does not alter or recreate existing vocabulary tables).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class LearningActivity(Base):
    """
    Stores individual learning events completed by students:
    - Quizzes
    - Lessons
    - Practice sessions
    """

    __tablename__ = "learning_activities"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    activity_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
    )  # quiz, lesson, practice
    activity_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )  # identifier for lesson, quiz, or topic
    score: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )  # raw score (e.g. 4)
    percentage: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )  # score percentage (e.g. 80.0)
    completed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    language: Mapped[str | None] = mapped_column(
        String(10),
        nullable=True,
    )  # kru, hin, eng
    education_level: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )  # primary, secondary, etc.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
