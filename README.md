<div align="center">
  <h1>🚀 SainikNext AI</h1>
  <p><b>Intelligent Career Transition Platform for Indian Army Veterans</b></p>
</div>

<br/>

## 🎯 Problem Statement
Every year, thousands of highly trained personnel retire from the Indian Army. Despite possessing world-class leadership, robust logistical expertise, and advanced technical skills, many veterans face friction when transitioning to the civilian corporate sector. The primary hurdle is **experience translation**: transforming dense military terminology (e.g., *Convoy Command, Signals Operations*) into verifiable business language (e.g., *Logistics Management, Network Administration*).

## 💡 The Solution
**SainikNext AI** bridges this gap. It is an agentic, AI-driven platform specifically engineered to process a veteran's service history and continuously orchestrate personalized corporate transitions. From uncovering hidden semantic skill alignments to automatically generating learning roadmaps, SainikNext acts as a 24/7 hyper-personalized career coach.

---

## ✨ Core Features
- **💬 AI Career Coach:** An interactive, streaming-enabled chat interface that translates military experience into civilian equivalents natively while evaluating optimal industry matches.
- **🧠 Semantic RAG Matching Engine:** Replaces naive keyword matching with dense `sentence-transformers` processing, computationally understanding that *"Signals Platoon Commander"* aligns perfectly with *"Network Operations Manager"*.
- **📊 Interactive Skill Gap Analyzer:** Cross-references the veteran's profile with real-time job market requirements to pinpoint exactly what technical skills are missing.
- **🗺️ Generative Career Roadmaps:** Automatically constructs intelligent step-by-step learning pipelines, calculating estimated completion timelines to bridge any evaluated skill gaps.
- **📄 Automated Resume Generator:** Instantly converts parsed service histories into ATS-friendly, high-impact corporate resume bullet points.
- **💼 Local Job Match & Scoring:** Embeds a veteran's profile and target job into FAISS vector space to calculate precise semantic match probabilities (e.g., *🟢 88% Strong Fit*), rendering dynamic assessments against open job listings.
- **🔐 Google Authentication & Token Storage:** Integrates OAuth 2.0 logins, storing JWT tokens in `localStorage` for secured, authenticated requests to the backend APIs.

---

## 📖 Production Documentation
For comprehensive details on system design, deployment, and configuration, please refer to the following guides:
- **[Architecture & Subsystems](file:///Users/vaibhavsingh/SainikNext/ARCHITECTURE.md)**: Details the platform subsystems, request lifecycle flows, and contains the system Mermaid diagram.
- **[API Reference Documentation](file:///Users/vaibhavsingh/SainikNext/API_DOCUMENTATION.md)**: Lists all REST endpoints, SSE stream specifications, and client-server payload schemas.
- **[Deployment & Containerization Guide](file:///Users/vaibhavsingh/SainikNext/DEPLOYMENT_GUIDE.md)**: Contains steps to deploy using Docker Compose, Nginx setups, Railway, Render, and Vercel configurations.
- **[Troubleshooting & Recovery Guide](file:///Users/vaibhavsingh/SainikNext/TROUBLESHOOTING.md)**: Lists common runtime exceptions (e.g., database fallbacks, Gemini rate limits, Playwright chromium missing) and quick resolutions.

---

## 📂 Directory Structure
```
SainikNext/
├── backend/                        # FastAPI Backend Application
│   ├── ai_models/                  # AI Models (Career Matcher, Military Translator)
│   ├── alembic/                    # Database Migrations (PostgreSQL / SQLite fallback)
│   ├── database/                   # Database Models, Configurations, and Local SQLite Storage
│   │   ├── db.py                   # DB connection setup and SQLAlchemy model definitions
│   │   └── users.sqlite            # Local SQLite database fallback
│   ├── datasets/                   # Static Job Datasets and Mapping Files
│   ├── knowledge_base/             # RAG Knowledge Base definitions
│   │   └── army_roles.json         # 25 Indian Army roles with civilian equivalents
│   ├── services/                   # Business Logic Services
│   │   ├── auth_service.py         # Google OAuth & JWT Serialization logic
│   │   ├── cache_service.py        # Redis Cache & LocalMemoryCache fallback service
│   │   ├── career_coach.py         # AI Career Coach streaming business logic
│   │   ├── gemini_client.py        # Centralized Google GenAI SDK (Client) wrapper
│   │   ├── job_fetcher.py          # RapidAPI job fetch service with negative caching and backoffs
│   │   ├── job_processor.py        # Normalizes raw job listings securely
│   │   ├── job_scraper.py          # Headless Playwright async job web scraper
│   │   ├── knowledge_retriever.py  # RAG retriever mapping vector listings via FAISS
│   │   ├── profile_manager.py      # Core veteran profile persistence layer
│   │   ├── resume_generator.py     # Converts military service records to civilian resumes
│   │   └── skill_gap_service.py    # Analyzes skill gaps and recommends course actions
│   ├── tests/                      # Automated Test Suite
│   │   └── test_backend.py         # Full test suite covering databases, models, and endpoints
│   ├── utils/                      # Helper Utilities
│   │   └── model_loader.py         # Singleton loader for the SentenceTransformer model
│   ├── main.py                     # Primary FastAPI Entrypoint (routes, lifecycle, validation checks)
│   ├── requirements.txt            # Python dependencies (google-genai, fastapi, sqlalchemy, psycopg2-binary, slowapi, playwright, pytest)
│   └── .env.example                # Sample environment configuration file
├── frontend/                       # Next.js 15 Frontend Application
│   ├── src/
│   │   ├── services/
│   │   │   └── auth.ts             # Client-side Auth service (Google redirection, token storage)
│   │   └── ...                     # Next.js Components & Routing code
└── datasets/                       # Global datasets folder shared across modules
```

---

## 🗄️ Database Schema & ER Diagram
The platform supports PostgreSQL target databases and automatically falls back to local SQLite if configurations are absent. Before schema generation, a Postgres pre-check runs `CREATE EXTENSION IF NOT EXISTS vector;` to enable the pgvector extension.

```mermaid
erDiagram
    USERS {
        int id PK
        string email UNIQUE
        string name
    }
    PROFILES {
        int id PK
        int user_id FK
        text experience
        string target_career
        vector embedding
    }
    SKILLS {
        int id PK
        int profile_id FK
        string name
    }
    RESUME_DATA {
        int id PK
        int profile_id FK
        json data
    }
    JOBS {
        int id PK
        string title
        string company
        string location
        string role
        string link
        string salary
        string source
        datetime created_at
    }
    APPLICATION_HISTORY {
        int id PK
        int profile_id FK
        int job_id FK
        datetime applied_at
        string status
    }
    LEARNING_ROADMAPS {
        int id PK
        int profile_id FK
        string target_role
        json roadmap_data
        datetime created_at
    }
    CHAT_HISTORY {
        int id PK
        int profile_id FK
        text message
        text response
        datetime created_at
    }

    USERS ||--|| PROFILES : "has"
    PROFILES ||--o{ SKILLS : "lists"
    PROFILES ||--|| RESUME_DATA : "contains"
    PROFILES ||--o{ APPLICATION_HISTORY : "submits"
    PROFILES ||--o{ LEARNING_ROADMAPS : "tracks"
    PROFILES ||--o{ CHAT_HISTORY : "records"
    JOBS ||--o{ APPLICATION_HISTORY : "referenced_in"
```

---

## ⚙️ Backend Resiliency & Architecture
1. **Singleton SentenceTransformer Model Loader:** HuggingFace's `SentenceTransformer('all-MiniLM-L6-v2')` model requires substantial memory and startup overhead. We consolidated all encodes into a single model instance using the singleton design pattern (`utils/model_loader.py`).
2. **Graceful Web Scraping (Playwright Check):** The Playwright crawler runs asynchronously without blocking the FastAPI event loop. It automatically checks if the Chromium browser is installed (`os.path.exists(p.chromium.executable_path)`). If missing, it log-tags a warning and gracefully skips scraping, returning an empty list (`[]`) instead of crashing the scheduler or API.
3. **Resilient Job Fetcher (Retry Backoffs & Cache Failures):** The RapidAPI Job Fetcher retries connections up to 3 times using an exponential backoff. If the API fails completely, the endpoint returns cached results or reads locally from `datasets/jobs.json`. Any failure is cached negatively for 5 minutes (`cache_service`) to avoid continuous endpoint starvation.
4. **Hybrid Redis & Local Memory Cache Service:** Configures a `CacheService` that attempts to connect to Redis. If Redis is down, it silently falls back to a `LocalMemoryCache` without polluting standard error logs.
5. **Lifespan Startup System Verification Checks:** During lifespan setup, a series of system validation checks are executed (`validate_startup()` in `main.py`). The verification summary checks connections to Gemini, PostgreSQL, FAISS, Knowledge Base files, database tables, and Playwright browser configurations.

---

## 🔌 API Endpoints
| HTTP Method | Route | Description | Auth Required |
| ----------- | ----- | ----------- | ------------- |
| `GET` | `/` | System root welcome message | No |
| `GET` | `/health` | Live system dependency status (`healthy`/`degraded`) | No |
| `GET` | `/login` | Google OAuth login initiator | No |
| `GET` | `/auth` | OAuth callback redirecting tokens back to the frontend | No |
| `GET` | `/api/jobs` | Queries jobs (FAISS scoring + `jobs.json` fallbacks) | No |
| `GET` | `/api/profile` | Pulls authenticated veteran profile matrix | Yes (Bearer) |
| `POST` | `/api/career-coach` | Streams Career Coach SSE dialogue | No |
| `POST` | `/api/match-jobs` | Semantic FAISS search matching a target civilian role | No |
| `POST` | `/api/skill-gap` | Evaluates skill gaps between user skills and target job | No |
| `POST` | `/api/roadmap` | Builds custom JSON roadmaps for missing requirements | No |
| `POST` | `/api/generate-resume` | Generates ATS-optimized civilian resumes | No |
| `POST` | `/api/resume-match` | Computes cosine similarity of resumes vs descriptions | No |

---

## 🔐 Environment Variables List
Configure the following in `backend/.env`:
```ini
# Gemini Configuration (uses official google-genai SDK)
GEMINI_API_KEY=AIzaSy...

# Database Configuration (falls back to local SQLite if omitted)
DATABASE_URL=postgresql://user:password@localhost:5432/neondb

# External APIs
JOB_API_KEY=85b0bbbce6msh958c3...
MAX_RETRIES=3
JOB_FETCH_INTERVAL=10

# Playwright Web Scraper
ENABLE_SCRAPER=true
SCRAPER_TIMEOUT=15.0

# Google OAuth & JWT
GOOGLE_CLIENT_ID=346772061642-4nv...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-ZlgElM...
JWT_SECRET=d56e43927a889c4f90f49...
SESSION_SECRET=8dc2a5ca381cf4a178...

# Caching Services
REDIS_URL=redis://localhost:6379/0
CACHE_TTL=600

# AI Model settings
MODEL_NAME=all-MiniLM-L6-v2
```

---

## 🚀 Setup & Running Instructions

### 1. Backend Setup
Ensure you have Python 3.10+ installed.
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create environment file and add your keys
cp .env.example .env
nano .env

# Verify database migrations or auto-create schemas
python -c "from database.db import init_db; init_db()"

# Start FastAPI application
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
Ensure you have Node.js 18+ installed.
```bash
cd frontend
npm install --force
npm run dev
```
Open `http://localhost:3000` to access the application UI.

### 3. Running Automated Tests
The backend contains a complete Pytest suite validating CRUD operations, RAG, OAuth redirections, and Fallback triggers. The tests run against a file-based SQLite database (`test_users.sqlite`) which gets torn down automatically.
```bash
cd backend
python -m pytest tests/test_backend.py -vv
```

---

<div align="center">
  <p><i>"Translating Valor into Value."</i></p>
  <p>Engineered for the future of Indian HR Tech.</p>
</div>
