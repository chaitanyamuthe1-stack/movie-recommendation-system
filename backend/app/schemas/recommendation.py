"""
Pydantic Schemas for Recommendations and Explanations
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class ExplanationFeature(BaseModel):
    type: str
    value: str

class ExplanationResponse(BaseModel):
    headline: str
    seed_movie_title: Optional[str] = None
    primary_reason: str
    reasons: List[str] = []
    feature_matches: List[ExplanationFeature] = []
    model_signal: str = "hybrid"
    predicted_score: float = 4.5
    confidence_score: float = 0.90

class MovieRecommendationItem(BaseModel):
    movie_id: int
    tmdb_id: Optional[int] = None
    imdb_id: Optional[str] = None
    title: str
    original_title: Optional[str] = None
    release_year: int
    vote_average: float
    vote_count: int = 0
    overview: Optional[str] = None
    poster_path: Optional[str] = None
    poster_url: Optional[str] = None
    backdrop_path: Optional[str] = None
    backdrop_url: Optional[str] = None
    logo_path: Optional[str] = None
    genres: List[str] = []
    similarity_score: float
    predicted_score: float
    match_percentage: int = 85
    model: str = "hybrid"
    explanation: Optional[ExplanationResponse] = None

class RecommendationResponse(BaseModel):
    user_id: int
    strategy: str
    count: int
    items: List[MovieRecommendationItem]

class SimilarMovieRequest(BaseModel):
    movie_id: int
    top_n: int = 10
