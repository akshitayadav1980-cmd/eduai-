"""
Tests for Step 11: RAG Foundation.

Covers:
    1. QA request validation (schema-level, via HTTP 422).
    2. Retriever returning relevant vocabulary entries (unit, mocked DB).
    3. Retriever returning no results (unit, mocked DB).
    4. Groq call invoked with context when retriever finds entries (service).
    5. Successful RAG response â€” method='rag', answer present (service).
    6. Groq failure handling â€” method='ai_error' (service).
    7. Existing translation tests still pass (integration smoke test).

All tests use mocks â€” no real database or Groq API calls are made.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.ai.groq_client import GroqTranslationError
from app.rag.retriever import RetrievedEntry, _tokenise


# â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


def _make_entry(**kwargs) -> MagicMock:
    """Build a minimal VocabularyEntry mock."""
    e = MagicMock()
    e.id = kwargs.get("id", "KUR-0001")
    e.kurukh = kwargs.get("kurukh", "à¤¡à¤¼à¥€")
    e.hindi = kwargs.get("hindi", "à¤ªà¤¾à¤¨à¥€")
    e.english = kwargs.get("english", "water")
    e.part_of_speech = kwargs.get("part_of_speech", "noun")
    e.category_id = kwargs.get("category_id", "nature")
    e.verified_by_native_speaker = kwargs.get("verified_by_native_speaker", True)
    return e


def _make_db_returning(entries: list) -> AsyncMock:
    """Build a mock AsyncSession that returns *entries* on scalars().all()."""
    db = AsyncMock()
    result = MagicMock()
    result.scalars.return_value.all.return_value = entries
    db.execute = AsyncMock(return_value=result)
    return db


# â”€â”€ 1. QA request validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


class TestQARequestValidation:
    """Schema-level validation via the HTTP layer (no DB calls)."""

    @pytest.fixture(scope="class")
    def client(self) -> TestClient:
        from app.main import app as fastapi_app
        with TestClient(fastapi_app, raise_server_exceptions=False) as c:
            yield c

    PATH = "/api/v1/qa/ask"

    def test_status_endpoint_returns_ready(self, client: TestClient) -> None:
        r = client.get("/api/v1/qa/status")
        assert r.status_code == 200
        body = r.json()
        assert body["module"] == "qa"
        assert body["status"] == "ready"

    def test_missing_body_returns_422(self, client: TestClient) -> None:
        r = client.post(self.PATH)
        assert r.status_code == 422

    def test_blank_question_returns_422(self, client: TestClient) -> None:
        r = client.post(
            self.PATH,
            json={"question": "   ", "source_language": "eng", "education_level": "primary"},
        )
        assert r.status_code == 422

    def test_invalid_language_code_returns_422(self, client: TestClient) -> None:
        r = client.post(
            self.PATH,
            json={"question": "What is water?", "source_language": "xyz", "education_level": "primary"},
        )
        assert r.status_code == 422

    def test_invalid_education_level_returns_422(self, client: TestClient) -> None:
        r = client.post(
            self.PATH,
            json={"question": "What is water?", "source_language": "eng", "education_level": "expert"},
        )
        assert r.status_code == 422

    def test_missing_question_returns_422(self, client: TestClient) -> None:
        r = client.post(
            self.PATH,
            json={"source_language": "eng", "education_level": "primary"},
        )
        assert r.status_code == 422

    def test_response_schema_keys_present(self, client: TestClient) -> None:
        """A valid request must include all required response keys."""
        with patch(
            "app.rag.qa_service._call_groq",
            new=AsyncMock(return_value="Water is called 'à¤¡à¤¼à¥€' in Kurukh."),
        ), patch(
            "app.rag.qa_service.retrieve_context",
            new=AsyncMock(return_value=[]),
        ):
            r = client.post(
                self.PATH,
                json={
                    "question": "What is water in Kurukh?",
                    "source_language": "eng",
                    "education_level": "primary",
                },
            )
        assert r.status_code == 200
        body = r.json()
        required = {
            "question", "answer", "source_language", "education_level",
            "method", "retrieved_context", "context_count",
        }
        assert required.issubset(body.keys())


# â”€â”€ 2. Retriever returns relevant entries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


class TestRetrieverReturnsEntries:
    """Unit-test the retriever with a mocked DB session."""

    @pytest.mark.asyncio
    async def test_retriever_returns_matching_entries(self) -> None:
        """Retriever returns entries when the DB finds matches."""
        from app.rag.retriever import retrieve_context

        mock_entry = _make_entry()
        db = _make_db_returning([mock_entry])

        results = await retrieve_context("water", db)

        assert len(results) == 1
        assert isinstance(results[0], RetrievedEntry)
        assert results[0].entry_id == "KUR-0001"
        assert results[0].english == "water"

    @pytest.mark.asyncio
    async def test_retriever_deduplicates_entries(self) -> None:
        """Same entry returned from two token queries must appear only once."""
        from app.rag.retriever import retrieve_context

        entry = _make_entry(id="KUR-0001", english="dog food")

        # Two calls to db.execute â†’ same entry both times
        db = AsyncMock()
        result = MagicMock()
        result.scalars.return_value.all.return_value = [entry]
        db.execute = AsyncMock(return_value=result)

        results = await retrieve_context("dog food", db)

        # "dog" and "food" are two tokens â†’ two DB calls â†’ must deduplicate
        ids = [r.entry_id for r in results]
        assert ids.count("KUR-0001") == 1

    @pytest.mark.asyncio
    async def test_retriever_respects_max_results(self) -> None:
        """Retriever must not return more than max_results entries."""
        from app.rag.retriever import retrieve_context

        entries = [_make_entry(id=f"KUR-{i:04d}", english=f"word{i}") for i in range(20)]
        db = _make_db_returning(entries)

        results = await retrieve_context("word", db, max_results=3)

        assert len(results) <= 3


# â”€â”€ 3. Retriever returns no results â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


class TestRetrieverNoResults:
    """Retriever must handle missing matches and empty questions gracefully."""

    @pytest.mark.asyncio
    async def test_retriever_returns_empty_list_on_no_match(self) -> None:
        from app.rag.retriever import retrieve_context

        db = _make_db_returning([])
        results = await retrieve_context("xyzqwerty999", db)
        assert results == []

    @pytest.mark.asyncio
    async def test_retriever_returns_empty_list_on_stop_words_only(self) -> None:
        """Questions made up entirely of stop words produce no tokens â†’ empty result."""
        from app.rag.retriever import retrieve_context

        db = AsyncMock()
        # Should not even call db.execute because tokens list will be empty
        results = await retrieve_context("is the a", db)
        assert results == []
        db.execute.assert_not_called()

    def test_tokenise_filters_stop_words(self) -> None:
        tokens = _tokenise("what is the meaning of water")
        assert "what" not in tokens
        assert "is" not in tokens
        assert "the" not in tokens
        assert "of" not in tokens
        assert "water" in tokens
        assert "meaning" in tokens


# â”€â”€ 4. Groq called with retrieved context â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


class TestGroqCalledWithContext:
    """Service must pass the retrieved context to the prompt builder and Groq."""

    @pytest.mark.asyncio
    async def test_groq_receives_context_in_prompt(self) -> None:
        """When retriever returns entries, the Groq call must include their content."""
        from app.rag.qa_service import answer_question

        retrieved = [
            RetrievedEntry(
                entry_id="KUR-0042",
                kurukh="à¤¡à¤¼à¥€",
                hindi="à¤ªà¤¾à¤¨à¥€",
                english="water",
                part_of_speech="noun",
                category="nature",
                verified=True,
            )
        ]

        captured_prompts: list[tuple[str, str]] = []

        async def fake_call_groq(system_prompt: str, user_message: str) -> str:
            captured_prompts.append((system_prompt, user_message))
            return "Water in Kurukh is à¤¡à¤¼à¥€."

        db = AsyncMock()

        with patch("app.rag.qa_service.retrieve_context", new=AsyncMock(return_value=retrieved)), \
             patch("app.rag.qa_service._call_groq", new=fake_call_groq):
            response = await answer_question("What is water in Kurukh?", "eng", "primary", db)

        assert len(captured_prompts) == 1
        _, user_msg = captured_prompts[0]
        # The context entry must appear in the user message
        assert "KUR-0042" in user_msg
        assert "water" in user_msg.lower()


# â”€â”€ 5. Successful RAG response â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


class TestSuccessfulRAGResponse:
    """Service must return method='rag' and non-empty answer on success."""

    @pytest.mark.asyncio
    async def test_method_is_rag_on_success(self) -> None:
        from app.rag.qa_service import answer_question

        db = AsyncMock()
        with patch("app.rag.qa_service.retrieve_context", new=AsyncMock(return_value=[])), \
             patch("app.rag.qa_service._call_groq", new=AsyncMock(return_value="An answer.")):
            response = await answer_question("What is Kurukh?", "eng", "secondary", db)

        assert response.method == "rag"
        assert response.answer == "An answer."
        assert response.source_language == "eng"
        assert response.education_level == "secondary"

    @pytest.mark.asyncio
    async def test_context_count_matches_retrieved(self) -> None:
        from app.rag.qa_service import answer_question

        retrieved = [
            RetrievedEntry("KUR-0001", "à¤¡à¤¼à¥€", "à¤ªà¤¾à¤¨à¥€", "water", "noun", "nature", True),
            RetrievedEntry("KUR-0002", "à¤…à¤²à¥à¤²à¤¾", "à¤•à¥à¤¤à¥à¤¤à¤¾", "dog", "noun", "animals", False),
        ]
        db = AsyncMock()
        with patch("app.rag.qa_service.retrieve_context", new=AsyncMock(return_value=retrieved)), \
             patch("app.rag.qa_service._call_groq", new=AsyncMock(return_value="Two matches found.")):
            response = await answer_question("Tell me about water and dogs", "eng", "primary", db)

        assert response.context_count == 2
        assert len(response.retrieved_context) == 2


# â”€â”€ 6. Groq failure handling â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


class TestGroqFailureHandling:
    """Service must return method='ai_error' when Groq raises GroqTranslationError."""

    @pytest.mark.asyncio
    async def test_groq_failure_returns_ai_error(self) -> None:
        from app.rag.qa_service import answer_question

        db = AsyncMock()
        with patch("app.rag.qa_service.retrieve_context", new=AsyncMock(return_value=[])), \
             patch(
                 "app.rag.qa_service._call_groq",
                 new=AsyncMock(side_effect=GroqTranslationError("API timeout")),
             ):
            response = await answer_question("What is water?", "eng", "primary", db)

        assert response.method == "ai_error"
        assert response.answer == ""
        assert response.message is not None

    @pytest.mark.asyncio
    async def test_groq_not_configured_returns_not_configured(self) -> None:
        from app.ai.groq_client import GroqNotConfiguredError
        from app.rag.qa_service import answer_question

        db = AsyncMock()
        with patch("app.rag.qa_service.retrieve_context", new=AsyncMock(return_value=[])), \
             patch(
                 "app.rag.qa_service._call_groq",
                 new=AsyncMock(side_effect=GroqNotConfiguredError("no key")),
             ):
            response = await answer_question("What is water?", "eng", "primary", db)

        assert response.method == "not_configured"
        assert response.answer == ""

    @pytest.mark.asyncio
    async def test_groq_empty_response_returns_no_answer(self) -> None:
        from app.rag.qa_service import answer_question

        db = AsyncMock()
        with patch("app.rag.qa_service.retrieve_context", new=AsyncMock(return_value=[])), \
             patch("app.rag.qa_service._call_groq", new=AsyncMock(return_value=None)):
            response = await answer_question("What is water?", "eng", "primary", db)

        assert response.method == "no_answer"
        assert response.answer == ""


# â”€â”€ 7. Existing translation tests smoke check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


class TestTranslationPipelineUnchanged:
    """Verify the translation endpoint still works correctly after Step 11."""

    @pytest.fixture(scope="class")
    def client(self) -> TestClient:
        from app.main import app as fastapi_app
        with TestClient(fastapi_app, raise_server_exceptions=False) as c:
            yield c

    def test_translation_status_still_works(self, client: TestClient) -> None:
        r = client.get("/api/v1/translation/status")
        assert r.status_code == 200
        body = r.json()
        assert body["module"] == "translation"
        assert body["status"] == "ready"

    def test_translation_missing_body_still_422(self, client: TestClient) -> None:
        r = client.post("/api/v1/translation/translate")
        assert r.status_code == 422

    def test_translation_response_schema_intact(self, client: TestClient) -> None:
        """
        The translation response schema must still have all expected fields
        after Step 11 changes.  We use source==target to trigger the
        service-level invalid_request path â€” no DB connection required.
        """
        r = client.post(
            "/api/v1/translation/translate",
            json={
                "text": "water",
                "source_language": "eng",
                "target_language": "eng",   # same â†’ invalid_request, no DB hit
            },
        )
        assert r.status_code == 200
        body = r.json()
        required = {
            "original_text", "translated_text", "source_language",
            "target_language", "method", "matches",
        }
        assert required.issubset(body.keys())
        assert body["method"] == "invalid_request"
