"""
Neural Collaborative Filtering (NCF / NeuMF) Module in PyTorch
Combines Generalized Matrix Factorization (GMF) and a Multi-Layer Perceptron (MLP)
over user and movie embeddings to learn non-linear user-item interaction functions.
"""

import os
import json
import pickle
import logging
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "models")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "data")

class NeuMFNet(nn.Module):
    """
    Neural Matrix Factorization architecture fusing GMF and MLP branches.
    """
    def __init__(self, num_users: int, num_movies: int, latent_dim_gmf: int = 32,
                 latent_dim_mlp: int = 32, hidden_layers: List[int] = [64, 32, 16],
                 dropout: float = 0.2):
        super(NeuMFNet, self).__init__()
        
        # 1. GMF Embeddings
        self.user_embed_gmf = nn.Embedding(num_users, latent_dim_gmf)
        self.movie_embed_gmf = nn.Embedding(num_movies, latent_dim_gmf)
        
        # 2. MLP Embeddings
        self.user_embed_mlp = nn.Embedding(num_users, latent_dim_mlp)
        self.movie_embed_mlp = nn.Embedding(num_movies, latent_dim_mlp)
        
        # 3. MLP Hidden Layers
        mlp_layers = []
        in_dim = latent_dim_mlp * 2
        for h_dim in hidden_layers:
            mlp_layers.append(nn.Linear(in_dim, h_dim))
            mlp_layers.append(nn.BatchNorm1d(h_dim))
            mlp_layers.append(nn.ReLU())
            mlp_layers.append(nn.Dropout(p=dropout))
            in_dim = h_dim
        self.mlp = nn.Sequential(*mlp_layers)
        
        # 4. Final Prediction Layer
        final_in_dim = latent_dim_gmf + hidden_layers[-1]
        self.prediction_layer = nn.Linear(final_in_dim, 1)
        self.sigmoid = nn.Sigmoid()
        
        # Initialize weights with standard normal / Xavier
        self._init_weights()

    def _init_weights(self):
        nn.init.normal_(self.user_embed_gmf.weight, std=0.01)
        nn.init.normal_(self.movie_embed_gmf.weight, std=0.01)
        nn.init.normal_(self.user_embed_mlp.weight, std=0.01)
        nn.init.normal_(self.movie_embed_mlp.weight, std=0.01)
        for m in self.mlp:
            if isinstance(m, nn.Linear):
                nn.init.xavier_uniform_(m.weight)
        nn.init.kaiming_uniform_(self.prediction_layer.weight, a=1, nonlinearity="sigmoid")

    def forward(self, user_indices: torch.Tensor, movie_indices: torch.Tensor) -> torch.Tensor:
        # GMF Branch
        gmf_u = self.user_embed_gmf(user_indices)
        gmf_m = self.movie_embed_gmf(movie_indices)
        gmf_vector = gmf_u * gmf_m
        
        # MLP Branch
        mlp_u = self.user_embed_mlp(user_indices)
        mlp_m = self.movie_embed_mlp(movie_indices)
        mlp_vector = torch.cat([mlp_u, mlp_m], dim=-1)
        mlp_vector = self.mlp(mlp_vector)
        
        # Fusion
        fused = torch.cat([gmf_vector, mlp_vector], dim=-1)
        out = self.prediction_layer(fused)
        # Scale to rating range [0.5, 5.0]
        rating_pred = 0.5 + 4.5 * self.sigmoid(out)
        return rating_pred.squeeze(-1)

class RatingDataset(Dataset):
    def __init__(self, users: np.ndarray, movies: np.ndarray, ratings: np.ndarray):
        self.users = torch.tensor(users, dtype=torch.long)
        self.movies = torch.tensor(movies, dtype=torch.long)
        self.ratings = torch.tensor(ratings, dtype=torch.float32)

    def __len__(self):
        return len(self.ratings)

    def __getitem__(self, idx):
        return self.users[idx], self.movies[idx], self.ratings[idx]

class NeuralCFModel:
    def __init__(self, latent_dim_gmf: int = 32, latent_dim_mlp: int = 32,
                 hidden_layers: List[int] = [64, 32, 16], dropout: float = 0.2,
                 lr: float = 0.001, batch_size: int = 256, epochs: int = 10,
                 data_dir: str = DATA_DIR, models_dir: str = MODELS_DIR):
        self.latent_dim_gmf = latent_dim_gmf
        self.latent_dim_mlp = latent_dim_mlp
        self.hidden_layers = hidden_layers
        self.dropout = dropout
        self.lr = lr
        self.batch_size = batch_size
        self.epochs = epochs
        self.data_dir = data_dir
        self.models_dir = models_dir
        
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.net: Optional[NeuMFNet] = None
        self.user2idx: Dict[int, int] = {}
        self.movie2idx: Dict[int, int] = {}
        self.idx2movie: Dict[int, int] = {}
        self.movies_df: Optional[pd.DataFrame] = None
        self.ratings_df: Optional[pd.DataFrame] = None
        self.is_loaded: bool = False

    def train(self, test_size: float = 0.2, random_state: int = 42) -> Dict[str, Any]:
        """Train NeuMF network using PyTorch with MSE loss and Adam optimizer."""
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

        # Filter valid interactions
        valid_ratings = self.ratings_df[
            self.ratings_df["userId"].isin(self.user2idx) &
            self.ratings_df["movieId"].isin(self.movie2idx)
        ].copy()
        
        u_arr = np.array([self.user2idx[u] for u in valid_ratings["userId"]])
        m_arr = np.array([self.movie2idx[m] for m in valid_ratings["movieId"]])
        r_arr = valid_ratings["rating"].values.astype(np.float32)
        
        # Train / test split
        np.random.seed(random_state)
        indices = np.arange(len(r_arr))
        np.random.shuffle(indices)
        split_idx = int(len(r_arr) * (1.0 - test_size))
        
        train_idx, test_idx = indices[:split_idx], indices[split_idx:]
        train_dataset = RatingDataset(u_arr[train_idx], m_arr[train_idx], r_arr[train_idx])
        test_dataset = RatingDataset(u_arr[test_idx], m_arr[test_idx], r_arr[test_idx])
        
        train_loader = DataLoader(train_dataset, batch_size=self.batch_size, shuffle=True)
        test_loader = DataLoader(test_dataset, batch_size=self.batch_size, shuffle=False)
        
        num_users = len(self.user2idx)
        num_movies = len(self.movie2idx)
        
        self.net = NeuMFNet(
            num_users=num_users,
            num_movies=num_movies,
            latent_dim_gmf=self.latent_dim_gmf,
            latent_dim_mlp=self.latent_dim_mlp,
            hidden_layers=self.hidden_layers,
            dropout=self.dropout
        ).to(self.device)
        
        criterion = nn.MSELoss()
        optimizer = optim.Adam(self.net.parameters(), lr=self.lr, weight_decay=1e-5)
        
        print(f">>> Training Neural CF on {self.device} ({num_users} users, {num_movies} movies, {self.epochs} epochs)...")
        
        for epoch in range(1, self.epochs + 1):
            self.net.train()
            total_train_loss = 0.0
            for batch_u, batch_m, batch_r in train_loader:
                batch_u, batch_m, batch_r = batch_u.to(self.device), batch_m.to(self.device), batch_r.to(self.device)
                optimizer.zero_grad()
                preds = self.net(batch_u, batch_m)
                loss = criterion(preds, batch_r)
                loss.backward()
                optimizer.step()
                total_train_loss += loss.item() * len(batch_r)
                
            train_mse = total_train_loss / len(train_dataset)
            
            # Validation
            self.net.eval()
            total_test_loss = 0.0
            abs_errors = 0.0
            with torch.no_grad():
                for batch_u, batch_m, batch_r in test_loader:
                    batch_u, batch_m, batch_r = batch_u.to(self.device), batch_m.to(self.device), batch_r.to(self.device)
                    preds = self.net(batch_u, batch_m)
                    loss = criterion(preds, batch_r)
                    total_test_loss += loss.item() * len(batch_r)
                    abs_errors += torch.sum(torch.abs(preds - batch_r)).item()
                    
            test_mse = total_test_loss / len(test_dataset)
            rmse = np.sqrt(test_mse)
            mae = abs_errors / len(test_dataset)
            
            if epoch % 2 == 0 or epoch == self.epochs:
                print(f"    Epoch {epoch}/{self.epochs} - Train MSE: {train_mse:.4f}, Val RMSE: {rmse:.4f}, Val MAE: {mae:.4f}")

        # Save weights and config
        weights_path = os.path.join(self.models_dir, "neural_cf_weights.pt")
        config_path = os.path.join(self.models_dir, "neural_cf_config.json")
        
        torch.save(self.net.state_dict(), weights_path)
        config_data = {
            "num_users": num_users,
            "num_movies": num_movies,
            "latent_dim_gmf": self.latent_dim_gmf,
            "latent_dim_mlp": self.latent_dim_mlp,
            "hidden_layers": self.hidden_layers,
            "dropout": self.dropout,
            "rmse": round(float(rmse), 4),
            "mae": round(float(mae), 4),
            "epochs": self.epochs,
            "batch_size": self.batch_size
        }
        with open(config_path, "w") as f:
            json.dump(config_data, f, indent=2)
            
        print(f">>> Neural CF model trained. RMSE: {rmse:.4f}, MAE: {mae:.4f}. Saved to {weights_path}")
        self.is_loaded = True
        return config_data

    def load(self):
        """Load trained PyTorch Neural CF weights and configurations."""
        weights_path = os.path.join(self.models_dir, "neural_cf_weights.pt")
        config_path = os.path.join(self.models_dir, "neural_cf_config.json")
        mappings_path = os.path.join(self.models_dir, "id_mappings.pkl")
        movies_path = os.path.join(self.data_dir, "processed_movies.csv")
        ratings_path = os.path.join(self.data_dir, "processed_ratings.csv")

        if not os.path.exists(weights_path) or not os.path.exists(config_path):
            logger.info("Neural CF artifacts not found. Starting training...")
            self.train()
            return True

        with open(config_path, "r") as f:
            cfg = json.load(f)
            
        with open(mappings_path, "rb") as f:
            mappings = pickle.load(f)
            self.user2idx = mappings["user2idx"]
            self.movie2idx = mappings["movie2idx"]
            self.idx2movie = mappings["idx2movie"]

        self.net = NeuMFNet(
            num_users=cfg["num_users"],
            num_movies=cfg["num_movies"],
            latent_dim_gmf=cfg["latent_dim_gmf"],
            latent_dim_mlp=cfg["latent_dim_mlp"],
            hidden_layers=cfg["hidden_layers"],
            dropout=cfg.get("dropout", 0.2)
        ).to(self.device)
        
        self.net.load_state_dict(torch.load(weights_path, map_location=self.device))
        self.net.eval()
        
        self.movies_df = pd.read_csv(movies_path)
        self.ratings_df = pd.read_csv(ratings_path)
        self.is_loaded = True
        logger.info("NeuralCFModel loaded successfully.")
        return True

    def predict(self, user_id: int, movie_id: int) -> float:
        """Predict rating for given user and movie ID using PyTorch model."""
        if not self.is_loaded:
            self.load()
            
        if user_id not in self.user2idx or movie_id not in self.movie2idx:
            return 3.5
            
        u_idx = torch.tensor([self.user2idx[user_id]], dtype=torch.long, device=self.device)
        m_idx = torch.tensor([self.movie2idx[movie_id]], dtype=torch.long, device=self.device)
        
        with torch.no_grad():
            score = self.net(u_idx, m_idx).item()
        return float(np.clip(score, 0.5, 5.0))

    def predict_batch_for_user(self, user_id: int, candidate_movie_ids: List[int]) -> np.ndarray:
        """Batch predict for given user and candidate movie IDs in a single GPU/CPU forward pass."""
        if not self.is_loaded:
            self.load()
        if user_id not in self.user2idx or not candidate_movie_ids:
            return np.full(len(candidate_movie_ids), 3.5, dtype=np.float32)

        u_idx = self.user2idx[user_id]
        valid_indices = []
        positions = []
        for i, mid in enumerate(candidate_movie_ids):
            if mid in self.movie2idx:
                valid_indices.append(self.movie2idx[mid])
                positions.append(i)

        preds = np.full(len(candidate_movie_ids), 3.5, dtype=np.float32)
        if valid_indices:
            u_tensor = torch.full((len(valid_indices),), u_idx, dtype=torch.long, device=self.device)
            m_tensor = torch.tensor(valid_indices, dtype=torch.long, device=self.device)
            with torch.no_grad():
                out = self.net(u_tensor, m_tensor).cpu().numpy()
            preds[positions] = out
        return preds

    def recommend_for_user(self, user_id: int, top_n: int = 10, candidate_movie_ids: Optional[List[int]] = None) -> List[Dict[str, Any]]:
        """Batch predict for unseen movies and return top-N recommendations."""
        if not self.is_loaded:
            self.load()
            
        if user_id not in self.user2idx:
            return []
            
        u_idx_val = self.user2idx[user_id]
        
        rated_ids = set()
        if self.ratings_df is not None:
            user_ratings = self.ratings_df[self.ratings_df["userId"] == user_id]
            rated_ids = set(user_ratings["movieId"].tolist())

        pool = candidate_movie_ids if candidate_movie_ids else list(self.movie2idx.keys())
        unseen_ids = [mid for mid in pool if mid not in rated_ids and mid in self.movie2idx]
        
        if not unseen_ids:
            return []

        u_tensor = torch.full((len(unseen_ids),), u_idx_val, dtype=torch.long, device=self.device)
        m_indices = [self.movie2idx[mid] for mid in unseen_ids]
        m_tensor = torch.tensor(m_indices, dtype=torch.long, device=self.device)
        
        with torch.no_grad():
            preds = self.net(u_tensor, m_tensor).cpu().numpy()
            
        top_indices = np.argsort(-preds)[:top_n]
        
        results = []
        for rank_pos in top_indices:
            mid = unseen_ids[rank_pos]
            score = float(preds[rank_pos])
            row = self.movies_df[self.movies_df["movieId"] == mid].iloc[0]
            results.append({
                "movie_id": mid,
                "tmdb_id": int(row.get("tmdbId", 0)),
                "title": str(row["title"]),
                "similarity_score": round(score / 5.0, 4),
                "predicted_score": round(score, 2),
                "genres": [g.strip() for g in str(row.get("genres_str", "")).split("|") if g.strip()],
                "release_year": int(row.get("release_year", 0)),
                "vote_average": float(row.get("vote_average", 0.0)),
                "model": "neural_cf"
            })
            
        return results
