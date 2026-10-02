import json
import urllib.request

def test_endpoints():
    base = "http://127.0.0.1:8000/api"
    
    # 1. Health
    with urllib.request.urlopen(f"{base}/health") as r:
        data = json.loads(r.read())
        print("[1] Health Check:", data)

    # 2. Movies List
    with urllib.request.urlopen(f"{base}/movies?page=1&size=3") as r:
        data = json.loads(r.read())
        print(f"[2] Movies List: Found {data['total']} movies, returned {len(data['items'])} items.")
        print("    Sample Movie:", data['items'][0]['title'], f"({data['items'][0]['release_year']})")

    # 3. Trending
    with urllib.request.urlopen(f"{base}/movies/trending?limit=3") as r:
        data = json.loads(r.read())
        print(f"[3] Trending: {len(data)} items:")
        for m in data:
            print(f"    - {m['title']} ({m['vote_average']} avg rating)")

    # 4. Hybrid Recommendations for demo user 1
    with urllib.request.urlopen(f"{base}/recommendations/1?strategy=hybrid&limit=3") as r:
        data = json.loads(r.read())
        print(f"[4] Hybrid Recommendations for User 1: {len(data['items'])} items:")
        for rec in data['items']:
            print(f"    - {rec['title']} (Match: {rec['match_percentage']}%, Reason: {rec['explanation']['primary_reason'] if rec['explanation'] else 'N/A'})")

    # 5. Model Metrics
    with urllib.request.urlopen(f"{base}/model/metrics") as r:
        data = json.loads(r.read())
        print("[5] ML Metrics summary:")
        for model_name, metrics in data['models'].items():
            print(f"    - {model_name:15}: P@10={metrics.get('precision@10')}, RMSE={metrics.get('rmse')}, Latency={metrics.get('avg_latency_ms')}ms")

    # 6. Assistant Query
    post_data = json.dumps({"query": "dark psychological thriller with mind-bending mystery", "top_n": 2}).encode("utf-8")
    req = urllib.request.Request(f"{base}/assistant/chat", data=post_data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read())
        print("[6] AI Assistant Grounded Response:")
        print("    Reply:", data['reply'])
        print("    Extracted:", data['extracted_preferences'])
        for m in data['recommendations']:
            print(f"    - Rec: {m['title']} ({m['genres']})")

if __name__ == "__main__":
    test_endpoints()
