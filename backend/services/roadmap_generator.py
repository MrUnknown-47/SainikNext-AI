import os
import json
import logging
from google.genai import types
from services.gemini_client import client

logger = logging.getLogger("[Roadmap]")

def clean_json_text(text: str) -> str:
    text = text.strip()
    if text.startswith("```json"):
        text = text[len("```json"):]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

class RoadmapGenerator:
    def __init__(self):
        self.client = None

    def initialize(self):
        self.client = client
        logger.info("RoadmapGenerator initialized alongside Gemini models.")

    def generate_roadmap(self, user_profile: dict, target_job: str, skill_gap: dict) -> dict:
        
        # Define deterministic fallback mapping if quota or API interactions fail 
        fallback = {
            "target_role": target_job,
            "current_skills": user_profile.get("skills", []),
            "missing_skills": skill_gap.get("missing_skills", ["General corporate readiness"]),
            "learning_path": [
                {"step": f"Understand core responsibilities for {target_job}", "duration": "1 week"},
                {"step": f"Address primary knowledge gaps via structured courses", "duration": "3 weeks"},
                {"step": "Practice mock interviews translating military experiences locally", "duration": "2 weeks"}
            ],
            "estimated_timeline": "1.5 months"
        }

        # Conforming mapping for fallback steps
        fallback_steps = []
        for item in fallback.get("learning_path", []):
            fallback_steps.append({
                "title": item.get("step", ""),
                "description": f"Master the competencies and objectives required for {item.get('step', '')}.",
                "duration": item.get("duration", "2 weeks"),
                "timeline": item.get("duration", "2 weeks")
            })
        fallback["steps"] = fallback_steps

        if not self.client:
            return fallback

        logger.info(f"Dispatching Gemini generation for career roadmap towards: {target_job}")

        prompt = f"""You are an expert AI Career Coach helping an Indian military veteran transition into civil/corporate sectors.
Compute a sequential, structured learning roadmap.

Current Profile:
{json.dumps(user_profile, indent=2)}

Target Job: {target_job}

Skill Gaps Analyzed:
{json.dumps(skill_gap, indent=2)}

You must return strictly as a JSON object following this template configuration:
{{
 "target_role": "{target_job}",
 "current_skills": ["mapped current technical skills"],
 "missing_skills": ["identified missing skills"],
 "learning_path": [
   {{"step": "Highly actionable technical objective", "duration": "1 week"}}
 ],
 "estimated_timeline": "Total duration estimate (e.g. 2-3 months)"
}}
"""
        try:
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction="You are an intelligent roadmap planner that guarantees structured JSON returns exclusively.",
                    response_mime_type="application/json",
                    temperature=0.3
                )
            )
            
            result_text = response.text
            logger.info("Semantic Roadmap cleanly extracted and calculated.")
            
            cleaned_text = clean_json_text(result_text)
            data = json.loads(cleaned_text)
            
            # Conforming mapping for frontend steps
            steps = []
            for item in data.get("learning_path", []):
                steps.append({
                    "title": item.get("step", ""),
                    "description": f"Master the competencies and objectives required for {item.get('step', '')}.",
                    "duration": item.get("duration", "2-3 weeks"),
                    "timeline": item.get("duration", "2-3 weeks")
                })
            data["steps"] = steps
            return data
            
        except Exception as e:
            logger.error(f"Generative error encountered within Roadmap Generation pipeline: {e}")
            logger.warning("Routing to rule-based fallback generation.")
            return fallback
