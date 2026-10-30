import React, { useState, useEffect, useMemo } from 'react';
import { Star, Film, Eye, RotateCcw, ArrowUpDown } from 'lucide-react';
import { UserProfile, UserRating, Movie } from '../types';
import { api } from '../services/api';
import { getMoviePoster, generateMoviePoster } from '../utils/moviePosters';

interface ProfilePageProps {
  userId: number;
  onOpenOnboarding: () => void;
  onOpenDetails?: (movie: Movie) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  userId,
  onOpenOnboarding,
  onOpenDetails
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ratings, setRatings] = useState<UserRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingSort, setRatingSort] = useState<'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc'>('date_desc');

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
      setRatings(r || []);
    } catch (e) {
      console.error("Failed to load user profile:", e);
    } finally {
      setLoading(false);
    }
  };

  const sortedRatings = useMemo(() => {
    const list = [...ratings];
    if (ratingSort === 'rating_desc') {
      return list.sort((a, b) => b.rating - a.rating);
    } else if (ratingSort === 'rating_asc') {
      return list.sort((a, b) => a.rating - b.rating);
    } else if (ratingSort === 'date_asc') {
      return list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
    // Default date_desc
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [ratings, ratingSort]);

  if (loading || !profile) {
    return (
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ height: '220px', marginBottom: '24px', borderRadius: 'var(--r-lg)' }} className="skeleton" />
        <div style={{ height: '340px', borderRadius: 'var(--r-lg)' }} className="skeleton" />
      </div>
    );
  }

  const isColdUser = profile.rating_count === 0;
  const username = profile.user.username;
  const initials = username
    .split('_')
    .map(p => p[0]?.toUpperCase())
    .join('')
    .slice(0, 2) || username.slice(0, 2).toUpperCase();

  const handleMovieClick = (r: UserRating) => {
    if (onOpenDetails) {
      onOpenDetails({
        id: r.movie_id,
        movie_id: r.movie_id,
        title: r.movie_title || `Movie #${r.movie_id}`,
        release_year: 2020,
        vote_average: r.rating,
        vote_count: 1,
        genres: [],
        overview: '',
        popularity: 10,
        poster_path: r.poster_path,
        poster_url: r.poster_url,
        match_percentage: Math.round((r.rating / 5) * 100)
      } as unknown as Movie);
    }
  };

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '30px 24px 80px 24px' }}>
      {/* Profile Header Hero Card */}
      <div
        className="glass-panel"
        style={{
          padding: '36px',
          borderRadius: 'var(--r-lg)',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px',
          boxShadow: '0 24px 50px rgba(0,0,0,0.6)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
          {/* Avatar with Initials */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'conic-gradient(from 180deg, var(--gold), var(--ember), var(--gold))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--glow)',
              color: '#1a0e04',
              fontSize: '1.6rem',
              fontWeight: 900,
              fontFamily: 'var(--font-display)',
              flexShrink: 0
            }}
          >
            {initials}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '2.1rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--text)', lineHeight: 1.1 }}>
                {profile.user.username}
              </h1>
              <span className="badge-model">
                {userId === 1 ? "Cinephile (Persona 1)" : userId === 2 ? "Casual Viewer (Persona 2)" : "Cold-Start User (Persona 999)"}
              </span>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.86rem', fontFamily: 'var(--font-mono)' }}>
              {profile.user.email} • Member since {new Date(profile.user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={onOpenOnboarding}
            className="btn-secondary"
            style={{ borderColor: 'var(--gold)', color: 'var(--gold-soft)' }}
          >
            <RotateCcw size={16} />
            <span>{isColdUser ? "Start Onboarding" : "Re-run Onboarding"}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: 'var(--r-md)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--subtle)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Film size={14} color="var(--gold)" /> RATING COUNT
          </span>
          <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text)', fontFamily: 'var(--font-mono)', marginTop: '4px', display: 'block' }}>
            {profile.rating_count}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: 'var(--r-md)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--subtle)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Star size={14} color="var(--gold)" fill="currentColor" /> AVERAGE RATING
          </span>
          <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--gold)', fontFamily: 'var(--font-mono)', marginTop: '4px', display: 'block' }}>
            {profile.average_rating > 0 ? `${profile.average_rating.toFixed(2)}★` : 'N/A'}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: 'var(--r-md)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--subtle)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Eye size={14} color="var(--teal)" /> WATCH COUNT
          </span>
          <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--teal)', fontFamily: 'var(--font-mono)', marginTop: '4px', display: 'block' }}>
            {profile.watch_count || profile.rating_count}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: 'var(--r-md)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--subtle)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', display: 'block' }}>
            TOP AFFINITY GENRE
          </span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginTop: '6px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {profile.top_genres?.[0]?.genre || "Action"}
          </span>
        </div>
      </div>

      {/* Genre Affinity Horizontal Bars */}
      {profile.top_genres && profile.top_genres.length > 0 && (
        <div className="glass-panel" style={{ padding: '28px 32px', borderRadius: 'var(--r-lg)', marginBottom: '32px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div className="shelf-kicker">TASTE PROFILE ANALYSIS</div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
              Top Genre Preferences
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.86rem' }}>
              Computed from rated title genres and cold-start preferences.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {profile.top_genres.map((g) => (
              <div key={g.genre} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{g.genre}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--gold)' }}>
                    {g.percentage}% ({g.count} titles)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 240, 220, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(5, g.percentage))}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--gold), var(--ember))',
                      borderRadius: '4px',
                      transition: 'width 0.8s ease'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Your Ratings Poster Grid with Sort */}
      <div className="glass-panel" style={{ padding: '28px 32px', borderRadius: 'var(--r-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
          <div>
            <div className="shelf-kicker">PERSONAL HISTORY</div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
              Your Ratings ({sortedRatings.length})
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--subtle)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpDown size={14} /> SORT BY:
            </span>
            <select
              value={ratingSort}
              onChange={(e) => setRatingSort(e.target.value as any)}
              style={{
                background: 'var(--ink-2)',
                border: '1px solid var(--line)',
                color: 'var(--text)',
                borderRadius: 'var(--r-md)',
                padding: '8px 14px',
                fontSize: '0.84rem',
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            >
              <option value="date_desc">Newest Rated First</option>
              <option value="date_asc">Oldest Rated First</option>
              <option value="rating_desc">Highest Rated (★ 5.0 → 1.0)</option>
              <option value="rating_asc">Lowest Rated (★ 1.0 → 5.0)</option>
            </select>
          </div>
        </div>

        {sortedRatings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--muted)' }}>
            <Film size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ fontSize: '0.94rem' }}>No ratings recorded yet for this user.</p>
            <button
              onClick={onOpenOnboarding}
              className="btn-primary"
              style={{ marginTop: '16px' }}
            >
              Launch Onboarding Setup
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '18px'
          }}>
            {sortedRatings.map((r) => {
              const mockMovie = {
                id: r.movie_id,
                title: r.movie_title || `Movie #${r.movie_id}`,
                poster_path: r.poster_path,
                poster_url: r.poster_url,
                release_year: 2020,
                vote_average: r.rating
              };
              const poster = getMoviePoster(mockMovie as any);

              return (
                <div
                  key={r.id}
                  onClick={() => handleMovieClick(r)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 'var(--r-md)',
                    overflow: 'hidden',
                    background: 'var(--ink)',
                    border: '1px solid var(--line)',
                    position: 'relative',
                    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.5)'
                  }}
                  className="glass-panel-interactive"
                >
                  <div style={{ position: 'relative', aspectRatio: '2/3', width: '100%', background: '#1a130e' }}>
                    <img
                      src={poster}
                      alt={r.movie_title || `Movie #${r.movie_id}`}
                      loading="lazy"
                      width="160"
                      height="240"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = generateMoviePoster(mockMovie as any);
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div className="card-shade" />

                    {/* Star Badge on Poster */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(10, 8, 6, 0.85)',
                        border: '1px solid var(--line)',
                        borderRadius: 'var(--r-full)',
                        padding: '3px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        color: 'var(--gold)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        backdropFilter: 'blur(8px)'
                      }}
                    >
                      <Star size={11} fill="currentColor" /> {r.rating.toFixed(1)}
                    </div>
                  </div>

                  <div style={{ padding: '10px 10px 12px' }}>
                    <h5 style={{
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      color: 'var(--text)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {r.movie_title || `Movie #${r.movie_id}`}
                    </h5>
                    <span style={{ fontSize: '0.72rem', color: 'var(--subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginTop: '2px' }}>
                      {new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
