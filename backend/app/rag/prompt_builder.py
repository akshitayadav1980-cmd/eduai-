"""
RAG prompt builder — adaptive pedagogy edition.

Constructs a grounded system + user prompt pair that:

  * Clearly separates retrieved dictionary context from the student's question.
  * Instructs Groq to use the context when relevant and avoid inventing facts.
  * Adapts vocabulary complexity, explanation depth, sentence structure, examples,
    terminology, and answer structure to one of five canonical education levels.
  * Responds in the requested language.

Education levels (Step 12):
    primary          — very simple language, familiar examples, no jargon
    secondary        — clear language, key terminology with explanations
    higher_secondary — deeper concepts, academic terminology, structured reasoning
    college          — academically detailed, precise terminology, conceptual depth
    professional     — technically precise, domain-appropriate, concise

This module is intentionally pure Python (no I/O, no async) so it can be
unit-tested without a database or network connection.
"""

from __future__ import annotations

from app.rag.retriever import RetrievedEntry

# ── Language display names ─────────────────────────────────────────────────────

_LANG_NAMES: dict[str, str] = {
    "kru": "Kurukh",
    "hin": "Hindi",
    "eng": "English",
}

# ── Adaptive-pedagogy level descriptors ───────────────────────────────────────
# Each entry has:
#   label        — human-readable level name shown in the system prompt
#   guidance     — specific instructions for vocabulary, depth, examples, structure

_LEVEL_DESCRIPTORS: dict[str, dict[str, str]] = {
    "primary": {
        "label": "PRIMARY (Age ~6–11)",
        "guidance": (
            "VOCABULARY: Use only the simplest everyday words a child would know. "
            "Never use technical jargon or complex academic terms.\n"
            "SENTENCE COMPLEXITY: Keep sentences very short — maximum one idea per sentence.\n"
            "EXPLANATION DEPTH: Give a single clear, concrete explanation. Do not go into "
            "background theory or nuance.\n"
            "EXAMPLES: Use familiar, real-world examples from daily life "
            "(food, animals, family, nature).\n"
            "TERMINOLOGY: Avoid all subject-specific terminology. "
            "If a specialised word is unavoidable, immediately explain it in the simplest words.\n"
            "STRUCTURE: Short direct answer first, then one simple example if helpful. "
            "No headers, no bullet lists, no multi-paragraph explanations."
        ),
    },
    "secondary": {
        "label": "SECONDARY (Age ~12–16)",
        "guidance": (
            "VOCABULARY: Use clear, everyday language. "
            "Introduce important subject-specific words but explain each one briefly.\n"
            "SENTENCE COMPLEXITY: Moderate sentence length; "
            "connect ideas with simple linking words.\n"
            "EXPLANATION DEPTH: Give a clear explanation with one layer of supporting detail. "
            "Mention why the concept matters in practical terms.\n"
            "EXAMPLES: Use school-relevant, practical examples "
            "(science class, everyday observation).\n"
            "TERMINOLOGY: Introduce key terms with a short parenthetical definition. "
            "Use them consistently after introduction.\n"
            "STRUCTURE: Direct answer, brief explanation, one example. "
            "May use a short numbered list when listing steps or items."
        ),
    },
    "higher_secondary": {
        "label": "HIGHER SECONDARY (Age ~17–18)",
        "guidance": (
            "VOCABULARY: Use appropriate scientific and academic vocabulary. "
            "Students are familiar with subject terminology from their curriculum.\n"
            "SENTENCE COMPLEXITY: Well-structured sentences; "
            "compound and complex sentences are appropriate.\n"
            "EXPLANATION DEPTH: Provide a conceptual explanation including underlying "
            "principles or mechanisms. Distinguish between related concepts where relevant.\n"
            "EXAMPLES: Use subject-relevant examples including diagrams described in text, "
            "formulae context, or real-world applications in the field.\n"
            "TERMINOLOGY: Use standard subject-specific terminology freely. "
            "Define only highly specialised terms that go beyond the curriculum.\n"
            "STRUCTURE: Structured response — brief direct answer, conceptual explanation, "
            "supporting example, and optionally a summary statement."
        ),
    },
    "college": {
        "label": "COLLEGE / UNDERGRADUATE",
        "guidance": (
            "VOCABULARY: Assume undergraduate familiarity with the subject. "
            "Use precise academic and domain-specific vocabulary without over-explaining.\n"
            "SENTENCE COMPLEXITY: Sophisticated sentence structures are expected. "
            "Qualify claims appropriately.\n"
            "EXPLANATION DEPTH: Provide academically rigorous explanation covering "
            "underlying theory, mechanisms, and edge cases or limitations where relevant.\n"
            "EXAMPLES: Use discipline-appropriate examples, referencing methodologies, "
            "case studies, or theoretical constructs as applicable.\n"
            "TERMINOLOGY: Use domain-standard terminology precisely. "
            "Distinguish between related technical terms.\n"
            "STRUCTURE: Well-organised response — thesis statement, detailed exposition, "
            "examples, and a synthesising conclusion. "
            "Bullet points or numbered lists are acceptable for enumerations."
        ),
    },
    "professional": {
        "label": "PROFESSIONAL / EXPERT",
        "guidance": (
            "VOCABULARY: Use domain-standard technical vocabulary throughout. "
            "No hedging or over-explanation of standard concepts.\n"
            "SENTENCE COMPLEXITY: Concise and precise — every word earns its place.\n"
            "EXPLANATION DEPTH: Provide only the depth required to answer the question "
            "accurately. Assume significant domain expertise. "
            "Note limitations, caveats, or best practices where professionally relevant.\n"
            "EXAMPLES: Reference established methodologies, industry standards, "
            "or canonical cases. Keep examples brief.\n"
            "TERMINOLOGY: Use exact technical terminology. "
            "Abbreviations and acronyms standard in the field are acceptable.\n"
            "STRUCTURE: Direct answer first. Supporting context only if necessary "
            "for completeness. Omit preamble and filler."
        ),
    },
}

# Fallback when an unrecognised level is received (should not happen after
# schema validation, but defensive programming prevents a KeyError).
_DEFAULT_DESCRIPTOR = _LEVEL_DESCRIPTORS["secondary"]


# ── System prompt template ─────────────────────────────────────────────────────

_SYSTEM_TEMPLATE = """\
You are an educational AI assistant for the Vernacular AI platform.
Your role is to answer students' questions clearly, accurately, and at \
the appropriate level.

LANGUAGE REQUIREMENT:
Respond exclusively in {response_lang_name}. \
If that language is Kurukh, use both the native Kurukh script and romanised \
Kurukh where helpful.

EDUCATION LEVEL: {level_label}
Calibrate your entire answer — vocabulary, depth, examples, terminology, and \
structure — exactly as follows:
{level_guidance}

GROUNDING RULES:
1. A set of VOCABULARY CONTEXT entries from our verified dictionary is \
provided below. When your answer involves those words, use the exact forms \
from the context.
2. Do NOT invent dictionary translations that are not in the context.
3. If the context is insufficient or irrelevant to the question, acknowledge \
that honestly and answer from your general knowledge — but make clear you are \
doing so.
4. Always prioritise accuracy over completeness. A short honest answer is \
better than a long speculative one.
"""

# ── Context block helpers ──────────────────────────────────────────────────────

_NO_CONTEXT_NOTE = (
    "[No matching vocabulary entries were found in the dictionary for this question. "
    "Answer from your general knowledge and note this to the student.]"
)


def _format_entry(entry: RetrievedEntry) -> str:
    parts = [
        f"  Kurukh: {entry.kurukh}",
        f"  Hindi: {entry.hindi}",
        f"  English: {entry.english}",
    ]
    if entry.part_of_speech:
        parts.append(f"  Part of speech: {entry.part_of_speech}")
    if entry.category:
        parts.append(f"  Category: {entry.category}")
    verified_note = "✓ verified by native speaker" if entry.verified else "unverified"
    parts.append(f"  [{verified_note}]")
    return "\n".join(parts)


def _build_context_block(entries: list[RetrievedEntry]) -> str:
    if not entries:
        return _NO_CONTEXT_NOTE
    blocks = [
        f"Entry {i + 1} [{e.entry_id}]:\n{_format_entry(e)}"
        for i, e in enumerate(entries)
    ]
    return "\n\n".join(blocks)


# ── Public API ─────────────────────────────────────────────────────────────────

def build_prompt(
    question: str,
    source_language: str,
    education_level: str,
    retrieved_entries: list[RetrievedEntry],
) -> tuple[str, str]:
    """
    Return a (system_prompt, user_message) tuple ready for the Groq client.

    Args:
        question:           The student's original question.
        source_language:    ISO 639-3 code of the requested response language.
        education_level:    One of: primary | secondary | higher_secondary |
                            college | professional.
        retrieved_entries:  Vocabulary entries returned by the retriever.

    Returns:
        (system_prompt, user_message) — both plain strings.
    """
    lang_name = _LANG_NAMES.get(source_language, source_language)
    descriptor = _LEVEL_DESCRIPTORS.get(education_level.lower(), _DEFAULT_DESCRIPTOR)

    system_prompt = _SYSTEM_TEMPLATE.format(
        response_lang_name=lang_name,
        level_label=descriptor["label"],
        level_guidance=descriptor["guidance"],
    )

    context_block = _build_context_block(retrieved_entries)

    user_message = (
        f"VOCABULARY CONTEXT FROM DICTIONARY:\n"
        f"{context_block}\n\n"
        f"STUDENT QUESTION:\n"
        f"{question}"
    )

    return system_prompt, user_message


# ── Helpers exposed for testing ────────────────────────────────────────────────

def get_level_label(education_level: str) -> str:
    """Return the display label for a given education level (for tests)."""
    return _LEVEL_DESCRIPTORS.get(
        education_level.lower(), _DEFAULT_DESCRIPTOR
    )["label"]


def get_level_guidance(education_level: str) -> str:
    """Return the full guidance string for a given education level (for tests)."""
    return _LEVEL_DESCRIPTORS.get(
        education_level.lower(), _DEFAULT_DESCRIPTOR
    )["guidance"]


SUPPORTED_EDUCATION_LEVELS_PROMPT: frozenset[str] = frozenset(_LEVEL_DESCRIPTORS.keys())
