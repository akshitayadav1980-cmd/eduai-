"""
Shared pytest configuration and fixtures.

Key concern: the global SQLAlchemy async engine in app/database/__init__.py
holds an asyncpg connection pool.  When pytest runs multiple test modules in
sequence, each TestClient creates its own event loop.  After a TestClient
closes, its event loop is closed — but the engine still holds references to
connections from that loop.  The next TestClient starts a new event loop and
the stale pool references cause 'Event loop is closed' errors.

Fix: reset the global engine/session-factory between every test *module*
(not every test — that would be too slow).  The engine is re-created lazily
on the first DB request in each module, so there is no connection overhead
for tests that never touch the database.
"""

from __future__ import annotations

import pytest


@pytest.fixture(autouse=True, scope="module")
def reset_db_engine():
    """
    Reset the global async engine and session factory before each test module.

    This prevents 'Event loop is closed' / asyncpg pool errors that occur
    when multiple test modules each create their own TestClient (and thus
    their own asyncio event loop).
    """
    import app.database as db_module
    # Reset before the module runs
    db_module._engine = None
    db_module._AsyncSessionLocal = None
    yield
    # Reset after the module runs so the next module starts clean
    db_module._engine = None
    db_module._AsyncSessionLocal = None
