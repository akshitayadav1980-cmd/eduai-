"""
Translation service — dictionary-first, AI-fallback.

Translation flow:
  1. Validate language codes against the `languages` table.
  2. Query `vocabulary_entries` for an exact case-insensitive match.
  3. If found → return with method='dictionary' (fast, free, accurate).
  4. If not found → try Groq AI (requires GROQ_API_KEY in .env).
       a. AI returns a translation  → method='llm'
       b. AI says UNKNOWN / empty   → method='not_found'
       c. GROQ_API_KEY not set      → method='not_found' (with guidance message)
       d. API call fails            → method='ai_error'
  5. The route layer is unchanged — it still calls translate() only.

Supported dictionary directions (all 6 are covered by the 299-entry DB):
  kru ↔ hin   Kurukh   ↔ Hindi
  kru ↔ eng   Kurukh   ↔ English
  hin ↔ eng   Hindi    ↔ English  (via shared entries)
"""

from __future__ import annotations

import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.groq_client import (
    GroqNotConfiguredError,
    GroqTranslationError,
    ai_translate,
)
from app.models.vocabulary import Language, VocabularyEntry
from app.schemas.translation import (
    LanguagePair,
    SupportedLanguagesResponse,
    TranslationMatch,
    TranslationResponse,
)

logger = logging.getLogger(__name__)

# ── Column map ────────────────────────────────────────────────────────────────

_SOURCE_COLUMN: dict[str, object] = {
    "kru": VocabularyEntry.kurukh,
    "hin": VocabularyEntry.hindi,
    "eng": VocabularyEntry.english,
}

_TARGET_COLUMN: dict[str, object] = {
    "kru": VocabularyEntry.kurukh,
    "hin": VocabularyEntry.hindi,
    "eng": VocabularyEntry.english,
}

SUPPORTED_LANG_CODES = frozenset({"kru", "hin", "eng"})


# ── Language validation ───────────────────────────────────────────────────────

async def validate_language_codes(
    source: str,
    target: str,
    db: AsyncSession,
) -> tuple[bool, str]:
    if source == target:
        return False, "source_language and target_language must be different."
    if source not in SUPPORTED_LANG_CODES:
        return False, (
            f"source_language '{source}' is not supported. "
            f"Supported codes: {sorted(SUPPORTED_LANG_CODES)}."
        )
    if target not in SUPPORTED_LANG_CODES:
        return False, (
            f"target_language '{target}' is not supported. "
            f"Supported codes: {sorted(SUPPORTED_LANG_CODES)}."
        )
    result = await db.execute(
        select(Language.iso_639_3).where(
            Language.iso_639_3.in_([source, target])
        )
    )
    found = {row[0] for row in result.all()}
    missing = {source, target} - found
    if missing:
        return False, (
            f"Language code(s) {sorted(missing)} not found in the languages table."
        )
    return True, ""


# ── Core translate function ───────────────────────────────────────────────────

async def translate(
    text: str,
    source_language: str,
    target_language: str,
    db: AsyncSession,
) -> TranslationResponse:
    """
    Translate *text* from *source_language* to *target_language*.

    Tries the vocabulary dictionary first; falls back to Groq AI if no
    dictionary match is found.
    """
    # ── Validation ────────────────────────────────────────────────────────────
    valid, error_msg = await validate_language_codes(source_language, target_language, db)
    if not valid:
        return TranslationResponse(
            original_text=text,
            translated_text="",
            source_language=source_language,
            target_language=target_language,
            method="invalid_request",
            matches=[],
            message=error_msg,
        )

    # ── 1. Dictionary lookup ──────────────────────────────────────────────────
    src_col = _SOURCE_COLUMN[source_language]

    stmt = (
        select(VocabularyEntry)
        .where(func.lower(src_col) == text.lower())
        .order_by(VocabularyEntry.id)
    )
    result = await db.execute(stmt)
    entries = result.scalars().all()

    if entries:
        matches = [
            TranslationMatch(
                entry_id=e.id,
                source_text=getattr(e, _col_attr(source_language)),
                translated_text=getattr(e, _col_attr(target_language)),
                part_of_speech=e.part_of_speech,
                category=e.category_id,
                verified_by_native_speaker=e.verified_by_native_speaker,
            )
            for e in entries
        ]
        return TranslationResponse(
            original_text=text,
            translated_text=matches[0].translated_text,
            source_language=source_language,
            target_language=target_language,
            method="dictionary",
            matches=matches,
            message=(
                f"Found {len(matches)} dictionary match(es)."
                if len(matches) > 1
                else None
            ),
        )

    # ── 2. AI fallback (Groq) ─────────────────────────────────────────────────
    try:
        ai_result = await ai_translate(
            text=text,
            source_language=source_language,
            target_language=target_language,
        )
        if ai_result is not None:
            return TranslationResponse(
                original_text=text,
                translated_text=ai_result,
                source_language=source_language,
                target_language=target_language,
                method="llm",
                matches=[],
                message="Translated by AI (Groq). Not in the vocabulary dictionary.",
            )
        # AI returned UNKNOWN / empty
        return TranslationResponse(
            original_text=text,
            translated_text="",
            source_language=source_language,
            target_language=target_language,
            method="not_found",
            matches=[],
            message=(
                f"No translation found for '{text}' "
                f"({source_language} → {target_language}) "
                "in the dictionary or AI model."
            ),
        )

    except GroqNotConfiguredError:
        logger.info("Groq not configured; returning not_found for '%s'", text)
        return TranslationResponse(
            original_text=text,
            translated_text="",
            source_language=source_language,
            target_language=target_language,
            method="not_found",
            matches=[],
            message=(
                f"No dictionary entry found for '{text}' "
                f"({source_language} → {target_language}). "
                "AI translation is not configured. "
                "Set GROQ_API_KEY in backend/.env to enable AI fallback."
            ),
        )

    except GroqTranslationError as exc:
        logger.warning("Groq translation failed for '%s': %s", text, exc)
        return TranslationResponse(
            original_text=text,
            translated_text="",
            source_language=source_language,
            target_language=target_language,
            method="ai_error",
            matches=[],
            message=(
                "The AI translation service encountered an error. "
                "Please try again. The dictionary does not contain this word."
            ),
        )


def _col_attr(lang_code: str) -> str:
    return {"kru": "kurukh", "hin": "hindi", "eng": "english"}[lang_code]


# ── Supported languages / pairs ───────────────────────────────────────────────

async def get_supported_languages(
    db: AsyncSession,
) -> SupportedLanguagesResponse:
    lang_result = await db.execute(
        select(Language)
        .where(Language.iso_639_3.in_(list(SUPPORTED_LANG_CODES)))
        .order_by(Language.language_name)
    )
    langs = lang_result.scalars().all()
    lang_map = {lang.iso_639_3: lang.language_name for lang in langs}

    count_result = await db.execute(select(func.count()).select_from(VocabularyEntry))
    total_entries = count_result.scalar_one()

    codes = sorted(lang_map.keys())
    pairs: list[LanguagePair] = []
    for src in codes:
        for tgt in codes:
            if src == tgt:
                continue
            pairs.append(
                LanguagePair(
                    source=src,
                    source_name=lang_map[src],
                    target=tgt,
                    target_name=lang_map[tgt],
                    entry_count=total_entries,
                )
            )

    return SupportedLanguagesResponse(
        languages=[
            {
                "iso_639_3": lang.iso_639_3,
                "language_name": lang.language_name,
                "script": lang.script,
            }
            for lang in langs
        ],
        pairs=pairs,
        total_entries=total_entries,
    )
