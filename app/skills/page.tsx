import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SkillsView from '@/components/SkillsView';

export default async function SkillsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const { data: progressions } = await supabase
    .from('skill_progressions')
    .select('*')
    .eq('user_id', user.id);

  return <SkillsView userId={user.id} progressions={progressions ?? []} />;
}
