import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LeaderboardView from '@/components/LeaderboardView';

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  // Most sessions per user (all time)
  const { data: sessionCounts } = await supabase
    .from('sessions')
    .select('user_id, profiles(username, name)')
    .order('user_id');

  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id);

  const followingIds = new Set(follows?.map(f => f.following_id) ?? []);
  followingIds.add(user.id);

  // Tally sessions per user
  type UserCount = { user_id: string; username: string; name: string | null; count: number };
  const countMap = new Map<string, UserCount>();
  for (const s of (sessionCounts ?? []) as any[]) {
    const profile = s.profiles as { username: string; name: string | null } | null;
    if (!profile) continue;
    const entry = countMap.get(s.user_id) ?? { user_id: s.user_id, username: profile.username, name: profile.name, count: 0 };
    entry.count++;
    countMap.set(s.user_id, entry);
  }

  const allUsers = Array.from(countMap.values()).sort((a, b) => b.count - a.count).slice(0, 20);
  const followingUsers = allUsers.filter(u => followingIds.has(u.user_id));

  return <LeaderboardView allUsers={allUsers} followingUsers={followingUsers} currentUserId={user.id} />;
}
