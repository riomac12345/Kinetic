'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import LogSheet from './LogSheet';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MOTIVATIONAL = [
  'Every rep counts. Keep moving.',
  'Show up. The rest follows.',
  'Discipline beats motivation every time.',
  'Your future self is watching.',
  'One more set. Always one more.',
  'Progress is built in the dark.',
  'Rest is part of the program.',
  'Consistency is the only shortcut.',
  'The grind never lies.',
  'Strong body, sharp mind.',
  'Small steps. Big results.',
  'Today\'s effort is tomorrow\'s strength.',
  'Champions train when no one\'s watching.',
];

function getMotivation() {
  const day = new Date().getDay();
  const hour = new Date().getHours();
  return MOTIVATIONAL[(day * 3 + Math.floor(hour / 8)) % MOTIVATIONAL.length];
}

function greeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Morning';
  if (h >= 12 && h < 17) return 'Afternoon';
  if (h >= 17 && h < 22) return 'Evening';
  return 'Night owl';
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function IconCheck({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconChevronRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconPlus({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  reps:     { bg: 'rgba(124,90,246,0.12)',  border: 'rgba(124,90,246,0.45)',  text: '#a78bf8' },
  weighted: { bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.45)',  text: '#fb923c' },
  timed:    { bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.45)',  text: '#38bdf8' },
};

function ProgressRing({ done, total }: { done: number; total: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? done / total : 0;
  return (
    <div className="relative anim-float" style={{ width: 72, height: 72 }}>
      <svg className="-rotate-90" width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(124,90,246,0.1)" strokeWidth="5" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          stroke="#7c5af6"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          style={{
            transition: 'stroke-dashoffset 700ms cubic-bezier(0.34,1.56,0.64,1)',
            filter: pct > 0 ? 'drop-shadow(0 0 8px rgba(124,90,246,0.7))' : 'none',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold text-white leading-none" style={{ fontSize: 18, letterSpacing: '-0.03em' }}>{done}</span>
        <span className="font-medium leading-none mt-0.5" style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>/{total}</span>
      </div>
    </div>
  );
}

type ExerciseRowProps = {
  name: string; type: string; sets: number; reps: number | null;
  weight: number | null; holdTime: number | null; index: number;
  done: boolean; onDone: () => void; onLog?: () => void;
};

function ExerciseRow({ name, type, sets, reps, weight, holdTime, index, done, onDone, onLog }: ExerciseRowProps) {
  const colors = TYPE_COLORS[type] ?? TYPE_COLORS.reps;

  const targetLabel = (() => {
    if (type === 'timed' && holdTime) return `${sets} × ${holdTime}s`;
    if (type === 'weighted' && weight) return `${sets} × ${reps} @ ${weight}kg`;
    if (reps) return `${sets} × ${reps}`;
    return `${sets} sets`;
  })();

  const typeLabel = type === 'timed' ? 'Hold' : type === 'weighted' ? 'Weighted' : 'Reps';

  return (
    <div
      className="anim-fade-up"
      style={{
        animationDelay: `${index * 0.07}s`,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        borderRadius: 18,
        background: done
          ? 'rgba(124,90,246,0.07)'
          : 'rgba(255,255,255,0.025)',
        border: done
          ? '1px solid rgba(124,90,246,0.2)'
          : '1px solid rgba(124,90,246,0.08)',
        transition: 'all 220ms ease',
      }}
    >
      {/* Type accent bar */}
      <div style={{
        width: 3, height: 36, borderRadius: 99, flexShrink: 0,
        background: done ? 'rgba(124,90,246,0.35)' : colors.border,
        transition: 'background 220ms ease',
      }} />

      {/* Check */}
      <button
        onClick={onDone}
        style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: done ? '#7c5af6' : 'transparent',
          border: done ? '2px solid #7c5af6' : '2px solid rgba(255,255,255,0.15)',
          color: '#fff',
          boxShadow: done ? '0 0 14px rgba(124,90,246,0.6)' : 'none',
          transition: 'all 220ms cubic-bezier(0.34,1.56,0.64,1)',
          cursor: 'pointer',
          touchAction: 'manipulation',
        }}
      >
        {done && <IconCheck size={12} />}
      </button>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 15, fontWeight: 600,
          color: done ? 'rgba(255,255,255,0.25)' : '#ffffff',
          textDecoration: done ? 'line-through' : 'none',
          transition: 'color 220ms ease', letterSpacing: '-0.01em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {name}
        </p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{targetLabel}</p>
      </div>

      {/* Type pill */}
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
        padding: '3px 8px', borderRadius: 99, flexShrink: 0,
        background: done ? 'transparent' : colors.bg,
        color: done ? 'rgba(255,255,255,0.2)' : colors.text,
        border: done ? '1px solid rgba(255,255,255,0.06)' : `1px solid ${colors.border}`,
        transition: 'all 220ms ease',
      }}>
        {typeLabel}
      </span>

      {/* Log button */}
      <button
        onClick={onLog}
        style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(124,90,246,0.06)',
          border: '1px solid rgba(124,90,246,0.12)',
          color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
          transition: 'background 150ms ease, color 150ms ease, border-color 150ms ease',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = colors.bg;
          (e.currentTarget as HTMLElement).style.color = colors.text;
          (e.currentTarget as HTMLElement).style.borderColor = colors.border;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.06)';
          (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,90,246,0.12)';
        }}
      >
        <IconChevronRight size={14} />
      </button>
    </div>
  );
}

function EmptyPlan() {
  return (
    <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '48px 24px' }}>
      <div style={{
        width: 64, height: 64, borderRadius: 20, marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(124,90,246,0.1)',
        border: '1px solid rgba(124,90,246,0.2)',
        boxShadow: '0 0 24px rgba(124,90,246,0.15)',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 5v14" /><path d="M18 5v14" /><path d="M4 7h4" /><path d="M4 17h4" /><path d="M16 7h4" /><path d="M16 17h4" /><path d="M8 12h8" />
        </svg>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', marginBottom: 8 }}>No training plan yet</h3>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', lineHeight: 1.65, marginBottom: 28 }}>Build your weekly schedule and start tracking your progress.</p>
      <Link
        href="/plan"
        className="anim-glow"
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 24px', borderRadius: 99,
          background: 'linear-gradient(135deg, #7c5af6 0%, #6646e0 100%)',
          color: '#fff', fontSize: 14, fontWeight: 700,
          textDecoration: 'none',
        }}
      >
        <IconPlus size={14} /> Create plan
      </Link>
    </div>
  );
}

function RestDay() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '48px 24px' }}>
      <div style={{
        width: 64, height: 64, borderRadius: 20, marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(124,90,246,0.1)',
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', marginBottom: 8 }}>Rest day</h3>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', lineHeight: 1.65 }}>Recovery is part of the program.<br />You earned it.</p>
    </div>
  );
}

type PlanExerciseItem = {
  id: string; sets: number; reps: number | null; weight: number | null;
  hold_time: number | null; rest_timer_seconds: number;
  exercises: { id: string; name: string; type: string };
};
type PlanDayItem = {
  id: string; day_of_week: number; is_rest: boolean; plan_exercises: PlanExerciseItem[];
};

type WellnessLog = {
  id: string;
  sleep_hours: number | null;
  food_note: string | null;
  climb_strength: number | null;
};

type Props = {
  profile: { username: string; name: string | null } | null;
  plan: { id: string; name: string; plan_days: PlanDayItem[] } | null;
  todaySessionId: string | null;
  loggedExerciseIds?: string[];
  totalDaysLogged?: number;
  todayWellness?: WellnessLog | null;
};

function FatigueModal({ sessionId, onDone }: { sessionId: string; onDone: () => void }) {
  const [saving, setSaving] = useState(false);

  async function rate(score: number) {
    setSaving(true);
    const supabase = createClient();
    await supabase.from('sessions').update({ fatigue_score: score }).eq('id', sessionId);
    onDone();
  }

  const colors = (n: number) =>
    n <= 3 ? { bg: 'rgba(124,90,246,0.1)', border: 'rgba(124,90,246,0.25)', text: '#a78bf8' }
    : n <= 6 ? { bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.25)', text: '#fb923c' }
    : { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', text: '#f87171' };

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div
        className="anim-slide-up relative w-full rounded-t-[2rem] px-6 pt-4 pb-10"
        style={{
          background: 'linear-gradient(160deg, #120f2a 0%, #0e0b24 100%)',
          border: '1px solid rgba(124,90,246,0.2)',
          boxShadow: '0 -24px 80px rgba(124,90,246,0.15)',
        }}
      >
        <div className="flex justify-center mb-6">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(124,90,246,0.25)' }} />
        </div>
        <p className="text-xl font-bold text-white mb-1" style={{ letterSpacing: '-0.03em' }}>How tired do you feel?</p>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>Rate your fatigue — 1 (fresh) to 10 (exhausted)</p>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[1,2,3,4,5,6,7,8,9,10].map(n => {
            const c = colors(n);
            return (
              <button
                key={n}
                onClick={() => rate(n)}
                disabled={saving}
                style={{
                  padding: '14px 0', borderRadius: 14,
                  fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em',
                  background: c.bg, border: `1px solid ${c.border}`, color: c.text,
                  cursor: 'pointer', transition: 'opacity 150ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {n}
              </button>
            );
          })}
        </div>
        <button
          onClick={onDone}
          className="w-full py-3 rounded-full text-sm font-semibold mt-1"
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

function WellnessQuickLog({ userId, existing }: { userId?: string; existing: WellnessLog | null }) {
  const supabase = createClient();
  const [sleepHours, setSleepHours] = useState(existing?.sleep_hours?.toString() ?? '');
  const [foodNote, setFoodNote] = useState(existing?.food_note ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const today = useRef('');
  useEffect(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    today.current = `${y}-${m}-${dd}`;
  }, []);

  const hasDirty =
    sleepHours !== (existing?.sleep_hours?.toString() ?? '') ||
    foodNote !== (existing?.food_note ?? '');

  async function save() {
    if (!userId || !today.current) return;
    setSaving(true);
    await supabase.from('wellness_logs').upsert({
      user_id: userId,
      date: today.current,
      sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
      food_note: foodNote.trim() || null,
    }, { onConflict: 'user_id,date' });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{
      borderRadius: 24, overflow: 'hidden', marginBottom: 16,
      background: 'linear-gradient(160deg, rgba(20,16,50,0.9) 0%, rgba(14,11,36,0.95) 100%)',
      border: '1px solid rgba(124,90,246,0.15)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.6), 0 16px 48px rgba(0,0,0,0.5)',
    }}>
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid rgba(124,90,246,0.08)',
        background: 'linear-gradient(180deg, rgba(124,90,246,0.06) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(167,139,248,0.55)', marginBottom: 2 }}>Daily log</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
            {existing ? 'Today logged ✓' : 'Log sleep & food'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {saved && (
            <span style={{ fontSize: 12, fontWeight: 600, color: '#a78bf8' }}>Saved ✓</span>
          )}
          <Link
            href="/daily-log"
            style={{
              padding: '6px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700,
              background: 'rgba(124,90,246,0.1)', border: '1px solid rgba(124,90,246,0.22)',
              color: '#a78bf8', textDecoration: 'none',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,90,246,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(124,90,246,0.1)')}
          >
            Full log →
          </Link>
        </div>
      </div>

      <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Sleep */}
          <div style={{ flex: '0 0 auto' }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(167,139,248,0.55)', display: 'block', marginBottom: 6 }}>Sleep</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="number"
                inputMode="decimal"
                min="0" max="24" step="0.5"
                value={sleepHours}
                onChange={e => setSleepHours(e.target.value)}
                placeholder="—"
                style={{
                  width: 68, padding: '10px 12px',
                  borderRadius: 14, fontSize: 22, fontWeight: 800,
                  letterSpacing: '-0.03em', textAlign: 'center',
                  color: '#ffffff',
                  background: 'rgba(124,90,246,0.07)',
                  border: '1px solid rgba(124,90,246,0.16)',
                  outline: 'none', transition: 'border-color 150ms ease',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,90,246,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(124,90,246,0.16)')}
              />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>hrs</span>
            </div>
          </div>

          {/* Food */}
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(167,139,248,0.55)', display: 'block', marginBottom: 6 }}>Food</label>
            <textarea
              value={foodNote}
              onChange={e => setFoodNote(e.target.value)}
              placeholder="What did you eat today?"
              rows={2}
              style={{
                width: '100%', padding: '10px 14px',
                borderRadius: 14, fontSize: 13, color: '#ffffff',
                lineHeight: 1.55, resize: 'none',
                background: 'rgba(124,90,246,0.07)',
                border: '1px solid rgba(124,90,246,0.16)',
                outline: 'none', transition: 'border-color 150ms ease',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,90,246,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(124,90,246,0.16)')}
            />
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving || !hasDirty}
          style={{
            padding: '12px', borderRadius: 99, fontSize: 13, fontWeight: 700,
            color: '#ffffff', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #7c5af6 0%, #6646e0 100%)',
            opacity: saving || !hasDirty ? 0.4 : 1,
            transition: 'opacity 150ms ease',
          }}
          onMouseEnter={e => { if (!saving && hasDirty) (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = saving || !hasDirty ? '0.4' : '1'; }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

export default function DashboardView({ profile, plan, todaySessionId, loggedExerciseIds = [], userId, totalDaysLogged = 0, todayWellness = null }: Props & { userId?: string; totalDaysLogged?: number }) {
  const displayName = profile?.name ?? profile?.username ?? 'there';

  // Compute day-of-week client-side to respect user's local timezone
  const [dayOfWeek, setDayOfWeek] = useState<number>(-1);
  const [todaysPlanDay, setTodaysPlanDay] = useState<PlanDayItem | null>(null);

  useEffect(() => {
    const d = (new Date().getDay() + 6) % 7; // Mon=0 … Sun=6
    setDayOfWeek(d);
    const found = plan?.plan_days?.find(pd => pd.day_of_week === d) ?? null;
    setTodaysPlanDay(found);
  }, [plan]);

  const exercises = todaysPlanDay?.plan_exercises ?? [];
  const isRest = todaysPlanDay?.is_rest ?? false;
  const [activeLog, setActiveLog] = useState<PlanExerciseItem | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(todaySessionId);
  const [loggedIds, setLoggedIds] = useState<Set<string>>(new Set(loggedExerciseIds));

  const doneCount = exercises.filter(pe => loggedIds.has(pe.exercises.id)).length;
  const allDone = exercises.length > 0 && doneCount === exercises.length;

  const [showFatigueModal, setShowFatigueModal] = useState(false);
  const prevLoggedSize = useRef(loggedExerciseIds.length);
  useEffect(() => {
    const cur = loggedIds.size;
    const prev = prevLoggedSize.current;
    prevLoggedSize.current = cur;
    if (cur > prev && exercises.length > 0 && cur === exercises.length && sessionId) {
      setShowFatigueModal(true);
    }
  }, [loggedIds]);

  return (
    <div style={{ minHeight: '100dvh', padding: '0 20px 48px' }}>

      {/* Hero */}
      <div className="anim-fade-up" style={{ paddingTop: 72, paddingBottom: 32 }}>

        {/* Date + greeting row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{
            height: 1, flex: 1,
            background: 'linear-gradient(90deg, transparent, rgba(124,90,246,0.25))',
          }} />
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(167,139,248,0.55)',
          }}>
            {formatDate()}
          </p>
          <div style={{
            height: 1, flex: 1,
            background: 'linear-gradient(90deg, rgba(124,90,246,0.25), transparent)',
          }} />
        </div>

        {/* Greeting + name + ring */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            {totalDaysLogged > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(167,139,248,0.8)', letterSpacing: '0.01em' }}>
                  {totalDaysLogged} days logged
                </p>
              </div>
            )}
            <h1 style={{
              fontSize: 'clamp(38px, 8vw, 56px)',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}>
              {displayName}
            </h1>
          </div>

          {exercises.length > 0 && !isRest && (
            <ProgressRing done={doneCount} total={exercises.length} />
          )}
        </div>

        {/* Exercise status badge */}
        {exercises.length > 0 && !isRest && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '7px 14px', borderRadius: 99, marginBottom: 18,
            background: allDone ? 'rgba(124,90,246,0.14)' : 'rgba(255,255,255,0.05)',
            border: allDone ? '1px solid rgba(124,90,246,0.3)' : '1px solid rgba(255,255,255,0.08)',
            boxShadow: allDone ? '0 0 16px rgba(124,90,246,0.2)' : 'none',
          }}>
            <span style={{ fontSize: 13 }}>{allDone ? '✦' : '○'}</span>
            <p style={{
              fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em',
              color: allDone ? '#c4b5fd' : 'rgba(255,255,255,0.5)',
            }}>
              {allDone
                ? 'All done — great session'
                : `${exercises.length - doneCount} exercise${exercises.length - doneCount !== 1 ? 's' : ''} remaining`}
            </p>
          </div>
        )}

        {/* Motivational line */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10, padding: '10px 0',
        }}>
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, rgba(124,90,246,0.15))' }} />
          <p style={{
            fontSize: 12, fontStyle: 'italic', letterSpacing: '0.01em',
            color: 'rgba(167,139,248,0.5)', textAlign: 'center',
            maxWidth: 220, lineHeight: 1.6,
          }}>
            &ldquo;{getMotivation()}&rdquo;
          </p>
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, rgba(124,90,246,0.15), transparent)' }} />
        </div>

      </div>

      {/* Workout card */}
      <div
        className="anim-fade-up-2"
        style={{
          borderRadius: 24,
          overflow: 'hidden',
          marginBottom: 16,
          background: 'linear-gradient(160deg, rgba(20,16,50,0.9) 0%, rgba(14,11,36,0.95) 100%)',
          border: '1px solid rgba(124,90,246,0.15)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.6), 0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {/* Card header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px',
          borderBottom: exercises.length > 0 && !isRest ? '1px solid rgba(124,90,246,0.08)' : 'none',
          background: 'linear-gradient(180deg, rgba(124,90,246,0.06) 0%, transparent 100%)',
        }}>
          <div>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', marginBottom: 4,
              color: 'rgba(167,139,248,0.55)',
            }}>
              {dayOfWeek >= 0 ? DAY_NAMES[dayOfWeek] : '—'}
            </p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
              {!plan ? 'Get started' : isRest ? 'Rest Day' : exercises.length > 0 ? plan.name : 'No workout scheduled'}
            </p>
          </div>

          {exercises.length > 0 && !isRest && (
            <div style={{
              padding: '6px 12px', borderRadius: 99,
              fontSize: 12, fontWeight: 700,
              background: allDone ? 'rgba(124,90,246,0.18)' : 'rgba(255,255,255,0.05)',
              color: allDone ? '#a78bf8' : 'rgba(255,255,255,0.45)',
              border: allDone ? '1px solid rgba(124,90,246,0.35)' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: allDone ? '0 0 16px rgba(124,90,246,0.3)' : 'none',
              transition: 'all 300ms ease',
            }}>
              {doneCount}/{exercises.length}
            </div>
          )}
        </div>

        {/* Card content */}
        {!plan ? <EmptyPlan />
          : isRest ? <RestDay />
          : exercises.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>No exercises planned for today.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12 }}>
              {exercises.map((pe, i) => (
                <ExerciseRow
                  key={pe.id}
                  name={pe.exercises.name}
                  type={pe.exercises.type}
                  sets={pe.sets}
                  reps={pe.reps}
                  weight={pe.weight}
                  holdTime={pe.hold_time}
                  index={i}
                  done={loggedIds.has(pe.exercises.id)}
                  onDone={() => setLoggedIds(prev => {
                    const next = new Set(prev);
                    next.has(pe.exercises.id) ? next.delete(pe.exercises.id) : next.add(pe.exercises.id);
                    return next;
                  })}
                  onLog={() => setActiveLog(pe)}
                />
              ))}
            </div>
          )}
      </div>

      {showFatigueModal && sessionId && (
        <FatigueModal sessionId={sessionId} onDone={() => setShowFatigueModal(false)} />
      )}

      {activeLog && userId && (
        <LogSheet
          pe={activeLog}
          sessionId={sessionId}
          userId={userId}
          onClose={() => setActiveLog(null)}
          onSessionCreated={id => setSessionId(id)}
          onLogged={id => setLoggedIds(prev => new Set(prev).add(id))}
        />
      )}

      {/* Wellness quick log */}
      <WellnessQuickLog userId={userId} existing={todayWellness} />

      {/* Quick links */}
      <div className="anim-fade-up-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { href: '/progress', label: 'Progress', sub: 'Charts & PRs', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          )},
          { href: '/skills', label: 'Skills', sub: 'Skill tracker', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
            </svg>
          )},
        ].map(({ href, label, sub, icon }) => (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '16px',
              borderRadius: 20,
              background: 'rgba(124,90,246,0.05)',
              border: '1px solid rgba(124,90,246,0.1)',
              textDecoration: 'none',
              transition: 'background 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.1)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,90,246,0.22)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(124,90,246,0.12)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.05)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,90,246,0.1)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            <div style={{ color: 'rgba(167,139,248,0.6)' }}>{icon}</div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>{label}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
