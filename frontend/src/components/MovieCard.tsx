import React, { memo } from 'react';
import { Star, Sparkles } from 'lucide-react';
import { Movie } from '../types';
import { getMoviePoster, generateMoviePoster } from '../utils/moviePosters';

interface MovieCardProps {
  movie: Movie;
  onOpenDetails: (movie: Movie) => void;
  onOpenExplanation?: (movie: Movie) => void;
  isGrid?: boolean;
  rank?: number;
}

export const MovieCard: React.FC<MovieCardProps> = memo(({
  movie,
  onOpenDetails,
  onOpenExplanation,
  isGrid = false,
  rank
}) => {
  const match = Math.min(99, Math.max(1, Math.round(movie.match_percentage || 85)));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenDetails(movie);
    }
  };

  return (
    <div
      className={`card ${isGrid ? 'grid' : ''}`}
      onClick={() => onOpenDetails(movie)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${movie.title} (${movie.release_year || 'Film'}), rated ${movie.vote_average.toFixed(1)} stars, ${match}% match`}
    >
      <div className="card-poster">
        <img
          src={getMoviePoster(movie)}
          alt={movie.title}
          loading="lazy"
          width="214"
          height="321"
          onError={(e) => {
            const t = e.target as HTMLImageElement;
            if (!t.dataset.fallback) {
              t.dataset.fallback = '1';
              t.src = generateMoviePoster(movie);
            }
          }}
        />
        <div className="card-shade" />
        {rank !== undefined && <div className="card-rank">{rank}</div>}
        <div className="match-ring" style={{ ['--m' as string]: match }}>
          <b>{match}%</b>
        </div>
        <div className="card-rate">
          <Star size={11} fill="currentColor" />
          <span>{movie.vote_average.toFixed(1)}</span>
        </div>
        {onOpenExplanation && (
          <button
            type="button"
            className="card-why"
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
      </div>
      <div className="card-info">
        <h4 className="card-title">{movie.title}</h4>
        <div className="card-meta">
          <span>{movie.release_year || 'Film'}</span>
          <em>{movie.genres?.[0] || 'Drama'}</em>
        </div>
      </div>
    </div>
  );
});

MovieCard.displayName = 'MovieCard';
