"""
Pydantic Schemas for Ratings and Events
"""

import datetime
from typing import Optional
from pydantic import BaseModel, Field

class RatingCreate(BaseModel):
    movie_id: int
    rating: float = Field(..., ge=0.5, le=5.0)
    user_id: Optional[int] = None

class RatingResponse(BaseModel):
    id: int
    user_id: int
    movie_id: int
    rating: float
    movie_title: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class RecommendationEventCreate(BaseModel):
    movie_id: int
    algorithm: str
    variant: str = "A"
    event_type: str  # 'impression', 'click', 'rating', 'watchlist'
    predicted_score: Optional[float] = None
