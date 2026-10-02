import sqlite3
import re
import urllib.request
import json

conn = sqlite3.connect("recommender.db")
c = conn.cursor()

with open("frontend/src/utils/moviePosters.ts", "r", encoding="utf-8") as f:
    text = f.read()

# Find CURATED_MOVIE_ASSETS block
start_idx = text.find("export const CURATED_MOVIE_ASSETS: Record<string, MovieAsset> = {")
end_idx = text.find("};\n\n/**\n * Normalizes movie title", start_idx)

curated_block = text[start_idx:end_idx+2]
# Extract all entries
pattern = re.compile(r'\"([^\"]+)\":\s*\{\s*poster:\s*\"[^\"]*\",\s*backdrop:\s*\"[^\"]*\"(?:,\s*logo:\s*\"([^\"]*)\")?\s*\}')

TMDB_KEY = "8265bd1679663a7ea12ac168da84d2e8"

def get_verified_assets(title):
    # Search in DB
    c.execute("SELECT tmdb_id, title, poster_url, backdrop_url FROM movies WHERE LOWER(title) = ? OR LOWER(title) LIKE ? LIMIT 1", (title.lower(), f"{title.lower()}%"))
    row = c.fetchone()
    if row and row[2] and row[2].startswith("http"):
        return row[2], row[3] or row[2]
    
    # Try TMDB search if not in DB
    try:
        clean_title = urllib.parse.quote(title)
        url = f"https://api.themoviedb.org/3/search/movie?api_key={TMDB_KEY}&query={clean_title}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode())
            results = data.get('results', [])
            if results:
                p = results[0].get('poster_path')
                b = results[0].get('backdrop_path')
                if p:
                    p_url = f"https://image.tmdb.org/t/p/w500{p}"
                    b_url = f"https://image.tmdb.org/t/p/original{b}" if b else p_url
                    return p_url, b_url
    except Exception:
        pass
    return None, None

def replace_entry(match):
    key = match.group(1)
    logo = match.group(2)
    p_url, b_url = get_verified_assets(key)
    if not p_url:
        return match.group(0) # Keep original if not found
    
    logo_part = f',\n    logo: "{logo}"' if logo else ''
    return f'"{key}": {{\n    poster: "{p_url}",\n    backdrop: "{b_url}"{logo_part}\n  }}'

new_curated_block = pattern.sub(replace_entry, curated_block)

new_text = text[:start_idx] + new_curated_block + text[end_idx+2:]
with open("frontend/src/utils/moviePosters.ts", "w", encoding="utf-8") as f:
    f.write(new_text)

print("Updated moviePosters.ts successfully!")
