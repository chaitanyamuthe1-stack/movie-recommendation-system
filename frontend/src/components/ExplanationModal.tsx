import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, User, Clapperboard, Layers, Award, Loader2 } from 'lucide-react';
import { Movie, ExplanationResponse } from '../types';
import { api } from '../services/api';

interface ExplanationModalProps {
  movie: Movie | null;
  userId?: number;
  onClose: () => void;
}

export const ExplanationModal: React.FC<ExplanationModalProps> = ({ movie, userId, onClose }) => {
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(movie?.explanation || null);
  const [loading, setLoading] = useState<boolean>(!movie?.explanation);

  useEffect(() => {
    if (!movie) {
      setExplanation(null);
      return;
    }

    if (movie.explanation) {
      setExplanation(movie.explanation);
      setLoading(false);
    } else {
      setLoading(true);
      const mId = movie.id ?? (movie as any).movie_id;
      if (mId) {
        api.explainMovie(mId, userId)
          .then((res) => setExplanation(res))
          .catch((err) => {
            console.error("Failed to fetch explanation:", err);
            setExplanation(null);
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, [movie?.id, (movie as any)?.movie_id, userId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!movie) return null;

  const exp = explanation;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="exp-title">
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '580px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 'var(--r-lg)',
          padding: '32px 34px',
          position: 'relative',
          background: 'var(--ink-2)',
          border: '1px solid var(--line)',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.95), var(--glow)'
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
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--violet), #6a5cff)',
            borderRadius: 'var(--r-sm)',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(155, 140, 255, 0.4)'
          }}>
            <Sparkles size={16} />
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--violet)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--font-mono)' }}>
            Explainable AI Rationale
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>
            <Loader2 size={32} className="spin-icon" style={{ margin: '0 auto 12px', color: 'var(--violet)' }} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem' }}>Computing model explanation signals...</p>
          </div>
        ) : exp ? (
          <>
            {/* Headline */}
            <h2 id="exp-title" style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '6px', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              {exp.headline}
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '22px' }}>
              Recommendation signals for <strong style={{ color: 'var(--gold-soft)' }}>{movie.title}</strong> derived from mathematical model features:
            </p>

            {/* Confidence & Score KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '18px' }}>
              <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', padding: '14px 12px', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--subtle)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>Predicted Rating</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
                  {(exp.predicted_score || 4.2).toFixed(1)}★
                </span>
              </div>

              <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', padding: '14px 12px', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--subtle)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>Confidence</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--teal)', fontFamily: 'var(--font-mono)' }}>
                  {Math.round((exp.confidence_score || 0.88) * 100)}%
                </span>
              </div>

              <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', padding: '14px 12px', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--subtle)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>Model Signal</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--violet)', textTransform: 'capitalize', marginTop: '4px', display: 'block' }}>
                  {(exp.model_signal || 'hybrid').replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Confidence Progress Bar */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--subtle)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
                <span>ALIGNMENT CONFIDENCE</span>
                <span>{Math.round((exp.confidence_score || 0.88) * 100)}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255, 240, 220, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.round((exp.confidence_score || 0.88) * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--teal), var(--violet))',
                    borderRadius: '4px',
                    transition: 'width 0.8s ease-out'
                  }}
                />
              </div>
            </div>

            {/* Primary Reason */}
            {exp.primary_reason && (
              <div style={{ background: 'rgba(155, 140, 255, 0.08)', border: '1px solid rgba(155, 140, 255, 0.25)', borderRadius: 'var(--r-md)', padding: '14px 16px', marginBottom: '20px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--violet)', textTransform: 'uppercase', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
                  KEY DRIVER
                </span>
                <p style={{ fontSize: '0.92rem', color: 'var(--text)', fontWeight: 600 }}>{exp.primary_reason}</p>
              </div>
            )}

            {/* Feature Matches Chips */}
            {exp.feature_matches && exp.feature_matches.length > 0 && (
              <div style={{ marginBottom: '22px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--subtle)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
                  Detected Attribute Overlaps
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {exp.feature_matches.map((feat, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(155, 140, 255, 0.12)',
                        border: '1px solid rgba(155, 140, 255, 0.28)',
                        borderRadius: 'var(--r-full)',
                        padding: '5px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.8rem',
                        color: 'var(--text)'
                      }}
                    >
                      {feat.type === 'Director' && <Clapperboard size={13} color="var(--violet)" />}
                      {feat.type === 'Cast' && <User size={13} color="var(--teal)" />}
                      {feat.type === 'Genre' && <Layers size={13} color="var(--gold)" />}
                      {feat.type === 'Preference' && <Award size={13} color="var(--ember)" />}
                      <span><strong style={{ color: 'var(--gold-soft)' }}>{feat.type}:</strong> {feat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanatory Bullet Reasons */}
            {exp.reasons && exp.reasons.length > 0 && (
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--subtle)', textTransform: 'uppercase', display: 'block', marginBottom: '10px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
                  Model Evidence Chain
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {exp.reasons.map((reason, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        background: 'var(--panel)',
                        padding: '12px 16px',
                        borderRadius: 'var(--r-sm)',
                        border: '1px solid var(--line)'
                      }}
                    >
                      <CheckCircle2 size={16} color="var(--teal)" style={{ marginTop: '3px', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.55 }}>
                        {reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted)' }}>
            <p>No explanation details available for this film.</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: '24px' }}
        >
          Got it
        </button>
      </div>
    </div>
  );
};
