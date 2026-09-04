"""
QA (RAG) router — /api/v1/qa

Endpoints:
    GET  /api/v1/qa/status   — module health check (no DB required)
    POST /api/v1/qa/ask      — educational Q&A via RAG pipeline

Pipeline:
    1. Retrieve relevant vocabulary context from PostgreSQL.
    2. Build a grounded Groq prompt with the context clearly separated.
    3. Call Groq and return the answer with context metadata.

The translation pipeline at /api/v1/translation is completely unchanged.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.rag.qa_service import answer_question
from app.schemas.qa import QARequest, QAResponse

router = APIRouter(prefix="/qa", tags=["QA (RAG)"])

MODULE_NAME = "qa"


# ── Status ────────────────────────────────────────────────────────────────────


@router.get(
    "/status",
    summary="QA module status",
    response_description="Confirms the QA/RAG module is reachable.",
)
def qa_status() -> dict[str, str]:
    """Architecture verification endpoint — no database required."""
    return {"module": MODULE_NAME, "status": "ready"}


# ── Ask ───────────────────────────────────────────────────────────────────────


@router.post(
    "/ask",
    response_model=QAResponse,
    status_code=status.HTTP_200_OK,
    summary="Answer an educational question using RAG",
    response_description="AI answer grounded by retrieved vocabulary context.",
)
async def ask(
    request: QARequest,
    db: AsyncSession = Depends(get_db),
) -> QAResponse:
    """
    Answer a student's educational question using Retrieval-Augmented Generation.

    **Pipeline:**
    1. Relevant vocabulary entries are retrieved from the PostgreSQL dictionary.
    2. A grounded prompt is constructed with the context clearly separated from
       the question.
    3. Groq generates an answer calibrated to the requested education level and
       language.

    **Supported language codes** (`source_language`):
    | Code | Language |
    |------|----------|
    | `kru` | Kurukh  |
    | `hin` | Hindi   |
    | `eng` | English |

    **Education levels** (`education_level`):
    | Value              | Description                                    |
    |--------------------|------------------------------------------------|
    | `primary`          | Very simple language, short answers (default)  |
    | `secondary`        | Clear language with key terminology            |
    | `higher_secondary` | Deeper concepts, academic terminology          |
    | `college`          | Academically detailed, precise terminology     |
    | `professional`     | Technically precise, concise, expert-level     |

    **Response `method` values:**
    - `rag`            — successful answer via RAG pipeline
    - `no_answer`      — Groq returned nothing useful
    - `not_configured` — GROQ_API_KEY is not set
    - `ai_error`       — Groq API call failed

    **Examples:**
    ```json
    {
      "question": "What is the Kurukh word for water?",
      "source_language": "eng",
      "education_level": "beginner"
    }
    ```
    ```json
    {
      "question": "पानी को कुड़ुख में क्या कहते हैं?",
      "source_language": "hin",
      "education_level": "intermediate"
    }
    ```
    """
    return await answer_question(
        question=request.question,
        source_language=request.source_language,
        education_level=request.education_level,
        db=db,
    )
