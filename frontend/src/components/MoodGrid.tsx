import React from 'react';
import { Sparkles, Brain, Zap, Smile, Compass, Moon, Heart } from 'lucide-react';

export interface MoodItem {
  id: string;
  title: string;
  tagline: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  gradient: string;
  query: string;
}

export const MOOD_PRESETS: MoodItem[] = [
  {
    id: 'mind-bending',
    title: 'Mind-Bending',
    tagline: 'Cerebral twists & existential puzzles',
    icon: Brain,
    gradient: 'linear-gradient(135deg, rgba(155, 140, 255, 0.22) 0%, rgba(30, 22, 50, 0.6) 100%)',
    query: 'Mind-bending psychological thrillers with reality-shifting plot twists',
  },
  {
    id: 'adrenaline',
    title: 'Adrenaline Rush',
    tagline: 'Relentless momentum & intense spectacle',
    icon: Zap,
    gradient: 'linear-gradient(135deg, rgba(255, 90, 54, 0.22) 0%, rgba(45, 15, 10, 0.6) 100%)',
    query: 'High-octane non-stop action movies with high stakes and stunts',
  },
  {
    id: 'wholesome',
    title: 'Cozy & Uplifting',
    tagline: 'Warmth, gentle laughs & comfort cinema',
    icon: Smile,
    gradient: 'linear-gradient(135deg, rgba(255, 178, 64, 0.22) 0%, rgba(45, 30, 10, 0.6) 100%)',
    query: 'Heartwarming feel-good comedies and comforting stories about human connection',
  },
  {
    id: 'noir',
    title: 'Noir & Shadow',
    tagline: 'Rain-soaked tension & cynical detectives',
    icon: Moon,
    gradient: 'linear-gradient(135deg, rgba(61, 214, 195, 0.18) 0%, rgba(10, 28, 26, 0.6) 100%)',
    query: 'Atmospheric neo-noir crime mysteries with dark moral ambiguity',
  },
  {
    id: 'cosmic',
    title: 'Cosmic Odyssey',
    tagline: 'Deep space awe & visionary wonder',
    icon: Compass,
    gradient: 'linear-gradient(135deg, rgba(130, 170, 255, 0.22) 0%, rgba(15, 25, 45, 0.6) 100%)',
    query: 'Epic philosophical space exploration sci-fi with grandeur and wonder',
  },
  {
    id: 'heartfelt',
    title: 'Deeply Moving',
    tagline: 'Intimate character journeys & emotional depth',
    icon: Heart,
    gradient: 'linear-gradient(135deg, rgba(255, 105, 180, 0.22) 0%, rgba(45, 15, 30, 0.6) 100%)',
    query: 'Poignant emotional dramas with powerful performances and deep catharsis',
  },
];

interface MoodGridProps {
  onSelectMood: (query: string) => void;
}

export const MoodGrid: React.FC<MoodGridProps> = ({ onSelectMood }) => {
  return (
    <section className="mood-grid-section">
      <div className="section-header-row">
        <div>
          <div className="section-kicker">
            <Sparkles size={13} className="kicker-icon" />
            <span>ATMOSPHERIC TASTE PROFILES</span>
          </div>
          <h3 className="section-title">Tonight's Cinema Mood</h3>
          <p className="section-subtitle">
            Pick a vibe to instantly align our hybrid recommendation engine with your emotional frequency.
          </p>
        </div>
      </div>

      <div className="mood-cards-container">
        {MOOD_PRESETS.map((mood) => {
          const Icon = mood.icon;
          return (
            <div
              key={mood.id}
              className="mood-card"
              style={{ background: mood.gradient }}
              onClick={() => onSelectMood(mood.query)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectMood(mood.query);
                }
              }}
            >
              <div className="mood-card-icon-bubble">
                <Icon size={20} />
              </div>
              <div className="mood-card-content">
                <h4 className="mood-card-title">{mood.title}</h4>
                <p className="mood-card-tagline">{mood.tagline}</p>
              </div>
              <div className="mood-card-glow" />
            </div>
          );
        })}
      </div>
    </section>
  );
};

