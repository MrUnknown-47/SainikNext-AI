import json
import logging
import os

logger = logging.getLogger(__name__)

class SkillGapAnalyzer:
    def __init__(self, dataset_path: str = ""):
        self.dataset_path = dataset_path
        self.job_skills_map = {}
        
    def load_dataset(self):
        logger.info(f"Loading skill requirements from {self.dataset_path}")
        if not os.path.exists(self.dataset_path):
            logger.warning("Skill gaps dataset not found. Returning empty mapping.")
            return

        with open(self.dataset_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        for item in data:
            job_title = item.get("job_title", "").strip().lower()
            if job_title:
                # normalize skills to lowercase
                required_skills = [s.strip().lower() for s in item.get("required_skills", [])]
                self.job_skills_map[job_title] = required_skills
                
        logger.info(f"Loaded skill requirements for {len(self.job_skills_map)} jobs.")

    def analyze(self, user_skills: list, target_job: str) -> dict:
        normalized_target = target_job.strip().lower()
        if normalized_target not in self.job_skills_map:
            logger.warning(f"Target job '{target_job}' not found in dataset.")
            # Depending on use-case, could return an error dict or empty
            return {
                "target_job": target_job,
                "matched_skills": [],
                "missing_skills": [],
                "error": "Job not found in skill requirements dataset."
            }
            
        required_skills_set = set(self.job_skills_map[normalized_target])
        user_skills_set = set([s.strip().lower() for s in user_skills])
        
        # Determine match vs missing
        matched_skills = list(required_skills_set.intersection(user_skills_set))
        missing_skills = list(required_skills_set.difference(user_skills_set))
        
        # Sort them for deterministic output
        matched_skills.sort()
        missing_skills.sort()
        
        logger.info(f"Skill gap analysis for '{target_job}': found {len(matched_skills)} matches, {len(missing_skills)} missing.")
        
        return {
            "target_job": target_job,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills
        }
