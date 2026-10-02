import urllib.request

url = "https://images.metahub.space/poster/small/tt0114709/img"
try:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    with urllib.request.urlopen(req, timeout=3) as res:
        print("Status:", res.status, "Length:", len(res.read()))
except Exception as e:
    print("Err:", e)
