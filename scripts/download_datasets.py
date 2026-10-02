"""
Dataset Downloader and Preprocessor
Downloads MovieLens 100K (ml-latest-small) and TMDB 5000 datasets.
Saves clean processed CSV/Parquet files to the data/ directory.
"""

import os
import io
import ssl
import json
import zipfile
import urllib.request
import pandas as pd
import numpy as np

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
os.makedirs(DATA_DIR, exist_ok=True)

# Unverified SSL context in case local Windows certificates lack root CA
ssl_context = ssl._create_unverified_context()

def download_movielens():
    print(">>> [1/2] Downloading MovieLens ml-latest-small...")
    ml_url = "https://files.grouplens.org/datasets/movielens/ml-latest-small.zip"
    req = urllib.request.Request(ml_url, headers={"User-Agent": "Mozilla/5.0"})
    
    with urllib.request.urlopen(req, context=ssl_context) as response:
        zip_data = response.read()
        
    with zipfile.ZipFile(io.BytesIO(zip_data)) as z:
        for filename in ["movies.csv", "ratings.csv", "links.csv"]:
            dest_path = os.path.join(DATA_DIR, filename)
            with z.open(f"ml-latest-small/{filename}") as src, open(dest_path, "wb") as dst:
                dst.write(src.read())
            print(f"    Saved {filename} to {dest_path}")
            
    # Verify
    ratings = pd.read_csv(os.path.join(DATA_DIR, "ratings.csv"))
    movies = pd.read_csv(os.path.join(DATA_DIR, "movies.csv"))
    links = pd.read_csv(os.path.join(DATA_DIR, "links.csv"))
    print(f"    MovieLens summary: {len(ratings):,} ratings across {ratings['userId'].nunique():,} users and {len(movies):,} movies.")

def download_tmdb():
    print(">>> [2/2] Downloading TMDB 5000 dataset...")
    tmdb_parquet_path = os.path.join(DATA_DIR, "tmdb_5000.parquet")
    tmdb_csv_path = os.path.join(DATA_DIR, "tmdb_5000_movies.csv")
    
    # Try Hugging Face full 22-column parquet first
    hf_url = "https://huggingface.co/datasets/AiresPucrs/tmdb-5000-movies/resolve/main/data/train-00000-of-00001-6db04ab1c75d6817.parquet"
    try:
        print("    Fetching TMDB parquet from Hugging Face...")
        req = urllib.request.Request(hf_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, context=ssl_context) as resp:
            data = resp.read()
        df = pd.read_parquet(io.BytesIO(data))
        df.to_parquet(tmdb_parquet_path)
        df.to_csv(tmdb_csv_path, index=False)
        print(f"    Saved TMDB dataset ({len(df):,} movies, {len(df.columns)} columns) to {tmdb_csv_path}")
        return df
    except Exception as e:
        print(f"    Hugging Face parquet fetch failed ({e}). Trying fallback...")
        fallback_url = "https://raw.githubusercontent.com/fenago/datasets/refs/heads/main/tmdb_5000_movies.csv"
        req = urllib.request.Request(fallback_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, context=ssl_context) as resp:
            df = pd.read_csv(resp)
        df.to_csv(tmdb_csv_path, index=False)
        print(f"    Saved fallback TMDB dataset ({len(df):,} movies) to {tmdb_csv_path}")
        return df

if __name__ == "__main__":
    download_movielens()
    download_tmdb()
    print(">>> Data download complete!")
