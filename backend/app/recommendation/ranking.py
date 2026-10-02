"""
Ranking and Diversification Engine
Normalizes multi-signal candidate scores, incorporates recency and popularity dampening,
and applies genre diversity re-ranking to deliver balanced, high-quality recommendation shelves.
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional

class RankingModel:
    def __init__(self, recency_decay: float = 0.05, diversity_penalty: float = 0.15):
        self.recency_decay = recency_decay
        self.diversity_penalty = diversity_penalty

    @staticmethod
    def min_max_normalize(scores: List[float], target_min: float = 0.0, target_max: float = 1.0) -> List[float]:
        """Min-max normalize a list of scores to [target_min, target_max]."""
        if not scores:
            return []
        arr = np.array(scores, dtype=np.float32)
        s_min, s_max = np.min(arr), np.max(arr)
        if s_max == s_min:
            return [target_max] * len(scores)
        norm = (arr - s_min) / (s_max - s_min)
        return list(norm * (target_max - target_min) + target_min)

    def calculate_recency_score(self, release_year: int, current_year: int = 2026) -> float:
        """Calculate normalized recency score with soft exponential decay for older classics."""
        if release_year <= 0:
            return 0.5
        age = max(0, current_year - release_year)
        # Recent movies (< 5 years) score ~ 0.9 - 1.0; 20 years old ~ 0.6; 50 years old ~ 0.3
        return float(np.exp(-self.recency_decay * (age / 5.0)))

    def rank_and_diversify(self, candidates: List[Dict[str, Any]], top_n: int = 10,
                           user_preferred_genres: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Re-ranks candidate movies using multi-factor signals with genre diversity penalty.
        candidates item expected keys:
          'movie_id', 'title', 'base_score', 'genres', 'release_year', 'vote_average', 'vote_count'
        """
        if not candidates:
            return []

        # 1. Base Score Normalization
        raw_scores = [c.get("score", c.get("predicted_score", 3.0)) for c in candidates]
        norm_scores = self.min_max_normalize(raw_scores, target_min=0.2, target_max=1.0)
        
        scored_candidates = []
        user_genre_set = set([g.lower() for g in (user_preferred_genres or [])])

        for idx, item in enumerate(candidates):
            base_s = norm_scores[idx]
            
            # Recency bonus
            year = item.get("release_year", 2000)
            recency_s = self.calculate_recency_score(year)
            
            # User genre preference affinity
            movie_genres = [g.lower() for g in item.get("genres", [])]
            genre_overlap = len(set(movie_genres).intersection(user_genre_set))
            genre_s = min(1.0, genre_overlap * 0.35) if user_genre_set else 0.5
            
            # Popularity trust signal
            vote_avg = item.get("vote_average", 6.0)
            pop_s = min(1.0, vote_avg / 10.0)
            
            # Combined rank score: 70% Base + 10% Genre Affinity + 10% Recency + 10% Popularity
            final_s = (0.70 * base_s) + (0.10 * genre_s) + (0.10 * recency_s) + (0.10 * pop_s)
            
            cand_copy = dict(item)
            cand_copy["ranking_score"] = round(float(final_s), 4)
            cand_copy["match_percentage"] = int(np.clip(final_s * 100, 60, 99))
            scored_candidates.append(cand_copy)

        # 2. Greedy Diversification Selection (Maximal Marginal Relevance style)
        scored_candidates.sort(key=lambda x: x["ranking_score"], reverse=True)
        
        selected: List[Dict[str, Any]] = []
        genre_frequency: Dict[str, int] = {}

        for cand in scored_candidates:
            movie_genres = cand.get("genres", [])
            # Compute penalty based on already selected genre frequency
            redundancy = sum(genre_frequency.get(g.lower(), 0) for g in movie_genres)
            adjusted_score = cand["ranking_score"] - (redundancy * self.diversity_penalty)
            cand["diversified_score"] = round(float(adjusted_score), 4)

            # Insert into selected if quality threshold holds
            selected.append(cand)
            for g in movie_genres:
                genre_frequency[g.lower()] = genre_frequency.get(g.lower(), 0) + 1

            if len(selected) >= top_n * 2:
                break

        # Re-sort by diversified score
        selected.sort(key=lambda x: x["diversified_score"], reverse=True)
        return selected[:top_n]
