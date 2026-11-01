import React, { useState, useEffect } from 'react';
import { Info, Sparkles, Star, Bookmark, Scale, Play, Check } from 'lucide-react';
import { Movie } from '../types';
import { getMovieBackdrop, getMovieLogo } from '../utils/moviePosters';
import { useWatchlist } from '../context/WatchlistContext';
import { useCompare } from '../context/CompareContext';

interface HeroBannerProps {
  movie?: Movie;
  movies?: Movie[];
  onOpenDetails: (movie: Movie) => void;
  onOpenExplanation: (movie: Movie) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  movie,
  movies = [],
  onOpenDetails,
  onOpenExplanation,
}) => {
  const [logoError, setLogoError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const { toggleMovie, isComparing } = useCompare();

  const playlist =
    movies && movies.length > 0 ? movies.slice(0, 5) : movie ? [movie] : [];

  const activeMovie = playlist[currentIndex] || playlist[0] || movie;

  // Reset index if playlist changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [playlist.length > 0 ? playlist[0]?.id : null]);

  // Auto-rotate every 8 seconds, paused on hover
  useEffect(() => {
    if (playlist.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [playlist.length, isHovered]);

  useEffect(() => {
    setLogoError(false);
  }, [activeMovie?.id, activeMovie?.title]);

  if (!activeMovie) {
    return <div className="hero skeleton" style={{ minHeight: 560 }} />;
  }

  const logoUrl = getMovieLogo(activeMovie);
  const backdropUrl = getMovieBackdrop(activeMovie);
  const movieId = activeMovie.id || (activeMovie as any).movie_id;
  const isSaved = isInWatchlist(movieId);
  const isComp = isComparing(movieId);
  const matchPct = Math.min(
    99,
    Math.max(1, Math.round(activeMovie.match_percentage || 95))
  );

  return (
    <section
      className="hero cv-hero-spotlight"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Spotlight movie recommendation"
    >
      {/* Animated gradient atmosphere */}
      <div className="hero-ambient-glow" />
      <div className="hero-bg" style={{ backgroundImage: `url(${backdropUrl})` }} />
      <div className="hero-vignette-overlay" />
      <div className="hero-perf" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <i key={i} />
        ))}
      </div>

      <div className="hero-content" key={activeMovie.id}>
        <div className="hero-eyebrow">
          <span className="badge-match">{matchPct}% Match for You</span>
          <span className="badge-model">{activeMovie.model || 'HYBRID ENSEMBLE'}</span>
          <span className="hero-star-rating">
            <Star size={15} fill="currentColor" /> {activeMovie.vote_average.toFixed(1)}
          </span>
          <span className="hero-year">{activeMovie.release_year || 'N/A'}</span>
          <span className="hero-dot-sep">·</span>
          <span className="hero-runtime">2h 18m</span>
        </div>

        {logoUrl && !logoError ? (
          <img
            src={logoUrl}
            alt={activeMovie.title}
            onError={() => setLogoError(true)}
            className="hero-logo-img"
          />
        ) : (
          <h1 className="hero-title">{activeMovie.title}</h1>
        )}

        <div className="hero-genres-row">
          {(activeMovie.genres || []).map((g) => (
            <span key={g} className="badge-genre">
              {g}
            </span>
          ))}
        </div>

        <p className="hero-overview">
          {activeMovie.overview ||
            'Dynamically selected by our hybrid machine learning model using collaborative taste patterns and deep item representations.'}
        </p>

        <div className="hero-actions">
          <button className="btn-primary hero-btn-main" onClick={() => onOpenDetails(activeMovie)}>
            <Info size={18} />
            <span>Movie Details & Trailer</span>
          </button>

          <button
            className="btn-secondary hero-btn-why"
            onClick={() => onOpenExplanation(activeMovie)}
          >
            <Sparkles size={16} />
            <span>Why This Pick? (XAI)</span>
          </button>

          <button
            className={`hero-action-pill ${isSaved ? 'active' : ''}`}
            onClick={() => toggleWatchlist(activeMovie)}
            title={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
          >
            {isSaved ? <Check size={16} /> : <Bookmark size={16} />}
            <span>{isSaved ? 'Saved' : 'Watchlist'}</span>
          </button>

          <button
            className={`hero-action-pill ${isComp ? 'active' : ''}`}
            onClick={() => toggleMovie(activeMovie)}
            title={isComp ? 'Remove from Compare' : 'Add to Compare'}
          >
            <Scale size={16} />
            <span>{isComp ? 'Comparing' : 'Compare'}</span>
          </button>
        </div>

        {/* Carousel indicators tabs */}
        {playlist.length > 1 && (
          <div className="hero-playlist-strip">
            <div className="hero-dots">
              {playlist.map((m, idx) => (
                <button
                  key={m.id || idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`hero-dot-pill ${idx === currentIndex ? 'active' : ''}`}
                  aria-label={`Jump to movie ${idx + 1}: ${m.title}`}
                >
                  <span className="dot-thumb-num">{idx + 1}</span>
                  <span className="dot-thumb-title">{m.title}</span>
                </button>
              ))}
            </div>
            <span className="hero-paused-hint">
              {isHovered ? '❚❚ Paused' : '▶ Auto-advancing'}
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
