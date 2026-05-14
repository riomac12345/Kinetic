'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Profile = { id: string; username: string; name: string | null; bio: string | null; level: string | null; created_at: string };
type Session = { id: string; date: string; feel: number | null; session_exercises: { id: string }[] };

const FEEL_LABELS = ['', 'Tired', 'Okay', 'Good', 'Strong', 'On fire'];

const LEVEL_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  beginner:     { bg: 'var(--blue-bg)',   border: 'var(--blue-border)',   text: 'var(--blue)' },
  intermediate: { bg: 'var(--accent-bg)', border: 'var(--accent-border)', text: 'var(--accent)' },
  advanced:     { bg: 'var(--warm-bg)',   border: 'var(--warm-border)',   text: 'var(--warm)' },
};

function ActivityGrid({ sessions }: { sessions: Session[] }) {
  const dates = new Set(sessions.map(s => s.date));
  const today = new Date();
  const days: { date: string; hasSession: boolean }[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split('T')[0];
    days.push({ date: iso, hasSession: dates.has(iso) });
  }
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>Last 12 weeks</p>
      <div style={{ display: 'flex', gap: 3 }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {week.map((day, di) => (
              <div key={di} style={{ width: 10, height: 10, background: day.hasSession ? 'var(--accent)' : 'var(--surface-2)', border: `1px solid ${day.hasSession ? 'var(--accent-border)' : 'var(--border)'}` }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <div style={{ width: 10, height: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>No session</span>
        <div style={{ width: 10, height: 10, background: 'var(--accent)', marginLeft: 8 }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>Session logged</span>
      </div>
    </div>
  );
}

export default function ProfileView({
  profile, sessions, followingCount, followerCount, isFollowing: initFollowing, isOwn, currentUserId,
}: {
  profile: Profile; sessions: Session[]; followingCount: number; followerCount: number;
  isFollowing: boolean; isOwn: boolean; currentUserId: string;
}) {
  const supabase = createClient();
  const [following, setFollowing] = useState(initFollowing);
  const [fCount, setFCount] = useState(followerCount);

  async function toggleFollow() {
    if (following) {
      setFollowing(false); setFCount(c => c - 1);
      await supabase.from('follows').delete().match({ follower_id: currentUserId, following_id: profile.id });
    } else {
      setFollowing(true); setFCount(c => c + 1);
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: profile.id });
    }
  }

  const joinedYear = new Date(profile.created_at).getFullYear();
  const totalExercises = sessions.reduce((s, sess) => s + sess.session_exercises.length, 0);
  const levelStyle = profile.level ? (LEVEL_STYLES[profile.level] ?? LEVEL_STYLES.intermediate) : null;

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 24px', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
        <div className="anim-fade-up" style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
          {/* Avatar */}
          <div style={{
            width: 64, height: 64, background: 'var(--surface-2)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--accent)',
          }}>
            {(profile.name || profile.username || '?')[0].toUpperCase()}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 2 }}>
              {profile.name ?? profile.username}
            </h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>@{profile.username}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {levelStyle && profile.level && (
                <span style={{ display: 'inline-block', padding: '2px 8px', background: levelStyle.bg, border: `1px solid ${levelStyle.border}`, fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: levelStyle.text }}>
                  {profile.level}
                </span>
              )}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>Joined {joinedYear}</span>
            </div>
          </div>
        </div>

        {profile.bio && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.65, marginBottom: 16 }}>{profile.bio}</p>
        )}

        {/* Stats row */}
        <div className="anim-fade-up-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', border: '1px solid var(--border)', marginBottom: 16 }}>
          {[
            { label: 'Sessions',  value: sessions.length },
            { label: 'Exercises', value: totalExercises },
            { label: 'Following', value: followingCount },
            { label: 'Followers', value: fCount },
          ].map(({ label, value }, i) => (
            <div key={label} style={{ padding: '12px 0', textAlign: 'center', borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{value}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: 3 }}>{label}</p>
            </div>
          ))}
        </div>

        {isOwn ? (
          <Link href="/settings" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px',
            background: 'transparent', border: '1px solid var(--border)', textDecoration: 'none',
            fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-2)',
            transition: 'border-color 140ms ease, color 140ms ease',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            Edit Profile
          </Link>
        ) : (
          <button
            onClick={toggleFollow}
            style={{
              padding: '9px 20px',
              background: following ? 'transparent' : 'var(--accent)',
              border: `1px solid ${following ? 'var(--border)' : 'var(--accent)'}`,
              cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: following ? 'var(--text-2)' : 'var(--bg)',
              transition: 'all 150ms ease',
            }}
          >
            {following ? '✓ Following' : '+ Follow'}
          </button>
        )}
      </div>

      {/* Activity grid */}
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
        <ActivityGrid sessions={sessions} />
      </div>

      {/* Sessions */}
      <div style={{ padding: '20px' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12 }}>
          Recent Sessions
        </p>
        {sessions.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 6 }}>No sessions yet</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>Sessions will appear here once logged.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sessions.map((s, i) => (
              <div key={s.id} className="anim-fade-up" style={{ animationDelay: `${i * 0.05}s`, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                    {new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                    {s.session_exercises.length} exercise{s.session_exercises.length !== 1 ? 's' : ''}
                    {s.feel ? ` · ${FEEL_LABELS[s.feel]}` : ''}
                  </p>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
