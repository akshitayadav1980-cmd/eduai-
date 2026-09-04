"""
Pydantic schemas for the AI Tutor Chat & Session API endpoints.

Endpoints:
    POST /api/v1/tutor/session — start or retrieve a tutoring session
    POST /api/v1/tutor/chat    — send a message in a multi-turn tutoring conversation
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.qa import ContextEntry, SUPPORTED_EDUCATION_LEVELS, SUPPORTED_LANG_CODES


class ChatMessage(BaseModel):
    """A single message in a tutoring dialogue."""

    role: Literal["user", "assistant", "system"] = Field(
        description="Role of the message author."
    )
    content: str = Field(
        description="Content of the message.",
        min_length=1,
    )
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp when the message was recorded.",
    )


class CreateSessionRequest(BaseModel):
    """Body for POST /api/v1/tutor/session."""

    language: str = Field(
        default="hin",
        description="Preferred language for tutoring (kru, hin, eng).",
        examples=["hin", "eng", "kru"],
    )
    education_level: str = Field(
        default="secondary",
        description="Adaptive pedagogy education level.",
        examples=["primary", "secondary", "higher_secondary", "college", "professional"],
    )
    topic: Optional[str] = Field(
        default=None,
        description="Optional initial topic or subject to focus the session on.",
        examples=["Basic Kurukh Greetings", "Science Class 8"],
    )

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in SUPPORTED_LANG_CODES:
            raise ValueError(
                f"language '{v}' is not supported. Supported codes: {sorted(SUPPORTED_LANG_CODES)}."
            )
        return v

    @field_validator("education_level")
    @classmethod
    def validate_education_level(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in SUPPORTED_EDUCATION_LEVELS:
            raise ValueError(
                f"education_level '{v}' is not supported. Supported values: {sorted(SUPPORTED_EDUCATION_LEVELS)}."
            )
        return v


class SessionResponse(BaseModel):
    """Response returned when a tutoring session is created or retrieved."""

    session_id: str = Field(description="Unique identifier for the tutoring session.")
    user_id: int = Field(description="Database ID of the authenticated user.")
    username: str = Field(description="Username of the authenticated user.")
    role: str = Field(description="Role of the user (student, teacher).")
    language: str = Field(description="Session language (ISO 639-3 code).")
    education_level: str = Field(description="Session adaptive education level.")
    topic: Optional[str] = Field(default=None, description="Topic or subject of this session.")
    welcome_message: str = Field(description="Initial welcoming prompt from the AI tutor.")
    created_at: datetime = Field(description="Timestamp when the session was created.")
    message_count: int = Field(default=0, description="Total number of messages currently in session.")


class TutorChatRequest(BaseModel):
    """Body for POST /api/v1/tutor/chat."""

    message: str = Field(
        ...,
        description="Student/teacher message to the AI tutor.",
        min_length=1,
        max_length=2000,
        examples=["नमस्ते! मुझे कुड़ुख भाषा में अभिवादन सिखाएं।", "What is the Kurukh word for river?"],
    )
    session_id: Optional[str] = Field(
        default=None,
        description="Optional session ID. If omitted, an automatic session is created.",
    )
    language: Optional[str] = Field(
        default=None,
        description="Optional language override for this message.",
    )
    education_level: Optional[str] = Field(
        default=None,
        description="Optional education level override for this message.",
    )
    history: Optional[list[ChatMessage]] = Field(
        default=None,
        description="Optional client-provided chat history for multi-turn context.",
    )

    @field_validator("message")
    @classmethod
    def validate_message_not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("message must not be empty or whitespace-only.")
        return v.strip()

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip().lower()
            if v not in SUPPORTED_LANG_CODES:
                raise ValueError(
                    f"language '{v}' is not supported. Supported codes: {sorted(SUPPORTED_LANG_CODES)}."
                )
        return v

    @field_validator("education_level")
    @classmethod
    def validate_education_level(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip().lower()
            if v not in SUPPORTED_EDUCATION_LEVELS:
                raise ValueError(
                    f"education_level '{v}' is not supported. Supported values: {sorted(SUPPORTED_EDUCATION_LEVELS)}."
                )
        return v


class TutorChatResponse(BaseModel):
    """Response returned by the AI Tutor chat endpoint."""

    session_id: str = Field(description="Tutoring session identifier.")
    message: str = Field(description="User's input message.")
    response: str = Field(description="AI Tutor's response.")
    language: str = Field(description="Response language (ISO 639-3 code).")
    education_level: str = Field(description="Education level used to calibrate response.")
    method: str = Field(
        description=(
            "'tutor_rag'      — response grounded in retrieved vocabulary + Groq LLM. "
            "'tutor_llm'      — response generated by Groq LLM (no matching vocabulary). "
            "'not_configured' — GROQ_API_KEY is not configured. "
            "'ai_error'       — Groq LLM encountered a service error."
        )
    )
    retrieved_context: list[ContextEntry] = Field(
        default_factory=list,
        description="Verified vocabulary entries retrieved as grounding context.",
    )
    context_count: int = Field(default=0, description="Count of retrieved vocabulary items.")
    history: list[ChatMessage] = Field(
        default_factory=list,
        description="Current multi-turn conversation history for this session.",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of this chat turn.",
    )
