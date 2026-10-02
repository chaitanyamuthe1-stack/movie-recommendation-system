"""
Pydantic Schemas for AI Assistant and ML Metrics
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from backend.app.schemas.recommendation import MovieRecommendationItem

class AssistantQuery(BaseModel):
    query: str
    user_id: Optional[int] = None
    top_n: int = 5

class ExtractedPreferences(BaseModel):
    genres: List[str] = []
    moods: List[str] = []
    keywords: List[str] = []
    directors: List[str] = []
    era: Optional[str] = None

class AssistantResponse(BaseModel):
    reply: str
    extracted_preferences: ExtractedPreferences
    recommendations: List[MovieRecommendationItem]
    is_grounded: bool = True

class ModelMetricsResponse(BaseModel):
    timestamp: str
    k: int
    dataset_info: Dict[str, Any]
    models: Dict[str, Any]

class ExperimentLogCreate(BaseModel):
    name: str
    parameters: Dict[str, Any]
    results: Dict[str, Any]
