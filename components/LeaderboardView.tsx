'use client';

import { useState } from 'react';
import Link from 'next/link';

type UserCount = { user_id: string; username: string; name: string | null; count: number };

const MEDAL_COLORS = [
  { border: 'rgba(251,191,36,0.5)', text: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  { border: 'rgba(148,163,184,0.5)', text: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  { border: 'rgba(180,110,60,0.5)',  text: '#cd7f32', bg: 'rgba(180,110,60,0.12)' },
];

function CrownIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 18h20" />
      <path d="M4 18 2 8l5 4 5-8 5 8 5-4-2 10" />
    </svg>
  );
}

function MedalBadge({ rank }: { rank: number }) {
  const c = MEDAL_COLORS[rank - 1];
  if (!c) return null;
  return (
    <div style={{
      width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: c.bg, border: `1.5px solid ${c.border}`,
      fontSize: 11, fontWeight: 800, color: c.text,
    }}>
      {rank}
    </div>
  );
}

function Podium({ users, currentUserId }: { users: UserCount[]; currentUserId: string }) {
  const slots = [users[1], users[0], users[2]];
  const ranks = [2, 1, 3];
  const podiumHeights = [88, 120, 68];
  const avatarSizes = [48, 58, 44];

  return (
    <div className="anim-fade-up-1 flex items-end justify-center gap-3 mb-2 px-2">
      {slots.map((user, i) => {
        if (!user) return <div key={i} style={{ flex: 1 }} />;
        const rank = ranks[i];
        const isFirst = rank === 1;
        const isMe = user.user_id === currentUserId;
        const av = avatarSizes[i];

        return (
          <Link
            key={user.user_id}
            href={`/profile/${user.username}`}
            className="flex-1 flex flex-col items-center"
            style={{ textDecoration: 'none' }}
          >
            {isFirst && (
              <div className="anim-float" style={{ marginBottom: 4, display: 'flex', justifyContent: 'center' }}>
                <CrownIcon size={22} />
              </div>
            )}
            {!isFirst && <div style={{ height: 30 }} />}

            {/* Avatar */}
            <div
              className={isFirst ? 'anim-float' : ''}
              style={{
                width: av, height: av, borderRadius: '50%', marginBottom: 6, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isFirst ? 20 : 16, fontWeight: 800,
                background: isFirst
                  ? 'linear-gradient(135deg, rgba(251,191,36,0.22) 0%, rgba(245,158,11,0.1) 100%)'
                  : isMe
                    ? 'rgba(124,90,246,0.15)'
                    : 'rgba(124,90,246,0.08)',
                border: isFirst
                  ? '2px solid rgba(251,191,36,0.4)'
                  : isMe
                    ? '1px solid rgba(124,90,246,0.35)'
                    : '1px solid rgba(124,90,246,0.18)',
                color: isFirst ? '#fbbf24' : isMe ? '#a78bf8' : 'rgba(255,255,255,0.55)',
                boxShadow: isFirst ? '0 0 28px rgba(251,191,36,0.3)' : isMe ? '0 0 16px rgba(124,90,246,0.25)' : 'none',
              }}
            >
              {(user.name || user.username || '?')[0].toUpperCase()}
            </div>

            {/* Name */}
            <p style={{
              fontSize: 11, fontWeight: 700, textAlign: 'center', marginBottom: 2,
              color: isFirst ? '#fbbf24' : isMe ? '#a78bf8' : '#ffffff',
              maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 4px',
            }}>
              {user.name || user.username}
            </p>
            <p style={{ fontSize: isFirst ? 15 : 13, fontWeight: 800, color: '#fff', marginBottom: 6, textAlign: 'center', letterSpacing: '-0.02em' }}>
              {user.count}
              <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginLeft: 2 }}>sessions</span>
            </p>

            {/* Podium block */}
            <div style={{
              width: '100%', height: podiumHeights[i],
              borderRadius: '10px 10px 0 0',
              background: isFirst
                ? 'linear-gradient(180deg, rgba(251,191,36,0.14) 0%, rgba(251,191,36,0.05) 100%)'
                : 'linear-gradient(180deg, rgba(124,90,246,0.1) 0%, rgba(124,90,246,0.04) 100%)',
              border: `1px solid ${isFirst ? 'rgba(251,191,36,0.22)' : 'rgba(124,90,246,0.12)'}`,
              borderBottom: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isFirst ? '0 -8px 30px rgba(251,191,36,0.08)' : 'none',
            }}>
              <MedalBadge rank={rank} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function Row({ rank, user, isMe, maxCount }: { rank: number; user: UserCount; isMe: boolean; maxCount: number }) {
  const initial = (user.name || user.username || '?')[0].toUpperCase();
  const displayName = user.name || user.username || 'Unknown';
  const barPct = maxCount > 0 ? (user.count / maxCount) * 100 : 0;

  return (
    <Link
      href={`/profile/${user.username}`}
      className="anim-fade-up flex items-center gap-3 px-4 py-3.5 rounded-2xl"
      style={{
        background: isMe ? 'rgba(124,90,246,0.1)' : 'rgba(124,90,246,0.04)',
        border: isMe ? '1px solid rgba(124,90,246,0.28)' : '1px solid rgba(124,90,246,0.09)',
        boxShadow: isMe ? '0 0 20px rgba(124,90,246,0.1)' : 'none',
        textDecoration: 'none',
        transition: 'background 150ms ease',
      }}
      onMouseEnter={e => { if (!isMe) (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.08)'; }}
      onMouseLeave={e => { if (!isMe) (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.04)'; }}
    >
      <span style={{ width: 24, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textAlign: 'center', flexShrink: 0 }}>
        {rank}
      </span>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700,
        background: isMe ? 'rgba(124,90,246,0.18)' : 'rgba(124,90,246,0.08)',
        border: isMe ? '1px solid rgba(124,90,246,0.35)' : '1px solid rgba(124,90,246,0.14)',
        color: isMe ? '#a78bf8' : 'rgba(255,255,255,0.5)',
      }}>
        {initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: isMe ? '#a78bf8' : '#fff', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayName}{isMe && <span style={{ fontSize: 10, color: 'rgba(167,139,248,0.7)', marginLeft: 5, fontWeight: 500 }}>you</span>}
        </p>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 99, marginTop: 5, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${barPct}%`,
            background: isMe ? 'linear-gradient(90deg, #7c5af6, #a78bf8)' : 'rgba(124,90,246,0.4)',
            borderRadius: 99,
            transition: 'width 800ms cubic-bezier(0.34,1.56,0.64,1)',
          }} />
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{user.count}</p>
        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>sessions</p>
      </div>
    </Link>
  );
}

export default function LeaderboardView({
  allUsers, followingUsers, currentUserId,
}: {
  allUsers: UserCount[]; followingUsers: UserCount[]; currentUserId: string;
}) {
  const [tab, setTab] = useState<'global' | 'following'>('global');
  const rows = tab === 'global' ? allUsers : followingUsers;
  const podiumUsers = rows.slice(0, 3);
  const restUsers = rows.slice(3);
  const maxCount = rows[0]?.count ?? 1;
  const totalSessions = allUsers.reduce((s, u) => s + u.count, 0);

  return (
    <div style={{ minHeight: '100dvh', padding: '0 20px 48px' }}>
      {/* Header */}
      <div className="anim-fade-up" style={{ paddingTop: 72, paddingBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(167,139,248,0.65)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
          Leaderboard
        </p>
        <h1 style={{ fontSize: 'clamp(34px, 8vw, 50px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 10 }}>
          Most sessions
        </h1>
        {totalSessions > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ color: '#a78bf8', flexShrink: 0 }}>
              <path d="M13 2 4 13.5h7.5L8 22 20 10.5H12.5Z" />
            </svg>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
              <span style={{ color: '#a78bf8', fontWeight: 700 }}>{totalSessions.toLocaleString()}</span> total sessions logged by the community
            </p>
          </div>
        )}
      </div>

      {/* Tab toggle */}
      <div
        className="anim-fade-up-1"
        style={{
          display: 'flex', gap: 4, padding: 4, borderRadius: 99, marginBottom: 24,
          background: 'rgba(124,90,246,0.07)',
          border: '1px solid rgba(124,90,246,0.12)',
        }}
      >
        {(['global', 'following'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 99, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, textTransform: 'capitalize',
              background: tab === t ? 'linear-gradient(135deg, #7c5af6 0%, #6646e0 100%)' : 'transparent',
              color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)',
              boxShadow: tab === t ? '0 0 20px rgba(124,90,246,0.4)' : 'none',
              transition: 'all 220ms ease',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="anim-fade-up-2" style={{ textAlign: 'center', paddingTop: 80 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(124,90,246,0.08)', border: '1px solid rgba(124,90,246,0.14)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bf8" strokeWidth="1.75" strokeLinecap="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
            </svg>
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6, letterSpacing: '-0.02em' }}>
            {tab === 'following' ? 'No one to rank yet' : 'No sessions yet'}
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            {tab === 'following' ? 'Follow athletes to see how they rank.' : 'Log workouts to appear here.'}
          </p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {podiumUsers.length >= 1 && (
            <div
              className="anim-fade-up-1 rounded-3xl mb-4 pt-5 pb-0 px-2 overflow-hidden"
              style={{
                background: 'linear-gradient(160deg, rgba(20,16,50,0.9) 0%, rgba(14,11,36,0.95) 100%)',
                border: '1px solid rgba(124,90,246,0.14)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
              }}
            >
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(167,139,248,0.5)', textAlign: 'center', marginBottom: 12 }}>Top Athletes</p>
              <Podium users={podiumUsers} currentUserId={currentUserId} />
            </div>
          )}

          {/* Rest of list */}
          {restUsers.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(167,139,248,0.4)', marginTop: 8, marginBottom: 4 }}>Rankings</p>
              {restUsers.map((u, i) => (
                <Row key={u.user_id} rank={i + 4} user={u} isMe={u.user_id === currentUserId} maxCount={maxCount} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
