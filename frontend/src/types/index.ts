export interface ExplanationFeature {
  type: string;
  value: string;
}

export interface ExplanationResponse {
  headline: string;
  seed_movie_title?: string;
  primary_reason: string;
  reasons: string[];
  feature_matches: ExplanationFeature[];
  model_signal: string;
  predicted_score: number;
  confidence_score: number;
}

export interface Movie {
  id: number;
  movie_id?: number;
  tmdb_id?: number;
  imdb_id?: string;
  title: string;
  original_title?: string;
  release_year: number;
  vote_average: number;
  vote_count: number;
  popularity: number;
  overview?: string;
  director?: string;
  cast?: string[];
  genres: string[];
  poster_path?: string;
  poster_url?: string;
  backdrop_path?: string;
  backdrop_url?: string;
  logo_path?: string;
  tagline?: string;
  similarity_score?: number;
  predicted_score?: number;
  match_percentage?: number;
  model?: string;
  explanation?: ExplanationResponse;
}

export interface RecommendationResponse {
  user_id: number;
  strategy: string;
  count: number;
  items: Movie[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface UserProfile {
  user: User;
  preferences?: {
    favorite_genres: string[];
    favorite_movie_ids: number[];
    onboarding_completed: boolean;
  };
  rating_count: number;
  average_rating: number;
  top_genres: { genre: string; count: number; percentage: number }[];
  watch_count: number;
}

export interface UserRating {
  id: number;
  user_id: number;
  movie_id: number;
  rating: number;
  movie_title?: string;
  created_at: string;
}

export interface ModelMetrics {
  timestamp: string;
  k: number;
  dataset_info: {
    total_users: number;
    total_movies: number;
    total_ratings: number;
    train_ratings?: number;
    test_ratings?: number;
    sparsity_pct: number;
  };
  models: {
    [key: string]: {
      rmse: number | string;
      mae: number | string;
      "precision@10"?: number;
      "recall@10"?: number;
      "f1@10"?: number;
      catalog_coverage_pct?: number;
      avg_latency_ms?: number;
      evaluated_users_count?: number;
    };
  };
}

export interface AssistantQueryResponse {
  reply: string;
  extracted_preferences: {
    genres: string[];
    moods: string[];
    keywords: string[];
    directors: string[];
    era?: string;
  };
  recommendations: Movie[];
  is_grounded: boolean;
}
