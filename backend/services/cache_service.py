import os
import json
import logging
import redis
from datetime import datetime, timedelta

logger = logging.getLogger("[CacheService]")

class LocalMemoryCache:
    def __init__(self):
        self._cache = {}
        logger.info("LocalMemoryCache initialized.")

    def get(self, key: str):
        if key in self._cache:
            val, expiry = self._cache[key]
            if expiry > datetime.now():
                return val
            else:
                del self._cache[key]
        return None

    def setex(self, key: str, ttl: int, value: str):
        self._cache[key] = (value, datetime.now() + timedelta(seconds=ttl))

class RedisCache:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.available = False
        self._warning_logged = False
        self._connect()

    def _connect(self):
        try:
            self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
            self.redis_client.ping()
            self.available = True
            logger.info("Successfully connected to Redis Cache.")
        except Exception as e:
            self.available = False
            if not self._warning_logged:
                logger.warning(f"Failed to connect to Redis. Switching to LocalMemoryCache fallback. Error: {e}")
                self._warning_logged = True

    def get(self, key: str):
        if not self.available:
            return None
        try:
            return self.redis_client.get(key)
        except Exception as e:
            self.available = False
            if not self._warning_logged:
                logger.warning(f"Redis get failed. Switching to LocalMemoryCache. Error: {e}")
                self._warning_logged = True
            return None

    def setex(self, key: str, ttl: int, value: str):
        if not self.available:
            return
        try:
            self.redis_client.setex(key, ttl, value)
        except Exception as e:
            self.available = False
            if not self._warning_logged:
                logger.warning(f"Redis setex failed. Switching to LocalMemoryCache. Error: {e}")
                self._warning_logged = True

class CacheService:
    def __init__(self):
        self.redis_cache = RedisCache()
        self.local_cache = LocalMemoryCache()
        self.ttl = int(os.getenv("CACHE_TTL", "600"))

    def get(self, key: str) -> str:
        if self.redis_cache.available:
            val = self.redis_cache.get(key)
            if val is not None:
                return val
        return self.local_cache.get(key)

    def setex(self, key: str, ttl: int, value: str):
        if self.redis_cache.available:
            self.redis_cache.setex(key, ttl, value)
        self.local_cache.setex(key, ttl, value)

cache_service = CacheService()
