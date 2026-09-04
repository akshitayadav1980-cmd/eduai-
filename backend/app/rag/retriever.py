"""
RAG retriever — PostgreSQL vocabulary search.

Retrieves relevant vocabulary entries from the existing `vocabulary_entries`
table using simple keyword/token matching against all three language columns
(Kurukh, Hindi, English).

No vector database or embeddings are required at this stage.  The retrieval
strategy is:

    1. Normalise the question into a set of search tokens.
    2. For each token run a case-insensitive ILIKE query across all three
       language columns (kurukh, hindi, english).
    3. Collect unique entries (de-duplicate by entry ID).
    4. Return at most *max_results* entries sorted by vocabulary entry ID.

This gives a clean, fast, and dependency-free retrieval step that can be
replaced with vector similarity search later without touching the service or
route layers.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.vocabulary import VocabularyEntry

logger = logging.getLogger(__name__)

# ── Context item ──────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class RetrievedEntry:
    """A single vocabulary entry returned by the retriever."""

    entry_id: str
    kurukh: str
    hindi: str
    english: str
    part_of_speech: str | None
    category: str | None
    verified: bool


# ── Retrieval ─────────────────────────────────────────────────────────────────

_STOP_WORDS: frozenset[str] = frozenset(
    {
        # English
        "a", "an", "the", "is", "are", "was", "were", "be", "been",
        "being", "have", "has", "had", "do", "does", "did", "will",
        "would", "shall", "should", "may", "might", "must", "can",
        "could", "to", "of", "in", "on", "at", "by", "for", "with",
        "and", "or", "but", "not", "what", "how", "why", "when",
        "where", "who", "which", "that", "this", "it", "its", "me",
        "my", "we", "our", "you", "your", "he", "she", "they", "their",
        # Hindi (common)
        "क्या", "कैसे", "क्यों", "कब", "कहाँ", "कौन", "है", "हैं",
        "था", "थे", "को", "का", "की", "के", "में", "से", "और",
        "या", "पर", "एक", "यह", "वह", "इस", "उस", "मैं", "हम",
        "आप", "वे",
    }
)

_MIN_TOKEN_LENGTH = 2
_DEFAULT_MAX_RESULTS = 5


def _tokenise(text: str) -> list[str]:
    """
    Lower-case the text, split on whitespace/punctuation, and remove
    stop words and very short tokens.
    """
    raw_tokens = re.split(r"[\s\.,!?;:'\"\(\)\[\]{}/\\]+", text.lower())
    return [
        t
        for t in raw_tokens
        if t and len(t) >= _MIN_TOKEN_LENGTH and t not in _STOP_WORDS
    ]


async def retrieve_context(
    question: str,
    db: AsyncSession,
    max_results: int = _DEFAULT_MAX_RESULTS,
) -> list[RetrievedEntry]:
    """
    Search the vocabulary_entries table for entries relevant to *question*.

    Returns up to *max_results* unique entries sorted by entry ID.
    Returns an empty list when no matching entries are found.
    """
    tokens = _tokenise(question)
    if not tokens:
        logger.debug("retrieve_context: no tokens extracted from question, returning empty")
        return []

    seen_ids: set[str] = set()
    results: list[RetrievedEntry] = []

    for token in tokens:
        pattern = f"%{token}%"
        stmt = (
            select(VocabularyEntry)
            .where(
                or_(
                    VocabularyEntry.kurukh.ilike(pattern),
                    VocabularyEntry.hindi.ilike(pattern),
                    VocabularyEntry.english.ilike(pattern),
                )
            )
            .order_by(VocabularyEntry.id)
            .limit(max_results * 2)  # over-fetch, then de-duplicate
        )
        db_result = await db.execute(stmt)
        for entry in db_result.scalars().all():
            if entry.id not in seen_ids and len(results) < max_results:
                seen_ids.add(entry.id)
                results.append(
                    RetrievedEntry(
                        entry_id=entry.id,
                        kurukh=entry.kurukh,
                        hindi=entry.hindi,
                        english=entry.english,
                        part_of_speech=entry.part_of_speech,
                        category=entry.category_id,
                        verified=entry.verified_by_native_speaker,
                    )
                )
        if len(results) >= max_results:
            break

    logger.debug(
        "retrieve_context: question=%r tokens=%r → %d entries",
        question,
        tokens,
        len(results),
    )
    return results
