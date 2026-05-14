'use client';

import { useState, useRef } from 'react';
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
  id: string;
  date: string;
  food_breakfast: string | null;
  food_lunch: string | null;
  food_dinner: string | null;
  food_pre_climb: string | null;
  breakfast_nutrition: NutritionData | null;
  lunch_nutrition: NutritionData | null;
  dinner_nutrition: NutritionData | null;
  pre_climb_nutrition: NutritionData | null;
};

type Props = {
  userId: string;
  logs: WellnessLog[];
  calorieGoal: number;
  proteinGoal: number;
};

const MEAL_KEYS = [
  { key: 'breakfast_nutrition', label: 'Breakfast', foodKey: 'food_breakfast' },
  { key: 'lunch_nutrition',     label: 'Lunch',     foodKey: 'food_lunch' },
  { key: 'dinner_nutrition',    label: 'Dinner',    foodKey: 'food_dinner' },
  { key: 'pre_climb_nutrition', label: 'Pre-climb', foodKey: 'food_pre_climb' },
] as const;

function localDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function fmtLong(s: string) {
  return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
function fmtShort(s: string) {
  return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getDailyTotals(log: WellnessLog) {
  let cal = 0, pro = 0, carb = 0, fat = 0, count = 0;
  for (const { key } of MEAL_KEYS) {
    const n = log[key];
    if (n) { cal += n.calories; pro += n.protein; carb += n.carbs; fat += n.fat; count++; }
  }
  return { cal, pro, carb, fat, count };
}

function MacroBar({ label, value, max, color, unit = 'g' }: { label: string; value: number; max: number; color: string; unit?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const over = value > max;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: over ? 'var(--danger)' : 'var(--text)' }}>
          {Math.round(value)}<span style={{ fontSize: 9, color: 'var(--text-3)', marginLeft: 2 }}>{unit}</span>
          {max > 0 && <span style={{ fontSize: 9, color: 'var(--text-3)', marginLeft: 4 }}>/ {max}{unit}</span>}
        </span>
      </div>
      <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: over ? 'var(--danger)' : color, borderRadius: 3, transition: 'width 500ms ease' }} />
      </div>
    </div>
  );
}

function IconCamera() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}

function QuickLogButton({ userId, date, mealKey, foodKey, label, onSaved }: {
  userId: string;
  date: string;
  mealKey: typeof MEAL_KEYS[number]['key'];
  foodKey: typeof MEAL_KEYS[number]['foodKey'];
  label: string;
  onSaved: (log: WellnessLog) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const supabase = createClient();

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
          const nutrition: NutritionData = await res.json();
          const { data } = await supabase
            .from('wellness_logs')
            .upsert({
              user_id: userId, date,
              [foodKey]: nutrition.description,
              [mealKey]: nutrition,
            }, { onConflict: 'user_id,date' })
            .select().single();
          if (data) onSaved(data as WellnessLog);
        }
        setAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch { setAnalyzing(false); }
  }

  return (
    <>
      <button
        onClick={() => fileRef.current?.click()}
        disabled={analyzing}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 12px', background: 'var(--surface)',
          border: '1px solid var(--border)', cursor: analyzing ? 'default' : 'pointer',
          fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: analyzing ? 'var(--accent)' : 'var(--text-2)',
          transition: 'all 140ms ease',
        }}
        onMouseEnter={e => { if (!analyzing) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; } }}
        onMouseLeave={e => { if (!analyzing) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; } }}
      >
        <IconCamera />
        {analyzing ? 'Analyzing…' : label}
      </button>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
    </>
  );
}

export default function NutritionView({ userId, logs: initialLogs, calorieGoal, proteinGoal }: Props) {
  const [logs, setLogs] = useState<WellnessLog[]>(initialLogs);
  const [selectedDate, setSelectedDate] = useState(localDate(new Date()));
  const [editingGoals, setEditingGoals] = useState(false);
  const [calGoal, setCalGoal] = useState(calorieGoal);
  const [proGoal, setProGoal] = useState(proteinGoal);
  const [savingGoals, setSavingGoals] = useState(false);
  const supabase = createClient();

  const today = localDate(new Date());
  const isToday = selectedDate === today;

  const logMap: Record<string, WellnessLog> = {};
  for (const l of logs) logMap[l.date] = l;
  const selectedLog = logMap[selectedDate] ?? null;
  const totals = selectedLog ? getDailyTotals(selectedLog) : { cal: 0, pro: 0, carb: 0, fat: 0, count: 0 };

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

  function handleLogSaved(log: WellnessLog) {
    setLogs(prev => {
      const idx = prev.findIndex(l => l.date === log.date);
      if (idx >= 0) { const next = [...prev]; next[idx] = log; return next; }
      return [log, ...prev].sort((a, b) => b.date.localeCompare(a.date));
    });
  }

  async function saveGoals() {
    setSavingGoals(true);
    await supabase.from('profiles').update({ calorie_goal: calGoal, protein_goal: proGoal }).eq('id', userId);
    setSavingGoals(false);
    setEditingGoals(false);
  }

  // Last 7 days for the mini trend chart
  const last7 = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ds = localDate(d);
    const log = logMap[ds];
    const t = log ? getDailyTotals(log) : null;
    return { date: ds, cal: t?.cal ?? 0, pro: t?.pro ?? 0 };
  });
  const maxCal = Math.max(...last7.map(d => d.cal), calGoal);

  const navBtn: React.CSSProperties = {
    width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(240,112,48,0.07)', border: '1px solid rgba(240,112,48,0.2)',
    color: 'var(--text-2)', cursor: 'pointer', flexShrink: 0, transition: 'all 160ms ease',
  };

  return (
    <div style={{ minHeight: '100dvh', padding: '0 20px 48px' }}>

      {/* Header */}
      <div className="anim-fade-up" style={{ paddingTop: 52, paddingBottom: 20, borderBottom: '1px solid rgba(240,112,48,0.1)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Nutrition</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 10vw, 64px)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 0.95, marginBottom: 0, background: 'linear-gradient(135deg, #16141F 0%, #F59050 60%, #F07030 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          What you eat
        </h1>
      </div>

      {/* Goals strip */}
      <div className="anim-fade-up-1" style={{ paddingTop: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Daily Goals</p>
          <button
            onClick={() => setEditingGoals(v => !v)}
            style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {editingGoals ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editingGoals ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Calories</label>
              <input type="number" value={calGoal} onChange={e => setCalGoal(Number(e.target.value))}
                style={{ width: '100%', padding: '8px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--text)', outline: 'none' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Protein (g)</label>
              <input type="number" value={proGoal} onChange={e => setProGoal(Number(e.target.value))}
                style={{ width: '100%', padding: '8px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--text)', outline: 'none' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>
            <button
              onClick={saveGoals} disabled={savingGoals}
              style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', opacity: savingGoals ? 0.6 : 1 }}
            >
              {savingGoals ? '…' : 'Save'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Calorie goal', value: calGoal, unit: 'kcal' },
              { label: 'Protein goal', value: proGoal, unit: 'g/day' },
            ].map(({ label, value, unit }) => (
              <div key={label} style={{ padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4 }}>{label}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                  {value.toLocaleString()}<span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 3 }}>{unit}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Date navigator */}
      <div className="anim-fade-up-1" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={prevDay} style={navBtn}
          onMouseEnter={e => { (e.currentTarget.style.borderColor = 'var(--border-2)'); (e.currentTarget.style.color = 'var(--text)'); }}
          onMouseLeave={e => { (e.currentTarget.style.borderColor = 'var(--border)'); (e.currentTarget.style.color = 'var(--text-2)'); }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text)' }}>
            {isToday ? 'Today' : fmtShort(selectedDate)}
          </p>
        </div>
        <button onClick={nextDay} disabled={isToday} style={{ ...navBtn, opacity: isToday ? 0.25 : 1, cursor: isToday ? 'default' : 'pointer' }}
          onMouseEnter={e => { if (!isToday) { (e.currentTarget.style.borderColor = 'var(--border-2)'); (e.currentTarget.style.color = 'var(--text)'); } }}
          onMouseLeave={e => { (e.currentTarget.style.borderColor = 'var(--border)'); (e.currentTarget.style.color = 'var(--text-2)'); }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {/* Daily totals */}
      <div className="anim-fade-up-2 glass-card" style={{ padding: '18px 20px', marginBottom: 20 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 16 }}>
          {isToday ? "Today's" : fmtShort(selectedDate)} totals
          {totals.count === 0 && <span style={{ marginLeft: 8, color: 'var(--border-2)' }}>— no meals logged</span>}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <MacroBar label="Calories" value={totals.cal} max={calGoal} color="var(--accent)" unit="kcal" />
          <MacroBar label="Protein" value={totals.pro} max={proGoal} color="var(--blue)" />
          <MacroBar label="Carbs" value={totals.carb} max={0} color="var(--warm)" />
          <MacroBar label="Fat" value={totals.fat} max={0} color="var(--text-3)" />
        </div>

        {totals.count > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            {[
              { label: 'Cal', value: Math.round(totals.cal), unit: 'kcal', color: 'var(--accent)' },
              { label: 'Protein', value: Math.round(totals.pro), unit: 'g', color: 'var(--blue)' },
              { label: 'Carbs', value: Math.round(totals.carb), unit: 'g', color: 'var(--warm)' },
              { label: 'Fat', value: Math.round(totals.fat), unit: 'g', color: 'var(--text-2)' },
            ].map(({ label, value, unit, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: 3 }}>{label}<br />{unit}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meal breakdown */}
      <div className="anim-fade-up-2" style={{ marginBottom: 24 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12 }}>Meal Breakdown</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MEAL_KEYS.map(({ key, label, foodKey }) => {
            const nutrition = selectedLog?.[key] ?? null;
            const description = selectedLog?.[foodKey] ?? null;
            return (
              <div key={key} style={{ padding: '14px', background: 'var(--surface)', border: `1px solid ${nutrition ? 'var(--border-2)' : 'var(--border)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: nutrition ? 10 : 0 }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-2)' }}>{label}</p>
                    {description && <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{description}</p>}
                    {!description && <p style={{ fontSize: 11, color: 'var(--border-2)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>not logged</p>}
                  </div>
                  <QuickLogButton userId={userId} date={selectedDate} mealKey={key} foodKey={foodKey} label={description ? 'Update' : 'Photo'} onSaved={handleLogSaved} />
                </div>
                {nutrition && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {[
                      { label: 'Cal', value: Math.round(nutrition.calories), color: 'var(--accent)' },
                      { label: 'Pro', value: `${Math.round(nutrition.protein)}g`, color: 'var(--blue)' },
                      { label: 'Carb', value: `${Math.round(nutrition.carbs)}g`, color: 'var(--warm)' },
                      { label: 'Fat', value: `${Math.round(nutrition.fat)}g`, color: 'var(--text-2)' },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ textAlign: 'center', padding: '6px 4px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: 3 }}>{label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 7-day calorie trend */}
      <div className="anim-fade-up-3">
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12 }}>7-Day Calories</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, alignItems: 'flex-end', height: 72 }}>
          {last7.map(({ date: ds, cal }) => {
            const pct = maxCal > 0 ? (cal / maxCal) * 100 : 0;
            const isSelected = ds === selectedDate;
            const atGoal = cal >= calGoal * 0.9 && cal <= calGoal * 1.1;
            const over = cal > calGoal * 1.1;
            const barColor = over ? 'var(--danger)' : atGoal ? 'var(--accent)' : cal > 0 ? 'var(--border-2)' : 'var(--border)';
            return (
              <button
                key={ds}
                onClick={() => setSelectedDate(ds)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', height: '100%', justifyContent: 'flex-end' }}
              >
                <div style={{ width: '100%', height: `${Math.max(pct, cal > 0 ? 8 : 4)}%`, background: barColor, opacity: isSelected ? 1 : 0.6, transition: 'height 400ms ease, opacity 140ms ease', outline: isSelected ? `2px solid ${barColor}` : 'none', outlineOffset: 1 }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: isSelected ? 'var(--text)' : 'var(--text-2)' }}>
                  {new Date(ds + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
                </span>
              </button>
            );
          })}
        </div>
        {calGoal > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <div style={{ flex: 1, height: 1, borderTop: '1px dashed var(--border-2)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)' }}>goal {calGoal.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
