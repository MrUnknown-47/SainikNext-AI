import json
import logging
import os
import numpy as np
import faiss
from utils.model_loader import get_shared_model

logger = logging.getLogger("[CareerMatcher]")

class CareerMatcher:
    def __init__(self, dataset_path: str = ""):
        self.dataset_path = dataset_path
        self.model = None
        self.index = None
        self.civilian_jobs = []
        
        # Persistence configurations
        self.vector_store_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "vector_store")
        self.index_path = os.path.join(self.vector_store_dir, "jobs.index")
        self.metadata_path = os.path.join(self.vector_store_dir, "jobs_metadata.json")
        
    def load_dataset(self):
        logger.info(f"Loading dataset from {self.dataset_path}")
        if not os.path.exists(self.dataset_path):
            logger.warning("Dataset not found. Running with an empty dataset. Please check the path.")
            self.civilian_jobs = []
            return
            
        with open(self.dataset_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        jobs_set = set()
        for item in data:
            if "civilian_roles" in item:
                for role in item["civilian_roles"]:
                    jobs_set.add(role.get("title", ""))
                    
        self.civilian_jobs = [j for j in jobs_set if j.strip()]
        logger.info(f"Loaded {len(self.civilian_jobs)} unique civilian jobs from raw dataset.")

    def save_index(self):
        if not os.path.exists(self.vector_store_dir):
            os.makedirs(self.vector_store_dir)
            
        if self.index:
            faiss.write_index(self.index, self.index_path)
            
        with open(self.metadata_path, 'w', encoding='utf-8') as f:
            json.dump(self.civilian_jobs, f)
            
        logger.info(f"Successfully saved FAISS index and metadata to disk mappings.")

    def load_index(self) -> bool:
        if os.path.exists(self.index_path) and os.path.exists(self.metadata_path):
            try:
                with open(self.metadata_path, 'r', encoding='utf-8') as f:
                    disk_jobs = json.load(f)
                    
                if set(self.civilian_jobs) != set(disk_jobs):
                    logger.info("Dataset definitions have grown or changed. Forcing FAISS rebuild.")
                    return False

                self.index = faiss.read_index(self.index_path)
                self.civilian_jobs = disk_jobs  # Restore consistent ordering
                
                logger.info("Loaded FAISS index from disk")
                return True
            except Exception as e:
                logger.error(f"Failed to load cached FAISS index from disk: {e}")
                return False
        return False

    def build_index(self):
        logger.info("Initializing CareerMatcher sentence-transformer model via singleton loader...")
        self.model = get_shared_model()
        
        if self.load_index():
            return
            
        logger.info("Building new FAISS index")
        
        if not self.civilian_jobs:
            logger.warning("No civilian jobs loaded. Index will be empty.")
            return
            
        logger.info(f"Computing embeddings for {len(self.civilian_jobs)} civilian jobs natively...")
        embeddings = self.model.encode(self.civilian_jobs, convert_to_numpy=True)
        
        d = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(d)
        
        faiss.normalize_L2(embeddings)
        
        self.index.add(embeddings)
        logger.info(f"FAISS index built and attached computationally with {self.index.ntotal} vectors.")
        
        self.save_index()

    def match_jobs(self, query: str, top_k: int = 5):
        if not self.model:
            self.model = get_shared_model()
            
        if getattr(self, "index", None) is None or self.index.ntotal == 0:
            logger.warning("Index is not initialized or empty. Cannot execute semantic match mapping.")
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
                results.append({
                    "title": self.civilian_jobs[idx],
                    "score": round(float(scores[0][rank]), 4)
                })
                
        return results
