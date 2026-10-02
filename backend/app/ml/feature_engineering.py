"""
Feature Engineering Module
Constructs TF-IDF matrices from movie tags, calculates cosine similarity,
and builds contiguous user/movie ID indexers for Collaborative Filtering and Neural CF.
"""

import os
import pickle
import logging
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

class FeatureEngineer:
    def __init__(self, max_features: int = 5000, models_dir: str = MODELS_DIR):
        self.max_features = max_features
        self.models_dir = models_dir
        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            max_features=max_features,
            ngram_range=(1, 2)
        )
        self.user2idx = {}
        self.idx2user = {}
        self.movie2idx = {}
        self.idx2movie = {}

    def fit_transform_content(self, movies_df: pd.DataFrame):
        """Fit TF-IDF on movie tags and compute cosine similarity matrix."""
        print(f">>> Vectorizing {len(movies_df):,} movie tags with TF-IDF (max_features={self.max_features})...")
        tfidf_matrix = self.vectorizer.fit_transform(movies_df["tags"].fillna(""))
        
        # Compute dense cosine similarity
        print(">>> Computing pairwise cosine similarity matrix...")
        similarity_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix).astype(np.float32)
        
        # Save vectorizer and similarity matrix
        vec_path = os.path.join(self.models_dir, "tfidf_vectorizer.pkl")
        sim_path = os.path.join(self.models_dir, "content_similarity.npy")
        
        with open(vec_path, "wb") as f:
            pickle.dump(self.vectorizer, f)
        np.save(sim_path, similarity_matrix)
        
        print(f"    Saved TF-IDF vectorizer to {vec_path}")
        print(f"    Saved similarity matrix ({similarity_matrix.shape}) to {sim_path}")
        return tfidf_matrix, similarity_matrix

    def build_id_mappings(self, ratings_df: pd.DataFrame, movies_df: pd.DataFrame):
        """Map raw user/movie IDs to contiguous 0-indexed integers for Neural CF and SVD."""
        unique_users = sorted(ratings_df["userId"].unique())
        unique_movies = sorted(movies_df["movieId"].unique())
        
        self.user2idx = {uid: idx for idx, uid in enumerate(unique_users)}
        self.idx2user = {idx: uid for uid, idx in self.user2idx.items()}
        
        self.movie2idx = {mid: idx for idx, mid in enumerate(unique_movies)}
        self.idx2movie = {idx: mid for mid, idx in self.movie2idx.items()}
        
        mapping_path = os.path.join(self.models_dir, "id_mappings.pkl")
        mappings = {
            "user2idx": self.user2idx,
            "idx2user": self.idx2user,
            "movie2idx": self.movie2idx,
            "idx2movie": self.idx2movie
        }
        with open(mapping_path, "wb") as f:
            pickle.dump(mappings, f)
            
        print(f">>> Indexed {len(self.user2idx):,} users and {len(self.movie2idx):,} movies. Saved to {mapping_path}")
        return mappings

if __name__ == "__main__":
    from backend.app.ml.data_loader import MovieDataLoader
    loader = MovieDataLoader()
    movies_df, ratings_df = loader.process_and_merge()
    
    fe = FeatureEngineer()
    fe.fit_transform_content(movies_df)
    fe.build_id_mappings(ratings_df, movies_df)
