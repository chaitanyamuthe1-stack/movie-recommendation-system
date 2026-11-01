import React, { useState } from 'react';
import { Scale, X, Plus, Star, Sparkles, Bookmark, Film, Check, ExternalLink } from 'lucide-react';
import { Movie } from '../types';
import { useCompare } from '../context/CompareContext';
import { useWatchlist } from '../context/WatchlistContext';
import { getMoviePoster } from '../utils/moviePosters';
import { api } from '../services/api';

interface CompareViewProps {
  onOpenDetails: (movie: Movie) => void;
  onOpenExplanation: (movie: Movie) => void;
}

export const CompareView: React.FC<CompareViewProps> = ({ onOpenDetails, onOpenExplanation }) => {
  const { selectedMovies, removeMovie, addMovie, clearCompare } = useCompare();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const results = await api.searchMovies(q.trim(), 6);
      setSearchResults(results || []);
    } catch (err) {
      console.error('Search error in CompareView', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleLoadSample = async () => {
    try {
      setSearchLoading(true);
      const [m1, m2, m3] = await Promise.all([
        api.searchMovies('Interstellar', 1),
        api.searchMovies('Inception', 1),
        api.searchMovies('Blade Runner 2049', 1),
      ]);
      if (m1[0]) addMovie(m1[0]);
      if (m2[0]) addMovie(m2[0]);
      if (m3[0]) addMovie(m3[0]);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="cv-view-container compare-view">
      {/* Header */}
      <div className="view-header">
        <div className="view-header-left">
          <div className="view-kicker">
            <Scale size={14} className="kicker-icon" />
            <span>HEAD-TO-HEAD MATRIX</span>
          </div>
          <h1 className="view-title">Movie Comparison Studio</h1>
          <p className="view-desc">
            Compare narrative themes, rating distributions, genre embeddings, and AI affinity metrics side-by-side.
          </p>
        </div>

        <div className="view-header-actions">
          {selectedMovies.length > 0 && (
            <button className="cv-btn outline-btn" onClick={clearCompare}>
              Clear Matrix ({selectedMovies.length})
            </button>
          )}
          {selectedMovies.length < 4 && (
            <button
              className="cv-btn primary-btn"
              onClick={() => setIsSearching((prev) => !prev)}
            >
              <Plus size={16} />
              <span>Add Film ({selectedMovies.length}/4)</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Movie Drawer / Search Bar */}
      {isSearching && selectedMovies.length < 4 && (
        <div className="compare-search-card">
          <div className="compare-search-header">
            <div className="search-input-box">
              <input
                type="text"
                placeholder="Search catalog to add to comparison..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
              />
            </div>
            <button className="icon-close-btn" onClick={() => setIsSearching(false)}>
              <X size={16} />
            </button>
          </div>

          {searchLoading && <div className="compare-search-status">Searching catalog...</div>}

          {searchResults.length > 0 && (
            <div className="compare-search-results-grid">
              {searchResults.map((m) => {
                const movieId = m.id || (m as any).movie_id;
                const alreadySelected = selectedMovies.some(
                  (sm) => (sm.id || (sm as any).movie_id) === movieId
                );
                return (
                  <div key={movieId} className="compare-search-item">
                    <img
                      src={getMoviePoster(m)}
                      alt={m.title}
                      className="search-item-thumb"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=120&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="search-item-details">
                      <div className="search-item-title">{m.title}</div>
                      <div className="search-item-meta">
                        ★ {m.vote_average.toFixed(1)} · {m.release_year || 'N/A'}
                      </div>
                    </div>
                    <button
                      className={`add-film-btn ${alreadySelected ? 'added' : ''}`}
                      disabled={alreadySelected}
                      onClick={() => {
                        addMovie(m);
                        setIsSearching(false);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                    >
                      {alreadySelected ? <Check size={14} /> : <Plus size={14} />}
                      <span>{alreadySelected ? 'Added' : 'Compare'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {selectedMovies.length === 0 && (
        <div className="compare-empty-state">
          <div className="empty-icon-wrap">
            <Scale size={42} />
          </div>
          <h2>No Films Selected for Comparison</h2>
          <p>
            Select any 2 to 4 movies from your recommendations, search, or click below to load our benchmark trio.
          </p>
          <div className="empty-actions">
            <button className="cv-btn primary-btn" onClick={handleLoadSample}>
              <Sparkles size={16} />
              <span>Load Nolan Sci-Fi Comparison Sample</span>
            </button>
            <button className="cv-btn outline-btn" onClick={() => setIsSearching(true)}>
              <Plus size={16} />
              <span>Search Catalog</span>
            </button>
          </div>
        </div>
      )}

      {/* Comparison Grid */}
      {selectedMovies.length > 0 && (
        <div
          className="compare-grid"
          style={{ gridTemplateColumns: `repeat(${selectedMovies.length}, minmax(280px, 1fr))` }}
        >
          {selectedMovies.map((movie) => {
            const movieId = movie.id || (movie as any).movie_id;
            const saved = isInWatchlist(movieId);
            const matchScore = Math.min(
              99,
              Math.max(1, Math.round(movie.match_percentage || 88))
            );

            return (
              <div key={movieId} className="compare-column-card">
                {/* Remove button */}
                <button
                  className="compare-remove-btn"
                  onClick={() => removeMovie(movieId)}
                  title="Remove from comparison"
                >
                  <X size={15} />
                </button>

                {/* Poster & Header */}
                <div className="compare-poster-wrap">
                  <img
                    src={getMoviePoster(movie)}
                    alt={movie.title}
                    className="compare-poster-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="compare-match-pill">{matchScore}% Match</div>
                </div>

                <div className="compare-card-body">
                  <h3 className="compare-title" title={movie.title}>
                    {movie.title}
                  </h3>
                  <div className="compare-tagline">{movie.tagline || 'Feature Film'}</div>

                  {/* Actions */}
                  <div className="compare-quick-actions">
                    <button
                      className="cv-btn sm-btn outline-btn"
                      onClick={() => onOpenDetails(movie)}
                    >
                      <ExternalLink size={13} />
                      <span>Details</span>
                    </button>
                    <button
                      className={`cv-btn sm-btn outline-btn ${saved ? 'active-saved' : ''}`}
                      onClick={() => toggleWatchlist(movie)}
                    >
                      <Bookmark size={13} />
                      <span>{saved ? 'Saved' : 'Watchlist'}</span>
                    </button>
                    <button
                      className="cv-btn sm-btn ai-btn"
                      onClick={() => onOpenExplanation(movie)}
                    >
                      <Sparkles size={13} />
                      <span>Explain</span>
                    </button>
                  </div>

                  {/* Comparison Rows */}
                  <div className="compare-metrics-list">
                    <div className="metric-row">
                      <span className="metric-label">TMDB RATING</span>
                      <div className="metric-val">
                        <Star size={13} fill="currentColor" className="star-icon" />
                        <b>{movie.vote_average.toFixed(1)}</b> / 10
                      </div>
                    </div>

                    <div className="metric-bar-wrap">
                      <div
                        className="metric-bar-fill"
                        style={{ width: `${(movie.vote_average / 10) * 100}%` }}
                      />
                    </div>

                    <div className="metric-row">
                      <span className="metric-label">VOTE COUNT</span>
                      <span className="metric-val">{movie.vote_count.toLocaleString()}</span>
                    </div>

                    <div className="metric-row">
                      <span className="metric-label">RELEASE YEAR</span>
                      <span className="metric-val">{movie.release_year || 'N/A'}</span>
                    </div>

                    <div className="metric-row">
                      <span className="metric-label">POPULARITY</span>
                      <span className="metric-val">{Math.round(movie.popularity)}</span>
                    </div>

                    <div className="metric-row-stacked">
                      <span className="metric-label">GENRES</span>
                      <div className="compare-genre-tags">
                        {movie.genres?.map((g) => (
                          <span key={g} className="genre-tag">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    {movie.director && (
                      <div className="metric-row-stacked">
                        <span className="metric-label">DIRECTOR</span>
                        <span className="director-name">{movie.director}</span>
                      </div>
                    )}

                    <div className="metric-row-stacked">
                      <span className="metric-label">SYNOPSIS SUMMARY</span>
                      <p className="compare-overview">
                        {movie.overview
                          ? movie.overview.slice(0, 190) + (movie.overview.length > 190 ? '...' : '')
                          : 'No synopsis available.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
