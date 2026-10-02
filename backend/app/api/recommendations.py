"""
Recommendation Endpoints
Exposes personalized recommendations across all 6 model strategies,
item-to-item similarity, and Explainable AI breakdowns.
"""

import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.user import User, UserPreference
from backend.app.models.movie import Movie
from backend.app.models.rating import Rating
from backend.app.schemas.recommendation import (
    RecommendationResponse,
    MovieRecommendationItem,
    SimilarMovieRequest,
    ExplanationResponse
)
from backend.app.cache import cache
from backend.app.recommendation.engine import RecommendationEngine

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

@router.get("/{user_id}", response_model=RecommendationResponse)
def get_user_recommendations(
    user_id: int,
    strategy: str = Query("hybrid", regex="^(hybrid|svd|neural_cf|collaborative|content_based|cold_start)$"),
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Generate personalized recommendations for a user.
    Leverages Redis caching with automatic invalidation when user submits new ratings.
    """
    cache_key = f"recs:user:{user_id}:strat:{strategy}:l{limit}"
    cached_recs = cache.get_json(cache_key)
    if cached_recs:
        return cached_recs

    engine = RecommendationEngine.get_instance()

    # Fetch user ratings from database
    user_ratings_db = db.query(Rating).filter(Rating.user_id == user_id).all()
    user_ratings_list = [{"movie_id": r.movie_id, "rating": r.rating} for r in user_ratings_db]

    # Fetch user genre preferences if available
    preferred_genres = None
    user_pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    if user_pref and user_pref.favorite_genres:
        try:
            preferred_genres = json.loads(user_pref.favorite_genres)
        except Exception:
            pass

    # Call recommendation engine
    raw_recs = engine.recommend_for_user(
        user_id=user_id,
        user_ratings=user_ratings_list,
        top_n=limit,
        strategy=strategy,
        preferred_genres=preferred_genres
    )

    # Enrich with movie database metadata (posters, genres, backdrop)
    movie_ids = [r["movie_id"] for r in raw_recs]
    movies_db = {m.id: m for m in db.query(Movie).filter(Movie.id.in_(movie_ids)).all()}

    items: List[MovieRecommendationItem] = []
    for r in raw_recs:
        mid = r["movie_id"]
        movie_record = movies_db.get(mid)
        
        poster = None
        genres_list = r.get("genres", [])
        title = r.get("title", "Unknown")
        year = r.get("release_year", 2000)
        vote_avg = r.get("vote_average", 7.0)

        if movie_record:
            title = movie_record.title
            year = movie_record.release_year
            vote_avg = movie_record.vote_average
            vote_count = movie_record.vote_count
            overview = movie_record.overview
            orig_title = getattr(movie_record, "original_title", "") or title
            imdb_id = getattr(movie_record, "imdb_id", "") or ""
            tmdb_id = movie_record.tmdb_id or r.get("tmdb_id")
            poster = movie_record.poster_path
            if poster and "placeholder_" in poster:
                poster = None
            poster_url = getattr(movie_record, "poster_url", "") or (f"https://image.tmdb.org/t/p/w500{poster}" if poster and poster.startswith("/") else poster)
            backdrop = movie_record.backdrop_path
            backdrop_url = getattr(movie_record, "backdrop_url", "") or (f"https://image.tmdb.org/t/p/original{backdrop}" if backdrop and backdrop.startswith("/") else backdrop)
            logo = getattr(movie_record, "logo_path", None)
            if movie_record.genres:
                genres_list = [g.name for g in movie_record.genres]
        else:
            orig_title = title
            imdb_id = ""
            tmdb_id = r.get("tmdb_id")
            vote_count = 0
            overview = ""
            poster_url = None
            backdrop = None
            backdrop_url = None
            logo = None

        match_pct = r.get("match_percentage", int(min(99, max(65, (r.get("predicted_score", 4.0) / 5.0) * 100))))

        items.append(MovieRecommendationItem(
            movie_id=mid,
            tmdb_id=tmdb_id,
            imdb_id=imdb_id,
            title=title,
            original_title=orig_title,
            release_year=year,
            vote_average=vote_avg,
            vote_count=vote_count,
            overview=overview,
            poster_path=poster,
            poster_url=poster_url,
            backdrop_path=backdrop,
            backdrop_url=backdrop_url,
            logo_path=logo,
            genres=genres_list,
            similarity_score=r.get("similarity_score", 0.8),
            predicted_score=r.get("predicted_score", 4.2),
            match_percentage=match_pct,
            model=r.get("model", strategy),
            explanation=r.get("explanation")
        ))

    response_payload = {
        "user_id": user_id,
        "strategy": strategy,
        "count": len(items),
        "items": [item.model_dump() for item in items]
    }
    
    # Cache for 10 minutes
    cache.set_json(cache_key, response_payload, ttl=600)
    return response_payload

@router.get("/similar/{movie_id}", response_model=List[MovieRecommendationItem])
def get_similar_movies(
    movie_id: int,
    top_n: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Retrieve top-N content-similar movies based on metadata affinities."""
    engine = RecommendationEngine.get_instance()
    recs = engine.get_similar_movies(movie_id=movie_id, top_n=top_n)

    movie_ids = [r["movie_id"] for r in recs]
    movies = db.query(Movie).filter(Movie.id.in_(movie_ids)).all()
    movies_db = {m.id: m for m in movies}

    items = []
    for r in recs:
        m = movies_db.get(r["movie_id"])
        poster = m.poster_path if m else None
        backdrop = m.backdrop_path if m else None
        poster_url = getattr(m, "poster_url", "") if m else ""
        if not poster_url and poster:
            poster_url = f"https://image.tmdb.org/t/p/w500{poster}" if poster.startswith("/") else poster
            
        backdrop_url = getattr(m, "backdrop_url", "") if m else ""
        if not backdrop_url and backdrop:
            backdrop_url = f"https://image.tmdb.org/t/p/original{backdrop}" if backdrop.startswith("/") else backdrop
            
        logo = getattr(m, "logo_path", None) if m else None
        genres = [g.name for g in m.genres] if (m and m.genres) else r.get("genres", [])
        
        items.append(MovieRecommendationItem(
            movie_id=r["movie_id"],
            tmdb_id=m.tmdb_id if m and m.tmdb_id else r.get("tmdb_id"),
            imdb_id=getattr(m, "imdb_id", "") if m else "",
            title=m.title if m else r.get("title", ""),
            original_title=getattr(m, "original_title", "") if m else r.get("title", ""),
            release_year=m.release_year if m else r.get("release_year", 0),
            vote_average=m.vote_average if m else r.get("vote_average", 0.0),
            vote_count=m.vote_count if m else 0,
            overview=m.overview if m else "",
            poster_path=poster,
            poster_url=poster_url or poster,
            backdrop_path=backdrop,
            backdrop_url=backdrop_url or backdrop,
            logo_path=logo,
            genres=genres,
            similarity_score=r.get("similarity_score", 0.8),
            predicted_score=r.get("predicted_score", 4.3),
            match_percentage=int(r.get("similarity_score", 0.8) * 100),
            model="content_based",
            explanation=r.get("explanation")
        ))

    return items

@router.get("/explain/{movie_id}", response_model=ExplanationResponse)
def explain_movie(
    movie_id: int,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Provide Explainable AI rationale for recommending a specific movie."""
    engine = RecommendationEngine.get_instance()
    user_ratings_list = []
    if user_id:
        ratings = db.query(Rating).filter(Rating.user_id == user_id).all()
        user_ratings_list = [{"movie_id": r.movie_id, "rating": r.rating} for r in ratings]

    explanation = engine.explain(movie_id, user_ratings=user_ratings_list)
    return explanation
