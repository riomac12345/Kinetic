'use client';

import { useState, useMemo, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

type NutritionData = {
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugars: number;
  confidence: string;
};

type WellnessLog = {
  id: string;
  date: string;
  food_breakfast: string | null;
  breakfast_nutrition: NutritionData | null;
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

// ── Insights ──────────────────────────────────────────────────────────────────

function InsightsSection({ logs }: { logs: WellnessLog[] }) {
  const logsWithNutrition = logs.filter(l => l.breakfast_nutrition != null);

  const avgCal = logsWithNutrition.length
    ? logsWithNutrition.reduce((s, l) => s + l.breakfast_nutrition!.calories, 0) / logsWithNutrition.length
    : null;
  const avgPro = logsWithNutrition.length
    ? logsWithNutrition.reduce((s, l) => s + l.breakfast_nutrition!.protein, 0) / logsWithNutrition.length
    : null;
  const totalCal7 = logsWithNutrition.slice(0, 7).reduce((s, l) => s + l.breakfast_nutrition!.calories, 0);

  if (!logsWithNutrition.length) {
    return (
      <div style={{ textAlign: 'center', padding: '56px 0' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 8 }}>No data yet</p>
        <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.65 }}>
          Log what you eat and estimate nutrition.<br />Patterns appear once you have a few entries.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border)' }}>
        <div style={{ padding: '20px 20px 20px 0', borderRight: '1px solid var(--border)' }}>
          <p style={{ ...LBL, marginBottom: 10 }}>Avg calories</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 500, color: 'var(--text)', letterSpacing: '-0.04em', lineHeight: 1 }}>
            {avgCal != null ? Math.round(avgCal) : '—'}
            <span style={{ fontSize: 13, color: 'var(--text-3)', marginLeft: 3 }}>kcal</span>
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
            {logsWithNutrition.length} days logged
          </p>
        </div>
        <div style={{ padding: '20px 0 20px 20px' }}>
          <p style={{ ...LBL, marginBottom: 10 }}>Avg protein</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 500, color: 'var(--text)', letterSpacing: '-0.04em', lineHeight: 1 }}>
            {avgPro != null ? Math.round(avgPro) : '—'}
            <span style={{ fontSize: 13, color: 'var(--text-3)', marginLeft: 3 }}>g</span>
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
            {logsWithNutrition.slice(0, 7).length}d total: {Math.round(totalCal7)} kcal
          </p>
        </div>
      </div>

      <div style={{ paddingTop: 18 }}>
        <p style={{ ...LBL, marginBottom: 14 }}>Recent entries</p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {logsWithNutrition.slice(0, 7).map((log, i) => {
            const n = log.breakfast_nutrition!;
            return (
              <div key={log.id} style={{ padding: '12px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>{fmtShort(log.date)}</p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>{Math.round(n.calories)} kcal</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--blue)' }}>{Math.round(n.protein)}g pro</span>
                  </div>
                </div>
                {log.food_breakfast && (
                  <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
                    {log.food_breakfast.length > 100 ? log.food_breakfast.slice(0, 100) + '…' : log.food_breakfast}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
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
        const n = log.breakfast_nutrition;
        const isDeleting = deletingId === log.id;
        return (
          <div key={log.id} style={{ padding: '14px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none', opacity: isDeleting ? 0.35 : 1, transition: 'opacity 140ms ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: n || log.food_breakfast ? 6 : 0 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{fmtShort(log.date)}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {n && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>{Math.round(n.calories)} kcal</span>
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
            {log.food_breakfast && (
              <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.55, marginBottom: n ? 6 : 0 }}>
                {log.food_breakfast.length > 130 ? log.food_breakfast.slice(0, 130) + '…' : log.food_breakfast}
              </p>
            )}
            {n && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { label: 'pro', value: `${Math.round(n.protein)}g`, color: 'var(--blue)' },
                  { label: 'carb', value: `${Math.round(n.carbs)}g`, color: 'var(--warm)' },
                  { label: 'fat', value: `${Math.round(n.fat)}g`, color: 'var(--text-2)' },
                  { label: 'sugar', value: `${Math.round(n.sugars ?? 0)}g`, color: 'var(--text-3)' },
                ].map(({ label, value, color }) => (
                  <span key={label} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color, padding: '1px 6px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    {value} <span style={{ opacity: 0.6 }}>{label}</span>
                  </span>
                ))}
              </div>
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
    setToday(t); setSelectedDate(t);
  }, []);

  const logMap = useMemo(() => {
    const m: Record<string, WellnessLog> = {};
    for (const l of logs) m[l.date] = l;
    return m;
  }, [logs]);

  const selectedLog = selectedDate ? (logMap[selectedDate] ?? null) : null;

  const [description, setDescription] = useState('');
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setDescription(selectedLog?.food_breakfast ?? '');
    setNutrition(selectedLog?.breakfast_nutrition ?? null);
    setSaved(false);
    setEstimateError(null);
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

  async function estimate() {
    if (!description.trim()) return;
    setEstimating(true);
    setEstimateError(null);
    try {
      const res = await fetch('/api/estimate-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      if (res.ok) {
        const data: NutritionData = await res.json();
        setNutrition(data);
      } else {
        const body = await res.json().catch(() => ({}));
        setEstimateError(body?.error ?? 'Estimation failed');
      }
    } catch {
      setEstimateError('Could not reach server');
    }
    setEstimating(false);
  }

  async function save() {
    if (!selectedDate) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('wellness_logs')
      .upsert({
        user_id: userId,
        date: selectedDate,
        food_breakfast: description.trim() || null,
        breakfast_nutrition: nutrition,
      }, { onConflict: 'user_id,date' })
      .select('id, date, food_breakfast, breakfast_nutrition')
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
      setDescription('');
      setNutrition(null);
    }
    setDeleting(false);
  }

  const hasDirty =
    description !== (selectedLog?.food_breakfast ?? '') ||
    JSON.stringify(nutrition) !== JSON.stringify(selectedLog?.breakfast_nutrition ?? null);

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
          <button onClick={prevDay} style={navBtn}
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

          <button onClick={nextDay} disabled={isToday}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
            {isToday ? "Today's Entry" : 'Past Entry'} · {selectedLog ? 'Edit' : 'New'}
          </p>
          {saved && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>Saved ✓</span>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Description */}
          <div>
            <label style={LBL}>What did you eat?</label>
            <textarea
              value={description}
              onChange={e => { setDescription(e.target.value); if (!e.target.value) setNutrition(null); }}
              placeholder="e.g. 2 scrambled eggs, a bowl of oats with banana, coffee with milk, chicken breast with rice and broccoli for lunch…"
              rows={4}
              style={{ ...INPUT, width: '100%', padding: '12px', fontSize: 13, lineHeight: 1.65, resize: 'none', borderRadius: 8 }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Estimate button */}
          <button
            onClick={estimate}
            disabled={estimating || !description.trim()}
            style={{
              padding: '12px', borderRadius: 10,
              background: estimating || !description.trim() ? 'var(--surface-2)' : 'rgba(240,112,48,0.12)',
              border: `1px solid ${estimating || !description.trim() ? 'var(--border)' : 'rgba(240,112,48,0.35)'}`,
              cursor: estimating || !description.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: estimating || !description.trim() ? 'var(--text-3)' : '#F07030',
              transition: 'all 140ms ease',
            }}
          >
            {estimating ? 'Estimating…' : 'Estimate nutrition with AI'}
          </button>

          {estimateError && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--danger)' }}>{estimateError}</p>
          )}

          {/* Nutrition result */}
          {nutrition && (
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                  Estimated nutrition
                </p>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: nutrition.confidence === 'high' ? 'var(--accent)' : nutrition.confidence === 'medium' ? 'var(--warm)' : 'var(--text-3)', padding: '2px 6px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  {nutrition.confidence} confidence
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { label: 'Calories', value: Math.round(nutrition.calories), unit: 'kcal', color: '#F07030' },
                  { label: 'Protein', value: Math.round(nutrition.protein), unit: 'g', color: 'var(--blue)' },
                  { label: 'Carbs', value: Math.round(nutrition.carbs), unit: 'g', color: 'var(--warm)' },
                  { label: 'Fat', value: Math.round(nutrition.fat), unit: 'g', color: 'var(--text-2)' },
                  { label: 'Sugars', value: Math.round(nutrition.sugars ?? 0), unit: 'g', color: 'var(--text-3)' },
                ].map(({ label, value, unit, color }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '10px 6px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: 3 }}>{unit} {label}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setNutrition(null)}
                style={{ alignSelf: 'flex-start', padding: '4px 10px', background: 'transparent', border: '1px solid var(--border)', fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', cursor: 'pointer' }}
              >
                Clear
              </button>
            </div>
          )}

          {/* Save */}
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
              style={{ padding: '10px', background: 'transparent', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', opacity: deleting ? 0.5 : 1, transition: 'opacity 120ms ease, border-color 140ms ease', borderRadius: 8 }}
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
