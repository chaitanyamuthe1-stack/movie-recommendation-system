import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Movie } from '../types';

export interface WatchlistItem {
  movie: Movie;
  addedAt: string;
  watched: boolean;
  userRating?: number;
  collection?: string;
}

interface WatchlistContextType {
  items: WatchlistItem[];
  addToWatchlist: (movie: Movie, collection?: string) => void;
  removeFromWatchlist: (movieId: number) => void;
  isInWatchlist: (movieId: number) => boolean;
  toggleWatchlist: (movie: Movie) => boolean; // returns true if added, false if removed
  toggleWatched: (movieId: number) => void;
  isWatched: (movieId: number) => boolean;
  collections: string[];
  totalCount: number;
}

const WatchlistContext = createContext<WatchlistContextType>({
  items: [],
  addToWatchlist: () => {},
  removeFromWatchlist: () => {},
  isInWatchlist: () => false,
  toggleWatchlist: () => false,
  toggleWatched: () => {},
  isWatched: () => false,
  collections: ['Want to Watch', 'Favorites', 'Weekend Binge'],
  totalCount: 0,
});

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<WatchlistItem[]>(() => {
    try {
      const saved = localStorage.getItem('cineverse_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [collections] = useState<string[]>([
    'Want to Watch',
    'Favorites',
    'Weekend Binge',
    'Sci-Fi Gems',
    'Critically Acclaimed'
  ]);

  useEffect(() => {
    try {
      localStorage.setItem('cineverse_watchlist', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to persist watchlist', e);
    }
  }, [items]);

  const isInWatchlist = useCallback(
    (movieId: number) => items.some((i) => (i.movie.id || (i.movie as any).movie_id) === movieId),
    [items]
  );

  const isWatched = useCallback(
    (movieId: number) => {
      const item = items.find((i) => (i.movie.id || (i.movie as any).movie_id) === movieId);
      return item ? item.watched : false;
    },
    [items]
  );

  const addToWatchlist = useCallback((movie: Movie, collection = 'Want to Watch') => {
    const movieId = movie.id || (movie as any).movie_id;
    setItems((prev) => {
      if (prev.some((i) => (i.movie.id || (i.movie as any).movie_id) === movieId)) return prev;
      return [
        {
          movie,
          addedAt: new Date().toISOString(),
          watched: false,
          collection,
        },
        ...prev,
      ];
    });
  }, []);

  const removeFromWatchlist = useCallback((movieId: number) => {
    setItems((prev) => prev.filter((i) => (i.movie.id || (i.movie as any).movie_id) !== movieId));
  }, []);

  const toggleWatchlist = useCallback(
    (movie: Movie): boolean => {
      const movieId = movie.id || (movie as any).movie_id;
      const exists = items.some((i) => (i.movie.id || (i.movie as any).movie_id) === movieId);
      if (exists) {
        removeFromWatchlist(movieId);
        return false;
      } else {
        addToWatchlist(movie);
        return true;
      }
    },
    [items, addToWatchlist, removeFromWatchlist]
  );

  const toggleWatched = useCallback((movieId: number) => {
    setItems((prev) =>
      prev.map((item) =>
        (item.movie.id || (item.movie as any).movie_id) === movieId
          ? { ...item, watched: !item.watched }
          : item
      )
    );
  }, []);

  return (
    <WatchlistContext.Provider
      value={{
        items,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        toggleWatchlist,
        toggleWatched,
        isWatched,
        collections,
        totalCount: items.length,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => useContext(WatchlistContext);
