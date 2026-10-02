import re
import urllib.request
import concurrent.futures

with open("frontend/src/utils/moviePosters.ts", "r", encoding="utf-8") as f:
    content = f.read()

matches = re.findall(r'\"([^\"]+)\":\s*\{\s*poster:\s*\"([^\"]+)\",\s*backdrop:\s*\"([^\"]+)\"', content)

def check_url(title, field, url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=4) as resp:
            if resp.status == 200:
                return None
            return (title, field, url, resp.status)
    except Exception as e:
        return (title, field, url, str(e))

tasks = []
for title, poster, backdrop in matches:
    tasks.append((title, "poster", poster))
    tasks.append((title, "backdrop", backdrop))

print(f"Checking {len(tasks)} posters and backdrops in moviePosters.ts...")
with concurrent.futures.ThreadPoolExecutor(max_workers=15) as executor:
    results = [r for r in executor.map(lambda t: check_url(*t), tasks) if r is not None]

print(f"Broken posters/backdrops: {len(results)}")
for r in results:
    print(r)
