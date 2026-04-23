import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import HistoryView from '@/components/HistoryView';

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  // Fetch all sessions with exercise counts
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, date, feel, notes, session_exercises(id)')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(90);

  return <HistoryView sessions={sessions ?? []} />;
}
