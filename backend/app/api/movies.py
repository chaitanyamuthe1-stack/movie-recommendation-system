"""
Movie Catalog and Search Routes
Provides paginated listings, detailed metadata, genre filtering,
fuzzy title search, actor/director search, and trending movie feeds.
"""

import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from backend.app.database import get_db
from backend.app.models.movie import Movie, Genre, MovieGenre
from backend.app.models.rating import Rating
from backend.app.models.user import User
from backend.app.schemas.movie import MovieResponse, MovieDetailResponse, MovieListResponse, GenreResponse, MovieBase
from backend.app.api.auth import get_optional_current_user
from backend.app.cache import cache
from backend.app.recommendation.engine import RecommendationEngine

router = APIRouter(prefix="/movies", tags=["Movies"])

def format_movie_response(movie: Movie) -> dict:
    """Format SQLAlchemy Movie model into clean response dict with TMDB fields."""
    genres = [g.name for g in movie.genres] if movie.genres else []
    cast = [c.strip() for c in (movie.cast_members or "").split("|") if c.strip()]
    
    poster = movie.poster_path
    if poster and "placeholder_" in poster:
        poster = None
        
    poster_url = getattr(movie, "poster_url", None)
    if not poster_url and poster:
        poster_url = f"https://image.tmdb.org/t/p/w500{poster}" if poster.startswith("/") else poster

    imdb_id = getattr(movie, "imdb_id", "") or ""
    if not poster_url and imdb_id:
        poster_url = f"https://images.metahub.space/poster/medium/{imdb_id}/img"
        
    backdrop_url = getattr(movie, "backdrop_url", None)
    if not backdrop_url and movie.backdrop_path:
        backdrop_url = f"https://image.tmdb.org/t/p/original{movie.backdrop_path}" if movie.backdrop_path.startswith("/") else movie.backdrop_path

    if not backdrop_url and imdb_id:
        backdrop_url = f"https://images.metahub.space/background/medium/{imdb_id}/img"

    return {
        "id": movie.id,
        "movie_id": movie.id,
        "tmdb_id": movie.tmdb_id,
        "imdb_id": getattr(movie, "imdb_id", "") or "",
        "title": movie.title,
        "original_title": getattr(movie, "original_title", "") or movie.title,
        "release_year": movie.release_year,
        "vote_average": movie.vote_average,
        "vote_count": movie.vote_count,
        "popularity": movie.popularity,
        "overview": movie.overview,
        "director": movie.director,
        "cast": cast,
        "genres": genres,
        "poster_path": poster,
        "poster_url": poster_url or poster,
        "backdrop_path": movie.backdrop_path,
        "backdrop_url": backdrop_url or movie.backdrop_path,
        "logo_path": getattr(movie, "logo_path", None)
    }

@router.get("", response_model=MovieListResponse)
def list_movies(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    genre: Optional[str] = None,
    sort_by: str = Query("popularity", regex="^(popularity|vote_average|release_year|title)$"),
    order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    """Retrieve paginated movies with filtering and sorting."""
    cache_key = f"movies:list:p{page}:s{size}:g{genre}:sort{sort_by}:{order}"
    cached_data = cache.get_json(cache_key)
    if cached_data:
        return cached_data

    query = db.query(Movie)
    
    if genre:
        query = query.join(Movie.genres).filter(func.lower(Genre.name) == genre.lower())

    # Sorting
    col = getattr(Movie, sort_by)
    query = query.order_by(col.desc() if order == "desc" else col.asc())

    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()
    pages = math.ceil(total / size) if size > 0 else 0

    response_data = {
        "items": [format_movie_response(m) for m in items],
        "total": total,
        "page": page,
        "size": size,
        "pages": pages
    }
    cache.set_json(cache_key, response_data, ttl=600)
    return response_data

@router.get("/search", response_model=List[MovieResponse])
def search_movies(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=50),
    genre: Optional[str] = None,
    actor: Optional[str] = None,
    director: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Intelligent multi-field search across title, cast, director, and keywords.
    """
    cache_key = f"movies:search:{q.lower().strip()}:{genre}:{actor}:{director}:{limit}"
    cached_data = cache.get_json(cache_key)
    if cached_data:
        return cached_data

    clean_q = f"%{q.strip().lower()}%"
    query = db.query(Movie)

    if genre:
        query = query.join(Movie.genres).filter(func.lower(Genre.name) == genre.lower())

    if actor:
        query = query.filter(func.lower(Movie.cast_members).like(f"%{actor.lower()}%"))

    if director:
        query = query.filter(func.lower(Movie.director).like(f"%{director.lower()}%"))

    # Multi-field query match
    query = query.filter(
        or_(
            func.lower(Movie.title).like(clean_q),
            func.lower(Movie.director).like(clean_q),
            func.lower(Movie.cast_members).like(clean_q),
            func.lower(Movie.overview).like(clean_q)
        )
    )

    # Rank results by popularity and vote count
    results = query.order_by(Movie.popularity.desc()).limit(limit).all()
    formatted = [format_movie_response(m) for m in results]
    cache.set_json(cache_key, formatted, ttl=300)
    return formatted

@router.get("/genres", response_model=List[GenreResponse])
def get_genres(db: Session = Depends(get_db)):
    """List all available movie genres."""
    cached = cache.get_json("genres:all")
    if cached:
        return cached

    genres = db.query(Genre).order_by(Genre.name.asc()).all()
    data = [{"id": g.id, "name": g.name} for g in genres]
    cache.set_json("genres:all", data, ttl=3600)
    return data

@router.get("/trending", response_model=List[MovieResponse])
def get_trending_movies(
    limit: int = Query(15, ge=1, le=50),
    genre: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve top trending movies using Bayesian weighted formula."""
    cache_key = f"movies:trending:g{genre}:l{limit}"
    cached = cache.get_json(cache_key)
    if cached:
        return cached

    engine = RecommendationEngine.get_instance()
    trending_recs = engine.get_trending(top_n=limit, genre=genre)

    movie_ids = [r["movie_id"] for r in trending_recs]
    movies = {m.id: m for m in db.query(Movie).filter(Movie.id.in_(movie_ids)).all()}

    formatted = []
    for r in trending_recs:
        m = movies.get(r["movie_id"])
        if m:
            formatted.append(format_movie_response(m))

    cache.set_json(cache_key, formatted, ttl=1800)
    return formatted

@router.get("/{movie_id}", response_model=MovieDetailResponse)
def get_movie_details(
    movie_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve comprehensive movie details including similar movies and user rating."""
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    base_data = format_movie_response(movie)
    keywords = [k.strip() for k in (movie.keywords or "").split("|") if k.strip()]

    # Check user rating if logged in
    user_rating = None
    if current_user:
        rating_rec = db.query(Rating).filter(Rating.user_id == current_user.id, Rating.movie_id == movie_id).first()
        if rating_rec:
            user_rating = rating_rec.rating

    # Similar movies
    engine = RecommendationEngine.get_instance()
    similar_recs = engine.recommend_similar_movies(movie_id, top_n=6)
    sim_ids = [r["movie_id"] for r in similar_recs]
    sim_movies_db = {m.id: m for m in db.query(Movie).filter(Movie.id.in_(sim_ids)).all()}

    similar_formatted = []
    for r in similar_recs:
        sm = sim_movies_db.get(r["movie_id"])
        if sm:
            similar_formatted.append(format_movie_response(sm))

    return {
        **base_data,
        "tagline": movie.tagline or "",
        "keywords": keywords[:10],
        "user_rating": user_rating,
        "in_watchlist": False,
        "similar_movies": similar_formatted
    }
