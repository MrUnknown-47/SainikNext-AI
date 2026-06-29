import os
import time
import requests
import logging
import json
from services.cache_service import cache_service
from services.job_processor import JobProcessor

logger = logging.getLogger("[JobFetcher]")

class JobFetcher:
    def __init__(self):
        self.api_key = os.getenv("JOB_API_KEY")
        self.CACHE_TTL = int(os.getenv("CACHE_TTL", "600"))
        self.max_retries = int(os.getenv("MAX_RETRIES", "3"))
        self.timeout = float(os.getenv("SCRAPER_TIMEOUT", "10.0"))

    def _load_local_jobs(self, role: str) -> list:
        logger.info(f"[JobFetcher] Loading local jobs.json fallback for role: '{role}'")
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        jobs_path = os.path.join(base_dir, "datasets", "jobs.json")
        try:
            with open(jobs_path, "r", encoding="utf-8") as f:
                fallback_jobs = json.load(f)
                filtered_jobs = [
                    j for j in fallback_jobs 
                    if role.lower() in j.get("role", "").lower() or role.lower() in j.get("title", "").lower()
                ]
                return filtered_jobs if filtered_jobs else fallback_jobs
        except Exception as e:
            logger.error(f"[JobFetcher] Failed to load local jobs fallback: {e}")
            return []

    def fetch_jobs(self, role: str) -> list:
        # 1. Negative caching (cache failures for 5 minutes)
        fail_key = f"jobs_fail_{role}"
        if cache_service.get(fail_key):
            logger.info(f"[JobFetcher] Negative cache hit. Skipping API call for '{role}' and returning local jobs.")
            return self._load_local_jobs(role)

        # 2. Check general cache
        cache_key = f"jobs_{role}"
        cached_data = cache_service.get(cache_key)
        if cached_data:
            logger.info(f"[JobFetcher] Cache Hit! Returning cached jobs for '{role}'.")
            return json.loads(cached_data)

        if not self.api_key:
            logger.warning("[JobFetcher] JOB_API_KEY environment variable missing. Bypassing external RapidAPI Jobs fetch.")
            return self._load_local_jobs(role)
            
        url = "https://jsearch.p.rapidapi.com/search"
        querystring = {"query": f"{role}", "page": "1", "num_pages": "1"}
        headers = {
            "x-rapidapi-key": self.api_key,
            "x-rapidapi-host": "jsearch.p.rapidapi.com"
        }
        
        backoff = 2
        for attempt in range(self.max_retries + 1):
            try:
                logger.info(f"[JobFetcher] Executing RapidAPI JSearch fetch (Attempt {attempt+1}/{self.max_retries+1}) for: '{role}'")
                response = requests.get(url, headers=headers, params=querystring, timeout=self.timeout)
                response.raise_for_status()
                
                payload = response.json()
                raw_data = payload.get('data', [])
                
                # Decoupled Pipeline
                normalized_jobs = JobProcessor.normalize_rapidapi_jobs(raw_data, role)
                    
                # Populate Cache
                cache_service.setex(cache_key, self.CACHE_TTL, json.dumps(normalized_jobs))
                return normalized_jobs
                
            except Exception as e:
                if attempt < self.max_retries:
                    sleep_time = backoff ** attempt
                    logger.warning(f"[JobFetcher] RapidAPI fetch attempt failed: {e}. Retrying in {sleep_time}s...")
                    time.sleep(sleep_time)
                else:
                    logger.error(f"[JobFetcher] All {self.max_retries+1} attempts failed. Error: {e}")
        
        # Cache failure for 5 minutes (300 seconds)
        logger.info(f"[JobFetcher] Caching fetch failure for '{role}' for 5 minutes.")
        cache_service.setex(fail_key, 300, "failed")
        
        return self._load_local_jobs(role)
