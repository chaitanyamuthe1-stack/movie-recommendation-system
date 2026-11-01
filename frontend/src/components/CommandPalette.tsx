import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Film, Sparkles, Scale, Bookmark, BarChart3, UserCheck, X, ArrowRight, Star } from 'lucide-react';
import { Movie } from '../types';
import { api } from '../services/api';
import { getMoviePoster } from '../utils/moviePosters';
import { useWatchlist } from '../context/WatchlistContext';
import { useCompare } from '../context/CompareContext';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMovie: (movie: Movie) => void;
  setActiveTab: (tab: string) => void;
  onOpenAssistant: (query?: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectMovie,
  setActiveTab,
  onOpenAssistant,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const { toggleMovie, isComparing } = useCompare();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounced catalog search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.searchMovies(query.trim(), 8);
        setResults(res || []);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search error in CommandPalette', err);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + Math.max(1, results.length)) % Math.max(1, results.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          onSelectMovie(results[selectedIndex]);
          onClose();
        } else if (query.trim()) {
          // If query entered, jump to search tab
          setActiveTab('search');
          onClose();
        }
      }
    },
    [results, selectedIndex, onSelectMovie, onClose, query, setActiveTab]
  );

  if (!isOpen) return null;

  const quickNav = [
    { label: 'Discover Recommendations', tab: 'home', icon: Film },
    { label: 'Explore & Filter Catalog', tab: 'search', icon: Search },
    { label: 'AI Taste Workspace', tab: 'workspace', icon: Sparkles },
    { label: 'Compare Movies Head-to-Head', tab: 'compare', icon: Scale },
    { label: 'My Watchlist & Library', tab: 'watchlist', icon: Bookmark },
    { label: 'ML Analytics & Dynamic Weights', tab: 'dashboard', icon: BarChart3 },
    { label: 'User Persona Profile', tab: 'profile', icon: UserCheck },
  ];

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette-modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        {/* Search Input Bar */}
        <div className="palette-input-row">
          <Search size={20} className="palette-icon" />
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            placeholder="Type a movie title, actor, genre, or command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="palette-clear-btn" onClick={() => setQuery('')}>
              <X size={16} />
            </button>
          )}
          <span className="palette-esc-badge">ESC</span>
        </div>

        {/* Results Container */}
        <div className="palette-body">
          {loading && (
            <div className="palette-loading">
              <div className="spinner" />
              <span>Scanning 4,800+ catalog titles...</span>
            </div>
          )}

          {!loading && query.trim() && results.length > 0 && (
            <div className="palette-section">
              <div className="palette-section-hdr">CATALOG MATCHES ({results.length})</div>
              <ul className="palette-list">
                {results.map((movie, idx) => {
                  const isSelected = idx === selectedIndex;
                  const movieId = movie.id || (movie as any).movie_id;
                  const saved = isInWatchlist(movieId);
                  const compared = isComparing(movieId);

                  return (
                    <li
                      key={movieId}
                      className={`palette-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        onSelectMovie(movie);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <img
                        src={getMoviePoster(movie)}
                        alt={movie.title}
                        className="palette-thumb"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=120&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="palette-item-info">
                        <div className="palette-item-title-row">
                          <span className="palette-item-title">{movie.title}</span>
                          <span className="palette-item-year">({movie.release_year || 'N/A'})</span>
                        </div>
                        <div className="palette-item-meta">
                          <span className="palette-item-rating">
                            <Star size={12} fill="currentColor" /> {movie.vote_average.toFixed(1)}
                          </span>
                          <span className="palette-bullet">·</span>
                          <span className="palette-genres">{movie.genres?.slice(0, 3).join(', ')}</span>
                        </div>
                      </div>

                      <div className="palette-item-actions">
                        <button
                          type="button"
                          className={`palette-action-btn ${saved ? 'active' : ''}`}
                          title={saved ? 'Remove from Watchlist' : 'Add to Watchlist'}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWatchlist(movie);
                          }}
                        >
                          <Bookmark size={14} />
                        </button>
                        <button
                          type="button"
                          className={`palette-action-btn ${compared ? 'active' : ''}`}
                          title={compared ? 'Remove from Compare' : 'Add to Compare'}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMovie(movie);
                          }}
                        >
                          <Scale size={14} />
                        </button>
                        <span className="palette-enter-hint">Press Enter ↵</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {!loading && query.trim() && results.length === 0 && (
            <div className="palette-empty">
              <Film size={32} className="empty-icon" />
              <div className="empty-title">No catalog titles found for "{query}"</div>
              <p className="empty-sub">
                Try searching by director, keywords, or ask CineBot for recommendations.
              </p>
              <button
                className="palette-ai-cta"
                onClick={() => {
                  onClose();
                  onOpenAssistant(`Recommend movies related to: ${query}`);
                }}
              >
                <Sparkles size={16} />
                <span>Ask CineBot about "{query}"</span>
              </button>
            </div>
          )}

          {!query.trim() && (
            <div className="palette-suggestions">
              <div className="palette-section-hdr">QUICK NAVIGATION</div>
              <div className="palette-quick-grid">
                {quickNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.tab}
                      className="palette-quick-btn"
                      onClick={() => {
                        setActiveTab(item.tab);
                        onClose();
                      }}
                    >
                      <div className="quick-btn-left">
                        <Icon size={16} className="quick-icon" />
                        <span>{item.label}</span>
                      </div>
                      <ArrowRight size={14} className="quick-arrow" />
                    </button>
                  );
                })}
              </div>

              <div className="palette-section-hdr" style={{ marginTop: 20 }}>
                NATURAL LANGUAGE AI PROMPTS
              </div>
              <div className="palette-prompt-chips">
                {[
                  'Psychological sci-fi with dark atmospheric score',
                  'High-concept heist films with unexpected plot twists',
                  'Feel-good nostalgic coming-of-age 80s movies',
                  'Slow-burn investigative noir crime thrillers',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    className="palette-prompt-chip"
                    onClick={() => {
                      onClose();
                      onOpenAssistant(prompt);
                    }}
                  >
                    <Sparkles size={13} />
                    <span>"{prompt}"</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="palette-footer">
          <div className="palette-shortcuts-hint">
            <span>
              <kbd>↑</kbd> <kbd>↓</kbd> to navigate
            </span>
            <span>
              <kbd>↵</kbd> to select
            </span>
            <span>
              <kbd>esc</kbd> to close
            </span>
          </div>
          <span className="palette-engine-note">CineVerse AI Catalog Search Engine</span>
        </div>
      </div>
    </div>
  );
};
