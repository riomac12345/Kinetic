'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL   = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type Exercise = { id: string; name: string; type: string };
type PlanExercise = {
  id: string; sets: number; reps: number | null; weight: number | null;
  hold_time: number | null; rest_timer_seconds: number;
  exercises: Exercise;
};
type PlanDay = { id: string; day_of_week: number; is_rest: boolean; plan_exercises: PlanExercise[] };
type Plan    = { id: string; name: string; plan_days: PlanDay[] };

type Props = { userId: string; plan: Plan | null; exercises: Exercise[] };

const TYPE_OPTIONS = [
  { id: 'reps',     label: 'Reps' },
  { id: 'weighted', label: 'Weighted' },
  { id: 'timed',    label: 'Timed' },
];

function AddExerciseSheet({
  exercises, onAdd, onCreateExercise, onClose,
}: {
  exercises: Exercise[];
  onAdd: (ex: Exercise) => void;
  onCreateExercise: (name: string, type: string) => Promise<Exercise | null>;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newType, setNewType] = useState('reps');
  const filtered = exercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
  const trimmed = search.trim();
  const showCreate = trimmed.length >= 2;

  async function handleCreate() {
    setCreating(true);
    const ex = await onCreateExercise(trimmed, newType);
    setCreating(false);
    if (ex) { onAdd(ex); onClose(); }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div
        className="anim-slide-up relative mt-auto rounded-t-3xl flex flex-col"
        style={{
          background: 'linear-gradient(160deg, #120f2a 0%, #0e0b24 100%)',
          border: '1px solid rgba(124,90,246,0.18)',
          maxHeight: '75vh',
        }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-base font-bold text-white" style={{ letterSpacing: '-0.02em' }}>Add exercise</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(124,90,246,0.1)', border: '1px solid rgba(124,90,246,0.18)', color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div className="px-4 pb-3">
          <input
            autoFocus
            type="text"
            placeholder="Search or create exercise…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-[rgba(255,255,255,0.3)] outline-none"
            style={{
              background: 'rgba(124,90,246,0.07)',
              border: '1px solid rgba(124,90,246,0.18)',
              transition: 'border-color 150ms ease',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,90,246,0.45)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(124,90,246,0.18)')}
          />
        </div>
        <div className="overflow-y-auto px-4 pb-6 flex flex-col gap-2">
          {filtered.map(ex => (
            <button
              key={ex.id}
              onClick={() => { onAdd(ex); onClose(); }}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-left"
              style={{
                background: 'rgba(124,90,246,0.07)',
                border: '1px solid rgba(124,90,246,0.12)',
                transition: 'background 150ms ease, border-color 150ms ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.13)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,90,246,0.22)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.07)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,90,246,0.12)';
              }}
            >
              <span className="text-sm font-medium text-white">{ex.name}</span>
              <span className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.38)' }}>{ex.type}</span>
            </button>
          ))}

          {showCreate && (
            <div
              className="rounded-xl px-4 py-3 mt-1"
              style={{ background: 'rgba(124,90,246,0.05)', border: '1px dashed rgba(124,90,246,0.25)' }}
            >
              <p className="text-xs font-semibold mb-2.5" style={{ color: 'rgba(167,139,248,0.7)' }}>
                Create &ldquo;{trimmed}&rdquo;
              </p>
              <div className="flex gap-2 mb-3">
                {TYPE_OPTIONS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setNewType(t.id)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                    style={{
                      background: newType === t.id ? 'rgba(124,90,246,0.2)' : 'rgba(124,90,246,0.07)',
                      border: newType === t.id ? '1px solid rgba(124,90,246,0.45)' : '1px solid rgba(124,90,246,0.12)',
                      color: newType === t.id ? '#a78bf8' : 'rgba(255,255,255,0.45)',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #7c5af6 0%, #6646e0 100%)',
                  transition: 'opacity 150ms ease',
                }}
                onMouseEnter={e => { if (!creating) (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              >
                {creating ? 'Creating…' : '+ Add to plan'}
              </button>
            </div>
          )}

          {!showCreate && filtered.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Type a name to search or create an exercise
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ExerciseEditor({
  pe, onChange, onRemove,
}: {
  pe: PlanExercise; onChange: (updated: PlanExercise) => void; onRemove: () => void;
}) {
  const type = pe.exercises.type;

  function field(label: string, value: number | null, key: keyof PlanExercise) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(167,139,248,0.55)' }}>{label}</label>
        <input
          type="number"
          inputMode="numeric"
          value={value ?? ''}
          onChange={e => onChange({ ...pe, [key]: e.target.value === '' ? null : Number(e.target.value) })}
          className="w-full px-3 py-2 rounded-lg text-sm text-white text-center outline-none"
          style={{
            background: 'rgba(124,90,246,0.08)',
            border: '1px solid rgba(124,90,246,0.14)',
            transition: 'border-color 150ms ease',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,90,246,0.45)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(124,90,246,0.14)')}
        />
      </div>
    );
  }

  return (
    <div
      className="px-4 py-3.5 rounded-2xl"
      style={{ background: 'rgba(124,90,246,0.07)', border: '1px solid rgba(124,90,246,0.12)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-white" style={{ letterSpacing: '-0.01em' }}>{pe.exercises.name}</p>
        <button
          onClick={onRemove}
          className="p-1 transition-colors"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
        </button>
      </div>
      {type === 'weighted' ? (
        <div className="grid grid-cols-2 gap-2">
          {field('Sets', pe.sets, 'sets')}
          {field('Reps', pe.reps, 'reps')}
          {field('Weight (kg)', pe.weight, 'weight')}
          {field('Rest (s)', pe.rest_timer_seconds, 'rest_timer_seconds')}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {field('Sets', pe.sets, 'sets')}
          {type === 'timed' ? field('Hold (s)', pe.hold_time, 'hold_time') : field('Reps', pe.reps, 'reps')}
          {field('Rest (s)', pe.rest_timer_seconds, 'rest_timer_seconds')}
        </div>
      )}
    </div>
  );
}

export default function PlanView({ userId, plan: initialPlan, exercises: initialExercises }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [plan, setPlan] = useState<Plan | null>(initialPlan);
  const [planName, setPlanName] = useState(initialPlan?.name ?? 'My Training Plan');
  const [selectedDay, setSelectedDay] = useState(0);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);

  async function createExercise(name: string, type: string): Promise<Exercise | null> {
    const { data, error } = await supabase
      .from('exercises')
      .insert({ name, type, user_id: userId, is_default: false })
      .select('id, name, type')
      .single();
    if (error || !data) return null;
    const ex = data as Exercise;
    setExercises(prev => [...prev, ex].sort((a, b) => a.name.localeCompare(b.name)));
    return ex;
  }

  const days: PlanDay[] = plan
    ? [...Array(7)].map((_, i) => {
        const existing = plan.plan_days?.find(d => d.day_of_week === i);
        return existing ?? { id: `new-${i}`, day_of_week: i, is_rest: false, plan_exercises: [] };
      })
    : [...Array(7)].map((_, i) => ({ id: `new-${i}`, day_of_week: i, is_rest: false, plan_exercises: [] }));

  const [localDays, setLocalDays] = useState<PlanDay[]>(days);
  const today = localDays[selectedDay];

  function toggleRest(dayIdx: number) {
    setLocalDays(prev => prev.map((d, i) => i === dayIdx ? { ...d, is_rest: !d.is_rest } : d));
  }

  function addExercise(ex: Exercise) {
    const newPe: PlanExercise = {
      id: `new-pe-${Date.now()}`,
      sets: 3,
      reps: ex.type !== 'timed' ? 8 : null,
      weight: ex.type === 'weighted' ? 0 : null,
      hold_time: ex.type === 'timed' ? 30 : null,
      rest_timer_seconds: 90,
      exercises: ex,
    };
    setLocalDays(prev => prev.map((d, i) =>
      i === selectedDay ? { ...d, plan_exercises: [...d.plan_exercises, newPe] } : d
    ));
  }

  function updateExercise(dayIdx: number, peIdx: number, updated: PlanExercise) {
    setLocalDays(prev => prev.map((d, i) =>
      i === dayIdx ? { ...d, plan_exercises: d.plan_exercises.map((pe, j) => j === peIdx ? updated : pe) } : d
    ));
  }

  function removeExercise(dayIdx: number, peIdx: number) {
    setLocalDays(prev => prev.map((d, i) =>
      i === dayIdx ? { ...d, plan_exercises: d.plan_exercises.filter((_, j) => j !== peIdx) } : d
    ));
  }

  async function createPlan() {
    setCreatingPlan(true);
    const { data, error } = await supabase
      .from('training_plan')
      .insert({ user_id: userId, name: planName })
      .select('id, name')
      .single();
    if (error || !data) { setCreatingPlan(false); return; }
    setPlan({ id: data.id, name: data.name, plan_days: [] });
    setCreatingPlan(false);
  }

  async function savePlan() {
    if (!plan) return;
    setSaving(true);
    try {
      await supabase.from('training_plan').update({ name: planName }).eq('id', plan.id);

      for (const day of localDays) {
        let dayId = day.id;
        if (day.id.startsWith('new-') && !day.is_rest && day.plan_exercises.length === 0) continue;

        if (day.id.startsWith('new-')) {
          const { data } = await supabase
            .from('plan_days')
            .insert({ plan_id: plan.id, day_of_week: day.day_of_week, is_rest: day.is_rest })
            .select('id')
            .single();
          if (!data) continue;
          dayId = data.id;
        } else {
          await supabase.from('plan_days').update({ is_rest: day.is_rest }).eq('id', dayId);
          await supabase.from('plan_exercises').delete().eq('plan_day_id', dayId);
        }

        if (!day.is_rest && day.plan_exercises.length > 0) {
          await supabase.from('plan_exercises').insert(
            day.plan_exercises.map(pe => ({
              plan_day_id: dayId,
              exercise_id: pe.exercises.id,
              sets: pe.sets ?? 3,
              reps: pe.reps,
              weight: pe.weight,
              hold_time: pe.hold_time,
              rest_timer_seconds: pe.rest_timer_seconds ?? 90,
            }))
          );
        }
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!plan) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <div
          className="anim-float w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'rgba(124,90,246,0.1)', border: '1px solid rgba(124,90,246,0.2)', boxShadow: '0 0 24px rgba(124,90,246,0.15)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bf8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2" style={{ letterSpacing: '-0.02em' }}>No training plan</h2>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.38)', lineHeight: '1.6' }}>Build your weekly schedule here.</p>
        <div className="w-full max-w-xs mb-4">
          <input
            type="text"
            value={planName}
            onChange={e => setPlanName(e.target.value)}
            placeholder="Plan name…"
            className="w-full px-4 py-3 rounded-xl text-sm text-white text-center outline-none"
            style={{
              background: 'rgba(124,90,246,0.07)',
              border: '1px solid rgba(124,90,246,0.18)',
              transition: 'border-color 150ms ease',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,90,246,0.5)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(124,90,246,0.18)')}
          />
        </div>
        <button
          onClick={createPlan}
          disabled={creatingPlan || !planName.trim()}
          className="anim-glow px-6 py-3 rounded-full text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #7c5af6 0%, #6646e0 100%)' }}
        >
          {creatingPlan ? 'Creating…' : 'Create plan'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh px-4 pt-20 pb-24">
      {/* Header */}
      <div className="anim-fade-up mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-0.5" style={{ color: 'rgba(167,139,248,0.65)' }}>Training Plan</p>
          <input
            type="text"
            value={planName}
            onChange={e => setPlanName(e.target.value)}
            className="text-xl font-bold text-white bg-transparent border-none outline-none w-full"
            style={{ letterSpacing: '-0.03em' }}
          />
        </div>
        <button
          onClick={savePlan}
          disabled={saving}
          className="px-4 py-2 rounded-full text-xs font-semibold text-white disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, #7c5af6 0%, #6646e0 100%)',
            boxShadow: '0 0 16px rgba(124,90,246,0.35)',
            transition: 'opacity 150ms ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Day tabs */}
      <div className="anim-fade-up-1 flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
        {localDays.map((day, i) => {
          const active = i === selectedDay;
          const hasWork = !day.is_rest && day.plan_exercises.length > 0;
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl"
              style={{
                background: active ? 'rgba(124,90,246,0.15)' : 'rgba(124,90,246,0.05)',
                border: active ? '1px solid rgba(124,90,246,0.35)' : '1px solid rgba(124,90,246,0.1)',
                transition: 'background 150ms ease, border-color 150ms ease',
                minWidth: 44,
              }}
            >
              <span
                className="text-[10px] font-bold uppercase"
                style={{ color: active ? '#a78bf8' : 'rgba(255,255,255,0.38)', letterSpacing: '0.05em' }}
              >
                {DAY_LABELS[i]}
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: day.is_rest
                    ? 'rgba(255,255,255,0.12)'
                    : hasWork
                      ? '#7c5af6'
                      : 'rgba(124,90,246,0.2)',
                  boxShadow: hasWork && !day.is_rest ? '0 0 6px rgba(124,90,246,0.6)' : 'none',
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Day content */}
      <div className="anim-fade-up-2 mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-white" style={{ letterSpacing: '-0.02em' }}>{DAY_FULL[selectedDay]}</h2>
        <button
          onClick={() => toggleRest(selectedDay)}
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{
            background: today.is_rest ? 'rgba(124,90,246,0.07)' : 'rgba(124,90,246,0.12)',
            color: today.is_rest ? 'rgba(255,255,255,0.45)' : '#a78bf8',
            border: today.is_rest ? '1px solid rgba(124,90,246,0.12)' : '1px solid rgba(124,90,246,0.28)',
            transition: 'all 150ms ease',
          }}
        >
          {today.is_rest ? 'Mark active' : 'Rest day'}
        </button>
      </div>

      {today.is_rest ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(124,90,246,0.07)', border: '1px solid rgba(124,90,246,0.12)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,248,0.5)" strokeWidth="1.75" strokeLinecap="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>Rest day — recovery is part of the plan.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2.5 mb-4">
            {today.plan_exercises.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: 'rgba(255,255,255,0.35)' }}>No exercises yet. Add one below.</p>
            )}
            {today.plan_exercises.map((pe, i) => (
              <ExerciseEditor
                key={pe.id}
                pe={pe}
                onChange={updated => updateExercise(selectedDay, i, updated)}
                onRemove={() => removeExercise(selectedDay, i)}
              />
            ))}
          </div>
          <button
            onClick={() => setShowAddExercise(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium"
            style={{
              background: 'rgba(124,90,246,0.05)',
              border: '1px dashed rgba(124,90,246,0.22)',
              color: 'rgba(255,255,255,0.4)',
              transition: 'background 150ms ease, color 150ms ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.1)';
              (e.currentTarget as HTMLElement).style.color = '#ffffff';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.05)';
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add exercise
          </button>
        </>
      )}

      {showAddExercise && (
        <AddExerciseSheet
          exercises={exercises}
          onAdd={addExercise}
          onCreateExercise={createExercise}
          onClose={() => setShowAddExercise(false)}
        />
      )}
    </div>
  );
}
