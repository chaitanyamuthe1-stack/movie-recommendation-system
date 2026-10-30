"""Refresh poster/backdrop URLs in frontend/src/utils/moviePosters.ts.

Looks each title up in the local DB first, then falls back to the TMDB API.
The API key is read from the TMDB_API_KEY environment variable (never hardcode it).

Usage (run from the repo root):
    export TMDB_API_KEY=your_key      # PowerShell: $env:TMDB_API_KEY="your_key"
    python scripts/update_curated_assets.py
"""
import json
import os
import re
import sqlite3
import sys
import urllib.parse
import urllib.request

DB_PATH = os.getenv("SQLITE_PATH", "recommender.db")
TS_PATH = "frontend/src/utils/moviePosters.ts"
TMDB_KEY = os.getenv("TMDB_API_KEY", "")

PATTERN = re.compile(
    r'"([^"]+)":\s*\{\s*poster:\s*"[^"]*",\s*backdrop:\s*"[^"]*"'
    r'(?:,\s*logo:\s*"([^"]*)")?\s*\}'
)


def get_verified_assets(cur, title):
    """Return (poster_url, backdrop_url) or (None, None)."""
    cur.execute(
        "SELECT poster_url, backdrop_url FROM movies "
        "WHERE LOWER(title) = ? OR LOWER(title) LIKE ? LIMIT 1",
        (title.lower(), f"{title.lower()}%"),
    )
    row = cur.fetchone()
    if row and row[0] and row[0].startswith("http"):
        return row[0], row[1] or row[0]

    if not TMDB_KEY:
        return None, None
    try:
        q = urllib.parse.quote(title)
        url = f"https://api.themoviedb.org/3/search/movie?api_key={TMDB_KEY}&query={q}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            results = json.loads(resp.read().decode()).get("results", [])
        if results and results[0].get("poster_path"):
            p = results[0]["poster_path"]
            b = results[0].get("backdrop_path")
            poster = f"https://image.tmdb.org/t/p/w500{p}"
            backdrop = f"https://image.tmdb.org/t/p/original{b}" if b else poster
            return poster, backdrop
    except Exception as exc:  # network/API errors should not stop the batch
        print(f"  ! TMDB lookup failed for {title!r}: {exc}", file=sys.stderr)
    return None, None


def main():
    if not TMDB_KEY:
        print("Note: TMDB_API_KEY not set - using local DB only.")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    with open(TS_PATH, "r", encoding="utf-8") as f:
        text = f.read()

    start = text.find("export const CURATED_MOVIE_ASSETS: Record<string, MovieAsset> = {")
    end = text.find("};\n\n/**\n * Normalizes movie title", start)
    if start == -1 or end == -1:
        sys.exit("Could not locate CURATED_MOVIE_ASSETS block in moviePosters.ts")

    block = text[start:end + 2]
    updated = 0

    def replace(match):
        nonlocal updated
        key, logo = match.group(1), match.group(2)
        poster, backdrop = get_verified_assets(cur, key)
        if not poster:
            return match.group(0)
        updated += 1
        logo_part = f',\n    logo: "{logo}"' if logo else ""
        return f'"{key}": {{\n    poster: "{poster}",\n    backdrop: "{backdrop}"{logo_part}\n  }}'

    new_block = PATTERN.sub(replace, block)
    with open(TS_PATH, "w", encoding="utf-8") as f:
        f.write(text[:start] + new_block + text[end + 2:])
    conn.close()
    print(f"Updated {updated} entries in {TS_PATH}")


if __name__ == "__main__":
    main()
