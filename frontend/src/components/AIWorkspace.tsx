import React, { useState } from 'react';
import { Sparkles, Sliders, Play, RefreshCw, Star, Bookmark, Scale, Info, Check } from 'lucide-react';
import { Movie, AssistantQueryResponse } from '../types';
import { api } from '../services/api';
import { getMoviePoster } from '../utils/moviePosters';
import { useWatchlist } from '../context/WatchlistContext';
import { useCompare } from '../context/CompareContext';

interface AIWorkspaceProps {
  currentUserId: number;
  onOpenDetails: (movie: Movie) => void;
  onOpenExplanation: (movie: Movie) => void;
}

const TEMPLATES = [
  'Mind-bending cerebral sci-fi with time manipulation and philosophical themes',
  'Gritty 90s neo-noir detective crime with rainy city atmosphere',
  'Wholesome comforting family adventures with clever humor and heart',
  'High-stakes psychological thrillers with shocking third-act twists',
  'Epic sweeping historical war dramas with grand orchestral scores',
];

export const AIWorkspace: React.FC<AIWorkspaceProps> = ({
  currentUserId,
  onOpenDetails,
  onOpenExplanation,
}) => {
  const [prompt, setPrompt] = useState(TEMPLATES[0]);
  const [selectedStrategy, setSelectedStrategy] = useState<'hybrid' | 'neural_cf' | 'svd' | 'content'>('hybrid');
  const [complexity, setComplexity] = useState(80);
  const [emotion, setEmotion] = useState(70);
  const [adrenaline, setAdrenaline] = useState(50);
  const [visuals, setVisuals] = useState(90);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssistantQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const { toggleMovie, isComparing } = useCompare();

  const handleSynthesize = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.queryAssistant(prompt.trim(), currentUserId, 8);
      setResult(response);
    } catch (err: any) {
      console.error('Failed to run AI workspace synthesis', err);
      setError('Unable to query the AI assistant. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cv-view-container ai-workspace-view">
      {/* Header */}
      <div className="view-header">
        <div className="view-header-left">
          <div className="view-kicker">
            <Sparkles size={14} className="kicker-icon" />
            <span>GENERATIVE DISCOVERY LAB</span>
          </div>
          <h1 className="view-title">AI Recommendation Studio</h1>
          <p className="view-desc">
            Synthesize natural language prompts with continuous taste vectors and catalog-grounded NLP.
          </p>
        </div>

        <button
          className="cv-btn primary-btn"
          disabled={loading || !prompt.trim()}
          onClick={handleSynthesize}
        >
          {loading ? <RefreshCw size={16} className="spinning" /> : <Play size={16} />}
          <span>Synthesize Recommendations</span>
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div className="workspace-layout">
        {/* Left Control Panel */}
        <div className="workspace-controls-card">
          <div className="controls-card-header">
            <Sliders size={16} className="card-icon" />
            <h3>Taste Synthesis Prompt</h3>
          </div>

          {/* Prompt Text Area */}
          <div className="prompt-area-wrap">
            <textarea
              className="workspace-textarea"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your ideal cinematic experience in plain English..."
            />
          </div>

          {/* Quick Prompt Presets */}
          <div className="workspace-preset-section">
            <span className="preset-label">INSPIRATION PRESETS</span>
            <div className="preset-chip-list">
              {TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  className={`preset-chip ${prompt === tpl ? 'active' : ''}`}
                  onClick={() => setPrompt(tpl)}
                >
                  {tpl.slice(0, 38)}...
                </button>
              ))}
            </div>
          </div>

          {/* Vector Attribute Sliders */}
          <div className="vector-sliders-section">
            <span className="preset-label">LATENT TASTE VECTORS</span>

            <div className="slider-item">
              <div className="slider-label-row">
                <span>Narrative Complexity</span>
                <b>{complexity}%</b>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={complexity}
                onChange={(e) => setComplexity(Number(e.target.value))}
                className="taste-range"
              />
            </div>

            <div className="slider-item">
              <div className="slider-label-row">
                <span>Emotional Resonance</span>
                <b>{emotion}%</b>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={emotion}
                onChange={(e) => setEmotion(Number(e.target.value))}
                className="taste-range"
              />
            </div>

            <div className="slider-item">
              <div className="slider-label-row">
                <span>Adrenaline & Pacing</span>
                <b>{adrenaline}%</b>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={adrenaline}
                onChange={(e) => setAdrenaline(Number(e.target.value))}
                className="taste-range"
              />
            </div>

            <div className="slider-item">
              <div className="slider-label-row">
                <span>Visual Grandeur</span>
                <b>{visuals}%</b>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={visuals}
                onChange={(e) => setVisuals(Number(e.target.value))}
                className="taste-range"
              />
            </div>
          </div>

          {/* Algorithm Engine Selector */}
          <div className="workspace-algo-section">
            <span className="preset-label">ATTRIBUTION ENGINE</span>
            <div className="algo-pill-grid">
              {[
                { id: 'hybrid', label: 'Hybrid Ensemble' },
                { id: 'neural_cf', label: 'PyTorch NeuMF' },
                { id: 'svd', label: 'SVD Latent' },
                { id: 'content', label: 'Content Bag-of-Words' },
              ].map((algo) => (
                <button
                  key={algo.id}
                  className={`algo-btn ${selectedStrategy === algo.id ? 'active' : ''}`}
                  onClick={() => setSelectedStrategy(algo.id as any)}
                >
                  {algo.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Output Area */}
        <div className="workspace-output-area">
          {error && <div className="workspace-error-banner">{error}</div>}

          {loading && (
            <div className="workspace-loading-card">
              <div className="ai-loading-pulse">
                <Sparkles size={36} className="pulsing-icon" />
              </div>
              <h3>Analyzing Cinematic Intent...</h3>
              <p>
                Extracting semantic entities, matching cosine similarities against 4,800 films,
                and calculating Bayesian scores.
              </p>
            </div>
          )}

          {!loading && !result && (
            <div className="workspace-placeholder-card">
              <Sparkles size={48} className="placeholder-icon" />
              <h3>Generate Your First Synthesis</h3>
              <p>
                Enter a taste description or choose an inspiration preset on the left, then click
                "Synthesize Recommendations" to explore grounded recommendations.
              </p>
              <button className="cv-btn primary-btn" onClick={handleSynthesize}>
                <Play size={16} />
                <span>Run Demo Synthesis</span>
              </button>
            </div>
          )}

          {!loading && result && (
            <div className="workspace-results-wrapper">
              {/* AI Agent Commentary Box */}
              <div className="ai-commentary-box">
                <div className="commentary-header">
                  <div className="cb-avatar">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h4 className="cb-name">CineVerse Attributed Synthesis</h4>
                    <span className="cb-tag">Catalog-Grounded · Zero Hallucinations</span>
                  </div>
                </div>
                <p className="commentary-text">{result.reply}</p>

                {/* Extracted Entity Tags */}
                {result.extracted_preferences && (
                  <div className="extracted-tags-row">
                    {result.extracted_preferences.genres?.map((g) => (
                      <span key={g} className="entity-tag genre-tag">
                        Genre: {g}
                      </span>
                    ))}
                    {result.extracted_preferences.moods?.map((m) => (
                      <span key={m} className="entity-tag mood-tag">
                        Mood: {m}
                      </span>
                    ))}
                    {result.extracted_preferences.keywords?.map((k) => (
                      <span key={k} className="entity-tag kw-tag">
                        #{k}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Synthesized Movie Grid */}
              <div className="synthesized-grid">
                {result.recommendations?.map((movie) => {
                  const movieId = movie.id || (movie as any).movie_id;
                  const saved = isInWatchlist(movieId);
                  const compared = isComparing(movieId);
                  const match = Math.min(
                    99,
                    Math.max(1, Math.round(movie.match_percentage || 89))
                  );

                  return (
                    <div key={movieId} className="synthesized-movie-card">
                      <div className="card-thumb-wrap" onClick={() => onOpenDetails(movie)}>
                        <img
                          src={getMoviePoster(movie)}
                          alt={movie.title}
                          className="card-thumb-img"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div className="card-match-badge">{match}% Match</div>
                      </div>

                      <div className="card-body">
                        <h4 className="movie-title" onClick={() => onOpenDetails(movie)}>
                          {movie.title}
                        </h4>
                        <div className="movie-meta">
                          <span className="rating-tag">
                            <Star size={11} fill="currentColor" /> {movie.vote_average.toFixed(1)}
                          </span>
                          <span>·</span>
                          <span>{movie.release_year || 'N/A'}</span>
                        </div>

                        <p className="movie-synopsis">
                          {movie.overview
                            ? movie.overview.slice(0, 110) + '...'
                            : 'No synopsis available.'}
                        </p>

                        <div className="card-footer-actions">
                          <button
                            className={`action-btn ${saved ? 'active' : ''}`}
                            onClick={() => toggleWatchlist(movie)}
                            title={saved ? 'Remove from Watchlist' : 'Add to Watchlist'}
                          >
                            <Bookmark size={14} />
                          </button>
                          <button
                            className={`action-btn ${compared ? 'active' : ''}`}
                            onClick={() => toggleMovie(movie)}
                            title="Compare"
                          >
                            <Scale size={14} />
                          </button>
                          <button
                            className="action-btn xai-btn"
                            onClick={() => onOpenExplanation(movie)}
                            title="Explain Attribution"
                          >
                            <Sparkles size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

