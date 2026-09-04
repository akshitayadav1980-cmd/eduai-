"""
SQLAlchemy ORM model for the `users` table.

This model is for application-side querying only.
Schema is created via Base.metadata.create_all() in app/database/__init__.py
(safe — does not touch existing vocabulary tables).

Roles:
    student  — a learner using the Vernacular AI platform
    teacher  — an educator who can create content and monitor students
"""

from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class UserRole(str, enum.Enum):
    """Supported user roles."""
    student = "student"
    teacher = "teacher"


class User(Base):
    """
    Mirrors the `users` table.

    CREATE TABLE users (
        id            SERIAL PRIMARY KEY,
        username      VARCHAR(50)  NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role          VARCHAR(20)  NOT NULL DEFAULT 'student',
        created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """

    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("username", name="uq_users_username"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        Enum(UserRole, name="user_role", create_type=True),
        nullable=False,
        default=UserRole.student.value,
        server_default=UserRole.student.value,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        server_default=func.now(),
        nullable=False,
    )
