import React, { useState, useEffect } from 'react';
import { Info, Sparkles, Star } from 'lucide-react';
import { Movie } from '../types';
import { getMovieBackdrop, getMovieLogo } from '../utils/moviePosters';

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
  onOpenExplanation
}) => {
  const [logoError, setLogoError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const playlist = (movies && movies.length > 0)
    ? movies.slice(0, 5)
    : (movie ? [movie] : []);

  const activeMovie = playlist[currentIndex] || playlist[0] || movie;

  // Reset index if playlist changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [playlist.length > 0 ? playlist[0]?.id : null]);

  // Auto-rotate every 9 seconds, paused on hover
  useEffect(() => {
    if (playlist.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }, 9000);

    return () => clearInterval(timer);
  }, [playlist.length, isHovered]);

  useEffect(() => {
    setLogoError(false);
  }, [activeMovie?.id, activeMovie?.title]);

  if (!activeMovie) {
    return <div className="hero skeleton" style={{ minHeight: 580 }} />;
  }

  const logoUrl = getMovieLogo(activeMovie);
  const backdropUrl = getMovieBackdrop(activeMovie);

  return (
    <section
      className="hero"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Featured recommendation"
    >
      <div className="hero-bg" style={{ backgroundImage: `url(${backdropUrl})` }} />
      <div className="hero-perf" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => <i key={i} />)}
      </div>

      <div className="hero-content" key={activeMovie.id}>
        <div className="hero-eyebrow">
          <span className="badge-match">{activeMovie.match_percentage || 94}% match for you</span>
          <span className="badge-model">{activeMovie.model || 'HYBRID ENSEMBLE'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--gold)', fontWeight: 800, fontSize: '.9rem' }}>
            <Star size={15} fill="currentColor" /> {activeMovie.vote_average.toFixed(1)}
          </span>
          <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{activeMovie.release_year}</span>
        </div>

        {logoUrl && !logoError ? (
          <img
            src={logoUrl}
            alt={activeMovie.title}
            onError={() => setLogoError(true)}
            style={{
              maxHeight: 120,
              maxWidth: 480,
              objectFit: 'contain',
              marginBottom: 14,
              filter: 'drop-shadow(0 6px 24px rgba(0,0,0,.95))'
            }}
          />
        ) : (
          <h1 className="hero-title">{activeMovie.title}</h1>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(activeMovie.genres || []).map((g) => (
            <span key={g} className="badge-genre">{g}</span>
          ))}
        </div>

        <p className="hero-overview">
          {activeMovie.overview || 'Hand-picked for your taste profile by our hybrid recommendation engine.'}
        </p>

        <div className="hero-actions">
          <button className="btn-primary" onClick={() => onOpenDetails(activeMovie)}>
            <Info size={18} /> Details
          </button>
          <button
            className="btn-secondary"
            onClick={() => onOpenExplanation(activeMovie)}
            style={{ borderColor: 'rgba(155,140,255,.5)', color: '#d9d3ff' }}
          >
            <Sparkles size={16} /> Why this pick?
          </button>
        </div>

        {playlist.length > 1 && (
          <div className="hero-dots" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '22px' }}>
            {playlist.map((m, idx) => (
              <button
                key={m.id || idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Jump to movie ${idx + 1}: ${m.title}`}
                style={{
                  width: idx === currentIndex ? '32px' : '10px',
                  height: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: idx === currentIndex ? 'var(--gold)' : 'rgba(255, 240, 220, 0.25)',
                  boxShadow: idx === currentIndex ? '0 0 10px rgba(255, 178, 64, 0.7)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
            ))}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--subtle)', marginLeft: '8px' }}>
              {currentIndex + 1} / {playlist.length} {isHovered ? '(paused)' : ''}
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
