"""Create a share-safe copy of recommender.db: catalog only, no user data.

Usage: python scripts/make_sample_db.py recommender.db data/sample/recommender_sample.db
Keeps: movies, genres, movie_genres.  Drops all rows from user-related tables.
"""
import os
import shutil
import sqlite3
import sys

src = sys.argv[1] if len(sys.argv) > 1 else "recommender.db"
dst = sys.argv[2] if len(sys.argv) > 2 else "data/sample/recommender_sample.db"
os.makedirs(os.path.dirname(dst), exist_ok=True)
shutil.copyfile(src, dst)

conn = sqlite3.connect(dst)
for table in ("users", "user_preferences", "watch_history", "ratings",
              "recommendation_events"):
    try:
        conn.execute(f"DELETE FROM {table}")
    except sqlite3.OperationalError:
        pass
conn.commit()
conn.execute("VACUUM")
conn.close()
print(f"Sample DB written to {dst} ({os.path.getsize(dst)/1e6:.1f} MB)")
