import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { CommandPalette } from './components/CommandPalette';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { FloatingCineBot } from './components/FloatingCineBot';
import { HeroBanner } from './components/HeroBanner';
import { MoodGrid } from './components/MoodGrid';
import { MovieShelf } from './components/MovieShelf';
import { MovieDetailModal } from './components/MovieDetailModal';
import { ExplanationModal } from './components/ExplanationModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AssistantDrawer } from './components/AssistantDrawer';
import { MLDashboard } from './components/MLDashboard';
import { SearchPage } from './components/SearchPage';
import { ProfilePage } from './components/ProfilePage';
import { CompareView } from './components/CompareView';
import { WatchlistView } from './components/WatchlistView';
import { AIWorkspace } from './components/AIWorkspace';
import { ErrorBoundary } from './components/ErrorBoundary';

import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { WatchlistProvider } from './context/WatchlistContext';
import { CompareProvider } from './context/CompareContext';
import { Movie } from './types';
import { api } from './services/api';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [currentUserId, setCurrentUserId] = useState<number>(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('cineverse_sidebar_collapsed') === 'true';
  });

  // Global Modals & Overlays
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
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

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('cineverse_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Cmd+K or Ctrl+K -> Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Escape -> close overlays
      if (e.key === 'Escape') {
        if (isCommandPaletteOpen) setIsCommandPaletteOpen(false);
        else if (isShortcutsOpen) setIsShortcutsOpen(false);
        else if (selectedMovie) setSelectedMovie(null);
        else if (explanationMovie) setExplanationMovie(null);
        else if (isAssistantOpen) setIsAssistantOpen(false);
        return;
      }

      // If typing in input, ignore single-key shortcuts
      if (isInput) return;

      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === '/') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      } else if (e.key === 'h' || e.key === 'H') {
        setActiveTab('home');
      } else if (e.key === 'w' || e.key === 'W') {
        setActiveTab('watchlist');
      } else if (e.key === 'c' || e.key === 'C') {
        setActiveTab('compare');
      } else if (e.key === 'a' || e.key === 'A') {
        setActiveTab('workspace');
      } else if (e.key === 'm' || e.key === 'M') {
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isCommandPaletteOpen,
    isShortcutsOpen,
    selectedMovie,
    explanationMovie,
    isAssistantOpen,
  ]);

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
        userRatings,
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
        api.getUserRatings(currentUserId),
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

      try {
        const similarRes = await api.getSimilarMovies(seedMovieId, 12);
        setBecauseLikedMovies(similarRes || []);
      } catch (simErr) {
        console.error('Failed to load similar movies for seed:', simErr);
      }
    } catch (e) {
      console.error('Failed to load movie shelves:', e);
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
    loading,
  };

  return (
    <div className={`cv-desktop-app ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      {/* Collapsible Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        currentUserId={currentUserId}
        setCurrentUserId={setCurrentUserId}
        openCommandPalette={() => setIsCommandPaletteOpen(true)}
        openShortcuts={() => setIsShortcutsOpen(true)}
        openAssistant={() => {
          setAssistantQuery('');
          setIsAssistantOpen(true);
        }}
      />

      {/* Main Workspace Column */}
      <div className="cv-main-layout">
        {/* Top Navigation & Global Search Header */}
        <TopBar
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenAssistant={(q) => {
            setAssistantQuery(q || '');
            setIsAssistantOpen(true);
          }}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          setActiveTab={setActiveTab}
          currentUserId={currentUserId}
        />

        {/* View Content Body */}
        <main className="cv-content-area">
          {activeTab === 'home' && (
            <div className="cv-home-container">
              {/* Cinematic Spotlight Hero */}
              <HeroBanner
                movie={hybridRecs[0] || trendingMovies[0]}
                movies={hybridRecs.slice(0, 5)}
                onOpenDetails={handleOpenDetails}
                onOpenExplanation={handleOpenExplanation}
              />

              {/* Interactive Mood Selection Cards */}
              <MoodGrid onSelectMood={askAssistantWithMood} />

              {/* 1. Picked For You (Hybrid Ensemble with MMR) */}
              <MovieShelf
                kicker="HYBRID ENSEMBLE · MMR DIVERSIFIED"
                title="Picked for Your Taste Profile"
                subtitle="Collaborative filtering, content metadata affinity, and neural embeddings synthesized and diversified."
                movies={hybridRecs}
                {...shelfProps}
              />

              {/* 2. Trending Now (Ranked) */}
              <MovieShelf
                kicker="COMMUNITY ACCLAIM"
                title="Top Trending Now"
                ranked
                subtitle="Bayesian weighted-average scores computed across thousands of catalog reviews."
                movies={trendingMovies}
                {...shelfProps}
              />

              {/* 3. Because you liked X (Item Similarity) */}
              {becauseLikedMovies.length > 0 && (
                <MovieShelf
                  kicker="ITEM-TO-ITEM COHERENCE"
                  title={`Because You Liked ${likedSeedTitle}`}
                  subtitle={`High-dimensional cosine feature similarity anchored on ${likedSeedTitle}.`}
                  movies={becauseLikedMovies}
                  {...shelfProps}
                />
              )}

              {/* 4. SVD Hidden Latent Matches */}
              <MovieShelf
                kicker="SVD MATRIX FACTORIZATION"
                title="Hidden Latent Dimensions"
                subtitle="Movies sharing latent preference vectors with films you have rated highly."
                movies={svdRecs}
                {...shelfProps}
              />

              {/* 5. PyTorch NeuMF Picks */}
              <MovieShelf
                kicker="DEEP LEARNING · PYTORCH NEUMF"
                title="Neural Collaborative Embeddings"
                subtitle="Non-linear user-movie interaction representations learned through Generalized Matrix Factorization and MLP."
                movies={neuralRecs}
                {...shelfProps}
              />

              {/* Curated Genre Rails */}
              <MovieShelf
                kicker="GENRE ARCHIVE · ACTION"
                title="High-Octane Spectacles"
                movies={actionMovies}
                {...shelfProps}
              />
              <MovieShelf
                kicker="GENRE ARCHIVE · SCI-FI"
                title="Visionary Horizons"
                movies={sciFiMovies}
                {...shelfProps}
              />
              <MovieShelf
                kicker="GENRE ARCHIVE · DRAMA"
                title="Critically Acclaimed Dramas"
                movies={dramaMovies}
                {...shelfProps}
              />
              <MovieShelf
                kicker="GENRE ARCHIVE · COMEDY"
                title="Feel-Good Comedies"
                movies={comedyMovies}
                {...shelfProps}
              />
              <MovieShelf
                kicker="GENRE ARCHIVE · THRILLER"
                title="Suspense & Psychological Thrillers"
                movies={thrillerMovies}
                {...shelfProps}
              />
              <MovieShelf
                kicker="GENRE ARCHIVE · ANIMATION"
                title="Animated Masterworks"
                movies={animationMovies}
                {...shelfProps}
              />
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

          {activeTab === 'workspace' && (
            <AIWorkspace
              currentUserId={currentUserId}
              onOpenDetails={handleOpenDetails}
              onOpenExplanation={handleOpenExplanation}
            />
          )}

          {activeTab === 'compare' && (
            <CompareView
              onOpenDetails={handleOpenDetails}
              onOpenExplanation={handleOpenExplanation}
            />
          )}

          {activeTab === 'watchlist' && (
            <WatchlistView
              onOpenDetails={handleOpenDetails}
              onOpenExplanation={handleOpenExplanation}
              setActiveTab={setActiveTab}
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

        {/* Global Footer */}
        <footer className="cv-app-footer">
          <div className="footer-content">
            <div className="footer-brand-col">
              <div className="footer-brand">
                CineVerse<span>AI</span>
              </div>
              <p className="footer-tagline">
                Enterprise-grade personalized movie discovery workspace powered by PyTorch, FastAPI,
                and Explainable AI.
              </p>
            </div>

            <div className="footer-tech-stack">
              {[
                'PyTorch NeuMF',
                'SVD Matrix Factorization',
                'TF-IDF Cosine Similarity',
                'MMR Re-Ranking',
                'Bayesian Cold-Start',
                'FastAPI',
                'React 19',
                'TypeScript',
              ].map((tech) => (
                <span key={tech} className="tech-badge">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </footer>
      </div>

      {/* Floating CineBot Assistant Button */}
      <FloatingCineBot
        isOpen={isAssistantOpen}
        onClick={() => {
          setAssistantQuery('');
          setIsAssistantOpen(true);
        }}
      />

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectMovie={handleOpenDetails}
        setActiveTab={setActiveTab}
        onOpenAssistant={(q) => {
          setAssistantQuery(q || '');
          setIsAssistantOpen(true);
        }}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Movie Details Modal */}
      <MovieDetailModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        currentUserId={currentUserId}
        onOpenExplanation={handleOpenExplanation}
        onSelectMovie={handleOpenDetails}
        onRated={loadHomeShelves}
      />

      {/* Explainable AI Modal */}
      <ExplanationModal
        movie={explanationMovie}
        userId={currentUserId}
        onClose={() => setExplanationMovie(null)}
      />

      {/* Cold-Start Onboarding Modal */}
      <OnboardingModal
        userId={currentUserId}
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onCompleted={loadHomeShelves}
      />

      {/* Floating AI Assistant Drawer */}
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
      <ThemeProvider>
        <WatchlistProvider>
          <CompareProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </CompareProvider>
        </WatchlistProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
