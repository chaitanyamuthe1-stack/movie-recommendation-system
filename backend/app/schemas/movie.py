"""
Pydantic Schemas for Movies and Genres
"""

from typing import List, Optional
from pydantic import BaseModel

class GenreResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class MovieBase(BaseModel):
    id: int
    movie_id: Optional[int] = None
    tmdb_id: Optional[int] = None
    imdb_id: Optional[str] = None
    title: str
    original_title: Optional[str] = None
    release_year: int
    vote_average: float
    vote_count: int
    popularity: float
    poster_path: Optional[str] = None
    poster_url: Optional[str] = None
    backdrop_path: Optional[str] = None
    backdrop_url: Optional[str] = None
    logo_path: Optional[str] = None
    genres: List[str] = []

class MovieResponse(MovieBase):
    overview: Optional[str] = None
    director: Optional[str] = "Unknown"
    cast: List[str] = []

    class Config:
        from_attributes = True

class MovieDetailResponse(MovieResponse):
    tagline: Optional[str] = ""
    keywords: List[str] = []
    user_rating: Optional[float] = None
    in_watchlist: bool = False
    similar_movies: List[MovieBase] = []

class MovieListResponse(BaseModel):
    items: List[MovieResponse]
    total: int
    page: int
    size: int
    pages: int
