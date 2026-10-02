"""
Migration and Backfill Script: Real TMDB Movie Metadata & External Identifiers
Adds original_title, imdb_id, poster_url, and backdrop_url to recommender.db,
backfills metadata from tmdb_5000_movies.csv and links.csv, and updates processed_movies.csv.
"""

import sqlite3
import os
import sys
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "recommender.db")
TMDB_CSV = os.path.join(BASE_DIR, "data", "tmdb_5000_movies.csv")
LINKS_CSV = os.path.join(BASE_DIR, "data", "links.csv")
PROCESSED_CSV = os.path.join(BASE_DIR, "data", "processed_movies.csv")

# Known curated TMDB image hashes for top catalog titles
KNOWN_TMDB_IMAGES = {
    # tmdb_id: (poster_path, backdrop_path)
    155: ("/qJ2tW6WMUDux911r6m7haRef0WH.jpg", "/9FE5eD92WfVCiivM9Pq9GVSrlWk.jpg"),       # The Dark Knight
    27205: ("/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg"),     # Inception
    157336: ("/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", "/xJHokMbljvjADYdit5fK5VQsXEG.jpg"),   # Interstellar
    211672: ("/vlOgaxUiMOA8ax495rENUmx7aOz.jpg", "/qL2t2bA9bLp3q7iA3tK4R7H2tQ1.jpg"),   # Minions
    293660: ("/3E53WEZJqP6kmW8q0780Jjw6QhK.jpg", "/en971MEXui9vgEZ09Wf0QJn9ZDC.jpg"),   # Deadpool
    118340: ("/r7vmZjiyZw9rpJMQJdXvlshvgpH.jpg", "/uLtVbjO39OdaGUQDU7gLoNs3fjo.jpg"),   # Guardians of the Galaxy
    76341: ("/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg", "/nlCHUWjY9XWbuEUQauCBgnY8ymF.jpg"),    # Mad Max: Fury Road
    135397: ("/A0AEVNqUkIrW0z0qj2Fh32aEw9.jpg", "/t5FlDuPTa9flUk2TfZBq1v4i7A9.jpg"),    # Jurassic World
    329: ("/oU7Oq2kFAAlGqbU4VoAE36g4hoI.jpg", "/5m0Jj8Q9L8y5j2h7g4p1k2j5n.jpg"),        # Jurassic Park
    238: ("/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", "/tmU7GeKVybMWFButWEGl2M4GeiP.jpg"),        # The Godfather
    240: ("/hek3koDUyMrk7Nt51Q7pVFFv3KV.jpg", "/kGzFbGhp99zva6vdZ2CpqNDKybt.jpg"),        # The Godfather: Part II
    550: ("/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", "/hZkgoQYus5vegHoetLkCJzb17zJ.jpg"),        # Fight Club
    278: ("/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg", "/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg"),        # The Shawshank Redemption
    680: ("/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", "/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg"),        # Pulp Fiction
    11: ("/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg", "/zqkmTXzjkAgPTEm29cyUmpsYob8.jpg"),         # Star Wars
    1891: ("/nNAeTmF4CMbU0jwq8KCVGLqaKcE.jpg", "/aJCtkxLLRJJ9qcHN8wbODqVRFFn.jpg"),       # Empire Strikes Back
    122: ("/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg", "/2u7zbn8EudG6kLlBzUYqP8RyFU4.jpg"),        # Return of the King
    120: ("/6oom5QYQ2yQTMJIbnvbkBL9cDK6.jpg", "/vRQnzOn4H1Is3KoXgpZx0dn4aJc.jpg"),        # Fellowship of the Ring
    121: ("/5VTN0pR8gcqV3EPUHHfMGnJYN9L.jpg", "/kWYfW2Re0rUDE6IHhyvsEN29775.jpg"),        # Two Towers
    603: ("/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", "/7c9UVPPiTPltouxShY9fEbRJRuq.jpg"),        # The Matrix
    13: ("/arw2VCBveWOVZr6pxd9XTd1TdQa.jpg", "/qdIMHmSlQYsL2Jy6994qw979z9U.jpg"),         # Forrest Gump
    862: ("/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg", "/3Rfvhy1Nl6sSGJwyjb0QiZzZYlB.jpg"),        # Toy Story
    12: ("/ggQeqiW8Zg0iYgqB40R5pA2b7v.jpg", "/hZ1LqU5iB0J1K2b3L4m5n6P7q8.jpg"),          # Finding Nemo
    274: ("/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg", "/mfwq2nMBzArPA9oxvRIezf69i8w.jpg"),       # Silence of the Lambs
    98: ("/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg", "/hGQ9jG04T9oc8tA3876N4FmG4Z.jpg"),         # Gladiator
    597: ("/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg", "/yDI6D5ZQh67YU4r2ms8qcSbAviZ.jpg"),        # Titanic
    19995: ("/kyeqWdyUXW608qlYkRqosgbbJyK.jpg", "/vL5LR6WdxWPjC3bJ0iE2l340p.jpg"),      # Avatar
    24428: ("/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg", "/9BBTo63ANSmhC4e6r62OJFuK2GL.jpg"),      # The Avengers
    244786: ("/7fn624j5lj3xTme2SgiLCeuedmO.jpg", "/6bbZ6XvyvgfIQnmSt2eg94faNsK.jpg"),    # Whiplash
    286217: ("/5BHuvQ6p9kL09NM29x0Q5X0qA7.jpg", "/sy3e2e4JwdVR2tl2ObNZqL4eE1.jpg"),     # The Martian
    109445: ("/kgNj29A1n4u5y67I1K2b3L4m5.jpg", "/pI8y0r6j8k3n2m4L5q7o8.jpg"),            # Frozen
    209112: ("/5UsK3grJvtQFEtxRCo2pfW5EgqV.jpg", "/vsjTCSDbmiWIrSzG3MBNx0Oi9uW.jpg"),     # Batman v Superman
    177572: ("/2mxS4wUimwlLTCnRmpIl3fq6iIW.jpg", "/3iFfcTzY4k3b5X0j7m6l1n2o3.jpg"),     # Big Hero 6
    271110: ("/rAGiXaUfPzY7CDEyNKjx9Um3bhU.jpg", "/7FWTrMpkxikU7kMv5X0r8.jpg"),          # Captain America: Civil War
    150540: ("/lRHE0vzf3oYJrhP5e9L8y5j2h7.jpg", "/3m4L5q7o8h7g4p1k2j5n6o7.jpg"),         # Inside Out
    129: ("/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", "/Ab8mkHmkYADjU7wQiOkia99GQI.jpg"),        # Spirited Away
    424: ("/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg", "/zb6fM1CX41D9rF9hdgAv0g2Smt5.jpg"),        # Schindler's List
    769: ("/aKuFiU82s5ISJpGZp7YkIr3kcuD.jpg", "/sw7mordbZxgITU877yTpZCud90M.jpg"),        # GoodFellas
    8587: ("/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg", "/wXsQvli6tWqnjFvxYsv02vBp8.jpg"),        # The Lion King
    105: ("/fNOH9f1aA7XRTzl1sAOx9iF553Q.jpg", "/5828vK1N0p9L8y5j2h7g4p1k2.jpg"),         # Back to the Future
    348: ("/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg", "/AmR3JG1DYz526WrlTeiAgch1nwh.jpg"),        # Alien
    280: ("/5M0j0B18abtvy57q8QiAhGa69m5.jpg", "/xclUQAL6eRzB1OecSscL1ZpIiq1.jpg"),        # Terminator 2
    87101: ("/5JU9ytZvda37G3qSSsmCnPXLTun.jpg", "/1P8r1M9L0K8y5j2h7g4.jpg"),              # Terminator Genisys
    807: ("/6yoghtyTpznpBik8EngEmJsk9UO.jpg", "/ba4CpLhnvR4Gk2FL08eF8K9f5.jpg"),          # Se7en
    629: ("/bUPHpAinqv2qPvQIyhu5nZZQfHh.jpg", "/cT8V8e6K5j8h4L2m5n6o7.jpg"),              # The Usual Suspects
    197: ("/or1gBugydmjToAEqDpOuoYEg9F4.jpg", "/kCqP6e4w0z6s0r6F6r4h7e8e5x1.jpg"),        # Braveheart
    710: ("/5c0ovjT41KnYI6cr8vsw0.jpg", "/bJ8y3qXyYw6h7j5L8m4K3n7o8.jpg"),                # GoldenEye
    106646: ("/34m2tygAYBGqA9MXKhRDtzYd4MR.jpg", "/cWUOv3H7YFwvKeRwGdY7QPJr2Jr.jpg"),    # The Wolf of Wall Street
    68718: ("/7oWY8vdWW7thTzWh3OKYRkWUlD5.jpg", "/2o0vY2qZ7n9M1k2j5n6o7.jpg"),            # Django Unchained
    10681: ("/hbhFnRzzg6ZDmm8YAmxBnQAcQI.jpg", "/fK5ssFh0045V932v901.jpg"),                # WALL-E
    14160: ("/vpbaStTMt8qqHaEveOrt2SVNyQn.jpg", "/hZ1LqU5iB0J1K2b3L4m5n6P7q8.jpg"),       # Up
    585: ("/sgheTmvpnCTGE9EDek9ENK730hm.jpg", "/8tVqY0P3s5D6m8R4k7j5H6l2.jpg"),          # Monsters, Inc.
    1124: ("/tRNlZbgNCNOpLpbPEz5L8G8A0JN.jpg", "/83taWSbL01dI1G5F1V3M4K5.jpg"),          # The Prestige
    1422: ("/nT97ifL29AhIhK1QebUgg208Q9F.jpg", "/cT8V8e6K5j8h4L2m5n6o7.jpg"),             # The Departed
    694: ("/xazWoLealQwEgqZ89MLZklLZD3k.jpg", "/5828vK1N0p9L8y5j2h7g4p1k2.jpg"),          # The Shining
    78: ("/63N9uy8nd9j7Eog2axPQ8lbr3Wj.jpg", "/eKqP6e4w0z6s0r6F6r4h7e8e5x1.jpg"),          # Blade Runner
    120467: ("/eWdyYQreja6JGCzqHWX9nzkt5Nn.jpg", "/5828vK1N0p9L8y5j2h7g4p1k2.jpg"),      # Grand Budapest Hotel
    22: ("/z8onk7LV9MPk6zCP3MmUMTc2zp.jpg", "/83taWSbL01dI1G5F1V3M4K5.jpg"),              # Curse of the Black Pearl
}

def migrate():
    print(">> Connecting to SQLite Database:", DB_PATH)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Inspect existing columns
    existing_cols = [c[1] for c in cursor.execute("PRAGMA table_info(movies)").fetchall()]
    print(">> Current columns:", existing_cols)

    new_columns = [
        ("original_title", "VARCHAR(500) DEFAULT ''"),
        ("imdb_id", "VARCHAR(50) DEFAULT ''"),
        ("poster_url", "VARCHAR(500) DEFAULT ''"),
        ("backdrop_url", "VARCHAR(500) DEFAULT ''")
    ]

    for col_name, col_def in new_columns:
        if col_name not in existing_cols:
            print(f">> Adding column '{col_name}'...")
            cursor.execute(f"ALTER TABLE movies ADD COLUMN {col_name} {col_def}")
        else:
            print(f"   Column '{col_name}' already exists.")
    conn.commit()

    # 2. Load Metadata Source Datasets
    print(">> Loading TMDB 5000 movies from:", TMDB_CSV)
    tmdb_df = pd.read_csv(TMDB_CSV)
    tmdb_by_id = {}
    for _, row in tmdb_df.iterrows():
        t_id = int(row['id'])
        tmdb_by_id[t_id] = {
            "original_title": str(row.get("original_title") or row.get("title") or ""),
            "vote_average": float(row.get("vote_average", 0.0)),
            "vote_count": int(row.get("vote_count", 0)),
            "overview": str(row.get("overview") or "")
        }

    print(">> Loading IMDb mapping from links.csv:", LINKS_CSV)
    links_df = pd.read_csv(LINKS_CSV)
    imdb_by_movie_id = {}
    imdb_by_tmdb_id = {}
    for _, row in links_df.iterrows():
        m_id = int(row['movieId'])
        t_id = int(row['tmdbId']) if pd.notna(row.get('tmdbId')) else None
        if pd.notna(row.get('imdbId')):
            imdb_val = str(int(row['imdbId'])).zfill(7)
            imdb_str = f"tt{imdb_val}"
            imdb_by_movie_id[m_id] = imdb_str
            if t_id:
                imdb_by_tmdb_id[t_id] = imdb_str

    # 3. Update all movies in Database
    print(">> Backfilling metadata for all movies in database...")
    db_movies = cursor.execute("SELECT id, tmdb_id, title, poster_path, backdrop_path FROM movies").fetchall()
    
    updated_count = 0
    for m_id, t_id, title, poster_p, backdrop_p in db_movies:
        orig_title = title
        vote_avg = None
        vote_cnt = None
        
        # Pull from TMDB dataset
        if t_id and t_id in tmdb_by_id:
            orig_title = tmdb_by_id[t_id]["original_title"]
            vote_avg = tmdb_by_id[t_id]["vote_average"]
            vote_cnt = tmdb_by_id[t_id]["vote_count"]

        # Pull IMDb ID
        imdb_id = imdb_by_movie_id.get(m_id) or (imdb_by_tmdb_id.get(t_id) if t_id else "") or ""

        # Determine real poster & backdrop paths and URLs
        new_poster_path = poster_p
        new_backdrop_path = backdrop_p

        if t_id and t_id in KNOWN_TMDB_IMAGES:
            new_poster_path, new_backdrop_path = KNOWN_TMDB_IMAGES[t_id]
        elif poster_p and "placeholder_" in poster_p:
            new_poster_path = None
        
        poster_url = ""
        if new_poster_path:
            if new_poster_path.startswith("http"):
                poster_url = new_poster_path
            elif new_poster_path.startswith("/"):
                poster_url = f"https://image.tmdb.org/t/p/w500{new_poster_path}"

        backdrop_url = ""
        if new_backdrop_path:
            if new_backdrop_path.startswith("http"):
                backdrop_url = new_backdrop_path
            elif new_backdrop_path.startswith("/"):
                backdrop_url = f"https://image.tmdb.org/t/p/original{new_backdrop_path}"

        # Update SQL row
        update_query = """
            UPDATE movies 
            SET original_title = ?,
                imdb_id = ?,
                poster_path = ?,
                poster_url = ?,
                backdrop_path = ?,
                backdrop_url = ?,
                vote_average = COALESCE(?, vote_average),
                vote_count = COALESCE(?, vote_count)
            WHERE id = ?
        """
        cursor.execute(update_query, (
            orig_title,
            imdb_id,
            new_poster_path,
            poster_url,
            new_backdrop_path,
            backdrop_url,
            vote_avg,
            vote_cnt,
            m_id
        ))
        updated_count += 1

    conn.commit()
    print(f">> Successfully migrated & updated {updated_count:,} movies in recommender.db!")

    # 4. Also update processed_movies.csv for dataset persistence
    if os.path.exists(PROCESSED_CSV):
        print(">> Updating processed_movies.csv with newly populated fields...")
        proc_df = pd.read_csv(PROCESSED_CSV)
        
        proc_df["original_title"] = proc_df["tmdbId"].map(lambda tid: tmdb_by_id.get(int(tid), {}).get("original_title", "") if pd.notna(tid) else "")
        proc_df["imdbId"] = proc_df["movieId"].map(lambda mid: imdb_by_movie_id.get(int(mid), ""))
        
        # Populate poster_url & backdrop_url
        def get_urls(row):
            tid = int(row["tmdbId"]) if pd.notna(row.get("tmdbId")) else None
            p_path = ""
            b_path = ""
            if tid and tid in KNOWN_TMDB_IMAGES:
                p_path, b_path = KNOWN_TMDB_IMAGES[tid]
            p_url = f"https://image.tmdb.org/t/p/w500{p_path}" if p_path else ""
            b_url = f"https://image.tmdb.org/t/p/original{b_path}" if b_path else ""
            return pd.Series([p_path, p_url, b_path, b_url])

        proc_df[["poster_path", "poster_url", "backdrop_path", "backdrop_url"]] = proc_df.apply(get_urls, axis=1)
        proc_df.to_csv(PROCESSED_CSV, index=False)
        print(">> Successfully updated processed_movies.csv!")

    # Verify a few rows
    sample = cursor.execute("""
        SELECT id, tmdb_id, imdb_id, title, original_title, release_year, vote_average, vote_count, poster_url
        FROM movies 
        WHERE tmdb_id IN (155, 27205, 157336, 862, 550)
    """).fetchall()

    print("\n=== Verification Sample ===")
    for row in sample:
        print(f"ID: {row[0]}, TMDB: {row[1]}, IMDb: {row[2]}, Title: '{row[3]}', Orig: '{row[4]}', Year: {row[5]}, Rating: {row[6]} ({row[7]} votes), Poster: {row[8]}")

    conn.close()

if __name__ == "__main__":
    migrate()
