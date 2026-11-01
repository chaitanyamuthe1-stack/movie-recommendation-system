import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Sparkles, Clock, X, SlidersHorizontal, RotateCcw, Star, Calendar } from 'lucide-react';
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
  onOpenAssistant,
}) => {
  const [query, setQuery] = useState('');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('popularity');
  const [minRating, setMinRating] = useState<number>(0);
  const [minYear, setMinYear] = useState<number>(1970);
  const [maxYear, setMaxYear] = useState<number>(2026);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [rawMovies, setRawMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Inception',
    'Christopher Nolan',
    'Sci-Fi',
    'Tarantino',
  ]);

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
      console.error('Failed to load genres:', e);
    }
  };

  const executeSearch = useCallback(
    async (searchTerm: string, genreFilter: string, sortFilter: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      try {
        if (searchTerm.trim()) {
          const results = await api.searchMovies(searchTerm.trim(), 50, genreFilter || undefined);
          setRawMovies(results);

          const trimmed = searchTerm.trim();
          setRecentSearches((prev) => {
            const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
            return [trimmed, ...filtered].slice(0, 6);
          });
        } else {
          const res = await api.getMovies(1, 60, genreFilter || undefined, sortFilter);
          setRawMovies(res.items || []);
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error('Search execution failed:', e);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      executeSearch(val, selectedGenre, sortBy);
    }, 280);
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
    setRecentSearches((prev) => prev.filter((s) => s !== term));
  };

  const resetFilters = () => {
    setMinRating(0);
    setMinYear(1970);
    setMaxYear(2026);
    setSelectedGenre('');
    setSortBy('popularity');
    executeSearch(query, '', 'popularity');
  };

  // Client-side filtering for rating and year range
  const filteredMovies = useMemo(() => {
    return rawMovies.filter((movie) => {
      if (minRating > 0 && movie.vote_average < minRating) return false;
      if (movie.release_year && (movie.release_year < minYear || movie.release_year > maxYear)) {
        return false;
      }
      return true;
    });
  }, [rawMovies, minRating, minYear, maxYear]);

  const activeFiltersCount =
    (selectedGenre ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (minYear > 1970 || maxYear < 2026 ? 1 : 0);

  return (
    <div className="cv-view-container search-view-page">
      {/* Header */}
      <header className="view-header">
        <div className="view-header-left">
          <div className="view-kicker">
            <Search size={14} className="kicker-icon" />
            <span>CATALOG SEARCH & ADVANCED DISCOVERY</span>
          </div>
          <h1 className="view-title">Explore Films & Directors</h1>
          <p className="view-desc">
            Search across 4,800+ titles, directors, cast members, and plot summaries with real-time semantic ranking.
          </p>
        </div>

        <button
          className={`cv-btn outline-btn ${isFilterDrawerOpen ? 'active' : ''}`}
          onClick={() => setIsFilterDrawerOpen((prev) => !prev)}
        >
          <SlidersHorizontal size={16} />
          <span>Advanced Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}</span>
        </button>
      </header>

      {/* Search Input and Sort Row */}
      <div className="search-controls-bar">
        <div className="search-input-field">
          <Search size={18} className="search-field-icon" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search by title, director, cast (e.g., Christopher Nolan, DiCaprio, Interstellar)..."
            aria-label="Search movies"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                executeSearch('', selectedGenre, sortBy);
              }}
              className="search-field-clear"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="sort-field-wrap">
          <span className="sort-label">SORT BY:</span>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            aria-label="Sort movies"
            className="search-sort-select"
          >
            <option value="popularity">Most Popular</option>
            <option value="vote_average">Highest Rated</option>
            <option value="release_year">Newest Release</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Advanced Filter Drawer */}
      {isFilterDrawerOpen && (
        <div className="filter-drawer-card">
          <div className="filter-drawer-header">
            <div className="drawer-title">
              <SlidersHorizontal size={15} />
              <span>Multi-Dimensional Filters</span>
            </div>
            {activeFiltersCount > 0 && (
              <button className="reset-filters-btn" onClick={resetFilters}>
                <RotateCcw size={13} />
                <span>Reset All</span>
              </button>
            )}
          </div>

          <div className="filter-drawer-grid">
            {/* Rating Filter */}
            <div className="filter-group">
              <div className="filter-group-header">
                <span className="filter-label">MINIMUM TMDB RATING</span>
                <span className="filter-val">★ {minRating > 0 ? `${minRating.toFixed(1)}+` : 'Any'}</span>
              </div>
              <input
                type="range"
                min="0"
                max="9"
                step="0.5"
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="taste-range"
              />
              <div className="range-bounds">
                <span>0.0 (All)</span>
                <span>9.0+ (Masterpieces)</span>
              </div>
            </div>

            {/* Year Range Filter */}
            <div className="filter-group">
              <div className="filter-group-header">
                <span className="filter-label">RELEASE ERA</span>
                <span className="filter-val">
                  {minYear} — {maxYear}
                </span>
              </div>
              <div className="year-inputs-row">
                <input
                  type="number"
                  min="1950"
                  max={maxYear}
                  value={minYear}
                  onChange={(e) => setMinYear(Number(e.target.value))}
                  className="year-num-input"
                />
                <span className="year-sep">to</span>
                <input
                  type="number"
                  min={minYear}
                  max="2026"
                  value={maxYear}
                  onChange={(e) => setMaxYear(Number(e.target.value))}
                  className="year-num-input"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="recent-searches-row">
          <span className="recent-lbl">
            <Clock size={12} /> RECENT:
          </span>
          {recentSearches.map((term) => (
            <button key={term} onClick={() => handleRecentClick(term)} className="recent-chip">
              <span>{term}</span>
              <span
                onClick={(e) => removeRecent(e, term)}
                className="recent-remove"
                title="Remove"
              >
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Genre Filter Chips */}
      <div className="search-genre-strip">
        <button
          onClick={() => handleGenreSelect('')}
          className={`genre-filter-pill ${selectedGenre === '' ? 'active' : ''}`}
        >
          All Genres
        </button>
        {genres.map((g) => (
          <button
            key={g.id}
            onClick={() => handleGenreSelect(g.name)}
            className={`genre-filter-pill ${selectedGenre === g.name ? 'active' : ''}`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* Results Header */}
      <div className="search-results-hdr">
        <span>
          Showing <b>{filteredMovies.length}</b> titles
          {query.trim() && ` for "${query}"`}
        </span>
        {selectedGenre && <span className="active-genre-pill">Genre: {selectedGenre}</span>}
      </div>

      {/* Movie Results Grid */}
      {loading ? (
        <div className="search-grid-layout">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton-grid-card" />
          ))}
        </div>
      ) : filteredMovies.length > 0 ? (
        <div className="search-grid-layout">
          {filteredMovies.map((movie) => (
            <MovieCard
              key={movie.id || (movie as any).movie_id}
              movie={movie}
              isGrid={true}
              onOpenDetails={onOpenDetails}
              onOpenExplanation={onOpenExplanation}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Films Match Your Filters"
          message={`We couldn't find any films matching your search and filter criteria. Try broadening your rating threshold, year range, or ask CineBot for recommendations.`}
          action={
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="cv-btn outline-btn" onClick={resetFilters}>
                <RotateCcw size={15} />
                <span>Reset Filters</span>
              </button>
              {onOpenAssistant && (
                <button className="cv-btn primary-btn" onClick={onOpenAssistant}>
                  <Sparkles size={15} />
                  <span>Ask CineBot Assistant</span>
                </button>
              )}
            </div>
          }
        />
      )}
    </div>
  );
};
