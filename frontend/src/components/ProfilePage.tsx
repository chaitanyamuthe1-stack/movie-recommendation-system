import React, { useState, useEffect } from 'react';
import { User, Star, Film, Award, PieChart, Clock, Calendar } from 'lucide-react';
import { UserProfile, UserRating } from '../types';
import { api } from '../services/api';

interface ProfilePageProps {
  userId: number;
  onOpenOnboarding: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ userId, onOpenOnboarding }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ratings, setRatings] = useState<UserRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([
        api.getUserProfile(userId),
        api.getUserRatings(userId)
      ]);
      setProfile(p);
      setRatings(r);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profile) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ height: '200px', marginBottom: '20px' }} className="skeleton" />
        <div style={{ height: '300px' }} className="skeleton" />
      </div>
    );
  }

  const isColdUser = profile.rating_count === 0;

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '30px 24px 80px 24px' }}>
      {/* Profile Header */}
      <div className="glass-panel" style={{
        padding: '36px',
        borderRadius: '24px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '74px',
            height: '74px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #e50914, #ff3342)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 25px rgba(229, 9, 20, 0.4)'
          }}>
            <User size={36} color="#ffffff" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                {profile.user.username}
              </h1>
              <span className="badge-model">
                {isColdUser ? "Cold-Start Persona" : profile.rating_count >= 50 ? "Cinephile Persona" : "Casual Persona"}
              </span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              {profile.user.email} • Member since {new Date(profile.user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {isColdUser ? (
          <button onClick={onOpenOnboarding} className="btn-primary">
            Start Taste Onboarding
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '24px', textAlign: 'center' }}>
            <div>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', display: 'block' }}>
                {profile.rating_count}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Ratings</span>
            </div>

            <div>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', display: 'block' }}>
                ★ {profile.average_rating.toFixed(1)}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Avg Score</span>
            </div>

            <div>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', display: 'block' }}>
                {profile.top_genres.length}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Top Genres</span>
            </div>
          </div>
        )}
      </div>

      {/* Genre Preferences Breakdown */}
      {!isColdUser && (
        <div className="glass-panel" style={{ padding: '28px', borderRadius: '20px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <PieChart size={20} color="#6366f1" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              Genre Affinity Profile
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {profile.top_genres.map(g => (
              <div
                key={g.genre}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '14px 18px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{g.genre}</span>
                  <span style={{ fontWeight: 700, color: '#e50914', fontSize: '0.85rem' }}>{g.percentage}%</span>
                </div>
                {/* Progress bar */}
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${g.percentage}%`, height: '100%', background: 'linear-gradient(90deg, #e50914, #ff3342)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Rating History */}
      <div className="glass-panel" style={{ padding: '28px', borderRadius: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Star size={20} color="#fbbf24" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
            Recent Ratings ({ratings.length})
          </h3>
        </div>

        {ratings.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            No ratings recorded yet. Rate any movie from the Explore page or run the Onboarding wizard to establish your profile!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ratings.slice(0, 10).map(r => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  padding: '12px 18px',
                  borderRadius: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Film size={18} color="#64748b" />
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>
                    {r.movie_title || `Movie #${r.movie_id}`}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24', fontWeight: 700 }}>
                  <Star size={14} fill="#fbbf24" color="#fbbf24" />
                  {r.rating.toFixed(1)} / 5.0
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
