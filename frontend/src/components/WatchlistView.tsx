import React, { useState, useMemo } from 'react';
import { Bookmark, CheckCircle2, Film, Star, Trash2, Scale, ExternalLink } from 'lucide-react';
import { Movie } from '../types';
import { useWatchlist } from '../context/WatchlistContext';
import { useCompare } from '../context/CompareContext';
import { getMoviePoster } from '../utils/moviePosters';

interface WatchlistViewProps {
  onOpenDetails: (movie: Movie) => void;
  onOpenExplanation: (movie: Movie) => void;
  setActiveTab: (tab: string) => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  onOpenDetails,
  onOpenExplanation,
  setActiveTab,
}) => {
  const { items, removeFromWatchlist, toggleWatched } = useWatchlist();
  const { addMovie, isComparing } = useCompare();

  const [filterTab, setFilterTab] = useState<'all' | 'unwatched' | 'watched'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Extract unique genres across saved items
  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.movie.genres?.forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, [items]);

  // Compute stats
  const stats = useMemo(() => {
    const total = items.length;
    const watched = items.filter((i) => i.watched).length;
    const avgScore =
      total > 0
        ? (items.reduce((acc, curr) => acc + (curr.movie.vote_average || 0), 0) / total).toFixed(1)
        : '0.0';
    return { total, watched, unwatched: total - watched, avgScore };
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterTab === 'unwatched' && item.watched) return false;
      if (filterTab === 'watched' && !item.watched) return false;
      if (selectedGenre !== 'all' && !item.movie.genres?.includes(selectedGenre)) return false;
      if (
        searchFilter.trim() &&
        !item.movie.title.toLowerCase().includes(searchFilter.toLowerCase().trim())
      ) {
        return false;
      }
      return true;
    });
  }, [items, filterTab, selectedGenre, searchFilter]);

  return (
    <div className="cv-view-container watchlist-view">
      {/* Header */}
      <div className="view-header">
        <div className="view-header-left">
          <div className="view-kicker">
            <Bookmark size={14} className="kicker-icon" />
            <span>PERSONAL CINEMA VAULT</span>
          </div>
          <h1 className="view-title">My Curated Watchlist</h1>
          <p className="view-desc">
            Organize personal queues, track completed screenings, and manage custom collections.
          </p>
        </div>

        {/* Stats Pills */}
        <div className="watchlist-stats-row">
          <div className="stat-pill">
            <span className="stat-num">{stats.total}</span>
            <span className="stat-lbl">In Library</span>
          </div>
          <div className="stat-pill">
            <span className="stat-num">{stats.watched}</span>
            <span className="stat-lbl">Watched</span>
          </div>
          <div className="stat-pill">
            <span className="stat-num">★ {stats.avgScore}</span>
            <span className="stat-lbl">Avg Rating</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="watchlist-controls-bar">
        {/* Status Tabs */}
        <div className="tab-pill-group">
          <button
            className={`tab-pill ${filterTab === 'all' ? 'active' : ''}`}
            onClick={() => setFilterTab('all')}
          >
            All Saved ({items.length})
          </button>
          <button
            className={`tab-pill ${filterTab === 'unwatched' ? 'active' : ''}`}
            onClick={() => setFilterTab('unwatched')}
          >
            Want to Watch ({stats.unwatched})
          </button>
          <button
            className={`tab-pill ${filterTab === 'watched' ? 'active' : ''}`}
            onClick={() => setFilterTab('watched')}
          >
            Completed ({stats.watched})
          </button>
        </div>

        {/* Search within Watchlist */}
        <div className="watchlist-search-box">
          <input
            type="text"
            placeholder="Filter saved titles..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Genre Chips */}
      {availableGenres.length > 0 && (
        <div className="watchlist-genre-bar">
          <button
            className={`genre-chip ${selectedGenre === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedGenre('all')}
          >
            All Genres
          </button>
          {availableGenres.map((g) => (
            <button
              key={g}
              className={`genre-chip ${selectedGenre === g ? 'active' : ''}`}
              onClick={() => setSelectedGenre(g)}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 && (
        <div className="watchlist-empty-state">
          <div className="empty-icon-wrap">
            <Bookmark size={42} />
          </div>
          <h2>Your Cinema Vault is Empty</h2>
          <p>
            Bookmark films from recommendations, search, or hero spotlights to curate your personal queue.
          </p>
          <button className="cv-btn primary-btn" onClick={() => setActiveTab('home')}>
            <Film size={16} />
            <span>Discover Recommendations</span>
          </button>
        </div>
      )}

      {/* Grid of Saved Items */}
      {items.length > 0 && (
        <div className="watchlist-grid">
          {filteredItems.map(({ movie, watched, addedAt }) => {
            const movieId = movie.id || (movie as any).movie_id;
            const compared = isComparing(movieId);

            return (
              <div key={movieId} className={`watchlist-card ${watched ? 'is-watched' : ''}`}>
                <div className="card-media-wrap" onClick={() => onOpenDetails(movie)}>
                  <img
                    src={getMoviePoster(movie)}
                    alt={movie.title}
                    className="card-media-poster"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80';
                    }}
                  />
                  {watched && (
                    <div className="watched-badge">
                      <CheckCircle2 size={14} />
                      <span>Watched</span>
                    </div>
                  )}
                  <div className="poster-rating-tag">
                    <Star size={12} fill="currentColor" /> {movie.vote_average.toFixed(1)}
                  </div>
                </div>

                <div className="card-info-wrap">
                  <div className="card-title-row">
                    <h3 className="card-title" onClick={() => onOpenDetails(movie)}>
                      {movie.title}
                    </h3>
                  </div>

                  <div className="card-meta-line">
                    <span>{movie.release_year || 'N/A'}</span>
                    <span>·</span>
                    <span>{movie.genres?.slice(0, 2).join(', ')}</span>
                  </div>

                  <div className="card-actions-row">
                    <button
                      className={`action-pill ${watched ? 'btn-watched' : 'btn-mark'}`}
                      onClick={() => toggleWatched(movieId)}
                      title={watched ? 'Mark as unwatched' : 'Mark as watched'}
                    >
                      <CheckCircle2 size={13} />
                      <span>{watched ? 'Watched' : 'Mark Watched'}</span>
                    </button>

                    <button
                      className={`action-pill ${compared ? 'btn-compared' : ''}`}
                      onClick={() => addMovie(movie)}
                      title="Add to Comparison"
                    >
                      <Scale size={13} />
                      <span>Compare</span>
                    </button>

                    <button
                      className="action-icon-btn remove-btn"
                      onClick={() => removeFromWatchlist(movieId)}
                      title="Remove from Watchlist"
                    >
                      <Trash2 size={14} />
                    </button>
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

