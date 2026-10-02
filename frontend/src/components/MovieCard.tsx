import React from 'react';
import { Star, Sparkles } from 'lucide-react';
import { Movie } from '../types';
import { getMoviePoster, generateMoviePoster } from '../utils/moviePosters';

interface MovieCardProps {
  movie: Movie;
  onOpenDetails: (movie: Movie) => void;
  onOpenExplanation?: (movie: Movie) => void;
  isGrid?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onOpenDetails,
  onOpenExplanation,
  isGrid = false
}) => {
  const primaryGenre = movie.genres?.[0] || 'Drama';
  const posterSrc = getMoviePoster(movie);

  return (
    <div
      onClick={() => onOpenDetails(movie)}
      style={{
        flex: isGrid ? '1 1 auto' : '0 0 210px',
        width: isGrid ? '100%' : '210px',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease'
      }}
      className="glass-panel glass-panel-interactive"
    >
      {/* Poster Image Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '290px',
        background: '#0d111a',
        overflow: 'hidden'
      }}>
        <img
          src={posterSrc}
          alt={movie.title}
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.dataset.fallback) {
              target.dataset.fallback = "true";
              target.src = generateMoviePoster(movie);
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease'
          }}
        />

        {/* Subtle dark gradient overlay at bottom of poster */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(13, 17, 26, 0.8) 0%, transparent 40%)',
          pointerEvents: 'none'
        }} />

        {/* Match Percentage Badge */}
        <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
          <span className="badge-match">
            {movie.match_percentage || 85}% Match
          </span>
        </div>

        {/* Rating overlay badge */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          padding: '2px 7px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#fbbf24'
        }}>
          <Star size={12} fill="#fbbf24" color="#fbbf24" />
          {movie.vote_average.toFixed(1)}
        </div>

        {/* Why this movie button trigger */}
        {movie.explanation && onOpenExplanation && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenExplanation(movie);
            }}
            title="Explain recommendation"
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              background: 'rgba(99, 102, 241, 0.85)',
              backdropFilter: 'blur(6px)',
              border: 'none',
              borderRadius: '9999px',
              padding: '6px',
              cursor: 'pointer',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.5)'
            }}
          >
            <Sparkles size={14} />
          </button>
        )}
      </div>

      {/* Info Container */}
      <div style={{ padding: '12px 14px' }}>
        <h4 style={{
          fontSize: '0.92rem',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: '4px',
          color: '#f8fafc'
        }}>
          {movie.title}
        </h4>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem' }}>
          <span>{movie.release_year || 'Movie'}</span>
          <span>{primaryGenre}</span>
        </div>
      </div>
    </div>
  );
};
