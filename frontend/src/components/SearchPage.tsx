import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Film } from 'lucide-react';
import { Movie, Genre } from '../types';
import { api } from '../services/api';
import { MovieCard } from './MovieCard';

interface SearchPageProps {
  onOpenDetails: (movie: Movie) => void;
  onOpenExplanation: (movie: Movie) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  onOpenDetails,
  onOpenExplanation
}) => {
  const [query, setQuery] = useState('');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('popularity');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    try {
      const gList = await api.getGenres();
      setGenres(gList);
      // Load top movies initially
      const res = await api.getMovies(1, 28, undefined, sortBy);
      setMovies(res.items);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (searchTerm?: string, genreFilter?: string, sortFilter?: string) => {
    const q = searchTerm !== undefined ? searchTerm : query;
    const g = genreFilter !== undefined ? genreFilter : selectedGenre;
    const s = sortFilter !== undefined ? sortFilter : sortBy;
    setLoading(true);

    try {
      if (q.trim()) {
        const results = await api.searchMovies(q, 36, g || undefined);
        // Client-side sort if searching
        if (s === 'vote_average') {
          results.sort((a, b) => b.vote_average - a.vote_average);
        } else if (s === 'release_year') {
          results.sort((a, b) => b.release_year - a.release_year);
        } else if (s === 'title') {
          results.sort((a, b) => a.title.localeCompare(b.title));
        }
        setMovies(results);
      } else {
        const res = await api.getMovies(1, 36, g || undefined, s);
        setMovies(res.items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '30px 24px 80px 24px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '6px' }}>
          Explore & Search Movies
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Intelligent multi-field search across 4,800+ titles, directors, cast members, and plot summaries.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '28px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          flex: 1,
          minWidth: '280px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '14px',
          padding: '12px 18px'
        }}>
          <Search size={20} color="#94a3b8" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              handleSearch(e.target.value, selectedGenre);
            }}
            placeholder="Search by title, director, actor (e.g. Nolan, DiCaprio, Inception)..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#f8fafc',
              fontSize: '0.95rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Genre Selector */}
        <select
          value={selectedGenre}
          onChange={(e) => {
            setSelectedGenre(e.target.value);
            handleSearch(query, e.target.value, sortBy);
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#f8fafc',
            borderRadius: '14px',
            padding: '12px 18px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="" style={{ background: '#0e121c' }}>All Genres</option>
          {genres.map(g => (
            <option key={g.id} value={g.name} style={{ background: '#0e121c' }}>
              {g.name}
            </option>
          ))}
        </select>

        {/* Sort Selector */}
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            handleSearch(query, selectedGenre, e.target.value);
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#f8fafc',
            borderRadius: '14px',
            padding: '12px 18px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="popularity" style={{ background: '#0e121c' }}>Most Popular</option>
          <option value="vote_average" style={{ background: '#0e121c' }}>Highest Rated</option>
          <option value="release_year" style={{ background: '#0e121c' }}>Newest Release</option>
          <option value="title" style={{ background: '#0e121c' }}>Title (A-Z)</option>
        </select>
      </div>

      {/* Results Count */}
      <div style={{ marginBottom: '18px', color: '#94a3b8', fontSize: '0.85rem' }}>
        Found {movies.length} movies
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{ height: '340px', borderRadius: '16px' }} className="skeleton" />
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '24px'
        }}>
          {movies.map(movie => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isGrid={true}
              onOpenDetails={onOpenDetails}
              onOpenExplanation={onOpenExplanation}
            />
          ))}
        </div>
      )}
    </div>
  );
};
