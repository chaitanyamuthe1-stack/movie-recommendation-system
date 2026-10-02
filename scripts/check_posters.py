import pandas as pd

try:
    df_p = pd.read_parquet('data/tmdb_5000.parquet')
    print("Parquet columns:", df_p.columns.tolist())
    for col in ['poster_path', 'backdrop_path', 'poster', 'image']:
        if col in df_p.columns:
            print(f"Parquet {col} sample:", df_p[col].dropna().head(3).tolist())
except Exception as e:
    print("Parquet err:", e)

try:
    df_c = pd.read_csv('data/tmdb_5000_movies.csv', nrows=5)
    print("CSV columns:", df_c.columns.tolist())
    for col in ['poster_path', 'backdrop_path', 'poster', 'image']:
        if col in df_c.columns:
            print(f"CSV {col} sample:", df_c[col].dropna().head(3).tolist())
except Exception as e:
    print("CSV err:", e)
