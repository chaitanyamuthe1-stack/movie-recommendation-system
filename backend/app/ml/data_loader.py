"""
Data Loader and Dataset Unification Module
Loads MovieLens 100K and TMDB 5000 datasets, merges them on TMDB ID,
parses nested JSON metadata (genres, cast, crew, keywords), and creates
a clean, validated dataset for machine learning models.
"""

import os
import ast
import json
import logging
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "data")

def safe_parse_json(val):
    """Safely parse JSON-like string or list into a Python object."""
    if isinstance(val, (list, dict)):
        return val
    if pd.isna(val) or not isinstance(val, str) or not val.strip():
        return []
    try:
        return json.loads(val)
    except Exception:
        try:
            return ast.literal_eval(val)
        except Exception:
            return []

def extract_names(items, limit=None):
    """Extract 'name' attribute from a list of dicts."""
    parsed = safe_parse_json(items)
    if isinstance(parsed, list):
        names = [item.get("name", "") for item in parsed if isinstance(item, dict) and "name" in item]
        return names[:limit] if limit else names
    return []

def extract_director(crew_items):
    """Extract the Director's name from crew list."""
    parsed = safe_parse_json(crew_items)
    if isinstance(parsed, list):
        for member in parsed:
            if isinstance(member, dict) and member.get("job") == "Director":
                return member.get("name", "Unknown")
    return "Unknown"

def clean_text_feature(text):
    """Normalize and clean string text."""
    if pd.isna(text) or not isinstance(text, str):
        return ""
    return text.strip().lower()

class MovieDataLoader:
    def __init__(self, data_dir: str = DATA_DIR):
        self.data_dir = data_dir
        self.movies_path = os.path.join(data_dir, "movies.csv")
        self.ratings_path = os.path.join(data_dir, "ratings.csv")
        self.links_path = os.path.join(data_dir, "links.csv")
        self.tmdb_path = os.path.join(data_dir, "tmdb_5000_movies.csv")

    def load_raw_data(self):
        """Load raw CSV files."""
        if not os.path.exists(self.ratings_path) or not os.path.exists(self.tmdb_path):
            raise FileNotFoundError(f"Required datasets missing from {self.data_dir}. Run scripts/download_datasets.py first.")
            
        ratings_df = pd.read_csv(self.ratings_path)
        movies_df = pd.read_csv(self.movies_path)
        links_df = pd.read_csv(self.links_path)
        tmdb_df = pd.read_csv(self.tmdb_path)
        return ratings_df, movies_df, links_df, tmdb_df

    def process_and_merge(self):
        """
        Merge MovieLens and TMDB datasets into a unified movie catalog and ratings table.
        """
        ratings_df, ml_movies, links_df, tmdb_df = self.load_raw_data()
        
        # Prepare links: map movieId to tmdbId
        links_df = links_df.dropna(subset=["tmdbId"]).copy()
        links_df["tmdbId"] = links_df["tmdbId"].astype(int)
        
        # Merge MovieLens movies with links
        ml_merged = pd.merge(ml_movies, links_df[["movieId", "tmdbId"]], on="movieId", how="inner")
        
        # Prepare TMDB DataFrame
        tmdb_clean = tmdb_df.copy()
        tmdb_clean["id"] = pd.to_numeric(tmdb_clean["id"], errors="coerce").fillna(-1).astype(int)
        tmdb_clean = tmdb_clean[tmdb_clean["id"] > 0].drop_duplicates(subset=["id"])
        
        # Extract structured metadata features
        tmdb_clean["genres_list"] = tmdb_clean["genres"].apply(lambda x: extract_names(x))
        tmdb_clean["keywords_list"] = tmdb_clean["keywords"].apply(lambda x: extract_names(x, limit=10))
        
        if "cast" in tmdb_clean.columns:
            tmdb_clean["cast_list"] = tmdb_clean["cast"].apply(lambda x: extract_names(x, limit=3))
        else:
            tmdb_clean["cast_list"] = [[] for _ in range(len(tmdb_clean))]
            
        if "crew" in tmdb_clean.columns:
            tmdb_clean["director"] = tmdb_clean["crew"].apply(extract_director)
        else:
            tmdb_clean["director"] = "Unknown"
            
        tmdb_clean["overview"] = tmdb_clean["overview"].fillna("")
        tmdb_clean["tagline"] = tmdb_clean["tagline"].fillna("")
        tmdb_clean["vote_average"] = pd.to_numeric(tmdb_clean["vote_average"], errors="coerce").fillna(0.0)
        tmdb_clean["vote_count"] = pd.to_numeric(tmdb_clean["vote_count"], errors="coerce").fillna(0).astype(int)
        tmdb_clean["popularity"] = pd.to_numeric(tmdb_clean["popularity"], errors="coerce").fillna(0.0)
        
        # Extract release year
        def get_year(date_str):
            if pd.isna(date_str) or not isinstance(date_str, str) or len(date_str) < 4:
                return 0
            try:
                return int(date_str[:4])
            except ValueError:
                return 0
                
        tmdb_clean["release_year"] = tmdb_clean["release_date"].apply(get_year)
        
        # Build unified 'tags' feature for Content-Based vectorization
        # Formatted: overview + genres + keywords + cast + director
        def build_tags(row):
            genres_str = " ".join(["".join(g.split()) for g in row["genres_list"]])
            keywords_str = " ".join(["".join(k.split()) for k in row["keywords_list"]])
            cast_str = " ".join(["".join(c.split()) for c in row["cast_list"]])
            director_str = "".join(row["director"].split())
            overview_str = row["overview"]
            return f"{overview_str} {genres_str} {keywords_str} {cast_str} {director_str}".strip().lower()
            
        tmdb_clean["tags"] = tmdb_clean.apply(build_tags, axis=1)
        
        # Merge MovieLens movie IDs with TMDB
        # Use tmdbId as the primary link
        movies_master = pd.merge(
            tmdb_clean,
            ml_merged[["movieId", "tmdbId"]],
            left_on="id",
            right_on="tmdbId",
            how="left"
        )
        
        # Fill missing movieId for TMDB movies not in MovieLens with unique offset
        max_ml_id = ml_movies["movieId"].max() if len(ml_movies) > 0 else 100000
        missing_mask = movies_master["movieId"].isna()
        movies_master.loc[missing_mask, "movieId"] = np.arange(max_ml_id + 1, max_ml_id + 1 + missing_mask.sum())
        movies_master["movieId"] = movies_master["movieId"].astype(int)
        
        # Keep essential columns
        cols = [
            "movieId", "id", "title", "overview", "tagline", "release_date",
            "release_year", "vote_average", "vote_count", "popularity",
            "genres_list", "keywords_list", "cast_list", "director", "tags"
        ]
        movies_master = movies_master[cols].drop_duplicates(subset=["movieId"]).reset_index(drop=True)
        movies_master.rename(columns={"id": "tmdbId"}, inplace=True)
        
        # Filter ratings to only movies that exist in our unified catalog
        valid_movie_ids = set(movies_master["movieId"])
        ratings_clean = ratings_df[ratings_df["movieId"].isin(valid_movie_ids)].copy()
        
        # Save processed files
        processed_movies_path = os.path.join(self.data_dir, "processed_movies.csv")
        processed_ratings_path = os.path.join(self.data_dir, "processed_ratings.csv")
        
        movies_export = movies_master.copy()
        movies_export["genres_str"] = movies_export["genres_list"].apply(lambda x: "|".join(x))
        movies_export["cast_str"] = movies_export["cast_list"].apply(lambda x: "|".join(x))
        movies_export["keywords_str"] = movies_export["keywords_list"].apply(lambda x: "|".join(x))
        
        movies_export.to_csv(processed_movies_path, index=False)
        ratings_clean.to_csv(processed_ratings_path, index=False)
        
        print(f">>> Unified catalog created: {len(movies_master):,} movies, {len(ratings_clean):,} ratings.")
        return movies_master, ratings_clean

if __name__ == "__main__":
    loader = MovieDataLoader()
    loader.process_and_merge()
