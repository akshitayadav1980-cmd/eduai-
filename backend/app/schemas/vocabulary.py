"""
Pydantic v2 response schemas for the vocabulary and language API endpoints.

These schemas define the JSON shapes returned by:
  GET /api/v1/languages
  GET /api/v1/languages/{iso_639_3}
  GET /api/v1/vocabulary/categories
  GET /api/v1/vocabulary
  GET /api/v1/vocabulary/{id}

model_config = ConfigDict(from_attributes=True) enables construction
directly from SQLAlchemy ORM instances via model_validate(orm_obj).
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


# ── Language ──────────────────────────────────────────────────────────────────

class LanguageResponse(BaseModel):
    """Response schema for a single language row from the `languages` table."""

    model_config = ConfigDict(from_attributes=True)

    iso_639_3: str
    language_name: str
    script: str


# ── Category ──────────────────────────────────────────────────────────────────

class CategoryResponse(BaseModel):
    """Response schema for a single row from the `categories` table."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    display_order: int
    title_hindi: str
    title_english: str
    entry_count: int


# ── Vocabulary entry ──────────────────────────────────────────────────────────

class VocabularyEntryResponse(BaseModel):
    """Response schema for a single row from the `vocabulary_entries` table."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    category_id: str
    kurukh: str
    hindi: str
    english: str
    part_of_speech: str | None
    kurukh_romanized: str | None
    audio_url: str | None
    notes: str | None
    verified_by_native_speaker: bool


# ── Pagination ────────────────────────────────────────────────────────────────

class PaginationMeta(BaseModel):
    """Pagination metadata returned alongside list responses."""

    total: int
    skip: int
    limit: int


class VocabularyListResponse(BaseModel):
    """Paginated list of vocabulary entries."""

    data: list[VocabularyEntryResponse]
    meta: PaginationMeta
