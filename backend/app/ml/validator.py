"""
Data Quality Validation and Reporting Module
Validates integrity of MovieLens ratings, movie catalog metadata,
verifies ID consistency, checks for duplicate ratings, calculates matrix sparsity,
and generates an actionable JSON data quality report.
"""

import os
import json
import logging
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

class DataQualityValidator:
    def __init__(self, movies_df: pd.DataFrame, ratings_df: pd.DataFrame):
        self.movies_df = movies_df
        self.ratings_df = ratings_df

    def validate(self) -> dict:
        """Run all data quality audits and compile structured report."""
        report = {
            "timestamp": pd.Timestamp.now().isoformat(),
            "status": "PASS",
            "summary": {},
            "movies_audit": {},
            "ratings_audit": {},
            "sparsity_audit": {},
            "issues_detected": []
        }
        
        # 1. Movies Audit
        total_movies = len(self.movies_df)
        null_movie_ids = int(self.movies_df["movieId"].isna().sum())
        null_titles = int(self.movies_df["title"].isna().sum())
        duplicate_movie_ids = int(self.movies_df["movieId"].duplicated().sum())
        empty_tags = int((self.movies_df["tags"].str.strip() == "").sum()) if "tags" in self.movies_df.columns else 0
        
        report["movies_audit"] = {
            "total_movies": total_movies,
            "null_movie_ids": null_movie_ids,
            "null_titles": null_titles,
            "duplicate_movie_ids": duplicate_movie_ids,
            "empty_tags_count": empty_tags,
            "columns": list(self.movies_df.columns)
        }
        
        if null_movie_ids > 0:
            report["issues_detected"].append(f"Found {null_movie_ids} movies with null movieId")
        if null_titles > 0:
            report["issues_detected"].append(f"Found {null_titles} movies with missing title")
        if duplicate_movie_ids > 0:
            report["issues_detected"].append(f"Found {duplicate_movie_ids} duplicate movieIds")
            
        # 2. Ratings Audit
        total_ratings = len(self.ratings_df)
        num_users = int(self.ratings_df["userId"].nunique())
        num_rated_movies = int(self.ratings_df["movieId"].nunique())
        
        null_users = int(self.ratings_df["userId"].isna().sum())
        null_rating_movie_ids = int(self.ratings_df["movieId"].isna().sum())
        duplicate_ratings = int(self.ratings_df.duplicated(subset=["userId", "movieId"]).sum())
        
        invalid_ratings = int(((self.ratings_df["rating"] < 0.5) | (self.ratings_df["rating"] > 5.0)).sum())
        rating_min = float(self.ratings_df["rating"].min())
        rating_max = float(self.ratings_df["rating"].max())
        rating_mean = float(self.ratings_df["rating"].mean())
        rating_median = float(self.ratings_df["rating"].median())
        
        # ID Consistency: ratings referencing non-existent movies
        valid_movie_ids = set(self.movies_df["movieId"].unique())
        orphan_ratings = int((~self.ratings_df["movieId"].isin(valid_movie_ids)).sum())
        
        report["ratings_audit"] = {
            "total_ratings": total_ratings,
            "unique_users": num_users,
            "unique_rated_movies": num_rated_movies,
            "null_user_ids": null_users,
            "null_movie_ids": null_rating_movie_ids,
            "duplicate_ratings": duplicate_ratings,
            "invalid_rating_values": invalid_ratings,
            "orphan_ratings_count": orphan_ratings,
            "rating_scale": {"min": rating_min, "max": rating_max, "mean": round(rating_mean, 2), "median": rating_median},
            "rating_distribution": {
                str(k): int(v) for k, v in self.ratings_df["rating"].value_counts().sort_index().items()
            }
        }
        
        if duplicate_ratings > 0:
            report["issues_detected"].append(f"Found {duplicate_ratings} duplicate (userId, movieId) ratings")
        if invalid_ratings > 0:
            report["issues_detected"].append(f"Found {invalid_ratings} ratings outside standard [0.5, 5.0] scale")
        if orphan_ratings > 0:
            report["issues_detected"].append(f"Found {orphan_ratings} ratings pointing to movies not in catalog")
            
        # 3. Matrix Sparsity
        possible_interactions = num_users * total_movies
        sparsity = (1.0 - (total_ratings / possible_interactions)) * 100.0 if possible_interactions > 0 else 100.0
        
        report["sparsity_audit"] = {
            "possible_interactions": possible_interactions,
            "actual_interactions": total_ratings,
            "matrix_sparsity_percentage": round(sparsity, 4),
            "user_activity_mean": round(total_ratings / num_users, 2) if num_users > 0 else 0,
            "ratings_per_movie_mean": round(total_ratings / num_rated_movies, 2) if num_rated_movies > 0 else 0
        }
        
        # Summary Status
        report["status"] = "FAIL" if len(report["issues_detected"]) > 0 else "PASS"
        report["summary"] = {
            "movies_count": total_movies,
            "ratings_count": total_ratings,
            "users_count": num_users,
            "matrix_sparsity": f"{sparsity:.2f}%",
            "passed_validation": report["status"] == "PASS"
        }
        
        return report

def run_validation(data_dir: str = None):
    from backend.app.ml.data_loader import MovieDataLoader, DATA_DIR
    target_dir = data_dir or DATA_DIR
    
    loader = MovieDataLoader(target_dir)
    movies_master, ratings_clean = loader.process_and_merge()
    
    validator = DataQualityValidator(movies_master, ratings_clean)
    report = validator.validate()
    
    report_path = os.path.join(target_dir, "data_quality_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
        
    print(f">>> Data quality validation finished with status: {report['status']}")
    print(f"    Sparsity: {report['sparsity_audit']['matrix_sparsity_percentage']}%")
    print(f"    Report saved to {report_path}")
    return report

if __name__ == "__main__":
    run_validation()
