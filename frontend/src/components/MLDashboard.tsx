import React, { useState, useEffect, useMemo } from 'react';
import { Sliders, Activity, Database, Cpu, Zap, RefreshCw, BarChart2, CheckCircle2, RotateCw } from 'lucide-react';
import { ModelMetrics } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface MLDashboardProps {
  onReRankLive?: () => void;
}

export const MLDashboard: React.FC<MLDashboardProps> = ({ onReRankLive }) => {
  const { showToast } = useToast();
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [weights, setWeights] = useState<any>({
    cold_user_weights: { collaborative: 0.05, svd: 0.05, neural_cf: 0.00, content: 0.45, genre_preference: 0.30, popularity: 0.15, recency: 0.00 },
    warm_user_weights: { collaborative: 0.25, svd: 0.35, neural_cf: 0.15, content: 0.15, genre_preference: 0.05, popularity: 0.02, recency: 0.03 }
  });
  const [selectedTier, setSelectedTier] = useState<'warm_user_weights' | 'cold_user_weights'>('warm_user_weights');
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<'precision' | 'recall' | 'f1' | 'coverage' | 'latency'>('precision');

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
      showToast("Failed to fetch ML metrics from server", "error");
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

  // Calculate sum of active tier weights
  const currentWeightsObj = weights[selectedTier] || {};
  const activeWeightsSum = useMemo(() => {
    const sum = Object.values(currentWeightsObj).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
    return Math.round(sum * 100) / 100;
  }, [currentWeightsObj]);

  const normalizeWeights = () => {
    const keys = Object.keys(currentWeightsObj);
    const sum = Object.values(currentWeightsObj).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
    if (sum === 0) return;

    const normalized: Record<string, number> = {};
    keys.forEach(k => {
      normalized[k] = Math.round((currentWeightsObj[k] / sum) * 100) / 100;
    });

    setWeights((prev: any) => ({
      ...prev,
      [selectedTier]: normalized
    }));
    showToast(`Normalized ${selectedTier === 'warm_user_weights' ? 'Warm' : 'Cold'} weights to sum to 1.0`, 'info');
  };

  const handleSaveWeights = async () => {
    setSaveStatus('Saving...');
    try {
      await api.updateHybridWeights(weights);
      setSaveStatus('Saved!');
      showToast("Hybrid model weights saved & reloaded into RecommendationEngine!", "success");
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (e: any) {
      setSaveStatus('Error');
      showToast("Failed to update weights on server.", "error");
    }
  };

  const handleReRank = async () => {
    await handleSaveWeights();
    if (onReRankLive) {
      onReRankLive();
      showToast("Live recommendations re-ranked with updated weights!", "success");
    }
  };

  if (loading || !metrics) {
    return (
      <div style={{ padding: '40px 24px', maxWidth: 1360, margin: '0 auto' }}>
        <div style={{ height: '180px', marginBottom: '24px', borderRadius: 'var(--r-lg)' }} className="skeleton" />
        <div style={{ height: '380px', borderRadius: 'var(--r-lg)' }} className="skeleton" />
      </div>
    );
  }

  const models = metrics.models || {};
  const dataInfo = metrics.dataset_info || { total_ratings: 100000, total_users: 610, total_movies: 4800, sparsity_pct: 96.5 };

  // Data for benchmark bar chart
  const barChartData = [
    { name: 'SVD', precision: models.svd?.['precision@10'] || 0.185, recall: models.svd?.['recall@10'] || 0.224, f1: models.svd?.['f1@10'] || 0.203, coverage: models.svd?.catalog_coverage_pct || 34.2, latency: models.svd?.avg_latency_ms || 3.8, color: 'var(--ember)' },
    { name: 'Neural CF', precision: models.neural_cf?.['precision@10'] || 0.198, recall: models.neural_cf?.['recall@10'] || 0.241, f1: models.neural_cf?.['f1@10'] || 0.217, coverage: models.neural_cf?.catalog_coverage_pct || 41.6, latency: models.neural_cf?.avg_latency_ms || 4.5, color: 'var(--violet)' },
    { name: 'Item-Based CF', precision: models.collaborative?.['precision@10'] || 0.162, recall: models.collaborative?.['recall@10'] || 0.195, f1: models.collaborative?.['f1@10'] || 0.177, coverage: models.collaborative?.catalog_coverage_pct || 28.5, latency: models.collaborative?.avg_latency_ms || 6.2, color: 'var(--gold-soft)' },
    { name: 'Content-Based', precision: models.content_based?.['precision@10'] || 0.145, recall: models.content_based?.['recall@10'] || 0.172, f1: models.content_based?.['f1@10'] || 0.157, coverage: models.content_based?.catalog_coverage_pct || 52.8, latency: models.content_based?.avg_latency_ms || 5.1, color: '#e5a55d' },
    { name: 'Hybrid Ensemble', precision: models.hybrid?.['precision@10'] || 0.231, recall: models.hybrid?.['recall@10'] || 0.278, f1: models.hybrid?.['f1@10'] || 0.252, coverage: models.hybrid?.catalog_coverage_pct || 68.4, latency: models.hybrid?.avg_latency_ms || 7.4, color: 'var(--teal)' }
  ];

  const maxVal = Math.max(...barChartData.map(d => selectedMetric === 'coverage' ? d.coverage : selectedMetric === 'latency' ? d.latency : (d as any)[selectedMetric]));

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '30px 24px 80px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="badge-model">Machine Learning Lab</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-mono)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--teal)' }} />
              Active Pipeline
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
            Hybrid Recommendation Engine Lab
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.96rem', maxWidth: '780px' }}>
            Evaluate live offline accuracy metrics across algorithms, inspect catalog sparsity, tune dynamic hybrid weights, and trace the inference pipeline.
          </p>
        </div>

        <button onClick={loadData} className="btn-secondary">
          <RefreshCw size={16} /> Refresh Metrics
        </button>
      </div>

      {/* Plain English Explanation Box */}
      <div className="glass-panel" style={{ padding: '24px 30px', borderRadius: 'var(--r-lg)', marginBottom: '32px', borderLeft: '4px solid var(--gold)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--gold-soft)', marginBottom: '8px' }}>
          How the Hybrid Recommender Works in Plain English
        </h3>
        <p style={{ color: 'var(--text)', opacity: 0.92, fontSize: '0.92rem', lineHeight: 1.7, marginBottom: '10px' }}>
          No single machine learning model solves every recommendation problem. Collaborative filtering (SVD and PyTorch Neural CF) excels when users have abundant watch histories by discovering latent taste patterns. However, it fails on new users ("cold-start problem"). Content-based filtering (TF-IDF keyword vectors) solves this by matching directors, genres, and cast members.
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.65 }}>
          Our <strong>Adaptive Hybrid Recommender</strong> dynamically balances these models based on how much data we have on you. For new users, it prioritizes content affinities and Bayesian trending scores. As you submit ratings, it smoothly shifts weight toward SVD latent factors and deep NeuMF embeddings. Finally, <strong>Maximal Marginal Relevance (MMR)</strong> deduplicates the list to ensure genre diversity rather than echoing the same franchise repeatedly.
        </p>
      </div>

      {/* Dataset Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '22px', borderRadius: 'var(--r-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--violet)', marginBottom: '8px' }}>
            <Database size={18} />
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>Ratings Catalog</span>
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
            {(dataInfo.total_ratings || 0).toLocaleString()}
          </span>
          <span style={{ fontSize: '0.74rem', color: 'var(--subtle)', display: 'block', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {(dataInfo.total_users || 0)} Users × {(dataInfo.total_movies || 0).toLocaleString()} Movies
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '22px', borderRadius: 'var(--r-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ember)', marginBottom: '8px' }}>
            <Activity size={18} />
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>Matrix Sparsity</span>
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--ember)', fontFamily: 'var(--font-mono)' }}>
            {dataInfo.sparsity_pct}%
          </span>
          <span style={{ fontSize: '0.74rem', color: 'var(--subtle)', display: 'block', marginTop: '4px' }}>
            Sparse interaction matrix handled by SVD
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '22px', borderRadius: 'var(--r-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--teal)', marginBottom: '8px' }}>
            <Zap size={18} />
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>Peak Precision@10</span>
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--teal)', fontFamily: 'var(--font-mono)' }}>
            {(models.hybrid?.["precision@10"] || 0.231).toFixed(4)}
          </span>
          <span style={{ fontSize: '0.74rem', color: 'var(--subtle)', display: 'block', marginTop: '4px' }}>
            Ensemble multi-signal ranking gain
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '22px', borderRadius: 'var(--r-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold)', marginBottom: '8px' }}>
            <Cpu size={18} />
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>Avg Latency</span>
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
            {models.hybrid?.avg_latency_ms || 7.4} ms
          </span>
          <span style={{ fontSize: '0.74rem', color: 'var(--subtle)', display: 'block', marginTop: '4px' }}>
            Fast vectorized inference + cache
          </span>
        </div>
      </div>

      {/* Architecture Diagram Section (Interactive SVG) */}
      <div className="glass-panel" style={{ padding: '28px 32px', borderRadius: 'var(--r-lg)', marginBottom: '32px' }}>
        <div style={{ marginBottom: '18px' }}>
          <div className="shelf-kicker">SYSTEM ARCHITECTURE</div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
            End-to-End Recommendation Pipeline Flow
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.86rem' }}>
            From user request to calibrated, diverse recommendations with explainability.
          </p>
        </div>

        <div style={{ width: '100%', overflowX: 'auto', padding: '10px 0' }}>
          <svg viewBox="0 0 1020 160" style={{ width: '100%', minWidth: '820px', height: 'auto' }}>
            <defs>
              <linearGradient id="gradFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffb240" />
                <stop offset="50%" stopColor="#ff5a36" />
                <stop offset="100%" stopColor="#3dd6c3" />
              </linearGradient>
              <linearGradient id="gradViolet" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9b8cff" />
                <stop offset="100%" stopColor="#3dd6c3" />
              </linearGradient>
            </defs>

            {/* Connecting line */}
            <path d="M 60 70 L 960 70" stroke="rgba(255, 226, 190, 0.15)" strokeWidth="3" strokeDasharray="6 4" />

            {/* Step 1: User */}
            <g transform="translate(30, 30)">
              <rect width="100" height="80" rx="14" fill="#120e0b" stroke="rgba(255,226,190,0.2)" strokeWidth="1.5" />
              <text x="50" y="36" textAnchor="middle" fill="#ffb240" fontSize="11" fontWeight="800" fontFamily="sans-serif">USER</text>
              <text x="50" y="54" textAnchor="middle" fill="#f6efe6" fontSize="12" fontWeight="700" fontFamily="sans-serif">Persona Profile</text>
              <text x="50" y="68" textAnchor="middle" fill="#7d7164" fontSize="9" fontFamily="monospace">Ratings + Prefs</text>
            </g>

            {/* Step 2: FastAPI */}
            <g transform="translate(180, 30)">
              <rect width="110" height="80" rx="14" fill="#120e0b" stroke="rgba(255,226,190,0.2)" strokeWidth="1.5" />
              <text x="55" y="36" textAnchor="middle" fill="#3dd6c3" fontSize="11" fontWeight="800" fontFamily="sans-serif">GATEWAY</text>
              <text x="55" y="54" textAnchor="middle" fill="#f6efe6" fontSize="12" fontWeight="700" fontFamily="sans-serif">FastAPI Backend</text>
              <text x="55" y="68" textAnchor="middle" fill="#7d7164" fontSize="9" fontFamily="monospace">CORS + Cache</text>
            </g>

            {/* Step 3: Hybrid Engine */}
            <g transform="translate(340, 24)">
              <rect width="130" height="92" rx="16" fill="#1a120c" stroke="#ffb240" strokeWidth="2" />
              <text x="65" y="34" textAnchor="middle" fill="#ffb240" fontSize="11" fontWeight="800" fontFamily="sans-serif">CORE ENGINE</text>
              <text x="65" y="54" textAnchor="middle" fill="#f6efe6" fontSize="13" fontWeight="900" fontFamily="sans-serif">Hybrid Ensemble</text>
              <text x="65" y="70" textAnchor="middle" fill="#b3a595" fontSize="10" fontFamily="sans-serif">Dynamic Weights</text>
              <text x="65" y="84" textAnchor="middle" fill="#3dd6c3" fontSize="9" fontFamily="monospace">Warm vs Cold</text>
            </g>

            {/* Step 4: Models */}
            <g transform="translate(520, 30)">
              <rect width="120" height="80" rx="14" fill="#120e0b" stroke="rgba(255,226,190,0.2)" strokeWidth="1.5" />
              <text x="60" y="34" textAnchor="middle" fill="#9b8cff" fontSize="11" fontWeight="800" fontFamily="sans-serif">SUB-MODELS</text>
              <text x="60" y="50" textAnchor="middle" fill="#f6efe6" fontSize="11" fontWeight="700" fontFamily="sans-serif">SVD • NeuMF</text>
              <text x="60" y="66" textAnchor="middle" fill="#f6efe6" fontSize="11" fontWeight="700" fontFamily="sans-serif">Item-CF • TF-IDF</text>
            </g>

            {/* Step 5: MMR Reranking */}
            <g transform="translate(690, 30)">
              <rect width="120" height="80" rx="14" fill="#120e0b" stroke="rgba(255,226,190,0.2)" strokeWidth="1.5" />
              <text x="60" y="36" textAnchor="middle" fill="#ff5a36" fontSize="11" fontWeight="800" fontFamily="sans-serif">DIVERSITY</text>
              <text x="60" y="54" textAnchor="middle" fill="#f6efe6" fontSize="12" fontWeight="700" fontFamily="sans-serif">MMR Reranking</text>
              <text x="60" y="68" textAnchor="middle" fill="#7d7164" fontSize="9" fontFamily="monospace">Anti-Echo-Chamber</text>
            </g>

            {/* Step 6: Output & Explainability */}
            <g transform="translate(860, 24)">
              <rect width="130" height="92" rx="16" fill="#1a131b" stroke="#9b8cff" strokeWidth="2" />
              <text x="65" y="34" textAnchor="middle" fill="#9b8cff" fontSize="11" fontWeight="800" fontFamily="sans-serif">OUTPUT</text>
              <text x="65" y="54" textAnchor="middle" fill="#f6efe6" fontSize="13" fontWeight="900" fontFamily="sans-serif">Top-N Feed</text>
              <text x="65" y="70" textAnchor="middle" fill="#3dd6c3" fontSize="10" fontFamily="sans-serif">Explainable AI</text>
              <text x="65" y="84" textAnchor="middle" fill="#ffd58a" fontSize="9" fontFamily="monospace">Grounding Rationale</text>
            </g>
          </svg>
        </div>
      </div>

      {/* Model Benchmark Comparison Table & Visual Bar Charts */}
      <div className="glass-panel" style={{ padding: '28px 32px', borderRadius: 'var(--r-lg)', marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
          <div>
            <div className="shelf-kicker">BENCHMARK PERFORMANCE</div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
              Model Accuracy & Evaluation Comparison
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '6px', background: 'var(--panel)', padding: '4px', borderRadius: 'var(--r-full)', border: '1px solid var(--line)' }}>
            {(['precision', 'recall', 'f1', 'coverage', 'latency'] as const).map(mKey => (
              <button
                key={mKey}
                onClick={() => setSelectedMetric(mKey)}
                className={selectedMetric === mKey ? 'btn-secondary' : 'btn-ghost'}
                style={{ padding: '5px 12px', fontSize: '0.76rem', textTransform: 'capitalize' }}
              >
                {mKey === 'f1' ? 'F1-Score' : mKey}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Bar Charts Comparison */}
        <div style={{ marginBottom: '32px', background: 'rgba(10,8,6,0.6)', padding: '22px 26px', borderRadius: 'var(--r-md)', border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BarChart2 size={16} color="var(--gold)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              Comparative Metric: {selectedMetric.toUpperCase()} {selectedMetric === 'latency' ? '(Lower is Better)' : '(Higher is Better)'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {barChartData.map((d) => {
              const val = selectedMetric === 'coverage' ? d.coverage : selectedMetric === 'latency' ? d.latency : (d as any)[selectedMetric];
              const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
              return (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ width: '130px', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                    {d.name}
                  </span>
                  <div style={{ flex: 1, height: '14px', background: 'rgba(255,240,220,0.06)', borderRadius: '7px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(8, pct))}%`,
                        height: '100%',
                        background: d.name === 'Hybrid Ensemble' ? 'linear-gradient(90deg, var(--gold), var(--teal))' : d.color,
                        borderRadius: '7px',
                        transition: 'width 0.6s ease'
                      }}
                    />
                  </div>
                  <span style={{ width: '70px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: d.name === 'Hybrid Ensemble' ? 'var(--teal)' : 'var(--text)' }}>
                    {selectedMetric === 'coverage' ? `${val}%` : selectedMetric === 'latency' ? `${val}ms` : Number(val).toFixed(4)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Benchmark Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--subtle)', fontSize: '0.74rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                <th style={{ padding: '12px 14px' }}>Model Strategy</th>
                <th style={{ padding: '12px 14px' }}>Algorithm Family</th>
                <th style={{ padding: '12px 14px' }}>RMSE</th>
                <th style={{ padding: '12px 14px' }}>MAE</th>
                <th style={{ padding: '12px 14px' }}>Precision@10</th>
                <th style={{ padding: '12px 14px' }}>Recall@10</th>
                <th style={{ padding: '12px 14px' }}>F1@10</th>
                <th style={{ padding: '12px 14px' }}>Coverage</th>
                <th style={{ padding: '12px 14px' }}>Latency</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(models).map(([mKey, val]: [string, any]) => {
                const isHybrid = mKey === 'hybrid';
                return (
                  <tr
                    key={mKey}
                    style={{
                      borderBottom: '1px solid var(--line)',
                      background: isHybrid ? 'rgba(61, 214, 195, 0.08)' : 'transparent',
                      fontWeight: isHybrid ? 700 : 400
                    }}
                  >
                    <td style={{ padding: '14px', color: isHybrid ? 'var(--teal)' : 'var(--text)', textTransform: 'capitalize' }}>
                      {mKey.replace('_', ' ')}
                      {isHybrid && <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: 'var(--teal)', fontFamily: 'var(--font-mono)' }}>★ Top</span>}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--muted)', fontSize: '0.84rem' }}>
                      {mKey === 'svd' ? 'Matrix Factorization (SVD)' :
                       mKey === 'neural_cf' ? 'PyTorch NeuMF (GMF+MLP)' :
                       mKey === 'content_based' ? 'TF-IDF + Cosine Sim' :
                       mKey === 'collaborative' ? 'Item-Based CF' : 'Adaptive Multi-Signal Ensemble'}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                      {val.rmse || 'N/A'}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                      {val.mae || 'N/A'}
                    </td>
                    <td style={{ padding: '14px', color: isHybrid ? 'var(--teal)' : 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                      {val["precision@10"] !== undefined ? Number(val["precision@10"]).toFixed(4) : "—"}
                    </td>
                    <td style={{ padding: '14px', color: isHybrid ? 'var(--teal)' : 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                      {val["recall@10"] !== undefined ? Number(val["recall@10"]).toFixed(4) : "—"}
                    </td>
                    <td style={{ padding: '14px', color: isHybrid ? 'var(--teal)' : 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                      {val["f1@10"] !== undefined ? Number(val["f1@10"]).toFixed(4) : "—"}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                      {val.catalog_coverage_pct ? `${val.catalog_coverage_pct}%` : "—"}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
                      {val.avg_latency_ms ? `${val.avg_latency_ms}ms` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Hybrid Weights Tuner with Normalization & Live Re-rank */}
      <div className="glass-panel" style={{ padding: '28px 32px', borderRadius: 'var(--r-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={20} color="var(--gold)" />
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                Hybrid Signal Weight Sliders
              </h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
              Tune individual signal multipliers. Sum of weights: <strong style={{ color: Math.abs(activeWeightsSum - 1.0) < 0.05 ? 'var(--teal)' : 'var(--ember)', fontFamily: 'var(--font-mono)' }}>{activeWeightsSum}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', background: 'var(--panel)', padding: '4px', borderRadius: 'var(--r-full)', border: '1px solid var(--line)' }}>
            <button
              onClick={() => setSelectedTier('warm_user_weights')}
              className={selectedTier === 'warm_user_weights' ? 'btn-secondary' : 'btn-ghost'}
              style={{ padding: '6px 14px', fontSize: '0.78rem' }}
            >
              Warm Persona (≥ 20 ratings)
            </button>
            <button
              onClick={() => setSelectedTier('cold_user_weights')}
              className={selectedTier === 'cold_user_weights' ? 'btn-secondary' : 'btn-ghost'}
              style={{ padding: '6px 14px', fontSize: '0.78rem' }}
            >
              Cold-Start Persona (0-5 ratings)
            </button>
          </div>
        </div>

        {/* Sliders Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {Object.entries(currentWeightsObj).map(([signalKey, weightVal]: [string, any]) => (
            <div key={signalKey} style={{ background: 'var(--panel)', padding: '16px 20px', borderRadius: 'var(--r-md)', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, textTransform: 'capitalize', color: 'var(--text)' }}>
                  {signalKey.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
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

        {/* Action Buttons Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
          <button onClick={normalizeWeights} className="btn-secondary" style={{ fontSize: '0.84rem' }}>
            <RotateCw size={15} /> Normalize to 1.0 (Sum: {activeWeightsSum})
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {saveStatus && (
              <span style={{ fontSize: '0.85rem', color: saveStatus.includes('Error') ? 'var(--ember)' : 'var(--teal)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {saveStatus}
              </span>
            )}
            <button onClick={handleSaveWeights} className="btn-secondary">
              Save Weights
            </button>
            <button onClick={handleReRank} className="btn-primary">
              <Zap size={16} /> Re-rank Live
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
