import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  title, subtitle, kicker, ranked = false, movies, onOpenDetails, onOpenExplanation, loading = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 700, behavior: 'smooth' });

  return (
    <section className="shelf">
      <div className="shelf-head">
        <div>
          {kicker && <div className="shelf-kicker">{kicker}</div>}
          <h2 className="shelf-title">{title}</h2>
          {subtitle && <p className="shelf-sub">{subtitle}</p>}
        </div>
        <div className="shelf-nav">
          <button className="btn-secondary" onClick={() => scroll(-1)} aria-label="Scroll left"><ChevronLeft size={18} /></button>
          <button className="btn-secondary" onClick={() => scroll(1)} aria-label="Scroll right"><ChevronRight size={18} /></button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: 20, overflow: 'hidden' }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ flex: '0 0 214px', height: 380 }} />)}
        </div>
      ) : (
        <div ref={ref} className="shelf-container">
          {movies.map((m, i) => (
            <MovieCard key={m.id || (m as any).movie_id || `shelf-movie-${i}`} movie={m} rank={ranked ? i + 1 : undefined}
              onOpenDetails={onOpenDetails} onOpenExplanation={onOpenExplanation} />
          ))}
        </div>
      )}
    </section>
  );
};
