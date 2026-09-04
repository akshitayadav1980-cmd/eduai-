"""
Quizzes router — /api/v1/quizzes

Endpoints:
    GET  /api/v1/quizzes/status    — health check (no auth required)
    POST /api/v1/quizzes/generate  — generate an educational quiz (requires auth)
    POST /api/v1/quizzes/evaluate  — deterministically score student answers (requires auth)
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.quiz import (
    GenerateQuizRequest,
    GenerateQuizResponse,
    QuizEvaluateRequest,
    QuizEvaluateResponse,
)
from app.services import quiz_service

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])

MODULE_NAME = "quizzes"


# ── Status ────────────────────────────────────────────────────────────────────


@router.get(
    "/status",
    summary="Quizzes module status",
    response_description="Confirms the quizzes module is reachable.",
)
def quizzes_status() -> dict[str, str]:
    """Architecture verification endpoint for the quizzes module."""
    return {"module": MODULE_NAME, "status": "ready"}


# ── Generate ──────────────────────────────────────────────────────────────────


@router.post(
    "/generate",
    response_model=GenerateQuizResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate an educational quiz",
    response_description="Generated questions calibrated to the education level and language.",
)
async def generate_quiz_endpoint(
    request: GenerateQuizRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GenerateQuizResponse:
    """
    Generate an educational multiple-choice quiz using Groq LLM, grounded in verified
    PostgreSQL vocabulary data (RAG) and calibrated with adaptive pedagogy.

    - Requires `Authorization: Bearer <token>`
    - Generates questions tailored to topic, language, and education level
    - Security: Does NOT expose correct answers in the response
    """
    return await quiz_service.generate_quiz(
        user=current_user,
        db=db,
        request=request,
    )


# ── Evaluate ──────────────────────────────────────────────────────────────────


@router.post(
    "/evaluate",
    response_model=QuizEvaluateResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate submitted quiz answers",
    response_description="Deterministic score, percentage, and per-question feedback.",
)
async def evaluate_quiz_endpoint(
    request: QuizEvaluateRequest,
    current_user: User = Depends(get_current_user),
) -> QuizEvaluateResponse:
    """
    Deterministically score a student's quiz answers against the server-stored answer key
    or provided question items.

    - Requires `Authorization: Bearer <token>`
    - 100% deterministic (no external LLM calls)
    - Returns total questions, correct/incorrect count, score, percentage, and explanations
    """
    return quiz_service.evaluate_quiz(request=request)
