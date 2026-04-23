import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import ProfileView from '@/components/ProfileView';

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username)
    .single();

  if (!profile) notFound();

  const [{ data: sessions }, { data: follows }, { data: isFollowingRow }, { data: followerCount }] = await Promise.all([
    supabase.from('sessions').select('id, date, feel, session_exercises(id)').eq('user_id', profile.id).order('date', { ascending: false }).limit(10),
    supabase.from('follows').select('following_id, id').eq('follower_id', profile.id),
    supabase.from('follows').select('id').match({ follower_id: user.id, following_id: profile.id }).single(),
    supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', profile.id),
  ]);

  return (
    <ProfileView
      profile={profile}
      sessions={sessions ?? []}
      followingCount={follows?.length ?? 0}
      followerCount={followerCount?.length ?? 0}
      isFollowing={!!isFollowingRow}
      isOwn={profile.id === user.id}
      currentUserId={user.id}
    />
  );
}
