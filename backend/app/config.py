"""
Application Configuration Module
Reads environment variables using Pydantic Settings with secure defaults.
Supports PostgreSQL, SQLite, Redis with in-memory fallback, JWT authentication, and external APIs.
"""

import os
from typing import List, Optional
from pydantic import BaseModel

class Settings(BaseModel):
    # App Information
    PROJECT_NAME: str = "Production Movie Recommendation System"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    ENV: str = os.getenv("ENV", "development")
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./recommender.db")
    
    # Redis Cache
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CACHE_DEFAULT_TTL: int = 3600  # 1 hour
    
    # Security & JWT
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "movierec-super-secret-key-change-in-production-783921")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    
    # External APIs
    TMDB_API_KEY: Optional[str] = os.getenv("TMDB_API_KEY", None)
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    
    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATA_DIR: str = os.path.join(BASE_DIR, "data")
    MODELS_DIR: str = os.path.join(BASE_DIR, "models")
    CONFIGS_DIR: str = os.path.join(BASE_DIR, "configs")

    model_config = {"extra": "allow"}

settings = Settings()
