import React from 'react';
import { X, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ['⌘', 'K'], label: 'Open Command Palette & Global Search' },
  { keys: ['/'], label: 'Quick Focus Search' },
  { keys: ['Esc'], label: 'Close Active Modal, Drawer, or Palette' },
  { keys: ['?'], label: 'Open Keyboard Shortcuts Guide' },
  { keys: ['H'], label: 'Navigate to Discover' },
  { keys: ['W'], label: 'Navigate to Watchlist' },
  { keys: ['C'], label: 'Navigate to Movie Compare' },
  { keys: ['A'], label: 'Open AI Assistant Studio' },
  { keys: ['M'], label: 'Open ML Analytics & Weights Lab' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-modal-header">
          <div className="shortcuts-title-wrap">
            <Command size={18} className="shortcuts-icon" />
            <h3>Desktop Keyboard Shortcuts</h3>
          </div>
          <button className="icon-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="shortcuts-list">
          {SHORTCUTS.map((s, idx) => (
            <div key={idx} className="shortcut-row">
              <span className="shortcut-label">{s.label}</span>
              <div className="shortcut-keys">
                {s.keys.map((k, ki) => (
                  <kbd key={ki}>{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shortcuts-footer">
          <span>Pro tip: Press <kbd>?</kbd> anytime to toggle this cheat sheet.</span>
        </div>
      </div>
    </div>
  );
};

