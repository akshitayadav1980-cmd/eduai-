# AI / LLM integration layer.
# groq_client.py — Groq API for AI-fallback translation (Step 9).
# Adaptive tutoring, quiz generation, and RAG will be wired here in later steps.

from app.ai.groq_client import (
    GroqNotConfiguredError,
    GroqTranslationError,
    ai_translate,
)

__all__ = ["ai_translate", "GroqNotConfiguredError", "GroqTranslationError"]
