'use client';

import { useState } from 'react';

type DataPoint = { date: string; value: number };
type ExerciseData = { id: string; name: string; type: string; data: DataPoint[]; pr: number };

// ── Icon helpers ──────────────────────────────────────────────────────────────

function IcoClock() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IcoBarbell() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 5v14M18 5v14M4 7h4M4 17h4M16 7h4M16 17h4M8 12h8" />
    </svg>
  );
}
function IcoRepeat() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
function IcoTrophy() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
function IcoTrendUp() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
function IcoTrendDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
    </svg>
  );
}
function IcoPin() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function IcoSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function typeIcon(type: string) {
  if (type === 'timed') return <IcoClock />;
  if (type === 'weighted') return <IcoBarbell />;
  return <IcoRepeat />;
}

// ── Charts ────────────────────────────────────────────────────────────────────

function MiniChart({ data, color = '#7c5af6', height = 52 }: { data: DataPoint[]; color?: string; height?: number }) {
  if (data.length < 2) {
    return (
      <div className="flex items-end justify-center" style={{ height }}>
        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
          {data.length === 1 ? '1 session' : 'No data yet'}
        </span>
      </div>
    );
  }
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 100;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - ((d.value - min) / range) * (height - 10) - 5;
    return `${x},${y}`;
  });
  const pathD = `M ${pts.join(' L ')}`;
  const areaD = `M ${pts[0]} L ${pts.join(' L ')} L ${w},${height} L 0,${height} Z`;
  const id = `grad-${color.replace('#', '')}-${height}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${id})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {(() => {
        const last = pts[pts.length - 1].split(',');
        return (
          <>
            <circle cx={last[0]} cy={last[1]} r="3.5" fill="#0e0b24" stroke={color} strokeWidth="2" />
            <circle cx={last[0]} cy={last[1]} r="1.5" fill={color} />
          </>
        );
      })()}
    </svg>
  );
}

// ── Overall performance score ─────────────────────────────────────────────────

function computeOverallScores(exercises: ExerciseData[]): DataPoint[] {
  const byDate = new Map<string, { total: number; count: number }>();
  for (const ex of exercises) {
    if (ex.pr <= 0) continue;
    for (const { date, value } of ex.data) {
      const norm = Math.min(value / ex.pr, 1);
      const entry = byDate.get(date) ?? { total: 0, count: 0 };
      entry.total += norm;
      entry.count += 1;
      byDate.set(date, entry);
    }
  }
  return Array.from(byDate.entries())
    .map(([date, { total, count }]) => ({ date, value: Math.round((total / count) * 100) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function OverallCard({ exercises }: { exercises: ExerciseData[] }) {
  const scores = computeOverallScores(exercises);
  if (scores.length < 2) return null;

  const latest = scores[scores.length - 1].value;
  const prev = scores[scores.length - 2].value;
  const peak = Math.max(...scores.map(s => s.value));
  const delta = latest - prev;
  const trend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

  return (
    <div
      className="anim-fade-up-1 rounded-3xl mb-5 overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, rgba(20,16,50,0.95) 0%, rgba(14,11,36,1) 100%)',
        border: '1px solid rgba(124,90,246,0.2)',
        boxShadow: '0 4px 32px rgba(0,0,0,0.5), 0 0 60px rgba(124,90,246,0.05)',
      }}
    >
      {/* Header row */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: 'rgba(167,139,248,0.5)' }}>
            Overall Strength
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-white" style={{ fontSize: 32, letterSpacing: '-0.04em', lineHeight: 1 }}>
              {latest}%
            </span>
            <span
              className="flex items-center gap-1 text-xs font-bold"
              style={{ color: trend === 'up' ? '#a78bf8' : trend === 'down' ? '#f87171' : 'rgba(255,255,255,0.35)' }}
            >
              {trend === 'up' ? <IcoTrendUp /> : trend === 'down' ? <IcoTrendDown /> : null}
              {delta !== 0 ? `${delta > 0 ? '+' : ''}${delta}% vs last` : 'no change'}
            </span>
          </div>
          <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.28)' }}>
            Avg performance vs your PRs across all exercises
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>Peak</p>
          <p className="font-bold" style={{ fontSize: 18, letterSpacing: '-0.03em', color: '#a78bf8' }}>{peak}%</p>
        </div>
      </div>

      {/* Chart */}
      <div className="px-5 pb-5">
        <MiniChart data={scores} height={72} />
      </div>

      {/* Footer stats */}
      <div
        className="grid grid-cols-3 divide-x px-0"
        style={{ borderTop: '1px solid rgba(124,90,246,0.08)', divideColor: 'rgba(124,90,246,0.08)' } as React.CSSProperties}
      >
        {[
          { label: 'Sessions', value: scores.length },
          { label: 'Exercises', value: exercises.length },
          { label: 'PRs set', value: exercises.filter(e => e.pr > 0).length },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center py-3">
            <span className="font-bold text-white" style={{ fontSize: 16, letterSpacing: '-0.03em' }}>{value}</span>
            <span className="text-[9px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Exercise card ─────────────────────────────────────────────────────────────

function ExerciseCard({ ex, expanded, onToggle }: { ex: ExerciseData; expanded: boolean; onToggle: () => void }) {
  const unit = ex.type === 'timed' ? 's' : ex.type === 'weighted' ? 'kg' : 'reps';
  const lastValue = ex.data[ex.data.length - 1]?.value ?? 0;
  const prevValue = ex.data[ex.data.length - 2]?.value;
  const diff = prevValue !== undefined ? lastValue - prevValue : null;
  const trending = diff !== null ? (diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat') : null;
  const diffPct = prevValue && prevValue > 0 && diff !== null
    ? Math.round(Math.abs(diff / prevValue) * 100) : null;
  const pct = ex.pr > 0 ? Math.min(Math.round((lastValue / ex.pr) * 100), 100) : 0;

  return (
    <button
      onClick={onToggle}
      className="w-full text-left rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, rgba(20,16,50,0.9) 0%, rgba(14,11,36,0.95) 100%)',
        border: expanded ? '1px solid rgba(124,90,246,0.28)' : '1px solid rgba(124,90,246,0.12)',
        boxShadow: expanded
          ? '0 4px 8px rgba(0,0,0,0.7), 0 16px 48px rgba(0,0,0,0.6), 0 0 30px rgba(124,90,246,0.1)'
          : '0 2px 4px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)',
        transition: 'box-shadow 300ms ease, border-color 300ms ease',
      }}
    >
      <div className="px-5 pt-5 pb-4">
        {/* Name + type + trend */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-0.5">
              <span style={{ color: 'rgba(167,139,248,0.6)', display: 'flex' }}>{typeIcon(ex.type)}</span>
              <p className="font-bold text-white" style={{ fontSize: '16px', letterSpacing: '-0.02em' }}>{ex.name}</p>
            </div>
            <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {ex.data.length} session{ex.data.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-baseline gap-1.5 justify-end">
              <span className="font-bold text-white" style={{ fontSize: '22px', letterSpacing: '-0.04em' }}>{lastValue}</span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{unit}</span>
              {trending && (
                <span className="flex items-center gap-0.5 text-xs font-bold" style={{ color: trending === 'up' ? '#a78bf8' : trending === 'down' ? '#f87171' : 'rgba(255,255,255,0.35)' }}>
                  {trending === 'up' ? <IcoTrendUp /> : trending === 'down' ? <IcoTrendDown /> : '→'}
                  {diffPct ? `${diffPct}%` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* PR bar */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5 flex-shrink-0" style={{ color: '#fbbf24' }}>
            <IcoTrophy />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24' }}>PR {ex.pr}{unit}</span>
          </div>
          <div style={{ flex: 1, height: 4, background: 'rgba(124,90,246,0.1)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: pct >= 100
                ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                : 'linear-gradient(90deg, #7c5af6, #a78bf8)',
              borderRadius: 99,
              boxShadow: pct >= 100 ? '0 0 8px rgba(251,191,36,0.5)' : '0 0 6px rgba(124,90,246,0.4)',
              transition: 'width 600ms cubic-bezier(0.34,1.56,0.64,1)',
            }} />
          </div>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, flexShrink: 0 }}>{pct}%</span>
        </div>

        <MiniChart data={ex.data} height={expanded ? 140 : 52} />
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid rgba(124,90,246,0.1)' }}>
          {/* All sessions table */}
          <div className="px-5 pb-2">
            <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(167,139,248,0.4)' }}>Session history</p>
            <div className="flex flex-col gap-1">
              {[...ex.data].reverse().slice(0, 8).map((dp, i) => {
                const isPR = dp.value === ex.pr;
                return (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: isPR ? 'rgba(251,191,36,0.06)' : 'rgba(124,90,246,0.04)', border: `1px solid ${isPR ? 'rgba(251,191,36,0.15)' : 'rgba(124,90,246,0.08)'}` }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                      {new Date(dp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-2">
                      {isPR && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.06em' }}>PR</span>
                      )}
                      <span style={{ fontSize: 13, fontWeight: 700, color: isPR ? '#fbbf24' : '#fff', letterSpacing: '-0.02em' }}>
                        {dp.value}<span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 2 }}>{unit}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 px-5 pb-5 mt-2">
            {[
              { label: 'Sessions', value: ex.data.length, icon: <IcoRepeat /> },
              { label: 'PR', value: `${ex.pr}${unit}`, icon: <IcoTrophy /> },
              { label: 'Latest', value: `${lastValue}${unit}`, icon: <IcoPin /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex flex-col items-center gap-1 py-3 rounded-2xl" style={{ background: 'rgba(124,90,246,0.08)', border: '1px solid rgba(124,90,246,0.14)' }}>
                <span style={{ color: 'rgba(167,139,248,0.6)', display: 'flex', marginBottom: 2 }}>{icon}</span>
                <span className="font-bold text-white" style={{ fontSize: '17px', letterSpacing: '-0.03em' }}>{value}</span>
                <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
              </div>
            ))}
          </div>

          {ex.data.length >= 2 && (() => {
            const first = ex.data[0].value;
            const last = ex.data[ex.data.length - 1].value;
            const improvement = last - first;
            const improvePct = first > 0 ? Math.round((improvement / first) * 100) : 0;
            return (
              <div className="mx-5 mb-5 px-4 py-3 rounded-2xl flex items-center gap-3" style={{
                background: improvement >= 0 ? 'rgba(124,90,246,0.07)' : 'rgba(239,68,68,0.05)',
                border: `1px solid ${improvement >= 0 ? 'rgba(124,90,246,0.14)' : 'rgba(239,68,68,0.14)'}`,
              }}>
                <span style={{ color: improvement >= 0 ? '#a78bf8' : '#f87171', display: 'flex' }}>
                  {improvement >= 0 ? <IcoTrendUp /> : <IcoTrendDown />}
                </span>
                <div>
                  <p className="text-xs font-semibold text-white">
                    {improvement >= 0 ? '+' : ''}{improvement}{unit} since first session
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    {Math.abs(improvePct)}% {improvement >= 0 ? 'improvement' : 'decline'} overall
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </button>
  );
}

// ── Fatigue card ──────────────────────────────────────────────────────────────

function FatigueCard({ data }: { data: { date: string; score: number }[] }) {
  if (data.length === 0) return null;
  const avg = Math.round((data.reduce((s, d) => s + d.score, 0) / data.length) * 10) / 10;
  const last = data[data.length - 1].score;
  const prev = data.length >= 2 ? data[data.length - 2].score : null;
  const delta = prev !== null ? last - prev : 0;
  const chartData: DataPoint[] = data.map(d => ({ date: d.date, value: d.score }));

  return (
    <div
      className="anim-fade-up-2 rounded-3xl mb-5 overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, rgba(20,16,50,0.95) 0%, rgba(14,11,36,1) 100%)',
        border: '1px solid rgba(124,90,246,0.2)',
        boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div className="px-5 pt-5 pb-3 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: 'rgba(167,139,248,0.5)' }}>
            Avg Fatigue
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-white" style={{ fontSize: 32, letterSpacing: '-0.04em', lineHeight: 1 }}>
              {avg}<span style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)', marginLeft: 3 }}>/10</span>
            </span>
            {delta !== 0 && (
              <span className="flex items-center gap-1 text-xs font-bold" style={{ color: delta > 0 ? '#f87171' : '#a78bf8' }}>
                {delta > 0 ? <IcoTrendUp /> : <IcoTrendDown />}
                {delta > 0 ? '+' : ''}{delta} vs last
              </span>
            )}
          </div>
          <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.28)' }}>
            Self-reported tiredness after sessions
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>Last</p>
          <p className="font-bold" style={{ fontSize: 18, letterSpacing: '-0.03em', color: last >= 8 ? '#f87171' : last >= 5 ? '#fb923c' : '#a78bf8' }}>
            {last}/10
          </p>
        </div>
      </div>
      <div className="px-5 pb-5">
        <MiniChart data={chartData} color="#f87171" height={60} />
      </div>
      <div className="grid grid-cols-3" style={{ borderTop: '1px solid rgba(124,90,246,0.08)' }}>
        {[
          { label: 'Ratings', value: data.length },
          { label: 'All-time avg', value: `${avg}/10` },
          { label: 'Last session', value: `${last}/10` },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center py-3">
            <span className="font-bold text-white" style={{ fontSize: 16, letterSpacing: '-0.03em' }}>{value}</span>
            <span className="text-[9px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

import React from 'react';

export default function ProgressView({ exercises, fatigueData = [] }: { exercises: ExerciseData[]; fatigueData?: { date: string; score: number }[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? exercises.filter(ex => ex.name.toLowerCase().includes(search.toLowerCase()))
    : exercises;

  const totalSessions = exercises.reduce((s, e) => s + e.data.length, 0);

  return (
    <div className="min-h-dvh px-4 pt-16 pb-12">
      <div className="anim-fade-up mb-5 pt-4">
        <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(167,139,248,0.65)' }}>Progress</p>
        <h1 className="font-bold text-white leading-none" style={{ fontSize: 'clamp(36px, 10vw, 48px)', letterSpacing: '-0.04em' }}>
          Charts & PRs
        </h1>
      </div>

      {/* Overall chart */}
      <OverallCard exercises={exercises} />
      <FatigueCard data={fatigueData} />

      {exercises.length === 0 ? (
        <div className="anim-fade-up-2 flex flex-col items-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 anim-float" style={{ background: 'rgba(124,90,246,0.08)', border: '1px solid rgba(124,90,246,0.14)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bf8" strokeWidth="1.75" strokeLinecap="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <p className="text-lg font-bold text-white mb-2" style={{ letterSpacing: '-0.03em' }}>No data yet</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Log workouts to see your progress charts.</p>
        </div>
      ) : (
        <>
          {/* Search bar */}
          <div className="relative mb-4">
            <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(167,139,248,0.45)', pointerEvents: 'none' }}>
              <IcoSearch />
            </div>
            <input
              type="text"
              placeholder="Search exercises…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm font-medium text-white outline-none"
              style={{
                background: 'rgba(124,90,246,0.06)',
                border: '1px solid rgba(124,90,246,0.14)',
                transition: 'border-color 150ms ease',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,90,246,0.4)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(124,90,246,0.14)')}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full"
                style={{ background: 'rgba(124,90,246,0.15)', color: 'rgba(255,255,255,0.5)' }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          <p className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(167,139,248,0.45)' }}>
            {search ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}` : `${totalSessions} total sets logged`}
          </p>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="text-sm font-semibold text-white mb-1">No exercises found</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Try a different search term.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((ex, i) => (
                <div key={ex.id} className="anim-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                  <ExerciseCard
                    ex={ex}
                    expanded={expanded === ex.id}
                    onToggle={() => setExpanded(expanded === ex.id ? null : ex.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
