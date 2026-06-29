import os
import json
import logging
from google.genai import types
from services.gemini_client import client
from utils.military_jargon_map import MILITARY_TERMS

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

class MilitaryTranslator:
    def __init__(self):
        self.client = None
        
    def initialize(self):
        self.client = client
        logger.info("MilitaryTranslator initialized with Gemini client.")
        
    def translate_experience(self, text: str) -> dict:
        if not self.client:
            raise RuntimeError("MilitaryTranslator not initialized. Call initialize() first.")
            
        prompt = f"""You are a career advisor helping military veterans transition to civilian jobs.

Translate the following military experience into professional civilian language.

Rules:
- Replace military jargon
- Highlight transferable skills
- Use business terminology
- Avoid military acronyms

Military Experience:
{text}

Return JSON:

{{
 "civilian_summary": "",
 "skills": [],
 "recommended_keywords": []
}}"""

        logger.info(f"Calling Gemini for translation on: {text}")
        try:
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction="You are a career advisor that always responds in strict JSON format based on the given template.",
                    response_mime_type="application/json",
                    temperature=0.3,
                )
            )
            
            result_text = response.text
            logger.info(f"Gemini translation output: {result_text}")
            
            cleaned_text = clean_json_text(result_text)
            return json.loads(cleaned_text)
        except Exception as e:
            logger.error(f"Error during translation: {e}")
            logger.warning("Using local fallback translation")
            # 1. Convert text to lowercase
            lower_text = text.lower()
            
            # 2. Replace military jargon
            skills_found = []
            for jargon, translation in MILITARY_TERMS.items():
                if jargon in lower_text:
                    if "team" in translation:
                        skills_found.append("leadership")
                    skills_found.append(translation)
                    lower_text = lower_text.replace(jargon, translation)
            
            # 3. Ensure we never return empty data
            if not skills_found:
                skills_found = ["general operations"]
                
            return {
                "civilian_summary": lower_text,
                "skills": list(set(skills_found)),
                "recommended_keywords": ["operations", "team management"]
            }
