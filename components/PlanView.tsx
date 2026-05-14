'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
type Props   = { userId: string; plan: Plan | null; exercises: Exercise[] };

const TYPE_OPTIONS = [
  { id: 'reps',     label: 'Reps' },
  { id: 'weighted', label: 'Weighted' },
  { id: 'timed',    label: 'Timed' },
];

function AddExerciseSheet({ exercises, onAdd, onCreateExercise, onClose }: {
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
        className="anim-slide-up relative mt-auto flex flex-col"
        style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', maxHeight: '75vh' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text)' }}>
            Add exercise
          </p>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: '12px 20px 0' }}>
          <input
            autoFocus
            type="text"
            placeholder="Search or create exercise…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: 14, outline: 'none',
              transition: 'border-color 140ms ease',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
        </div>

        <div style={{ overflowY: 'auto', padding: '12px 20px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map(ex => (
            <button
              key={ex.id}
              onClick={() => { onAdd(ex); onClose(); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 14px', textAlign: 'left', width: '100%',
                background: 'transparent', border: '1px solid var(--border)',
                cursor: 'pointer', transition: 'background 140ms ease, border-color 140ms ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
            >
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{ex.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'capitalize', fontFamily: 'var(--font-mono)' }}>{ex.type}</span>
            </button>
          ))}

          {showCreate && (
            <div style={{ marginTop: 8, padding: '14px', border: '1px dashed var(--border-2)', background: 'var(--surface-2)' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 10 }}>
                Create &ldquo;{trimmed}&rdquo;
              </p>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {TYPE_OPTIONS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setNewType(t.id)}
                    style={{
                      flex: 1, padding: '7px 0',
                      background: newType === t.id ? 'var(--accent-bg)' : 'transparent',
                      border: newType === t.id ? '1.5px solid var(--accent-border)' : '1px solid var(--border)',
                      fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: newType === t.id ? 'var(--accent)' : 'var(--text-3)',
                      cursor: 'pointer', transition: 'all 120ms ease',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleCreate}
                disabled={creating}
                style={{
                  width: '100%', padding: '12px',
                  background: 'var(--accent)', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bg)',
                  opacity: creating ? 0.5 : 1, transition: 'opacity 120ms ease',
                }}
              >
                {creating ? 'Creating…' : 'Add to plan'}
              </button>
            </div>
          )}

          {!showCreate && filtered.length === 0 && (
            <p style={{ fontSize: 13, textAlign: 'center', padding: '20px 0', color: 'var(--text-3)' }}>
              Type a name to search or create an exercise
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function IconGrip({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <circle cx="5" cy="4" r="1.2" /><circle cx="5" cy="8" r="1.2" /><circle cx="5" cy="12" r="1.2" />
      <circle cx="11" cy="4" r="1.2" /><circle cx="11" cy="8" r="1.2" /><circle cx="11" cy="12" r="1.2" />
    </svg>
  );
}

function ExerciseEditor({ pe, onChange, onRemove, dragHandleProps }: {
  pe: PlanExercise; onChange: (updated: PlanExercise) => void; onRemove: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
}) {
  const type = pe.exercises.type;

  function field(label: string, value: number | null, key: keyof PlanExercise) {
    return (
      <div>
        <label style={{
          display: 'block', fontFamily: 'var(--font-display)',
          fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--text-3)', marginBottom: 4,
        }}>{label}</label>
        <input
          type="number" inputMode="numeric"
          value={value ?? ''}
          onChange={e => onChange({ ...pe, [key]: e.target.value === '' ? null : Number(e.target.value) })}
          style={{
            width: '100%', padding: '8px 10px',
            background: 'var(--bg)', border: '1px solid var(--border)',
            fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500,
            color: 'var(--text)', textAlign: 'center', outline: 'none',
            transition: 'border-color 140ms ease',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        />
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {dragHandleProps && (
            <span {...dragHandleProps} style={{ color: 'var(--text-3)', cursor: 'grab', touchAction: 'none', flexShrink: 0 }}>
              <IconGrip size={14} />
            </span>
          )}
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pe.exercises.name}
          </p>
        </div>
        <button
          onClick={onRemove}
          style={{
            width: 28, height: 28, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer',
            transition: 'color 140ms ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
          </svg>
        </button>
      </div>

      {type === 'weighted' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {field('Sets', pe.sets, 'sets')}
          {field('Reps', pe.reps, 'reps')}
          {field('Weight (kg)', pe.weight, 'weight')}
          {field('Rest (s)', pe.rest_timer_seconds, 'rest_timer_seconds')}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {field('Sets', pe.sets, 'sets')}
          {type === 'timed' ? field('Hold (s)', pe.hold_time, 'hold_time') : field('Reps', pe.reps, 'reps')}
          {field('Rest (s)', pe.rest_timer_seconds, 'rest_timer_seconds')}
        </div>
      )}
    </div>
  );
}

function SortableExerciseItem({ pe, onChange, onRemove }: {
  pe: PlanExercise; onChange: (updated: PlanExercise) => void; onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pe.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.45 : 1, position: 'relative', zIndex: isDragging ? 10 : 0 }}>
      <ExerciseEditor pe={pe} onChange={onChange} onRemove={onRemove} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

export default function PlanView({ userId, plan: initialPlan, exercises: initialExercises }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [plan, setPlan] = useState<Plan | null>(initialPlan);
  const [planName, setPlanName] = useState(initialPlan?.name ?? 'My Training Plan');
  const [selectedDay, setSelectedDay] = useState(() => (new Date().getDay() + 6) % 7);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showCopyPicker, setShowCopyPicker] = useState(false);
  const [copyPickerPos, setCopyPickerPos] = useState({ top: 0, right: 0 });
  const copyBtnRef = useRef<HTMLButtonElement>(null);
  const [saving, setSaving] = useState(false);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>(() => {
    const seen = new Set<string>();
    return initialExercises.filter(e => seen.has(e.name) ? false : (seen.add(e.name), true));
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setLocalDays(prev => prev.map((d, i) => {
      if (i !== selectedDay) return d;
      const oldIdx = d.plan_exercises.findIndex(pe => pe.id === active.id);
      const newIdx = d.plan_exercises.findIndex(pe => pe.id === over.id);
      return { ...d, plan_exercises: arrayMove(d.plan_exercises, oldIdx, newIdx) };
    }));
  }

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
      sets: 3, reps: ex.type !== 'timed' ? 8 : null,
      weight: ex.type === 'weighted' ? 0 : null,
      hold_time: ex.type === 'timed' ? 30 : null,
      rest_timer_seconds: 90, exercises: ex,
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

  function copyToDay(targetIdx: number) {
    const sourceExercises = localDays[selectedDay].plan_exercises;
    setLocalDays(prev => prev.map((d, i) => {
      if (i !== targetIdx) return d;
      const copied = sourceExercises.map((pe, j) => ({ ...pe, id: `new-pe-${Date.now()}-${j}` }));
      return { ...d, is_rest: false, plan_exercises: copied };
    }));
    setShowCopyPicker(false);
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
            .select('id').single();
          if (!data) continue;
          dayId = data.id;
        } else {
          await supabase.from('plan_days').update({ is_rest: day.is_rest }).eq('id', dayId);
          await supabase.from('plan_exercises').delete().eq('plan_day_id', dayId);
        }
        if (!day.is_rest && day.plan_exercises.length > 0) {
          await supabase.from('plan_exercises').insert(
            day.plan_exercises.map((pe, idx) => ({
              plan_day_id: dayId, exercise_id: pe.exercises.id,
              sets: pe.sets ?? 3, reps: pe.reps, weight: pe.weight,
              hold_time: pe.hold_time, rest_timer_seconds: pe.rest_timer_seconds ?? 90,
              sort_order: idx,
            }))
          );
        }
      }
      router.refresh();
    } finally { setSaving(false); }
  }

  if (!plan) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>Training Plan</p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 6 }}>
          No plan yet
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.65, marginBottom: 28 }}>Build your weekly schedule here.</p>
        <div style={{ width: '100%', maxWidth: 300, marginBottom: 12 }}>
          <input
            type="text" value={planName} onChange={e => setPlanName(e.target.value)} placeholder="Plan name…"
            style={{
              width: '100%', padding: '12px 14px', textAlign: 'center',
              background: 'var(--surface)', border: '1px solid var(--border)',
              fontSize: 14, color: 'var(--text)', outline: 'none',
              transition: 'border-color 140ms ease',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
        </div>
        <button
          onClick={createPlan}
          disabled={creatingPlan || !planName.trim()}
          style={{
            padding: '12px 28px', background: 'var(--accent)', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bg)',
            opacity: creatingPlan || !planName.trim() ? 0.4 : 1,
          }}
        >
          {creatingPlan ? 'Creating…' : 'Create plan'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', padding: '0 20px 48px' }}>
      {/* Header */}
      <div className="anim-fade-up" style={{ paddingTop: 52, paddingBottom: 20, borderBottom: '1px solid rgba(240,112,48,0.1)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>
            Training Plan
          </p>
          <input
            type="text" value={planName} onChange={e => setPlanName(e.target.value)}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 8vw, 42px)',
              fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase',
              color: 'var(--text)', width: '100%',
            }}
          />
        </div>
        <button
          onClick={savePlan}
          disabled={saving}
          style={{
            padding: '10px 20px', flexShrink: 0, marginTop: 28, borderRadius: 10,
            background: 'linear-gradient(135deg, #F07030 0%, #F59050 100%)',
            border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase', color: 'white',
            boxShadow: saving ? 'none' : '0 0 16px rgba(240,112,48,0.4)',
            opacity: saving ? 0.5 : 1, transition: 'opacity 120ms ease',
          }}
          onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLElement).style.opacity = '0.82'; }}
          onMouseLeave={e => { if (!saving) (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Day tabs */}
      <div className="anim-fade-up-1" style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(240,112,48,0.1)', marginBottom: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {localDays.map((day, i) => {
          const active = i === selectedDay;
          const hasWork = !day.is_rest && day.plan_exercises.length > 0;
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              style={{
                flex: 1, minWidth: 40, padding: '12px 4px', flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                background: 'transparent', border: 'none',
                borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1, cursor: 'pointer',
                transition: 'border-color 140ms ease',
              }}
            >
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: active ? 'var(--text)' : 'var(--text-3)',
              }}>
                {DAY_LABELS[i]}
              </span>
              <span style={{
                width: 5, height: 5,
                background: day.is_rest ? 'transparent' : hasWork ? 'var(--accent)' : 'var(--border-2)',
                border: day.is_rest ? '1px solid var(--border)' : 'none',
              }} />
            </button>
          );
        })}
      </div>

      {/* Day content */}
      <div className="anim-fade-up-2" style={{ paddingTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text)' }}>
          {DAY_FULL[selectedDay]}
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Copy to day */}
          {!today.is_rest && today.plan_exercises.length > 0 && (
            <>
              <button
                ref={copyBtnRef}
                onClick={() => {
                  if (copyBtnRef.current) {
                    const r = copyBtnRef.current.getBoundingClientRect();
                    setCopyPickerPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
                  }
                  setShowCopyPicker(v => !v);
                }}
                style={{
                  padding: '7px 12px', background: 'transparent',
                  border: '1px solid var(--border-2)',
                  fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--accent)', cursor: 'pointer', transition: 'all 140ms ease',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-bg)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy to
              </button>
            </>
          )}
          <button
            onClick={() => toggleRest(selectedDay)}
            style={{
              padding: '7px 14px',
              background: 'transparent',
              border: `1px solid ${today.is_rest ? 'var(--border)' : 'var(--border-2)'}`,
              fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: today.is_rest ? 'var(--text-3)' : 'var(--text-2)',
              cursor: 'pointer', transition: 'all 140ms ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = today.is_rest ? 'var(--border)' : 'var(--border-2)'; (e.currentTarget as HTMLElement).style.color = today.is_rest ? 'var(--text-3)' : 'var(--text-2)'; }}
          >
            {today.is_rest ? 'Mark active' : 'Rest day'}
          </button>
        </div>
      </div>

      {today.is_rest ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Rest day — recovery is part of the plan.</p>
        </div>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={today.plan_exercises.map(pe => pe.id)} strategy={verticalListSortingStrategy}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                {today.plan_exercises.length === 0 && (
                  <p style={{ fontSize: 13, textAlign: 'center', padding: '24px 0', color: 'var(--text-3)' }}>
                    No exercises yet. Add one below.
                  </p>
                )}
                {today.plan_exercises.map((pe, i) => (
                  <SortableExerciseItem
                    key={pe.id} pe={pe}
                    onChange={updated => updateExercise(selectedDay, i, updated)}
                    onRemove={() => removeExercise(selectedDay, i)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button
            onClick={() => setShowAddExercise(true)}
            style={{
              width: '100%', padding: '13px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'transparent', border: '1px dashed var(--border-2)',
              fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)',
              cursor: 'pointer', transition: 'border-color 140ms ease, color 140ms ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--text-3)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add exercise
          </button>
        </>
      )}

      {showAddExercise && (
        <AddExerciseSheet
          exercises={exercises} onAdd={addExercise}
          onCreateExercise={createExercise}
          onClose={() => setShowAddExercise(false)}
        />
      )}

      {showCopyPicker && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setShowCopyPicker(false)} />
          <div style={{
            position: 'fixed', top: copyPickerPos.top, right: copyPickerPos.right, zIndex: 9999,
            background: 'var(--surface)', border: '1px solid var(--border-2)',
            borderRadius: 10, overflow: 'hidden', minWidth: 140,
            boxShadow: '0 4px 20px rgba(20,16,50,0.14)',
          }}>
            <p style={{ padding: '8px 12px 6px', fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
              Copy to day
            </p>
            {DAY_FULL.map((label, i) => {
              if (i === selectedDay) return null;
              const targetHasWork = localDays[i].plan_exercises.length > 0;
              return (
                <button
                  key={i}
                  onClick={() => copyToDay(i)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '9px 12px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.04em', color: 'var(--text)',
                    transition: 'background 100ms ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-bg)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  {label}
                  {targetHasWork && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)' }}>
                      overwrites
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
