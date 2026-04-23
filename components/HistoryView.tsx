'use client';

import { useState } from 'react';

type Session = { id: string; date: string; feel: number | null; notes: string | null; session_exercises: { id: string }[] };

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const FEEL_LABELS = ['', 'Tired', 'Okay', 'Good', 'Strong', 'On fire'];
const FEEL_COLOR = ['', '#6b7280', '#eab308', '#22c55e', '#818cf8', '#7c5af6'];

function FeelBars({ feel, size = 'sm' }: { feel: number; size?: 'sm' | 'xs' }) {
  const w = size === 'sm' ? 3 : 2;
  const heights = [3, 5, 7, 9, 11].map(h => size === 'xs' ? Math.round(h * 0.75) : h);
  const col = FEEL_COLOR[feel] ?? '#6b7280';
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{
          width: w, height: heights[i - 1], borderRadius: 1,
          background: i <= feel ? col : 'rgba(255,255,255,0.09)',
          boxShadow: i <= feel && feel === 5 ? '0 0 5px rgba(124,90,246,0.7)' : 'none',
        }} />
      ))}
    </div>
  );
}

function IcoLightning() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M13 2 4 13.5h7.5L8 22 20 10.5H12.5Z" />
    </svg>
  );
}

function IcoCalendar() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IcoLayers() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

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
  const today = new Date();
  let cursor = new Date(today);
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

  const stats = [
    { icon: <IcoLightning />, value: streak, label: 'day streak', highlight: streak >= 3 },
    { icon: <IcoCalendar />, value: thisWeek, label: 'this week', highlight: false },
    { icon: <IcoLayers />, value: sessions.length, label: 'total', highlight: false },
  ];

  return (
    <div className="min-h-dvh px-4 pt-16 pb-10">
      <div className="anim-fade-up mb-5 pt-4">
        <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(167,139,248,0.65)' }}>History</p>
        <h1 className="font-bold text-white leading-none" style={{ fontSize: 'clamp(36px, 10vw, 48px)', letterSpacing: '-0.04em' }}>
          Your sessions
        </h1>
      </div>

      {sessions.length > 0 && (
        <div
          className="anim-fade-up-1 grid grid-cols-3 gap-2 mb-5 rounded-2xl p-3"
          style={{
            background: 'linear-gradient(160deg, rgba(20,16,50,0.9) 0%, rgba(14,11,36,0.95) 100%)',
            border: '1px solid rgba(124,90,246,0.14)',
          }}
        >
          {stats.map(({ icon, value, label, highlight }) => (
            <div key={label} className="flex flex-col items-center py-1">
              <span style={{ width: 18, height: 18, marginBottom: 4, color: highlight ? '#a78bf8' : 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
              </span>
              <span className="font-bold leading-none" style={{ fontSize: 22, letterSpacing: '-0.04em', color: highlight ? '#a78bf8' : '#fff' }}>
                {value}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Week navigator */}
      <div
        className="anim-fade-up-1 rounded-3xl mb-5 p-5"
        style={{
          background: 'linear-gradient(160deg, rgba(20,16,50,0.9) 0%, rgba(14,11,36,0.95) 100%)',
          border: '1px solid rgba(124,90,246,0.14)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(124,90,246,0.08)', border: '1px solid rgba(124,90,246,0.14)', color: 'rgba(255,255,255,0.5)', transition: 'background 150ms ease, color 150ms ease' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.16)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.08)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>

          <div className="text-center">
            <p className="text-sm font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
              {isThisWeek ? 'This week' : formatWeekLabel(weekStart)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: weekSessions > 0 ? '#a78bf8' : 'rgba(255,255,255,0.3)' }}>
              {weekSessions > 0 ? `${weekSessions} session${weekSessions !== 1 ? 's' : ''}` : 'No sessions'}
            </p>
          </div>

          <button
            onClick={() => setWeekOffset(w => w + 1)}
            disabled={!canGoForward}
            className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-25"
            style={{ background: 'rgba(124,90,246,0.08)', border: '1px solid rgba(124,90,246,0.14)', color: 'rgba(255,255,255,0.5)', transition: 'background 150ms ease, color 150ms ease' }}
            onMouseEnter={e => { if (canGoForward) { (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.16)'; (e.currentTarget as HTMLElement).style.color = '#fff'; } }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.08)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, i) => {
            const dateStr = isoDate(day);
            const session = sessionMap.get(dateStr);
            const isToday = dateStr === isoDate(today);
            const isPast = day < today;
            const hasSession = !!session;

            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.25)' }}>{DAY_LETTERS[i]}</span>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: hasSession ? 'linear-gradient(135deg, #7c5af6 0%, #6646e0 100%)' : isToday ? 'rgba(124,90,246,0.15)' : isPast ? 'rgba(255,255,255,0.04)' : 'transparent',
                    color: hasSession ? '#fff' : isToday ? '#a78bf8' : isPast ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.12)',
                    border: isToday && !hasSession ? '1px solid rgba(124,90,246,0.3)' : 'none',
                    boxShadow: hasSession ? '0 0 14px rgba(124,90,246,0.5)' : 'none',
                    transition: 'all 200ms ease',
                  }}
                >
                  {day.getDate()}
                </div>
                {hasSession && session?.feel ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FeelBars feel={session.feel} size="xs" />
                  </div>
                ) : <div style={{ height: 10 }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Session list */}
      <p className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(167,139,248,0.45)' }}>
        {sessions.length > 0 ? `All sessions (${sessions.length})` : 'Sessions'}
      </p>
      <div className="flex flex-col gap-2.5">
        {sessions.length === 0 ? (
          <div className="anim-fade-up-2 flex flex-col items-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 anim-float" style={{ background: 'rgba(124,90,246,0.07)', border: '1px solid rgba(124,90,246,0.12)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,248,0.4)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
              </svg>
            </div>
            <p className="text-base font-bold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>No sessions yet</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Log your first workout from the dashboard.</p>
          </div>
        ) : (
          sessions.map((s, i) => (
            <div
              key={s.id}
              className="anim-fade-up flex items-center gap-4 px-4 py-4 rounded-2xl"
              style={{
                animationDelay: `${i * 0.06}s`,
                background: 'rgba(124,90,246,0.05)',
                border: '1px solid rgba(124,90,246,0.1)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
              }}
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(124,90,246,0.08)', border: '1px solid rgba(124,90,246,0.14)' }}
              >
                {s.feel ? (
                  <FeelBars feel={s.feel} />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,248,0.5)" strokeWidth="1.75" strokeLinecap="round">
                    <path d="M6 5v14M18 5v14M4 7h4M4 17h4M16 7h4M16 17h4M8 12h8" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white" style={{ fontSize: '15px', letterSpacing: '-0.02em' }}>
                  {new Date(s.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    {s.session_exercises.length} exercise{s.session_exercises.length !== 1 ? 's' : ''}
                  </p>
                  {s.feel ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(124,90,246,0.1)', color: '#a78bf8', border: '1px solid rgba(124,90,246,0.15)' }}>
                      {FEEL_LABELS[s.feel]}
                    </span>
                  ) : null}
                  {s.notes ? <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.28)' }}>{s.notes.slice(0, 28)}</p> : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
