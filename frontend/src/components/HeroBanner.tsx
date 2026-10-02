import React from 'react';
import { Info, Sparkles, Star } from 'lucide-react';
import { Movie } from '../types';
import { getMovieBackdrop, getMovieLogo } from '../utils/moviePosters';

interface HeroBannerProps {
  movie?: Movie;
  onOpenDetails: (movie: Movie) => void;
  onOpenExplanation: (movie: Movie) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  movie,
  onOpenDetails,
  onOpenExplanation
}) => {
  const [logoError, setLogoError] = React.useState<boolean>(false);

  // Reset logo error state when movie changes
  React.useEffect(() => {
    setLogoError(false);
  }, [movie?.id, movie?.title]);

  if (!movie) {
    return (
      <div style={{ height: '480px', width: '100%', marginBottom: '30px' }} className="skeleton" />
    );
  }

  const backdropUrl = getMovieBackdrop(movie);
  const logoUrl = getMovieLogo(movie);

  return (
    <div style={{
      position: 'relative',
      height: '520px',
      width: '100%',
      marginBottom: '40px',
      borderRadius: '24px',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'flex-end',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
    }}>
      {/* Background Graphic & Dark Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `linear-gradient(to top, #07090e 10%, rgba(7, 9, 14, 0.7) 50%, rgba(7, 9, 14, 0.3) 100%), url(${backdropUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        filter: 'brightness(0.9)'
      }} />

      {/* Hero Content */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        padding: '40px 48px',
        maxWidth: '850px'
      }}>
        {/* Match Percentage & Model Signal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <span className="badge-match" style={{ fontSize: '0.85rem', padding: '4px 12px' }}>
            {movie.match_percentage || 94}% Match
          </span>
          <span className="badge-model">
            {movie.model || 'Hybrid Model'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '0.9rem', fontWeight: 700 }}>
            <Star size={16} fill="#f59e0b" color="#f59e0b" />
            {movie.vote_average.toFixed(1)} / 10
          </div>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            ({movie.release_year})
          </span>
        </div>

        {/* Movie Title or Official Logo */}
        {logoUrl && !logoError ? (
          <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center' }}>
            <img
              src={logoUrl}
              alt={movie.title}
              onError={() => setLogoError(true)}
              style={{
                maxHeight: '110px',
                maxWidth: '460px',
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.95)) drop-shadow(0 0 25px rgba(0,0,0,0.8))'
              }}
            />
          </div>
        ) : (
          <h1 style={{
            fontSize: '3.2rem',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '14px',
            textShadow: '0 4px 20px rgba(0,0,0,0.8)'
          }}>
            {movie.title}
          </h1>
        )}

        {/* Genres */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {movie.genres.map(g => (
            <span key={g} className="badge-genre" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
              {g}
            </span>
          ))}
        </div>

        {/* Overview Synopsis */}
        <p style={{
          fontSize: '1rem',
          color: '#cbd5e1',
          lineHeight: 1.6,
          marginBottom: '26px',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textShadow: '0 2px 10px rgba(0,0,0,0.7)'
        }}>
          {movie.overview || "An exceptional cinema experience curated specifically based on your collaborative taste profile."}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => onOpenDetails(movie)}
            className="btn-primary"
            style={{ padding: '12px 28px', fontSize: '0.95rem' }}
          >
            <Info size={19} /> Movie Details
          </button>

          {movie.explanation && (
            <button
              onClick={() => onOpenExplanation(movie)}
              className="btn-secondary"
              style={{
                background: 'rgba(99, 102, 241, 0.2)',
                borderColor: 'rgba(99, 102, 241, 0.4)',
                color: '#c7d2fe'
              }}
            >
              <Sparkles size={17} color="#a5b4fc" /> Why Recommended?
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
