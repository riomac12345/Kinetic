'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

type NutritionData = {
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: string;
};

type WellnessLog = {
  id: string; date: string;
  sleep_hours: number | null;
  food_breakfast: string | null; food_lunch: string | null;
  food_dinner: string | null; food_pre_climb: string | null;
  climb_strength: number | null;
  breakfast_nutrition: NutritionData | null;
  lunch_nutrition: NutritionData | null;
  dinner_nutrition: NutritionData | null;
  pre_climb_nutrition: NutritionData | null;
};
type Props = { userId: string; logs: WellnessLog[] };

function localDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function fmtLong(s: string) {
  return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
function fmtShort(s: string) {
  return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function strengthCol(n: number) {
  if (n >= 7) return { bg: 'var(--accent-bg)', border: 'var(--accent-border)', text: 'var(--accent)' };
  if (n >= 4) return { bg: 'var(--warm-bg)',   border: 'var(--warm-border)',   text: 'var(--warm)' };
  return        { bg: 'var(--danger-bg)',  border: 'var(--danger-border)',  text: 'var(--danger)' };
}
function strengthLabel(n: number) {
  if (n >= 9) return 'Peak';
  if (n >= 7) return 'Strong';
  if (n >= 5) return 'Solid';
  if (n >= 3) return 'Weak';
  return 'Off day';
}
function sleepQuality(h: number) {
  if (h >= 8) return { text: 'Great', color: 'var(--accent)' };
  if (h >= 7) return { text: 'Good',  color: 'var(--accent)' };
  if (h >= 6) return { text: 'OK',    color: 'var(--warm)' };
  return             { text: 'Low',   color: 'var(--danger)' };
}
function mealSummary(log: WellnessLog) {
  return [
    log.food_breakfast && `B: ${log.food_breakfast}`,
    log.food_lunch     && `L: ${log.food_lunch}`,
    log.food_dinner    && `D: ${log.food_dinner}`,
    log.food_pre_climb && `⚡ ${log.food_pre_climb}`,
  ].filter(Boolean).join('  ·  ');
}

const LBL: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--text-3)',
  display: 'block', marginBottom: 6,
};
const INPUT: React.CSSProperties = {
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  color: 'var(--text)', outline: 'none', transition: 'border-color 140ms ease',
};

function focus(e: React.FocusEvent<HTMLElement>) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; }
function blur(e: React.FocusEvent<HTMLElement>)  { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }

function IconCamera() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}

function NutritionBadge({ data }: { data: NutritionData }) {
  return (
    <div style={{
      display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6,
    }}>
      {[
        { label: 'cal', value: Math.round(data.calories) },
        { label: 'pro', value: `${Math.round(data.protein)}g` },
        { label: 'carb', value: `${Math.round(data.carbs)}g` },
        { label: 'fat', value: `${Math.round(data.fat)}g` },
      ].map(({ label, value }) => (
        <span key={label} style={{
          display: 'inline-flex', alignItems: 'baseline', gap: 3,
          padding: '2px 7px',
          background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
          fontFamily: 'var(--font-mono)', fontSize: 10,
        }}>
          <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{value}</span>
          <span style={{ color: 'var(--text-3)', fontSize: 9 }}>{label}</span>
        </span>
      ))}
    </div>
  );
}

function MealField({ label, value, onChange, placeholder, accent, nutrition, onNutritionChange }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  accent?: boolean;
  nutrition: NutritionData | null;
  onNutritionChange: (n: NutritionData | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);

  async function handleFile(file: File) {
    setAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        const [header, base64] = dataUrl.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';

        const res = await fetch('/api/analyze-meal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        });
        if (res.ok) {
          const data: NutritionData = await res.json();
          onChange(data.description);
          onNutritionChange(data);
        }
        setAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setAnalyzing(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ ...LBL, marginBottom: 0, color: accent ? 'var(--warm)' : 'var(--text-3)' }}>{label}</label>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={analyzing}
          title="Take a photo to auto-fill"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 8px', background: 'transparent',
            border: `1px solid ${accent ? 'var(--warm-border)' : 'var(--border)'}`,
            color: analyzing ? 'var(--accent)' : 'var(--text-3)',
            cursor: analyzing ? 'default' : 'pointer',
            fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            transition: 'all 140ms ease',
          }}
          onMouseEnter={e => { if (!analyzing) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; } }}
          onMouseLeave={e => { if (!analyzing) { (e.currentTarget as HTMLElement).style.borderColor = accent ? 'var(--warm-border)' : 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; } }}
        >
          {analyzing ? (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)' }}>Analyzing…</span>
          ) : (
            <>
              <IconCamera />
              <span>Photo</span>
            </>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        />
      </div>
      <textarea
        value={value} onChange={e => { onChange(e.target.value); if (!e.target.value) onNutritionChange(null); }}
        placeholder={placeholder} rows={2}
        style={{ ...INPUT, width: '100%', padding: '10px 12px', fontSize: 13, lineHeight: 1.6, resize: 'none',
          border: `1px solid ${accent ? 'var(--warm-border)' : 'var(--border)'}`,
        }}
        onFocus={e => (e.currentTarget.style.borderColor = accent ? 'var(--warm)' : 'var(--accent)')}
        onBlur={e => (e.currentTarget.style.borderColor = accent ? 'var(--warm-border)' : 'var(--border)')}
      />
      {nutrition && <NutritionBadge data={nutrition} />}
    </div>
  );
}

// ── Insights ──────────────────────────────────────────────────────────────────

function InsightsSection({ logs }: { logs: WellnessLog[] }) {
  const logsWithSleep = logs.filter(l => l.sleep_hours != null);
  const avgSleep = logsWithSleep.length
    ? logsWithSleep.reduce((s, l) => s + l.sleep_hours!, 0) / logsWithSleep.length : null;

  const climbLogs = useMemo(
    () => logs.filter(l => l.climb_strength != null).sort((a, b) => b.climb_strength! - a.climb_strength!),
    [logs],
  );
  const avgClimb = climbLogs.length
    ? climbLogs.reduce((s, l) => s + l.climb_strength!, 0) / climbLogs.length : null;

  const bestDays = climbLogs.slice(0, 6);
  const avgSleepBest = useMemo(() => {
    const top = climbLogs.slice(0, 5).filter(l => l.sleep_hours != null);
    return top.length ? top.reduce((s, l) => s + l.sleep_hours!, 0) / top.length : null;
  }, [climbLogs]);

  if (!logs.length) {
    return (
      <div style={{ textAlign: 'center', padding: '56px 0' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 8 }}>No data yet</p>
        <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.65 }}>
          Log sleep, meals, and climbing strength.<br />Patterns appear once you have a few entries.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border)' }}>
        <div style={{ padding: '20px 0 20px', borderRight: '1px solid var(--border)', paddingRight: 20 }}>
          <p style={{ ...LBL, marginBottom: 10 }}>Avg sleep</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 40, fontWeight: 500, color: 'var(--text)', letterSpacing: '-0.04em', lineHeight: 1 }}>
            {avgSleep != null ? avgSleep.toFixed(1) : '—'}
            <span style={{ fontSize: 14, color: 'var(--text-3)', marginLeft: 3 }}>hrs</span>
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
            {logsWithSleep.length} days tracked
          </p>
        </div>
        <div style={{ padding: '20px 0 20px 20px' }}>
          <p style={{ ...LBL, marginBottom: 10 }}>Avg strength</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 40, fontWeight: 500, color: 'var(--text)', letterSpacing: '-0.04em', lineHeight: 1 }}>
            {avgClimb != null ? avgClimb.toFixed(1) : '—'}
            <span style={{ fontSize: 14, color: 'var(--text-3)', marginLeft: 3 }}>/10</span>
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
            {climbLogs.length} sessions
          </p>
        </div>
      </div>

      {avgSleep != null && avgSleepBest != null && climbLogs.length >= 4 && (
        <div style={{ padding: '18px 0', borderBottom: '1px solid var(--border)' }}>
          <p style={{ ...LBL, marginBottom: 8 }}>Pattern</p>
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
            {Math.abs(avgSleepBest - avgSleep) >= 0.5 ? (
              avgSleepBest > avgSleep
                ? <>On your <span style={{ color: 'var(--accent)', fontWeight: 600 }}>strongest days</span> you slept <span style={{ color: 'var(--text)', fontWeight: 600 }}>{avgSleepBest.toFixed(1)} hrs</span> — {(avgSleepBest - avgSleep).toFixed(1)} hrs more than your average.</>
                : <>Your strongest sessions happen even with slightly less sleep ({avgSleepBest.toFixed(1)} hrs vs {avgSleep.toFixed(1)} avg). Keep tracking.</>
            ) : (
              <>Sleep doesn&apos;t clearly separate your best days yet. Keep logging.</>
            )}
          </p>
        </div>
      )}

      {bestDays.length > 0 && (
        <div style={{ paddingTop: 18 }}>
          <p style={{ ...LBL, marginBottom: 14 }}>Strongest days</p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {bestDays.map((log, i) => {
              const c = strengthCol(log.climb_strength!);
              const meals = [
                log.food_breakfast && { label: 'B', val: log.food_breakfast },
                log.food_lunch     && { label: 'L', val: log.food_lunch },
                log.food_dinner    && { label: 'D', val: log.food_dinner },
                log.food_pre_climb && { label: '⚡', val: log.food_pre_climb },
              ].filter(Boolean) as { label: string; val: string }[];

              return (
                <div key={log.id} style={{ padding: '14px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>{fmtShort(log.date)}</p>
                    <span style={{ padding: '2px 8px', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500, background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                      {log.climb_strength}/10 · {strengthLabel(log.climb_strength!)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {log.sleep_hours != null && (
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>Sleep: {log.sleep_hours}h</p>
                    )}
                    {meals.map(m => (
                      <p key={m.label} style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--text-2)', marginRight: 6 }}>{m.label}</span>{m.val}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!climbLogs.length && (
        <div style={{ paddingTop: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No climbing sessions yet — add a strength rating to get started.</p>
        </div>
      )}
    </div>
  );
}

// ── History ───────────────────────────────────────────────────────────────────

function HistorySection({ logs, onDelete }: { logs: WellnessLog[]; onDelete: (id: string, date: string) => void }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(log: WellnessLog) {
    setDeletingId(log.id);
    await onDelete(log.id, log.date);
    setDeletingId(null);
  }

  if (!logs.length) {
    return (
      <div style={{ paddingTop: 40, textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--text-3)' }}>No history yet. Your log entries will appear here.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {logs.map((log, i) => {
        const c = log.climb_strength ? strengthCol(log.climb_strength) : null;
        const summary = mealSummary(log);
        const isDeleting = deletingId === log.id;
        return (
          <div key={log.id} style={{ padding: '14px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none', opacity: isDeleting ? 0.35 : 1, transition: 'opacity 140ms ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: summary ? 5 : 0 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{fmtShort(log.date)}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {log.sleep_hours != null && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>{log.sleep_hours}h</span>
                )}
                {c && log.climb_strength && (
                  <span style={{ padding: '1px 7px', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 500, background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>{log.climb_strength}/10</span>
                )}
                <button
                  onClick={() => handleDelete(log)}
                  disabled={!!deletingId}
                  style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-3)', cursor: 'pointer', transition: 'border-color 140ms ease, color 140ms ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--danger-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                  </svg>
                </button>
              </div>
            </div>
            {summary && <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.55 }}>{summary.length > 130 ? summary.slice(0, 130) + '…' : summary}</p>}
          </div>
        );
      })}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DailyLogView({ userId, logs: initialLogs }: Props) {
  const supabase = createClient();

  const [today, setToday] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [logs, setLogs] = useState<WellnessLog[]>(initialLogs);

  useEffect(() => {
    const t = localDate(new Date());
    setToday(t); setSelectedDate(t);
  }, []);

  const logMap = useMemo(() => {
    const m: Record<string, WellnessLog> = {};
    for (const l of logs) m[l.date] = l;
    return m;
  }, [logs]);

  const selectedLog = selectedDate ? (logMap[selectedDate] ?? null) : null;

  const [sleepHours, setSleepHours] = useState('');
  const [breakfast, setBreakfast] = useState('');
  const [lunch, setLunch] = useState('');
  const [dinner, setDinner] = useState('');
  const [preClimb, setPreClimb] = useState('');
  const [climbStrength, setClimbStrength] = useState<number | null>(null);
  const [breakfastNutrition, setBreakfastNutrition] = useState<NutritionData | null>(null);
  const [lunchNutrition, setLunchNutrition] = useState<NutritionData | null>(null);
  const [dinnerNutrition, setDinnerNutrition] = useState<NutritionData | null>(null);
  const [preClimbNutrition, setPreClimbNutrition] = useState<NutritionData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setSleepHours(selectedLog?.sleep_hours?.toString() ?? '');
    setBreakfast(selectedLog?.food_breakfast ?? '');
    setLunch(selectedLog?.food_lunch ?? '');
    setDinner(selectedLog?.food_dinner ?? '');
    setPreClimb(selectedLog?.food_pre_climb ?? '');
    setClimbStrength(selectedLog?.climb_strength ?? null);
    setBreakfastNutrition(selectedLog?.breakfast_nutrition ?? null);
    setLunchNutrition(selectedLog?.lunch_nutrition ?? null);
    setDinnerNutrition(selectedLog?.dinner_nutrition ?? null);
    setPreClimbNutrition(selectedLog?.pre_climb_nutrition ?? null);
    setSaved(false);
  }, [selectedDate]); // eslint-disable-line

  function prevDay() {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(localDate(d));
  }
  function nextDay() {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    const next = localDate(d);
    if (next <= today) setSelectedDate(next);
  }
  const isToday = selectedDate === today;

  async function save() {
    if (!selectedDate) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('wellness_logs')
      .upsert({
        user_id: userId, date: selectedDate,
        sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
        food_breakfast: breakfast.trim() || null,
        food_lunch: lunch.trim() || null,
        food_dinner: dinner.trim() || null,
        food_pre_climb: preClimb.trim() || null,
        climb_strength: climbStrength,
        breakfast_nutrition: breakfastNutrition,
        lunch_nutrition: lunchNutrition,
        dinner_nutrition: dinnerNutrition,
        pre_climb_nutrition: preClimbNutrition,
      }, { onConflict: 'user_id,date' })
      .select().single();
    setSaving(false);
    if (!error && data) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setLogs(prev => {
        const idx = prev.findIndex(l => l.date === selectedDate);
        if (idx >= 0) { const next = [...prev]; next[idx] = data as WellnessLog; return next; }
        return [data as WellnessLog, ...prev].sort((a, b) => b.date.localeCompare(a.date));
      });
    }
  }

  async function deleteEntry(logId: string, logDate: string) {
    setDeleting(true);
    await supabase.from('wellness_logs').delete().eq('id', logId);
    setLogs(prev => prev.filter(l => l.date !== logDate));
    if (logDate === selectedDate) {
      setSleepHours(''); setBreakfast(''); setLunch('');
      setDinner(''); setPreClimb(''); setClimbStrength(null);
      setBreakfastNutrition(null); setLunchNutrition(null);
      setDinnerNutrition(null); setPreClimbNutrition(null);
    }
    setDeleting(false);
  }

  const hasDirty =
    sleepHours !== (selectedLog?.sleep_hours?.toString() ?? '') ||
    breakfast  !== (selectedLog?.food_breakfast ?? '') ||
    lunch      !== (selectedLog?.food_lunch ?? '') ||
    dinner     !== (selectedLog?.food_dinner ?? '') ||
    preClimb   !== (selectedLog?.food_pre_climb ?? '') ||
    climbStrength !== (selectedLog?.climb_strength ?? null) ||
    JSON.stringify(breakfastNutrition) !== JSON.stringify(selectedLog?.breakfast_nutrition ?? null) ||
    JSON.stringify(lunchNutrition) !== JSON.stringify(selectedLog?.lunch_nutrition ?? null) ||
    JSON.stringify(dinnerNutrition) !== JSON.stringify(selectedLog?.dinner_nutrition ?? null) ||
    JSON.stringify(preClimbNutrition) !== JSON.stringify(selectedLog?.pre_climb_nutrition ?? null);

  const [activeSection, setActiveSection] = useState<'insights' | 'history'>('insights');

  if (!selectedDate) return null;

  const navBtn: React.CSSProperties = {
    width: 34, height: 34, borderRadius: 9,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(240,112,48,0.07)', border: '1px solid rgba(240,112,48,0.2)',
    color: 'var(--text-2)', cursor: 'pointer', flexShrink: 0,
    transition: 'all 160ms ease',
  };

  return (
    <div style={{ minHeight: '100dvh', padding: '0 20px 48px' }}>

      {/* ── Hero + date nav ── */}
      <div className="anim-fade-up" style={{ paddingTop: 52, paddingBottom: 22, borderBottom: '1px solid rgba(240,112,48,0.1)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 14 }}>
          Daily Log
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={prevDay} style={navBtn}
            onMouseEnter={e => { (e.currentTarget.style.borderColor = 'var(--border-2)'); (e.currentTarget.style.color = 'var(--text)'); }}
            onMouseLeave={e => { (e.currentTarget.style.borderColor = 'var(--border)'); (e.currentTarget.style.color = 'var(--text-2)'); }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 6vw, 32px)', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text)', lineHeight: 1 }}>
              {fmtLong(selectedDate)}
            </h1>
            {!isToday && (
              <button onClick={() => setSelectedDate(today)} style={{ marginTop: 8, padding: '4px 10px', background: 'transparent', border: '1px solid var(--border)', fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', cursor: 'pointer', transition: 'border-color 140ms ease, color 140ms ease' }}
              onMouseEnter={e => { (e.currentTarget.style.borderColor = 'var(--border-2)'); (e.currentTarget.style.color = 'var(--text-2)'); }}
              onMouseLeave={e => { (e.currentTarget.style.borderColor = 'var(--border)'); (e.currentTarget.style.color = 'var(--text-3)'); }}
              >
                Back to today
              </button>
            )}
          </div>

          <button
            onClick={nextDay} disabled={isToday}
            style={{ ...navBtn, cursor: isToday ? 'default' : 'pointer', opacity: isToday ? 0.25 : 1 }}
            onMouseEnter={e => { if (!isToday) { (e.currentTarget.style.borderColor = 'var(--border-2)'); (e.currentTarget.style.color = 'var(--text)'); } }}
            onMouseLeave={e => { (e.currentTarget.style.borderColor = 'var(--border)'); (e.currentTarget.style.color = 'var(--text-2)'); }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      {/* ── Log form ── */}
      <div className="anim-fade-up-1" style={{ paddingTop: 22, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
            {isToday ? "Today's Entry" : 'Past Entry'} · {selectedLog ? 'Edit' : 'New'}
          </p>
          {saved && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>Saved ✓</span>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Sleep */}
          <div>
            <label style={LBL}>Sleep</label>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <input
                type="number" inputMode="decimal" min="0" max="24" step="0.5"
                value={sleepHours} onChange={e => setSleepHours(e.target.value)} placeholder="0"
                style={{ ...INPUT, width: 80, padding: '10px 10px', fontFamily: 'var(--font-mono)', fontSize: 34, fontWeight: 500, letterSpacing: '-0.04em', textAlign: 'center' }}
                onFocus={focus} onBlur={blur}
              />
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--text-3)' }}>hrs</p>
                {sleepHours && parseFloat(sleepHours) > 0 && (() => {
                  const q = sleepQuality(parseFloat(sleepHours));
                  return <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: q.color, marginTop: 2 }}>{q.text}</p>;
                })()}
              </div>
            </div>
          </div>

          {/* Meals */}
          <div>
            <p style={{ ...LBL, marginBottom: 12 }}>Meals</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <MealField label="Breakfast" value={breakfast} onChange={setBreakfast} placeholder="oats, eggs, fruit…" nutrition={breakfastNutrition} onNutritionChange={setBreakfastNutrition} />
              <MealField label="Lunch" value={lunch} onChange={setLunch} placeholder="chicken + rice, salad…" nutrition={lunchNutrition} onNutritionChange={setLunchNutrition} />
              <MealField label="Dinner" value={dinner} onChange={setDinner} placeholder="pasta, salmon, veg…" nutrition={dinnerNutrition} onNutritionChange={setDinnerNutrition} />
              <MealField label="Pre-climb (within 1 hr)" value={preClimb} onChange={setPreClimb} placeholder="banana, energy bar, espresso…" accent nutrition={preClimbNutrition} onNutritionChange={setPreClimbNutrition} />
            </div>
          </div>

          {/* Climb strength */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ ...LBL, marginBottom: 0 }}>Climbing strength</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {climbStrength != null && (
                  <>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: strengthCol(climbStrength).text }}>
                      {strengthLabel(climbStrength)}
                    </span>
                    <button onClick={() => setClimbStrength(null)} style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      Clear
                    </button>
                  </>
                )}
                {climbStrength == null && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>optional</span>}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => {
                const c = strengthCol(n);
                const sel = climbStrength === n;
                return (
                  <button key={n} onClick={() => setClimbStrength(climbStrength === n ? null : n)} style={{
                    padding: '10px 0', borderRadius: 6,
                    fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: sel ? 600 : 400,
                    background: sel ? c.bg : 'rgba(255,255,255,0.5)',
                    border: sel ? `1.5px solid ${c.border}` : '1px solid rgba(240,112,48,0.15)',
                    color: sel ? c.text : 'var(--text-3)',
                    boxShadow: sel ? `0 0 8px ${c.border}` : 'none',
                    cursor: 'pointer', transition: 'all 120ms ease', touchAction: 'manipulation',
                  }}
                    onMouseEnter={e => { if (!sel) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; } }}
                    onMouseLeave={e => { if (!sel) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; } }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={save}
            disabled={saving || deleting || !hasDirty}
            style={{
              padding: '14px', borderRadius: 12,
              background: saving || deleting || !hasDirty ? 'rgba(240,112,48,0.12)' : 'linear-gradient(135deg, #F07030 0%, #F59050 100%)',
              border: 'none', cursor: saving || deleting || !hasDirty ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: saving || deleting || !hasDirty ? 'var(--text-3)' : 'white',
              boxShadow: saving || deleting || !hasDirty ? 'none' : '0 0 20px rgba(240,112,48,0.4)',
              opacity: saving || deleting || !hasDirty ? 0.6 : 1, transition: 'opacity 120ms ease',
            }}
            onMouseEnter={e => { if (!saving && !deleting && hasDirty) (e.currentTarget as HTMLElement).style.opacity = '0.82'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = saving || deleting || !hasDirty ? '0.35' : '1'; }}
          >
            {saving ? 'Saving…' : selectedLog ? 'Update' : 'Save'}
          </button>

          {selectedLog && (
            <button
              onClick={() => deleteEntry(selectedLog.id, selectedLog.date)}
              disabled={deleting || saving}
              style={{ padding: '10px', background: 'transparent', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', opacity: deleting ? 0.5 : 1, transition: 'opacity 120ms ease, border-color 140ms ease' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--danger)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--danger-border)')}
            >
              {deleting ? 'Deleting…' : 'Delete entry'}
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="anim-fade-up-2" style={{ display: 'flex', borderBottom: '1px solid rgba(240,112,48,0.1)', marginTop: 0 }}>
        {(['insights', 'history'] as const).map(s => (
          <button key={s} onClick={() => setActiveSection(s)} style={{
            flex: 1, padding: '14px 0', background: 'transparent', border: 'none',
            borderBottom: activeSection === s ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1,
            fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: activeSection === s ? 'var(--accent-light)' : 'var(--text-3)',
            cursor: 'pointer', transition: 'color 160ms ease, border-color 160ms ease',
          }}>
            {s === 'insights' ? 'Insights' : 'History'}
          </button>
        ))}
      </div>

      <div className="anim-fade-up-3" style={{ paddingTop: 20 }}>
        {activeSection === 'insights'
          ? <InsightsSection logs={logs} />
          : <HistorySection logs={logs} onDelete={deleteEntry} />
        }
      </div>
    </div>
  );
}
