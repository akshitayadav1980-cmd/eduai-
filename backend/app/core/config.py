"""
Application configuration.

Settings are loaded from environment variables (and an optional .env file
once python-dotenv is added). Every future service credential — database URL,
AI provider keys, JWT secret, etc. — should be declared here rather than
scattered throughout the codebase.
"""

from __future__ import annotations

import os
from typing import List

from dotenv import load_dotenv

load_dotenv()  # Load variables from backend/.env into the environment


class Settings:
    """Central settings object.

    All values fall back to safe defaults so the app can start without a .env
    file during development. Sensitive values (keys, secrets) have no default
    and must be supplied via the environment before those features are enabled.
    """

    # ── Application ──────────────────────────────────────────────────────────
    APP_TITLE: str = os.getenv("APP_TITLE", "Vernacular AI Backend")
    APP_DESCRIPTION: str = os.getenv(
        "APP_DESCRIPTION",
        (
            "Backend API that powers the Vernacular AI educational platform — "
            "providing adaptive AI tutoring, regional-language translation, "
            "RAG-based knowledge retrieval, voice interaction, quiz generation, "
            "and student progress tracking across 11 Indian languages."
        ),
    )
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # ── Server ───────────────────────────────────────────────────────────────
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))

    # ── CORS ─────────────────────────────────────────────────────────────────
    # Comma-separated list of allowed origins.
    # In development the Vite dev server runs on port 5173 by default.
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ]

    # ── Database (Step 2 — not yet implemented) ───────────────────────────────
    DATABASE_URL: str | None = os.getenv("DATABASE_URL")  # e.g. postgresql+asyncpg://...

    # ── Authentication ────────────────────────────────────────────────────────
    # Set JWT_SECRET_KEY in backend/.env.  Use a long random string, e.g.:
    #   python -c "import secrets; print(secrets.token_hex(32))"
    # The application starts without this key but all /auth routes requiring
    # a valid token will fail until it is set.
    JWT_SECRET_KEY: str | None = os.getenv("JWT_SECRET_KEY")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )

    # ── AI / LLM ─────────────────────────────────────────────────────────────
    # Groq API client for AI-fallback translation.
    # Set GROQ_API_KEY in backend/.env to enable AI translation.
    # When not set, the API returns 'not_found' for words outside the dictionary.
    GROQ_API_KEY: str | None = os.getenv("GROQ_API_KEY")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
    GROQ_TIMEOUT_SECONDS: float = float(os.getenv("GROQ_TIMEOUT_SECONDS", "10.0"))

    # Groq Whisper model for Speech-to-Text (Step 14).
    # whisper-large-v3-turbo is Groq's recommended fast multilingual model.
    # Supports English (en) and Hindi (hi). Kurukh is NOT supported by Whisper.
    GROQ_STT_MODEL: str = os.getenv("GROQ_STT_MODEL", "whisper-large-v3-turbo")
    GROQ_STT_TIMEOUT_SECONDS: float = float(os.getenv("GROQ_STT_TIMEOUT_SECONDS", "30.0"))

    # ── Translation service (future step) ────────────────────────────────────
    TRANSLATION_API_URL: str | None = os.getenv("TRANSLATION_API_URL")  # IndicTrans2 endpoint

    # ── Voice / STT / TTS (future step) ──────────────────────────────────────
    STT_API_URL: str | None = os.getenv("STT_API_URL")
    TTS_API_URL: str | None = os.getenv("TTS_API_URL")

    # ── RAG / Vector store (future step) ─────────────────────────────────────
    VECTOR_DB_URL: str | None = os.getenv("VECTOR_DB_URL")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")


# Single shared instance — import this throughout the application.
settings = Settings()
