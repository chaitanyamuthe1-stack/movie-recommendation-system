import urllib.parse

def generate_svg_poster(title, genre="Drama", year=1994, director="Christopher Nolan"):
    # Generate clean SVG string
    words = title.split()
    lines = []
    curr = []
    for w in words:
        curr.append(w)
        if len(" ".join(curr)) > 14:
            lines.append(" ".join(curr[:-1]))
            curr = [w]
    if curr:
        lines.append(" ".join(curr))
        
    lines = lines[:3] # max 3 lines
    
    tspan_elements = ""
    start_y = 300 - (len(lines) - 1) * 20
    for i, line in enumerate(lines):
        y = start_y + i * 38
        tspan_elements += f'<text x="200" y="{y}" text-anchor="middle" fill="#ffffff" font-size="28" font-weight="900" letter-spacing="1" font-family="system-ui, -apple-system, sans-serif">{line.upper()}</text>'
    
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="50%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#030712"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#6366f1" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="400" height="600" fill="url(#bg)"/>
      <circle cx="200" cy="300" r="180" fill="url(#glow)"/>
      <rect x="20" y="20" width="360" height="560" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2" rx="12"/>
      <rect x="26" y="26" width="348" height="548" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1" rx="8"/>
      
      <!-- Film Header -->
      <text x="200" y="70" text-anchor="middle" fill="#94a3b8" font-size="12" font-weight="700" letter-spacing="3" font-family="system-ui">★ {genre.upper()} ★</text>
      <text x="200" y="95" text-anchor="middle" fill="#64748b" font-size="11" font-weight="600" letter-spacing="1" font-family="system-ui">{year}</text>

      <!-- Center Title -->
      {tspan_elements}

      <!-- Director -->
      <text x="200" y="470" text-anchor="middle" fill="#94a3b8" font-size="11" font-weight="600" letter-spacing="2" font-family="system-ui">DIRECTED BY</text>
      <text x="200" y="490" text-anchor="middle" fill="#e2e8f0" font-size="13" font-weight="700" letter-spacing="1" font-family="system-ui">{director.upper()}</text>

      <!-- Bottom badge -->
      <line x1="140" y1="520" x2="260" y2="520" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
      <text x="200" y="540" text-anchor="middle" fill="#f59e0b" font-size="11" font-weight="700" letter-spacing="2" font-family="system-ui">★ ★ ★ ★ ★</text>
    </svg>"""
    return "data:image/svg+xml;charset=utf-8," + urllib.parse.quote(svg)

print("Sample SVG length:", len(generate_svg_poster("The Dark Knight", "Action", 2008, "Christopher Nolan")))
