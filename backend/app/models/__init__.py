from backend.app.models.user import User, UserPreference, WatchHistory
from backend.app.models.movie import Movie, Genre, MovieGenre
from backend.app.models.rating import Rating, RecommendationEvent
from backend.app.models.experiment import ModelVersion, ExperimentLog

__all__ = [
    "User",
    "UserPreference",
    "WatchHistory",
    "Movie",
    "Genre",
    "MovieGenre",
    "Rating",
    "RecommendationEvent",
    "ModelVersion",
    "ExperimentLog",
]
