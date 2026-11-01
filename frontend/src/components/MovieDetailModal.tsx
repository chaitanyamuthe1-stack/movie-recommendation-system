import React, { useState, useEffect } from 'react';
import { X, Star, Heart, Bookmark, Sparkles, Play, Loader2, Scale, Check } from 'lucide-react';
import { Movie } from '../types';
import { api } from '../services/api';
import { getMoviePoster, getMovieBackdrop, getMovieLogo, generateMoviePoster } from '../utils/moviePosters';
import { useToast } from '../context/ToastContext';
import { useWatchlist } from '../context/WatchlistContext';
import { useCompare } from '../context/CompareContext';

interface MovieDetailModalProps {
  movie: Movie | null;
  onClose: () => void;
  currentUserId: number;
  onOpenExplanation: (movie: Movie) => void;
  onSelectMovie: (movie: Movie) => void;
  onRated?: () => void;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  movie,
  onClose,
  currentUserId,
  onOpenExplanation,
  onSelectMovie,
  onRated
}) => {
  const { showToast } = useToast();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const { toggleMovie, isComparing } = useCompare();
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<boolean>(false);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState<boolean>(false);
  const [submittingRating, setSubmittingRating] = useState<boolean>(false);

  // Keyboard navigation & escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setLogoError(false);
    setUserRating(0);
    setHoverRating(0);

    if (movie) {
      setLoadingSimilar(true);
      const mId = movie.id ?? (movie as any).movie_id;
      if (mId) {
        api.getSimilarMovies(mId, 6)
          .then(res => setSimilarMovies(res || []))
          .catch(() => setSimilarMovies([]))
          .finally(() => setLoadingSimilar(false));
      } else {
        setLoadingSimilar(false);
      }
    }
  }, [movie?.id, (movie as any)?.movie_id, movie?.title]);

  const handleRate = async (stars: number) => {
    if (!movie) return;
    setUserRating(stars);
    setSubmittingRating(true);
    const mId = movie.id ?? (movie as any).movie_id;
    try {
      if (!mId) throw new Error("Missing movie id");
      await api.submitRating(currentUserId, mId, stars);
      showToast(`Rated "${movie.title}" ${stars}★! Recommendations updated.`, 'success');
      if (onRated) {
        onRated();
      }
    } catch (e: any) {
      console.error("Failed to submit rating:", e);
      showToast(e?.message || "Failed to submit rating to server.", 'error');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (!movie) return null;

  const backdropUrl = getMovieBackdrop(movie);
  const posterUrl = getMoviePoster(movie);
  const logoUrl = getMovieLogo(movie);
  const match = Math.min(99, Math.max(1, Math.round(movie.match_percentage || 88)));

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-movie-title">
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '880px',
          maxHeight: '90vh',
          borderRadius: 'var(--r-lg)',
          overflowY: 'auto',
          position: 'relative',
          background: 'var(--ink-2)',
          border: '1px solid var(--line)',
          boxShadow: '0 30px 70px rgba(0, 0, 0, 0.95), var(--glow)'
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
            background: 'rgba(10, 8, 6, 0.75)',
            border: '1px solid var(--line)',
            color: 'var(--text)',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.2s, transform 0.2s'
          }}
          aria-label="Close details"
        >
          <X size={20} />
        </button>

        {/* Modal Backdrop Banner */}
        <div style={{
          position: 'relative',
          minHeight: '290px',
          backgroundImage: `linear-gradient(to top, var(--ink-2) 8%, rgba(18, 14, 11, 0.72) 65%, rgba(18, 14, 11, 0.3) 100%), url(${backdropUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '28px 36px',
          gap: '24px'
        }}>
          {/* Movie Poster Card */}
          <div style={{
            width: '136px',
            height: '204px',
            borderRadius: 'var(--r-md)',
            overflow: 'hidden',
            boxShadow: '0 16px 36px rgba(0,0,0,0.85)',
            border: '1px solid var(--line)',
            flexShrink: 0,
            background: 'var(--ink)'
          }}>
            <img
              src={posterUrl}
              alt={movie.title}
              width="136"
              height="204"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = generateMoviePoster(movie);
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge-match">{match}% Match</span>
              <span className="badge-model">{movie.model || 'Hybrid Model'}</span>
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>{movie.release_year}</span>
            </div>
            {logoUrl && !logoError ? (
              <div style={{ marginBottom: '8px', maxHeight: '70px', display: 'flex', alignItems: 'center' }}>
                <img
                  src={logoUrl}
                  alt={movie.title}
                  onError={() => setLogoError(true)}
                  style={{
                    maxHeight: '65px',
                    maxWidth: '340px',
                    width: 'auto',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.95)) drop-shadow(0 0 20px rgba(0,0,0,0.8))'
                  }}
                />
              </div>
            ) : (
              <h2 id="modal-movie-title" style={{ fontSize: '2.3rem', fontWeight: 900, color: 'var(--text)', lineHeight: 1.1, fontFamily: 'var(--font-display)' }}>
                {movie.title}
              </h2>
            )}
            {movie.tagline && (
              <p style={{ color: 'var(--gold-soft)', fontStyle: 'italic', fontSize: '0.92rem', marginTop: '4px' }}>
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
            borderBottom: '1px solid var(--line)'
          }}>
            {/* Quick Actions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <button
                onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + " trailer")}`, '_blank')}
                className="btn-primary"
              >
                <Play size={18} fill="currentColor" /> Watch Trailer
              </button>

              <button
                onClick={() => {
                  const nextLiked = !isLiked;
                  setIsLiked(nextLiked);
                  showToast(nextLiked ? `Added "${movie.title}" to favorites` : `Removed from favorites`, 'info');
                }}
                className="btn-secondary"
                style={isLiked ? { color: 'var(--ember)', borderColor: 'var(--ember)' } : {}}
              >
                <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} /> {isLiked ? 'Liked' : 'Like'}
              </button>

              <button
                onClick={() => {
                  const mId = movie.id ?? (movie as any).movie_id;
                  const added = toggleWatchlist(movie);
                  showToast(added ? `Saved "${movie.title}" to your watchlist` : `Removed "${movie.title}" from watchlist`, 'info');
                }}
                className="btn-secondary"
                style={isInWatchlist(movie.id ?? (movie as any).movie_id) ? { color: 'var(--teal)', borderColor: 'var(--teal)' } : {}}
              >
                {isInWatchlist(movie.id ?? (movie as any).movie_id) ? <Check size={18} /> : <Bookmark size={18} />}
                <span>{isInWatchlist(movie.id ?? (movie as any).movie_id) ? 'Saved' : 'Watchlist'}</span>
              </button>

              <button
                onClick={() => {
                  toggleMovie(movie);
                  const mId = movie.id ?? (movie as any).movie_id;
                  const comp = isComparing(mId);
                  showToast(comp ? `Removed "${movie.title}" from compare` : `Added "${movie.title}" to compare`, 'info');
                }}
                className="btn-secondary"
                style={isComparing(movie.id ?? (movie as any).movie_id) ? { color: 'var(--gold)', borderColor: 'var(--gold)' } : {}}
              >
                <Scale size={18} />
                <span>{isComparing(movie.id ?? (movie as any).movie_id) ? 'Comparing' : 'Compare'}</span>
              </button>
            </div>

            {/* "Why this movie?" Explainable AI Trigger */}
            <button
              onClick={() => onOpenExplanation(movie)}
              className="btn-secondary"
              style={{
                borderColor: 'rgba(155, 140, 255, 0.45)',
                color: 'var(--violet)'
              }}
            >
              <Sparkles size={18} /> Why Recommended?
            </button>
          </div>

          {/* Interactive Rating Section (1 to 5 stars, supports half stars) */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-md)',
            padding: '18px 22px',
            marginBottom: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', display: 'block' }}>
                Rate this movie
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                Submitting ratings updates your personalized latent vector and recommendations live.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || userRating) >= star;
                return (
                  <button
                    key={star}
                    onClick={() => handleRate(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    disabled={submittingRating}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      transition: 'transform 0.15s'
                    }}
                    title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    <Star
                      size={24}
                      fill={isFilled ? 'var(--gold)' : 'none'}
                      color={isFilled ? 'var(--gold)' : 'var(--subtle)'}
                    />
                  </button>
                );
              })}
              {submittingRating && <Loader2 size={18} className="spin-icon" style={{ color: 'var(--gold)', marginLeft: '6px' }} />}
              {userRating > 0 && !submittingRating && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 700, marginLeft: '6px' }}>
                  {userRating}★
                </span>
              )}
            </div>
          </div>

          {/* Overview & Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '28px', marginBottom: '32px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px', fontFamily: 'var(--font-display)' }}>
                Storyline
              </h3>
              <p style={{ color: 'var(--text)', opacity: 0.9, lineHeight: 1.7, fontSize: '0.94rem' }}>
                {movie.overview || "No synopsis available for this title."}
              </p>

              {/* Genres */}
              <div style={{ marginTop: '20px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--subtle)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
                  Genres
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(movie.genres || []).map(g => (
                    <span key={g} className="badge-genre">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Crew Details */}
            <div style={{ background: 'var(--panel)', padding: '20px', borderRadius: 'var(--r-md)', border: '1px solid var(--line)' }}>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--subtle)', textTransform: 'uppercase', display: 'block', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
                  Director
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>
                  {movie.director || "Unknown"}
                </span>
              </div>

              {movie.cast && movie.cast.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--subtle)', textTransform: 'uppercase', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
                    Cast
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {movie.cast.map(c => (
                      <span key={c} style={{ fontSize: '0.86rem', color: 'var(--muted)' }}>
                        • {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--subtle)', textTransform: 'uppercase', display: 'block', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
                  Community Score
                </span>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--gold)' }}>
                  ★ {movie.vote_average.toFixed(1)} <span style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>({(movie.vote_count || 0).toLocaleString()} votes)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Similar Movies Section */}
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '14px', fontFamily: 'var(--font-display)' }}>
              More Like This
            </h3>
            {loadingSimilar ? (
              <div style={{ display: 'flex', gap: '14px', overflow: 'hidden' }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ flex: '0 0 140px', height: '210px', borderRadius: 'var(--r-md)' }} />
                ))}
              </div>
            ) : similarMovies.length > 0 ? (
              <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '10px' }}>
                {similarMovies.map((simMovie) => (
                  <div
                    key={simMovie.id}
                    onClick={() => onSelectMovie(simMovie)}
                    style={{
                      flex: '0 0 140px',
                      cursor: 'pointer',
                      borderRadius: 'var(--r-md)',
                      overflow: 'hidden',
                      background: 'var(--ink)',
                      border: '1px solid var(--line)',
                      transition: 'transform 0.2s, border-color 0.2s'
                    }}
                    className="glass-panel-interactive"
                  >
                    <img
                      src={getMoviePoster(simMovie)}
                      alt={simMovie.title}
                      loading="lazy"
                      width="140"
                      height="210"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = generateMoviePoster(simMovie);
                      }}
                      style={{ width: '100%', height: '170px', objectFit: 'cover' }}
                    />
                    <div style={{ padding: '8px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {simMovie.title}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 600 }}>
                        ★ {simMovie.vote_average.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>No similar titles recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
