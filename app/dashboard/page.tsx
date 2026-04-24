import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardView from '@/components/DashboardView';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth');

  const today = new Date().toISOString().split('T')[0];

  const [{ data: profile }, { data: plan }, { data: todaySession }, { data: sessionDates }, { data: todayWellness }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('training_plan')
      .select(`
        id,
        name,
        plan_days (
          id,
          day_of_week,
          is_rest,
          plan_exercises (
            id,
            sort_order,
            sets,
            reps,
            weight,
            hold_time,
            rest_timer_seconds,
            exercises (
              id,
              name,
              type
            )
          )
        )
      `)
      .eq('user_id', user.id)
      .order('id', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .single(),
    supabase
      .from('sessions')
      .select('date', { count: 'exact' })
      .eq('user_id', user.id),
    supabase
      .from('wellness_logs')
      .select('id, sleep_hours, food_note, climb_strength')
      .eq('user_id', user.id)
      .eq('date', today)
      .single(),
  ]);

  const totalDaysLogged = sessionDates?.length ?? 0;

  // Sort plan_exercises by sort_order so dashboard respects saved order
  if (plan?.plan_days) {
    for (const day of plan.plan_days as any[]) {
      if (day.plan_exercises) {
        day.plan_exercises.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      }
    }
  }

  // Fetch which exercises were already logged in today's session
  let loggedExerciseIds: string[] = [];
  if (todaySession?.id) {
    const { data: loggedToday } = await supabase
      .from('session_exercises')
      .select('exercise_id')
      .eq('session_id', todaySession.id);
    loggedExerciseIds = loggedToday?.map((r: { exercise_id: string }) => r.exercise_id) ?? [];
  }

  return (
    <DashboardView
      profile={profile}
      plan={plan as any ?? null}
      todaySessionId={todaySession?.id ?? null}
      loggedExerciseIds={loggedExerciseIds}
      userId={user.id}
      totalDaysLogged={totalDaysLogged}
      todayWellness={todayWellness ?? null}
    />
  );
}
