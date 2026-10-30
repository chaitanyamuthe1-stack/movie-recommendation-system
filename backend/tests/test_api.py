"""
API Integration Tests
Tests endpoints for health, movies, recommendations, explanations, assistant, metrics, and weights.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_get_movies_pagination():
    response = client.get("/api/movies?page=1&size=10")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) == 10

def test_search_movies():
    response = client.get("/api/movies/search?q=Dark%20Knight&limit=5")
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)
    assert len(items) > 0
    assert any("Dark Knight" in m["title"] for m in items)

def test_get_genres():
    response = client.get("/api/movies/genres")
    assert response.status_code == 200
    genres = response.json()
    assert isinstance(genres, list)
    assert len(genres) > 0
    names = [g["name"] for g in genres]
    assert "Action" in names or "Science Fiction" in names or "Drama" in names

def test_user_recommendations_hybrid():
    response = client.get("/api/recommendations/1?strategy=hybrid&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) > 0
    assert data["strategy"] == "hybrid"

def test_user_recommendations_cold_start():
    # User 999 has no ratings in seeded DB
    response = client.get("/api/recommendations/999?strategy=hybrid&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) > 0

def test_movie_explanation():
    response = client.get("/api/recommendations/explain/260?user_id=1")
    assert response.status_code == 200
    exp = response.json()
    assert "headline" in exp
    assert "primary_reason" in exp
    assert "confidence_score" in exp

def test_assistant_chat_query():
    payload = {
        "query": "Recommend sci-fi thrillers like Inception",
        "user_id": 1,
        "top_n": 3
    }
    response = client.post("/api/assistant/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "recommendations" in data
    assert len(data["recommendations"]) > 0

def test_model_metrics():
    response = client.get("/api/model/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert "neural_cf" in data["models"]
    assert "svd" in data["models"]
    assert "hybrid" in data["models"]

def test_admin_weights():
    # Fetch weights
    res = client.get("/api/admin/weights")
    assert res.status_code == 200
    weights = res.json()
    assert "warm_user_weights" in weights
    assert "cold_user_weights" in weights

def test_trending_movies():
    response = client.get("/api/movies/trending?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

@pytest.mark.parametrize("strat", ["hybrid", "svd", "neural_cf", "collaborative", "content_based", "cold_start", "item_cf", "content"])
def test_all_recommendation_strategies(strat):
    response = client.get(f"/api/recommendations/1?strategy={strat}&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) > 0

def test_similar_movies_post():
    payload = {"movie_id": 1, "top_n": 4}
    response = client.post("/api/recommendations/movie", json=payload)
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)
    assert len(items) > 0

def test_submit_rating_and_invalidation():
    payload = {"user_id": 1, "movie_id": 1, "rating": 4.5}
    response = client.post("/api/ratings", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["rating"] == 4.5
    assert data["movie_id"] == 1

def test_user_profile_and_ratings():
    res_prof = client.get("/api/users/1/profile")
    assert res_prof.status_code == 200
    prof = res_prof.json()
    assert "user" in prof
    assert "rating_count" in prof

    res_rat = client.get("/api/users/1/ratings")
    assert res_rat.status_code == 200
    ratings = res_rat.json()
    assert isinstance(ratings, list)
