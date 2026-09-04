"""
AI Tutor router — /api/v1/tutor

Endpoints:
    GET  /api/v1/tutor/status   — architecture verification endpoint (no auth required)
    POST /api/v1/tutor/session  — start or initialize a tutoring session (requires auth)
    POST /api/v1/tutor/chat     — multi-turn conversational tutoring turn (requires auth)
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.tutor import (
    CreateSessionRequest,
    SessionResponse,
    TutorChatRequest,
    TutorChatResponse,
)
from app.services import tutor_service

router = APIRouter(prefix="/tutor", tags=["AI Tutor"])

MODULE_NAME = "tutor"


# ── Status ────────────────────────────────────────────────────────────────────


@router.get(
    "/status",
    summary="AI Tutor module status",
    response_description="Confirms the AI tutor module is reachable.",
)
def tutor_status() -> dict[str, str]:
    """Architecture verification endpoint for the AI tutor module."""
    return {"module": MODULE_NAME, "status": "ready"}


# ── Session ───────────────────────────────────────────────────────────────────


@router.post(
    "/session",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Initialize an AI tutoring session",
    response_description="Session details including session_id and initial greeting.",
)
async def create_session_endpoint(
    request: CreateSessionRequest,
    current_user: User = Depends(get_current_user),
) -> SessionResponse:
    """
    Initialize a new conversational tutoring session for an authenticated student or teacher.

    - Requires `Authorization: Bearer <token>`
    - Calibrates initial language (kru, hin, eng) and adaptive education level
    - Generates a unique `session_id` and culturally welcoming greeting
    """
    return tutor_service.create_session(user=current_user, request=request)


# ── Chat ──────────────────────────────────────────────────────────────────────


@router.post(
    "/chat",
    response_model=TutorChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Chat with the interactive AI tutor",
    response_description="Grounded, level-appropriate response and dialogue history.",
)
async def chat_endpoint(
    request: TutorChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TutorChatResponse:
    """
    Process a student/teacher chat turn with the interactive AI Tutor.

    - Requires `Authorization: Bearer <token>`
    - Supports multi-turn dialogue context across the session
    - Dynamically retrieves verified vocabulary entries from the PostgreSQL dictionary (RAG)
    - Calibrates response style and depth to the requested/session education level
    - Seamlessly integrates with the Groq LLM
    """
    return await tutor_service.chat_with_tutor(
        user=current_user,
        db=db,
        request=request,
    )
