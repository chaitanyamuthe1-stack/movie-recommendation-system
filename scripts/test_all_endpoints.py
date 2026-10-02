import urllib.request
import json

def fetch_json(url, method="GET", data=None):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8") if data else None,
        headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
    )
    req.method = method
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))

print("1. Testing GET /api/movies...")
status, movies = fetch_json("http://127.0.0.1:8000/api/movies?page=1&size=3")
print(f"Status: {status}, Total movies in catalog: {movies.get('total')}")
for m in movies.get("items", []):
    print(f"   [{m['id']}] {m['title']} | poster_url: {m.get('poster_url')}")

print("\n2. Testing GET /api/movies/search?q=interstellar...")
status, search_res = fetch_json("http://127.0.0.1:8000/api/movies/search?q=interstellar&limit=2")
print(f"Status: {status}, Found {len(search_res)} results:")
for m in search_res:
    print(f"   [{m['id']}] {m['title']} | poster_url: {m.get('poster_url')}")

print("\n3. Testing GET /api/movies/79132 (Inception)...")
status, detail = fetch_json("http://127.0.0.1:8000/api/movies/79132")
print(f"Status: {status}, Title: {detail['title']}, Director: {detail.get('director')}")
print(f"   backdrop_url: {detail.get('backdrop_url')}")
print(f"   similar movies: {[sm['title'] for sm in detail.get('similar_movies', [])]}")

print("\n4. Testing POST /api/assistant/chat...")
status, chat_res = fetch_json("http://127.0.0.1:8000/api/assistant/chat", method="POST", data={
    "query": "I want a dark sci-fi thriller with mind bending twists",
    "top_n": 3
})
print(f"Status: {status}")
print(f"Reply: {chat_res.get('reply')}")
for rec in chat_res.get("recommendations", []):
    print(f"   Grounded pick: [{rec['movie_id']}] {rec['title']} | poster_url: {rec.get('poster_url')}")

print("\n5. Testing POST /api/ratings (User 1 rating movie 79132 with 5 stars)...")
status, rating_res = fetch_json("http://127.0.0.1:8000/api/ratings", method="POST", data={
    "user_id": 1,
    "movie_id": 79132,
    "rating": 5.0
})
print(f"Status: {status}, Submitted: {rating_res}")

print("\n6. Testing GET /api/users/1/profile...")
status, prof = fetch_json("http://127.0.0.1:8000/api/users/1/profile")
print(f"Status: {status}, User: {prof['user']['username']}, Total Ratings: {prof['rating_count']}, Avg: {prof['average_rating']}")
print(f"Top Genres: {[g['genre'] + ' (' + str(g['percentage']) + '%)' for g in prof['top_genres']]}")

print("\n7. Testing POST /api/users/999/onboarding...")
status, onb = fetch_json("http://127.0.0.1:8000/api/users/999/onboarding", method="POST", data={
    "favorite_genres": ["Action", "Science Fiction"],
    "favorite_movie_ids": [79132, 109487, 58559]
})
print(f"Status: {status}, Onboarding Result: {onb}")

print("\n8. Testing recommendations for User 999 after onboarding...")
status, user999_recs = fetch_json("http://127.0.0.1:8000/api/recommendations/999?strategy=hybrid&limit=3")
print(f"Status: {status}, Recommended for User 999:")
for r in user999_recs.get("items", []):
    print(f"   [{r['movie_id']}] {r['title']} ({r['release_year']}) - Model: {r['model']}")

print("\nALL ENDPOINT TESTS COMPLETED SUCCESSFULLY!")
