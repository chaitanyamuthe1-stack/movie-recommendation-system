import React from 'react';
import { Sparkles, Bot } from 'lucide-react';

interface FloatingCineBotProps {
  onClick: () => void;
  isOpen: boolean;
}

export const FloatingCineBot: React.FC<FloatingCineBotProps> = ({ onClick, isOpen }) => {
  if (isOpen) return null;

  return (
    <div className="floating-cinebot-container">
      <button
        className="floating-cinebot-btn"
        onClick={onClick}
        title="Chat with CineBot AI Assistant"
        aria-label="Open CineBot AI Assistant"
      >
        <div className="cinebot-btn-inner">
          <Sparkles size={20} className="sparkle-svg" />
        </div>
        <div className="cinebot-pulse-ring" />
        <span className="cinebot-tooltip">Ask CineBot</span>
      </button>
    </div>
  );
};

