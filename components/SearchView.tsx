'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Profile = { id: string; username: string; name: string | null };

export default function SearchView({
  results, followingIds: initialFollowingIds, currentUserId, initialQuery,
}: {
  results: Profile[]; followingIds: Set<string>; currentUserId: string; initialQuery: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [query, setQuery] = useState(initialQuery);
  const [followState, setFollowState] = useState<Set<string>>(new Set(initialFollowingIds));
  const [isPending, startTransition] = useTransition();

  function search(q: string) {
    setQuery(q);
    if (q.length >= 2) {
      startTransition(() => { router.push(`/search?q=${encodeURIComponent(q)}`); });
    }
  }

  async function toggleFollow(profileId: string) {
    const isFollowing = followState.has(profileId);
    const next = new Set(followState);
    if (isFollowing) {
      next.delete(profileId);
      await supabase.from('follows').delete().match({ follower_id: currentUserId, following_id: profileId });
    } else {
      next.add(profileId);
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: profileId });
    }
    setFollowState(next);
  }

  return (
    <div style={{ minHeight: '100dvh', padding: '0 20px 48px' }}>
      <div className="anim-fade-up" style={{ paddingTop: 52, paddingBottom: 24, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Search</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 12vw, 72px)', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--text)', lineHeight: 0.95 }}>
          Find Athletes
        </h1>
      </div>

      <div className="anim-fade-up-1" style={{ position: 'relative', marginBottom: 16 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none', display: 'flex' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        </span>
        <input
          type="text"
          value={query}
          onChange={e => search(e.target.value)}
          placeholder="Search by username…"
          style={{
            width: '100%', boxSizing: 'border-box',
            paddingLeft: 36, paddingRight: 16, paddingTop: 11, paddingBottom: 11,
            background: 'var(--surface)', border: '1px solid var(--border)',
            fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)',
            outline: 'none', transition: 'border-color 150ms ease',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        />
        {isPending && (
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>…</span>
        )}
      </div>

      {query.length > 0 && query.length < 2 && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', textAlign: 'center', padding: '16px 0' }}>Type at least 2 characters to search.</p>
      )}
      {query.length >= 2 && results.length === 0 && !isPending && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', textAlign: 'center', padding: '40px 0' }}>No users found for &quot;{query}&quot;</p>
      )}

      <div>
        {results.map((profile, i) => {
          const isFollowing = followState.has(profile.id);
          return (
            <div key={profile.id} className="anim-fade-up" style={{ animationDelay: `${i * 0.05}s`, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <Link href={`/profile/${profile.username}`} style={{ textDecoration: 'none' }}>
                <div style={{ width: 36, height: 36, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: 'var(--accent)' }}>
                  {(profile.name || profile.username || '?')[0].toUpperCase()}
                </div>
              </Link>
              <Link href={`/profile/${profile.username}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>{profile.name ?? profile.username}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>@{profile.username}</p>
              </Link>
              <button
                onClick={() => toggleFollow(profile.id)}
                style={{
                  padding: '7px 14px', flexShrink: 0,
                  background: isFollowing ? 'transparent' : 'var(--accent)',
                  border: `1px solid ${isFollowing ? 'var(--border)' : 'var(--accent)'}`,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: isFollowing ? 'var(--text-3)' : 'var(--bg)',
                  transition: 'all 150ms ease',
                }}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
