export type Profile = {
  id: string;
  username: string;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  level: 'beginner' | 'intermediate' | 'advanced' | null;
  created_at: string;
};

export type Exercise = {
  id: string;
  name: string;
  type: 'reps' | 'weighted' | 'timed';
  is_default: boolean;
  user_id: string | null;
};

export type TrainingPlan = {
  id: string;
  user_id: string;
  name: string;
};

export type PlanDay = {
  id: string;
  plan_id: string;
  day_of_week: number; // 0 = Mon, 6 = Sun
  is_rest: boolean;
};

export type PlanExercise = {
  id: string;
  plan_day_id: string;
  exercise_id: string;
  sets: number;
  reps: number | null;
  weight: number | null;
  hold_time: number | null;
  rest_timer_seconds: number;
};

export type Session = {
  id: string;
  user_id: string;
  date: string;
  feel: 1 | 2 | 3 | 4 | 5 | null;
  notes: string | null;
};

export type SessionExercise = {
  id: string;
  session_id: string;
  exercise_id: string;
  type: 'reps' | 'weighted' | 'timed';
};

export type SessionSet = {
  id: string;
  session_exercise_id: string;
  reps: number | null;
  weight: number | null;
  hold_time_seconds: number | null;
};

export type SkillProgression = {
  id: string;
  user_id: string;
  skill_name: string;
  current_stage: number;
  updated_at: string;
};

export type Follow = {
  id: string;
  follower_id: string;
  following_id: string;
};

export type Tag = {
  id: string;
  user_id: string;
  name: string;
};

export type SessionTag = {
  id: string;
  session_id: string;
  tag_id: string;
};
