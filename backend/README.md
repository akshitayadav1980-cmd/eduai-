# Vernacular AI — Backend

FastAPI backend that powers the **Vernacular AI** educational platform — an AI-driven system for mother-tongue-based primary education across 11 Indian regional languages.

---

## What this backend does

This service is the API layer between the React frontend and all backend capabilities:

- Adaptive AI tutoring (to be added)
- Regional-language translation via IndicTrans2 (to be added)
- RAG-based educational knowledge retrieval (to be added)
- Speech-to-text and text-to-speech (to be added)
- Pronunciation evaluation (to be added)
- Quiz generation (to be added)
- Student progress tracking (to be added)
- Personalised learning recommendations (to be added)
- Teacher-created content management (to be added)

**Step 1 (this file)** establishes the project foundation: FastAPI application, configuration system, CORS, health endpoints, and the directory scaffold for every future module.

---

## Project structure

```
backend/
├── app/
│   ├── main.py          ← FastAPI app, middleware, root routes
│   ├── core/
│   │   └── config.py    ← All settings loaded from environment variables
│   ├── api/             ← Route handlers (added per step)
│   ├── schemas/         ← Pydantic request/response models
│   ├── models/          ← SQLAlchemy ORM models (Step 2)
│   ├── services/        ← Business logic
│   ├── ai/              ← LLM / AI integration
│   ├── rag/             ← Retrieval-Augmented Generation
│   ├── voice/           ← STT / TTS / pronunciation
│   └── database/        ← DB engine & session factory (Step 2)
├── tests/
│   └── test_main.py     ← Endpoint tests
├── .env.example         ← Copy to .env and fill in secrets
├── .gitignore
├── requirements.txt
└── README.md
```

---

## Setup

### 1 — Create a virtual environment

```bash
# From the backend/ directory
python -m venv .venv
```

### 2 — Activate the virtual environment

**Windows (PowerShell):**
```powershell
.\.venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```cmd
.venv\Scripts\activate.bat
```

**macOS / Linux:**
```bash
source .venv/bin/activate
```

### 3 — Install dependencies

```bash
pip install -r requirements.txt
```

### 4 — Configure environment variables

```bash
cp .env.example .env
# Edit .env as needed — do NOT commit it to version control
```

---

## Running the server

```bash
# From the backend/ directory with the venv active
uvicorn app.main:app --reload
```

The API will be available at **http://127.0.0.1:8000**

---

## API documentation

| URL | Description |
|-----|-------------|
| http://127.0.0.1:8000/docs | Swagger UI (interactive) |
| http://127.0.0.1:8000/redoc | ReDoc (clean reference) |
| http://127.0.0.1:8000/openapi.json | Raw OpenAPI schema |

---

## Current endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Liveness check — confirms the backend is running |
| `GET` | `/health` | Health check — for load balancers / orchestrators |

---

## Running tests

```bash
# From the backend/ directory with the venv active
pytest tests/ -v
```

---

## Incremental roadmap

Each capability will be added as a dedicated step without disrupting existing functionality:

| Step | What gets added |
|------|-----------------|
| **1** ✅ | FastAPI foundation, config, health endpoints |
| **2** | PostgreSQL database, SQLAlchemy models, Alembic migrations |
| **3** | Student & language REST endpoints, Pydantic schemas |
| **4** | Authentication — JWT, password hashing |
| **5** | LLM / AI tutoring integration |
| **6** | RAG pipeline — vector store, knowledge-base ingestion |
| **7** | Translation service (IndicTrans2) |
| **8** | Voice — STT, TTS, pronunciation scoring |
| **9** | Quiz generation, progress tracking, recommendations |
| **10** | Teacher content management, WebSocket real-time features |
