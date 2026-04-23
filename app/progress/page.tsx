import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProgressView from '@/components/ProgressView';

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  // Fetch all session sets grouped by exercise
  const { data: sets } = await supabase
    .from('session_sets')
    .select(`
      reps, weight, hold_time_seconds,
      session_exercises (
        type,
        exercises ( id, name, type ),
        sessions ( date )
      )
    `);

  // Fetch fatigue scores
  const { data: fatigueSessions } = await supabase
    .from('sessions')
    .select('date, fatigue_score')
    .eq('user_id', user.id)
    .not('fatigue_score', 'is', null)
    .order('date', { ascending: true });

  const fatigueData = (fatigueSessions ?? []).map((s: { date: string; fatigue_score: number }) => ({
    date: s.date,
    score: s.fatigue_score,
  }));

  // Group by exercise, one data point per session date (take max value per date)
  type DataPoint = { date: string; value: number };
  type ExerciseData = { id: string; name: string; type: string; data: DataPoint[]; pr: number };
  const exerciseMap = new Map<string, ExerciseData>();

  for (const set of (sets ?? []) as any[]) {
    const se = set.session_exercises as { type: string; exercises: { id: string; name: string; type: string }; sessions: { date: string } } | null;
    if (!se?.exercises || !se?.sessions) continue;
    const ex = se.exercises;
    const date = se.sessions.date;
    const value = ex.type === 'timed'
      ? (set.hold_time_seconds ?? 0)
      : ex.type === 'weighted'
        ? ((set.reps ?? 0) * (set.weight ?? 0))
        : (set.reps ?? 0);

    if (!exerciseMap.has(ex.id)) {
      exerciseMap.set(ex.id, { id: ex.id, name: ex.name, type: ex.type, data: [], pr: 0 });
    }
    const entry = exerciseMap.get(ex.id)!;
    const existing = entry.data.find(d => d.date === date);
    if (existing) { if (value > existing.value) existing.value = value; }
    else entry.data.push({ date, value });
    if (value > entry.pr) entry.pr = value;
  }

  // Sort each exercise's data chronologically
  Array.from(exerciseMap.values()).forEach(entry => {
    entry.data.sort((a, b) => a.date.localeCompare(b.date));
  });

  return <ProgressView exercises={Array.from(exerciseMap.values())} fatigueData={fatigueData} />;
}
