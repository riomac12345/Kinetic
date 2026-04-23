import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SearchView from '@/components/SearchView';

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const q = searchParams.q?.trim() ?? '';
  let results: { id: string; username: string; name: string | null }[] = [];

  if (q.length >= 2) {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, name')
      .ilike('username', `%${q}%`)
      .neq('id', user.id)
      .limit(20);
    results = data ?? [];
  }

  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id);

  const followingIds = new Set(follows?.map(f => f.following_id) ?? []);

  return <SearchView results={results} followingIds={followingIds} currentUserId={user.id} initialQuery={q} />;
}
