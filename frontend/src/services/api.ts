/**
 * API Service Client
 * Connects frontend to the FastAPI recommendation backend.
 */

import {
  Movie,
  RecommendationResponse,
  Genre,
  UserProfile,
  UserRating,
  ModelMetrics,
  AssistantQueryResponse,
  ExplanationResponse
} from "../types";

const API_BASE = "http://127.0.0.1:8000/api";

export const api = {
  // Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Movies
  async getMovies(page = 1, size = 20, genre?: string, sort_by = "popularity"): Promise<{ items: Movie[]; total: number; pages: number }> {
    let url = `${API_BASE}/movies?page=${page}&size=${size}&sort_by=${sort_by}`;
    if (genre) url += `&genre=${encodeURIComponent(genre)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch movies");
    return res.json();
  },

  async getMovieDetails(movieId: number, userId?: number): Promise<Movie> {
    const res = await fetch(`${API_BASE}/movies/${movieId}`);
    if (!res.ok) throw new Error("Failed to fetch movie details");
    return res.json();
  },

  async searchMovies(query: string, limit = 20, genre?: string): Promise<Movie[]> {
    let url = `${API_BASE}/movies/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    if (genre) url += `&genre=${encodeURIComponent(genre)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Search failed");
    return res.json();
  },

  async getTrending(limit = 15, genre?: string): Promise<Movie[]> {
    let url = `${API_BASE}/movies/trending?limit=${limit}`;
    if (genre) url += `&genre=${encodeURIComponent(genre)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch trending");
    return res.json();
  },

  async getGenres(): Promise<Genre[]> {
    const res = await fetch(`${API_BASE}/movies/genres`);
    if (!res.ok) throw new Error("Failed to fetch genres");
    return res.json();
  },

  // Recommendations
  async getUserRecommendations(userId: number, strategy = "hybrid", limit = 15): Promise<RecommendationResponse> {
    const res = await fetch(`${API_BASE}/recommendations/${userId}?strategy=${strategy}&limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch recommendations");
    return res.json();
  },

  async getSimilarMovies(movieId: number, topN = 6): Promise<Movie[]> {
    const res = await fetch(`${API_BASE}/recommendations/movie`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movie_id: movieId, top_n: topN })
    });
    if (!res.ok) throw new Error("Failed to fetch similar movies");
    return res.json();
  },

  async explainMovie(movieId: number, userId?: number): Promise<ExplanationResponse> {
    let url = `${API_BASE}/recommendations/explain/${movieId}`;
    if (userId) url += `?user_id=${userId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch explanation");
    return res.json();
  },

  // Ratings & Profile
  async submitRating(userId: number, movieId: number, rating: number): Promise<any> {
    const res = await fetch(`${API_BASE}/ratings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, movie_id: movieId, rating: rating })
    });
    if (!res.ok) {
      // In guest/demo mode fallback
      return { success: true };
    }
    return res.json();
  },

  async getUserRatings(userId: number): Promise<UserRating[]> {
    const res = await fetch(`${API_BASE}/users/${userId}/ratings`);
    if (!res.ok) return [];
    return res.json();
  },

  async getUserProfile(userId: number): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/users/${userId}/profile`);
    if (!res.ok) throw new Error("Failed to fetch profile");
    return res.json();
  },

  async submitOnboarding(userId: number, favoriteGenres: string[], favoriteMovieIds: number[]): Promise<any> {
    const res = await fetch(`${API_BASE}/users/${userId}/onboarding`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorite_genres: favoriteGenres, favorite_movie_ids: favoriteMovieIds })
    });
    return res.json();
  },

  // AI Assistant
  async queryAssistant(query: string, userId?: number, topN = 4): Promise<AssistantQueryResponse> {
    const res = await fetch(`${API_BASE}/assistant/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, user_id: userId, top_n: topN })
    });
    if (!res.ok) throw new Error("Assistant query failed");
    return res.json();
  },

  // ML Metrics & Admin
  async getModelMetrics(): Promise<ModelMetrics> {
    const res = await fetch(`${API_BASE}/model/metrics`);
    if (!res.ok) throw new Error("Failed to fetch metrics");
    return res.json();
  },

  async getHybridWeights(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/weights`);
    return res.json();
  },

  async updateHybridWeights(weights: any): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/weights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(weights)
    });
    return res.json();
  }
};
