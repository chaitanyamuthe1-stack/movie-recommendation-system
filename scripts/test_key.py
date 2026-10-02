import urllib.request
import json

movie_id = 550 # Fight Club
url = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key=8265bd1679663a7ea12ac168da84d2e8&language=en-US"

try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=5) as res:
        data = json.loads(res.read().decode())
        print("SUCCESS! Title:", data.get("title"))
        print("Poster path:", data.get("poster_path"))
        print("Backdrop path:", data.get("backdrop_path"))
        print("Full poster URL:", f"https://image.tmdb.org/t/p/w500{data.get('poster_path')}")
except Exception as e:
    print("Err:", e)
