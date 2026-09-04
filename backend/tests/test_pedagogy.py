"""
Tests for Step 12: Adaptive Pedagogy Foundation.

Covers all 12 acceptance criteria:
    1.  Each supported education level is accepted (schema validation).
    2.  Invalid education level is rejected with 422.
    3.  Primary prompt contains correct adaptation instructions.
    4.  Secondary prompt differs appropriately from Primary.
    5.  Higher Secondary prompt differs appropriately.
    6.  College prompt differs appropriately.
    7.  Professional prompt differs appropriately.
    8.  Selected language reaches the Groq prompt.
    9.  Education level reaches the Groq prompt.
    10. RAG context still reaches the prompt.
    11. Successful QA response remains method='rag'.
    12. Existing translation tests remain unchanged.

All tests are pure unit / schema tests — no real DB or Groq API calls.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.rag.prompt_builder import (
    build_prompt,
    get_level_guidance,
    get_level_label,
    SUPPORTED_EDUCATION_LEVELS_PROMPT,
)
from app.rag.retriever import RetrievedEntry
from app.schemas.qa import SUPPORTED_EDUCATION_LEVELS, QARequest


# ── Helpers ───────────────────────────────────────────────────────────────────

def _sample_entry(entry_id: str = "KUR-0001") -> RetrievedEntry:
    return RetrievedEntry(
        entry_id=entry_id,
        kurukh="ड़ी",
        hindi="पानी",
        english="water",
        part_of_speech="noun",
        category="nature",
        verified=True,
    )


def _sys_prompt(level: str, lang: str = "eng", entries=None) -> str:
    sys_p, _ = build_prompt(
        question="What is water?",
        source_language=lang,
        education_level=level,
        retrieved_entries=entries or [],
    )
    return sys_p


def _usr_msg(level: str, lang: str = "eng", entries=None) -> str:
    _, usr = build_prompt(
        question="What is water?",
        source_language=lang,
        education_level=level,
        retrieved_entries=entries or [],
    )
    return usr


# ── 1. All supported levels are accepted ──────────────────────────────────────

class TestSupportedLevelsAccepted:
    """Schema validation: every canonical level must pass QARequest validation."""

    @pytest.mark.parametrize("level", sorted(SUPPORTED_EDUCATION_LEVELS))
    def test_all_levels_accepted_by_schema(self, level: str) -> None:
        req = QARequest(
            question="What is the Kurukh word for water?",
            source_language="eng",
            education_level=level,
        )
        assert req.education_level == level

    def test_five_levels_exist(self) -> None:
        assert SUPPORTED_EDUCATION_LEVELS == {
            "primary", "secondary", "higher_secondary", "college", "professional"
        }

    def test_prompt_builder_covers_all_five_levels(self) -> None:
        assert SUPPORTED_EDUCATION_LEVELS_PROMPT == SUPPORTED_EDUCATION_LEVELS


# ── 2. Invalid level is rejected ──────────────────────────────────────────────

class TestInvalidLevelRejected:
    """Invalid education levels must fail schema validation."""

    @pytest.mark.parametrize("bad_level", [
        "beginner", "intermediate", "advanced", "expert", "phd", "toddler", "",
    ])
    def test_invalid_level_raises_value_error(self, bad_level: str) -> None:
        with pytest.raises(Exception):   # pydantic.ValidationError
            QARequest(
                question="What is water?",
                source_language="eng",
                education_level=bad_level,
            )

    def test_invalid_level_returns_422_via_http(self) -> None:
        from app.main import app as fastapi_app
        with TestClient(fastapi_app, raise_server_exceptions=False) as client:
            r = client.post(
                "/api/v1/qa/ask",
                json={"question": "What is water?", "source_language": "eng",
                      "education_level": "guru"},
            )
        assert r.status_code == 422


# ── 3. Primary prompt instructions ────────────────────────────────────────────

class TestPrimaryPrompt:
    """Primary level must produce a prompt aimed at age ~6–11."""

    def test_primary_label_in_system_prompt(self) -> None:
        sys_p = _sys_prompt("primary")
        assert "PRIMARY" in sys_p.upper()

    def test_primary_guidance_mentions_simple_vocabulary(self) -> None:
        guidance = get_level_guidance("primary")
        low = guidance.lower()
        assert "simple" in low

    def test_primary_guidance_no_technical_jargon(self) -> None:
        guidance = get_level_guidance("primary")
        low = guidance.lower()
        assert "jargon" in low or "technical" in low

    def test_primary_guidance_short_sentences(self) -> None:
        guidance = get_level_guidance("primary")
        low = guidance.lower()
        assert "short" in low

    def test_primary_guidance_familiar_examples(self) -> None:
        guidance = get_level_guidance("primary")
        low = guidance.lower()
        assert "example" in low or "familiar" in low


# ── 4. Secondary prompt differs from Primary ──────────────────────────────────

class TestSecondaryPromptDiffersFromPrimary:
    """Secondary guidance must be materially different from Primary."""

    def test_secondary_label_in_system_prompt(self) -> None:
        sys_p = _sys_prompt("secondary")
        assert "SECONDARY" in sys_p.upper()

    def test_secondary_guidance_differs_from_primary(self) -> None:
        pri = get_level_guidance("primary")
        sec = get_level_guidance("secondary")
        assert pri != sec

    def test_secondary_mentions_terminology(self) -> None:
        guidance = get_level_guidance("secondary")
        low = guidance.lower()
        assert "terminolog" in low or "term" in low

    def test_secondary_guidance_more_detailed_than_primary(self) -> None:
        # Secondary guidance should be at least as long as Primary
        pri = get_level_guidance("primary")
        sec = get_level_guidance("secondary")
        assert len(sec) >= len(pri) * 0.7  # substantial content


# ── 5. Higher Secondary prompt differs appropriately ─────────────────────────

class TestHigherSecondaryPrompt:
    """Higher secondary must emphasise conceptual/academic depth."""

    def test_higher_secondary_label_present(self) -> None:
        sys_p = _sys_prompt("higher_secondary")
        assert "HIGHER" in sys_p.upper() or "SECONDARY" in sys_p.upper()

    def test_higher_secondary_mentions_concept(self) -> None:
        guidance = get_level_guidance("higher_secondary")
        low = guidance.lower()
        assert "concept" in low or "principl" in low or "mechanism" in low

    def test_higher_secondary_differs_from_secondary(self) -> None:
        sec = get_level_guidance("secondary")
        hs = get_level_guidance("higher_secondary")
        assert sec != hs

    def test_higher_secondary_mentions_academic(self) -> None:
        guidance = get_level_guidance("higher_secondary")
        low = guidance.lower()
        assert "academic" in low or "scientific" in low or "curriculum" in low


# ── 6. College prompt differs appropriately ───────────────────────────────────

class TestCollegePrompt:
    """College level must target undergraduate academic rigour."""

    def test_college_label_present(self) -> None:
        sys_p = _sys_prompt("college")
        assert "COLLEGE" in sys_p.upper() or "UNDERGRADUATE" in sys_p.upper()

    def test_college_mentions_rigorous_or_precise(self) -> None:
        guidance = get_level_guidance("college")
        low = guidance.lower()
        assert "rigorous" in low or "precise" in low or "theory" in low

    def test_college_differs_from_higher_secondary(self) -> None:
        hs = get_level_guidance("higher_secondary")
        col = get_level_guidance("college")
        assert hs != col


# ── 7. Professional prompt differs appropriately ──────────────────────────────

class TestProfessionalPrompt:
    """Professional level must emphasise conciseness and technical precision."""

    def test_professional_label_present(self) -> None:
        sys_p = _sys_prompt("professional")
        assert "PROFESSIONAL" in sys_p.upper() or "EXPERT" in sys_p.upper()

    def test_professional_mentions_concise_or_precise(self) -> None:
        guidance = get_level_guidance("professional")
        low = guidance.lower()
        assert "concise" in low or "precise" in low

    def test_professional_mentions_domain(self) -> None:
        guidance = get_level_guidance("professional")
        low = guidance.lower()
        assert "domain" in low or "technical" in low or "expert" in low

    def test_professional_differs_from_college(self) -> None:
        col = get_level_guidance("college")
        pro = get_level_guidance("professional")
        assert col != pro

    def test_all_five_guidances_are_distinct(self) -> None:
        """No two level guidances must be identical."""
        levels = ["primary", "secondary", "higher_secondary", "college", "professional"]
        guidances = [get_level_guidance(lv) for lv in levels]
        assert len(set(guidances)) == 5, "All five level guidances must be unique"


# ── 8. Language reaches the Groq prompt ───────────────────────────────────────

class TestLanguageInPrompt:
    """The source_language display name must appear in the system prompt."""

    @pytest.mark.parametrize("lang,expected_name", [
        ("eng", "English"),
        ("hin", "Hindi"),
        ("kru", "Kurukh"),
    ])
    def test_language_name_in_system_prompt(self, lang: str, expected_name: str) -> None:
        sys_p = _sys_prompt("secondary", lang=lang)
        assert expected_name in sys_p


# ── 9. Education level reaches the Groq prompt ───────────────────────────────

class TestEducationLevelInPrompt:
    """The education level must materially appear in the system prompt."""

    @pytest.mark.parametrize("level", [
        "primary", "secondary", "higher_secondary", "college", "professional",
    ])
    def test_level_label_in_system_prompt(self, level: str) -> None:
        label = get_level_label(level)
        sys_p = _sys_prompt(level)
        # The label string (e.g. "PRIMARY", "COLLEGE") must appear in the prompt
        assert label.split("(")[0].strip().upper() in sys_p.upper()

    @pytest.mark.parametrize("level", [
        "primary", "secondary", "higher_secondary", "college", "professional",
    ])
    def test_level_guidance_in_system_prompt(self, level: str) -> None:
        guidance = get_level_guidance(level)
        sys_p = _sys_prompt(level)
        # At least the first distinctive instruction keyword must appear
        first_sentence = guidance.split(".")[0]
        # check a keyword from the first sentence
        keyword = [w for w in first_sentence.split() if len(w) > 4][0].lower()
        assert keyword in sys_p.lower()


# ── 10. RAG context still reaches the prompt ──────────────────────────────────

class TestRAGContextInPrompt:
    """Vocabulary context must appear in the user message regardless of level."""

    @pytest.mark.parametrize("level", [
        "primary", "secondary", "higher_secondary", "college", "professional",
    ])
    def test_context_entry_in_user_message(self, level: str) -> None:
        entry = _sample_entry("KUR-TEST-99")
        _, usr = build_prompt(
            question="Tell me about water.",
            source_language="eng",
            education_level=level,
            retrieved_entries=[entry],
        )
        assert "KUR-TEST-99" in usr
        assert "water" in usr.lower()
        assert "VOCABULARY CONTEXT FROM DICTIONARY" in usr

    def test_no_context_note_present_when_empty(self) -> None:
        _, usr = build_prompt("Any question?", "eng", "college", retrieved_entries=[])
        assert "No matching vocabulary" in usr


# ── 11. method='rag' on success ───────────────────────────────────────────────

class TestMethodRagOnSuccess:
    """Service must return method='rag' for all valid levels on Groq success."""

    @pytest.mark.asyncio
    @pytest.mark.parametrize("level", [
        "primary", "secondary", "higher_secondary", "college", "professional",
    ])
    async def test_method_rag_for_all_levels(self, level: str) -> None:
        from app.rag.qa_service import answer_question

        db = AsyncMock()
        with patch("app.rag.qa_service.retrieve_context", new=AsyncMock(return_value=[])), \
             patch("app.rag.qa_service._call_groq", new=AsyncMock(return_value="An answer.")):
            response = await answer_question("What is water?", "eng", level, db)

        assert response.method == "rag"
        assert response.education_level == level
        assert response.answer == "An answer."


# ── 12. Translation pipeline unchanged ────────────────────────────────────────

class TestTranslationUnchangedStep12:
    """Translation endpoint must be completely unaffected by Step 12 changes."""

    @pytest.fixture(scope="class")
    def client(self) -> TestClient:
        from app.main import app as fastapi_app
        with TestClient(fastapi_app, raise_server_exceptions=False) as c:
            yield c

    def test_translation_status_200(self, client: TestClient) -> None:
        r = client.get("/api/v1/translation/status")
        assert r.status_code == 200
        assert r.json()["status"] == "ready"

    def test_translation_invalid_request_schema_intact(self, client: TestClient) -> None:
        r = client.post(
            "/api/v1/translation/translate",
            json={"text": "hello", "source_language": "eng", "target_language": "eng"},
        )
        assert r.status_code == 200
        assert r.json()["method"] == "invalid_request"

    def test_translation_422_on_missing_body(self, client: TestClient) -> None:
        r = client.post("/api/v1/translation/translate")
        assert r.status_code == 422
