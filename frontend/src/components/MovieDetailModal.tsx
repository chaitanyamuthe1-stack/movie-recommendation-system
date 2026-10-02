import React, { useState } from 'react';
import { X, Star, Heart, Bookmark, Sparkles, Play } from 'lucide-react';
import { Movie } from '../types';
import { api } from '../services/api';
import { getMoviePoster, getMovieBackdrop, getMovieLogo, generateMoviePoster } from '../utils/moviePosters';

interface MovieDetailModalProps {
  movie: Movie | null;
  onClose: () => void;
  currentUserId: number;
  onOpenExplanation: (movie: Movie) => void;
  onSelectMovie: (movie: Movie) => void;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  movie,
  onClose,
  currentUserId,
  onOpenExplanation,
  onSelectMovie
}) => {
  if (!movie) return null;

  const [userRating, setUserRating] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [inWatchlist, setInWatchlist] = useState<boolean>(false);
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<boolean>(false);

  React.useEffect(() => {
    setLogoError(false);
  }, [movie?.id, movie?.title]);

  const handleRate = async (stars: number) => {
    setUserRating(stars);
    try {
      await api.submitRating(currentUserId, movie.id, stars);
      setRatingSubmitted(true);
      setTimeout(() => setRatingSubmitted(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const backdropUrl = getMovieBackdrop(movie);
  const posterUrl = getMoviePoster(movie);
  const logoUrl = getMovieLogo(movie);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          borderRadius: '24px',
          overflowY: 'auto',
          position: 'relative',
          background: '#0d111a',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 10,
            background: 'rgba(0, 0, 0, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Backdrop Banner */}
        <div style={{
          position: 'relative',
          minHeight: '280px',
          backgroundImage: `linear-gradient(to top, #0d111a 10%, rgba(13, 17, 26, 0.7) 60%, rgba(13, 17, 26, 0.3) 100%), url(${backdropUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '28px 36px',
          gap: '24px'
        }}>
          {/* Movie Poster Card */}
          <div style={{
            width: '130px',
            height: '190px',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 12px 30px rgba(0,0,0,0.8)',
            border: '2px solid rgba(255,255,255,0.15)',
            flexShrink: 0
          }}>
            <img
              src={posterUrl}
              alt={movie.title}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = generateMoviePoster(movie);
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge-match">{movie.match_percentage || 90}% Match</span>
              <span className="badge-model">{movie.model || 'Hybrid Model'}</span>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{movie.release_year}</span>
            </div>
            {logoUrl && !logoError ? (
              <div style={{ marginBottom: '8px', maxHeight: '70px', display: 'flex', alignItems: 'center' }}>
                <img
                  src={logoUrl}
                  alt={movie.title}
                  onError={() => setLogoError(true)}
                  style={{
                    maxHeight: '65px',
                    maxWidth: '320px',
                    width: 'auto',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.95)) drop-shadow(0 0 16px rgba(0,0,0,0.8))'
                  }}
                />
              </div>
            ) : (
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
                {movie.title}
              </h2>
            )}
            {movie.tagline && (
              <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem', marginTop: '4px' }}>
                "{movie.tagline}"
              </p>
            )}
          </div>
        </div>

        {/* Modal Details Body */}
        <div style={{ padding: '28px 36px' }}>
          {/* Action Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '26px',
            paddingBottom: '20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + " trailer")}`, '_blank')}
                className="btn-primary"
              >
                <Play size={18} fill="#ffffff" /> Watch Trailer
              </button>

              <button
                onClick={() => setIsLiked(!isLiked)}
                className="btn-secondary"
                style={isLiked ? { color: '#ef4444', borderColor: '#ef4444' } : {}}
              >
                <Heart size={18} fill={isLiked ? '#ef4444' : 'none'} /> {isLiked ? 'Liked' : 'Like'}
              </button>

              <button
                onClick={() => setInWatchlist(!inWatchlist)}
                className="btn-secondary"
                style={inWatchlist ? { color: '#10b981', borderColor: '#10b981' } : {}}
              >
                <Bookmark size={18} fill={inWatchlist ? '#10b981' : 'none'} /> {inWatchlist ? 'In Watchlist' : 'Watchlist'}
              </button>
            </div>

            {/* "Why this movie?" Explainable AI Trigger */}
            <button
              onClick={() => onOpenExplanation(movie)}
              className="btn-secondary"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25))',
                borderColor: 'rgba(99, 102, 241, 0.4)',
                color: '#c7d2fe',
                fontWeight: 600
              }}
            >
              <Sparkles size={18} color="#a5b4fc" /> Why This Movie?
            </button>
          </div>

          {/* Interactive Rating Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', display: 'block' }}>
                Rate this movie to refine your recommendations
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Your feedback automatically invalidates stale models and personalizes recommendations
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    transition: 'transform 0.15s'
                  }}
                  title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    size={24}
                    fill={userRating >= star ? '#fbbf24' : 'none'}
                    color={userRating >= star ? '#fbbf24' : '#64748b'}
                  />
                </button>
              ))}
              {ratingSubmitted && (
                <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, marginLeft: '8px' }}>
                  Saved!
                </span>
              )}
            </div>
          </div>

          {/* Overview & Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginBottom: '30px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px' }}>
                Storyline
              </h3>
              <p style={{ color: '#cbd5e1', lineHeight: 1.7, fontSize: '0.95rem' }}>
                {movie.overview || "No synopsis available for this title."}
              </p>

              {/* Genres */}
              <div style={{ marginTop: '18px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Genres
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {movie.genres.map(g => (
                    <span key={g} className="badge-genre">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Crew Details */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>
                  Director
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>
                  {movie.director || "Unknown"}
                </span>
              </div>

              {movie.cast && movie.cast.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Cast
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {movie.cast.map(c => (
                      <span key={c} style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>
                        • {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>
                  Community Score
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f59e0b' }}>
                  ★ {movie.vote_average.toFixed(1)} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>({movie.vote_count.toLocaleString()} votes)</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
