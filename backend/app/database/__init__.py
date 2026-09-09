"""
Database engine, async session factory, Declarative Base, and FastAPI dependency.

Usage in route handlers:
    from app.database import get_db
    ...
    async def my_route(db: AsyncSession = Depends(get_db)): ...

The engine is created lazily so the application can start without DATABASE_URL
set (e.g. during testing without a live database). The error is raised only
when a request actually attempts to open a database session.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# ── Declarative Base ──────────────────────────────────────────────────────────
# All ORM model classes inherit from this Base.
# NOTE: Base.metadata.create_all() is intentionally NOT called here.
# The database schema is managed exclusively via the teammate's PostgreSQL SQL
# file: database/kurukh_hindi_english_dictionary_postgresql.sql

class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


# ── Engine + session factory (lazy) ──────────────────────────────────────────

_engine = None
_AsyncSessionLocal = None


def _get_engine():
    """Return the async engine, creating it on first call."""
    global _engine
    if _engine is None:
        if not settings.DATABASE_URL:
            raise RuntimeError(
                "DATABASE_URL is not configured. "
                "Copy backend/.env.example to backend/.env and set the value. "
                "Example: postgresql+asyncpg://postgres:PASSWORD@localhost:5432/vernacular_ai"
            )
        db_url = settings.DATABASE_URL
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+asyncpg://"):
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

        _engine = create_async_engine(
            db_url,
            echo=settings.DEBUG,   # log SQL in development
            pool_pre_ping=True,    # verify connection liveness before each use
        )
    return _engine


def _get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Return the session factory, creating it on first call."""
    global _AsyncSessionLocal
    if _AsyncSessionLocal is None:
        _AsyncSessionLocal = async_sessionmaker(
            bind=_get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,  # keep ORM attributes accessible after commit
        )
    return _AsyncSessionLocal


# ── Non-destructive table creation ───────────────────────────────────────────

async def create_tables() -> None:
    """
    Create any missing tables defined on Base.metadata.

    Uses checkfirst=True (CREATE TABLE IF NOT EXISTS semantics) so existing
    tables — including all vocabulary tables — are never dropped or altered.
    Call this once at application startup.
    """
    # Importing models here ensures they are registered on Base.metadata
    # before create_all runs.  Import order matches FK dependency order.
    import app.models.vocabulary  # noqa: F401 — registers vocabulary tables
    import app.models.user        # noqa: F401 — registers users table
    import app.models.progress    # noqa: F401 — registers learning_activities table

    engine = _get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all, checkfirst=True)


# ── FastAPI dependency ────────────────────────────────────────────────────────

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Yield one AsyncSession per request.

    Use as a FastAPI dependency:
        db: AsyncSession = Depends(get_db)

    The session is closed automatically when the request completes,
    whether or not an exception was raised.
    """
    factory = _get_session_factory()
    async with factory() as session:
        yield session
