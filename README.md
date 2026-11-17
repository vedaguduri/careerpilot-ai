# CareerPilot AI — Intelligent Job Discovery & Application Gateway

> **"Your next opportunity starts here."**
> A production-grade, privacy-first platform that automates multi-source job discovery, truthful resume tailoring, and application tracking with zero hallucinations.

---

## Architecture & System Highlights

CareerPilot AI is built like a personal high-performance job gateway:

- **Modular Job Discovery Engine**: Ingests opportunities from authorized public ATS feeds (Greenhouse, Lever, Ashby), partner APIs (Adzuna, Jooble), and user-assisted manual job imports without unauthorized scraping or brittle bot bypasses.
- **Deduplication & Freshness Verification**: Normalizes listings into a unified schema, computes collision-resistant SHA-256 deduplication hashes, and verifies job status (active, unverified, closed) without false alarms.
- **Transparent Dual-Score Matching**: Computes an explainable 0–100 match score combining verified skills (40%), experience depth (25%), role seniority alignment (20%), and project impact (15%).
- **Truthful Resume Tailoring with Zero-Hallucination Invariant**: Enforces a strict contract—the platform *never* fabricates skills, degrees, employers, or dates. Proposes granular diffs with plain-English rationales requiring user review (Accept/Reject).
- **Deterministic LaTeX & PDF Generation**: Maintains a structured resume AST and compiles via Jinja2-escaped ATS templates, guaranteeing zero LaTeX syntax errors or unescaped character crashes (`&`, `%`, `_`).
- **BYOK AI Vault**: Supports Google Gemini, GroqCloud, OpenRouter, Cerebras, Mistral, OpenAI, and local Ollama. API keys are encrypted at rest with AES-256-GCM and never exposed to the frontend. Includes task-based routing and a privacy-preserving synthetic model benchmark.
- **Minimal, Elegant UI**: Built with React 19, TypeScript, and Tailwind CSS. Features "Pick up where you left off" state persistence, an interactive diff review studio, and an intuitive Kanban application pipeline.

---

## Directory Structure

```
careerpilot-ai/
├── README.md
├── .env.example
├── backend/
│   ├── main.py                  # FastAPI entrypoint & lifecycle
│   ├── config.py                # Environment configuration
│   ├── database.py              # SQLModel engine with SQLite WAL mode
│   ├── seed_data.py             # Verified seed opportunities (India & Global)
│   ├── models/                  # SQLModel entities (User, Resume, Job, Match, etc.)
│   ├── api/                     # REST API routers (auth, jobs, tailoring, etc.)
│   ├── services/                # Core domain services
│   │   ├── crypto_vault.py      # AES-256-GCM BYOK encryption
│   │   ├── resume_parser.py     # PDF/DOCX/LaTeX AST extraction
│   │   ├── latex_compiler.py    # Deterministic Jinja2 TeX & PDF compiler
│   │   ├── matching_engine.py   # Dual-score matching engine
│   │   ├── tailoring_engine.py  # Non-inventive tailoring & diff logic
│   │   ├── job_normalizer.py    # Deduplication hash & schema normalization
│   │   └── background_scheduler.py # Periodic async discovery runner
│   ├── adapters/                # Modular job source adapters (Greenhouse, Lever, Ashby, etc.)
│   └── ai_gateway/              # Multi-provider BYOK router & benchmark
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── App.tsx              # Root app & tab router
        ├── main.tsx
        ├── index.css
        ├── context/AuthContext.tsx # Authentication & session state
        ├── components/          # Navbar, JobCard, DiffViewer, MatchBadge, Modal
        └── pages/
            ├── Home.tsx         # "Your next opportunity starts here"
            ├── FindJobs.tsx     # Faceted search, filtering & manual import
            ├── MyApplications.tsx # Kanban application pipeline
            ├── MyResume.tsx     # Master AST editor & version history
            ├── TailorResume.tsx # Side-by-side tailoring studio
            ├── Settings.tsx     # BYOK AI vault & search preferences
            └── Onboarding.tsx   # Progressive 3-step setup
```

---

## Getting Started

### 1. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python seed_data.py
python main.py
```
The FastAPI backend runs on `http://127.0.0.1:8000`. Swagger API documentation is available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The client runs on `http://localhost:5173` with instant hot-reloading and automatic API proxying to `8000`.

---

## Security & Privacy Notice
All user-provided AI credentials (BYOK) are encrypted using AES-256-GCM. Personal resumes are stored strictly in the user's isolated workspace. Synthetic benchmarking does not transmit user data.
