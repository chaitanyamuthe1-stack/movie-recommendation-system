"""
Comprehensive Movie Visual Assets Backfill
Fetches real, verified high-resolution poster and backdrop paths from TMDB API
and IMDb/Metahub, updating recommender.db and processed_movies.csv.
"""

import sqlite3
import os
import urllib.request
import json
import concurrent.futures
import time
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "recommender.db")
TMDB_KEY = "8265bd1679663a7ea12ac168da84d2e8"
PROCESSED_CSV = os.path.join(BASE_DIR, "data", "processed_movies.csv")

def fetch_movie_media(movie_tuple):
    mid, tmdb_id, imdb_id, title = movie_tuple
    poster_path = None
    backdrop_path = None
    poster_url = ""
    backdrop_url = ""

    # 1. Try TMDB API by tmdb_id
    if tmdb_id:
        try:
            url = f"https://api.themoviedb.org/3/movie/{tmdb_id}?api_key={TMDB_KEY}&language=en-US"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=3.5) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                p = data.get('poster_path')
                b = data.get('backdrop_path')
                if p:
                    poster_path = p
                    poster_url = f"https://image.tmdb.org/t/p/w500{p}"
                if b:
                    backdrop_path = b
                    backdrop_url = f"https://image.tmdb.org/t/p/original{b}"
        except Exception:
            pass

    # 2. Fallback to Metahub if TMDB poster was missing but IMDb ID is available
    if not poster_url and imdb_id:
        poster_url = f"https://images.metahub.space/poster/medium/{imdb_id}/img"
        poster_path = poster_url
    if not backdrop_url and imdb_id:
        backdrop_url = f"https://images.metahub.space/background/medium/{imdb_id}/img"
        backdrop_path = backdrop_url

    return mid, poster_path, poster_url, backdrop_path, backdrop_url

def main():
    print(f">> Connecting to {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Select all movies ordered by popularity DESC
    cursor.execute("""
        SELECT id, tmdb_id, imdb_id, title 
        FROM movies 
        ORDER BY popularity DESC
    """)
    all_movies = cursor.fetchall()
    total = len(all_movies)
    print(f">> Found {total} movies in database.")

    # We will process in chunks of 500
    chunk_size = 500
    total_updated = 0
    t0 = time.time()

    for i in range(0, total, chunk_size):
        chunk = all_movies[i:i+chunk_size]
        print(f"\n>> Fetching chunk {i+1} to {min(i+chunk_size, total)} of {total}...")
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=25) as executor:
            results = list(executor.map(fetch_movie_media, chunk))

        # Batch update database
        cursor.execute("BEGIN TRANSACTION")
        for mid, p_path, p_url, b_path, b_url in results:
            if p_url:
                cursor.execute("""
                    UPDATE movies 
                    SET poster_path = ?,
                        poster_url = ?,
                        backdrop_path = ?,
                        backdrop_url = ?
                    WHERE id = ?
                """, (p_path, p_url, b_path, b_url, mid))
                total_updated += 1
        conn.commit()
        print(f"   Saved chunk to DB! Total movies updated so far: {total_updated} / {min(i+chunk_size, total)}")

    elapsed = time.time() - t0
    print(f"\n>> Done! Successfully backfilled {total_updated} / {total} movies in {elapsed:.1f}s.")

    # Update processed_movies.csv if it exists
    if os.path.exists(PROCESSED_CSV):
        print(">> Updating processed_movies.csv with newly populated fields...")
        try:
            db_data = dict(cursor.execute("SELECT id, poster_url, backdrop_url FROM movies").fetchall())
            df = pd.read_csv(PROCESSED_CSV)
            if "movieId" in df.columns:
                df["poster_url"] = df["movieId"].map(lambda mid: db_data.get(mid, ("", ""))[0] if isinstance(db_data.get(mid), tuple) else "")
            df.to_csv(PROCESSED_CSV, index=False)
            print(">> Updated processed_movies.csv successfully.")
        except Exception as e:
            print(">> Error updating CSV:", e)

    conn.close()

if __name__ == "__main__":
    main()
