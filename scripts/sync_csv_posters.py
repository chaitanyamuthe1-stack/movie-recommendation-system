import sqlite3
import pandas as pd

conn = sqlite3.connect("recommender.db")
db_posters = {r[0]: (r[1], r[2], r[3], r[4]) for r in conn.execute("SELECT id, poster_path, poster_url, backdrop_path, backdrop_url FROM movies").fetchall()}
conn.close()

df = pd.read_csv("data/processed_movies.csv")
updated = 0
for idx, row in df.iterrows():
    mid = row["movieId"]
    if mid in db_posters:
        p_path, p_url, b_path, b_url = db_posters[mid]
        if pd.isna(row.get("poster_url")) or not row.get("poster_url"):
            df.at[idx, "poster_path"] = p_path
            df.at[idx, "poster_url"] = p_url
            df.at[idx, "backdrop_path"] = b_path
            df.at[idx, "backdrop_url"] = b_url
            updated += 1

if updated > 0:
    df.to_csv("data/processed_movies.csv", index=False)
    print(f"Synced {updated} movie posters to data/processed_movies.csv")
else:
    print("data/processed_movies.csv was already up-to-date!")
