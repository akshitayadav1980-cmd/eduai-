"""
Vocabulary router — /api/v1/vocabulary

Endpoints:
  GET /api/v1/vocabulary/status              — architecture health check (no DB)
  GET /api/v1/vocabulary/categories          — list all 15 vocabulary categories
  GET /api/v1/vocabulary                     — paginated entries, filterable
  GET /api/v1/vocabulary/{entry_id}          — single entry by KUR-XXXX id

Route declaration order matters:
  /status and /categories are listed before /{entry_id} so FastAPI
  matches them as literal paths, not as path-parameter values.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.vocabulary import Category, VocabularyEntry
from app.schemas.vocabulary import (
    CategoryResponse,
    PaginationMeta,
    VocabularyEntryResponse,
    VocabularyListResponse,
)

router = APIRouter(prefix="/vocabulary", tags=["Vocabulary"])


# ── Status (kept — no DB dependency) ─────────────────────────────────────────

@router.get(
    "/status",
    summary="Vocabulary module status",
    response_description="Confirms the vocabulary module is reachable.",
)
def vocabulary_status() -> dict[str, str]:
    """Architecture verification endpoint — no database required."""
    return {"module": "vocabulary", "status": "ready"}


# ── Categories ────────────────────────────────────────────────────────────────

@router.get(
    "/categories",
    response_model=list[CategoryResponse],
    summary="List vocabulary categories",
    response_description="All 15 categories ordered by display_order.",
)
async def list_categories(
    db: AsyncSession = Depends(get_db),
) -> list[Category]:
    """
    Return all vocabulary categories ordered by their display position.

    Categories include: everyday-words, animals, body-parts, numbers-0-50, etc.
    """
    result = await db.execute(
        select(Category).order_by(Category.display_order)
    )
    return list(result.scalars().all())


# ── List vocabulary entries (paginated, filterable) ───────────────────────────

@router.get(
    "",
    response_model=VocabularyListResponse,
    summary="List vocabulary entries",
    response_description="Paginated vocabulary entries with optional filters.",
)
async def list_vocabulary(
    category_id: Optional[str] = Query(
        None,
        description="Filter by category slug (e.g. 'animals', 'body-parts').",
    ),
    part_of_speech: Optional[str] = Query(
        None,
        description="Filter by part of speech (e.g. 'noun', 'verb', 'number').",
    ),
    skip: int = Query(0, ge=0, description="Number of entries to skip (offset)."),
    limit: int = Query(50, ge=1, le=200, description="Maximum entries to return."),
    db: AsyncSession = Depends(get_db),
) -> VocabularyListResponse:
    """
    Return vocabulary entries with optional category and part-of-speech filters.

    Supports pagination via `skip` and `limit`. Default page size is 50,
    maximum is 200.

    **Examples:**
    - `/api/v1/vocabulary?category_id=animals` — all animal vocabulary
    - `/api/v1/vocabulary?part_of_speech=verb&limit=20` — first 20 verbs
    - `/api/v1/vocabulary?skip=50&limit=50` — second page of 50
    """
    # Build the base query
    base_q = select(VocabularyEntry)
    if category_id:
        base_q = base_q.where(VocabularyEntry.category_id == category_id)
    if part_of_speech:
        base_q = base_q.where(VocabularyEntry.part_of_speech == part_of_speech)

    # Count total matching rows (for pagination metadata)
    count_q = select(func.count()).select_from(base_q.subquery())
    total_result = await db.execute(count_q)
    total = total_result.scalar_one()

    # Fetch the requested page
    entries_result = await db.execute(
        base_q.order_by(VocabularyEntry.id).offset(skip).limit(limit)
    )
    entries = list(entries_result.scalars().all())

    return VocabularyListResponse(
        data=entries,
        meta=PaginationMeta(total=total, skip=skip, limit=limit),
    )


# ── Single vocabulary entry by ID ─────────────────────────────────────────────

@router.get(
    "/{entry_id}",
    response_model=VocabularyEntryResponse,
    summary="Get vocabulary entry by ID",
    response_description="The requested vocabulary entry.",
)
async def get_vocabulary_entry(
    entry_id: str,
    db: AsyncSession = Depends(get_db),
) -> VocabularyEntry:
    """
    Return a single vocabulary entry by its ID.

    IDs follow the pattern `KUR-XXXX` (e.g. `KUR-0001`, `KUR-0299`).
    """
    entry = await db.get(VocabularyEntry, entry_id)
    if entry is None:
        raise HTTPException(
            status_code=404,
            detail=f"Vocabulary entry '{entry_id}' not found.",
        )
    return entry
