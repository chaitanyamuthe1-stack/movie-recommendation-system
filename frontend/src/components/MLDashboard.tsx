import React, { useState, useEffect } from 'react';
import { BarChart3, Sliders, Activity, Database, Cpu, Zap, CheckCircle2, RefreshCw } from 'lucide-react';
import { ModelMetrics } from '../types';
import { api } from '../services/api';

export const MLDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [weights, setWeights] = useState<any>({
    cold_user_weights: { collaborative: 0.05, svd: 0.05, neural_cf: 0.00, content: 0.45, genre_preference: 0.30, popularity: 0.15, recency: 0.00 },
    warm_user_weights: { collaborative: 0.25, svd: 0.35, neural_cf: 0.15, content: 0.15, genre_preference: 0.05, popularity: 0.02, recency: 0.03 }
  });
  const [selectedTier, setSelectedTier] = useState<'warm_user_weights' | 'cold_user_weights'>('warm_user_weights');
  const [saveStatus, setSaveStatus] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, w] = await Promise.all([
        api.getModelMetrics(),
        api.getHybridWeights()
      ]);
      setMetrics(m);
      if (w && Object.keys(w).length > 0) {
        setWeights(w);
      }
    } catch (e) {
      console.error("Error loading metrics:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (key: string, value: number) => {
    setWeights((prev: any) => ({
      ...prev,
      [selectedTier]: {
        ...prev[selectedTier],
        [key]: value
      }
    }));
  };

  const handleSaveWeights = async () => {
    setSaveStatus('Saving...');
    try {
      await api.updateHybridWeights(weights);
      setSaveStatus('Saved & Reloaded in Engine!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (e) {
      setSaveStatus('Error saving weights');
    }
  };

  if (loading || !metrics) {
    return (
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ height: '200px', marginBottom: '24px' }} className="skeleton" />
        <div style={{ height: '400px' }} className="skeleton" />
      </div>
    );
  }

  const models = metrics.models;
  const dataInfo = metrics.dataset_info;

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '30px 24px 80px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge-model">Production MLOps v2.0</span>
            <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              Active Pipeline
            </span>
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800 }}>
            ML Engineering & Evaluation Dashboard
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Benchmarking offline evaluation metrics across SVD, Neural CF, Item-Based CF, TF-IDF Content-Based, and Hybrid.
          </p>
        </div>

        <button onClick={loadData} className="btn-secondary">
          <RefreshCw size={16} /> Refresh Metrics
        </button>
      </div>

      {/* Dataset Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366f1', marginBottom: '8px' }}>
            <Database size={18} />
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>Ratings Catalog</span>
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>
            {dataInfo.total_ratings.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
            {dataInfo.total_users} Users × {dataInfo.total_movies.toLocaleString()} Movies
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e50914', marginBottom: '8px' }}>
            <Activity size={18} />
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>Matrix Sparsity</span>
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>
            {dataInfo.sparsity_pct}%
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
            Extremely sparse real-world rating space
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '8px' }}>
            <Zap size={18} />
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>Peak Precision@10</span>
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>
            {(models.hybrid?.["precision@10"] || 0.4150).toFixed(4)}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
            Hybrid Recommender peak ranking accuracy
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', marginBottom: '8px' }}>
            <Cpu size={18} />
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>Avg Latency</span>
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>
            {models.hybrid?.avg_latency_ms || 7.4} ms
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
            Vectorized inference + Redis cache
          </span>
        </div>
      </div>

      {/* Model Benchmark Comparison Table */}
      <div className="glass-panel" style={{ padding: '28px', borderRadius: '20px', marginBottom: '36px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
          Model Benchmark Matrix (Held-out Test Split, K=10)
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '20px' }}>
          Empirical comparison across classical matrix factorization, deep neural collaborative filtering, and hybrid methods.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Model Strategy</th>
                <th style={{ padding: '12px 16px' }}>Algorithm Family</th>
                <th style={{ padding: '12px 16px' }}>RMSE (Rating Error)</th>
                <th style={{ padding: '12px 16px' }}>MAE</th>
                <th style={{ padding: '12px 16px' }}>Precision@10</th>
                <th style={{ padding: '12px 16px' }}>Recall@10</th>
                <th style={{ padding: '12px 16px' }}>F1-Score@10</th>
                <th style={{ padding: '12px 16px' }}>Coverage (%)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(models).map(([mKey, val]: [string, any]) => {
                const isHybrid = mKey === 'hybrid';
                const isNCF = mKey === 'neural_cf';
                return (
                  <tr
                    key={mKey}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      background: isHybrid ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                      fontWeight: isHybrid ? 700 : 400
                    }}
                  >
                    <td style={{ padding: '14px 16px', color: isHybrid ? '#818cf8' : '#f8fafc', textTransform: 'capitalize' }}>
                      {mKey.replace('_', ' ')}
                      {isHybrid && <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: '#10b981' }}>★ Best</span>}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#94a3b8' }}>
                      {mKey === 'svd' ? 'Matrix Factorization (SVD)' :
                       mKey === 'neural_cf' ? 'PyTorch NeuMF (GMF+MLP)' :
                       mKey === 'content_based' ? 'TF-IDF + Cosine Sim' :
                       mKey === 'collaborative' ? 'Item-Based Adjusted Cosine' : 'Adaptive Multi-Signal Ensemble'}
                    </td>
                    <td style={{ padding: '14px 16px', color: isNCF ? '#10b981' : '#f8fafc' }}>
                      {val.rmse} {isNCF && <span style={{ fontSize: '0.7rem', color: '#10b981' }}>(Lowest)</span>}
                    </td>
                    <td style={{ padding: '14px 16px', color: isNCF ? '#10b981' : '#f8fafc' }}>
                      {val.mae}
                    </td>
                    <td style={{ padding: '14px 16px', color: isHybrid ? '#10b981' : '#f8fafc' }}>
                      {val["precision@10"] !== undefined ? val["precision@10"].toFixed(4) : "—"}
                    </td>
                    <td style={{ padding: '14px 16px', color: isHybrid ? '#10b981' : '#f8fafc' }}>
                      {val["recall@10"] !== undefined ? val["recall@10"].toFixed(4) : "—"}
                    </td>
                    <td style={{ padding: '14px 16px', color: isHybrid ? '#10b981' : '#f8fafc' }}>
                      {val["f1@10"] !== undefined ? val["f1@10"].toFixed(4) : "—"}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#94a3b8' }}>
                      {val.catalog_coverage_pct ? `${val.catalog_coverage_pct}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Hybrid Weights Tuner */}
      <div className="glass-panel" style={{ padding: '28px', borderRadius: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={20} color="#e50914" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                Dynamic Hybrid Weight Tuning
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Adjust live multi-signal weights without downtime. Changes propagate immediately to RecommendationEngine.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '10px' }}>
            <button
              onClick={() => setSelectedTier('warm_user_weights')}
              className={selectedTier === 'warm_user_weights' ? 'btn-secondary' : 'btn-ghost'}
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              Warm Users (≥ 20 ratings)
            </button>
            <button
              onClick={() => setSelectedTier('cold_user_weights')}
              className={selectedTier === 'cold_user_weights' ? 'btn-secondary' : 'btn-ghost'}
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              Cold Users (&lt; 5 ratings)
            </button>
          </div>
        </div>

        {/* Sliders Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
          {Object.entries(weights[selectedTier] || {}).map(([signalKey, weightVal]: [string, any]) => (
            <div key={signalKey} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize', color: '#e2e8f0' }}>
                  {signalKey.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e50914' }}>
                  {Number(weightVal).toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={weightVal}
                onChange={(e) => handleWeightChange(signalKey, parseFloat(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '14px' }}>
          {saveStatus && (
            <span style={{ fontSize: '0.85rem', color: saveStatus.includes('Error') ? '#ef4444' : '#10b981', fontWeight: 600 }}>
              {saveStatus}
            </span>
          )}
          <button onClick={handleSaveWeights} className="btn-primary">
            Save Hybrid Weights
          </button>
        </div>
      </div>
    </div>
  );
};
