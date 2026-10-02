import urllib.request
import json

url = "https://imdb.iamidiotareyoutoo.com/search?q=Inception"
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=4) as res:
        data = json.loads(res.read().decode('utf-8'))
        print("FM-DB search result:", json.dumps(data, indent=2)[:500])
except Exception as e:
    print("FM-DB Err:", e)
