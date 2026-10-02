"""
Movie and Genre Database Models
"""

import datetime
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, Table, DateTime
from sqlalchemy.orm import relationship
from backend.app.database import Base

class MovieGenre(Base):
    __tablename__ = "movie_genres"

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), index=True)
    genre_id = Column(Integer, ForeignKey("genres.id", ondelete="CASCADE"), index=True)

class Genre(Base):
    __tablename__ = "genres"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)

    movies = relationship("Movie", secondary="movie_genres", back_populates="genres")

class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)  # MovieLens movieId
    tmdb_id = Column(Integer, index=True, nullable=True)
    imdb_id = Column(String(50), index=True, nullable=True, default="")
    title = Column(String(500), index=True, nullable=False)
    original_title = Column(String(500), default="")
    overview = Column(Text, default="")
    tagline = Column(String(500), default="")
    release_date = Column(String(50), default="")
    release_year = Column(Integer, index=True, default=0)
    vote_average = Column(Float, default=0.0)
    vote_count = Column(Integer, default=0)
    popularity = Column(Float, default=0.0)
    director = Column(String(255), index=True, default="Unknown")
    cast_members = Column(Text, default="")  # Pipe-separated top actors
    keywords = Column(Text, default="")      # Pipe-separated keywords
    poster_path = Column(String(500), default="")
    poster_url = Column(String(500), default="")
    backdrop_path = Column(String(500), default="")
    backdrop_url = Column(String(500), default="")
    tags = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    @property
    def movie_id(self) -> int:
        """Alias id to movie_id for consistent domain naming."""
        return self.id

    # Relationships
    genres = relationship("Genre", secondary="movie_genres", back_populates="movies")
    ratings = relationship("Rating", back_populates="movie", cascade="all, delete-orphan")
    watch_history = relationship("WatchHistory", back_populates="movie", cascade="all, delete-orphan")
