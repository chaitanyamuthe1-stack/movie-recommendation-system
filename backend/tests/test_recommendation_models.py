"""
Test Suite for Recommendation Engine Algorithms
Covers Content-Based, Item CF, SVD, Neural CF, Cold-Start, MMR Ranking, and Explanations.
"""

import pytest
import numpy as np
from backend.app.recommendation.engine import RecommendationEngine

@pytest.fixture(scope="session")
def engine():
    inst = RecommendationEngine.get_instance()
    inst.initialize()
    return inst

def test_engine_singleton(engine):
    assert engine is not None
    assert engine.is_initialized is True
    engine2 = RecommendationEngine.get_instance()
    assert engine is engine2

def test_content_based_similarity(engine):
    model = engine.content_model
    assert model is not None
    # Recommend similar movies for movie ID 1 (Toy Story)
    sims = model.recommend_by_movie_id(movie_id=1, top_n=5)
    assert isinstance(sims, list)
    assert len(sims) > 0
    assert all("movie_id" in item and "similarity_score" in item for item in sims)
    for s in sims:
        assert 0.0 <= s["similarity_score"] <= 1.0

def test_item_collaborative(engine):
    model = engine.collaborative_model
    assert model is not None
    user_ratings = {1: 5.0, 50: 4.5, 260: 5.0}
    recs = model.recommend_for_user(user_ratings, top_n=5)
    assert isinstance(recs, list)
    assert len(recs) <= 5

def test_svd_predictions(engine):
    model = engine.svd_model
    assert model is not None
    score = model.predict(user_id=1, movie_id=1)
    assert isinstance(score, float)
    assert 0.5 <= score <= 5.0
    
    # Vectorized batch predict
    movie_ids = [1, 2, 3, 50, 100]
    preds = model.predict_batch_for_user(user_id=1, candidate_movie_ids=movie_ids)
    assert len(preds) == len(movie_ids)
    for p in preds:
        assert 0.5 <= p <= 5.0

def test_neural_cf_inference(engine):
    model = engine.neural_cf_model
    assert model is not None
    score = model.predict(user_id=1, movie_id=1)
    assert isinstance(score, float)
    assert 0.5 <= score <= 5.0
    
    # Vectorized batch predict
    movie_ids = [1, 2, 3, 50, 100]
    preds = model.predict_batch_for_user(user_id=1, candidate_movie_ids=movie_ids)
    assert len(preds) == len(movie_ids)
    for p in preds:
        assert 0.5 <= p <= 5.0

def test_cold_start_recommendations(engine):
    model = engine.cold_start_model
    assert model is not None
    recs = model.recommend_popular(top_n=10)
    assert len(recs) == 10
    assert all("predicted_score" in r and "movie_id" in r for r in recs)
    
    # Filtered by genre
    sci_fi_recs = model.recommend_popular(top_n=5, genre="Science Fiction")
    assert len(sci_fi_recs) <= 5

def test_explainable_ai(engine):
    explainer = engine.explanation_engine
    assert explainer is not None
    exp = explainer.explain_recommendation(candidate_movie_id=260, seed_movie_id=1196, model_name="hybrid", predicted_score=4.8)
    assert exp is not None
    assert "headline" in exp
    assert "reasons" in exp
    assert "confidence_score" in exp
    assert 0.0 <= exp["confidence_score"] <= 1.0
