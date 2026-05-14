'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
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
  "Today's effort is tomorrow's strength.",
  "Champions train when no one's watching.",
];

const PARTICLE_COLORS = ['#F07030', '#F59050', '#FF6B35', '#00D4FF', '#16141F', '#FF4757'];

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  reps:     { bg: 'var(--accent-bg)',  border: 'var(--accent-border)',  text: 'var(--accent-light)' },
  weighted: { bg: 'var(--warm-bg)',    border: 'var(--warm-border)',    text: 'var(--warm)' },
  timed:    { bg: 'var(--blue-bg)',    border: 'var(--blue-border)',    text: 'var(--blue)' },
};

/* ── Confetti burst on completion ── */
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const particles = Array.from({ length: 28 }, (_, i) => {
    const angle = (i / 28) * 360 + Math.random() * 20;
    const dist = 60 + Math.random() * 80;
    const dx = Math.cos((angle * Math.PI) / 180) * dist;
    const dy = Math.sin((angle * Math.PI) / 180) * dist - 40;
    const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
    const size = 5 + Math.random() * 6;
    const delay = Math.random() * 0.2;
    return { dx, dy, color, size, delay, rot: Math.random() * 720 - 360 };
  });

  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none', zIndex: 10 }}>
      {particles.map((p, i) => (
        <div
          key={i}
          className="confetti-particle"
          style={{
            backgroundColor: p.color,
            width: p.size, height: p.size,
            marginLeft: -p.size / 2, marginTop: -p.size / 2,
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            '--rot': `${p.rot}deg`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${0.7 + Math.random() * 0.4}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function IconCheck({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="10 3 5 9 2 6"/>
    </svg>
  );
}
function IconChevronRight({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
function IconPlus({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
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
type NutritionData = { description: string; calories: number; protein: number; carbs: number; fat: number; confidence: string };
type WellnessLog = {
  id: string;
  sleep_hours: number | null;
  food_breakfast: string | null; food_lunch: string | null;
  food_dinner: string | null; food_pre_climb: string | null;
  climb_strength: number | null;
  breakfast_nutrition?: NutritionData | null;
  lunch_nutrition?: NutritionData | null;
  dinner_nutrition?: NutritionData | null;
  pre_climb_nutrition?: NutritionData | null;
};
type Props = {
  profile: { username: string; name: string | null } | null;
  plan: { id: string; name: string; plan_days: PlanDayItem[] } | null;
  todaySessionId: string | null;
  loggedExerciseIds?: string[];
  totalDaysLogged?: number;
  todayWellness?: WellnessLog | null;
  userId?: string;
  calorieGoal?: number;
  proteinGoal?: number;
};

/* ── Exercise row ── */
type ExerciseRowProps = {
  name: string; type: string; sets: number; reps: number | null;
  weight: number | null; holdTime: number | null; index: number;
  done: boolean; onDone: () => void; onLog?: () => void;
};

function ExerciseRow({ name, type, sets, reps, weight, holdTime, done, onDone, onLog }: ExerciseRowProps) {
  const colors = TYPE_COLORS[type] ?? TYPE_COLORS.reps;
  const typeLabel = type === 'timed' ? 'Hold' : type === 'weighted' ? 'Wtd' : 'Reps';
  const targetLabel = (() => {
    if (type === 'timed' && holdTime) return `${sets}×${holdTime}s`;
    if (type === 'weighted' && weight) return `${sets}×${reps}@${weight}kg`;
    if (reps) return `${sets}×${reps}`;
    return `${sets} sets`;
  })();

  const [justDone, setJustDone] = useState(false);

  function handleDone() {
    if (!done) setJustDone(true);
    onDone();
    setTimeout(() => setJustDone(false), 600);
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '13px 16px',
      borderBottom: '1px solid rgba(240, 112, 48, 0.08)',
      transition: 'background 160ms ease',
    }}>
      {/* Checkbox */}
      <button
        onClick={handleDone}
        className={justDone ? 'anim-log-success' : ''}
        style={{
          width: 22, height: 22, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: done
            ? 'linear-gradient(135deg, #F07030 0%, #F59050 100%)'
            : 'transparent',
          border: done
            ? '2px solid rgba(240, 112, 48, 0.8)'
            : '2px solid rgba(240, 112, 48, 0.3)',
          borderRadius: 6,
          color: 'white', cursor: 'pointer',
          boxShadow: done ? '0 0 10px rgba(240, 112, 48, 0.4)' : 'none',
          touchAction: 'manipulation',
          transition: 'all 180ms ease',
        }}
      >
        {done && (
          <span className="anim-check">
            <IconCheck size={10} />
          </span>
        )}
      </button>

      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14, fontWeight: 500,
          color: done ? 'var(--text-3)' : 'var(--text)',
          textDecoration: done ? 'line-through' : 'none',
          textDecorationColor: 'rgba(240,112,48,0.3)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          transition: 'color 160ms ease',
        }}>
          {name}
        </p>
      </div>

      {/* Target */}
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)',
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>{targetLabel}</span>

      {/* Type tag */}
      <span style={{
        padding: '2px 7px', flexShrink: 0, borderRadius: 4,
        fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        background: done ? 'transparent' : colors.bg,
        border: done ? '1px solid rgba(240,112,48,0.1)' : `1px solid ${colors.border}`,
        color: done ? 'var(--text-3)' : colors.text,
        transition: 'all 160ms ease',
      }}>
        {typeLabel}
      </span>

      {/* Log button */}
      <button
        onClick={onLog}
        style={{
          width: 30, height: 30, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(240,112,48,0.06)',
          border: '1px solid rgba(240,112,48,0.2)',
          borderRadius: 8,
          color: 'var(--text-3)', cursor: 'pointer',
          transition: 'all 160ms ease',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,112,48,0.5)';
          (e.currentTarget as HTMLElement).style.color = 'var(--accent-light)';
          (e.currentTarget as HTMLElement).style.background = 'rgba(240,112,48,0.12)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,112,48,0.2)';
          (e.currentTarget as HTMLElement).style.color = 'var(--text-3)';
          (e.currentTarget as HTMLElement).style.background = 'rgba(240,112,48,0.06)';
        }}
      >
        <IconChevronRight size={12} />
      </button>
    </div>
  );
}

function EmptyPlan() {
  return (
    <div style={{ padding: '40px 0', textAlign: 'center' }}>
      <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>No training plan yet</p>
      <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.65, marginBottom: 24 }}>
        Build your weekly schedule to get started.
      </p>
      <Link
        href="/plan"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '11px 22px',
          background: 'linear-gradient(135deg, #F07030 0%, #F59050 100%)',
          color: 'white',
          fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          textDecoration: 'none', borderRadius: 10,
          boxShadow: '0 0 20px rgba(240, 112, 48, 0.4)',
        }}
      >
        <IconPlus size={12} /> Create plan
      </Link>
    </div>
  );
}

function RestDay() {
  return (
    <div style={{ padding: '40px 0', textAlign: 'center' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 48, height: 48, borderRadius: 12,
        background: 'rgba(240,112,48,0.1)', border: '1px solid rgba(240,112,48,0.2)',
        marginBottom: 14,
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 2a9 9 0 0 0-9 9c0 3.07 1.54 5.79 3.9 7.44A9 9 0 1 0 12 2z"/>
          <path d="M12 7v5l3 3"/>
        </svg>
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Rest day</p>
      <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.65 }}>
        Recovery is part of the program. You earned it.
      </p>
    </div>
  );
}

/* ── Fatigue modal ── */
function FatigueModal({ sessionId, onDone }: { sessionId: string; onDone: () => void }) {
  const [saving, setSaving] = useState(false);

  async function rate(score: number) {
    setSaving(true);
    const supabase = createClient();
    await supabase.from('sessions').update({ fatigue_score: score }).eq('id', sessionId);
    onDone();
  }

  const ratingColor = (n: number) =>
    n <= 3 ? { bg: 'var(--accent-bg)', border: 'var(--accent-border)', text: 'var(--accent-light)' }
    : n <= 6 ? { bg: 'var(--warm-bg)', border: 'var(--warm-border)', text: 'var(--warm)' }
    : { bg: 'var(--danger-bg)', border: 'var(--danger-border)', text: 'var(--danger)' };

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="anim-slide-up relative w-full"
        style={{
          background: 'rgba(255, 255, 255, 0.98)',
          borderTop: '1px solid rgba(240, 112, 48, 0.25)',
          borderRadius: '20px 20px 0 0',
          padding: '24px 24px 48px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ width: 36, height: 3, background: 'rgba(240,112,48,0.3)', borderRadius: 2 }} />
        </div>
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
          letterSpacing: '0.04em', textTransform: 'uppercase',
          color: 'var(--text)', marginBottom: 4,
        }}>
          How tired do you feel?
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>1 = fresh  ·  10 = exhausted</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 }}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => {
            const c = ratingColor(n);
            return (
              <button
                key={n}
                onClick={() => rate(n)}
                disabled={saving}
                style={{
                  padding: '14px 0', borderRadius: 10,
                  background: c.bg, border: `1px solid ${c.border}`, color: c.text,
                  fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 140ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >{n}</button>
            );
          })}
        </div>
        <button
          onClick={onDone}
          style={{
            width: '100%', padding: '12px', borderRadius: 10,
            background: 'rgba(240,112,48,0.08)', border: '1px solid rgba(240,112,48,0.2)',
            color: 'var(--text-3)', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            transition: 'all 140ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(240,112,48,0.4)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(240,112,48,0.2)')}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

/* ── Wellness meal input ── */
function MealInput({ label, value, onChange, placeholder, accent }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; accent?: boolean;
}) {
  return (
    <div>
      <label style={{
        display: 'block', fontFamily: 'var(--font-display)',
        fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: accent ? 'var(--warm)' : 'var(--text-3)', marginBottom: 5,
      }}>{label}</label>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: '100%', padding: '9px 11px', borderRadius: 8,
          background: 'rgba(255, 255, 255, 0.7)',
          border: `1px solid ${accent ? 'var(--warm-border)' : 'rgba(240,112,48,0.18)'}`,
          color: 'var(--text)', fontSize: 12, outline: 'none',
          transition: 'border-color 140ms ease',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = accent ? 'var(--warm)' : 'var(--accent)')}
        onBlur={e => (e.currentTarget.style.borderColor = accent ? 'var(--warm-border)' : 'rgba(240,112,48,0.18)')}
      />
    </div>
  );
}

/* ── Wellness quick-log card ── */
function WellnessQuickLog({ userId, existing }: { userId?: string; existing: WellnessLog | null }) {
  const supabase = createClient();
  const [sleepHours, setSleepHours] = useState(existing?.sleep_hours?.toString() ?? '');
  const [breakfast, setBreakfast] = useState(existing?.food_breakfast ?? '');
  const [lunch, setLunch] = useState(existing?.food_lunch ?? '');
  const [dinner, setDinner] = useState(existing?.food_dinner ?? '');
  const [preClimb, setPreClimb] = useState(existing?.food_pre_climb ?? '');
  const [climbStrength, setClimbStrength] = useState<number | null>(existing?.climb_strength ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const today = useRef('');
  useEffect(() => {
    const d = new Date();
    today.current = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }, []);

  const hasDirty =
    sleepHours !== (existing?.sleep_hours?.toString() ?? '') ||
    breakfast !== (existing?.food_breakfast ?? '') ||
    lunch !== (existing?.food_lunch ?? '') ||
    dinner !== (existing?.food_dinner ?? '') ||
    preClimb !== (existing?.food_pre_climb ?? '') ||
    climbStrength !== (existing?.climb_strength ?? null);

  async function save() {
    if (!userId || !today.current) return;
    setSaving(true);
    await supabase.from('wellness_logs').upsert({
      user_id: userId, date: today.current,
      sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
      food_breakfast: breakfast.trim() || null,
      food_lunch: lunch.trim() || null,
      food_dinner: dinner.trim() || null,
      food_pre_climb: preClimb.trim() || null,
      climb_strength: climbStrength,
    }, { onConflict: 'user_id,date' });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const strengthColor = (n: number) =>
    n >= 7 ? { bg: 'var(--accent-bg)', border: 'var(--accent-border)', text: 'var(--accent-light)' }
    : n >= 4 ? { bg: 'var(--warm-bg)', border: 'var(--warm-border)', text: 'var(--warm)' }
    : { bg: 'var(--danger-bg)', border: 'var(--danger-border)', text: 'var(--danger)' };

  return (
    <div className="glass-card" style={{ padding: '20px', marginTop: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 8,
            background: 'rgba(255, 107, 53, 0.12)', border: '1px solid rgba(255, 107, 53, 0.25)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warm)" strokeWidth="2" strokeLinecap="round">
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
            </svg>
          </div>
          <div>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text)',
            }}>Daily Log</p>
            {existing && (
              <p style={{ fontSize: 11, color: 'var(--accent-light)', marginTop: 1 }}>Today logged</p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {saved && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-light)' }}>
              Saved ✓
            </span>
          )}
          <Link href="/daily-log" style={{
            fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.07em', textTransform: 'uppercase',
            color: 'var(--text-2)', textDecoration: 'none',
            padding: '5px 10px', borderRadius: 6,
            border: '1px solid rgba(240,112,48,0.2)',
            transition: 'all 140ms ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--accent-light)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,112,48,0.4)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,112,48,0.2)';
          }}
          >
            Full log →
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Sleep + Pre-climb */}
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 10 }}>
          <div>
            <label style={{
              display: 'block', fontFamily: 'var(--font-display)',
              fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--text-3)', marginBottom: 5,
            }}>Sleep</label>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <input
                type="number" inputMode="decimal" min="0" max="24" step="0.5"
                value={sleepHours} onChange={e => setSleepHours(e.target.value)} placeholder="—"
                style={{
                  width: '100%', padding: '9px 6px', borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.7)', border: '1px solid rgba(240,112,48,0.18)',
                  fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500,
                  color: 'var(--text)', outline: 'none', textAlign: 'center',
                  transition: 'border-color 140ms ease',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(240,112,48,0.18)')}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>hr</span>
            </div>
          </div>
          <MealInput label="Pre-climb" value={preClimb} onChange={setPreClimb} placeholder="banana, bar…" accent />
        </div>

        {/* Meals */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <MealInput label="Breakfast" value={breakfast} onChange={setBreakfast} placeholder="oats, eggs…" />
          <MealInput label="Lunch" value={lunch} onChange={setLunch} placeholder="chicken, rice…" />
          <MealInput label="Dinner" value={dinner} onChange={setDinner} placeholder="pasta, fish…" />
        </div>

        {/* Climb strength */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{
              fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)',
            }}>Climb strength</label>
            {climbStrength != null ? (
              <button onClick={() => setClimbStrength(null)} style={{
                fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}>Clear</button>
            ) : (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>optional</span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => {
              const c = strengthColor(n);
              const sel = climbStrength === n;
              return (
                <button
                  key={n}
                  onClick={() => setClimbStrength(sel ? null : n)}
                  style={{
                    padding: '7px 0', borderRadius: 6,
                    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: sel ? 600 : 400,
                    background: sel ? c.bg : 'rgba(255,255,255,0.5)',
                    border: sel ? `1.5px solid ${c.border}` : '1px solid rgba(240,112,48,0.15)',
                    color: sel ? c.text : 'var(--text-3)',
                    cursor: 'pointer', transition: 'all 120ms ease', touchAction: 'manipulation',
                    boxShadow: sel ? `0 0 8px ${c.border}` : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!sel) {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,112,48,0.35)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!sel) {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,112,48,0.15)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-3)';
                    }
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={save}
          disabled={saving || !hasDirty}
          style={{
            padding: '12px', borderRadius: 10,
            background: saving || !hasDirty
              ? 'rgba(240,112,48,0.1)'
              : 'linear-gradient(135deg, #F07030 0%, #F59050 100%)',
            border: 'none', cursor: saving || !hasDirty ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: saving || !hasDirty ? 'var(--text-3)' : 'white',
            boxShadow: saving || !hasDirty ? 'none' : '0 0 20px rgba(240,112,48,0.35)',
            transition: 'all 160ms ease',
          }}
          onMouseEnter={e => { if (!saving && hasDirty) (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

const MEAL_SLOTS = [
  { key: 'breakfast_nutrition' as const, foodKey: 'food_breakfast' as const, label: 'Breakfast' },
  { key: 'lunch_nutrition' as const,     foodKey: 'food_lunch' as const,     label: 'Lunch' },
  { key: 'dinner_nutrition' as const,    foodKey: 'food_dinner' as const,    label: 'Dinner' },
  { key: 'pre_climb_nutrition' as const, foodKey: 'food_pre_climb' as const, label: 'Pre-climb' },
];

function QuickPhotoLog({ userId, todayWellness, onLogged, compact = false }: {
  userId?: string;
  todayWellness: WellnessLog | null;
  onLogged: (slot: string, nutrition: NutritionData) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<typeof MEAL_SLOTS[number] | null>(null);
  const [descriptionStep, setDescriptionStep] = useState(false);
  const [photoDescription, setPhotoDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<NutritionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  function reset() {
    setSelectedSlot(null); setDescriptionStep(false);
    setPhotoDescription(''); setResult(null); setError(null);
  }

  function pickSlot(slot: typeof MEAL_SLOTS[number]) {
    setSelectedSlot(slot);
    setResult(null); setError(null);
    setDescriptionStep(true);
  }

  function openCamera() {
    setTimeout(() => fileRef.current?.click(), 50);
  }

  async function handleFile(file: File) {
    if (!selectedSlot || !userId) return;
    setDescriptionStep(false);
    setAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const [header, base64] = dataUrl.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
      try {
        const res = await fetch('/api/analyze-meal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType, description: photoDescription }),
        });
        if (res.ok) {
          const nutrition: NutritionData = await res.json();
          const today = new Date();
          const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
          await supabase.from('wellness_logs').upsert({
            user_id: userId, date: dateStr,
            [selectedSlot.foodKey]: nutrition.description,
            [selectedSlot.key]: nutrition,
          }, { onConflict: 'user_id,date' });
          setResult(nutrition);
          onLogged(selectedSlot.key, nutrition);
        } else {
          const body = await res.json().catch(() => ({}));
          setError(`API error ${res.status}: ${body?.error ?? 'Unknown error'}`);
        }
      } catch (err) {
        setError('Analysis failed — check your ANTHROPIC_API_KEY is set correctly.');
        console.error('analyze-meal:', err);
      }
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  }

  if (!userId) return null;

  const btnStyle: React.CSSProperties = { width: '100%', padding: '13px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 10, transition: 'opacity 140ms ease' };

  return (
    <>
      <button
        onClick={() => { setOpen(true); reset(); }}
        title="Log a meal with photo"
        style={compact ? {
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 20,
          background: 'rgba(240,112,48,0.12)',
          border: '1px solid rgba(240,112,48,0.3)', color: '#F07030', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          transition: 'all 140ms ease', whiteSpace: 'nowrap',
        } : {
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '13px 20px', borderRadius: 10,
          background: 'linear-gradient(135deg, #F07030 0%, #F59050 100%)',
          border: 'none', color: 'white', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          boxShadow: '0 0 18px rgba(240,112,48,0.35)',
          transition: 'opacity 140ms ease',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.75'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
      >
        <svg width={compact ? 13 : 16} height={compact ? 13 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        {compact ? 'Log meal' : 'Log meal with photo'}
      </button>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />

      {open && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => { if (!analyzing) setOpen(false); }} />
          <div className="anim-slide-up relative w-full" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderRadius: '20px 20px 0 0', padding: '24px 20px 48px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ width: 36, height: 3, background: 'rgba(240,112,48,0.3)', borderRadius: 2 }} />
            </div>

            {/* ── Result ── */}
            {result ? (
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 4 }}>Logged ✓</p>
                <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>{result.description}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                  {[
                    { label: 'Cal', value: Math.round(result.calories), color: 'var(--accent)' },
                    { label: 'Pro', value: `${Math.round(result.protein)}g`, color: 'var(--blue)' },
                    { label: 'Carb', value: `${Math.round(result.carbs)}g`, color: 'var(--warm)' },
                    { label: 'Fat', value: `${Math.round(result.fat)}g`, color: 'var(--text-2)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ textAlign: 'center', padding: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8 }}>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: 4 }}>{label}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setResult(null); setDescriptionStep(true); }} style={{ ...btnStyle, flex: 1, background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                    Wrong? Retake
                  </button>
                  <button onClick={() => setOpen(false)} style={{ ...btnStyle, flex: 2, background: 'linear-gradient(135deg, #F07030 0%, #F59050 100%)', color: 'white', boxShadow: '0 0 20px rgba(240,112,48,0.35)' }}>
                    Done
                  </button>
                </div>
              </div>

            ) : analyzing ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 8 }}>Analyzing…</p>
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Claude is identifying your meal</p>
              </div>

            ) : error ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--danger)', marginBottom: 8 }}>Analysis failed</p>
                <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>{error}</p>
                <button onClick={() => { setError(null); setDescriptionStep(true); }} style={{ padding: '11px 24px', background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-2)', borderRadius: 8 }}>
                  Try again
                </button>
              </div>

            ) : descriptionStep && selectedSlot ? (
              /* ── Description + photo step ── */
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 2 }}>{selectedSlot.label}</p>
                <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 18 }}>Add a note to help Claude (optional), then take your photo.</p>
                <textarea
                  value={photoDescription}
                  onChange={e => setPhotoDescription(e.target.value)}
                  placeholder="e.g. large portion, homemade, with extra sauce…"
                  rows={3}
                  style={{ width: '100%', padding: '12px', marginBottom: 14, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none', fontSize: 13, lineHeight: 1.6, resize: 'none', borderRadius: 10, fontFamily: 'inherit', transition: 'border-color 140ms ease' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
                <button onClick={openCamera} style={{ ...btnStyle, marginBottom: 10, background: 'linear-gradient(135deg, #F07030 0%, #F59050 100%)', color: 'white', boxShadow: '0 0 20px rgba(240,112,48,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Take photo
                </button>
                <button onClick={() => { setDescriptionStep(false); setSelectedSlot(null); }} style={{ ...btnStyle, background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                  Back
                </button>
              </div>

            ) : (
              /* ── Meal slot picker ── */
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 4 }}>Which meal?</p>
                <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>Select a slot to continue.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {MEAL_SLOTS.map(slot => {
                    const alreadyLogged = todayWellness?.[slot.key] != null;
                    return (
                      <button key={slot.key} onClick={() => pickSlot(slot)} style={{
                        padding: '16px', textAlign: 'left', cursor: 'pointer',
                        background: alreadyLogged ? 'var(--accent-bg)' : 'var(--surface-2)',
                        border: `1px solid ${alreadyLogged ? 'var(--accent-border)' : 'var(--border)'}`,
                        borderRadius: 10, transition: 'all 140ms ease',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = alreadyLogged ? 'var(--accent-border)' : 'var(--border)'; }}
                      >
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: alreadyLogged ? 'var(--accent)' : 'var(--text)', marginBottom: 2 }}>{slot.label}</p>
                        {alreadyLogged
                          ? <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)' }}>update ↺</p>
                          : <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>not logged</p>}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setOpen(false)} style={{ ...btnStyle, background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Ring({ value, goal, color, label, unit, size = 88, animDelay = 0 }: {
  value: number; goal: number; color: string; label: string; unit: string; size?: number; animDelay?: number;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80 + animDelay);
    return () => clearTimeout(t);
  }, [animDelay]);

  const sw = 5;
  const r = (size - sw * 2 - 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  const over = goal > 0 && value > goal;
  const strokeColor = over ? 'var(--danger)' : color;
  const offset = ready ? circ * (1 - pct) : circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{
          transform: 'rotate(-90deg)',
          filter: ready && pct > 0 ? `drop-shadow(0 0 6px ${strokeColor}60)` : 'none',
          transition: 'filter 800ms ease',
        }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(20,16,50,0.12)" strokeWidth={sw} />
          <circle
            cx={size/2} cy={size/2} r={r} fill="none"
            stroke={strokeColor} strokeWidth={sw + 1}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: ready ? 'stroke-dashoffset 900ms cubic-bezier(0.34, 1.56, 0.64, 1), stroke 300ms ease' : 'none' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: size > 70 ? 14 : 12, fontWeight: 700,
            color: over ? 'var(--danger)' : 'var(--text)', lineHeight: 1, letterSpacing: '-0.02em',
            opacity: ready ? 1 : 0, transition: 'opacity 400ms ease',
            transitionDelay: ready ? `${300 + animDelay}ms` : '0ms',
          }}>
            {value >= 1000 ? `${(value/1000).toFixed(1)}k` : Math.round(value)}
          </span>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 7, fontWeight: 700, letterSpacing: '0.04em',
            color: strokeColor, opacity: ready ? 0.85 : 0, marginTop: 2,
            transition: 'opacity 400ms ease',
            transitionDelay: ready ? `${350 + animDelay}ms` : '0ms',
          }}>{unit}</span>
        </div>
      </div>
      <p style={{
        fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)',
        opacity: ready ? 1 : 0, transition: 'opacity 300ms ease',
        transitionDelay: ready ? `${400 + animDelay}ms` : '0ms',
      }}>{label}</p>
    </div>
  );
}

function NutritionRingsCard({ todayWellness, calorieGoal, proteinGoal, userId, onLogged }: {
  todayWellness: WellnessLog | null;
  calorieGoal: number;
  proteinGoal: number;
  userId?: string;
  onLogged: (slot: string, nutrition: NutritionData) => void;
}) {
  const [ringSize, setRingSize] = useState(76);
  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      setRingSize(w < 360 ? 62 : w < 420 ? 70 : 76);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  let totalCal = 0, totalPro = 0, totalSugar = 0;
  if (todayWellness) {
    for (const slot of MEAL_SLOTS) {
      const n = todayWellness[slot.key];
      if (n) { totalCal += n.calories; totalPro += n.protein; totalSugar += (n as NutritionData & { sugars?: number }).sugars ?? 0; }
    }
  }

  return (
    <div className="anim-fade-up-1" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 14, padding: '8px 0 16px',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      {/* Log button — left */}
      <QuickPhotoLog userId={userId} todayWellness={todayWellness} onLogged={onLogged} compact />

      {/* Sugar, Calories, Protein — right */}
      <Link href="/nutrition" style={{ display: 'flex', alignItems: 'flex-start', gap: ringSize < 70 ? 10 : 14, textDecoration: 'none' }}>
        <Ring value={totalSugar} goal={0} color="var(--warm)" label="Sugar" unit="g" size={ringSize} animDelay={0} />
        <Ring value={totalCal} goal={calorieGoal} color="#F07030" label="Calories" unit="kcal" size={ringSize} animDelay={120} />
        <Ring value={totalPro} goal={proteinGoal} color="var(--blue)" label="Protein" unit="g" size={ringSize} animDelay={240} />
      </Link>
    </div>
  );
}

/* ── Main dashboard ── */
export default function DashboardView({ profile, plan, todaySessionId, loggedExerciseIds = [], userId, totalDaysLogged = 0, todayWellness = null, calorieGoal = 2000, proteinGoal = 150 }: Props) {
  const displayName = profile?.name ?? profile?.username ?? 'Athlete';

  const [dayOfWeek, setDayOfWeek] = useState<number>(-1);
  const [todaysPlanDay, setTodaysPlanDay] = useState<PlanDayItem | null>(null);
  const [formattedDate, setFormattedDate] = useState('');
  const [motivationText, setMotivationText] = useState('');

  useEffect(() => {
    const now = new Date();
    const d = (now.getDay() + 6) % 7;
    setDayOfWeek(d);
    const found = plan?.plan_days?.find(pd => pd.day_of_week === d) ?? null;
    setTodaysPlanDay(found);
    setFormattedDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
    const h = now.getHours();
    setMotivationText(MOTIVATIONAL[(now.getDay() * 3 + Math.floor(h / 8)) % MOTIVATIONAL.length]);
  }, [plan]);

  const exercises = todaysPlanDay?.plan_exercises ?? [];
  const isRest = todaysPlanDay?.is_rest ?? false;
  const [activeLog, setActiveLog] = useState<PlanExerciseItem | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(todaySessionId);
  const [loggedIds, setLoggedIds] = useState<Set<string>>(new Set(loggedExerciseIds));
  const [showConfetti, setShowConfetti] = useState(false);

  const doneCount = exercises.filter(pe => loggedIds.has(pe.exercises.id)).length;
  const allDone = exercises.length > 0 && doneCount === exercises.length;

  const [todayWellnessState, setTodayWellnessState] = useState<WellnessLog | null>(todayWellness);
  const [showFatigueModal, setShowFatigueModal] = useState(false);
  const prevLoggedSize = useRef(loggedExerciseIds.length);

  useEffect(() => {
    const cur = loggedIds.size;
    const prev = prevLoggedSize.current;
    prevLoggedSize.current = cur;
    if (cur > prev && exercises.length > 0 && cur === exercises.length && sessionId) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1200);
      setTimeout(() => setShowFatigueModal(true), 600);
    }
  }, [loggedIds]);

  const pct = exercises.length > 0 ? doneCount / exercises.length : 0;

  return (
    <div style={{ minHeight: '100dvh', padding: '0 16px 56px' }}>

      {/* ── Hero ── */}
      <div className="anim-fade-up" style={{ paddingTop: 52, paddingBottom: 32 }}>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-3)',
          letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10,
        }}>
          {formattedDate || '—'}
        </p>

        {/* Name + gradient text */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(52px, 13vw, 82px)',
          fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
          lineHeight: 0.92, marginBottom: 18,
          background: 'linear-gradient(135deg, #16141F 0%, #F59050 55%, #F07030 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {displayName}
        </h1>

        {/* Stats row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {totalDaysLogged > 0 && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--text-3)',
              padding: '4px 10px', borderRadius: 6,
              background: 'rgba(240,112,48,0.08)',
              border: '1px solid rgba(240,112,48,0.18)',
            }}>
              {totalDaysLogged} sessions
            </span>
          )}
          {motivationText && (
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>
              {motivationText}
            </span>
          )}
        </div>
      </div>

      {/* ── Nutrition rings ── */}
      <NutritionRingsCard
        todayWellness={todayWellnessState}
        calorieGoal={calorieGoal}
        proteinGoal={proteinGoal}
        userId={userId}
        onLogged={(slotKey, nutrition) => {
          setTodayWellnessState(prev => ({ ...(prev ?? { id: '', sleep_hours: null, food_breakfast: null, food_lunch: null, food_dinner: null, food_pre_climb: null, climb_strength: null }), [slotKey]: nutrition } as WellnessLog));
        }}
      />

      {/* ── Today's workout card ── */}
      <div className="anim-fade-up-2 glass-card" style={{ padding: '20px 0 8px', marginBottom: 0, position: 'relative', overflow: 'hidden' }}>
        {/* Confetti anchor */}
        <Confetti active={showConfetti} />

        {/* Header row */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '0 20px 16px',
          borderBottom: '1px solid rgba(240,112,48,0.08)',
        }}>
          <div>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--text-3)', marginBottom: 4,
            }}>
              {dayOfWeek >= 0 ? DAY_NAMES[dayOfWeek] : '—'}
            </p>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
              letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--text)',
            }}>
              {!plan ? 'Get Started'
                : isRest ? 'Rest Day'
                : exercises.length > 0 ? plan.name
                : 'No Workout'}
            </p>
          </div>

          {exercises.length > 0 && !isRest && (
            <div style={{ textAlign: 'right' }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 600,
                color: allDone ? 'var(--accent-light)' : 'var(--text-3)',
                letterSpacing: '-0.02em', lineHeight: 1,
                textShadow: allDone ? '0 0 20px rgba(240,112,48,0.6)' : 'none',
                transition: 'all 280ms ease',
              }}>
                {doneCount}<span style={{ fontSize: 14, opacity: 0.7 }}>/{exercises.length}</span>
              </span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {exercises.length > 0 && !isRest && (
          <div style={{ height: 3, background: 'rgba(240,112,48,0.12)', margin: '0 0 2px' }}>
            <div style={{
              height: '100%',
              background: allDone
                ? 'linear-gradient(90deg, #F07030, #F59050, #F07030)'
                : 'linear-gradient(90deg, #F07030, #F59050)',
              width: `${pct * 100}%`,
              boxShadow: allDone ? '0 0 16px rgba(240,112,48,0.8)' : '0 0 8px rgba(240,112,48,0.4)',
              transition: 'width 480ms cubic-bezier(0.34,1.56,0.64,1), background 300ms ease, box-shadow 300ms ease',
            }} />
          </div>
        )}

        {/* Exercise list */}
        {!plan ? (
          <div style={{ padding: '0 20px' }}><EmptyPlan /></div>
        ) : isRest ? (
          <div style={{ padding: '0 20px' }}><RestDay /></div>
        ) : exercises.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-3)', padding: '24px 20px' }}>No exercises planned for today.</p>
        ) : (
          <div>
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
            {allDone && (
              <div
                className="anim-completion"
                style={{
                  margin: '0 16px 16px',
                  padding: '14px 20px', borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(240,112,48,0.18) 0%, rgba(168,124,255,0.1) 100%)',
                  border: '1px solid rgba(240,112,48,0.35)',
                  display: 'flex', alignItems: 'center', gap: 10,
                  boxShadow: '0 0 30px rgba(240,112,48,0.2)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <p style={{
                  fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--accent-light)',
                }}>
                  Session complete
                </p>
              </div>
            )}
          </div>
        )}
      </div>


      {/* ── Modals ── */}
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
    </div>
  );
}
