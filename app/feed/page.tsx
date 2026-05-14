import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const FEEL_LABELS = ['', 'Tired', 'Okay', 'Good', 'Strong', 'On fire'];

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id);

  const followingIds = follows?.map(f => f.following_id) ?? [];

  const sessions = followingIds.length > 0
    ? (await supabase
        .from('sessions')
        .select('id, date, feel, notes, user_id, session_exercises(id), profiles(username, name, avatar_url)')
        .in('user_id', followingIds)
        .order('date', { ascending: false })
        .limit(40)
      ).data ?? []
    : [];

  return (
    <div style={{ minHeight: '100dvh', padding: '0 20px 48px' }}>
      <div className="anim-fade-up" style={{ paddingTop: 52, paddingBottom: 24, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Feed</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 12vw, 72px)', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--text)', lineHeight: 0.95 }}>
          Activity
        </h1>
      </div>

      {followingIds.length === 0 ? (
        <div className="anim-fade-up-1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.75" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 6 }}>No one followed yet</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginBottom: 20 }}>Follow athletes to see their activity here.</p>
          <Link
            href="/search"
            style={{
              display: 'inline-block', padding: '11px 24px',
              background: 'var(--accent)', textDecoration: 'none',
              fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bg)',
            }}
          >
            Find People
          </Link>
        </div>
      ) : sessions.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '48px 0' }}>
          No recent activity from people you follow.
        </p>
      ) : (
        <div>
          {(sessions as any[]).map((s: { id: string; date: string; feel: number | null; notes: string | null; session_exercises: { id: string }[]; profiles: { username: string; name: string | null; avatar_url: string | null } | null }, i: number) => {
            const profile = s.profiles;
            return (
              <div key={s.id} className="anim-fade-up" style={{ animationDelay: `${i * 0.05}s`, display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                <Link href={`/profile/${profile?.username}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                  <div style={{ width: 36, height: 36, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: 'var(--accent)' }}>
                    {(profile?.name || profile?.username || '?')[0].toUpperCase()}
                  </div>
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                    <Link href={`/profile/${profile?.username}`} style={{ textDecoration: 'none' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{profile?.name ?? profile?.username}</span>
                    </Link>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>
                      {new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>
                      {s.session_exercises.length} exercise{s.session_exercises.length !== 1 ? 's' : ''}
                    </span>
                    {s.feel && (
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', padding: '1px 6px' }}>
                        {FEEL_LABELS[s.feel]}
                      </span>
                    )}
                    {s.notes && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.notes.slice(0, 36)}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
