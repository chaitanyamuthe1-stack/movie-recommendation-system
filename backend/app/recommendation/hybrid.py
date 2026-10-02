"""
Configurable Multi-Signal Hybrid Recommender Module
Blends Collaborative (Item-CF), Latent Factor (SVD), Deep Learning (Neural CF),
Content-Based (TF-IDF), Genre Preference, and Popularity signals.
Dynamically adjusts blend weights based on user cold/warm interaction state.
"""

import os
import json
import logging
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional

from backend.app.recommendation.content_based import ContentBasedModel
from backend.app.recommendation.collaborative import ItemBasedCFModel
from backend.app.recommendation.svd_model import SVDModel
from backend.app.recommendation.neural_cf import NeuralCFModel
from backend.app.recommendation.cold_start import ColdStartModel
from backend.app.recommendation.ranking import RankingModel
from backend.app.recommendation.explanation import ExplanationEngine

logger = logging.getLogger(__name__)

CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "configs", "hybrid_weights.json")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "data")

class HybridRecommender:
    def __init__(self, config_path: str = CONFIG_PATH, data_dir: str = DATA_DIR):
        self.config_path = config_path
        self.data_dir = data_dir
        self.weights_config: Dict[str, Any] = {}
        
        # Instantiate sub-models
        self.content_model = ContentBasedModel(data_dir=data_dir)
        self.item_cf_model = ItemBasedCFModel(data_dir=data_dir)
        self.svd_model = SVDModel(data_dir=data_dir)
        self.neural_cf_model = NeuralCFModel(data_dir=data_dir)
        self.cold_start_model = ColdStartModel(data_dir=data_dir)
        self.ranking_model = RankingModel()
        self.explanation_engine = ExplanationEngine(data_dir=data_dir)
        
        self.movies_df: Optional[pd.DataFrame] = None
        self.is_initialized: bool = False

    def load_config(self):
        """Load or reload hybrid weights configuration."""
        if os.path.exists(self.config_path):
            with open(self.config_path, "r") as f:
                self.weights_config = json.load(f)
        else:
            self.weights_config = {
                "cold_start_threshold": 5,
                "warm_user_threshold": 20,
                "cold_user_weights": {
                    "collaborative": 0.05, "svd": 0.05, "neural_cf": 0.00,
                    "content": 0.45, "genre_preference": 0.30, "popularity": 0.15, "recency": 0.00
                },
                "moderate_user_weights": {
                    "collaborative": 0.20, "svd": 0.30, "neural_cf": 0.10,
                    "content": 0.25, "genre_preference": 0.10, "popularity": 0.03, "recency": 0.02
                },
                "warm_user_weights": {
                    "collaborative": 0.25, "svd": 0.35, "neural_cf": 0.15,
                    "content": 0.15, "genre_preference": 0.05, "popularity": 0.02, "recency": 0.03
                }
            }

    def initialize(self):
        """Initialize all underlying sub-models and datasets."""
        self.load_config()
        self.content_model.load()
        self.item_cf_model.load()
        self.svd_model.load()
        self.neural_cf_model.load()
        self.cold_start_model.load()
        self.explanation_engine.load()
        
        movies_path = os.path.join(self.data_dir, "processed_movies.csv")
        if os.path.exists(movies_path):
            self.movies_df = pd.read_csv(movies_path).set_index("movieId", drop=False)
            
        self.is_initialized = True
        logger.info("HybridRecommender initialized successfully.")

    def get_weights_for_user(self, rating_count: int) -> Dict[str, float]:
        """Select dynamic weight schedule according to user maturity."""
        c_thresh = self.weights_config.get("cold_start_threshold", 5)
        w_thresh = self.weights_config.get("warm_user_threshold", 20)
        
        if rating_count < c_thresh:
            return self.weights_config["cold_user_weights"]
        elif rating_count < w_thresh:
            return self.weights_config["moderate_user_weights"]
        else:
            return self.weights_config["warm_user_weights"]

    def recommend(
        self,
        user_id: int,
        user_ratings: Optional[List[Dict[str, Any]]] = None,
        top_n: int = 10,
        preferred_genres: Optional[List[str]] = None,
        custom_weights: Optional[Dict[str, float]] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate personalized hybrid recommendations combining all 6 model signals.
        """
        if not self.is_initialized:
            self.initialize()

        user_ratings = user_ratings or []
        num_ratings = len(user_ratings)
        
        # 1. Cold Start Path for brand new users with 0 ratings
        if num_ratings == 0:
            genres = preferred_genres or ["Action", "Sci-Fi", "Drama"]
            cold_recs = self.cold_start_model.recommend_for_onboarding(
                favorite_genres=genres,
                selected_movie_ids=[],
                content_model=self.content_model,
                top_n=top_n
            )
            # Add grounded explanation
            for rec in cold_recs:
                rec["explanation"] = self.explanation_engine.explain_recommendation(
                    candidate_movie_id=rec["movie_id"],
                    user_ratings=user_ratings,
                    model_name="cold_start_popular",
                    predicted_score=rec.get("predicted_score", 4.2)
                )
            return cold_recs

        weights = custom_weights or self.get_weights_for_user(num_ratings)
        rated_movie_ids = {r["movie_id"] for r in user_ratings}
        
        # 2. Collect candidate pools from each model family
        candidates_map: Dict[int, Dict[str, float]] = {}

        # Content-based candidates
        content_recs = self.content_model.recommend_for_user_ratings(user_ratings, top_n=50)
        for r in content_recs:
            mid = r["movie_id"]
            if mid not in rated_movie_ids:
                if mid not in candidates_map:
                    candidates_map[mid] = {"content": 0.0, "cf": 0.0, "svd": 0.0, "ncf": 0.0, "seed_id": r.get("seed_movie_id")}
                candidates_map[mid]["content"] = r["similarity_score"]

        # Item-Based CF candidates
        cf_recs = self.item_cf_model.recommend_for_user(user_id, top_n=50, user_ratings=user_ratings)
        for r in cf_recs:
            mid = r["movie_id"]
            if mid not in rated_movie_ids:
                if mid not in candidates_map:
                    candidates_map[mid] = {"content": 0.0, "cf": 0.0, "svd": 0.0, "ncf": 0.0}
                candidates_map[mid]["cf"] = r["predicted_score"] / 5.0

        # SVD candidates
        cand_ids_list = list(candidates_map.keys())
        if len(cand_ids_list) < 40 and self.movies_df is not None:
            # Supplement with popular movies
            pop_ids = self.movies_df.sort_values("vote_count", ascending=False)["movieId"].head(80).tolist()
            cand_ids_list = list(set(cand_ids_list + [m for m in pop_ids if m not in rated_movie_ids]))

        # Score candidates with SVD and Neural CF in fast vectorized batches
        if cand_ids_list:
            svd_scores = self.svd_model.predict_batch_for_user(user_id, cand_ids_list)
            ncf_scores = self.neural_cf_model.predict_batch_for_user(user_id, cand_ids_list)
            for i, mid in enumerate(cand_ids_list):
                if mid not in candidates_map:
                    candidates_map[mid] = {"content": 0.0, "cf": 0.0, "svd": 0.0, "ncf": 0.0}
                candidates_map[mid]["svd"] = float(svd_scores[i]) / 5.0
                candidates_map[mid]["ncf"] = float(ncf_scores[i]) / 5.0

        if not candidates_map:
            return self.cold_start_model.recommend_popular(top_n=top_n)

        # 3. Calculate Genre Affinity Vector
        user_genre_affinity: Dict[str, float] = {}
        for r in user_ratings:
            mid = r["movie_id"]
            if self.movies_df is not None and mid in self.movies_df.index:
                row = self.movies_df.loc[mid]
                genres = str(row.get("genres_str", "")).split("|")
                weight = max(0.2, (r["rating"] - 2.5) / 2.5)
                for g in genres:
                    g_clean = g.strip().lower()
                    if g_clean:
                        user_genre_affinity[g_clean] = user_genre_affinity.get(g_clean, 0.0) + weight

        # 4. Compute Weighted Hybrid Score for each candidate
        hybrid_candidates: List[Dict[str, Any]] = []
        for mid, signals in candidates_map.items():
            if self.movies_df is None or mid not in self.movies_df.index:
                continue
            row = self.movies_df.loc[mid]
            
            # Genre preference score
            cand_genres = [g.strip().lower() for g in str(row.get("genres_str", "")).split("|") if g.strip()]
            genre_score = 0.0
            if cand_genres and user_genre_affinity:
                total_aff = sum(user_genre_affinity.get(g, 0.0) for g in cand_genres)
                genre_score = min(1.0, total_aff / (len(cand_genres) * 2.0))
            elif preferred_genres:
                overlap = len(set(cand_genres).intersection(set([g.lower() for g in preferred_genres])))
                genre_score = min(1.0, overlap * 0.4)

            # Popularity score
            pop_score = min(1.0, float(row.get("vote_average", 6.0)) / 10.0)
            
            # Recency score
            recency_score = self.ranking_model.calculate_recency_score(int(row.get("release_year", 2000)))

            # Combine signals
            final_hybrid_score = (
                weights.get("collaborative", 0.20) * signals["cf"] +
                weights.get("svd", 0.30) * signals["svd"] +
                weights.get("neural_cf", 0.15) * signals["ncf"] +
                weights.get("content", 0.20) * signals["content"] +
                weights.get("genre_preference", 0.10) * genre_score +
                weights.get("popularity", 0.03) * pop_score +
                weights.get("recency", 0.02) * recency_score
            )

            hybrid_candidates.append({
                "movie_id": mid,
                "tmdb_id": int(row.get("tmdbId", 0)),
                "title": str(row["title"]),
                "score": round(float(final_hybrid_score), 4),
                "predicted_score": round(float(np.clip(final_hybrid_score * 5.0, 1.0, 5.0)), 2),
                "genres": [g.strip() for g in str(row.get("genres_str", "")).split("|") if g.strip()],
                "release_year": int(row.get("release_year", 0)),
                "vote_average": float(row.get("vote_average", 0.0)),
                "vote_count": int(row.get("vote_count", 0)),
                "seed_movie_id": signals.get("seed_id"),
                "model": "hybrid"
            })

        # 5. Re-ranking with diversity penalty
        user_top_genres = sorted(user_genre_affinity, key=user_genre_affinity.get, reverse=True)[:3] if user_genre_affinity else preferred_genres
        ranked_results = self.ranking_model.rank_and_diversify(
            hybrid_candidates,
            top_n=top_n,
            user_preferred_genres=user_top_genres
        )

        # 6. Attach Grounded Explanations
        for item in ranked_results:
            item["explanation"] = self.explanation_engine.explain_recommendation(
                candidate_movie_id=item["movie_id"],
                user_ratings=user_ratings,
                seed_movie_id=item.get("seed_movie_id"),
                model_name="hybrid",
                predicted_score=item.get("predicted_score", 4.5)
            )

        return ranked_results
