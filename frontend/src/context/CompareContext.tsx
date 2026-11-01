import React, { createContext, useContext, useState, useCallback } from 'react';
import { Movie } from '../types';

interface CompareContextType {
  selectedMovies: Movie[];
  addMovie: (movie: Movie) => boolean; // returns true if added, false if already at limit
  removeMovie: (movieId: number) => void;
  toggleMovie: (movie: Movie) => void;
  isComparing: (movieId: number) => boolean;
  clearCompare: () => void;
  totalCount: number;
}

const CompareContext = createContext<CompareContextType>({
  selectedMovies: [],
  addMovie: () => false,
  removeMovie: () => {},
  toggleMovie: () => {},
  isComparing: () => false,
  clearCompare: () => {},
  totalCount: 0,
});

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedMovies, setSelectedMovies] = useState<Movie[]>([]);

  const isComparing = useCallback(
    (movieId: number) => selectedMovies.some((m) => (m.id || (m as any).movie_id) === movieId),
    [selectedMovies]
  );

  const addMovie = useCallback((movie: Movie): boolean => {
    const movieId = movie.id || (movie as any).movie_id;
    let added = false;
    setSelectedMovies((prev) => {
      if (prev.some((m) => (m.id || (m as any).movie_id) === movieId)) return prev;
      if (prev.length >= 4) return prev; // max 4
      added = true;
      return [...prev, movie];
    });
    return added;
  }, []);

  const removeMovie = useCallback((movieId: number) => {
    setSelectedMovies((prev) => prev.filter((m) => (m.id || (m as any).movie_id) !== movieId));
  }, []);

  const toggleMovie = useCallback((movie: Movie) => {
    const movieId = movie.id || (movie as any).movie_id;
    setSelectedMovies((prev) => {
      if (prev.some((m) => (m.id || (m as any).movie_id) === movieId)) {
        return prev.filter((m) => (m.id || (m as any).movie_id) !== movieId);
      }
      if (prev.length >= 4) return prev;
      return [...prev, movie];
    });
  }, []);

  const clearCompare = useCallback(() => {
    setSelectedMovies([]);
  }, []);

  return (
    <CompareContext.Provider
      value={{
        selectedMovies,
        addMovie,
        removeMovie,
        toggleMovie,
        isComparing,
        clearCompare,
        totalCount: selectedMovies.length,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => useContext(CompareContext);

