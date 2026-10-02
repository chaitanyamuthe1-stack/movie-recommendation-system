import urllib.request

url = 'https://images.metahub.space/poster/medium/tt0114709/img'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=5) as resp:
    content = resp.read()
    print('Direct image status:', resp.status, resp.headers.get('content-type'), len(content))

bg_url = 'https://images.metahub.space/background/medium/tt0114709/img'
req2 = urllib.request.Request(bg_url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req2, timeout=5) as resp2:
    bg_content = resp2.read()
    print('Direct background status:', resp2.status, resp2.headers.get('content-type'), len(bg_content))
