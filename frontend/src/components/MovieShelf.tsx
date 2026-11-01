import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Film } from 'lucide-react';
import { Movie } from '../types';
import { MovieCard } from './MovieCard';

interface MovieShelfProps {
  title: string;
  subtitle?: string;
  kicker?: string;
  ranked?: boolean;
  movies: Movie[];
  onOpenDetails: (movie: Movie) => void;
  onOpenExplanation?: (movie: Movie) => void;
  loading?: boolean;
}

export const MovieShelf: React.FC<MovieShelfProps> = ({
  title,
  subtitle,
  kicker,
  ranked = false,
  movies,
  onOpenDetails,
  onOpenExplanation,
  loading = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (ref.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ref.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = ref.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [movies]);

  const scroll = (dir: number) => {
    if (ref.current) {
      const scrollAmount = dir * (ref.current.clientWidth * 0.75);
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!loading && (!movies || movies.length === 0)) {
    return null;
  }

  return (
    <section className="shelf cv-movie-shelf">
      <div className="shelf-head">
        <div>
          {kicker && <div className="shelf-kicker">{kicker}</div>}
          <h2 className="shelf-title">{title}</h2>
          {subtitle && <p className="shelf-sub">{subtitle}</p>}
        </div>

        <div className="shelf-nav">
          <button
            className={`shelf-arrow-btn ${!canScrollLeft ? 'disabled' : ''}`}
            onClick={() => scroll(-1)}
            disabled={!canScrollLeft}
            aria-label="Scroll carousel left"
          >
            <ChevronLeft size={19} />
          </button>
          <button
            className={`shelf-arrow-btn ${!canScrollRight ? 'disabled' : ''}`}
            onClick={() => scroll(1)}
            disabled={!canScrollRight}
            aria-label="Scroll carousel right"
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="shelf-skeleton-row">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      ) : (
        <div ref={ref} className="shelf-container">
          {movies.map((m, i) => (
            <MovieCard
              key={m.id || (m as any).movie_id || `shelf-movie-${i}`}
              movie={m}
              rank={ranked ? i + 1 : undefined}
              onOpenDetails={onOpenDetails}
              onOpenExplanation={onOpenExplanation}
            />
          ))}
        </div>
      )}
    </section>
  );
};
