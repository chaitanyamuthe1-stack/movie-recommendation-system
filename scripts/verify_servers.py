import urllib.request
import json
import sys

def check(name, url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as res:
            status = res.status
            body = res.read().decode('utf-8')
            print(f"[PASS] {name} ({url}) -> Status {status}")
            return body
    except Exception as e:
        print(f"[FAIL] {name} ({url}) -> {e}")
        return None

if __name__ == '__main__':
    print("=== Checking Live Servers ===")
    check("FastAPI Health", "http://127.0.0.1:8000/api/health")
    
    trending = check("Trending Movies API", "http://127.0.0.1:8000/api/movies/trending?limit=3")
    if trending:
        movies = json.loads(trending)
        print(f"       Found {len(movies)} trending movies: {[m.get('title') for m in movies]}")
        
    recs = check("Recommendations API (User 1, Hybrid)", "http://127.0.0.1:8000/api/recommendations/1?strategy=hybrid&limit=3")
    if recs:
        rec_data = json.loads(recs)
        print(f"       Found {len(rec_data.get('items', []))} recommendations: {[m.get('title') for m in rec_data.get('items', [])]}")
        
    metrics = check("ML Model Metrics API", "http://127.0.0.1:8000/api/model/metrics")
    if metrics:
        met_data = json.loads(metrics)
        print(f"       Neural CF RMSE: {met_data.get('offline_benchmarks', {}).get('neural_cf', {}).get('rmse')}")
        print(f"       SVD RMSE: {met_data.get('offline_benchmarks', {}).get('svd', {}).get('rmse')}")

    check("Vite React Frontend", "http://127.0.0.1:5173/")
    print("=============================")
