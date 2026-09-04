"""
Central API router — /api/v1

Every module router is imported and included here with the shared /api/v1
prefix. app/main.py imports this single router object and registers it once,
keeping main.py free of per-module import clutter.

To add a new module in a future step:
  1. Create app/api/routes/<module>.py with its own APIRouter.
  2. Import it below and call api_router.include_router(...).
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import (
    auth,
    languages,
    progress,
    qa,
    quizzes,
    recommendations,
    translation,
    tutor,
    users,
    vocabulary,
    voice,
)

# The shared version prefix — every route registered here becomes /api/v1/...
API_V1_PREFIX = "/api/v1"

api_router = APIRouter(prefix=API_V1_PREFIX)

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(languages.router)
api_router.include_router(vocabulary.router)
api_router.include_router(tutor.router)
api_router.include_router(translation.router)
api_router.include_router(voice.router)
api_router.include_router(quizzes.router)
api_router.include_router(progress.router)
api_router.include_router(recommendations.router)
api_router.include_router(qa.router)

