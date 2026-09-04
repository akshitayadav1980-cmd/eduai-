"""
Languages router — /api/v1/languages

Endpoints:
  GET /api/v1/languages/status        — architecture health check (no DB)
  GET /api/v1/languages               — list all language rows
  GET /api/v1/languages/{iso_639_3}   — single language by ISO 639-3 code

The /status route is declared first so it is matched before the
/{iso_639_3} path-parameter route.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.vocabulary import Language
from app.schemas.vocabulary import LanguageResponse

router = APIRouter(prefix="/languages", tags=["Languages"])


# ── Status (kept — no DB dependency) ─────────────────────────────────────────

@router.get(
    "/status",
    summary="Languages module status",
    response_description="Confirms the languages module is reachable.",
)
def languages_status() -> dict[str, str]:
    """Architecture verification endpoint — no database required."""
    return {"module": "languages", "status": "ready"}


# ── List all languages ────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=list[LanguageResponse],
    summary="List all supported languages",
    response_description="All language rows in the dataset, ordered by language name.",
)
async def list_languages(
    db: AsyncSession = Depends(get_db),
) -> list[Language]:
    """
    Return every language record in the `languages` table.

    The Kurukh dataset currently contains three languages:
    - **kru** — Kurukh (Devanagari)
    - **hin** — Hindi (Devanagari)
    - **eng** — English (Latin)
    """
    result = await db.execute(
        select(Language).order_by(Language.language_name)
    )
    return list(result.scalars().all())


# ── Single language by ISO 639-3 code ────────────────────────────────────────

@router.get(
    "/{iso_639_3}",
    response_model=LanguageResponse,
    summary="Get language by ISO 639-3 code",
    response_description="The requested language record.",
)
async def get_language(
    iso_639_3: str,
    db: AsyncSession = Depends(get_db),
) -> Language:
    """
    Return a single language by its ISO 639-3 code.

    Examples: `kru`, `hin`, `eng`
    """
    language = await db.get(Language, iso_639_3)
    if language is None:
        raise HTTPException(
            status_code=404,
            detail=f"Language '{iso_639_3}' not found.",
        )
    return language
