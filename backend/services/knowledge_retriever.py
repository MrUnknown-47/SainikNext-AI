import json
import logging
import os
import faiss
from utils.model_loader import get_shared_model

logger = logging.getLogger("[KnowledgeRetriever]")

class KnowledgeRetriever:
    def __init__(self, dataset_path: str = ""):
        self.dataset_path = dataset_path
        self.model = None
        self.index = None
        self.knowledge_data = []

    def load_knowledge_base(self):
        logger.info(f"Loading knowledge base from {self.dataset_path}")
        if not os.path.exists(self.dataset_path):
            logger.warning("Knowledge base dataset not found.")
            return

        try:
            with open(self.dataset_path, "r", encoding="utf-8") as f:
                self.knowledge_data = json.load(f)
            logger.info(f"Loaded {len(self.knowledge_data)} records from knowledge base.")
        except Exception as e:
            logger.error(f"Error loading knowledge base: {e}")

    def build_embeddings(self):
        if not self.knowledge_data:
            logger.warning("No knowledge data loaded. Index will be empty.")
            return

        logger.info("Initializing singleton sentence-transformer model for Knowledge Base...")
        self.model = get_shared_model()
        
        # Embed more descriptive fields for RAG
        texts_to_embed = []
        for item in self.knowledge_data:
            role = item.get('role', '')
            desc = item.get('description', '')
            skills = ", ".join(item.get('skills', [])) if isinstance(item.get('skills'), list) else str(item.get('skills', ''))
            equiv = item.get('civilian_equivalent', '')
            certs = ", ".join(item.get('certifications', [])) if isinstance(item.get('certifications'), list) else str(item.get('certifications', ''))
            
            embed_text = f"Role: {role} | Description: {desc} | Skills: {skills} | Civilian Equivalent: {equiv} | Certifications: {certs}"
            texts_to_embed.append(embed_text)

        logger.info("Computing embeddings for knowledge base...")
        embeddings = self.model.encode(texts_to_embed, convert_to_numpy=True)
        
        d = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(d)
        faiss.normalize_L2(embeddings)
        
        self.index.add(embeddings)
        logger.info(f"Knowledge Base FAISS index built with {self.index.ntotal} vectors.")

    def retrieve(self, query: str, top_k: int = 3) -> list:
        if not self.model:
            self.model = get_shared_model()
            
        if getattr(self, "index", None) is None or self.index.ntotal == 0:
            logger.warning("Knowledge Base index is not initialized.")
            return []

        query_embedding = self.model.encode([query], convert_to_numpy=True)
        faiss.normalize_L2(query_embedding)
        
        k = min(top_k, self.index.ntotal)
        if k == 0:
            return []
            
        scores, indices = self.index.search(query_embedding, k)
        
        results = []
        for rank, idx in enumerate(indices[0]):
            if idx != -1:
                results.append(self.knowledge_data[idx])
                
        return results
