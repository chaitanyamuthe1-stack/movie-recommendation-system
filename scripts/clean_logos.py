import re

with open("frontend/src/utils/moviePosters.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Remove `,?\s*logo:\s*"[^"]*"`
cleaned = re.sub(r',\s*logo:\s*"[^"]*"', '', content)

with open("frontend/src/utils/moviePosters.ts", "w", encoding="utf-8") as f:
    f.write(cleaned)

print("Removed all fragile/broken external logo links from moviePosters.ts")
