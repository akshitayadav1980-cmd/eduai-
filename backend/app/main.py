"""
Vernacular AI — FastAPI application entry point.

Run locally with:
    uvicorn app.main:app --reload

Interactive API docs:
    http://127.0.0.1:8000/docs   (Swagger UI)
    http://127.0.0.1:8000/redoc  (ReDoc)
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    """Create any missing database tables on startup (non-destructive).
    Skipped during pytest runs to keep test startup fast."""
    import os
    if settings.DATABASE_URL and not os.environ.get("PYTEST_CURRENT_TEST"):
        try:
            from app.database import create_tables
            await create_tables()
        except Exception as exc:  # pragma: no cover — only fails if DB is down
            import logging
            logging.getLogger(__name__).warning(
                "Could not create tables on startup: %s", exc
            )
    yield
    # shutdown: nothing to clean up at this stage


# ── Application factory ───────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_TITLE,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(api_router)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get(
    "/",
    summary="Root",
    tags=["Health"],
    response_description="Confirms the backend is running.",
)
def root() -> dict[str, str]:
    """Return a simple liveness message."""
    return {
        "message": "Vernacular AI Backend is running!",
        "status": "success",
    }


@app.get(
    "/health",
    summary="Health check",
    tags=["Health"],
    response_description="Returns the current health status of the API.",
)
def health_check() -> dict[str, str]:
    """
    Lightweight health-check endpoint.

    Load balancers and container orchestrators (Kubernetes, ECS, etc.) can
    poll this endpoint to verify the process is alive. It will be extended in
    later steps to include database and external-service reachability checks.
    """
    return {"status": "healthy"}
