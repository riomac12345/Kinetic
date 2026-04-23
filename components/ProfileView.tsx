'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Profile = { id: string; username: string; name: string | null; bio: string | null; level: string | null; created_at: string };
type Session = { id: string; date: string; feel: number | null; session_exercises: { id: string }[] };

const FEEL_LABELS = ['', 'Tired', 'Okay', 'Good', 'Strong', 'On fire'];
const FEEL_COLOR = ['', '#6b7280', '#eab308', '#22c55e', '#818cf8', '#7c5af6'];

function FeelBars({ feel }: { feel: number }) {
  const heights = [3, 5, 7, 9, 11];
  const col = FEEL_COLOR[feel] ?? '#6b7280';
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5 }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{
          width: 3, height: heights[i - 1], borderRadius: 1,
          background: i <= feel ? col : 'rgba(255,255,255,0.09)',
          boxShadow: i <= feel && feel === 5 ? '0 0 5px rgba(124,90,246,0.7)' : 'none',
        }} />
      ))}
    </div>
  );
}
const LEVEL_LABEL: Record<string, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
const LEVEL_COLOR: Record<string, string> = {
  beginner: 'rgba(56,189,248,0.2)',
  intermediate: 'rgba(124,90,246,0.18)',
  advanced: 'rgba(251,146,60,0.18)',
};
const LEVEL_BORDER: Record<string, string> = {
  beginner: 'rgba(56,189,248,0.35)',
  intermediate: 'rgba(124,90,246,0.35)',
  advanced: 'rgba(251,146,60,0.35)',
};
const LEVEL_TEXT: Record<string, string> = {
  beginner: '#38bdf8',
  intermediate: '#a78bf8',
  advanced: '#fb923c',
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
      <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(167,139,248,0.45)' }}>
        Last 12 weeks
      </p>
      <div style={{ display: 'flex', gap: 3 }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {week.map((day, di) => (
              <div
                key={di}
                style={{
                  width: 10, height: 10, borderRadius: 3,
                  background: day.hasSession
                    ? 'linear-gradient(135deg, #7c5af6, #a78bf8)'
                    : 'rgba(124,90,246,0.07)',
                  border: day.hasSession ? 'none' : '1px solid rgba(124,90,246,0.1)',
                  boxShadow: day.hasSession ? '0 0 6px rgba(124,90,246,0.45)' : 'none',
                  transition: 'background 150ms ease',
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(124,90,246,0.07)', border: '1px solid rgba(124,90,246,0.1)' }} />
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>No session</span>
        <div style={{ width: 10, height: 10, borderRadius: 3, background: 'linear-gradient(135deg, #7c5af6, #a78bf8)', marginLeft: 8 }} />
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Session logged</span>
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

  return (
    <div className="min-h-dvh pb-10">
      {/* Header */}
      <div
        className="px-4 pt-20 pb-6"
        style={{
          background: 'radial-gradient(ellipse at 50% -20%, rgba(124,90,246,0.12) 0%, transparent 65%)',
          borderBottom: '1px solid rgba(124,90,246,0.1)',
        }}
      >
        <div className="anim-fade-up flex items-start gap-4 mb-5">
          {/* Avatar */}
          <div
            className="anim-float w-18 h-18 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{
              width: 72, height: 72,
              background: 'linear-gradient(135deg, rgba(124,90,246,0.22) 0%, rgba(90,60,200,0.12) 100%)',
              border: '1px solid rgba(124,90,246,0.3)',
              color: '#a78bf8',
              boxShadow: '0 0 24px rgba(124,90,246,0.22)',
            }}
          >
            {(profile.name || profile.username || '?')[0].toUpperCase()}
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-xl font-bold text-white truncate" style={{ letterSpacing: '-0.03em' }}>
              {profile.name ?? profile.username}
            </h1>
            <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.38)' }}>@{profile.username}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {profile.level && (
                <span
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold capitalize"
                  style={{
                    background: LEVEL_COLOR[profile.level] ?? 'rgba(124,90,246,0.12)',
                    color: LEVEL_TEXT[profile.level] ?? '#a78bf8',
                    border: `1px solid ${LEVEL_BORDER[profile.level] ?? 'rgba(124,90,246,0.22)'}`,
                  }}
                >
                  {LEVEL_LABEL[profile.level] ?? profile.level}
                </span>
              )}
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.28)' }}>Joined {joinedYear}</span>
            </div>
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: '1.65' }}>{profile.bio}</p>
        )}

        {/* Stats row */}
        <div
          className="anim-fade-up-1 grid grid-cols-4 gap-1 mb-5 rounded-2xl p-3"
          style={{
            background: 'rgba(124,90,246,0.06)',
            border: '1px solid rgba(124,90,246,0.12)',
          }}
        >
          {[
            { label: 'Sessions',  value: sessions.length },
            { label: 'Exercises', value: totalExercises },
            { label: 'Following', value: followingCount },
            { label: 'Followers', value: fCount },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center py-1">
              <span className="text-base font-bold text-white leading-none" style={{ letterSpacing: '-0.03em' }}>{value}</span>
              <span className="text-[9px] uppercase font-semibold tracking-wide mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Action button */}
        {isOwn ? (
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
            style={{
              background: 'rgba(124,90,246,0.08)',
              border: '1px solid rgba(124,90,246,0.18)',
              color: 'rgba(255,255,255,0.5)',
              textDecoration: 'none',
              transition: 'background 150ms ease, color 150ms ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.15)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.08)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            Edit profile
          </Link>
        ) : (
          <button
            onClick={toggleFollow}
            className="px-5 py-2.5 rounded-full text-sm font-bold"
            style={{
              background: following ? 'transparent' : 'linear-gradient(135deg, #7c5af6 0%, #6646e0 100%)',
              color: following ? 'rgba(255,255,255,0.45)' : '#fff',
              border: following ? '1px solid rgba(124,90,246,0.2)' : 'none',
              boxShadow: following ? 'none' : '0 0 20px rgba(124,90,246,0.4)',
              transition: 'all 150ms ease',
            }}
          >
            {following ? '✓ Following' : '+ Follow'}
          </button>
        )}
      </div>

      {/* Activity grid */}
      <div className="px-4 pt-5 pb-2">
        <div
          className="anim-fade-up-2 rounded-2xl p-4"
          style={{
            background: 'linear-gradient(160deg, rgba(20,16,50,0.9) 0%, rgba(14,11,36,0.95) 100%)',
            border: '1px solid rgba(124,90,246,0.12)',
          }}
        >
          <ActivityGrid sessions={sessions} />
        </div>
      </div>

      {/* Sessions */}
      <div className="px-4 pt-4">
        <p className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(167,139,248,0.45)' }}>
          Recent sessions
        </p>
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 anim-float" style={{ background: 'rgba(124,90,246,0.08)', border: '1px solid rgba(124,90,246,0.14)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,248,0.5)" strokeWidth="1.75" strokeLinecap="round">
                <path d="M6 5v14M18 5v14M4 7h4M4 17h4M16 7h4M16 17h4M8 12h8" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-white mb-1">No sessions yet</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Sessions will appear here once logged.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {sessions.map((s, i) => (
              <div
                key={s.id}
                className="anim-fade-up flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                style={{
                  animationDelay: `${i * 0.06}s`,
                  background: 'rgba(124,90,246,0.05)',
                  border: '1px solid rgba(124,90,246,0.1)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(124,90,246,0.08)', border: '1px solid rgba(124,90,246,0.14)' }}
                >
                  {s.feel ? <FeelBars feel={s.feel} /> : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,248,0.5)" strokeWidth="1.75" strokeLinecap="round">
                      <path d="M6 5v14M18 5v14M4 7h4M4 17h4M16 7h4M16 17h4M8 12h8" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white" style={{ letterSpacing: '-0.01em' }}>
                    {new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
                      {s.session_exercises.length} exercise{s.session_exercises.length !== 1 ? 's' : ''}
                    </p>
                    {s.feel ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(124,90,246,0.1)', color: '#a78bf8', border: '1px solid rgba(124,90,246,0.15)' }}>
                        {FEEL_LABELS[s.feel]}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
