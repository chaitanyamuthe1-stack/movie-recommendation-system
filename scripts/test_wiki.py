import urllib.request
import json
import urllib.parse

titles = [
    "The Dark Knight (film)",
    "Toy Story",
    "Inception",
    "The Godfather",
    "Pulp Fiction",
    "Fight Club",
    "Forrest Gump",
    "The Matrix",
    "Interstellar (film)",
    "Star Wars (film)"
]

headers = {'User-Agent': 'MovieRecApp/1.0 (contact@example.com)'}

for t in titles:
    encoded = urllib.parse.quote(t)
    url = f"https://en.wikipedia.org/w/api.php?action=query&titles={encoded}&prop=pageimages&format=json&pithumbsize=500"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=4) as res:
            data = json.loads(res.read().decode('utf-8'))
            pages = data.get("query", {}).get("pages", {})
            for pid, pdata in pages.items():
                thumb = pdata.get("thumbnail", {}).get("source")
                print(f"[WIKI] {t} -> {thumb}")
    except Exception as e:
        print(f"[ERR] {t}: {e}")
