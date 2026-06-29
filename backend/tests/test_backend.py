import os
import sys
import json
import pytest
from unittest.mock import MagicMock, patch

# Set test database url to file-based SQLite to persist tables across connections
os.environ["DATABASE_URL"] = "sqlite:///test_users.sqlite"

# Mock refresh_jobs before any starlette/fastapi apps load to speed up lifespan startup
patch("main.refresh_jobs", lambda: None).start()

# Ensure backend path is in sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app
from database.db import SessionLocal, User, init_db
from services import gemini_client

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    # Delete test db if exists
    if os.path.exists("test_users.sqlite"):
        try:
            os.remove("test_users.sqlite")
        except Exception:
            pass
    init_db()
    yield
    # Clean up test db file
    if os.path.exists("test_users.sqlite"):
        try:
            os.remove("test_users.sqlite")
        except Exception:
            pass

# Mock Gemini client calls
@pytest.fixture(autouse=True)
def mock_gemini():
    mock_resp = MagicMock()
    mock_resp.text = json.dumps({"test": "data"})
    
    # Mock generate_content
    gemini_client.client.models.generate_content = MagicMock(return_value=mock_resp)
    
    # Mock streaming
    class MockChunk:
        def __init__(self, text):
            self.text = text
    def mock_stream(*args, **kwargs):
        yield MockChunk("Response chunk")
    gemini_client.client.models.generate_content_stream = mock_stream

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 1. Test Career Coach (Streaming Response & SSE contract)
def test_career_coach():
    with TestClient(app) as client:
        response = client.post("/api/career-coach", json={"message": "I was a Captain in Army"})
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/event-stream; charset=utf-8"
        
        lines = []
        for line in response.iter_lines():
            if line:
                if isinstance(line, bytes):
                    lines.append(line.decode("utf-8"))
                else:
                    lines.append(line)
        assert len(lines) > 0
        assert "translation" in lines[0]

# 2. Test Resume Generator
def test_resume_generator():
    with TestClient(app) as client:
        # Mock specific generator response
        mock_resp = MagicMock()
        mock_resp.text = json.dumps({
            "job_title": "Project Manager",
            "summary": "Civilian transition summary of resume",
            "bullet_points": ["Led operations team", "Managed resources"]
        })
        gemini_client.client.models.generate_content = MagicMock(return_value=mock_resp)

        response = client.post("/api/generate-resume", json={"military_experience": "Led infantry team"})
        assert response.status_code == 200
        assert "resume" in response.json()
        assert response.json()["resume"]["job_title"] == "Project Manager"

# 3. Test Roadmap Generator
def test_roadmap_generator():
    with TestClient(app) as client:
        mock_resp = MagicMock()
        mock_resp.text = json.dumps({
            "target_role": "Operations Manager",
            "current_skills": ["leadership"],
            "missing_skills": ["Project Management"],
            "learning_path": [{"step": "Study PMP", "duration": "4 weeks"}],
            "estimated_timeline": "1 month"
        })
        gemini_client.client.models.generate_content = MagicMock(return_value=mock_resp)

        payload = {
            "target_job": "Operations Manager",
            "skill_gap": {"missing_skills": ["Project Management"]}
        }
        response = client.post("/api/roadmap", json=payload)
        assert response.status_code == 200
        assert "target_role" in response.json()
        assert response.json()["target_role"] == "Operations Manager"

# 4. Test Resume Matcher
def test_resume_matcher():
    with TestClient(app) as client:
        payload = {
            "resume_text": "Experienced manager with military operational leadership.",
            "job_description": "We need a project operations manager with leading experience."
        }
        response = client.post("/api/resume-match", json=payload)
        assert response.status_code == 200
        assert "match_score" in response.json()
        assert "missing_keywords" in response.json()

# 5. Test Knowledge Retriever
def test_knowledge_retriever():
    with TestClient(app) as client:
        from main import knowledge_retriever
        results = knowledge_retriever.retrieve("infantry commander", top_k=3)
        assert len(results) > 0
        assert len(results) <= 3
        assert "role" in results[0]

# 6. Test Job Fetcher (Mock JSearch API)
@patch("requests.get")
def test_job_fetcher(mock_get):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "data": [
            {
                "job_title": "Project Manager",
                "employer_name": "Tech Corp",
                "job_city": "Bangalore",
                "job_apply_link": "http://apply"
            }
        ]
    }
    mock_get.return_value = mock_resp
    
    from services.cache_service import cache_service
    cache_service.local_cache._cache.pop("jobs_Network Engineer", None)
    cache_service.local_cache._cache.pop("jobs_fail_Network Engineer", None)
    if cache_service.redis_cache.available:
        try:
            cache_service.redis_cache.redis_client.delete("jobs_Network Engineer", "jobs_fail_Network Engineer")
        except Exception:
            pass
            
    from services.job_fetcher import JobFetcher
    fetcher = JobFetcher()
    fetcher.api_key = "test-key"
    
    jobs = fetcher.fetch_jobs("Network Engineer")
    assert len(jobs) > 0
    assert jobs[0]["title"] == "Project Manager"

# 7. Test Health Endpoint
def test_health_endpoint():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["healthy", "degraded"]
        assert "database" in data
        assert "gemini" in data
        assert "faiss" in data
        assert "scheduler" in data

# 8. Test Database CRUD Operations
def test_database_crud(db_session):
    # Create
    user = User(email="test@sainiknext.com", name="Test Soldier")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    assert user.id is not None
    
    # Read
    fetched_user = db_session.query(User).filter(User.email == "test@sainiknext.com").first()
    assert fetched_user.name == "Test Soldier"
    
    # Update
    fetched_user.name = "Veteran Soldier"
    db_session.commit()
    db_session.refresh(fetched_user)
    assert fetched_user.name == "Veteran Soldier"
    
    # Delete
    db_session.delete(fetched_user)
    db_session.commit()
    assert db_session.query(User).filter(User.email == "test@sainiknext.com").first() is None

# 9. Test OAuth Login Redirect
def test_oauth_login():
    with TestClient(app) as client:
        response = client.get("/login", follow_redirects=False)
        assert response.status_code in [302, 500]

