import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { MovieShelf } from './components/MovieShelf';
import { MovieDetailModal } from './components/MovieDetailModal';
import { ExplanationModal } from './components/ExplanationModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AssistantDrawer } from './components/AssistantDrawer';
import { MLDashboard } from './components/MLDashboard';
import { SearchPage } from './components/SearchPage';
import { ProfilePage } from './components/ProfilePage';
import { Movie } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [currentUserId, setCurrentUserId] = useState<number>(1);
  
  // Modals & Drawers
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [explanationMovie, setExplanationMovie] = useState<Movie | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // Shelves Data
  const [hybridRecs, setHybridRecs] = useState<Movie[]>([]);
  const [svdRecs, setSvdRecs] = useState<Movie[]>([]);
  const [neuralRecs, setNeuralRecs] = useState<Movie[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [actionMovies, setActionMovies] = useState<Movie[]>([]);
  const [sciFiMovies, setSciFiMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadHomeShelves();
  }, [currentUserId]);

  const loadHomeShelves = async () => {
    setLoading(true);
    try {
      const [hybrid, svd, neural, trending, action, scifi] = await Promise.all([
        api.getUserRecommendations(currentUserId, 'hybrid', 12),
        api.getUserRecommendations(currentUserId, 'svd', 10),
        api.getUserRecommendations(currentUserId, 'neural_cf', 10),
        api.getTrending(12),
        api.getMovies(1, 10, 'Action'),
        api.getMovies(1, 10, 'Science Fiction')
      ]);

      setHybridRecs(hybrid.items || []);
      setSvdRecs(svd.items || []);
      setNeuralRecs(neural.items || []);
      setTrendingMovies(trending || []);
      setActionMovies(action.items || []);
      setSciFiMovies(scifi.items || []);
    } catch (e) {
      console.error("Failed to load movie shelves:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  const handleOpenExplanation = (movie: Movie) => {
    setExplanationMovie(movie);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#07090e' }}>
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUserId={currentUserId}
        setCurrentUserId={setCurrentUserId}
        openAssistant={() => setIsAssistantOpen(true)}
        openOnboarding={() => setIsOnboardingOpen(true)}
      />

      {/* Main View Router */}
      <main style={{ flex: 1 }}>
        {activeTab === 'home' && (
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 28px 80px 28px' }}>
            {/* Hero Spotlight Banner */}
            <HeroBanner
              movie={hybridRecs[0] || trendingMovies[0]}
              onOpenDetails={handleOpenDetails}
              onOpenExplanation={handleOpenExplanation}
            />

            {/* Recommendation Shelves */}
            <MovieShelf
              title="Recommended For You"
              subtitle="Personalized multi-signal hybrid model combining collaborative patterns & content affinities"
              movies={hybridRecs}
              onOpenDetails={handleOpenDetails}
              onOpenExplanation={handleOpenExplanation}
              loading={loading}
            />

            <MovieShelf
              title="Trending Now"
              subtitle="Bayesian weighted community favorites across all 4,800+ catalog titles"
              movies={trendingMovies}
              onOpenDetails={handleOpenDetails}
              onOpenExplanation={handleOpenExplanation}
              loading={loading}
            />

            <MovieShelf
              title="Latent Factor Discoveries (SVD Matrix Factorization)"
              subtitle="Predictive ratings computed via singular value decomposition R ≈ P × Qᵀ"
              movies={svdRecs}
              onOpenDetails={handleOpenDetails}
              onOpenExplanation={handleOpenExplanation}
              loading={loading}
            />

            <MovieShelf
              title="Deep Neural Embeddings (PyTorch NeuMF)"
              subtitle="Learned non-linear user-item interaction features from multi-layer perceptron"
              movies={neuralRecs}
              onOpenDetails={handleOpenDetails}
              onOpenExplanation={handleOpenExplanation}
              loading={loading}
            />

            <MovieShelf
              title="High-Octane Action"
              subtitle="Top-tier action blockbusters and thrillers"
              movies={actionMovies}
              onOpenDetails={handleOpenDetails}
              onOpenExplanation={handleOpenExplanation}
              loading={loading}
            />

            <MovieShelf
              title="Visionary Science Fiction"
              subtitle="Mind-bending adventures and speculative concepts"
              movies={sciFiMovies}
              onOpenDetails={handleOpenDetails}
              onOpenExplanation={handleOpenExplanation}
              loading={loading}
            />
          </div>
        )}

        {activeTab === 'search' && (
          <SearchPage
            onOpenDetails={handleOpenDetails}
            onOpenExplanation={handleOpenExplanation}
          />
        )}

        {activeTab === 'dashboard' && (
          <MLDashboard />
        )}

        {activeTab === 'profile' && (
          <ProfilePage
            userId={currentUserId}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        background: '#0a0d14',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '30px 40px',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '0.85rem'
      }}>
        <p style={{ marginBottom: '6px' }}>
          <strong>CineAI Recommender Platform</strong> • Enterprise-Grade ML Recommendation Engine
        </p>
        <p>
          Powered by MovieLens 100K + TMDB 5000 • SVD Matrix Factorization • PyTorch NeuMF • TF-IDF Cosine Similarity • FastAPI • React
        </p>
      </footer>

      {/* Modals & Drawers */}
      <MovieDetailModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        currentUserId={currentUserId}
        onOpenExplanation={handleOpenExplanation}
        onSelectMovie={handleOpenDetails}
      />

      <ExplanationModal
        movie={explanationMovie}
        onClose={() => setExplanationMovie(null)}
      />

      <OnboardingModal
        userId={currentUserId}
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onCompleted={() => loadHomeShelves()}
      />

      <AssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        userId={currentUserId}
        onOpenDetails={handleOpenDetails}
      />
    </div>
  );
};

export default App;
