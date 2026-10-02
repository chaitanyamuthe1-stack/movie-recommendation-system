"""
RecommendationEngine Facade
Modular orchestrator unifying ContentBasedModel, CollaborativeModel, SVDModel,
NeuralCFModel, HybridModel, ColdStartModel, RankingModel, and ExplanationEngine.
"""

import logging
from typing import List, Dict, Any, Optional

from backend.app.recommendation.content_based import ContentBasedModel
from backend.app.recommendation.collaborative import ItemBasedCFModel
from backend.app.recommendation.svd_model import SVDModel
from backend.app.recommendation.neural_cf import NeuralCFModel
from backend.app.recommendation.hybrid import HybridRecommender
from backend.app.recommendation.cold_start import ColdStartModel
from backend.app.recommendation.ranking import RankingModel
from backend.app.recommendation.explanation import ExplanationEngine

logger = logging.getLogger(__name__)

class RecommendationEngine:
    _instance: Optional["RecommendationEngine"] = None

    def __init__(self):
        self.content_model = ContentBasedModel()
        self.collaborative_model = ItemBasedCFModel()
        self.svd_model = SVDModel()
        self.neural_cf_model = NeuralCFModel()
        self.cold_start_model = ColdStartModel()
        self.ranking_model = RankingModel()
        self.explanation_engine = ExplanationEngine()
        self.hybrid_model = HybridRecommender()
        self.is_initialized = False

    @classmethod
    def get_instance(cls) -> "RecommendationEngine":
        if cls._instance is None:
            cls._instance = cls()
            cls._instance.initialize()
        return cls._instance

    def initialize(self):
        """Warm up and initialize all sub-models."""
        if not self.is_initialized:
            logger.info("Initializing RecommendationEngine and sub-models...")
            self.hybrid_model.initialize()
            self.content_model = self.hybrid_model.content_model
            self.collaborative_model = self.hybrid_model.item_cf_model
            self.svd_model = self.hybrid_model.svd_model
            self.neural_cf_model = self.hybrid_model.neural_cf_model
            self.cold_start_model = self.hybrid_model.cold_start_model
            self.ranking_model = self.hybrid_model.ranking_model
            self.explanation_engine = self.hybrid_model.explanation_engine
            self.is_initialized = True
            logger.info("RecommendationEngine initialization complete.")

    def recommend_for_user(
        self,
        user_id: int,
        user_ratings: Optional[List[Dict[str, Any]]] = None,
        top_n: int = 10,
        strategy: str = "hybrid",
        preferred_genres: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate recommendations for a user with the requested algorithm strategy:
        'hybrid', 'svd', 'neural_cf', 'collaborative', 'content_based', or 'cold_start'.
        """
        if not self.is_initialized:
            self.initialize()

        strategy_clean = strategy.lower().strip()
        user_ratings = user_ratings or []

        if strategy_clean == "svd":
            recs = self.svd_model.recommend_for_user(user_id, top_n=top_n)
            for r in recs:
                r["explanation"] = self.explanation_engine.explain_recommendation(
                    candidate_movie_id=r["movie_id"],
                    user_ratings=user_ratings,
                    model_name="svd",
                    predicted_score=r.get("predicted_score", 4.5)
                )
            return recs

        elif strategy_clean == "neural_cf":
            recs = self.neural_cf_model.recommend_for_user(user_id, top_n=top_n)
            for r in recs:
                r["explanation"] = self.explanation_engine.explain_recommendation(
                    candidate_movie_id=r["movie_id"],
                    user_ratings=user_ratings,
                    model_name="neural_cf",
                    predicted_score=r.get("predicted_score", 4.5)
                )
            return recs

        elif strategy_clean == "collaborative":
            recs = self.collaborative_model.recommend_for_user(user_id, top_n=top_n, user_ratings=user_ratings)
            for r in recs:
                r["explanation"] = self.explanation_engine.explain_recommendation(
                    candidate_movie_id=r["movie_id"],
                    user_ratings=user_ratings,
                    model_name="collaborative",
                    predicted_score=r.get("predicted_score", 4.5)
                )
            return recs

        elif strategy_clean == "content_based":
            recs = self.content_model.recommend_for_user_ratings(user_ratings, top_n=top_n)
            for r in recs:
                r["explanation"] = self.explanation_engine.explain_recommendation(
                    candidate_movie_id=r["movie_id"],
                    user_ratings=user_ratings,
                    seed_movie_id=r.get("seed_movie_id"),
                    model_name="content_based",
                    predicted_score=r.get("predicted_score", 4.2)
                )
            return recs

        elif strategy_clean == "cold_start":
            return self.cold_start_model.recommend_for_onboarding(
                favorite_genres=preferred_genres or ["Action", "Sci-Fi"],
                selected_movie_ids=[],
                content_model=self.content_model,
                top_n=top_n
            )

        else:
            # Default to production Hybrid Recommender
            return self.hybrid_model.recommend(
                user_id=user_id,
                user_ratings=user_ratings,
                top_n=top_n,
                preferred_genres=preferred_genres
            )

    def recommend_similar_movies(self, movie_id: int, top_n: int = 10) -> List[Dict[str, Any]]:
        """Recommend similar movies based on content tags and collaborative correlations."""
        if not self.is_initialized:
            self.initialize()
        recs = self.content_model.recommend_by_movie_id(movie_id, top_n=top_n)
        for r in recs:
            r["explanation"] = self.explanation_engine.explain_recommendation(
                candidate_movie_id=r["movie_id"],
                seed_movie_id=movie_id,
                model_name="content_based",
                predicted_score=r.get("predicted_score", 4.3)
            )
        return recs

    def recommend_by_title(self, title: str, top_n: int = 10) -> List[Dict[str, Any]]:
        """Find movies similar to the given title."""
        if not self.is_initialized:
            self.initialize()
        return self.content_model.recommend_by_title(title, top_n=top_n)

    def explain(self, movie_id: int, user_ratings: Optional[List[Dict[str, Any]]] = None, seed_movie_id: Optional[int] = None) -> Dict[str, Any]:
        """Generate standalone explanation for a specific movie recommendation."""
        if not self.is_initialized:
            self.initialize()
        return self.explanation_engine.explain_recommendation(
            candidate_movie_id=movie_id,
            user_ratings=user_ratings,
            seed_movie_id=seed_movie_id
        )

    def get_trending(self, top_n: int = 15, genre: Optional[str] = None) -> List[Dict[str, Any]]:
        """Return trending popular movies."""
        if not self.is_initialized:
            self.initialize()
        return self.cold_start_model.recommend_popular(top_n=top_n, genre=genre)

    def get_status(self) -> Dict[str, Any]:
        """Check status of all model components."""
        return {
            "is_initialized": self.is_initialized,
            "content_model_loaded": self.content_model.is_loaded,
            "item_cf_loaded": self.collaborative_model.is_loaded,
            "svd_model_loaded": self.svd_model.is_loaded,
            "neural_cf_loaded": self.neural_cf_model.is_loaded,
            "cold_start_loaded": self.cold_start_model.is_loaded,
            "explanation_engine_loaded": self.explanation_engine.is_loaded
        }
