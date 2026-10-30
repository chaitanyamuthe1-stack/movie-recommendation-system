import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './context/ToastContext';
import { Movie } from './types';
import { api } from './services/api';

const MOODS = [
  { label: '😂 Feel-good', query: 'Uplifting feel-good comedies and heartwarming films' },
  { label: '🧠 Mind-bending', query: 'Mind-bending psychological thrillers with twists' },
  { label: '😱 Edge of seat', query: 'Intense edge-of-your-seat suspenseful thrillers' },
  { label: '💔 Heartfelt', query: 'Emotional heartfelt dramas with deep relationships' },
  { label: '🚀 Epic sci-fi', query: 'Epic visionary sci-fi adventures in space' }
];

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [currentUserId, setCurrentUserId] = useState<number>(1);
  
  // Modals & Drawers
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [explanationMovie, setExplanationMovie] = useState<Movie | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [assistantQuery, setAssistantQuery] = useState<string>('');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // Shelves Data
  const [hybridRecs, setHybridRecs] = useState<Movie[]>([]);
  const [svdRecs, setSvdRecs] = useState<Movie[]>([]);
  const [neuralRecs, setNeuralRecs] = useState<Movie[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [becauseLikedMovies, setBecauseLikedMovies] = useState<Movie[]>([]);
  const [likedSeedTitle, setLikedSeedTitle] = useState<string>('Inception');

  // Genre Shelves
  const [actionMovies, setActionMovies] = useState<Movie[]>([]);
  const [sciFiMovies, setSciFiMovies] = useState<Movie[]>([]);
  const [dramaMovies, setDramaMovies] = useState<Movie[]>([]);
  const [comedyMovies, setComedyMovies] = useState<Movie[]>([]);
  const [thrillerMovies, setThrillerMovies] = useState<Movie[]>([]);
  const [animationMovies, setAnimationMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Track if persona 999 onboarding has been prompted
  const prompted999Ref = useRef<boolean>(false);

  const loadHomeShelves = useCallback(async () => {
    setLoading(true);
    try {
      const [
        hybrid,
        svd,
        neural,
        trending,
        action,
        scifi,
        drama,
        comedy,
        thriller,
        animation,
        userRatings
      ] = await Promise.all([
        api.getUserRecommendations(currentUserId, 'hybrid', 15),
        api.getUserRecommendations(currentUserId, 'svd', 12),
        api.getUserRecommendations(currentUserId, 'neural_cf', 12),
        api.getTrending(15),
        api.getMovies(1, 12, 'Action', 'popularity'),
        api.getMovies(1, 12, 'Science Fiction', 'popularity'),
        api.getMovies(1, 12, 'Drama', 'vote_average'),
        api.getMovies(1, 12, 'Comedy', 'popularity'),
        api.getMovies(1, 12, 'Thriller', 'vote_average'),
        api.getMovies(1, 12, 'Animation', 'popularity'),
        api.getUserRatings(currentUserId)
      ]);

      setHybridRecs(hybrid.items || []);
      setSvdRecs(svd.items || []);
      setNeuralRecs(neural.items || []);
      setTrendingMovies(trending || []);
      setActionMovies(action.items || []);
      setSciFiMovies(scifi.items || []);
      setDramaMovies(drama.items || []);
      setComedyMovies(comedy.items || []);
      setThrillerMovies(thriller.items || []);
      setAnimationMovies(animation.items || []);

      // Determine "Because you liked X" shelf seed
      let seedMovieId = 79132; // Inception fallback
      let seedTitle = 'Inception';
      if (userRatings && userRatings.length > 0) {
        // Find highest rated movie
        const topRated = [...userRatings].sort((a, b) => b.rating - a.rating)[0];
        if (topRated) {
          seedMovieId = topRated.movie_id;
          seedTitle = topRated.movie_title || 'your top pick';
        }
      } else if (hybrid.items && hybrid.items.length > 0) {
        seedMovieId = hybrid.items[0].id || (hybrid.items[0] as any).movie_id || 79132;
        seedTitle = hybrid.items[0].title;
      }
      setLikedSeedTitle(seedTitle);

      // Fetch similar movies for that seed
      try {
        const similarRes = await api.getSimilarMovies(seedMovieId, 12);
        setBecauseLikedMovies(similarRes || []);
      } catch (simErr) {
        console.error("Failed to load similar movies for seed:", simErr);
      }
    } catch (e) {
      console.error("Failed to load movie shelves:", e);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadHomeShelves();

    // Auto-prompt onboarding for persona 999 on first switch
    if (currentUserId === 999 && !prompted999Ref.current) {
      prompted999Ref.current = true;
      setIsOnboardingOpen(true);
    }
  }, [currentUserId, loadHomeShelves]);

  const handleOpenDetails = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  const handleOpenExplanation = (movie: Movie) => {
    setExplanationMovie(movie);
  };

  const askAssistantWithMood = (moodQuery: string) => {
    setAssistantQuery(moodQuery);
    setIsAssistantOpen(true);
  };

  const shelfProps = {
    onOpenDetails: handleOpenDetails,
    onOpenExplanation: handleOpenExplanation,
    loading
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUserId={currentUserId}
        setCurrentUserId={setCurrentUserId}
        openAssistant={() => {
          setAssistantQuery('');
          setIsAssistantOpen(true);
        }}
        openOnboarding={() => setIsOnboardingOpen(true)}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'home' && (
          <div style={{ maxWidth: 1360, margin: '0 auto', padding: '26px 24px 80px' }}>
            <HeroBanner
              movie={hybridRecs[0] || trendingMovies[0]}
              movies={hybridRecs.slice(0, 5)}
              onOpenDetails={handleOpenDetails}
              onOpenExplanation={handleOpenExplanation}
            />

            {/* Tonight I Want Mood Bar */}
            <div className="mood-bar">
              <span className="mood-label">Tonight I want</span>
              {MOODS.map(m => (
                <button
                  key={m.label}
                  className="mood-chip"
                  onClick={() => askAssistantWithMood(m.query)}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* 1. Picked For You (Hybrid) */}
            <MovieShelf
              kicker="HYBRID ENSEMBLE"
              title="Picked for you"
              subtitle="Collaborative patterns, content affinity, and deep learning, blended and diversified with MMR."
              movies={hybridRecs}
              {...shelfProps}
            />

            {/* 2. Trending Now (Ranked) */}
            <MovieShelf
              kicker="COMMUNITY FAVORITES"
              title="Trending now"
              ranked
              subtitle="Bayesian weighted-average ranking computed across thousands of catalog reviews."
              movies={trendingMovies}
              {...shelfProps}
            />

            {/* 3. Because you liked X (Item Similarity) */}
            {becauseLikedMovies.length > 0 && (
              <MovieShelf
                kicker="ITEM-TO-ITEM SIMILARITY"
                title={`Because you liked ${likedSeedTitle}`}
                subtitle={`High-dimensional metadata affinity match anchored on ${likedSeedTitle}.`}
                movies={becauseLikedMovies}
                {...shelfProps}
              />
            )}

            {/* 4. SVD Hidden Latent Matches */}
            <MovieShelf
              kicker="SVD MATRIX FACTORIZATION"
              title="Hidden latent matches"
              subtitle="Films that share invisible taste factors with what you already love."
              movies={svdRecs}
              {...shelfProps}
            />

            {/* 5. NeuMF Picks */}
            <MovieShelf
              kicker="PYTORCH NEUMF"
              title="Neural network picks"
              subtitle="Non-linear user-movie interaction embeddings learned by our deep neural architecture."
              movies={neuralRecs}
              {...shelfProps}
            />

            {/* Genre Shelves */}
            <MovieShelf kicker="GENRE · ACTION" title="High-octane action" movies={actionMovies} {...shelfProps} />
            <MovieShelf kicker="GENRE · SCI-FI" title="Visionary sci-fi" movies={sciFiMovies} {...shelfProps} />
            <MovieShelf kicker="GENRE · DRAMA" title="Critically acclaimed drama" movies={dramaMovies} {...shelfProps} />
            <MovieShelf kicker="GENRE · COMEDY" title="Feel-good comedies" movies={comedyMovies} {...shelfProps} />
            <MovieShelf kicker="GENRE · THRILLER" title="Edge-of-your-seat thrillers" movies={thrillerMovies} {...shelfProps} />
            <MovieShelf kicker="GENRE · ANIMATION" title="Animated masterworks" movies={animationMovies} {...shelfProps} />
          </div>
        )}

        {activeTab === 'search' && (
          <SearchPage
            onOpenDetails={handleOpenDetails}
            onOpenExplanation={handleOpenExplanation}
            onOpenAssistant={() => {
              setAssistantQuery('');
              setIsAssistantOpen(true);
            }}
          />
        )}

        {activeTab === 'dashboard' && (
          <MLDashboard onReRankLive={loadHomeShelves} />
        )}

        {activeTab === 'profile' && (
          <ProfilePage
            userId={currentUserId}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onOpenDetails={handleOpenDetails}
          />
        )}
      </main>

      <footer className="footer">
        <b>CineAI</b>
        <p style={{ marginTop: 4 }}>Movies picked by machine learning, explained in plain English.</p>
        <div className="stack">
          {['MovieLens 100K', 'TMDB 5000', 'TF-IDF', 'Item CF', 'SVD', 'PyTorch NeuMF', 'MMR Diversity', 'FastAPI', 'React 19', 'TypeScript'].map(t => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </footer>

      {/* Modals & Drawers */}
      <MovieDetailModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        currentUserId={currentUserId}
        onOpenExplanation={handleOpenExplanation}
        onSelectMovie={handleOpenDetails}
        onRated={loadHomeShelves}
      />

      <ExplanationModal
        movie={explanationMovie}
        userId={currentUserId}
        onClose={() => setExplanationMovie(null)}
      />

      <OnboardingModal
        userId={currentUserId}
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onCompleted={loadHomeShelves}
      />

      <AssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        userId={currentUserId}
        initialQuery={assistantQuery}
        onOpenDetails={handleOpenDetails}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
