'use client';

import { useState, useMemo, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

type WellnessLog = {
  id: string;
  date: string;
  sleep_hours: number | null;
  food_breakfast: string | null;
  food_lunch: string | null;
  food_dinner: string | null;
  food_pre_climb: string | null;
  climb_strength: number | null;
};

type Props = { userId: string; logs: WellnessLog[] };

function localDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function fmtLong(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

function fmtShort(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function strengthColor(n: number) {
  if (n >= 7) return { bg: 'rgba(124,90,246,0.1)', border: 'rgba(124,90,246,0.25)', text: '#a78bf8' };
  if (n >= 4) return { bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.25)', text: '#fb923c' };
  return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', text: '#f87171' };
}

function strengthLabel(n: number) {
  if (n >= 9) return 'Peak';
  if (n >= 7) return 'Strong';
  if (n >= 5) return 'Solid';
  if (n >= 3) return 'Weak';
  return 'Off day';
}

function sleepQuality(h: number) {
  if (h >= 8) return { text: 'Great', color: '#a78bf8' };
  if (h >= 7) return { text: 'Good', color: '#a78bf8' };
  if (h >= 6) return { text: 'Average', color: '#fb923c' };
  return { text: 'Low', color: '#f87171' };
}

function mealSummary(log: WellnessLog) {
  return [
    log.food_breakfast && `B: ${log.food_breakfast}`,
    log.food_lunch && `L: ${log.food_lunch}`,
    log.food_dinner && `D: ${log.food_dinner}`,
    log.food_pre_climb && `⚡ ${log.food_pre_climb}`,
  ].filter(Boolean).join('  ·  ');
}

const CARD: React.CSSProperties = {
  borderRadius: 24,
  background: 'linear-gradient(160deg, rgba(20,16,50,0.9) 0%, rgba(14,11,36,0.95) 100%)',
  border: '1px solid rgba(124,90,246,0.15)',
  boxShadow: '0 4px 8px rgba(0,0,0,0.6), 0 16px 48px rgba(0,0,0,0.5)',
  overflow: 'hidden',
};

const CARD_HDR: React.CSSProperties = {
  padding: '16px 20px',
  borderBottom: '1px solid rgba(124,90,246,0.08)',
  background: 'linear-gradient(180deg, rgba(124,90,246,0.06) 0%, transparent 100%)',
};

const LBL: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'rgba(167,139,248,0.55)',
  display: 'block', marginBottom: 10,
};

const INPUT: React.CSSProperties = {
  background: 'rgba(124,90,246,0.07)',
  border: '1px solid rgba(124,90,246,0.16)',
  outline: 'none', transition: 'border-color 150ms ease', color: '#ffffff',
};

function focus(e: React.FocusEvent<HTMLElement>) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,90,246,0.5)'; }
function blur(e: React.FocusEvent<HTMLElement>)  { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,90,246,0.16)'; }

function MealField({ label, value, onChange, placeholder, rows = 2 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; rows?: number;
}) {
  return (
    <div>
      <label style={LBL}>{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{ ...INPUT, width: '100%', padding: '12px 16px', borderRadius: 16, fontSize: 14, lineHeight: 1.6, resize: 'none' }}
        onFocus={focus} onBlur={blur}
      />
    </div>
  );
}

// ── Insights ─────────────────────────────────────────────────────────────────

function InsightsSection({ logs }: { logs: WellnessLog[] }) {
  const logsWithSleep = logs.filter(l => l.sleep_hours != null);
  const avgSleep = logsWithSleep.length
    ? logsWithSleep.reduce((s, l) => s + l.sleep_hours!, 0) / logsWithSleep.length
    : null;

  const climbLogs = useMemo(
    () => logs.filter(l => l.climb_strength != null).sort((a, b) => b.climb_strength! - a.climb_strength!),
    [logs],
  );
  const avgClimb = climbLogs.length
    ? climbLogs.reduce((s, l) => s + l.climb_strength!, 0) / climbLogs.length
    : null;

  const bestDays = climbLogs.slice(0, 6);
  const avgSleepBest = useMemo(() => {
    const top = climbLogs.slice(0, 5).filter(l => l.sleep_hours != null);
    return top.length ? top.reduce((s, l) => s + l.sleep_hours!, 0) / top.length : null;
  }, [climbLogs]);

  if (!logs.length) {
    return (
      <div style={{ textAlign: 'center', padding: '56px 24px' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 18, margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(124,90,246,0.08)', border: '1px solid rgba(124,90,246,0.15)',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bf8" strokeWidth="1.75" strokeLinecap="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </div>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 6, letterSpacing: '-0.02em' }}>No data yet</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.65 }}>
          Log sleep, meals, and climbing strength above.<br />Patterns will appear once you have a few entries.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ ...CARD, padding: 18 }}>
          <p style={{ ...LBL, marginBottom: 8 }}>Avg sleep</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1 }}>
            {avgSleep != null ? avgSleep.toFixed(1) : '—'}
            <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginLeft: 3 }}>hrs</span>
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>
            {logsWithSleep.length} day{logsWithSleep.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <div style={{ ...CARD, padding: 18 }}>
          <p style={{ ...LBL, marginBottom: 8 }}>Avg strength</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1 }}>
            {avgClimb != null ? avgClimb.toFixed(1) : '—'}
            <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginLeft: 3 }}>/10</span>
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>
            {climbLogs.length} session{climbLogs.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Pattern callout */}
      {avgSleep != null && avgSleepBest != null && climbLogs.length >= 4 && (
        <div style={{
          padding: '16px 18px', borderRadius: 20,
          background: 'rgba(124,90,246,0.07)', border: '1px solid rgba(124,90,246,0.18)',
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(167,139,248,0.55)', marginBottom: 8 }}>Pattern</p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65 }}>
            {Math.abs(avgSleepBest - avgSleep) >= 0.5 ? (
              avgSleepBest > avgSleep
                ? <>On your <span style={{ color: '#a78bf8', fontWeight: 700 }}>strongest days</span> you slept <span style={{ color: '#ffffff', fontWeight: 700 }}>{avgSleepBest.toFixed(1)} hrs</span> — {(avgSleepBest - avgSleep).toFixed(1)} hrs more than your average.</>
                : <>Your strongest sessions happen even with slightly less sleep ({avgSleepBest.toFixed(1)} hrs vs {avgSleep.toFixed(1)} avg). Keep tracking to find more patterns.</>
            ) : (
              <>Sleep doesn&apos;t clearly separate your best days yet ({avgSleepBest.toFixed(1)} hrs on best days vs {avgSleep.toFixed(1)} avg). Keep logging.</>
            )}
          </p>
        </div>
      )}

      {/* Best climbing days */}
      {bestDays.length > 0 && (
        <div style={CARD}>
          <div style={CARD_HDR}>
            <p style={{ ...LBL, marginBottom: 3 }}>Strongest days</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>Your best climbing sessions</p>
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bestDays.map((log, i) => {
              const c = strengthColor(log.climb_strength!);
              const meals = [
                log.food_breakfast && { icon: '🌅', label: 'Breakfast', val: log.food_breakfast },
                log.food_lunch     && { icon: '☀️', label: 'Lunch',     val: log.food_lunch },
                log.food_dinner    && { icon: '🌙', label: 'Dinner',    val: log.food_dinner },
                log.food_pre_climb && { icon: '⚡', label: 'Pre-climb', val: log.food_pre_climb },
              ].filter(Boolean) as { icon: string; label: string; val: string }[];

              return (
                <div key={log.id} style={{
                  padding: '14px 16px', borderRadius: 16,
                  background: i === 0 ? 'rgba(124,90,246,0.09)' : 'rgba(255,255,255,0.025)',
                  border: i === 0 ? '1px solid rgba(124,90,246,0.2)' : '1px solid rgba(124,90,246,0.07)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>{fmtShort(log.date)}</p>
                    <span style={{
                      padding: '3px 10px', borderRadius: 99, fontSize: 13, fontWeight: 800,
                      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
                    }}>
                      {log.climb_strength}/10 · {strengthLabel(log.climb_strength!)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {log.sleep_hours != null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,248,0.45)" strokeWidth="2" strokeLinecap="round">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                        </svg>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{log.sleep_hours} hrs sleep</p>
                      </div>
                    )}
                    {meals.map(m => (
                      <div key={m.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                        <span style={{ fontSize: 11, flexShrink: 0 }}>{m.icon}</span>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                          <span style={{ color: 'rgba(167,139,248,0.5)', fontWeight: 600 }}>{m.label}:</span>{' '}{m.val}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!climbLogs.length && (
        <div style={{
          padding: '24px 20px', borderRadius: 20, textAlign: 'center',
          background: 'rgba(124,90,246,0.04)', border: '1px solid rgba(124,90,246,0.1)',
        }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 6 }}>No climbing sessions yet</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Add a climbing strength rating on any session day.</p>
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
      <div style={{ textAlign: 'center', padding: '56px 24px' }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 6 }}>No history yet</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Your log entries will appear here.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {logs.map(log => {
        const c = log.climb_strength ? strengthColor(log.climb_strength) : null;
        const summary = mealSummary(log);
        const isDeleting = deletingId === log.id;
        return (
          <div key={log.id} style={{
            padding: '14px 16px', borderRadius: 18,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(124,90,246,0.08)',
            opacity: isDeleting ? 0.4 : 1,
            transition: 'opacity 150ms ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: summary ? 6 : 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>{fmtShort(log.date)}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {log.sleep_hours != null && (
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{log.sleep_hours}h</span>
                )}
                {c && log.climb_strength && (
                  <span style={{
                    padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                    background: c.bg, border: `1px solid ${c.border}`, color: c.text,
                  }}>{log.climb_strength}/10</span>
                )}
                <button
                  onClick={() => handleDelete(log)}
                  disabled={!!deletingId}
                  style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: '1px solid rgba(239,68,68,0.12)',
                    color: 'rgba(239,68,68,0.4)', cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.3)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(239,68,68,0.4)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.12)'; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                  </svg>
                </button>
              </div>
            </div>
            {summary && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', lineHeight: 1.55 }}>
                {summary.length > 130 ? summary.slice(0, 130) + '…' : summary}
              </p>
            )}
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
    setToday(t);
    setSelectedDate(t);
  }, []);

  const logMap = useMemo(() => {
    const m: Record<string, WellnessLog> = {};
    for (const l of logs) m[l.date] = l;
    return m;
  }, [logs]);

  const selectedLog = selectedDate ? (logMap[selectedDate] ?? null) : null;

  // Form state
  const [sleepHours, setSleepHours] = useState('');
  const [breakfast, setBreakfast] = useState('');
  const [lunch, setLunch] = useState('');
  const [dinner, setDinner] = useState('');
  const [preClimb, setPreClimb] = useState('');
  const [climbStrength, setClimbStrength] = useState<number | null>(null);
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
    setSaved(false);
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

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
        user_id: userId,
        date: selectedDate,
        sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
        food_breakfast: breakfast.trim() || null,
        food_lunch: lunch.trim() || null,
        food_dinner: dinner.trim() || null,
        food_pre_climb: preClimb.trim() || null,
        climb_strength: climbStrength,
      }, { onConflict: 'user_id,date' })
      .select()
      .single();
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
    }
    setDeleting(false);
  }

  const hasDirtyChanges =
    sleepHours !== (selectedLog?.sleep_hours?.toString() ?? '') ||
    breakfast  !== (selectedLog?.food_breakfast ?? '') ||
    lunch      !== (selectedLog?.food_lunch ?? '') ||
    dinner     !== (selectedLog?.food_dinner ?? '') ||
    preClimb   !== (selectedLog?.food_pre_climb ?? '') ||
    climbStrength !== (selectedLog?.climb_strength ?? null);

  const [activeSection, setActiveSection] = useState<'insights' | 'history'>('insights');

  if (!selectedDate) return null;

  const navBtn: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 12, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(124,90,246,0.08)', border: '1px solid rgba(124,90,246,0.15)',
    color: 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'background 150ms ease',
  };

  return (
    <div style={{ minHeight: '100dvh', padding: '0 20px 48px' }}>

      {/* Hero + date nav */}
      <div className="anim-fade-up" style={{ paddingTop: 72, paddingBottom: 20 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(167,139,248,0.55)', marginBottom: 16 }}>
          Daily Log
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={prevDay} style={navBtn}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,90,246,0.16)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(124,90,246,0.08)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{ fontSize: 'clamp(18px, 5vw, 26px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {fmtLong(selectedDate)}
            </h1>
            {!isToday && (
              <button onClick={() => setSelectedDate(today)} style={{
                marginTop: 6, padding: '3px 12px', borderRadius: 99,
                fontSize: 11, fontWeight: 600,
                background: 'rgba(124,90,246,0.1)', border: '1px solid rgba(124,90,246,0.22)',
                color: '#a78bf8', cursor: 'pointer',
              }}>
                Back to today
              </button>
            )}
          </div>

          <button
            onClick={nextDay}
            disabled={isToday}
            style={{ ...navBtn, cursor: isToday ? 'default' : 'pointer', opacity: isToday ? 0.25 : 1 }}
            onMouseEnter={e => { if (!isToday) (e.currentTarget.style.background = 'rgba(124,90,246,0.16)'); }}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(124,90,246,0.08)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      {/* Log card */}
      <div className="anim-fade-up-1" style={{ ...CARD, marginBottom: 16 }}>
        <div style={{ ...CARD_HDR, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ ...LBL, marginBottom: 3 }}>{isToday ? "Today's entry" : 'Past entry'}</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
              {selectedLog ? 'Edit entry' : 'New entry'}
            </p>
          </div>
          {saved && (
            <span style={{
              padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
              background: 'rgba(124,90,246,0.18)', border: '1px solid rgba(124,90,246,0.35)', color: '#a78bf8',
            }}>Saved ✓</span>
          )}
        </div>

        <div style={{ padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Sleep */}
          <div>
            <label style={LBL}>Sleep</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="number" inputMode="decimal" min="0" max="24" step="0.5"
                value={sleepHours} onChange={e => setSleepHours(e.target.value)} placeholder="0"
                style={{ ...INPUT, width: 84, padding: '12px 14px', borderRadius: 16, fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', textAlign: 'center' }}
                onFocus={focus} onBlur={blur}
              />
              <div>
                <p style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '-0.02em' }}>hrs</p>
                {sleepHours && parseFloat(sleepHours) > 0 && (() => {
                  const q = sleepQuality(parseFloat(sleepHours));
                  return <p style={{ fontSize: 12, color: q.color, marginTop: 2, fontWeight: 600 }}>{q.text}</p>;
                })()}
              </div>
            </div>
          </div>

          {/* Meals section */}
          <div>
            <p style={{ ...LBL, marginBottom: 14 }}>Meals</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <MealField label="Breakfast" value={breakfast} onChange={setBreakfast} placeholder="e.g. oats, eggs, fruit…" />
              <MealField label="Lunch" value={lunch} onChange={setLunch} placeholder="e.g. chicken + rice, salad…" />
              <MealField label="Dinner" value={dinner} onChange={setDinner} placeholder="e.g. pasta, salmon, veg…" />
              <div>
                <label style={{ ...LBL, color: 'rgba(251,146,60,0.7)' }}>⚡ Pre-climb (within 1 hr)</label>
                <textarea
                  value={preClimb}
                  onChange={e => setPreClimb(e.target.value)}
                  placeholder="e.g. banana, energy bar, espresso…"
                  rows={2}
                  style={{
                    ...INPUT, width: '100%', padding: '12px 16px',
                    borderRadius: 16, fontSize: 14, lineHeight: 1.6, resize: 'none',
                    border: '1px solid rgba(251,146,60,0.2)',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(251,146,60,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(251,146,60,0.2)')}
                />
              </div>
            </div>
          </div>

          {/* Climb strength */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label style={{ ...LBL, marginBottom: 0 }}>Climbing strength</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {climbStrength != null && (
                  <>
                    <span style={{ fontSize: 12, fontWeight: 600, color: strengthColor(climbStrength).text }}>
                      {strengthLabel(climbStrength)}
                    </span>
                    <button onClick={() => setClimbStrength(null)} style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      clear
                    </button>
                  </>
                )}
                {climbStrength == null && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>optional</span>}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 5 }}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => {
                const c = strengthColor(n);
                const sel = climbStrength === n;
                return (
                  <button key={n} onClick={() => setClimbStrength(climbStrength === n ? null : n)} style={{
                    padding: '10px 0', borderRadius: 10, fontSize: 14, fontWeight: 700,
                    background: sel ? c.bg : 'rgba(255,255,255,0.03)',
                    border: sel ? `1px solid ${c.border}` : '1px solid rgba(255,255,255,0.06)',
                    color: sel ? c.text : 'rgba(255,255,255,0.22)',
                    cursor: 'pointer', transition: 'all 150ms ease', touchAction: 'manipulation',
                  }}
                    onMouseEnter={e => { if (!sel) { (e.currentTarget as HTMLElement).style.background = c.bg; (e.currentTarget as HTMLElement).style.color = c.text; } }}
                    onMouseLeave={e => { if (!sel) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.22)'; } }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={save}
            disabled={saving || deleting || !hasDirtyChanges}
            style={{
              padding: '15px', borderRadius: 99, fontSize: 14, fontWeight: 700,
              color: '#ffffff', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #7c5af6 0%, #6646e0 100%)',
              opacity: saving || deleting || !hasDirtyChanges ? 0.4 : 1, transition: 'opacity 150ms ease',
            }}
            onMouseEnter={e => { if (!saving && !deleting && hasDirtyChanges) (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = saving || deleting || !hasDirtyChanges ? '0.4' : '1'; }}
          >
            {saving ? 'Saving…' : selectedLog ? 'Update' : 'Save'}
          </button>

          {selectedLog && (
            <button
              onClick={() => deleteEntry(selectedLog.id, selectedLog.date)}
              disabled={deleting || saving}
              style={{
                padding: '10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                color: deleting ? 'rgba(255,255,255,0.2)' : 'rgba(239,68,68,0.55)',
                background: 'transparent',
                border: '1px solid rgba(239,68,68,0.15)',
                cursor: 'pointer', transition: 'all 150ms ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.35)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(239,68,68,0.55)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.15)'; }}
            >
              {deleting ? 'Deleting…' : 'Delete this entry'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="anim-fade-up-2" style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {(['insights', 'history'] as const).map(s => (
          <button key={s} onClick={() => setActiveSection(s)} style={{
            flex: 1, padding: '10px', borderRadius: 14,
            fontSize: 12, fontWeight: 700, letterSpacing: '0.02em',
            background: activeSection === s ? 'rgba(124,90,246,0.15)' : 'rgba(124,90,246,0.05)',
            border: activeSection === s ? '1px solid rgba(124,90,246,0.35)' : '1px solid rgba(124,90,246,0.1)',
            color: activeSection === s ? '#a78bf8' : 'rgba(255,255,255,0.38)',
            cursor: 'pointer', transition: 'all 150ms ease',
          }}>
            {s === 'insights' ? 'Insights' : 'History'}
          </button>
        ))}
      </div>

      <div className="anim-fade-up-3">
        {activeSection === 'insights' ? <InsightsSection logs={logs} /> : <HistorySection logs={logs} onDelete={deleteEntry} />}
      </div>
    </div>
  );
}
