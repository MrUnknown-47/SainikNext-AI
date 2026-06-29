# SainikNext AI - Deployment Guide

This document describes instructions for deploying the **SainikNext AI** platform in both development and production-grade environments.

## 1. Local Containerized Deployment (Docker Compose)

The easiest way to orchestrate all services locally (Next.js, FastAPI, PostgreSQL + pgvector, Redis, and Nginx) is via **Docker Compose**:

### Prerequisites
- Install **Docker** and **Docker Compose**.
- Obtain a **Google Gemini API Key** and **Google OAuth Credentials**.

### Launch Steps
1. Create a `.env` file in the project root containing your credentials:
   ```env
   GOOGLE_API_KEY="AIzaSyYourGeminiApiKeyHere"
   GOOGLE_CLIENT_ID="your-google-oauth-client-id"
   GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
   JWT_SECRET="generate-a-secure-jwt-key"
   SESSION_SECRET="generate-a-secure-session-key"
   ```
2. Build and run the container stack:
   ```bash
   docker-compose up --build
   ```
3. Nginx listens on port 80:
   - Access the web interface at: `http://localhost/`
   - Access the backend API docs at: `http://localhost/docs`

---

## 2. Platform Deploys

### A. Frontend: Vercel Deployment
The Next.js App Router frontend can be deployed directly to Vercel:
1. Connect your repository to Vercel.
2. Select the `frontend` folder as the Root Directory.
3. Configure the Framework Preset to **Next.js**.
4. Set the following environment variable:
   - `NEXT_PUBLIC_API_URL`: The production URL of your hosted backend (e.g. `https://sainiknext-api.up.railway.app`).
5. Click **Deploy**.

### B. Backend: Railway Deployment
Railway is perfect for running Python FastAPI applications and managed databases:
1. Connect your repository to Railway.
2. Select the `backend` folder as the root directory for your Railway service.
3. Set the following Environment Variables in the service settings:
   - `DATABASE_URL`: Let Railway provision a PostgreSQL database, or provide a Neon connection string.
   - `REDIS_URL`: Let Railway provision a Redis database.
   - `GOOGLE_API_KEY`: Your Gemini API key.
   - `GOOGLE_CLIENT_ID`: Google OAuth client ID.
   - `GOOGLE_CLIENT_SECRET`: Google OAuth client secret.
   - `FRONTEND_URL`: The production URL of your Vercel frontend (e.g. `https://sainiknext.vercel.app`).
   - `CORS_ORIGINS`: Same as `FRONTEND_URL`.
   - `JWT_SECRET` & `SESSION_SECRET`: Production-grade random hashes.
4. Railway will build using the `backend/Dockerfile` automatically.

### C. Backend: Render Deployment
If deploying to Render:
1. Create a **Web Service** for the FastAPI backend.
2. Choose **Docker** as the runtime. Set the Docker Context to the project root and the Dockerfile path to `backend/Dockerfile`.
3. Create a **PostgreSQL Database** and a **Redis Instance** in Render, then inject their credentials into the Web Service environment variables:
   - `DATABASE_URL`, `REDIS_URL`, `GOOGLE_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL`, `CORS_ORIGINS`, `JWT_SECRET`, `SESSION_SECRET`.
4. Click **Deploy**.
