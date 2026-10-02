"""
Ratings and User Preference Endpoints
Handles user rating submissions, cache invalidation, user profiles, and cold-start onboarding.
"""

import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database import get_db
from backend.app.models.user import User, UserPreference, WatchHistory
from backend.app.models.movie import Movie, Genre
from backend.app.models.rating import Rating, RecommendationEvent
from backend.app.schemas.rating import RatingCreate, RatingResponse, RecommendationEventCreate
from backend.app.schemas.user import UserPreferencesUpdate, UserProfileResponse
from backend.app.api.auth import get_current_user, get_optional_current_user
from backend.app.cache import cache

router = APIRouter(tags=["Ratings & Preferences"])

@router.post("/ratings", response_model=RatingResponse, status_code=status.HTTP_201_CREATED)
def submit_rating(
    rating_in: RatingCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit or update movie rating (0.5 - 5.0 stars).
    Automatically invalidates stale recommendation cache for the user.
    Supports both JWT-authenticated requests and persona-based demo requests.
    """
    movie = db.query(Movie).filter(Movie.id == rating_in.movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    target_user_id = current_user.id if current_user else (rating_in.user_id or 1)

    existing_rating = db.query(Rating).filter(
        Rating.user_id == target_user_id,
        Rating.movie_id == rating_in.movie_id
    ).first()

    if existing_rating:
        existing_rating.rating = rating_in.rating
        db_obj = existing_rating
    else:
        db_obj = Rating(
            user_id=target_user_id,
            movie_id=rating_in.movie_id,
            rating=rating_in.rating
        )
        db.add(db_obj)

    # Invalidate cached recommendations for this user
    cache.invalidate_user_recommendations(target_user_id)

    db.commit()
    db.refresh(db_obj)

    return {
        "id": db_obj.id,
        "user_id": db_obj.user_id,
        "movie_id": db_obj.movie_id,
        "rating": db_obj.rating,
        "movie_title": movie.title,
        "created_at": db_obj.created_at
    }

@router.get("/users/{user_id}/ratings", response_model=List[RatingResponse])
def get_user_ratings(user_id: int, db: Session = Depends(get_db)):
    """Retrieve full rating history for a specific user."""
    ratings = db.query(Rating, Movie.title.label("movie_title"))\
                .join(Movie, Rating.movie_id == Movie.id)\
                .filter(Rating.user_id == user_id)\
                .order_by(Rating.created_at.desc()).all()

    return [
        {
            "id": r[0].id,
            "user_id": r[0].user_id,
            "movie_id": r[0].movie_id,
            "rating": r[0].rating,
            "movie_title": r[1],
            "created_at": r[0].created_at
        }
        for r in ratings
    ]

@router.get("/users/{user_id}/profile", response_model=UserProfileResponse)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    """Get complete user profile analytics, genre breakdown, and rating stats."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    ratings = db.query(Rating).filter(Rating.user_id == user_id).all()
    rating_count = len(ratings)
    avg_rating = round(sum(r.rating for r in ratings) / rating_count, 2) if rating_count > 0 else 0.0

    # Genre affinity breakdown
    genre_counts = {}
    for r in ratings:
        m = db.query(Movie).filter(Movie.id == r.movie_id).first()
        if m and m.genres:
            for g in m.genres:
                genre_counts[g.name] = genre_counts.get(g.name, 0) + 1

    top_genres = [
        {"genre": k, "count": v, "percentage": int((v / rating_count) * 100) if rating_count > 0 else 0}
        for k, v in sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)[:6]
    ]

    watch_count = db.query(WatchHistory).filter(WatchHistory.user_id == user_id).count()

    prefs_obj = None
    if user.preferences:
        prefs_obj = {
            "favorite_genres": json.loads(user.preferences.favorite_genres or "[]"),
            "favorite_movie_ids": json.loads(user.preferences.favorite_movie_ids or "[]"),
            "onboarding_completed": user.preferences.onboarding_completed
        }

    return {
        "user": user,
        "preferences": prefs_obj,
        "rating_count": rating_count,
        "average_rating": avg_rating,
        "top_genres": top_genres,
        "watch_count": watch_count
    }

@router.post("/users/{user_id}/onboarding", status_code=status.HTTP_200_OK)
def complete_onboarding(
    user_id: int,
    prefs_in: UserPreferencesUpdate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Record cold-start onboarding selections (favorite genres and seed movies)."""
    if current_user and current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    user_prefs = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    if not user_prefs:
        user_prefs = UserPreference(user_id=user_id)
        db.add(user_prefs)

    user_prefs.favorite_genres = json.dumps(prefs_in.favorite_genres)
    user_prefs.favorite_movie_ids = json.dumps(prefs_in.favorite_movie_ids)
    user_prefs.onboarding_completed = True

    # Convert selected movies into initial 5-star ratings for recommendation engine seed
    for mid in prefs_in.favorite_movie_ids:
        exists = db.query(Rating).filter(Rating.user_id == user_id, Rating.movie_id == mid).first()
        if not exists:
            db.add(Rating(user_id=user_id, movie_id=mid, rating=5.0))

    cache.invalidate_user_recommendations(user_id)
    db.commit()

    return {"message": "Onboarding completed successfully", "user_id": user_id}

@router.post("/events", status_code=status.HTTP_201_CREATED)
def record_event(
    event_in: RecommendationEventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record user interaction event (impression, click, rating) for A/B testing."""
    event = RecommendationEvent(
        user_id=current_user.id,
        movie_id=event_in.movie_id,
        algorithm=event_in.algorithm,
        variant=event_in.variant,
        event_type=event_in.event_type,
        predicted_score=event_in.predicted_score
    )
    db.add(event)
    db.commit()
    return {"status": "recorded"}
