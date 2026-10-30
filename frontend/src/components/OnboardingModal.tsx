import React, { useState, useEffect } from 'react';
import { Sparkles, Check, ArrowRight, ArrowLeft, X, Film, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { getMoviePoster, generateMoviePoster } from '../utils/moviePosters';
import { useToast } from '../context/ToastContext';

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
  const { showToast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMovies, setSelectedMovies] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Keyboard navigation & escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
      showToast("Taste profile calibrated! Cold-start recommendations generated.", "success");
      onCompleted();
      onClose();
    } catch (e: any) {
      console.error("Onboarding failed:", e);
      showToast(e?.message || "Failed to submit taste profile.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const progressPct = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '780px',
          background: 'var(--ink-2)',
          borderRadius: 'var(--r-lg)',
          padding: '36px 40px',
          boxShadow: '0 30px 70px rgba(0, 0, 0, 0.95), var(--glow)',
          border: '1px solid var(--line)',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%'
          }}
          aria-label="Close onboarding"
        >
          <X size={20} />
        </button>

        {/* Header & Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--gold), var(--ember))',
              borderRadius: 'var(--r-sm)',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1a0e04'
            }}>
              <Sparkles size={16} />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-soft)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--font-mono)' }}>
              Taste Calibration Wizard
            </span>
          </div>

          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)', paddingRight: '28px' }}>
            Step {step} of 3
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '6px', background: 'rgba(255, 240, 220, 0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '28px' }}>
          <div
            style={{
              width: `${progressPct}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--gold), var(--ember))',
              borderRadius: '3px',
              transition: 'width 0.4s ease'
            }}
          />
        </div>

        {/* STEP 1: Select Genres */}
        {step === 1 && (
          <div>
            <h2 id="onboarding-title" style={{ fontSize: '1.9rem', fontWeight: 900, marginBottom: '6px', fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
              What genres do you love?
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.94rem', marginBottom: '26px' }}>
              Select at least 2 favorite genres to bootstrap your preference vector across our latent space.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '12px', marginBottom: '32px' }}>
              {AVAILABLE_GENRES.map(genre => {
                const isSelected = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    style={{
                      background: isSelected ? 'rgba(255, 178, 64, 0.16)' : 'var(--panel)',
                      border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--line)'}`,
                      color: isSelected ? 'var(--gold-soft)' : 'var(--text)',
                      borderRadius: 'var(--r-md)',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      fontWeight: isSelected ? 700 : 500,
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 0 20px rgba(255,178,64,0.2)' : 'none'
                    }}
                  >
                    <span>{genre}</span>
                    {isSelected && <Check size={16} color="var(--gold)" />}
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
                Next: Pick 5 Favorite Movies <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Pick 5 Movies */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
              <h2 id="onboarding-title" style={{ fontSize: '1.9rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                Pick at least 5 favorite films
              </h2>
              <span className="badge-match" style={{ fontSize: '0.74rem' }}>
                {selectedMovies.length} / 5 selected
              </span>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.94rem', marginBottom: '22px' }}>
              These seed films provide high-confidence anchor ratings for collaborative and neural CF layers.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '14px',
              marginBottom: '28px',
              maxHeight: '380px',
              overflowY: 'auto',
              paddingRight: '6px'
            }}>
              {POPULAR_SEED_MOVIES.map(movie => {
                const isSelected = selectedMovies.includes(movie.id);
                return (
                  <div
                    key={movie.id}
                    onClick={() => toggleMovie(movie.id)}
                    style={{
                      background: isSelected ? 'rgba(255, 178, 64, 0.16)' : 'var(--panel)',
                      border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--line)'}`,
                      borderRadius: 'var(--r-md)',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 0 16px rgba(255,178,64,0.2)' : 'none'
                    }}
                  >
                    <div style={{
                      width: '42px',
                      height: '60px',
                      borderRadius: 'var(--r-sm)',
                      overflow: 'hidden',
                      background: 'var(--ink)',
                      border: '1px solid var(--line)',
                      flexShrink: 0
                    }}>
                      <img
                        src={movie.poster_url}
                        alt={movie.title}
                        loading="lazy"
                        width="42"
                        height="60"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = generateMoviePoster(movie as any);
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {movie.title}
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block' }}>
                        {movie.year} • {movie.genre}
                      </span>
                    </div>
                    {isSelected && <Check size={16} color="var(--gold)" />}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setStep(1)} className="btn-secondary">
                <ArrowLeft size={16} /> Back
              </button>

              <button
                onClick={() => setStep(3)}
                disabled={selectedMovies.length < 5}
                className="btn-primary"
                style={{ opacity: selectedMovies.length < 5 ? 0.5 : 1 }}
              >
                Review & Confirm <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Confirm Taste Profile */}
        {step === 3 && (
          <div>
            <h2 id="onboarding-title" style={{ fontSize: '1.9rem', fontWeight: 900, marginBottom: '6px', fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
              Confirm your taste profile
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.94rem', marginBottom: '24px' }}>
              Our hybrid engine will immediately train cold-start weights for User #{userId}.
            </p>

            <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '20px', marginBottom: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--subtle)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '8px' }}>
                  Target Genres ({selectedGenres.length})
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedGenres.map(g => (
                    <span key={g} className="badge-genre">
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--subtle)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '8px' }}>
                  Seed Movies ({selectedMovies.length})
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedMovies.map(mid => {
                    const found = POPULAR_SEED_MOVIES.find(m => m.id === mid);
                    return (
                      <span key={mid} className="badge-match" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Film size={12} /> {found?.title || `Movie #${mid}`}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setStep(2)} className="btn-secondary">
                <ArrowLeft size={16} /> Back
              </button>

              <button
                onClick={handleFinish}
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="spin-icon" /> Calibrating Engine...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} /> Complete Calibration
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
