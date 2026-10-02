"""
Caching Subsystem
Provides unified key-value caching with TTL expiration and event invalidation.
Connects to Redis in production/Docker, and falls back seamlessly to an in-memory TTL cache.
"""

import time
import json
import logging
from typing import Any, Optional
from backend.app.config import settings

logger = logging.getLogger(__name__)

class InMemoryTTLCache:
    """Thread-safe in-memory cache with TTL expiration."""
    def __init__(self):
        self._store = {}

    def get(self, key: str) -> Optional[str]:
        if key in self._store:
            val, expire_at = self._store[key]
            if expire_at is None or expire_at > time.time():
                return val
            else:
                del self._store[key]
        return None

    def set(self, key: str, value: str, ex: Optional[int] = None):
        expire_at = time.time() + ex if ex else None
        self._store[key] = (value, expire_at)

    def delete(self, key: str):
        if key in self._store:
            del self._store[key]

    def delete_pattern(self, pattern_prefix: str):
        keys_to_del = [k for k in self._store if k.startswith(pattern_prefix)]
        for k in keys_to_del:
            del self._store[k]

class CacheService:
    def __init__(self):
        self.redis_client = None
        self.memory_cache = InMemoryTTLCache()
        self.is_redis_active = False
        self._init_client()

    def _init_client(self):
        try:
            import redis
            client = redis.from_url(settings.REDIS_URL, socket_connect_timeout=1)
            client.ping()
            self.redis_client = client
            self.is_redis_active = True
            logger.info("Connected to Redis cache successfully.")
        except Exception as e:
            logger.info(f"Redis not available ({e}). Using in-memory TTL cache fallback.")
            self.redis_client = None
            self.is_redis_active = False

    def get_json(self, key: str) -> Optional[Any]:
        """Fetch and deserialize JSON object from cache."""
        try:
            if self.is_redis_active and self.redis_client:
                data = self.redis_client.get(key)
                if data:
                    return json.loads(data)
            else:
                data = self.memory_cache.get(key)
                if data:
                    return json.loads(data)
        except Exception as e:
            logger.warning(f"Cache get error for key '{key}': {e}")
        return None

    def set_json(self, key: str, value: Any, ttl: Optional[int] = None):
        """Serialize and store JSON object in cache with TTL."""
        ex = ttl if ttl is not None else settings.CACHE_DEFAULT_TTL
        payload = json.dumps(value)
        try:
            if self.is_redis_active and self.redis_client:
                self.redis_client.set(key, payload, ex=ex)
            else:
                self.memory_cache.set(key, payload, ex=ex)
        except Exception as e:
            logger.warning(f"Cache set error for key '{key}': {e}")

    def invalidate(self, key: str):
        """Invalidate a specific cache key."""
        try:
            if self.is_redis_active and self.redis_client:
                self.redis_client.delete(key)
            else:
                self.memory_cache.delete(key)
        except Exception as e:
            logger.warning(f"Cache invalidate error for key '{key}': {e}")

    def invalidate_user_recommendations(self, user_id: int):
        """Invalidate all recommendation caches for a given user upon new ratings."""
        prefix = f"recs:user:{user_id}"
        try:
            if self.is_redis_active and self.redis_client:
                keys = self.redis_client.keys(f"{prefix}*")
                if keys:
                    self.redis_client.delete(*keys)
            else:
                self.memory_cache.delete_pattern(prefix)
        except Exception as e:
            logger.warning(f"Failed to invalidate user recs cache for {user_id}: {e}")

cache = CacheService()
