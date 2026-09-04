"""
Translation router — /api/v1/translation

Endpoints:
  GET  /api/v1/translation/status      — architecture health check (no DB)
  GET  /api/v1/translation/languages   — supported languages and direction pairs
  POST /api/v1/translation/translate   — dictionary-first, AI-fallback translation

Translation flow:
  1. Exact case-insensitive match in the 299-entry vocabulary dictionary.
  2. If no match → Groq AI fallback (requires GROQ_API_KEY in .env).
  3. method field in the response indicates which path was used:
       'dictionary'      — matched in vocabulary DB
       'llm'             — translated by Groq AI
       'not_found'       — not in dictionary; AI not configured or returned UNKNOWN
       'ai_error'        — Groq API call failed
       'invalid_request' — bad language codes
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.translation import (
    SupportedLanguagesResponse,
    TranslationRequest,
    TranslationResponse,
)
from app.services.translation_service import (
    get_supported_languages,
    translate,
)

router = APIRouter(prefix="/translation", tags=["Translation"])

MODULE_NAME = "translation"


# ── Status (no DB dependency — keep identical to other modules) ───────────────

@router.get(
    "/status",
    summary="Translation module status",
    response_description="Confirms the translation module is reachable.",
)
def translation_status() -> dict[str, str]:
    """Architecture verification endpoint — no database required."""
    return {"module": MODULE_NAME, "status": "ready"}


# ── Supported languages ───────────────────────────────────────────────────────

@router.get(
    "/languages",
    response_model=SupportedLanguagesResponse,
    summary="List supported translation languages and direction pairs",
    response_description=(
        "All languages in the dictionary and every supported "
        "source → target translation pair."
    ),
)
async def list_translation_languages(
    db: AsyncSession = Depends(get_db),
) -> SupportedLanguagesResponse:
    """
    Return the languages present in the vocabulary dictionary and all
    supported translation direction pairs.

    Currently supported ISO 639-3 codes:
    - **kru** — Kurukh
    - **hin** — Hindi
    - **eng** — English

    All 6 directional pairs (kru→hin, kru→eng, hin→kru, hin→eng,
    eng→kru, eng→hin) are covered by the 299-entry dictionary.
    """
    return await get_supported_languages(db)


# ── Translate ─────────────────────────────────────────────────────────────────

@router.post(
    "/translate",
    response_model=TranslationResponse,
    status_code=status.HTTP_200_OK,
    summary="Translate a word using the Kurukh vocabulary dictionary",
    response_description="Translation result with matched dictionary entries.",
)
async def translate_text(
    request: TranslationRequest,
    db: AsyncSession = Depends(get_db),
) -> TranslationResponse:
    """
    Translate a word or short phrase using the Kurukh-Hindi-English
    vocabulary dictionary (299 entries, 15 categories).

    **Supported language codes** (`source_language` / `target_language`):
    | Code | Language |
    |------|----------|
    | `kru` | Kurukh |
    | `hin` | Hindi |
    | `eng` | English |

    **Behavior:**
    - Exact, case-insensitive match against the vocabulary database.
    - If multiple dictionary entries match (same word in different categories),
      all are returned in `matches`; the primary `translated_text` is the
      first match.
    - If no match is found, `method` is `"not_found"` and `translated_text`
      is an empty string — the service never fabricates a translation.

    **Examples:**
    ```json
    { "text": "अल्ला",  "source_language": "kru", "target_language": "hin" }
    { "text": "dog",   "source_language": "eng", "target_language": "kru" }
    { "text": "पानी",  "source_language": "hin", "target_language": "kru" }
    ```
    """
    return await translate(
        text=request.text,
        source_language=request.source_language,
        target_language=request.target_language,
        db=db,
    )
