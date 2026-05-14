'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import DashboardView from '@/components/DashboardView';
import DailyLogView from '@/components/DailyLogView';
import ProgressView from '@/components/ProgressView';
import LeaderboardView from '@/components/LeaderboardView';
import HistoryView from '@/components/HistoryView';
import SettingsView from '@/components/SettingsView';
import PlanView from '@/components/PlanView';
import NutritionView from '@/components/NutritionView';

const MOCK_PROFILE = { username: 'rio', name: 'Rio' };
const MOCK_USER_ID = 'preview-user';

const MOCK_EXERCISES_BASE = [
  { id: 'ex-1', name: 'Pull-ups', type: 'reps' },
  { id: 'ex-2', name: 'Dumbbell Rows', type: 'weighted' },
  { id: 'ex-3', name: 'Dead Hang', type: 'timed' },
  { id: 'ex-4', name: 'Ring Push-ups', type: 'reps' },
  { id: 'ex-5', name: 'L-sit', type: 'timed' },
];

const MOCK_PLAN_EXERCISES = [
  { id: 'pe-1', sets: 4, reps: 8, weight: null, hold_time: null, rest_timer_seconds: 90, exercises: MOCK_EXERCISES_BASE[0] },
  { id: 'pe-2', sets: 3, reps: 12, weight: 20, hold_time: null, rest_timer_seconds: 60, exercises: MOCK_EXERCISES_BASE[1] },
  { id: 'pe-3', sets: 3, reps: null, weight: null, hold_time: 30, rest_timer_seconds: 60, exercises: MOCK_EXERCISES_BASE[2] },
  { id: 'pe-4', sets: 3, reps: 15, weight: null, hold_time: null, rest_timer_seconds: 45, exercises: MOCK_EXERCISES_BASE[3] },
];

const MOCK_PLAN = {
  id: 'plan-1',
  name: 'Strength Block',
  plan_days: Array.from({ length: 7 }, (_, i) => ({
    id: `pd-${i}`, day_of_week: i,
    is_rest: i === 5 || i === 6,
    plan_exercises: i === 2 ? MOCK_PLAN_EXERCISES : [],
  })),
};

const MOCK_WELLNESS = {
  id: 'log-1', sleep_hours: 7.5,
  food_breakfast: 'Oats + banana', food_lunch: 'Chicken + rice',
  food_dinner: null, food_pre_climb: 'Energy bar', climb_strength: 8,
};

const MOCK_SESSIONS = [
  { id: 's1', date: '2026-05-13', feel: 4, notes: null, session_exercises: [{id:'se1'},{id:'se2'},{id:'se3'}] },
  { id: 's2', date: '2026-05-11', feel: 3, notes: null, session_exercises: [{id:'se4'},{id:'se5'}] },
  { id: 's3', date: '2026-05-10', feel: 5, notes: null, session_exercises: [{id:'se6'},{id:'se7'},{id:'se8'}] },
  { id: 's4', date: '2026-05-08', feel: 4, notes: null, session_exercises: [{id:'se9'}] },
  { id: 's5', date: '2026-05-07', feel: 3, notes: null, session_exercises: [{id:'se10'},{id:'se11'}] },
  { id: 's6', date: '2026-05-06', feel: 4, notes: null, session_exercises: [{id:'se12'},{id:'se13'}] },
  { id: 's7', date: '2026-05-04', feel: 5, notes: null, session_exercises: [{id:'se14'},{id:'se15'},{id:'se16'}] },
];

const MOCK_PROGRESS_EXERCISES = [
  {
    id: 'ex-1', name: 'Pull-ups', type: 'reps', pr: 15,
    data: [
      { date: '2026-04-01', value: 8 }, { date: '2026-04-08', value: 9 },
      { date: '2026-04-15', value: 10 }, { date: '2026-04-22', value: 11 },
      { date: '2026-04-29', value: 12 }, { date: '2026-05-06', value: 14 },
      { date: '2026-05-13', value: 15 },
    ],
  },
  {
    id: 'ex-3', name: 'Dead Hang', type: 'timed', pr: 62,
    data: [
      { date: '2026-04-01', value: 30 }, { date: '2026-04-10', value: 38 },
      { date: '2026-04-18', value: 45 }, { date: '2026-04-26', value: 52 },
      { date: '2026-05-04', value: 55 }, { date: '2026-05-13', value: 62 },
    ],
  },
  {
    id: 'ex-4', name: 'Ring Push-ups', type: 'reps', pr: 20,
    data: [
      { date: '2026-04-05', value: 12 }, { date: '2026-04-14', value: 14 },
      { date: '2026-04-21', value: 16 }, { date: '2026-04-28', value: 18 },
      { date: '2026-05-09', value: 20 },
    ],
  },
];

const MOCK_FATIGUE = [
  { date: '2026-05-07', score: 3 }, { date: '2026-05-08', score: 5 },
  { date: '2026-05-10', score: 4 }, { date: '2026-05-11', score: 6 },
  { date: '2026-05-13', score: 4 },
];

const MOCK_LEADERBOARD = [
  { user_id: 'u1', username: 'alex_climbs', name: 'Alex', count: 47 },
  { user_id: MOCK_USER_ID, username: 'rio', name: 'Rio', count: 38 },
  { user_id: 'u3', username: 'sam_bars', name: 'Sam', count: 31 },
  { user_id: 'u4', username: 'jordan_fit', name: 'Jordan', count: 24 },
  { user_id: 'u5', username: 'casey_rings', name: 'Casey', count: 18 },
  { user_id: 'u6', username: 'morgan_pull', name: 'Morgan', count: 12 },
];

const MOCK_WELLNESS_LOGS = [
  { id: 'wl1', date: '2026-05-13', sleep_hours: 7.5, food_breakfast: 'Oats + banana', food_lunch: 'Chicken + rice', food_dinner: 'Pasta', food_pre_climb: 'Energy bar', climb_strength: 8 },
  { id: 'wl2', date: '2026-05-12', sleep_hours: 6.5, food_breakfast: 'Eggs', food_lunch: 'Salad', food_dinner: 'Salmon', food_pre_climb: null, climb_strength: 6 },
  { id: 'wl3', date: '2026-05-11', sleep_hours: 8.0, food_breakfast: 'Smoothie', food_lunch: 'Rice bowl', food_dinner: 'Stir fry', food_pre_climb: 'Banana', climb_strength: 9 },
  { id: 'wl4', date: '2026-05-10', sleep_hours: 5.5, food_breakfast: null, food_lunch: 'Sandwich', food_dinner: 'Pizza', food_pre_climb: null, climb_strength: 4 },
];

const MOCK_PROFILE_FULL = {
  id: MOCK_USER_ID, username: 'rio', name: 'Rio McDonald',
  bio: 'Calisthenics & climbing enthusiast.', level: 'intermediate',
};

function PreviewInner() {
  const params = useSearchParams();
  const view = params.get('view') ?? 'dashboard';

  return (
    <div>
      {view === 'dashboard' && (
        <DashboardView
          profile={MOCK_PROFILE}
          plan={MOCK_PLAN as any}
          todaySessionId={null}
          loggedExerciseIds={['ex-1', 'ex-2']}
          userId={MOCK_USER_ID}
          totalDaysLogged={38}
          todayWellness={MOCK_WELLNESS as any}
        />
      )}
      {view === 'plan' && (
        <PlanView userId={MOCK_USER_ID} plan={MOCK_PLAN as any} exercises={MOCK_EXERCISES_BASE} />
      )}
      {view === 'daily-log' && (
        <DailyLogView userId={MOCK_USER_ID} logs={MOCK_WELLNESS_LOGS as any} />
      )}
      {view === 'progress' && (
        <ProgressView exercises={MOCK_PROGRESS_EXERCISES as any} fatigueData={MOCK_FATIGUE} />
      )}
      {view === 'leaderboard' && (
        <LeaderboardView allUsers={MOCK_LEADERBOARD} followingUsers={MOCK_LEADERBOARD.slice(0, 3)} currentUserId={MOCK_USER_ID} />
      )}
      {view === 'history' && (
        <HistoryView sessions={MOCK_SESSIONS as any} />
      )}
      {view === 'settings' && (
        <SettingsView profile={MOCK_PROFILE_FULL} userId={MOCK_USER_ID} email="rio@example.com" />
      )}
      {view === 'nutrition' && (
        <NutritionView
          userId={MOCK_USER_ID}
          logs={MOCK_WELLNESS_LOGS as any}
          calorieGoal={2200}
          proteinGoal={160}
        />
      )}
    </div>
  );
}

export default function DevPreview() {
  return (
    <Suspense fallback={null}>
      <PreviewInner />
    </Suspense>
  );
}
