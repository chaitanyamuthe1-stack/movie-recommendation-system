"""
Database Seeding Script
Creates tables, populates movies and ratings from processed datasets,
and seeds initial demo users (Cold-start, Casual, Cinephile, Admin).
"""

import os
import sys
import json
import logging
import pandas as pd
import bcrypt

# Ensure UTF-8 console output
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database import engine, Base, SessionLocal
from backend.app.models.user import User, UserPreference, WatchHistory
from backend.app.models.movie import Movie, Genre, MovieGenre
from backend.app.models.rating import Rating
from backend.app.config import settings

logger = logging.getLogger(__name__)

def hash_password(pwd: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd.encode('utf-8')[:72], salt).decode('utf-8')

def seed_db():
    print(">> Initializing Database Tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        movie_count = db.query(Movie).count()
        if movie_count > 0:
            print(f">> Database already contains {movie_count:,} movies. Skipping bulk seed.")
            return

        movies_path = os.path.join(settings.DATA_DIR, "processed_movies.csv")
        ratings_path = os.path.join(settings.DATA_DIR, "processed_ratings.csv")

        if not os.path.exists(movies_path):
            print(f"ERROR: Processed movies file not found at {movies_path}")
            return

        print(f">> Loading movies from {movies_path}...")
        movies_df = pd.read_csv(movies_path)
        
        # 1. Populate Genres
        print(">> Seeding Genres...")
        genre_cache = {}
        all_genres = set()
        for g_str in movies_df["genres_str"].dropna():
            for g in str(g_str).split("|"):
                g_clean = g.strip()
                if g_clean:
                    all_genres.add(g_clean)

        for g_name in sorted(all_genres):
            g_obj = Genre(name=g_name)
            db.add(g_obj)
            db.flush()
            genre_cache[g_name] = g_obj

        # 2. Populate Movies
        print(f">> Seeding {len(movies_df):,} Movies...")
        for _, row in movies_df.iterrows():
            m_id = int(row["movieId"])
            tmdb_id = int(row["tmdbId"]) if pd.notna(row.get("tmdbId")) else None
            imdb_id = str(row["imdbId"]) if pd.notna(row.get("imdbId")) else ""
            orig_title = str(row["original_title"]) if pd.notna(row.get("original_title")) else str(row["title"])
            poster_url = str(row["poster_url"]) if pd.notna(row.get("poster_url")) else ""
            backdrop_url = str(row["backdrop_url"]) if pd.notna(row.get("backdrop_url")) else ""
            
            movie = Movie(
                id=m_id,
                tmdb_id=tmdb_id,
                imdb_id=imdb_id,
                title=str(row["title"]),
                original_title=orig_title,
                overview=str(row["overview"]) if pd.notna(row.get("overview")) else "",
                tagline=str(row["tagline"]) if pd.notna(row.get("tagline")) else "",
                release_date=str(row["release_date"]) if pd.notna(row.get("release_date")) else "",
                release_year=int(row["release_year"]) if pd.notna(row.get("release_year")) else 0,
                vote_average=float(row["vote_average"]) if pd.notna(row.get("vote_average")) else 0.0,
                vote_count=int(row["vote_count"]) if pd.notna(row.get("vote_count")) else 0,
                popularity=float(row["popularity"]) if pd.notna(row.get("popularity")) else 0.0,
                director=str(row["director"]) if pd.notna(row.get("director")) else "Unknown",
                cast_members=str(row["cast_str"]) if pd.notna(row.get("cast_str")) else "",
                keywords=str(row["keywords_str"]) if pd.notna(row.get("keywords_str")) else "",
                poster_path=str(row["poster_path"]) if pd.notna(row.get("poster_path")) else None,
                poster_url=poster_url,
                backdrop_path=str(row["backdrop_path"]) if pd.notna(row.get("backdrop_path")) else "",
                backdrop_url=backdrop_url,
                tags=str(row["tags"]) if pd.notna(row.get("tags")) else ""
            )

            # Link genres
            if pd.notna(row.get("genres_str")):
                for g_name in str(row["genres_str"]).split("|"):
                    g_clean = g_name.strip()
                    if g_clean in genre_cache:
                        movie.genres.append(genre_cache[g_clean])

            db.add(movie)

        db.commit()
        print(f">> Inserted {len(movies_df):,} movies successfully.")

        # 3. Seed Demo Users
        print(">> Seeding Demo Users...")
        hashed_pwd = hash_password("password123")
        admin_pwd = hash_password("admin123")

        users_to_seed = [
            User(id=1, username="demo_cinephile", email="cinephile@example.com", hashed_password=hashed_pwd, is_admin=False),
            User(id=2, username="demo_casual", email="casual@example.com", hashed_password=hashed_pwd, is_admin=False),
            User(id=999, username="demo_cold_start", email="newuser@example.com", hashed_password=hashed_pwd, is_admin=False),
            User(id=1000, username="admin", email="admin@example.com", hashed_password=admin_pwd, is_admin=True)
        ]

        for u in users_to_seed:
            existing = db.query(User).filter(User.id == u.id).first()
            if not existing:
                db.add(u)
                db.flush()
                # Default preferences
                pref = UserPreference(
                    user_id=u.id,
                    favorite_genres=json.dumps(["Sci-Fi", "Action", "Thriller"]) if u.id != 999 else "[]",
                    onboarding_completed=(u.id != 999)
                )
                db.add(pref)

        db.commit()

        # 4. Seed Ratings from MovieLens for user 1 & 2
        if os.path.exists(ratings_path):
            print(">> Seeding Ratings for Demo Users from MovieLens...")
            ratings_df = pd.read_csv(ratings_path)
            valid_mids = set(movies_df["movieId"])
            
            # User 1 ratings
            u1_ratings = ratings_df[(ratings_df["userId"] == 1) & (ratings_df["movieId"].isin(valid_mids))]
            for _, r in u1_ratings.iterrows():
                db.add(Rating(user_id=1, movie_id=int(r["movieId"]), rating=float(r["rating"])))

            # User 2 ratings
            u2_ratings = ratings_df[(ratings_df["userId"] == 2) & (ratings_df["movieId"].isin(valid_mids))]
            for _, r in u2_ratings.iterrows():
                db.add(Rating(user_id=2, movie_id=int(r["movieId"]), rating=float(r["rating"])))

            db.commit()
            print(f">> Added {len(u1_ratings)} ratings for demo_cinephile and {len(u2_ratings)} for demo_casual.")

        print(">> Database seeding complete!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
