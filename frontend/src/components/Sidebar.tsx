import React from 'react';
import {
  Compass,
  Search,
  Sparkles,
  Scale,
  Bookmark,
  BarChart3,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Palette,
  Command,
  HelpCircle,
  Film
} from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import { useCompare } from '../context/CompareContext';
import { useTheme } from '../context/ThemeContext';

export interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  currentUserId: number;
  setCurrentUserId: (id: number) => void;
  openCommandPalette: () => void;
  openShortcuts: () => void;
  openAssistant: () => void;
}

const NAV_ITEMS = [
  { id: 'home', label: 'Discover', icon: Compass, badge: null },
  { id: 'search', label: 'Explore & Search', icon: Search, badge: null },
  { id: 'workspace', label: 'AI Studio', icon: Sparkles, badge: 'NEW' },
  { id: 'compare', label: 'Compare Films', icon: Scale, badgeType: 'compare' },
  { id: 'watchlist', label: 'My Watchlist', icon: Bookmark, badgeType: 'watchlist' },
  { id: 'dashboard', label: 'ML Analytics', icon: BarChart3, badge: null },
  { id: 'profile', label: 'Cinephile Profile', icon: UserCheck, badge: null },
];

const PERSONAS = [
  { id: 1, name: 'Cinephile #1', desc: '148 ratings · Warm' },
  { id: 2, name: 'Casual #2', desc: '24 ratings · Warm' },
  { id: 999, name: 'Cold Start #999', desc: '0 ratings · Bayesian' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  currentUserId,
  setCurrentUserId,
  openCommandPalette,
  openShortcuts,
  openAssistant,
}) => {
  const { totalCount: watchlistCount } = useWatchlist();
  const { totalCount: compareCount } = useCompare();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className={`cv-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand" onClick={() => setActiveTab('home')}>
        <div className="brand-icon">
          <Film size={22} />
          <span className="brand-dot" />
        </div>
        {!collapsed && (
          <div className="brand-text">
            <div className="brand-title">
              CineVerse<span>AI</span>
            </div>
            <div className="brand-meta">HYBRID ML WORKSPACE</div>
          </div>
        )}
      </div>

      {/* Quick Command Trigger in Sidebar */}
      {!collapsed && (
        <button
          className="sidebar-cmd-btn"
          onClick={openCommandPalette}
          title="Open Command Palette (Ctrl+K / Cmd+K)"
        >
          <div className="cmd-left">
            <Command size={14} />
            <span>Search or command...</span>
          </div>
          <kbd>⌘K</kbd>
        </button>
      )}

      {/* Navigation Section */}
      <nav className="sidebar-nav">
        {!collapsed && <div className="nav-section-title">NAVIGATION</div>}
        <ul className="nav-list">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const badgeCount =
              item.badgeType === 'watchlist'
                ? watchlistCount
                : item.badgeType === 'compare'
                ? compareCount
                : null;

            return (
              <li key={item.id}>
                <button
                  className={`nav-item-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="nav-item-content">
                    <Icon size={19} className="nav-icon" />
                    {!collapsed && <span className="nav-label">{item.label}</span>}
                  </div>
                  {!collapsed && (
                    <div className="nav-badges">
                      {item.badge && <span className="pill-badge glow-badge">{item.badge}</span>}
                      {badgeCount !== null && badgeCount > 0 && (
                        <span className="pill-badge count-badge">{badgeCount}</span>
                      )}
                    </div>
                  )}
                  {collapsed && badgeCount !== null && badgeCount > 0 && (
                    <span className="collapsed-badge">{badgeCount}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Floating CineBot Quick Launcher */}
      <div className="sidebar-ai-section">
        <button
          className={`sidebar-cinebot-trigger ${collapsed ? 'icon-only' : ''}`}
          onClick={openAssistant}
          title="Talk with CineBot Assistant"
        >
          <Sparkles size={18} className="cinebot-sparkle" />
          {!collapsed && (
            <div className="cinebot-info">
              <span className="cb-title">CineBot Assistant</span>
              <span className="cb-sub">Grounded Natural Language</span>
            </div>
          )}
        </button>
      </div>

      {/* Bottom Persona & System Controls */}
      <div className="sidebar-footer">
        {!collapsed && (
          <div className="persona-selector-card">
            <div className="persona-header">
              <span className="persona-lbl">ACTIVE PERSONA</span>
              <span className="persona-status-live">LIVE</span>
            </div>
            <select
              value={currentUserId}
              onChange={(e) => setCurrentUserId(Number(e.target.value))}
              className="persona-select"
            >
              {PERSONAS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.desc})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="sidebar-actions-row">
          <button
            className="footer-icon-btn"
            onClick={toggleTheme}
            title={`Current Theme: ${theme.toUpperCase()} (Click to toggle)`}
          >
            <Palette size={16} />
            {!collapsed && <span className="action-txt">{theme}</span>}
          </button>

          <button
            className="footer-icon-btn"
            onClick={openShortcuts}
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle size={16} />
            {!collapsed && <span className="action-txt">Help</span>}
          </button>

          <button
            className="footer-icon-btn collapse-toggle"
            onClick={() => setCollapsed((prev) => !prev)}
            title={collapsed ? 'Expand Sidebar (250px)' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>
        </div>
      </div>
    </aside>
  );
};

