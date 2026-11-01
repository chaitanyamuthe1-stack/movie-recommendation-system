import React from 'react';
import { Search, Sparkles, Scale, Bookmark, SlidersHorizontal } from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import { useCompare } from '../context/CompareContext';

export interface TopBarProps {
  onOpenCommandPalette: () => void;
  onOpenAssistant: (query?: string) => void;
  onOpenOnboarding: () => void;
  setActiveTab: (tab: string) => void;
  currentUserId: number;
}

const QUICK_MOODS = [
  { label: '🧠 Mind-Bending', query: 'Mind-bending psychological thrillers with twists' },
  { label: '⚡ Adrenaline', query: 'High-octane action movies with intense suspense' },
  { label: '😂 Feel-Good', query: 'Uplifting feel-good comedies and heartwarming films' },
  { label: '🌌 Cosmic Sci-Fi', query: 'Epic visionary sci-fi adventures in deep space' },
  { label: '🌑 Dark Mystery', query: 'Atmospheric neo-noir crime and psychological mystery' },
];

export const TopBar: React.FC<TopBarProps> = ({
  onOpenCommandPalette,
  onOpenAssistant,
  onOpenOnboarding,
  setActiveTab,
  currentUserId,
}) => {
  const { totalCount: watchlistCount } = useWatchlist();
  const { totalCount: compareCount } = useCompare();

  return (
    <header className="cv-topbar">
      {/* Global Search Bar (Trigger for Command Palette) */}
      <div className="topbar-search-wrapper" onClick={onOpenCommandPalette}>
        <Search size={17} className="search-icon" />
        <span className="search-placeholder">
          Search 4,800+ movies, actors, directors, genres...
        </span>
        <div className="search-shortcut">
          <kbd>Ctrl</kbd> + <kbd>K</kbd>
        </div>
      </div>

      {/* Quick Mood Pills */}
      <div className="topbar-moods">
        {QUICK_MOODS.map((m) => (
          <button
            key={m.label}
            className="topbar-mood-chip"
            onClick={() => onOpenAssistant(m.query)}
            title={`Ask CineBot for: ${m.query}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Right Controls */}
      <div className="topbar-right">
        {currentUserId === 999 && (
          <button
            onClick={onOpenOnboarding}
            className="topbar-btn onboarding-btn"
            title="Cold-Start Onboarding Wizard"
          >
            <SlidersHorizontal size={14} />
            <span>Taste Profile</span>
          </button>
        )}

        {compareCount > 0 && (
          <button
            onClick={() => setActiveTab('compare')}
            className="topbar-btn compare-btn"
            title="View Film Comparison"
          >
            <Scale size={15} />
            <span className="btn-badge">{compareCount}</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('watchlist')}
          className="topbar-btn icon-btn"
          title={`Watchlist (${watchlistCount})`}
        >
          <Bookmark size={16} />
          {watchlistCount > 0 && <span className="btn-badge">{watchlistCount}</span>}
        </button>

        <button
          onClick={() => onOpenAssistant()}
          className="topbar-ai-btn"
          title="Open CineBot Assistant"
        >
          <Sparkles size={16} />
          <span>Ask CineBot</span>
        </button>
      </div>
    </header>
  );
};

