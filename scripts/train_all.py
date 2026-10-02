"""
End-to-End ML Pipeline Training and Evaluation Script
Executes all stages of the MLOps pipeline:
1. Data Loading and Catalog Unification (MovieLens + TMDB)
2. Data Integrity and Sparsity Validation
3. Feature Engineering (TF-IDF vectorization, Cosine Similarity, ID mappings)
4. Model Training: SVD, Item-Based Collaborative Filtering, and PyTorch Neural CF
5. Model Evaluation and Experiment Logging (configs/experiments.json)
"""

import os
import sys
import time

# Ensure UTF-8 stdout encoding on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.ml.data_loader import MovieDataLoader
from backend.app.ml.validator import DataQualityValidator
from backend.app.ml.feature_engineering import FeatureEngineer
from backend.app.recommendation.content_based import ContentBasedModel
from backend.app.recommendation.collaborative import ItemBasedCFModel
from backend.app.recommendation.svd_model import SVDModel
from backend.app.recommendation.neural_cf import NeuralCFModel
from backend.app.ml.evaluator import ModelEvaluator

def main():
    start_time = time.time()
    print("=" * 70)
    print(">> STARTING PRODUCTION ML PIPELINE TRAINING & EVALUATION")
    print("=" * 70)

    # 1. Data Ingestion & Merge
    print("\n[STEP 1/5] Ingesting and Merging MovieLens & TMDB 5000...")
    loader = MovieDataLoader()
    movies_df, ratings_df = loader.process_and_merge()

    # 2. Data Validation
    print("\n[STEP 2/5] Auditing Data Quality & Checking Sparsity...")
    validator = DataQualityValidator(movies_df, ratings_df)
    report = validator.validate()
    print(f"    Quality Status: {report['status']} | Matrix Sparsity: {report['sparsity_audit']['matrix_sparsity_percentage']}%")

    # 3. Feature Engineering
    print("\n[STEP 3/5] Computing TF-IDF Vectorizer & ID Mappings...")
    fe = FeatureEngineer()
    fe.fit_transform_content(movies_df)
    fe.build_id_mappings(ratings_df, movies_df)

    # 4. Model Training
    print("\n[STEP 4/5] Training Recommendation Models...")
    
    # 4a. Item-Based CF
    print("\n--- Training Item-Based Collaborative Filtering ---")
    item_cf = ItemBasedCFModel()
    item_cf.train_and_save()
    
    # 4b. SVD Matrix Factorization
    print("\n--- Training SVD Matrix Factorization ---")
    svd = SVDModel(n_factors=50, n_epochs=20)
    svd_metrics = svd.train()
    
    # 4c. Neural Collaborative Filtering (PyTorch)
    print("\n--- Training PyTorch Neural CF (NeuMF) ---")
    ncf = NeuralCFModel(epochs=6, batch_size=256)
    ncf_metrics = ncf.train()

    # 5. Offline Model Evaluation
    print("\n[STEP 5/5] Benchmarking Models on Test Split (RMSE, MAE, P@K, R@K, F1, Coverage)...")
    evaluator = ModelEvaluator(k=10)
    eval_results = evaluator.run_full_evaluation(num_test_users=40)

    total_time = time.time() - start_time
    print("\n" + "=" * 70)
    print(f">> PIPELINE COMPLETED SUCCESSFULLY in {total_time:.2f}s!")
    print("=" * 70)

if __name__ == "__main__":
    main()
