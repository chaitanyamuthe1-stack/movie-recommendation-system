"""
Cold-Start Recommendation Module
Handles zero-rating scenarios for new users and new items.
Constructs an initial preference vector from onboarding genre/movie selections
and leverages content similarity, popularity damping, and Bayesian average ratings.
"""

import os
import logging
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "data")

class ColdStartModel:
    def __init__(self, data_dir: str = DATA_DIR):
        self.data_dir = data_dir
        self.movies_df: Optional[pd.DataFrame] = None
        self.is_loaded: bool = False

    def load(self):
        """Load movies dataset with vote statistics."""
        movies_path = os.path.join(self.data_dir, "processed_movies.csv")
        if not os.path.exists(movies_path):
            return False
        self.movies_df = pd.read_csv(movies_path)
        self.is_loaded = True
        return True

    def calculate_bayesian_rating(self, min_votes_quantile: float = 0.70) -> pd.DataFrame:
        """
        IMDB / Bayesian Weighted Rating Formula:
        WR = (v / (v + m)) * R + (m / (v + m)) * C
        where:
        v = number of votes for the movie (vote_count)
        m = minimum votes required to be listed in the chart
        R = average rating of the movie (vote_average)
        C = mean vote across the whole report
        """
        if not self.is_loaded:
            self.load()
            
        df = self.movies_df.copy()
        v = df["vote_count"].fillna(0)
        R = df["vote_average"].fillna(0.0)
        C = R.mean()
        m = v.quantile(min_votes_quantile)
        
        # Weighted rating
        df["weighted_rating"] = (v / (v + m)) * R + (m / (v + m)) * C
        return df

    def recommend_popular(self, top_n: int = 10, genre: Optional[str] = None, exclude_ids: Optional[List[int]] = None) -> List[Dict[str, Any]]:
        """Return top Bayesian-weighted popular movies, optionally filtered by genre."""
        df = self.calculate_bayesian_rating()
        exclude_set = set(exclude_ids or [])
        
        if genre:
            genre_clean = genre.strip().lower()
            df = df[df["genres_str"].str.lower().str.contains(genre_clean, na=False)]
            
        df = df[~df["movieId"].isin(exclude_set)]
        top_picks = df.sort_values(by=["weighted_rating", "popularity"], ascending=[False, False]).head(top_n)
        
        results = []
        for _, row in top_picks.iterrows():
            results.append({
                "movie_id": int(row["movieId"]),
                "tmdb_id": int(row.get("tmdbId", 0)),
                "title": str(row["title"]),
                "similarity_score": round(float(row["weighted_rating"]) / 10.0, 4),
                "predicted_score": round(float(row["weighted_rating"]) / 2.0, 2),  # scale to 5.0
                "genres": [g.strip() for g in str(row.get("genres_str", "")).split("|") if g.strip()],
                "release_year": int(row.get("release_year", 0)),
                "vote_average": float(row.get("vote_average", 0.0)),
                "model": "cold_start_popular"
            })
        return results

    def recommend_for_onboarding(self, favorite_genres: List[str], selected_movie_ids: List[int],
                                 content_model: Any, top_n: int = 15) -> List[Dict[str, Any]]:
        """
        New User Onboarding Recommendation:
        Combines seeds from user-selected movies + high-rated movies in preferred genres.
        """
        if not self.is_loaded:
            self.load()

        recommendations = []
        seen_ids = set(selected_movie_ids)
        
        # 1. Content-based similarity from selected movies
        if selected_movie_ids and content_model:
            pseudo_ratings = [{"movie_id": mid, "rating": 5.0} for mid in selected_movie_ids]
            content_recs = content_model.recommend_for_user_ratings(pseudo_ratings, top_n=top_n)
            for rec in content_recs:
                if rec["movie_id"] not in seen_ids:
                    seen_ids.add(rec["movie_id"])
                    rec["model"] = "cold_start_content"
                    recommendations.append(rec)

        # 2. Genre-based popular recommendations
        if favorite_genres:
            per_genre_n = max(3, top_n // len(favorite_genres))
            for g in favorite_genres:
                genre_recs = self.recommend_popular(top_n=per_genre_n, genre=g, exclude_ids=list(seen_ids))
                for rec in genre_recs:
                    if rec["movie_id"] not in seen_ids:
                        seen_ids.add(rec["movie_id"])
                        rec["model"] = "cold_start_genre"
                        recommendations.append(rec)

        # 3. Overall popular fallback if not enough results
        if len(recommendations) < top_n:
            general_recs = self.recommend_popular(top_n=top_n - len(recommendations), exclude_ids=list(seen_ids))
            recommendations.extend(general_recs)

        return recommendations[:top_n]

    def handle_cold_movie(self, movie_id: int, content_model: Any, top_n: int = 10) -> List[Dict[str, Any]]:
        """
        New Movie with 0 ratings:
        Returns similar movies purely via content metadata (overview, genres, keywords, cast, director).
        """
        if content_model:
            return content_model.recommend_by_movie_id(movie_id, top_n=top_n)
        return []
