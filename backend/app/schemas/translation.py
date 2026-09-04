"""
Pydantic schemas for the Translation API.

Endpoints that use these:
  POST /api/v1/translation/translate
  GET  /api/v1/translation/languages
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ── Request ───────────────────────────────────────────────────────────────────

class TranslationRequest(BaseModel):
    """
    Body for POST /api/v1/translation/translate.

    Language codes must be valid ISO 639-3 codes present in the
    `languages` table: 'kru' (Kurukh), 'hin' (Hindi), 'eng' (English).
    """

    text: str = Field(
        ...,
        description="The word or phrase to translate.",
        examples=["अल्ला", "dog", "कुत्ता"],
    )
    source_language: str = Field(
        ...,
        description="ISO 639-3 code of the source language (kru / hin / eng).",
        examples=["kru"],
    )
    target_language: str = Field(
        ...,
        description="ISO 639-3 code of the target language (kru / hin / eng).",
        examples=["hin"],
    )

    @field_validator("text")
    @classmethod
    def text_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("text must not be empty or whitespace-only.")
        return v.strip()

    @field_validator("source_language", "target_language")
    @classmethod
    def language_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Language code must not be blank.")
        return v.strip().lower()


# ── Match detail ──────────────────────────────────────────────────────────────

class TranslationMatch(BaseModel):
    """A single dictionary entry that matched the query."""

    entry_id: str = Field(description="Vocabulary entry ID (e.g. 'KUR-0003').")
    source_text: str = Field(description="The matched text in the source language.")
    translated_text: str = Field(description="The translation in the target language.")
    part_of_speech: str | None = Field(
        default=None,
        description="Grammatical category (noun, verb, number, etc.).",
    )
    category: str | None = Field(
        default=None,
        description="Vocabulary category slug (e.g. 'animals', 'body-parts').",
    )
    verified_by_native_speaker: bool = Field(
        default=False,
        description="Whether the entry has been verified by a native Kurukh speaker.",
    )


# ── Response ──────────────────────────────────────────────────────────────────

class TranslationResponse(BaseModel):
    """Response for POST /api/v1/translation/translate."""

    original_text: str = Field(description="The original query text (trimmed).")
    translated_text: str = Field(
        description=(
            "Primary translation result. Empty string when no match is found."
        )
    )
    source_language: str = Field(description="ISO 639-3 source language code.")
    target_language: str = Field(description="ISO 639-3 target language code.")
    method: str = Field(
        description=(
            "Translation method used. "
            "'dictionary' — exact match from the vocabulary database. "
            "'llm'        — AI translation via Groq (dictionary had no match). "
            "'not_found'  — no match in dictionary and AI is not configured or unavailable. "
            "'invalid_request' — bad language codes. "
            "'ai_error'   — Groq API call failed."
        )
    )
    matches: list[TranslationMatch] = Field(
        default_factory=list,
        description=(
            "All dictionary entries that matched the query. "
            "Multiple matches occur when the same word appears in several categories."
        ),
    )
    message: str | None = Field(
        default=None,
        description="Human-readable explanation, especially when no match is found.",
    )


# ── Supported language pair ───────────────────────────────────────────────────

class LanguagePair(BaseModel):
    """A supported source → target translation direction."""

    source: str = Field(description="ISO 639-3 source language code.")
    source_name: str = Field(description="Human-readable source language name.")
    target: str = Field(description="ISO 639-3 target language code.")
    target_name: str = Field(description="Human-readable target language name.")
    entry_count: int = Field(
        description="Number of vocabulary entries covering this direction."
    )


class SupportedLanguagesResponse(BaseModel):
    """Response for GET /api/v1/translation/languages."""

    model_config = ConfigDict(from_attributes=False)

    languages: list[dict[str, str]] = Field(
        description="All languages available in the translation dictionary."
    )
    pairs: list[LanguagePair] = Field(
        description="All supported translation direction pairs."
    )
    total_entries: int = Field(
        description="Total vocabulary entries available for translation."
    )
