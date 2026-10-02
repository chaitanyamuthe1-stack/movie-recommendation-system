"""
Item-Based Collaborative Filtering Module
Constructs an item-item similarity matrix using adjusted cosine / Pearson correlation
over the user-item rating matrix to predict ratings and generate collaborative recommendations.
"""

import os
import pickle
import logging
import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "models")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "data")

class ItemBasedCFModel:
    def __init__(self, data_dir: str = DATA_DIR, models_dir: str = MODELS_DIR):
        self.data_dir = data_dir
        self.models_dir = models_dir
        self.movies_df: Optional[pd.DataFrame] = None
        self.ratings_df: Optional[pd.DataFrame] = None
        self.item_similarity_matrix: Optional[np.ndarray] = None
        self.user2idx: Dict[int, int] = {}
        self.movie2idx: Dict[int, int] = {}
        self.idx2movie: Dict[int, int] = {}
        self.rating_matrix: Optional[csr_matrix] = None
        self.movie_mean_ratings: Dict[int, float] = {}
        self.is_loaded: bool = False

    def train_and_save(self):
        """Compute item-item similarity matrix and serialize to disk."""
        ratings_path = os.path.join(self.data_dir, "processed_ratings.csv")
        movies_path = os.path.join(self.data_dir, "processed_movies.csv")
        mappings_path = os.path.join(self.models_dir, "id_mappings.pkl")
        
        self.ratings_df = pd.read_csv(ratings_path)
        self.movies_df = pd.read_csv(movies_path)
        
        with open(mappings_path, "rb") as f:
            mappings = pickle.load(f)
            self.user2idx = mappings["user2idx"]
            self.movie2idx = mappings["movie2idx"]
            self.idx2movie = mappings["idx2movie"]

        print(f">>> Building sparse rating matrix for Item-Based CF ({len(self.user2idx)} users x {len(self.movie2idx)} movies)...")
        
        valid_ratings = self.ratings_df[
            self.ratings_df["userId"].isin(self.user2idx) &
            self.ratings_df["movieId"].isin(self.movie2idx)
        ].copy()
        
        u_indices = [self.user2idx[uid] for uid in valid_ratings["userId"]]
        m_indices = [self.movie2idx[mid] for mid in valid_ratings["movieId"]]
        ratings = valid_ratings["rating"].values.astype(np.float32)
        
        num_users = len(self.user2idx)
        num_movies = len(self.movie2idx)
        
        # User-item matrix: users as rows, movies as columns
        user_movie_mat = csr_matrix((ratings, (u_indices, m_indices)), shape=(num_users, num_movies))
        
        # Movie-user matrix: movies as rows, users as columns
        movie_user_mat = user_movie_mat.T.tocsr()
        
        # Compute item-item cosine similarity
        print(">>> Computing Item-Item similarity matrix...")
        item_sim = cosine_similarity(movie_user_mat, dense_output=True).astype(np.float32)
        np.fill_diagonal(item_sim, 0.0)
        
        # Calculate mean rating per movie
        means = valid_ratings.groupby("movieId")["rating"].mean().to_dict()
        self.movie_mean_ratings = means
        
        # Save artifacts
        sim_path = os.path.join(self.models_dir, "item_cf_similarity.npy")
        means_path = os.path.join(self.models_dir, "movie_means.pkl")
        
        np.save(sim_path, item_sim)
        with open(means_path, "wb") as f:
            pickle.dump(means, f)
            
        print(f"    Item-Based CF similarity saved to {sim_path}")
        self.item_similarity_matrix = item_sim
        self.is_loaded = True
        return item_sim

    def load(self):
        """Load precomputed item-based CF artifacts."""
        sim_path = os.path.join(self.models_dir, "item_cf_similarity.npy")
        means_path = os.path.join(self.models_dir, "movie_means.pkl")
        mappings_path = os.path.join(self.models_dir, "id_mappings.pkl")
        movies_path = os.path.join(self.data_dir, "processed_movies.csv")
        ratings_path = os.path.join(self.data_dir, "processed_ratings.csv")

        if not os.path.exists(sim_path):
            logger.info("Item CF matrix not found on disk. Training now...")
            self.train_and_save()
            return True

        self.item_similarity_matrix = np.load(sim_path)
        with open(means_path, "rb") as f:
            self.movie_mean_ratings = pickle.load(f)
        with open(mappings_path, "rb") as f:
            mappings = pickle.load(f)
            self.user2idx = mappings["user2idx"]
            self.movie2idx = mappings["movie2idx"]
            self.idx2movie = mappings["idx2movie"]
            
        self.movies_df = pd.read_csv(movies_path)
        self.ratings_df = pd.read_csv(ratings_path)
        self.is_loaded = True
        logger.info(f"ItemBasedCFModel loaded ({self.item_similarity_matrix.shape}).")
        return True

    def get_similar_movies(self, movie_id: int, top_n: int = 10) -> List[Dict[str, Any]]:
        """Return the top-N most similar movies based on collaborative co-rating patterns."""
        if not self.is_loaded:
            self.load()
        if movie_id not in self.movie2idx:
            return []

        m_idx = self.movie2idx[movie_id]
        scores = self.item_similarity_matrix[m_idx]
        ranked_indices = np.argsort(-scores)
        
        results = []
        for r_idx in ranked_indices:
            if r_idx == m_idx:
                continue
            cand_id = self.idx2movie[r_idx]
            sim_score = float(scores[r_idx])
            if sim_score <= 0.0:
                continue
                
            movie_matches = self.movies_df[self.movies_df["movieId"] == cand_id]
            if movie_matches.empty:
                continue
            row = movie_matches.iloc[0]
            
            results.append({
                "movie_id": cand_id,
                "tmdb_id": int(row.get("tmdbId", 0)),
                "title": str(row["title"]),
                "similarity_score": round(sim_score, 4),
                "predicted_score": round(sim_score * 5.0, 2),
                "genres": [g.strip() for g in str(row.get("genres_str", "")).split("|") if g.strip()],
                "release_year": int(row.get("release_year", 0)),
                "vote_average": float(row.get("vote_average", 0.0)),
                "model": "item_cf"
            })
            if len(results) >= top_n:
                break
        return results

    def predict_user_rating(self, user_ratings_dict: Dict[int, float], candidate_movie_id: int, k: int = 20) -> float:
        """Predict rating for candidate movie using user's existing ratings and top-k neighbors."""
        if candidate_movie_id not in self.movie2idx:
            return self.movie_mean_ratings.get(candidate_movie_id, 3.5)
            
        c_idx = self.movie2idx[candidate_movie_id]
        sim_vector = self.item_similarity_matrix[c_idx]
        
        sims = []
        user_vals = []
        for m_id, r_val in user_ratings_dict.items():
            if m_id in self.movie2idx and m_id != candidate_movie_id:
                m_idx = self.movie2idx[m_id]
                sim = sim_vector[m_idx]
                if sim > 0:
                    sims.append(sim)
                    user_vals.append(r_val)
                    
        if not sims:
            return self.movie_mean_ratings.get(candidate_movie_id, 3.5)
            
        # Select top-k highest similarity neighbors
        sims = np.array(sims)
        user_vals = np.array(user_vals)
        top_indices = np.argsort(-sims)[:k]
        
        top_sims = sims[top_indices]
        top_vals = user_vals[top_indices]
        
        pred = np.sum(top_sims * top_vals) / np.sum(top_sims)
        return float(np.clip(pred, 1.0, 5.0))

    def recommend_for_user(self, user_id: int, top_n: int = 10, user_ratings: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
        """Recommend movies for a user by scoring candidates with collaborative neighbors."""
        if not self.is_loaded:
            self.load()

        user_ratings_map = {}
        if user_ratings:
            user_ratings_map = {r["movie_id"]: float(r["rating"]) for r in user_ratings}
        elif self.ratings_df is not None:
            user_rows = self.ratings_df[self.ratings_df["userId"] == user_id]
            user_ratings_map = dict(zip(user_rows["movieId"], user_rows["rating"]))

        if not user_ratings_map:
            return []

        rated_movie_ids = set(user_ratings_map.keys())
        # Candidate set: movies that are similar to user's liked movies (rating >= 3.0)
        liked_movie_ids = [mid for mid, r in user_ratings_map.items() if r >= 3.0 and mid in self.movie2idx]
        if not liked_movie_ids:
            liked_movie_ids = list(user_ratings_map.keys())[:5]

        candidates = set()
        for mid in liked_movie_ids:
            m_idx = self.movie2idx[mid]
            sims = self.item_similarity_matrix[m_idx]
            top_cand_indices = np.argsort(-sims)[:50]
            for c_idx in top_cand_indices:
                cand_id = self.idx2movie[c_idx]
                if cand_id not in rated_movie_ids and sims[c_idx] > 0.05:
                    candidates.add(cand_id)

        if not candidates:
            # Fallback to popular movies unseen by user
            popular_candidates = self.movies_df.sort_values("vote_count", ascending=False)["movieId"].tolist()
            candidates = set([m for m in popular_candidates if m not in rated_movie_ids][:100])

        scored = []
        for cand_id in candidates:
            pred_score = self.predict_user_rating(user_ratings_map, cand_id)
            movie_row = self.movies_df[self.movies_df["movieId"] == cand_id].iloc[0]
            scored.append({
                "movie_id": cand_id,
                "tmdb_id": int(movie_row.get("tmdbId", 0)),
                "title": str(movie_row["title"]),
                "similarity_score": round(pred_score / 5.0, 4),
                "predicted_score": round(pred_score, 2),
                "genres": [g.strip() for g in str(movie_row.get("genres_str", "")).split("|") if g.strip()],
                "release_year": int(movie_row.get("release_year", 0)),
                "vote_average": float(movie_row.get("vote_average", 0.0)),
                "model": "item_cf"
            })

        scored.sort(key=lambda x: x["predicted_score"], reverse=True)
        return scored[:top_n]
