import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PlanView from '@/components/PlanView';

export default async function PlanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const { data: plan } = await supabase
    .from('training_plan')
    .select(`
      id, name,
      plan_days (
        id, day_of_week, is_rest,
        plan_exercises (
          id, sets, reps, weight, hold_time, rest_timer_seconds,
          exercises ( id, name, type )
        )
      )
    `)
    .eq('user_id', user.id)
    .order('id', { ascending: false })
    .limit(1)
    .single();

  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, name, type')
    .or(`is_default.eq.true,user_id.eq.${user.id}`)
    .order('name');

  return <PlanView userId={user.id} plan={plan as any ?? null} exercises={exercises ?? []} />;
}
