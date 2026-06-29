import os
import logging
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi import Request
from fastapi.security import HTTPBearer
from pydantic import BaseModel

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from apscheduler.schedulers.background import BackgroundScheduler

from ai_models.career_matcher import CareerMatcher
from ai_models.military_translator import MilitaryTranslator
from services.skill_gap_service import SkillGapAnalyzer
from services.resume_generator import ResumeGenerator
from services.career_coach import CareerCoach
from services.knowledge_retriever import KnowledgeRetriever
from services.profile_manager import ProfileManager
from services.roadmap_generator import RoadmapGenerator
from services.resume_matcher import ResumeMatcher
from services.auth_service import oauth, create_jwt_token, decode_jwt_token, GOOGLE_CLIENT_ID
from services.job_fetcher import JobFetcher
from database.db import get_db, init_db

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("[Scheduler]")

# Global instances
matcher = CareerMatcher()
translator = MilitaryTranslator()
gap_analyzer = SkillGapAnalyzer()
resume_generator = ResumeGenerator()
career_coach = CareerCoach()
knowledge_retriever = KnowledgeRetriever()
profile_manager = ProfileManager()
roadmap_generator = RoadmapGenerator()
resume_matcher = ResumeMatcher()
job_fetcher = JobFetcher()

limiter = Limiter(key_func=get_remote_address)
scheduler = BackgroundScheduler()

def refresh_jobs():
    logger.info("Background Job Sync: Dispatching external job pulls seamlessly...")
    import asyncio
    import json
    from database.db import SessionLocal, Job
    from services.job_fetcher import JobFetcher
    from services.job_scraper import JobScraper
    
    fetcher = JobFetcher()
    scraper = JobScraper()
    db = SessionLocal()
    
    roles = ["Network Engineer", "Operations Manager", "Logistics Controller", "Cyber Security Analyst"]
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    jobs_path = os.path.join(base_dir, "datasets", "jobs.json")
    
    try:
        for role in roles:
            role_jobs = []
            
            # Provider 1: RapidAPI
            try:
                api_jobs = fetcher.fetch_jobs(role)
                role_jobs.extend(api_jobs)
                logger.info(f"Successfully fetched {len(api_jobs)} jobs from RapidAPI for '{role}'")
            except Exception as e:
                logger.error(f"RapidAPI provider failed for '{role}': {e}")
                
            # Provider 2: Playwright Scraper
            try:
                scraped_jobs = asyncio.run(scraper.scrape_jobs(role))
                role_jobs.extend(scraped_jobs)
                logger.info(f"Successfully scraped {len(scraped_jobs)} jobs from Playwright for '{role}'")
            except Exception as e:
                logger.error(f"Playwright provider failed for '{role}': {e}")
                
            # Provider 3: jobs.json
            try:
                local_provider_jobs = []
                if os.path.exists(jobs_path):
                    with open(jobs_path, "r", encoding="utf-8") as f:
                        all_local_jobs = json.load(f)
                        local_provider_jobs = [
                            j for j in all_local_jobs 
                            if role.lower() in j.get("role", "").lower() or role.lower() in j.get("title", "").lower()
                        ]
                role_jobs.extend(local_provider_jobs)
                logger.info(f"Successfully loaded {len(local_provider_jobs)} jobs from jobs.json for '{role}'")
            except Exception as e:
                logger.error(f"jobs.json provider failed for '{role}': {e}")
                
            # Insert into database
            for j in role_jobs:
                try:
                    existing = db.query(Job).filter(
                        Job.title == j.get('title'),
                        Job.company == j.get('company'),
                        Job.location == j.get('location')
                    ).first()
                    
                    if not existing:
                        new_job = Job(
                            title=j.get('title', 'Unknown Title'),
                            company=j.get('company', 'Unknown Company'),
                            location=j.get('location', 'Unknown Location'),
                            link=j.get('link', '#'),
                            role=j.get('role', role),
                            salary=j.get('salary'),
                            source=j.get('source', 'unknown')
                        )
                        db.add(new_job)
                except Exception as e:
                    logger.error(f"Error preparing job insert: {e}")
            
            try:
                db.commit()
            except Exception as e:
                logger.error(f"Database commit failed for role '{role}': {e}")
                db.rollback()
                
    except Exception as e:
        logger.error(f"Background Sync global loop failed: {e}")
    finally:
        db.close()

async def validate_startup():
    logger.info("[StartupValidation] Starting system verification checks...")
    
    # 1. Gemini Key
    from services.gemini_client import api_key
    gemini_ok = api_key and api_key != "dummy-api-key"
    logger.info(f"[StartupValidation] Gemini API Key: {'VALID' if gemini_ok else 'MISSING/DUMMY'}")
    
    from database.db import SessionLocal
    pg_ok = False
    try:
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        pg_ok = True
        logger.info("[StartupValidation] Database Connection: SUCCESS")
    except Exception as e:
        logger.error(f"[StartupValidation] Database Connection: FAILED ({e})")
        
    # 3. FAISS
    faiss_ok = matcher.index is not None and matcher.index.ntotal > 0
    logger.info(f"[StartupValidation] FAISS Vector Store: {'LOADED' if faiss_ok else 'EMPTY/FAILED'}")
    
    # 4. Knowledge Base
    kb_ok = len(knowledge_retriever.knowledge_data) > 0
    logger.info(f"[StartupValidation] Knowledge Base: {'LOADED' if kb_ok else 'EMPTY/FAILED'}")
    
    # 5. Jobs Table
    from database.db import Job
    jobs_ok = False
    try:
        db = SessionLocal()
        db.query(Job).first()
        db.close()
        jobs_ok = True
        logger.info("[StartupValidation] Jobs Table: VERIFIED")
    except Exception as e:
        logger.error(f"[StartupValidation] Jobs Table: FAILED ({e})")
        
    # 6. Scheduler
    scheduler_ok = scheduler.running
    logger.info(f"[StartupValidation] APScheduler: {'RUNNING' if scheduler_ok else 'STOPPED'}")
    
    # 7. Playwright
    playwright_ok = False
    try:
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            playwright_ok = os.path.exists(p.chromium.executable_path)
    except Exception:
        pass
    logger.info(f"[StartupValidation] Playwright Chromium: {'INSTALLED' if playwright_ok else 'NOT_INSTALLED'}")
    
    # 8. Redis
    from services.cache_service import cache_service
    redis_ok = cache_service.redis_cache.available
    logger.info(f"[StartupValidation] Redis Cache: {'CONNECTED' if redis_ok else 'FALLBACK_LOCAL_MEMORY'}")
    
    logger.info("=== STARTUP VALIDATION SUMMARY ===")
    logger.info(f"Gemini: {'✓' if gemini_ok else '✗'}")
    logger.info(f"Database: {'✓' if pg_ok else '✗'}")
    logger.info(f"FAISS: {'✓' if faiss_ok else '✗'}")
    logger.info(f"Knowledge Base: {'✓' if kb_ok else '✗'}")
    logger.info(f"Jobs Table: {'✓' if jobs_ok else '✗'}")
    logger.info(f"Scheduler: {'✓' if scheduler_ok else '✗'}")
    logger.info(f"Playwright: {'✓' if playwright_ok else '✗'}")
    logger.info(f"Redis: {'✓' if redis_ok else 'FALLBACK'}")
    logger.info("==================================")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    logger.info("Starting up application...")
    
    # Load .env file automatically
    load_dotenv()
    
    # Initialize DB schemas automatically
    init_db()
    
    # Resolve the path to the dataset relative to this file
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dataset_path = os.path.join(base_dir, "datasets", "army_roles_to_civilian_jobs.json")
    
    # Initialize the matcher
    matcher.dataset_path = dataset_path
    matcher.load_dataset()
    matcher.build_index()
    logger.info("Career Matcher is ready.")
    
    # Initialize the translator
    translator.initialize()
    logger.info("Military Translator is ready.")
    
    # Initialize the gap analyzer
    dataset_gap_path = os.path.join(base_dir, "datasets", "job_skill_requirements.json")
    gap_analyzer.dataset_path = dataset_gap_path
    gap_analyzer.load_dataset()
    logger.info("Skill Gap Analyzer is ready.")
    
    # Initialize the resume generator
    resume_generator.initialize()
    logger.info("Resume Generator is ready.")
    
    # Initialize the resume matcher dependency
    resume_matcher.initialize()
    logger.info("Resume Matcher initialized for exact logic evaluations.")
    
    # Initialize the career coach
    career_coach.initialize()
    logger.info("Career Coach is ready.")
    
    # Initialize learning roadmap generator
    roadmap_generator.initialize()
    logger.info("Roadmap Generator integrated correctly.")
    
    # Initialize the knowledge base RAG retriever
    dataset_kb_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "knowledge_base", "army_roles.json")
    knowledge_retriever.dataset_path = dataset_kb_path
    knowledge_retriever.load_knowledge_base()
    knowledge_retriever.build_embeddings()
    logger.info("Knowledge Retriever is ready.")
    
    # Start APScheduler natively!
    scheduler.start()
    scheduler.add_job(refresh_jobs) 
    
    fetch_interval = int(os.getenv("JOB_FETCH_INTERVAL", "10"))
    scheduler.add_job(refresh_jobs, 'interval', minutes=fetch_interval)
    logger.info(f"APScheduler background syncing bound natively (Interval: {fetch_interval} minutes)!")
    
    # Perform system checks
    await validate_startup()
    
    yield
    # --- Shutdown ---
    scheduler.shutdown()
    logger.info("Shutting down application...")

app = FastAPI(
    title="SainikNext AI Platform",
    description="Backend for AI platform helping Indian Army veterans transition to civilian jobs",
    version="1.0.0",
    lifespan=lifespan
)

# Allow CORS for the frontend dynamically
cors_origins = os.getenv("CORS_ORIGINS", "https://sainiknext.vercel.app")
allow_origins = [o.strip() for o in cors_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

SESSION_SECRET = os.getenv("SESSION_SECRET", "super-secret-session-key")
app.add_middleware(SessionMiddleware, secret_key=SESSION_SECRET)

security = HTTPBearer()

def get_current_user(token=Depends(security)):
    decoded = decode_jwt_token(token.credentials)
    if not decoded:
        raise HTTPException(status_code=401, detail="Invalid token")
    return decoded

class QueryRequest(BaseModel):
    army_role: str
    skills: list[str] = []

@app.get("/")
def read_root():
    return {"message": "Welcome to SainikNext AI API. System is running!"}

@app.get("/health")
async def health_check():
    from database.db import SessionLocal
    try:
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        database_status = "connected"
    except Exception:
        database_status = "error"

    # 2. Gemini check
    from services.gemini_client import api_key
    gemini_status = "connected" if (api_key and api_key != "dummy-api-key") else "fallback"

    # 3. FAISS check
    faiss_status = "loaded" if (matcher and matcher.index and matcher.index.ntotal > 0) else "not_loaded"

    # 4. Knowledge base check
    kb_status = "loaded" if (knowledge_retriever and knowledge_retriever.knowledge_data) else "not_loaded"

    # 5. Scheduler check
    scheduler_status = "running" if scheduler.running else "stopped"

    # 6. Redis check
    from services.cache_service import cache_service
    redis_status = "connected" if cache_service.redis_cache.available else "fallback"

    # 7. Playwright check
    playwright_status = "not_installed"
    try:
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            if os.path.exists(p.chromium.executable_path):
                playwright_status = "installed"
    except Exception:
        pass

    return {
        "status": "healthy" if (database_status == "connected" and kb_status == "loaded") else "degraded",
        "database": database_status,
        "gemini": gemini_status,
        "faiss": faiss_status,
        "knowledge_base": kb_status,
        "scheduler": scheduler_status,
        "redis": redis_status,
        "playwright": playwright_status
    }

@app.get("/login")
async def login(request: Request):
    logger.info("Initiating Google OAuth login flow.")
    router = request.scope.get("router")
    if router:
        logger.info(f"ROUTER ROUTES: {[r.name for r in router.routes if hasattr(r, 'name')]}")
    else:
        logger.info("NO ROUTER IN SCOPE")
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="OAuth not configured")
    redirect_uri = str(request.url_for('google_auth'))
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth", name="google_auth")
async def auth_callback(request: Request, db: Session = Depends(get_db)):
    logger.info("Executing Google OAuth callback.")
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
    except Exception as e:
        logger.error(f"OAuth auth callback logical error: {e}")
        user_info = None

    if not user_info:
        raise HTTPException(status_code=400, detail="Authentication mapping failed")
        
    email = user_info.get("email", "")
    name = user_info.get("name", "")
    
    # Store mapped profiles dynamically directly resolving mapping emails
    user = profile_manager.get_profile_by_email(db, email)
    
    if not user:
        user_id = profile_manager.create_profile(db, email=email, name=name)
    else:
        user_id = user["id"]
    
    # Serialize mapped tokens securely
    jwt_token = create_jwt_token({
        "user_id": user_id,
        "email": email
    })
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    return RedirectResponse(
        url=f"{frontend_url}/auth-success?token={jwt_token}"
    )

@app.post("/api/match-jobs")
def match_jobs(request: QueryRequest):
    try:
        if not request.army_role:
            return {
                "success": False,
                "matches": [],
                "message": "army_role is required"
            }
            
        # Combine user's raw input
        query_parts = [request.army_role]
        if request.skills:
            query_parts.extend(request.skills)
        raw_query = " ".join(query_parts)
        
        logger.info(f"Received MATCH Request. Raw military input: '{raw_query}'")
        
        # 1. Translate using MilitaryTranslator (LLM)
        translated_profile = translator.translate_experience(raw_query)
        
        # 2. Extract values and combine them into a dense civilian query
        civilian_summary = translated_profile.get("civilian_summary", "")
        skills = " ".join(translated_profile.get("skills", []))
        keywords = " ".join(translated_profile.get("recommended_keywords", []))
        
        refined_query = f"{civilian_summary} {skills} {keywords}".strip()
        logger.info(f"Refined civilian query for matching: '{refined_query}'")
        
        # Fallback to the raw query if the translation yielded completely empty results
        if not refined_query:
            logger.warning("Empty refined query generated. Falling back to the raw query.")
            refined_query = raw_query
        
        # 3. Match against vector index
        career_matches = matcher.match_jobs(refined_query, top_k=5)
        
        # Format the matches as specified:
        # { "title": ..., "score": ..., "category": ... }
        formatted_matches = []
        for match in career_matches:
            formatted_matches.append({
                "title": match.get("title", ""),
                "score": match.get("score", 0.0),
                "category": "Management"  # Default category as per specs
            })
            
        if not formatted_matches:
            return {
                "success": False,
                "matches": [],
                "message": "No matching jobs found"
            }
            
        return {
            "success": True,
            "matches": formatted_matches
        }
    except Exception as e:
        logger.error(f"Error during match_jobs endpoint: {e}")
        return {
            "success": False,
            "matches": [],
            "message": f"Error resolving matches: {str(e)}"
        }

class SkillGapRequest(BaseModel):
    user_skills: list[str]
    target_job: str

@app.post("/api/skill-gap")
def skill_gap(request: SkillGapRequest):
    logger.info(f"Received SKILL GAP task for target job: '{request.target_job}'")
    result = gap_analyzer.analyze(request.user_skills, request.target_job)
    return result

class ResumeRequest(BaseModel):
    military_experience: str

class ResumeMatchRequest(BaseModel):
    resume_text: str
    job_description: str

@app.post("/api/generate-resume")
def generate_resume(request: ResumeRequest):
    logger.info(f"Received RESUME GENERATION task for input: '{request.military_experience}'")
    resume_data = resume_generator.generate_resume(request.military_experience)
    return {"resume": resume_data}

@app.post("/api/resume-match")
def resume_match(request: ResumeMatchRequest):
    logger.info("Evaluating RESUME MATCH cosine distance evaluations.")
    return resume_matcher.match_resume(request.resume_text, request.job_description)

class CoachRequest(BaseModel):
    message: str

class RoadmapRequest(BaseModel):
    target_job: str
    skill_gap: dict

@app.post("/api/roadmap")
def execute_roadmap(request: RoadmapRequest, db: Session = Depends(get_db)):
    logger.info(f"Received ROADMAP logic evaluation for target career: '{request.target_job}'")
    user_profile = profile_manager.get_profile(db, user_id=1)
    result = roadmap_generator.generate_roadmap(user_profile, request.target_job, request.skill_gap)
    return result

@app.get("/api/jobs")
@limiter.limit("10/minute")
def get_jobs(request: Request, role: str = "", db: Session = Depends(get_db)):
    logger.info(f"Received JOBS request mapping for role: '{role}'")
    try:
        from database.db import Job
        
        # Pull populated items statically explicitly off Postgres FAISS bindings
        db_jobs = db.query(Job).all()
        jobs_data = [{"title": j.title, "company": j.company, "location": j.location, "link": j.link, "role": j.role} for j in db_jobs]
        
        # Merge offline JSON baselines safely mapping legacy logic securely
        jobs_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "datasets", "jobs.json")
        try:
            import json
            with open(jobs_path, "r", encoding="utf-8") as f:
                local_jobs = json.load(f)
                jobs_data.extend(local_jobs)
        except Exception as e:
            logger.warning(f"Failed to aggregate legacy JSON mappings safely: {e}")
            
        if role:
            try:
                import faiss
                import numpy as np
                
                # Compare against descriptions
                job_texts = [f"{j.get('role', '')} {j.get('title', '')} {j.get('company', '')}" for j in jobs_data]
                if not job_texts:
                    return jobs_data
                
                user_skills = "" # Fetch safely without profile_manager tight coupling logic to avoid DB transaction deadlocks
                query_text = f"{user_skills} {role}".strip()
                
                if not matcher.model:
                    return jobs_data
                    
                job_embeddings = matcher.model.encode(job_texts, convert_to_numpy=True)
                query_embedding = matcher.model.encode([query_text], convert_to_numpy=True)
                
                faiss.normalize_L2(job_embeddings)
                faiss.normalize_L2(query_embedding)
                
                similarities = np.dot(job_embeddings, query_embedding.T).flatten()
                
                for idx, job in enumerate(jobs_data):
                    job["score"] = round(float(similarities[idx]), 2)
                    
                jobs_data.sort(key=lambda x: x["score"], reverse=True)
                return jobs_data
                
            except Exception as e:
                logger.error(f"FAISS logic fallback triggered natively across distributed payload: {e}")
                return jobs_data
        return jobs_data
    except Exception as e:
        logger.error(f"Error evaluating scaled background jobs schemas natively: {e}")
        return []

@app.get("/api/profile")
def get_user_profile(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.get("user_id")
    return profile_manager.get_profile(db, user_id=user_id)

@app.post("/api/career-coach")
def career_coach_chat(request: CoachRequest, db: Session = Depends(get_db)):
    logger.info(f"Received CAREER COACH task for message: '{request.message}'")
    
    # We pass the generator straight to StreamingResponse 
    # to yield chunks iteratively back to the requester.
    return StreamingResponse(
        career_coach.chat(request.message, translator, matcher, gap_analyzer, knowledge_retriever, profile_manager, db),
        media_type="text/event-stream"
    )
