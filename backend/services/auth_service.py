import os
import jwt
from datetime import datetime, timedelta
from authlib.integrations.starlette_client import OAuth
from fastapi import Request

# Helper for JWT 
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-jwt-key")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

def create_jwt_token(data: dict) -> str:
    """Generates a JWT token for the session."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_jwt_token(token: str) -> dict:
    """Decodes a JWT token safely."""
    try:
        decoded_payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return decoded_payload
    except Exception as e:
        import logging
        logging.getLogger("[OAuth]").error(f"JWT decode error: {e}")
        return None

# Configure OAuth client
oauth = OAuth()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
    oauth.register(
        name='google',
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={
            'scope': 'openid email profile'
        }
    )
