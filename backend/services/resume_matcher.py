import numpy as np
import logging
import re
from utils.model_loader import get_shared_model

logger = logging.getLogger("[ResumeMatcher]")

class ResumeMatcher:
    def __init__(self):
        self.model = None

    def initialize(self):
        logger.info("Initializing ResumeMatcher SentenceTransformer bindings via singleton model loader...")
        self.model = get_shared_model()

    def match_resume(self, resume_text: str, job_description: str) -> dict:
        if not self.model:
            self.model = get_shared_model()
            
        logger.info("Evaluating real-time sentence inferences calculating Cosine similarities.")
        embeddings = self.model.encode([resume_text, job_description], convert_to_numpy=True)
        
        # Calculate Cosine similarity
        from numpy.linalg import norm
        cosine = np.dot(embeddings[0], embeddings[1]) / (norm(embeddings[0]) * norm(embeddings[1]))
        score = int(round(cosine * 100))
        
        # Extract individual words while stripping basic stopwords
        resume_words = set(re.findall(r'\b[a-z]{4,}\b', resume_text.lower()))
        job_words = set(re.findall(r'\b[a-z]{4,}\b', job_description.lower()))
        
        stopwords = {"with", "experience", "required", "skills", "will", "this", "that", "role", "team", "your", "have"}
        clean_job_words = list(job_words - stopwords)
        clean_resume_words = list(resume_words - stopwords)
        
        missing_list = []
        if clean_job_words and clean_resume_words:
            # Embed all tokens 
            job_word_embeddings = self.model.encode(clean_job_words, convert_to_numpy=True)
            resume_word_embeddings = self.model.encode(clean_resume_words, convert_to_numpy=True)
            
            import faiss
            faiss.normalize_L2(job_word_embeddings)
            faiss.normalize_L2(resume_word_embeddings)
            
            similarity_matrix = np.dot(job_word_embeddings, resume_word_embeddings.T)
            max_similarities = np.max(similarity_matrix, axis=1)
            
            SEMANTIC_THRESHOLD = 0.55
            semantic_missing_words = [
                clean_job_words[i] for i, max_sim in enumerate(max_similarities) if max_sim < SEMANTIC_THRESHOLD
            ]
            
            missing_list = semantic_missing_words[:6]
        else:
            missing_list = clean_job_words[:6] 
        
        score_fraction = max(0, min(100, score)) / 100.0
        strengths = [
            "Strong command presence and leadership alignment.",
            "Demonstrated ability to manage operational resource allocations."
        ]
        improvements = [f"Integrate key competency term: '{kw}'" for kw in missing_list]
        if not improvements:
            improvements = ["Refine action descriptions to highlight technical keywords."]
            
        return {
            "match_score": max(0, min(100, score)),
            "missing_keywords": missing_list,
            "score": score_fraction,
            "strengths": strengths,
            "improvements": improvements
        }
