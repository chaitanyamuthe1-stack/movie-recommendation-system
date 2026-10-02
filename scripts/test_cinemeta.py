import urllib.request
import json

test_imdb_ids = [
    ("tt0114709", "Toy Story"),
    ("tt0137523", "Fight Club"),
    ("tt0111161", "The Shawshank Redemption"),
    ("tt0068646", "The Godfather"),
    ("tt0468569", "The Dark Knight"),
    ("tt0109830", "Forrest Gump"),
    ("tt0076759", "Star Wars"),
    ("tt1375666", "Inception")
]

for imdb_id, title in test_imdb_ids:
    url = f"https://v3-cinemeta.strem.io/meta/movie/{imdb_id}.json"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=4) as res:
            data = json.loads(res.read().decode('utf-8'))
            meta = data.get('meta', {})
            poster = meta.get('poster')
            background = meta.get('background')
            print(f"[OK] {title}: poster = {poster}, bg = {background}")
    except Exception as e:
        print(f"[ERR] {title}: {e}")
