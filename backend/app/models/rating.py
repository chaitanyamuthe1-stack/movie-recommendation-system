"""
Rating and Recommendation Event Database Models
"""

import datetime
from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), index=True, nullable=False)
    rating = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="ratings")
    movie = relationship("Movie", back_populates="ratings")

class RecommendationEvent(Base):
    """Event log for A/B testing, click-through, and recommendation conversions."""
    __tablename__ = "recommendation_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), index=True, nullable=False)
    algorithm = Column(String(50), nullable=False)  # 'hybrid', 'svd', 'neural_cf', etc.
    variant = Column(String(20), default="A")       # A/B test variant
    event_type = Column(String(50), nullable=False) # 'impression', 'click', 'rating', 'watchlist'
    predicted_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="recommendation_events")
