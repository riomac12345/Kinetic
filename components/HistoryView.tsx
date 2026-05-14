'use client';

import { useState } from 'react';

type Session = { id: string; date: string; feel: number | null; notes: string | null; session_exercises: { id: string }[] };

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const FEEL_LABELS = ['', 'Tired', 'Okay', 'Good', 'Strong', 'On fire'];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isoDate(d: Date) { return d.toISOString().split('T')[0]; }

function formatWeekLabel(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${weekStart.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`;
}

function calcStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0;
  const dates = new Set(sessions.map(s => s.date));
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!dates.has(isoDate(cursor))) cursor = addDays(cursor, -1);
  while (dates.has(isoDate(cursor))) { streak++; cursor = addDays(cursor, -1); }
  return streak;
}

function calcThisWeek(sessions: Session[]): number {
  const today = new Date();
  const weekStart = getWeekStart(today);
  const weekEnd = addDays(weekStart, 6);
  return sessions.filter(s => {
    const d = new Date(s.date);
    return d >= weekStart && d <= weekEnd;
  }).length;
}

export default function HistoryView({ sessions }: { sessions: Session[] }) {
  const today = new Date();
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = getWeekStart(addDays(today, weekOffset * 7));
  const weekDays = [...Array(7)].map((_, i) => addDays(weekStart, i));
  const sessionMap = new Map(sessions.map(s => [s.date, s]));
  const isThisWeek = weekOffset === 0;
  const canGoForward = weekOffset < 0;
  const weekSessions = weekDays.filter(d => sessionMap.has(isoDate(d))).length;
  const streak = calcStreak(sessions);
  const thisWeek = calcThisWeek(sessions);

  return (
    <div style={{ minHeight: '100dvh', padding: '0 20px 48px' }}>
      <div className="anim-fade-up" style={{ paddingTop: 52, paddingBottom: 24, borderBottom: '1px solid rgba(240,112,48,0.1)', marginBottom: 24 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>History</p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(48px, 12vw, 72px)', fontWeight: 700,
          letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 0.95,
          background: 'linear-gradient(135deg, #16141F 0%, #F59050 60%, #F07030 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Your Sessions
        </h1>
      </div>

      {/* Stats strip */}
      {sessions.length > 0 && (
        <div className="anim-fade-up-1 glass-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', marginBottom: 16 }}>
          {[
            { value: streak, label: 'Day streak', highlight: streak >= 3 },
            { value: thisWeek, label: 'This week', highlight: false },
            { value: sessions.length, label: 'Total', highlight: false },
          ].map(({ value, label, highlight }, i) => (
            <div key={label} style={{ padding: '14px 0', textAlign: 'center', borderLeft: i > 0 ? '1px solid rgba(240,112,48,0.12)' : 'none' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: highlight ? 'var(--accent-light)' : 'var(--text)', lineHeight: 1, textShadow: highlight ? '0 0 16px rgba(240,112,48,0.5)' : 'none' }}>{value}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: 4 }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Week navigator */}
      <div className="anim-fade-up-1" style={{ border: '1px solid var(--border)', padding: '16px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            style={{ width: 32, height: 32, background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 140ms ease, color 140ms ease' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text)' }}>
              {isThisWeek ? 'This Week' : formatWeekLabel(weekStart)}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: weekSessions > 0 ? 'var(--accent)' : 'var(--text-3)', marginTop: 2 }}>
              {weekSessions > 0 ? `${weekSessions} session${weekSessions !== 1 ? 's' : ''}` : 'No sessions'}
            </p>
          </div>

          <button
            onClick={() => setWeekOffset(w => w + 1)}
            disabled={!canGoForward}
            style={{ width: 32, height: 32, background: 'transparent', border: '1px solid var(--border)', cursor: canGoForward ? 'pointer' : 'default', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: canGoForward ? 1 : 0.25, transition: 'border-color 140ms ease, color 140ms ease' }}
            onMouseEnter={e => { if (canGoForward) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; } }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {weekDays.map((day, i) => {
            const dateStr = isoDate(day);
            const hasSession = sessionMap.has(dateStr);
            const isToday = dateStr === isoDate(today);
            const isPast = day < today;

            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-3)' }}>{DAY_LETTERS[i]}</span>
                <div style={{
                  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                  background: hasSession ? 'var(--accent)' : isToday ? 'var(--surface-2)' : 'transparent',
                  border: `1px solid ${hasSession ? 'var(--accent)' : isToday ? 'var(--border-2)' : 'transparent'}`,
                  color: hasSession ? 'var(--bg)' : isPast ? 'var(--text-3)' : 'var(--text-3)',
                }}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Session list */}
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>
        {sessions.length > 0 ? `All Sessions (${sessions.length})` : 'Sessions'}
      </p>

      {sessions.length === 0 ? (
        <div className="anim-fade-up-2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
            </svg>
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 6 }}>No sessions yet</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>Log your first workout from the dashboard.</p>
        </div>
      ) : (
        sessions.map((s, i) => {
          const feelColor = s.feel
            ? s.feel >= 5 ? { border: 'rgba(240,112,48,0.6)', dot: 'var(--accent)', text: 'var(--accent-light)' }
            : s.feel >= 3 ? { border: 'rgba(255,107,53,0.5)', dot: 'var(--warm)', text: 'var(--warm)' }
            : { border: 'rgba(255,71,87,0.4)', dot: 'var(--danger)', text: 'var(--danger)' }
            : { border: 'rgba(240,112,48,0.15)', dot: 'var(--text-3)', text: 'var(--text-3)' };
          return (
            <div key={s.id} className="anim-fade-up" style={{ animationDelay: `${i * 0.04}s`, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{
                width: 38, height: 38, flexShrink: 0, borderRadius: 10,
                background: 'var(--surface-2)', border: `1px solid ${feelColor.border}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: feelColor.dot, boxShadow: s.feel && s.feel >= 4 ? `0 0 6px ${feelColor.dot}` : 'none' }} />
                {s.feel && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: feelColor.text, lineHeight: 1 }}>{s.feel}/5</p>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                  {new Date(s.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                  {s.session_exercises.length} exercise{s.session_exercises.length !== 1 ? 's' : ''}
                  {s.feel ? ` · ${FEEL_LABELS[s.feel]}` : ''}
                  {s.notes ? ` · ${s.notes.slice(0, 28)}` : ''}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
