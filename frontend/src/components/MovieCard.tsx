import React, { memo } from 'react';
import { Star, Sparkles, Bookmark, Scale, Info, Check } from 'lucide-react';
import { Movie } from '../types';
import { getMoviePoster, generateMoviePoster } from '../utils/moviePosters';
import { useWatchlist } from '../context/WatchlistContext';
import { useCompare } from '../context/CompareContext';

interface MovieCardProps {
  movie: Movie;
  onOpenDetails: (movie: Movie) => void;
  onOpenExplanation?: (movie: Movie) => void;
  isGrid?: boolean;
  rank?: number;
}

export const MovieCard: React.FC<MovieCardProps> = memo(
  ({ movie, onOpenDetails, onOpenExplanation, isGrid = false, rank }) => {
    const match = Math.min(
      99,
      Math.max(1, Math.round(movie.match_percentage || 88))
    );
    const movieId = movie.id || (movie as any).movie_id;

    const { toggleWatchlist, isInWatchlist } = useWatchlist();
    const { toggleMovie, isComparing } = useCompare();

    const saved = isInWatchlist(movieId);
    const compared = isComparing(movieId);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpenDetails(movie);
      }
    };

    return (
      <div
        className={`card cv-movie-card ${isGrid ? 'grid' : ''}`}
        onClick={() => onOpenDetails(movie)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`${movie.title} (${movie.release_year || 'Film'}), rated ${movie.vote_average.toFixed(
          1
        )} stars, ${match}% match`}
      >
        <div className="card-poster">
          <img
            src={getMoviePoster(movie)}
            alt={movie.title}
            loading="lazy"
            width="220"
            height="330"
            onError={(e) => {
              const t = e.target as HTMLImageElement;
              if (!t.dataset.fallback) {
                t.dataset.fallback = '1';
                t.src = generateMoviePoster(movie);
              }
            }}
          />

          <div className="card-shade" />

          {/* Top Indicators */}
          {rank !== undefined && <div className="card-rank">{rank}</div>}

          <div className="match-ring" style={{ ['--m' as string]: match }}>
            <b>{match}%</b>
          </div>

          <div className="card-rate">
            <Star size={11} fill="currentColor" />
            <span>{movie.vote_average.toFixed(1)}</span>
          </div>

          {/* Hover Preview Overlay Actions */}
          <div className="card-hover-actions">
            <button
              type="button"
              className={`hover-action-btn ${saved ? 'active' : ''}`}
              title={saved ? 'Remove from Watchlist' : 'Add to Watchlist'}
              aria-label={saved ? 'Remove from Watchlist' : 'Add to Watchlist'}
              onClick={(e) => {
                e.stopPropagation();
                toggleWatchlist(movie);
              }}
            >
              {saved ? <Check size={14} /> : <Bookmark size={14} />}
            </button>

            <button
              type="button"
              className={`hover-action-btn ${compared ? 'active' : ''}`}
              title={compared ? 'Remove from Compare' : 'Add to Compare'}
              aria-label={compared ? 'Remove from Compare' : 'Add to Compare'}
              onClick={(e) => {
                e.stopPropagation();
                toggleMovie(movie);
              }}
            >
              <Scale size={14} />
            </button>

            {onOpenExplanation && (
              <button
                type="button"
                className="hover-action-btn xai"
                title="Why was this recommended?"
                aria-label={`Why was ${movie.title} recommended?`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenExplanation(movie);
                }}
              >
                <Sparkles size={14} />
              </button>
            )}

            <button
              type="button"
              className="hover-action-btn details"
              title="View full details"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(movie);
              }}
            >
              <Info size={14} />
            </button>
          </div>
        </div>

        <div className="card-info">
          <h4 className="card-title" title={movie.title}>
            {movie.title}
          </h4>
          <div className="card-meta">
            <span>{movie.release_year || 'N/A'}</span>
            <span className="card-dot">•</span>
            <span>{movie.genres?.[0] || 'Cinema'}</span>
          </div>
        </div>
      </div>
    );
  }
);
