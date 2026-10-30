import React from 'react';
import { Film, Search, Sparkles, BarChart3, UserCheck, Compass } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUserId: number;
  setCurrentUserId: (id: number) => void;
  openAssistant: () => void;
  openOnboarding: () => void;
}

const TABS = [
  { id: 'home', label: 'Explore', icon: Compass },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'dashboard', label: 'ML Lab', icon: BarChart3 },
  { id: 'profile', label: 'Profile', icon: UserCheck },
];

const USERS = [
  { id: 1, name: 'Cinephile · 148 ratings' },
  { id: 2, name: 'Casual · 24 ratings' },
  { id: 999, name: 'New user · cold start' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab, setActiveTab, currentUserId, setCurrentUserId, openAssistant, openOnboarding,
}) => (
  <nav className="nav">
    <div className="brand" onClick={() => setActiveTab('home')}>
      <div className="brand-mark"><Film size={19} /></div>
      <div>
        <div className="brand-name">Cine<i>AI</i></div>
        <div className="brand-sub">Hybrid rec engine</div>
      </div>
    </div>

    <div className="nav-links">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button key={id} className={`nav-link ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
          <Icon size={16} /> <span className="lbl">{label}</span>
        </button>
      ))}
      <button className="nav-link ai" onClick={openAssistant}>
        <Sparkles size={16} /> <span className="lbl">Ask AI</span>
      </button>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {currentUserId === 999 && (
        <button onClick={openOnboarding} className="btn-primary" style={{ fontSize: '.78rem', padding: '8px 16px' }}>
          Start onboarding
        </button>
      )}
      <div className="persona">
        <span>Viewing as</span>
        <select value={currentUserId} onChange={(e) => setCurrentUserId(Number(e.target.value))}>
          {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
    </div>
  </nav>
);
