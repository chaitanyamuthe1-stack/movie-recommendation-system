import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { getMoviePoster } from '../utils/moviePosters';

interface OnboardingModalProps {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

const AVAILABLE_GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime",
  "Drama", "Fantasy", "Horror", "Mystery", "Romance",
  "Science Fiction", "Thriller", "Family"
];

const POPULAR_SEED_MOVIES = [
  { id: 58559, title: "The Dark Knight", release_year: 2008, genres: ["Action", "Crime"], year: 2008, genre: "Action/Crime", poster_url: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg" },
  { id: 79132, title: "Inception", release_year: 2010, genres: ["Action", "Sci-Fi"], year: 2010, genre: "Action/Sci-Fi", poster_url: "https://image.tmdb.org/t/p/w500/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg" },
  { id: 109487, title: "Interstellar", release_year: 2014, genres: ["Sci-Fi", "Drama"], year: 2014, genre: "Sci-Fi/Drama", poster_url: "https://image.tmdb.org/t/p/w500/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg" },
  { id: 318, title: "The Shawshank Redemption", release_year: 1994, genres: ["Drama"], year: 1994, genre: "Drama", poster_url: "https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg" },
  { id: 296, title: "Pulp Fiction", release_year: 1994, genres: ["Crime", "Drama"], year: 1994, genre: "Crime/Drama", poster_url: "https://image.tmdb.org/t/p/w500/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg" },
  { id: 2571, title: "The Matrix", release_year: 1999, genres: ["Sci-Fi", "Action"], year: 1999, genre: "Sci-Fi/Action", poster_url: "https://image.tmdb.org/t/p/w500/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg" },
  { id: 858, title: "The Godfather", release_year: 1972, genres: ["Crime", "Drama"], year: 1972, genre: "Crime/Drama", poster_url: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg" },
  { id: 260, title: "Star Wars", release_year: 1977, genres: ["Sci-Fi", "Action"], year: 1977, genre: "Sci-Fi/Action", poster_url: "https://image.tmdb.org/t/p/w500/fai0rspsNeJCS69wHNjOdWxcI7P.jpg" },
  { id: 593, title: "The Silence of the Lambs", release_year: 1991, genres: ["Thriller", "Crime"], year: 1991, genre: "Thriller/Crime", poster_url: "https://image.tmdb.org/t/p/w500/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg" },
  { id: 5618, title: "Spirited Away", release_year: 2001, genres: ["Animation", "Fantasy"], year: 2001, genre: "Animation/Fantasy", poster_url: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg" },
  { id: 1, title: "Toy Story", release_year: 1995, genres: ["Animation", "Family"], year: 1995, genre: "Animation/Family", poster_url: "https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg" },
  { id: 480, title: "Jurassic Park", release_year: 1993, genres: ["Adventure", "Sci-Fi"], year: 1993, genre: "Adventure/Sci-Fi", poster_url: "https://image.tmdb.org/t/p/w500/d9mtMGQDLANKieb9PbD3yK7xxzo.jpg" }
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  userId,
  isOpen,
  onClose,
  onCompleted
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMovies, setSelectedMovies] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const toggleMovie = (id: number) => {
    setSelectedMovies(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await api.submitOnboarding(userId, selectedGenres, selectedMovies);
      onCompleted();
      onClose();
    } catch (e) {
      console.error("Onboarding failed:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '720px',
          background: '#0d111a',
          borderRadius: '24px',
          padding: '36px 40px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 40px rgba(229, 9, 20, 0.2)',
          border: '1px solid rgba(229, 9, 20, 0.3)'
        }}
      >
        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #e50914, #ff3342)',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={16} color="#ffffff" />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Cold-Start Onboarding Wizard
            </span>
          </div>

          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Step {step} of 2
          </span>
        </div>

        {step === 1 ? (
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
              What genres do you love?
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '24px' }}>
              Select at least 2 genres to help our hybrid recommender bootstrap your initial preference vector.
            </p>

            {/* Genre Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
              {AVAILABLE_GENRES.map(genre => {
                const isSelected = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    style={{
                      background: isSelected ? 'rgba(229, 9, 20, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isSelected ? '#e50914' : 'rgba(255, 255, 255, 0.08)'}`,
                      color: isSelected ? '#ffffff' : '#cbd5e1',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      fontWeight: isSelected ? 700 : 500,
                      transition: 'all 0.2s'
                    }}
                  >
                    <span>{genre}</span>
                    {isSelected && <Check size={16} color="#e50914" />}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setStep(2)}
                disabled={selectedGenres.length === 0}
                className="btn-primary"
                style={{ opacity: selectedGenres.length === 0 ? 0.5 : 1 }}
              >
                Next: Select Movies <ArrowRight size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
              Pick a few movies you enjoyed
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '24px' }}>
              These seed movies will be converted into high-confidence anchor points for our TF-IDF and collaborative models.
            </p>

            {/* Seed Movie Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '32px' }}>
              {POPULAR_SEED_MOVIES.map(movie => {
                const isSelected = selectedMovies.includes(movie.id);
                return (
                  <div
                    key={movie.id}
                    onClick={() => toggleMovie(movie.id)}
                    style={{
                      background: isSelected ? 'rgba(229, 9, 20, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isSelected ? '#e50914' : 'rgba(255, 255, 255, 0.08)'}`,
                      borderRadius: '14px',
                      padding: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      width: '42px',
                      height: '58px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: '#1e2638',
                      flexShrink: 0
                    }}>
                      <img
                        src={movie.poster_url}
                        alt={movie.title}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.dataset.fallback) {
                            target.dataset.fallback = "true";
                            target.src = getMoviePoster(movie as any);
                          }
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {movie.title}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{movie.year} • {movie.genre}</span>
                    </div>
                    {isSelected && <Check size={16} color="#e50914" />}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setStep(1)}
                className="btn-secondary"
              >
                Back to Genres
              </button>

              <button
                onClick={handleFinish}
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? "Personalizing Engine..." : "Generate Recommendations"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
