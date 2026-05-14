import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DailyLogView from '@/components/DailyLogView';

export default async function DailyLogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const { data: logs } = await supabase
    .from('wellness_logs')
    .select('id, date, food_breakfast, breakfast_nutrition')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(365);

  return <DailyLogView userId={user.id} logs={logs ?? []} />;
}
