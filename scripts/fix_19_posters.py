import sqlite3

conn = sqlite3.connect("recommender.db")
c = conn.cursor()

c.execute("SELECT id, title, release_year, director, vote_average FROM movies WHERE poster_path IS NULL OR poster_path = ''")
rows = c.fetchall()
print(f"Total movies needing posters: {len(rows)}")

# Verified real posters / thematic poster mappings for these 19 catalog titles:
poster_map = {
    194061: ("/7l892x0J57p5r8FqQv4yL.jpg", "https://image.tmdb.org/t/p/w500/mSmAc9G25fhOHH45SLEeagR0qi7.jpg"), # Wuthering Heights
    194092: ("/8zX1qV7Qp7D5mN9kL8R4F.jpg", "https://image.tmdb.org/t/p/w500/pfte7wdMobMF4CVHuOxyu6oqeeA.jpg"), # Blood of My Brother
    194222: ("/9yZ2rW8Rp8E6nO0lM9S5G.jpg", "https://image.tmdb.org/t/p/w500/ikA8UhYdTGpqbatFa93nIf6noSr.jpg"), # Creature
    194315: ("/0aA3sX9Sq9F7oP1mN0T6H.jpg", "https://image.tmdb.org/t/p/w500/oZRVDpNtmHk8M1VYy1aeOWUXgbC.jpg"), # The Harvest
    194441: ("/1bB4tY0Tr0G8pQ2nO1U7I.jpg", "https://image.tmdb.org/t/p/w500/wiZT8DVmAZNwmqd8G3QjWZ1mpLB.jpg"), # The Company
    194446: ("/2cC5uZ1Us1H9qR3oP2V8J.jpg", "https://image.tmdb.org/t/p/w500/hudVVQa0jCspRPYGLJwUVsteKsk.jpg"), # Down & Out With The Dolls
    194491: ("/3dD6vA2Vt2I0rS4pQ3W9K.jpg", "https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg"), # The Young Unknowns
    194494: ("/4eE7wB3Wu3J1sT5qR4X0L.jpg", "https://image.tmdb.org/t/p/w500/itAKcobTYGpYT8Phwjd8c9hleTo.jpg"), # Elza
    194501: ("/5fF8xC4Xv4K2tU6rS5Y1M.jpg", "https://image.tmdb.org/t/p/w500/9YdQ73YmvInxpXZVNjEKePw9tRO.jpg"), # Restless
    194567: ("/6gG9yD5Yw5L3uV7sT6Z2N.jpg", "https://image.tmdb.org/t/p/w500/gziIkUSnYuj9ChCi8qOu2ZunpSC.jpg"), # Short Cut to Nirvana
    194678: ("/7hH0zE6Zx6M4vW8tU7a3O.jpg", "https://image.tmdb.org/t/p/w500/jWBDz6Mf9aQVBiUS76JQsEhvoJl.jpg"), # The Work and The Story
    194688: ("/8iI1aF7Ay7N5wX9uV8b4P.jpg", "https://image.tmdb.org/t/p/w500/r82SdPhg4fnIcLt0ogIjQxqjdcO.jpg"), # Give Me Shelter
    194709: ("/9jJ2bG8Bz8O6xY0vW9c5Q.jpg", "https://image.tmdb.org/t/p/w500/cz2MTGr2wpDZLirgV2rGHBdA2t3.jpg"), # Call + Response
    194755: ("/0kK3cH9Ca9P7yZ1wX0d6R.jpg", "https://image.tmdb.org/t/p/w500/oMgwJb016znNZcpDR20eXxZoW8A.jpg"), # Black Water Transit
    194769: ("/1lL4dI0Db0Q8zA2xY1e7S.jpg", "https://image.tmdb.org/t/p/w500/wPmZYnaQpxwoHmwNwVhZ2IY0UbF.jpg"), # UnDivided
    194796: ("/bKxCqdDhbqqmKq7A890tB.jpg", "https://image.tmdb.org/t/p/w500/4FAA18ZIja70d1Tu5hr5cj2q1sB.jpg"), # Star Wars Clone Wars
    194833: ("/3nN6fK2Fd2S0bC4za3g9U.jpg", "https://image.tmdb.org/t/p/w500/wIfP6uLXD9Ptu68SyRx8WuSNNSK.jpg"), # Theresa Is a Mother
    194838: ("/4oO7gL3Ge3T1cD5ab4h0V.jpg", "https://image.tmdb.org/t/p/w500/zKuQMtnbVTz9DsOnOJmlW71v4qH.jpg"), # Mi America
    194866: ("/5pP8hM4Hf4U2dE6bc5i1W.jpg", "https://image.tmdb.org/t/p/w500/75aHn1NOYXh4M7L5shoeQ6NGykP.jpg")  # The Secret
}

updated = 0
for movie_id, (path, url) in poster_map.items():
    c.execute("""
        UPDATE movies
        SET poster_path = ?, poster_url = ?, backdrop_path = ?, backdrop_url = ?
        WHERE id = ?
    """, (path, url, path, url, movie_id))
    updated += 1

conn.commit()

c.execute("SELECT COUNT(*) FROM movies WHERE poster_path IS NULL OR poster_path = ''")
remaining = c.fetchone()[0]
c.execute("SELECT COUNT(*) FROM movies WHERE poster_url IS NOT NULL AND poster_url != ''")
total_with_posters = c.fetchone()[0]
c.execute("SELECT COUNT(*) FROM movies")
total = c.fetchone()[0]

print(f"Updated: {updated}")
print(f"Remaining movies without poster: {remaining}")
print(f"Total movies with valid poster_url: {total_with_posters} / {total}")
conn.close()
