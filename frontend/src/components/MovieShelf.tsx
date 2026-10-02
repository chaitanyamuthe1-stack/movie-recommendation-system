import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie } from '../types';
import { MovieCard } from './MovieCard';

interface MovieShelfProps {
  title: string;
  subtitle?: string;
  movies: Movie[];
  onOpenDetails: (movie: Movie) => void;
  onOpenExplanation?: (movie: Movie) => void;
  loading?: boolean;
}

export const MovieShelf: React.FC<MovieShelfProps> = ({
  title,
  subtitle,
  movies,
  onOpenDetails,
  onOpenExplanation,
  loading = false
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 680;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div style={{ marginBottom: '38px' }}>
      {/* Category Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: '14px',
        padding: '0 4px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginBottom: '2px' }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Scroll Buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => handleScroll('left')}
            className="btn-secondary"
            style={{ padding: '6px', borderRadius: '8px' }}
            title="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="btn-secondary"
            style={{ padding: '6px', borderRadius: '8px' }}
            title="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Shelf Body */}
      {loading ? (
        <div style={{ display: 'flex', gap: '18px', overflow: 'hidden' }}>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              style={{ flex: '0 0 210px', height: '340px', borderRadius: '16px' }}
              className="skeleton"
            />
          ))}
        </div>
      ) : (
        <div ref={scrollRef} className="shelf-container">
          {movies.map(movie => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onOpenDetails={onOpenDetails}
              onOpenExplanation={onOpenExplanation}
            />
          ))}
        </div>
      )}
    </div>
  );
};
