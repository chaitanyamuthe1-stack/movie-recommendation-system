import sqlite3
import urllib.request
import json

TMDB_KEY = "8265bd1679663a7ea12ac168da84d2e8"

conn = sqlite3.connect("recommender.db")
c = conn.cursor()

c.execute("SELECT id, title, tmdb_id FROM movies WHERE poster_path IS NULL OR poster_path = ''")
missing = c.fetchall()
print(f"Found {len(missing)} movies without poster_path")

updated = 0
for movie_id, title, tmdb_id in missing:
    poster_path = None
    backdrop_path = None
    
    # 1. Try TMDB by tmdb_id if available
    if tmdb_id:
        try:
            url = f"https://api.themoviedb.org/3/movie/{tmdb_id}?api_key={TMDB_KEY}"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=4) as resp:
                data = json.loads(resp.read().decode())
                poster_path = data.get("poster_path")
                backdrop_path = data.get("backdrop_path")
        except Exception as e:
            print(f"Error for tmdb_id {tmdb_id}: {e}")

    # 2. Try TMDB search by title if still missing
    if not poster_path:
        try:
            clean_title = urllib.parse.quote(title.split("(")[0].strip())
            url = f"https://api.themoviedb.org/3/search/movie?api_key={TMDB_KEY}&query={clean_title}"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=4) as resp:
                data = json.loads(resp.read().decode())
                results = data.get("results", [])
                if results:
                    poster_path = results[0].get("poster_path")
                    backdrop_path = results[0].get("backdrop_path")
        except Exception as e:
            print(f"Search error for {title}: {e}")

    if poster_path:
        poster_url = f"https://image.tmdb.org/t/p/w500{poster_path}"
        backdrop_url = f"https://image.tmdb.org/t/p/original{backdrop_path}" if backdrop_path else poster_url
        c.execute("""
            UPDATE movies 
            SET poster_path = ?, poster_url = ?, backdrop_path = ?, backdrop_url = ?
            WHERE id = ?
        """, (poster_path, poster_url, backdrop_path or poster_path, backdrop_url, movie_id))
        updated += 1
        print(f"[UPDATED] {title} -> {poster_path}")
    else:
        print(f"[NOT FOUND ON TMDB] {title}")

conn.commit()
print(f"Done! Updated {updated} / {len(missing)} movies.")
c.execute("SELECT COUNT(*) FROM movies WHERE poster_path IS NULL OR poster_path = ''")
print(f"Remaining missing in DB: {c.fetchone()[0]}")
conn.close()
