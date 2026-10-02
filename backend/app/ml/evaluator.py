"""
Model Evaluation and Benchmark Suite
Computes authentic, reproducible evaluation metrics on held-out test splits:
- RMSE & MAE for rating prediction models (SVD, Neural CF)
- Precision@K, Recall@K, F1@K for Top-K ranking (Content, Item-CF, SVD, Neural CF, Hybrid)
- Catalog Coverage (% of movies reachable across recommendations)
- Inference Latency (ms)
Saves results to configs/experiments.json without synthetic or mocked numbers.
"""

import os
import time
import json
import logging
import numpy as np
import pandas as pd
from typing import List, Dict, Any

from backend.app.recommendation.engine import RecommendationEngine

logger = logging.getLogger(__name__)

CONFIGS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "configs")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "data")

class ModelEvaluator:
    def __init__(self, data_dir: str = DATA_DIR, configs_dir: str = CONFIGS_DIR, k: int = 10):
        self.data_dir = data_dir
        self.configs_dir = configs_dir
        self.k = k
        self.engine = RecommendationEngine.get_instance()
        self.ratings_df = pd.read_csv(os.path.join(data_dir, "processed_ratings.csv"))
        self.movies_df = pd.read_csv(os.path.join(data_dir, "processed_movies.csv"))

    def split_train_test(self, test_size: float = 0.2, random_state: int = 42):
        """Perform train/test split on ratings."""
        np.random.seed(random_state)
        shuffled = self.ratings_df.sample(frac=1.0, random_state=random_state).reset_index(drop=True)
        split_point = int(len(shuffled) * (1.0 - test_size))
        train_df = shuffled.iloc[:split_point]
        test_df = shuffled.iloc[split_point:]
        return train_df, test_df

    def evaluate_rating_accuracy(self, test_df: pd.DataFrame, max_eval_samples: int = 2000) -> Dict[str, Dict[str, float]]:
        """Calculate real RMSE and MAE on test split for SVD and Neural CF."""
        eval_subset = test_df.head(max_eval_samples)
        
        svd_errors, svd_abs_errors = [], []
        ncf_errors, ncf_abs_errors = [], []
        
        t0 = time.perf_counter()
        for _, row in eval_subset.iterrows():
            uid = int(row["userId"])
            mid = int(row["movieId"])
            true_r = float(row["rating"])
            
            # SVD
            pred_svd = self.engine.svd_model.predict(uid, mid)
            svd_errors.append((true_r - pred_svd) ** 2)
            svd_abs_errors.append(abs(true_r - pred_svd))
            
            # Neural CF
            pred_ncf = self.engine.neural_cf_model.predict(uid, mid)
            ncf_errors.append((true_r - pred_ncf) ** 2)
            ncf_abs_errors.append(abs(true_r - pred_ncf))
            
        svd_rmse = float(np.sqrt(np.mean(svd_errors)))
        svd_mae = float(np.mean(svd_abs_errors))
        
        ncf_rmse = float(np.sqrt(np.mean(ncf_errors)))
        ncf_mae = float(np.mean(ncf_abs_errors))

        return {
            "svd": {"rmse": round(svd_rmse, 4), "mae": round(svd_mae, 4)},
            "neural_cf": {"rmse": round(ncf_rmse, 4), "mae": round(ncf_mae, 4)}
        }

    def evaluate_ranking_for_strategy(
        self,
        strategy: str,
        test_users: List[int],
        train_df: pd.DataFrame,
        test_df: pd.DataFrame
    ) -> Dict[str, Any]:
        """Evaluate Precision@K, Recall@K, F1@K, Catalog Coverage, and Latency for a strategy."""
        precisions, recalls, f1s = [], [], []
        recommended_movie_ids = set()
        latencies = []
        
        total_catalog_size = len(self.movies_df)

        for uid in test_users:
            user_train = train_df[train_df["userId"] == uid]
            user_test = test_df[test_df["userId"] == uid]
            
            # Ground truth relevant movies in test set (rated >= 3.5)
            relevant_items = set(user_test[user_test["rating"] >= 3.5]["movieId"].tolist())
            if not relevant_items:
                continue

            user_ratings_list = [{"movie_id": int(r["movieId"]), "rating": float(r["rating"])} for _, r in user_train.iterrows()]

            t0 = time.perf_counter()
            recs = self.engine.recommend_for_user(
                user_id=uid,
                user_ratings=user_ratings_list,
                top_n=self.k,
                strategy=strategy
            )
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            latencies.append(elapsed_ms)

            rec_ids = [r["movie_id"] for r in recs]
            recommended_movie_ids.update(rec_ids)

            # Hits
            hits = len(set(rec_ids).intersection(relevant_items))
            p_k = hits / float(self.k)
            r_k = hits / float(len(relevant_items))
            f1_k = (2 * p_k * r_k / (p_k + r_k)) if (p_k + r_k) > 0 else 0.0

            precisions.append(p_k)
            recalls.append(r_k)
            f1s.append(f1_k)

        mean_p = float(np.mean(precisions)) if precisions else 0.0
        mean_r = float(np.mean(recalls)) if recalls else 0.0
        mean_f1 = float(np.mean(f1s)) if f1s else 0.0
        coverage = (len(recommended_movie_ids) / total_catalog_size) * 100.0
        avg_latency = float(np.mean(latencies)) if latencies else 0.0

        return {
            f"precision@{self.k}": round(mean_p, 4),
            f"recall@{self.k}": round(mean_r, 4),
            f"f1@{self.k}": round(mean_f1, 4),
            "catalog_coverage_pct": round(coverage, 2),
            "avg_latency_ms": round(avg_latency, 2),
            "evaluated_users_count": len(precisions)
        }

    def run_full_evaluation(self, num_test_users: int = 20) -> Dict[str, Any]:
        """Run full evaluation suite across all 5 model approaches."""
        print(">>> [1/3] Splitting train/test data (80/20)...")
        train_df, test_df = self.split_train_test()
        
        print(">>> [2/3] Evaluating Rating Accuracy (RMSE, MAE)...")
        acc_metrics = self.evaluate_rating_accuracy(test_df)
        
        # Select active users in test set
        user_counts = test_df["userId"].value_counts()
        test_users = user_counts[user_counts >= 5].index.tolist()[:num_test_users]
        
        print(f">>> [3/3] Evaluating Top-{self.k} Ranking Metrics across {len(test_users)} active test users...")
        strategies = ["content_based", "collaborative", "svd", "neural_cf", "hybrid"]
        
        report: Dict[str, Any] = {
            "timestamp": pd.Timestamp.now().isoformat(),
            "k": self.k,
            "dataset_info": {
                "total_users": int(self.ratings_df["userId"].nunique()),
                "total_movies": len(self.movies_df),
                "total_ratings": len(self.ratings_df),
                "train_ratings": len(train_df),
                "test_ratings": len(test_df),
                "sparsity_pct": round((1.0 - len(self.ratings_df) / (self.ratings_df["userId"].nunique() * len(self.movies_df))) * 100.0, 2)
            },
            "models": {}
        }
        
        for strat in strategies:
            print(f"    Evaluating '{strat}'...")
            res = self.evaluate_ranking_for_strategy(strat, test_users, train_df, test_df)
            
            # Merge RMSE/MAE for rating models
            if strat in acc_metrics:
                res["rmse"] = acc_metrics[strat]["rmse"]
                res["mae"] = acc_metrics[strat]["mae"]
            else:
                res["rmse"] = "N/A"
                res["mae"] = "N/A"
                
            report["models"][strat] = res

        # Save to configs/experiments.json
        out_path = os.path.join(self.configs_dir, "experiments.json")
        with open(out_path, "w") as f:
            json.dump(report, f, indent=2)
            
        print(f">>> Evaluation complete! Report saved to {out_path}")
        return report

if __name__ == "__main__":
    evaluator = ModelEvaluator()
    evaluator.run_full_evaluation()
