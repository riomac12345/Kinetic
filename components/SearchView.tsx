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
    <div className="min-h-dvh px-4 pt-20 pb-10">
      <div className="anim-fade-up mb-5">
        <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'rgba(167,139,248,0.65)' }}>Search</p>
        <h1 className="text-2xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>Find athletes</h1>
      </div>

      <div className="anim-fade-up-1 relative mb-5">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(167,139,248,0.5)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={e => search(e.target.value)}
          placeholder="Search by username…"
          className="w-full pl-10 pr-4 py-3.5 rounded-2xl text-sm text-white outline-none"
          style={{
            background: 'rgba(124,90,246,0.07)',
            border: '1px solid rgba(124,90,246,0.18)',
            transition: 'border-color 150ms ease',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,90,246,0.45)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(124,90,246,0.18)')}
        />
      </div>

      {query.length > 0 && query.length < 2 && (
        <p className="text-xs text-center py-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Type at least 2 characters to search.</p>
      )}

      {query.length >= 2 && results.length === 0 && !isPending && (
        <p className="text-sm text-center py-12" style={{ color: 'rgba(255,255,255,0.35)' }}>No users found for &quot;{query}&quot;</p>
      )}

      <div className="flex flex-col gap-2">
        {results.map((profile, i) => {
          const isFollowing = followState.has(profile.id);
          return (
            <div
              key={profile.id}
              className="anim-fade-up flex items-center gap-3 px-4 py-3.5 rounded-2xl"
              style={{
                animationDelay: `${i * 0.06}s`,
                background: 'rgba(124,90,246,0.05)',
                border: '1px solid rgba(124,90,246,0.1)',
              }}
            >
              <Link href={`/profile/${profile.username}`}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: 'rgba(124,90,246,0.1)',
                    border: '1px solid rgba(124,90,246,0.18)',
                    color: '#a78bf8',
                  }}
                >
                  {(profile.name || profile.username || '?')[0].toUpperCase()}
                </div>
              </Link>
              <Link href={`/profile/${profile.username}`} className="flex-1 min-w-0" style={{ textDecoration: 'none' }}>
                <p className="text-sm font-semibold text-white" style={{ letterSpacing: '-0.01em' }}>
                  {profile.name ?? profile.username}
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>@{profile.username}</p>
              </Link>
              <button
                onClick={() => toggleFollow(profile.id)}
                className="px-4 py-2 rounded-full text-xs font-bold"
                style={{
                  background: isFollowing ? 'transparent' : 'linear-gradient(135deg, #7c5af6 0%, #6646e0 100%)',
                  color: isFollowing ? 'rgba(255,255,255,0.45)' : '#fff',
                  border: isFollowing ? '1px solid rgba(124,90,246,0.18)' : 'none',
                  boxShadow: isFollowing ? 'none' : '0 0 14px rgba(124,90,246,0.35)',
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
