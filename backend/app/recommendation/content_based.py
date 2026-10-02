"""
Content-Based Recommendation Engine
Uses TF-IDF feature representations and cosine similarity over movie 'tags'
(overview, genres, keywords, cast, and director) to find similar movies
and personalize recommendations based on high-rated seed movies.
"""

import os
import pickle
import logging
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "models")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "data")

class ContentBasedModel:
    def __init__(self, data_dir: str = DATA_DIR, models_dir: str = MODELS_DIR):
        self.data_dir = data_dir
        self.models_dir = models_dir
        self.movies_df: Optional[pd.DataFrame] = None
        self.similarity_matrix: Optional[np.ndarray] = None
        self.movie_id_to_idx: Dict[int, int] = {}
        self.idx_to_movie_id: Dict[int, int] = {}
        self.title_to_id: Dict[str, int] = {}
        self.is_loaded: bool = False

    def load(self):
        """Load movies metadata and precomputed cosine similarity matrix."""
        movies_path = os.path.join(self.data_dir, "processed_movies.csv")
        sim_path = os.path.join(self.models_dir, "content_similarity.npy")
        
        if not os.path.exists(movies_path) or not os.path.exists(sim_path):
            logger.warning(f"Content artifacts missing at {sim_path} or {movies_path}. Model not loaded.")
            return False

        self.movies_df = pd.read_csv(movies_path)
        self.similarity_matrix = np.load(sim_path)
        
        # Build index maps
        for idx, row in self.movies_df.iterrows():
            m_id = int(row["movieId"])
            self.movie_id_to_idx[m_id] = idx
            self.idx_to_movie_id[idx] = m_id
            self.title_to_id[str(row["title"]).strip().lower()] = m_id
            
        self.is_loaded = True
        logger.info(f"ContentBasedModel loaded {len(self.movies_df)} movies and ({self.similarity_matrix.shape}) similarity matrix.")
        return True

    def recommend_by_movie_id(self, movie_id: int, top_n: int = 10, exclude_ids: Optional[List[int]] = None) -> List[Dict[str, Any]]:
        """Find the top-N most similar movies to a given movie ID."""
        if not self.is_loaded:
            self.load()
        if movie_id not in self.movie_id_to_idx:
            logger.warning(f"Movie ID {movie_id} not found in content catalog.")
            return []

        idx = self.movie_id_to_idx[movie_id]
        sim_scores = self.similarity_matrix[idx]
        
        exclude_set = set(exclude_ids or [])
        exclude_set.add(movie_id)
        
        # Sort indices by similarity descending
        ranked_indices = np.argsort(-sim_scores)
        
        results = []
        for r_idx in ranked_indices:
            cand_id = self.idx_to_movie_id[r_idx]
            if cand_id in exclude_set:
                continue
                
            score = float(sim_scores[r_idx])
            movie_row = self.movies_df.iloc[r_idx]
            
            results.append({
                "movie_id": cand_id,
                "tmdb_id": int(movie_row.get("tmdbId", 0)),
                "title": str(movie_row["title"]),
                "similarity_score": round(score, 4),
                "predicted_score": round(score * 5.0, 2),
                "genres": [g.strip() for g in str(movie_row.get("genres_str", "")).split("|") if g.strip()],
                "release_year": int(movie_row.get("release_year", 0)),
                "vote_average": float(movie_row.get("vote_average", 0.0)),
                "model": "content_based",
                "seed_movie_id": movie_id
            })
            
            if len(results) >= top_n:
                break
                
        return results

    def recommend_by_title(self, title: str, top_n: int = 10) -> List[Dict[str, Any]]:
        """Lookup by title (exact or partial match) and recommend similar movies."""
        if not self.is_loaded:
            self.load()
            
        clean_title = title.strip().lower()
        if clean_title in self.title_to_id:
            m_id = self.title_to_id[clean_title]
            return self.recommend_by_movie_id(m_id, top_n)
            
        # Fallback to partial substring search
        matches = self.movies_df[self.movies_df["title"].str.lower().str.contains(clean_title, na=False)]
        if not matches.empty:
            m_id = int(matches.iloc[0]["movieId"])
            return self.recommend_by_movie_id(m_id, top_n)
            
        return []

    def recommend_for_user_ratings(self, user_ratings: List[Dict[str, Any]], top_n: int = 10) -> List[Dict[str, Any]]:
        """
        Personalized content recommendation for a user based on their rating history.
        Aggregates similarity vectors weighted by user ratings >= 3.0.
        user_ratings format: [{'movie_id': int, 'rating': float}, ...]
        """
        if not self.is_loaded:
            self.load()
        if not user_ratings:
            return []

        rated_ids = {r["movie_id"] for r in user_ratings}
        # Filter to liked movies (rating >= 3.0)
        liked_ratings = [r for r in user_ratings if r["rating"] >= 3.0 and r["movie_id"] in self.movie_id_to_idx]
        
        if not liked_ratings:
            # If no positive ratings, take highest rated
            liked_ratings = sorted(user_ratings, key=lambda x: x["rating"], reverse=True)[:3]
            liked_ratings = [r for r in liked_ratings if r["movie_id"] in self.movie_id_to_idx]
            
        if not liked_ratings:
            return []

        # Compute weighted aggregate similarity vector
        total_weight = 0.0
        agg_similarity = np.zeros(len(self.movies_df), dtype=np.float32)
        seed_attributions = {}
        
        for r in liked_ratings:
            m_id = r["movie_id"]
            weight = r["rating"] - 2.5  # centered weight: 5.0 -> 2.5, 3.0 -> 0.5
            if weight <= 0:
                continue
            idx = self.movie_id_to_idx[m_id]
            sim_vector = self.similarity_matrix[idx]
            agg_similarity += sim_vector * weight
            total_weight += weight
            
        if total_weight > 0:
            agg_similarity /= total_weight
            
        ranked_indices = np.argsort(-agg_similarity)
        
        results = []
        for r_idx in ranked_indices:
            cand_id = self.idx_to_movie_id[r_idx]
            if cand_id in rated_ids:
                continue
                
            score = float(agg_similarity[r_idx])
            movie_row = self.movies_df.iloc[r_idx]
            
            # Find the strongest seed movie contributor
            best_seed_id = None
            best_seed_score = -1.0
            for r in liked_ratings:
                s_id = r["movie_id"]
                s_idx = self.movie_id_to_idx[s_id]
                pairwise_sim = self.similarity_matrix[s_idx, r_idx]
                if pairwise_sim > best_seed_score:
                    best_seed_score = pairwise_sim
                    best_seed_id = s_id
                    
            results.append({
                "movie_id": cand_id,
                "tmdb_id": int(movie_row.get("tmdbId", 0)),
                "title": str(movie_row["title"]),
                "similarity_score": round(score, 4),
                "predicted_score": round(score * 5.0, 2),
                "genres": [g.strip() for g in str(movie_row.get("genres_str", "")).split("|") if g.strip()],
                "release_year": int(movie_row.get("release_year", 0)),
                "vote_average": float(movie_row.get("vote_average", 0.0)),
                "model": "content_based",
                "seed_movie_id": best_seed_id,
                "seed_similarity": round(float(best_seed_score), 4)
            })
            
            if len(results) >= top_n:
                break
                
        return results
