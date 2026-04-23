import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

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

  const FEEL_EMOJI = ['', '😴', '😐', '🙂', '💪', '🔥'];

  return (
    <div className="min-h-dvh px-4 pt-20 pb-10">
      <div className="anim-fade-up mb-6">
        <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'rgba(167,139,248,0.65)' }}>Feed</p>
        <h1 className="text-2xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>Activity</h1>
      </div>

      {followingIds.length === 0 ? (
        <div className="anim-fade-up-1 flex flex-col items-center py-20 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 anim-float"
            style={{ background: 'rgba(124,90,246,0.1)', border: '1px solid rgba(124,90,246,0.2)', boxShadow: '0 0 20px rgba(124,90,246,0.15)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bf8" strokeWidth="1.75" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-white mb-1">Follow athletes to see their activity</p>
          <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.38)' }}>Search for people to follow.</p>
          <Link
            href="/search"
            className="anim-glow px-5 py-2.5 rounded-full text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #7c5af6 0%, #6646e0 100%)' }}
          >
            Find people
          </Link>
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-center py-16" style={{ color: 'rgba(255,255,255,0.35)' }}>
          No recent activity from people you follow.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {(sessions as any[]).map((s: { id: string; date: string; feel: number | null; notes: string | null; session_exercises: { id: string }[]; profiles: { username: string; name: string | null; avatar_url: string | null } | null }, i: number) => {
            const profile = s.profiles;
            return (
              <div
                key={s.id}
                className="anim-fade-up rounded-2xl p-4"
                style={{
                  animationDelay: `${i * 0.06}s`,
                  background: 'linear-gradient(160deg, rgba(20,16,50,0.9) 0%, rgba(14,11,36,0.95) 100%)',
                  border: '1px solid rgba(124,90,246,0.12)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Link href={`/profile/${profile?.username}`}>
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        background: 'rgba(124,90,246,0.1)',
                        border: '1px solid rgba(124,90,246,0.18)',
                        color: '#a78bf8',
                      }}
                    >
                      {(profile?.name || profile?.username || '?')[0].toUpperCase()}
                    </div>
                  </Link>
                  <div>
                    <Link href={`/profile/${profile?.username}`} style={{ textDecoration: 'none' }}>
                      <p className="text-sm font-semibold text-white" style={{ letterSpacing: '-0.01em' }}>
                        {profile?.name ?? profile?.username}
                      </p>
                    </Link>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
                      {new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  {s.feel && <span className="ml-auto text-lg">{FEEL_EMOJI[s.feel]}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'rgba(124,90,246,0.1)', color: '#a78bf8', border: '1px solid rgba(124,90,246,0.18)' }}
                  >
                    {s.session_exercises.length} exercises
                  </div>
                  {s.notes && <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.38)' }}>{s.notes}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
