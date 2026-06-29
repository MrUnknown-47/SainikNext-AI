import os
import logging
from sentence_transformers import SentenceTransformer

logger = logging.getLogger("[ModelLoader]")

class ModelLoader:
    _model = None

    @classmethod
    def get_model(cls) -> SentenceTransformer:
        if cls._model is None:
            model_name = os.getenv("MODEL_NAME", "all-MiniLM-L6-v2")
            logger.info(f"Loading SentenceTransformer model globally once: '{model_name}'...")
            cls._model = SentenceTransformer(model_name)
            logger.info("SentenceTransformer model successfully loaded globally.")
        return cls._model

def get_shared_model() -> SentenceTransformer:
    return ModelLoader.get_model()
