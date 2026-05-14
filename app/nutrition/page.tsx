import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import NutritionView from '@/components/NutritionView';

export default async function NutritionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const { data: profile } = await supabase
    .from('profiles')
    .select('calorie_goal, protein_goal')
    .eq('id', user.id)
    .single();

  const { data: logs } = await supabase
    .from('wellness_logs')
    .select('id, date, food_breakfast, food_lunch, food_dinner, food_pre_climb, breakfast_nutrition, lunch_nutrition, dinner_nutrition, pre_climb_nutrition')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(60);

  return (
    <NutritionView
      userId={user.id}
      logs={(logs ?? []) as any}
      calorieGoal={profile?.calorie_goal ?? 2000}
      proteinGoal={profile?.protein_goal ?? 150}
    />
  );
}
