import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Star } from 'lucide-react';
import { Movie, AssistantQueryResponse } from '../types';
import { api } from '../services/api';
import { getMoviePoster, generateMoviePoster } from '../utils/moviePosters';

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  onOpenDetails: (movie: Movie) => void;
  initialQuery?: string;
}

const SAMPLE_PROMPTS = [
  "I want a dark psychological thriller with a strong mystery and surprising twist.",
  "Recommend a mind-bending sci-fi movie with space exploration.",
  "Give me an inspiring 90s classic drama with powerful performances.",
  "A fun animated family adventure for weekend movie night."
];

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({
  isOpen,
  onClose,
  userId,
  onOpenDetails,
  initialQuery
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; data?: AssistantQueryResponse }>>([
    {
      role: 'assistant',
      text: "Hello! I am your AI Cinema Assistant. Describe your exact mood, desired plot tropes, actors, or themes, and I will extract the features and ground your recommendations in our movie database."
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const lastInitialQueryRef = useRef<string | null>(null);

  // Close on Escape key
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

  const handleSubmit = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || isLoading) return;

    const userMsg = { role: 'user' as const, text: q };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await api.queryAssistant(q, userId, 4);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: response.reply,
        data: response
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "I experienced an error analyzing your request. Please try again with different keywords or genre descriptors."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && initialQuery && initialQuery.trim() && lastInitialQueryRef.current !== initialQuery) {
      lastInitialQueryRef.current = initialQuery;
      handleSubmit(initialQuery);
    }
  }, [isOpen, initialQuery]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(6, 4, 3, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.25s ease-out'
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="AI Cinema Assistant"
    >
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '100vh',
          background: 'var(--ink-2)',
          borderLeft: '1px solid var(--line)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-16px 0 50px rgba(0, 0, 0, 0.95), var(--glow)'
        }}
      >
        {/* Drawer Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--panel)',
          backdropFilter: 'blur(16px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--gold), var(--ember))',
              borderRadius: 'var(--r-sm)',
              padding: '7px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1a0e04'
            }}>
              <Bot size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                AI Cinema Assistant
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-mono)' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--teal)' }} />
                Grounded Hybrid Catalog
              </span>
            </div>
          </div>

          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px', borderRadius: '50%' }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Messages List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {messages.map((msg, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, var(--gold), var(--ember))' : 'rgba(155, 140, 255, 0.25)',
                  border: '1px solid var(--line)',
                  color: msg.role === 'user' ? '#1a0e04' : 'var(--violet)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                <div style={{
                  maxWidth: '82%',
                  background: msg.role === 'user' ? 'rgba(255, 178, 64, 0.12)' : 'var(--panel)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(255, 178, 64, 0.35)' : 'var(--line)'}`,
                  borderRadius: 'var(--r-md)',
                  padding: '12px 16px',
                  fontSize: '0.9rem',
                  lineHeight: 1.55,
                  color: 'var(--text)'
                }}>
                  {msg.text}

                  {/* Grounded in Catalog Badge */}
                  {msg.data?.is_grounded && (
                    <div style={{ marginTop: '8px' }}>
                      <span className="badge-match" style={{ fontSize: '0.66rem' }}>
                        ✓ Grounded in catalog
                      </span>
                    </div>
                  )}

                  {/* Extracted Intent Tags */}
                  {msg.data?.extracted_preferences && (
                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(msg.data.extracted_preferences.genres || []).map(g => (
                        <span key={g} className="badge-genre" style={{ fontSize: '0.68rem' }}>
                          Genre: {g}
                        </span>
                      ))}
                      {(msg.data.extracted_preferences.moods || []).map(m => (
                        <span key={m} className="badge-model" style={{ fontSize: '0.68rem' }}>
                          Mood: {m}
                        </span>
                      ))}
                      {msg.data.extracted_preferences.era && (
                        <span className="badge-match" style={{ fontSize: '0.68rem' }}>
                          Era: {msg.data.extracted_preferences.era}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Grounded Recommended Movie Cards */}
              {msg.data?.recommendations && msg.data.recommendations.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginLeft: '42px',
                  marginTop: '6px'
                }}>
                  {msg.data.recommendations.map(m => (
                    <div
                      key={m.id || (m as any).movie_id}
                      onClick={() => onOpenDetails(m)}
                      style={{
                        background: 'var(--panel)',
                        border: '1px solid var(--line)',
                        borderRadius: 'var(--r-sm)',
                        padding: '10px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'border-color 0.2s, transform 0.2s'
                      }}
                      className="glass-panel-interactive"
                    >
                      <div style={{
                        width: '40px',
                        height: '56px',
                        borderRadius: 'var(--r-sm)',
                        overflow: 'hidden',
                        background: 'var(--ink)',
                        border: '1px solid var(--line)',
                        flexShrink: 0
                      }}>
                        <img
                          src={getMoviePoster(m)}
                          alt={m.title}
                          loading="lazy"
                          width="40"
                          height="56"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.dataset.fallback) {
                              target.dataset.fallback = "true";
                              target.src = generateMoviePoster(m);
                            }
                          }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <h5 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.title}
                          </h5>
                          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '2px', fontFamily: 'var(--font-mono)' }}>
                            <Star size={11} fill="currentColor" /> {m.vote_average.toFixed(1)}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                          {m.release_year} • {(m.genres || []).slice(0, 2).join(', ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(155, 140, 255, 0.2)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--violet)' }}>
                <Bot size={16} />
              </div>
              <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '10px 16px', fontSize: '0.85rem', color: 'var(--muted)' }}>
                Extracting preferences & querying recommendation engine...
              </div>
            </div>
          )}
        </div>

        {/* Sample Prompt Pills */}
        <div style={{ padding: '8px 20px', display: 'flex', gap: '6px', overflowX: 'auto', borderTop: '1px solid var(--line)', background: 'var(--panel)' }}>
          {SAMPLE_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSubmit(prompt)}
              style={{
                flex: '0 0 auto',
                background: 'rgba(255, 240, 220, 0.04)',
                border: '1px solid var(--line)',
                color: 'var(--muted)',
                borderRadius: 'var(--r-full)',
                padding: '5px 12px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'border-color 0.2s, color 0.2s'
              }}
              onMouseEnter={(e) => { (e.currentTarget.style.borderColor = 'var(--gold)'); (e.currentTarget.style.color = 'var(--text)'); }}
              onMouseLeave={(e) => { (e.currentTarget.style.borderColor = 'var(--line)'); (e.currentTarget.style.color = 'var(--muted)'); }}
            >
              {prompt.slice(0, 32)}...
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--line)',
          background: 'var(--ink-2)',
          display: 'flex',
          gap: '10px'
        }}>
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Describe your desired movie..."
            style={{
              flex: 1,
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-md)',
              padding: '10px 16px',
              color: 'var(--text)',
              fontSize: '0.9rem',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!inputQuery.trim() || isLoading}
            className="btn-primary"
            style={{ padding: '10px 18px', borderRadius: 'var(--r-md)' }}
            aria-label="Send query"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
