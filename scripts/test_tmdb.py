import urllib.request
import json

# Test fetching movie poster from TMDB or other source
movie_test_ids = [
    (11, "Star Wars"),
    (550, "Fight Club"),
    (278, "The Shawshank Redemption"),
    (238, "The Godfather"),
    (155, "The Dark Knight"),
    (13, "Forrest Gump"),
    (862, "Toy Story"),
    (12, "Finding Nemo")
]

# We can check TMDB or Wikipedia API or OMDb or duckduckgo / web
api_key = "15d2de7784260fa97e42d1e2a508824a"
found = {}
for tmdb_id, title in movie_test_ids:
    try:
        url = f"https://api.themoviedb.org/3/movie/{tmdb_id}?api_key={api_key}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=4) as res:
            d = json.loads(res.read().decode())
            poster = d.get('poster_path')
            backdrop = d.get('backdrop_path')
            if poster:
                found[title] = f"https://image.tmdb.org/t/p/w500{poster}"
                print(f"[FOUND] {title} ({tmdb_id}): https://image.tmdb.org/t/p/w500{poster}")
    except Exception as e:
        print(f"[ERR] {title}: {e}")

print("Total found:", len(found))
