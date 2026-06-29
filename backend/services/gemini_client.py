import os
import logging
from google import genai
from dotenv import load_dotenv

logger = logging.getLogger("[GeminiClient]")

# Load environment variables from backend/.env if it exists
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_dir, ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    logger.warning("GEMINI_API_KEY not found in environment variables. Falling back to dummy key to prevent startup crash.")
    api_key = "dummy-api-key"

client = genai.Client(
    api_key=api_key
)
logger.info("Centralized Gemini client singleton initialized.")
