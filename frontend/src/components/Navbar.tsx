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

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUserId,
  setCurrentUserId,
  openAssistant,
  openOnboarding
}) => {
  const users = [
    { id: 1, name: "Cinephile (148 ratings)", tier: "Warm User" },
    { id: 2, name: "Casual (24 ratings)", tier: "Moderate User" },
    { id: 999, name: "New User (0 ratings)", tier: "Cold-Start" }
  ];

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(20px)',
      background: 'rgba(7, 9, 14, 0.85)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '14px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '20px'
    }}>
      {/* Brand */}
      <div 
        onClick={() => setActiveTab('home')}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
      >
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #e50914, #ff3342)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(229, 9, 20, 0.4)'
        }}>
          <Film size={22} color="#ffffff" />
        </div>
        <div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Cine<span style={{ color: '#e50914' }}>AI</span>
          </span>
          <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Hybrid Rec Engine
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('home')}
          className={activeTab === 'home' ? 'btn-secondary' : 'btn-ghost'}
          style={activeTab === 'home' ? { background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)' } : {}}
        >
          <Compass size={17} /> Explore
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={activeTab === 'search' ? 'btn-secondary' : 'btn-ghost'}
          style={activeTab === 'search' ? { background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)' } : {}}
        >
          <Search size={17} /> Search
        </button>

        <button
          onClick={openAssistant}
          className="btn-ghost"
          style={{ color: '#818cf8', background: 'rgba(99, 102, 241, 0.1)' }}
        >
          <Sparkles size={17} /> AI Assistant
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={activeTab === 'dashboard' ? 'btn-secondary' : 'btn-ghost'}
          style={activeTab === 'dashboard' ? { background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)' } : {}}
        >
          <BarChart3 size={17} /> ML Dashboard
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={activeTab === 'profile' ? 'btn-secondary' : 'btn-ghost'}
          style={activeTab === 'profile' ? { background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)' } : {}}
        >
          <UserCheck size={17} /> Profile
        </button>
      </div>

      {/* Demo User Switcher & Onboarding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {currentUserId === 999 && (
          <button 
            onClick={openOnboarding}
            className="btn-primary"
            style={{ fontSize: '0.8rem', padding: '7px 14px' }}
          >
            Start Onboarding
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Persona:</span>
          <select
            value={currentUserId}
            onChange={(e) => setCurrentUserId(Number(e.target.value))}
            style={{
              background: 'transparent',
              color: '#f8fafc',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {users.map(u => (
              <option key={u.id} value={u.id} style={{ background: '#0e121c', color: '#f8fafc' }}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </nav>
  );
};
