import React from 'react';
import { X, Sparkles, CheckCircle2, User, Clapperboard, Layers, Award } from 'lucide-react';
import { Movie, ExplanationResponse } from '../types';

interface ExplanationModalProps {
  movie: Movie | null;
  onClose: () => void;
}

export const ExplanationModal: React.FC<ExplanationModalProps> = ({ movie, onClose }) => {
  if (!movie || !movie.explanation) return null;
  const exp: ExplanationResponse = movie.explanation;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '580px',
          borderRadius: '24px',
          padding: '30px 32px',
          position: 'relative',
          background: '#0d111a',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(99, 102, 241, 0.2)'
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
            color: '#94a3b8',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {/* Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            borderRadius: '8px',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={16} color="#ffffff" />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Explainable AI Rationale
          </span>
        </div>

        {/* Headline */}
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px', color: '#f8fafc' }}>
          {exp.headline}
        </h2>
        <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '22px' }}>
          Recommendation factors for <strong style={{ color: '#ffffff' }}>{movie.title}</strong> derived from mathematical model signals:
        </p>

        {/* Confidence & Score KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '12px 14px', borderRadius: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Predicted Rating</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>
              {exp.predicted_score.toFixed(1)}★
            </span>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '12px 14px', borderRadius: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Model Confidence</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
              {Math.round(exp.confidence_score * 100)}%
            </span>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '12px 14px', borderRadius: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Primary Signal</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'capitalize' }}>
              {exp.model_signal.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Feature Matches Chips */}
        {exp.feature_matches && exp.feature_matches.length > 0 && (
          <div style={{ marginBottom: '22px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              Detected Attribute Overlaps
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {exp.feature_matches.map((feat, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(99, 102, 241, 0.12)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.82rem',
                    color: '#c7d2fe'
                  }}
                >
                  {feat.type === 'Director' && <Clapperboard size={13} />}
                  {feat.type === 'Cast' && <User size={13} />}
                  {feat.type === 'Genre' && <Layers size={13} />}
                  {feat.type === 'Preference' && <Award size={13} />}
                  <span><strong>{feat.type}:</strong> {feat.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explanatory Bullet Reasons */}
        <div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
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
                  background: 'rgba(255, 255, 255, 0.02)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                  {reason}
                </span>
              </div>
            ))}
          </div>
        </div>

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
