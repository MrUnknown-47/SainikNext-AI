# SainikNext AI - API Documentation

This document describes all API endpoints exposed by the FastAPI backend server.

## Authentication & Headers

Protected routes require a Bearer token in the `Authorization` header:
```http
Authorization: Bearer <your_jwt_token>
```

---

## 1. System Health
### `GET /health`
Returns system status telemetry for all integrated components.
* **Auth Required**: No
* **Response**:
```json
{
  "status": "healthy",
  "database": "connected",
  "gemini": "connected",
  "faiss": "loaded",
  "knowledge_base": "loaded",
  "scheduler": "running",
  "redis": "connected",
  "playwright": "installed"
}
```

---

## 2. Google OAuth
### `GET /login`
Initiates the Google OAuth flow redirecting users to Google sign-in.

### `GET /auth`
OAuth callback handler. Verifies authentication, creates/retrieves user profile, signs JWT token, and redirects back to frontend dashboard.
* **Response**: `302 Redirect` to `FRONTEND_URL/auth-success?token=<JWT_TOKEN>`

---

## 3. User Profile
### `GET /api/profile`
Retrieves current user details, military roles, saved skills, and resume configuration parameters.
* **Auth Required**: Yes
* **Response**:
```json
{
  "id": 1,
  "email": "veteran@example.com",
  "name": "Arjun Singh",
  "experience": "Commanded infantry regiment...",
  "skills": ["Leadership", "Strategic Planning", "Operations Management"],
  "target_career": "Operations Manager",
  "army_role": "Infantry Officer",
  "resume_data": {}
}
```

---

## 4. AI Career Coach (Streaming)
### `POST /api/career-coach`
Accepts a conversational message, processes it via RAG, translates experiences, computes job fits, and streams real-time analysis.
* **Auth Required**: Yes
* **Request**:
```json
{
  "message": "I managed communication operations for a logistics convoy."
}
```
* **Response**: `text/event-stream`
  * First chunk yields metadata JSON:
    ```json
    data: {"translation": {...}, "career_matches": [...], "skill_gap": {...}, "user_profile": {...}}
    ```
  * Subsequent chunks stream real-time tokens:
    ```text
    data: Based on your experience, you...
    ```

---

## 5. Job Matcher
### `POST /api/match-jobs`
Finds civilian career titles semantically aligned with the veteran's profile.
* **Auth Required**: Yes
* **Request**:
```json
{
  "army_role": "Captain (Infantry)",
  "skills": ["Tactical Operations", "Personnel Management"]
}
```
* **Response**:
```json
[
  {
    "title": "Operations Manager",
    "score": 0.82
  },
  {
    "title": "Security Director",
    "score": 0.79
  }
]
```

---

## 6. Skill Gap Analyzer
### `POST /api/skill-gap`
Compares user skills with a target corporate role.
* **Auth Required**: Yes
* **Request**:
```json
{
  "user_skills": ["Personnel Management", "Tactical Operations"],
  "target_job": "Operations Manager"
}
```
* **Response**:
```json
{
  "target_job": "Operations Manager",
  "current_skills": ["Personnel Management"],
  "missing_skills": ["Project Management", "Agile Methodology", "Budgeting"]
}
```

---

## 7. Learning Roadmap
### `POST /api/roadmap`
Generates sequential learning steps to close the veteran's skill gaps.
* **Auth Required**: Yes
* **Request**:
```json
{
  "target_job": "Operations Manager",
  "skill_gap": {
    "missing_skills": ["Project Management", "Budgeting"]
  }
}
```
* **Response**:
```json
{
  "target_role": "Operations Manager",
  "current_skills": ["Leadership"],
  "missing_skills": ["Project Management"],
  "steps": [
    {
      "title": "Obtain PMP Certification",
      "description": "Master the competencies required for Project Management Professional training.",
      "duration": "4 weeks",
      "timeline": "4 weeks"
    }
  ],
  "estimated_timeline": "1-2 Months"
}
```

---

## 8. Resume Generator & Matcher
### `POST /api/generate-resume`
Drafts corporate-aligned summary and experience bullet points based on service logs.
* **Auth Required**: Yes
* **Request**:
```json
{
  "military_experience": "Infantry command regiment manager."
}
```
* **Response**:
```json
{
  "resume": {
    "job_title": "Operations Lead",
    "summary": "Results-driven Operations Leader with background in commanding high-performance teams...",
    "bullet_points": [
      "Led cross-functional teams of 100+ personnel in high-stress, rapid-deployment environments.",
      "Managed resources, logistics, and operations planning budgets valued at $1.5M."
    ]
  }
}
```

### `POST /api/resume-match`
Scores resume text similarity against a target job description and extracts semantic improvements.
* **Auth Required**: Yes
* **Request**:
```json
{
  "resume_text": "Experienced manager with military operational leadership.",
  "job_description": "We need a project operations manager with agile leading experience."
}
```
* **Response**:
```json
{
  "match_score": 85,
  "missing_keywords": ["agile", "scrum"],
  "score": 0.85,
  "strengths": [
    "Strong command presence and leadership alignment.",
    "Demonstrated ability to manage operational resource allocations."
  ],
  "improvements": [
    "Integrate key competency term: 'agile'",
    "Integrate key competency term: 'scrum'"
  ]
}
```
