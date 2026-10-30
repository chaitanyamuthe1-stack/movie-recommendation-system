import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Sparkles, Clock, X } from 'lucide-react';
import { Movie, Genre } from '../types';
import { api } from '../services/api';
import { MovieCard } from './MovieCard';
import { EmptyState } from './EmptyState';

interface SearchPageProps {
  onOpenDetails: (movie: Movie) => void;
  onOpenExplanation: (movie: Movie) => void;
  onOpenAssistant?: () => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  onOpenDetails,
  onOpenExplanation,
  onOpenAssistant
}) => {
  const [query, setQuery] = useState('');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('popularity');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(['Inception', 'Christopher Nolan', 'Sci-Fi', 'Tarantino']);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadGenres();
    executeSearch('', '', 'popularity');
  }, []);

  const loadGenres = async () => {
    try {
      const gList = await api.getGenres();
      setGenres(gList);
    } catch (e) {
      console.error("Failed to load genres:", e);
    }
  };

  const executeSearch = useCallback(async (searchTerm: string, genreFilter: string, sortFilter: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      if (searchTerm.trim()) {
        const results = await api.searchMovies(searchTerm.trim(), 40, genreFilter || undefined);
        // Sort client side for search results
        if (sortFilter === 'vote_average') {
          results.sort((a, b) => b.vote_average - a.vote_average);
        } else if (sortFilter === 'release_year') {
          results.sort((a, b) => b.release_year - a.release_year);
        } else if (sortFilter === 'title') {
          results.sort((a, b) => a.title.localeCompare(b.title));
        }
        setMovies(results);

        // Add to recent searches if new
        const trimmed = searchTerm.trim();
        setRecentSearches((prev) => {
          const filtered = prev.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
          return [trimmed, ...filtered].slice(0, 6);
        });
      } else {
        const res = await api.getMovies(1, 40, genreFilter || undefined, sortFilter);
        setMovies(res.items || []);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error("Search execution failed:", e);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      executeSearch(val, selectedGenre, sortBy);
    }, 300);
  };

  const handleGenreSelect = (genreName: string) => {
    const nextGenre = selectedGenre === genreName ? '' : genreName;
    setSelectedGenre(nextGenre);
    executeSearch(query, nextGenre, sortBy);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    executeSearch(query, selectedGenre, newSort);
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    executeSearch(term, selectedGenre, sortBy);
  };

  const removeRecent = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    setRecentSearches(prev => prev.filter(s => s !== term));
  };

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '30px 24px 80px 24px' }}>
      <header style={{ marginBottom: '28px' }}>
        <div className="shelf-kicker" style={{ marginBottom: '6px' }}>CATALOG SEARCH & DISCOVERY</div>
        <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 900, marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
          Explore Films
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.96rem', maxWidth: '720px' }}>
          Real-time query engine searching title, cast, directors, and plot summaries across the catalog.
        </p>
      </header>

      {/* Search Input Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          flex: 1,
          minWidth: '280px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--r-md)',
          padding: '12px 18px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          transition: 'border-color 0.2s'
        }}>
          <Search size={20} color="var(--gold)" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search by title, director, cast (e.g. Nolan, DiCaprio, Interstellar)..."
            aria-label="Search movies"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text)',
              fontSize: '0.96rem',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                executeSearch('', selectedGenre, sortBy);
              }}
              style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          aria-label="Sort movies"
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            color: 'var(--text)',
            borderRadius: 'var(--r-md)',
            padding: '12px 18px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            outline: 'none',
            fontFamily: 'inherit'
          }}
        >
          <option value="popularity">Most Popular</option>
          <option value="vote_average">Highest Rated</option>
          <option value="release_year">Newest Release</option>
          <option value="title">Title (A-Z)</option>
        </select>
      </div>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--subtle)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> RECENT:
          </span>
          {recentSearches.map((term) => (
            <button
              key={term}
              onClick={() => handleRecentClick(term)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: 'var(--r-full)',
                background: 'rgba(255, 240, 220, 0.05)',
                border: '1px solid var(--line)',
                color: 'var(--muted)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span>{term}</span>
              <span
                onClick={(e) => removeRecent(e, term)}
                style={{ opacity: 0.6, fontSize: '0.7rem' }}
                title="Remove"
              >
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Genre Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '14px', marginBottom: '24px' }}>
        <button
          onClick={() => handleGenreSelect('')}
          className={`mood-chip ${selectedGenre === '' ? 'active' : ''}`}
          style={{
            background: selectedGenre === '' ? 'var(--gold)' : 'var(--panel)',
            color: selectedGenre === '' ? '#1a0e04' : 'var(--text)',
            borderColor: selectedGenre === '' ? 'var(--gold)' : 'var(--line)'
          }}
        >
          All Genres
        </button>
        {genres.map((g) => (
          <button
            key={g.id}
            onClick={() => handleGenreSelect(g.name)}
            className={`mood-chip ${selectedGenre === g.name ? 'active' : ''}`}
            style={{
              background: selectedGenre === g.name ? 'var(--gold)' : 'var(--panel)',
              color: selectedGenre === g.name ? '#1a0e04' : 'var(--text)',
              borderColor: selectedGenre === g.name ? 'var(--gold)' : 'var(--line)',
              whiteSpace: 'nowrap'
            }}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* Results Count Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
        <span>Showing {movies.length} results</span>
        {selectedGenre && <span style={{ color: 'var(--gold-soft)' }}>Genre: {selectedGenre}</span>}
      </div>

      {/* Movie Results Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '22px' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ height: '340px', borderRadius: 'var(--r-md)' }} className="skeleton" />
          ))}
        </div>
      ) : movies.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: '24px'
        }}>
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isGrid={true}
              onOpenDetails={onOpenDetails}
              onOpenExplanation={onOpenExplanation}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No films match that yet"
          message={`We couldn't find any films matching "${query}". Try searching another keyword or ask our AI assistant for natural language recommendations.`}
          action={
            onOpenAssistant && (
              <button
                className="btn-secondary"
                onClick={onOpenAssistant}
                style={{ borderColor: 'var(--violet)', color: 'var(--violet)', marginTop: '8px' }}
              >
                <Sparkles size={16} />
                <span>Try asking the AI Assistant</span>
              </button>
            )
          }
        />
      )}
    </div>
  );
};
