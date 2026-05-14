'use client';

import { useState } from 'react';
import Link from 'next/link';

type UserCount = { user_id: string; username: string; name: string | null; count: number };

function PodiumBlock({ user, rank, currentUserId }: { user: UserCount; rank: number; currentUserId: string }) {
  const isMe = user.user_id === currentUserId;
  const isFirst = rank === 1;
  const heights = [88, 120, 68];
  const h = heights[rank - 1] ?? 68;

  const rankLabel = rank === 1 ? '1ST' : rank === 2 ? '2ND' : '3RD';
  const accentColor = isFirst ? 'var(--accent)' : 'var(--text-3)';

  return (
    <Link href={`/profile/${user.username}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none' }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: accentColor, marginBottom: 4 }}>{user.count}</p>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 4px', marginBottom: 6 }}>
        {user.name || user.username}
        {isMe && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', marginLeft: 4 }}>you</span>}
      </p>
      <div style={{
        width: '100%', height: h,
        background: isFirst
          ? 'linear-gradient(to top, rgba(240,112,48,0.35), rgba(240,112,48,0.12))'
          : rank === 2
          ? 'linear-gradient(to top, rgba(240,112,48,0.18), rgba(240,112,48,0.05))'
          : 'linear-gradient(to top, rgba(240,112,48,0.10), rgba(240,112,48,0.02))',
        border: `1px solid ${isFirst ? 'rgba(240,112,48,0.55)' : rank === 2 ? 'rgba(240,112,48,0.28)' : 'rgba(240,112,48,0.15)'}`,
        borderBottom: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isFirst ? 'inset 0 0 20px rgba(240,112,48,0.15), 0 0 20px rgba(240,112,48,0.1)' : 'none',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: isFirst ? 'var(--accent-light)' : 'var(--text-3)', textShadow: isFirst ? '0 0 12px rgba(240,112,48,0.8)' : 'none' }}>{rankLabel}</span>
      </div>
    </Link>
  );
}

function Row({ rank, user, isMe, maxCount }: { rank: number; user: UserCount; isMe: boolean; maxCount: number }) {
  const displayName = user.name || user.username || 'Unknown';
  const barPct = maxCount > 0 ? (user.count / maxCount) * 100 : 0;

  return (
    <Link
      href={`/profile/${user.username}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
        borderBottom: '1px solid var(--border)', textDecoration: 'none',
        background: isMe ? 'var(--accent-bg)' : 'transparent',
        transition: 'background 150ms ease',
      }}
      onMouseEnter={e => { if (!isMe) (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
      onMouseLeave={e => { if (!isMe) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <span style={{ width: 28, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textAlign: 'center', flexShrink: 0 }}>{rank}</span>
      <div style={{ width: 32, height: 32, background: isMe ? 'var(--accent-bg)' : 'var(--surface)', border: `1px solid ${isMe ? 'var(--accent-border)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800, color: isMe ? 'var(--accent)' : 'var(--text-2)' }}>
        {(user.name || user.username || '?')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: isMe ? 'var(--accent)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
          {displayName}
        </p>
        <div style={{ height: 2, background: 'var(--border)' }}>
          <div style={{ height: '100%', width: `${barPct}%`, background: isMe ? 'var(--accent)' : 'var(--border-2)', transition: 'width 600ms ease' }} />
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{user.count}</p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: 2 }}>sessions</p>
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
      <div className="anim-fade-up" style={{ paddingTop: 52, paddingBottom: 24, borderBottom: '1px solid rgba(240,112,48,0.1)', marginBottom: 24 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Leaderboard</p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(48px, 12vw, 72px)', fontWeight: 700,
          letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 0.95, marginBottom: 12,
          background: 'linear-gradient(135deg, #16141F 0%, #F59050 60%, #F07030 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Most Sessions
        </h1>
        {totalSessions > 0 && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{totalSessions.toLocaleString()}</span> total sessions by the community
          </p>
        )}
      </div>

      {/* Tab toggle */}
      <div className="anim-fade-up-1" style={{
        display: 'flex', marginBottom: 24,
        border: '1px solid rgba(240,112,48,0.2)', borderRadius: 12, overflow: 'hidden',
        background: 'rgba(255,255,255,0.5)',
      }}>
        {(['global', 'following'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              background: tab === t
                ? 'linear-gradient(135deg, #F07030 0%, #F59050 100%)'
                : 'transparent',
              color: tab === t ? 'white' : 'var(--text-3)',
              transition: 'all 160ms ease',
              boxShadow: tab === t ? '0 0 16px rgba(240,112,48,0.4)' : 'none',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="anim-fade-up-2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
            </svg>
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 6 }}>
            {tab === 'following' ? 'No one to rank yet' : 'No sessions yet'}
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>
            {tab === 'following' ? 'Follow athletes to see how they rank.' : 'Log workouts to appear here.'}
          </p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {podiumUsers.length >= 1 && (
            <div className="anim-fade-up-1 glass-card" style={{ padding: '16px 8px 0', marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', textAlign: 'center', marginBottom: 16 }}>Top Athletes</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                {[podiumUsers[1], podiumUsers[0], podiumUsers[2]].map((user, i) => {
                  const rankOrder = [2, 1, 3];
                  if (!user) return <div key={i} style={{ flex: 1 }} />;
                  return <PodiumBlock key={user.user_id} user={user} rank={rankOrder[i]} currentUserId={currentUserId} />;
                })}
              </div>
            </div>
          )}

          {/* Rest of list */}
          {restUsers.length > 0 && (
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4 }}>Rankings</p>
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
