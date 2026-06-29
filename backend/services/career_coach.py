import os
import json
import logging
from sqlalchemy.orm import Session
from google.genai import types
from services.gemini_client import client

logger = logging.getLogger(__name__)

class CareerCoach:
    def __init__(self):
        self.client = None

    def initialize(self):
        self.client = client
        logger.info("CareerCoach initialized with Gemini client.")
        
    def chat(self, user_message: str, translator, matcher, gap_analyzer, knowledge_retriever, profile_manager, db: Session):
        if not self.client:
            raise RuntimeError("CareerCoach not initialized. Call initialize() first.")
            
        logger.info(f"CareerCoach processing message: '{user_message}'")
        
        translation = {}
        career_matches = []
        skill_gap = {}
        
        try:
            # 0. Pre-fetch RAG Context
            logger.info("Stage 0: Pre-fetching RAG Context from Knowledge Base")
            context = knowledge_retriever.retrieve(user_message)
            
            # 1. Translate the user message
            logger.info("Stage 1: Translating military experience")
            translation = translator.translate_experience(user_message)
            
            # Extract skills and cache state tracking within SQLite!
            skills_extracted = translation.get("skills", [])
            profile_manager.update_profile(
                db=db,
                user_id=1,
                experience=user_message,
                skills=skills_extracted,
                army_role=user_message[:100]
            )
            
            # Fetch global updated persistent context to share over LLM window scopes
            user_profile = profile_manager.get_profile(db=db, user_id=1)
            
            # 2. Generate a civilian query
            civilian_summary = translation.get("civilian_summary", "")
            skills = " ".join(translation.get("skills", []))
            keywords = " ".join(translation.get("recommended_keywords", []))
            refined_query = f"{civilian_summary} {skills} {keywords}".strip()
            
            if not refined_query:
                refined_query = user_message
                
            # 3. Use CareerMatcher to get top 3 career suggestions
            logger.info("Stage 2: Finding top 3 career matches")
            career_matches = matcher.match_jobs(refined_query, top_k=3)
            
            # 4. Use SkillGapAnalyzer for the first suggested job
            skill_gap = {}
            if career_matches:
                target_job = career_matches[0].get("title", "")
                logger.info(f"Stage 3: Analyzing skill gap for target '{target_job}'")
                user_skills = translation.get("skills", [])
                skill_gap = gap_analyzer.analyze(user_skills, target_job)
                
            # 5. Generate human conversational explanation via LLM
            logger.info("Stage 4: Generating explanation via Gemini")
            prompt = f"""Explain the results below to the user in a helpful conversational tone.
            
Context (Verified Military Knowledge):
{json.dumps(context, indent=2)}

User Profile (Historical Context):
{json.dumps(user_profile, indent=2)}

Translation:
{json.dumps(translation, indent=2)}

Career Matches:
{json.dumps(career_matches, indent=2)}

Skill Gap:
{json.dumps(skill_gap, indent=2)}"""

            metadata = {
                "translation": translation,
                "career_matches": career_matches,
                "skill_gap": skill_gap,
                "user_profile": user_profile
            }
            # Yield metadata as the first chunk cleanly delimited
            yield f"data: {json.dumps(metadata)}\n\n"

            response = self.client.models.generate_content_stream(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction="You are an AI career advisor helping military veterans transition into civilian careers.",
                    temperature=0.7,
                )
            )
            
            for chunk in response:
                token = chunk.text
                if token:
                    yield f"data: {token}\n\n"
            
            logger.info("Gemini API streaming completed successfully.")
            
        except Exception as e:
            logger.error(f"Error during orchestrated career coach chat: {e}")
            logger.warning("Using local fallback explanation")
            
            try:
                user_profile_data = profile_manager.get_profile(db=db, user_id=1)
            except Exception:
                user_profile_data = {}
                
            metadata = {
                "translation": locals().get("translation", {}),
                "career_matches": locals().get("career_matches", []),
                "skill_gap": locals().get("skill_gap", {}),
                "user_profile": user_profile_data
            }
            yield f"data: {json.dumps(metadata)}\n\n"
            yield f"data: Based on your military experience, here are the most relevant civilian career paths...\n\n"
