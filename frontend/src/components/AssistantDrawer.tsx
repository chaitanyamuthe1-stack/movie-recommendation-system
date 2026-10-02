import React, { useState } from 'react';
import { X, Send, Bot, User, Star } from 'lucide-react';
import { Movie, AssistantQueryResponse } from '../types';
import { api } from '../services/api';
import { getMoviePoster } from '../utils/moviePosters';

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  onOpenDetails: (movie: Movie) => void;
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
  onOpenDetails
}) => {
  if (!isOpen) return null;

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; data?: AssistantQueryResponse }>>([
    {
      role: 'assistant',
      text: "Hello! I am your AI Cinema Assistant. Describe your exact mood, desired plot tropes, actors, or themes, and I will extract the features and ground your recommendations in our movie database."
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(3, 5, 9, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        justifyContent: 'flex-end'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '100vh',
          background: '#0d111a',
          borderLeft: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.9)'
        }}
      >
        {/* Drawer Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 20, 32, 0.9)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              borderRadius: '10px',
              padding: '7px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                AI Cinema Assistant
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                Grounded Catalog Engine
              </span>
            </div>
          </div>

          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }}>
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
                  background: msg.role === 'user' ? '#e50914' : '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {msg.role === 'user' ? <User size={16} color="#ffffff" /> : <Bot size={16} color="#ffffff" />}
                </div>

                <div style={{
                  maxWidth: '82%',
                  background: msg.role === 'user' ? 'rgba(229, 9, 20, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(229, 9, 20, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '16px',
                  padding: '12px 16px',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  color: '#f1f5f9'
                }}>
                  {msg.text}

                  {/* Extracted Intent Tags */}
                  {msg.data?.extracted_preferences && (
                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {msg.data.extracted_preferences.genres.map(g => (
                        <span key={g} className="badge-match" style={{ fontSize: '0.7rem' }}>
                          Genre: {g}
                        </span>
                      ))}
                      {msg.data.extracted_preferences.moods.map(m => (
                        <span key={m} className="badge-model" style={{ fontSize: '0.7rem' }}>
                          Mood: {m}
                        </span>
                      ))}
                      {msg.data.extracted_preferences.era && (
                        <span key={msg.data.extracted_preferences.era} className="badge-genre" style={{ fontSize: '0.7rem' }}>
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
                        background: 'rgba(20, 26, 40, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '10px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.2s'
                      }}
                      className="glass-panel-interactive"
                    >
                      <div style={{
                        width: '38px',
                        height: '52px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        background: '#1e2638',
                        flexShrink: 0
                      }}>
                        <img
                          src={getMoviePoster(m)}
                          alt={m.title}
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.dataset.fallback) {
                              target.dataset.fallback = "true";
                              target.src = getMoviePoster({ ...m, poster_url: "", poster_path: "" });
                            }
                          }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <h5 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.title}
                          </h5>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <Star size={11} fill="#fbbf24" color="#fbbf24" /> {m.vote_average.toFixed(1)}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {m.release_year} • {m.genres.slice(0, 2).join(', ')}
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
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={16} color="#ffffff" />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '10px 16px', fontSize: '0.85rem', color: '#94a3b8' }}>
                Extracting preferences & querying recommendation engine...
              </div>
            </div>
          )}
        </div>

        {/* Sample Prompt Pills */}
        <div style={{ padding: '8px 20px', display: 'flex', gap: '6px', overflowX: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {SAMPLE_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSubmit(prompt)}
              style={{
                flex: '0 0 auto',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#94a3b8',
                borderRadius: '16px',
                padding: '4px 10px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {prompt.slice(0, 30)}...
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(10, 14, 24, 0.95)',
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
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '10px 16px',
              color: '#f8fafc',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!inputQuery.trim() || isLoading}
            className="btn-primary"
            style={{ padding: '10px 16px', borderRadius: '12px' }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
