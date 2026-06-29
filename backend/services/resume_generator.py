import os
import json
import logging
from google.genai import types
from services.gemini_client import client

logger = logging.getLogger(__name__)

def clean_json_text(text: str) -> str:
    text = text.strip()
    if text.startswith("```json"):
        text = text[len("```json"):]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

class ResumeGenerator:
    def __init__(self):
        self.client = None
        
    def initialize(self):
        self.client = client
        logger.info("ResumeGenerator initialized with Gemini client.")
        
    def generate_resume(self, military_input: str) -> dict:
        if not self.client:
            raise RuntimeError("ResumeGenerator not initialized. Call initialize() first.")
            
        prompt = f"""You are a professional resume writer helping military veterans transition into civilian jobs.

Convert the following military experience into professional resume bullet points.

Rules:
- Replace military terminology with civilian equivalents
- Highlight leadership and technical skills
- Use strong action verbs
- Format as resume bullet points

Military Experience:
{military_input}

Return JSON:

{{
 "job_title": "",
 "summary": "",
 "bullet_points": []
}}"""

        logger.info(f"Generating resume over Gemini for experience: '{military_input}'")
        try:
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction="You are an expert resume writer. You must only respond in strict JSON based on the provided template.",
                    response_mime_type="application/json",
                    temperature=0.4,
                )
            )
            
            result_text = response.text
            logger.info("Gemini API call completed successfully for resume generation.")
            
            cleaned_text = clean_json_text(result_text)
            return json.loads(cleaned_text)
            
        except Exception as e:
            logger.error(f"Error during resume generation: {e}")
            # Fallback gracefully
            return {
                "job_title": "Transitioning Military Professional",
                "summary": "Experienced professional with strong dedication from military operations.",
                "bullet_points": [military_input]
            }
