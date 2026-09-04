"""
Pydantic schemas for the QA (RAG) API endpoint.

Endpoint:
    POST /api/v1/qa/ask
"""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


# ── Supported values ──────────────────────────────────────────────────────────

SUPPORTED_LANG_CODES: frozenset[str] = frozenset({"kru", "hin", "eng"})

# Canonical adaptive-pedagogy education levels.
# Each level maps to distinct prompt instructions in app/rag/prompt_builder.py.
SUPPORTED_EDUCATION_LEVELS: frozenset[str] = frozenset(
    {"primary", "secondary", "higher_secondary", "college", "professional"}
)


# ── Request ───────────────────────────────────────────────────────────────────


class QARequest(BaseModel):
    """
    Body for POST /api/v1/qa/ask.

    Fields:
        question:         The student's educational question.
        source_language:  ISO 639-3 code of the desired response language.
                          Must be one of: kru (Kurukh), hin (Hindi), eng (English).
        education_level:  Adaptive-pedagogy level that controls vocabulary
                          complexity, explanation depth, and answer structure.
                          Must be one of:
                            primary          — very simple language, short answers
                            secondary        — clear with key terminology
                            higher_secondary — deeper conceptual explanation
                            college          — academically detailed
                            professional     — technically precise, concise
    """

    question: str = Field(
        ...,
        description="The student's educational question.",
        examples=[
            "What is the Kurukh word for water?",
            "पानी को कुड़ुख में क्या कहते हैं?",
        ],
        min_length=1,
    )
    source_language: str = Field(
        ...,
        description="ISO 639-3 code for the desired response language (kru / hin / eng).",
        examples=["eng"],
    )
    education_level: str = Field(
        default="secondary",
        description=(
            "Adaptive-pedagogy level: "
            "primary | secondary | higher_secondary | college | professional."
        ),
        examples=["primary"],
    )

    @field_validator("question")
    @classmethod
    def question_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("question must not be empty or whitespace-only.")
        return v.strip()

    @field_validator("source_language")
    @classmethod
    def validate_source_language(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in SUPPORTED_LANG_CODES:
            raise ValueError(
                f"source_language '{v}' is not supported. "
                f"Supported codes: {sorted(SUPPORTED_LANG_CODES)}."
            )
        return v

    @field_validator("education_level")
    @classmethod
    def validate_education_level(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in SUPPORTED_EDUCATION_LEVELS:
            raise ValueError(
                f"education_level '{v}' is not supported. "
                f"Supported values: {sorted(SUPPORTED_EDUCATION_LEVELS)}."
            )
        return v


# ── Retrieved context item ────────────────────────────────────────────────────


class ContextEntry(BaseModel):
    """A single vocabulary entry retrieved from the dictionary as RAG context."""

    entry_id: str = Field(description="Vocabulary entry ID (e.g. 'KUR-0003').")
    kurukh: str = Field(description="Kurukh form of the word.")
    hindi: str = Field(description="Hindi translation.")
    english: str = Field(description="English translation.")
    part_of_speech: str | None = Field(
        default=None, description="Grammatical category (noun, verb, etc.)."
    )
    category: str | None = Field(
        default=None, description="Vocabulary category slug."
    )
    verified: bool = Field(
        default=False, description="Verified by a native Kurukh speaker."
    )


# ── Response ──────────────────────────────────────────────────────────────────


class QAResponse(BaseModel):
    """Response for POST /api/v1/qa/ask."""

    question: str = Field(description="The original question (trimmed).")
    answer: str = Field(
        description=(
            "The AI-generated answer, grounded by retrieved vocabulary context. "
            "Empty string when no answer could be produced."
        )
    )
    source_language: str = Field(
        description="ISO 639-3 code of the language the answer is in."
    )
    education_level: str = Field(
        description="Education level used to calibrate the answer."
    )
    method: str = Field(
        description=(
            "'rag'            — answer produced via RAG pipeline. "
            "'no_answer'      — Groq returned an empty response. "
            "'not_configured' — GROQ_API_KEY is not set. "
            "'ai_error'       — Groq API call failed."
        )
    )
    retrieved_context: list[ContextEntry] = Field(
        default_factory=list,
        description="Vocabulary entries retrieved from the dictionary and used as context.",
    )
    context_count: int = Field(
        description="Number of vocabulary entries retrieved as context."
    )
    message: str | None = Field(
        default=None,
        description="Human-readable note, especially when the pipeline could not produce an answer.",
    )
