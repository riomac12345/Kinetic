'use client';

import { useState } from 'react';
import React from 'react';

type DataPoint = { date: string; value: number };
type ExerciseData = { id: string; name: string; type: string; data: DataPoint[]; pr: number };

function IcoClock() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IcoBarbell() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 5v14M18 5v14M4 7h4M4 17h4M16 7h4M16 17h4M8 12h8" />
    </svg>
  );
}
function IcoRepeat() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
function IcoTrophy() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
function IcoTrendUp() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
function IcoTrendDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
    </svg>
  );
}
function IcoSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function IcoChevron({ down }: { down: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: down ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function typeIcon(type: string) {
  if (type === 'timed') return <IcoClock />;
  if (type === 'weighted') return <IcoBarbell />;
  return <IcoRepeat />;
}

function typeLabel(type: string) {
  if (type === 'timed') return 'TIMED';
  if (type === 'weighted') return 'WEIGHTED';
  return 'REPS';
}

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  reps:     { bg: 'var(--accent-bg)',  border: 'var(--accent-border)',  text: 'var(--accent)' },
  weighted: { bg: 'var(--warm-bg)',    border: 'var(--warm-border)',    text: 'var(--warm)' },
  timed:    { bg: 'var(--blue-bg)',    border: 'var(--blue-border)',    text: 'var(--blue)' },
};

// ── Sparkline chart ───────────────────────────────────────────────────────────

function Sparkline({ data, color, height = 48 }: { data: DataPoint[]; color: string; height?: number }) {
  if (data.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>
          {data.length === 1 ? '1 session logged' : 'No data yet'}
        </span>
      </div>
    );
  }
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 100;
  const pad = 6;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - pad - ((d.value - min) / range) * (height - pad * 2);
    return `${x},${y}`;
  });
  const pathD = `M ${pts.join(' L ')}`;
  const areaD = `M ${pts[0]} L ${pts.join(' L ')} L ${w},${height} L 0,${height} Z`;
  const gradId = `g-${color.replace(/[^a-z0-9]/gi, '')}-${height}`;
  const last = pts[pts.length - 1].split(',');
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x={parseFloat(last[0]) - 2.5} y={parseFloat(last[1]) - 2.5} width="5" height="5" fill={color} />
    </svg>
  );
}

// ── Overall card ──────────────────────────────────────────────────────────────

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
  const isUp = delta > 0;

  return (
    <div className="anim-fade-up-1 glass-card" style={{ marginBottom: 16 }}>
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>
            Overall Strength
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{latest}%</span>
            {delta !== 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-mono)', fontSize: 11, color: isUp ? 'var(--accent)' : 'var(--danger)' }}>
                {isUp ? <IcoTrendUp /> : <IcoTrendDown />}
                {isUp ? '+' : ''}{delta}%
              </span>
            )}
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>avg vs PRs</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 2 }}>Peak</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{peak}%</p>
        </div>
      </div>
      <div style={{ padding: '12px 16px 0' }}>
        <Sparkline data={scores} color="var(--accent)" height={64} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid var(--border)' }}>
        {[
          { label: 'Sessions', value: scores.length },
          { label: 'Exercises', value: exercises.length },
          { label: 'PRs Set', value: exercises.filter(e => e.pr > 0).length },
        ].map(({ label, value }, i) => (
          <div key={label} style={{ padding: '12px 0', textAlign: 'center', borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{value}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: 2 }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
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
  const highFatigue = last >= 7;

  return (
    <div className="anim-fade-up-2 glass-card" style={{ marginBottom: 16 }}>
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>
            Avg Fatigue
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
              {avg}<span style={{ fontSize: 16, color: 'var(--text-3)', marginLeft: 2 }}>/10</span>
            </span>
            {delta !== 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-mono)', fontSize: 11, color: delta > 0 ? 'var(--danger)' : 'var(--accent)' }}>
                {delta > 0 ? <IcoTrendUp /> : <IcoTrendDown />}
                {delta > 0 ? '+' : ''}{delta}
              </span>
            )}
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>self-reported tiredness</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 2 }}>Last</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: highFatigue ? 'var(--danger)' : 'var(--warm)' }}>{last}/10</p>
        </div>
      </div>
      <div style={{ padding: '12px 16px 0' }}>
        <Sparkline data={chartData} color="var(--warm)" height={56} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid var(--border)' }}>
        {[
          { label: 'Ratings', value: data.length },
          { label: 'Avg', value: `${avg}/10` },
          { label: 'Last', value: `${last}/10` },
        ].map(({ label, value }, i) => (
          <div key={label} style={{ padding: '12px 0', textAlign: 'center', borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{value}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: 2 }}>{label}</p>
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
  const tc = TYPE_COLORS[ex.type] ?? TYPE_COLORS.reps;
  const chartColor = ex.type === 'timed' ? 'var(--blue)' : ex.type === 'weighted' ? 'var(--warm)' : 'var(--accent)';

  return (
    <div style={{
      border: `1px solid ${expanded ? 'rgba(240,112,48,0.35)' : 'rgba(240,112,48,0.15)'}`,
      background: 'rgba(255, 255, 255, 0.6)',
      backdropFilter: 'blur(16px)',
      borderRadius: 14,
      overflow: 'hidden',
      transition: 'border-color 160ms ease',
    }}>
      <button
        onClick={onToggle}
        style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', padding: '14px 16px' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 6px', background: tc.bg, border: `1px solid ${tc.border}`,
                fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase', color: tc.text,
              }}>
                {typeIcon(ex.type)} {typeLabel(ex.type)}
              </span>
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>{ex.name}</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
              {ex.data.length} session{ex.data.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>{lastValue}</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{unit}</p>
              {trending && diff !== 0 && (
                <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, fontFamily: 'var(--font-mono)', fontSize: 10, color: trending === 'up' ? 'var(--accent)' : 'var(--danger)', marginTop: 2 }}>
                  {trending === 'up' ? <IcoTrendUp /> : <IcoTrendDown />}
                  {diffPct ? `${diffPct}%` : ''}
                </p>
              )}
            </div>
            <span style={{ color: 'var(--text-3)' }}>
              <IcoChevron down={expanded} />
            </span>
          </div>
        </div>

        {/* PR bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', flexShrink: 0 }}>
            <IcoTrophy /> PR {ex.pr}{unit}
          </span>
          <div style={{ flex: 1, height: 2, background: 'var(--border)' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? 'var(--accent)' : chartColor, transition: 'width 500ms ease' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>{pct}%</span>
        </div>

        <Sparkline data={ex.data} color={chartColor} height={expanded ? 120 : 60} />
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <div style={{ padding: '12px 16px' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Session History</p>
            {[...ex.data].reverse().slice(0, 8).map((dp, i) => {
              const isPR = dp.value === ex.pr;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>
                    {new Date(dp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isPR && (
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', padding: '1px 5px' }}>PR</span>
                    )}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: isPR ? 'var(--accent)' : 'var(--text)' }}>
                      {dp.value}<span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 1 }}>{unit}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid var(--border)' }}>
            {[
              { label: 'Sessions', value: ex.data.length },
              { label: 'PR', value: `${ex.pr}${unit}` },
              { label: 'Latest', value: `${lastValue}${unit}` },
            ].map(({ label, value }, i) => (
              <div key={label} style={{ padding: '12px 0', textAlign: 'center', borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{value}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: 2 }}>{label}</p>
              </div>
            ))}
          </div>

          {ex.data.length >= 2 && (() => {
            const first = ex.data[0].value;
            const last2 = ex.data[ex.data.length - 1].value;
            const improvement = last2 - first;
            const improvePct = first > 0 ? Math.round((improvement / first) * 100) : 0;
            return (
              <div style={{ margin: '0 16px 16px', padding: '10px 14px', background: improvement >= 0 ? 'var(--accent-bg)' : 'var(--danger-bg)', border: `1px solid ${improvement >= 0 ? 'var(--accent-border)' : 'var(--danger-border)'}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: improvement >= 0 ? 'var(--accent)' : 'var(--danger)', display: 'flex' }}>
                  {improvement >= 0 ? <IcoTrendUp /> : <IcoTrendDown />}
                </span>
                <div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                    {improvement >= 0 ? '+' : ''}{improvement}{unit} since first session
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
                    {Math.abs(improvePct)}% {improvement >= 0 ? 'improvement' : 'decline'} overall
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function ProgressView({ exercises, fatigueData = [] }: { exercises: ExerciseData[]; fatigueData?: { date: string; score: number }[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? exercises.filter(ex => ex.name.toLowerCase().includes(search.toLowerCase()))
    : exercises;

  const totalSessions = exercises.reduce((s, e) => s + e.data.length, 0);

  return (
    <div style={{ minHeight: '100dvh', padding: '0 20px 48px' }}>
      <div className="anim-fade-up" style={{ paddingTop: 52, paddingBottom: 24, borderBottom: '1px solid rgba(240,112,48,0.1)', marginBottom: 24 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Progress</p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(48px, 12vw, 72px)', fontWeight: 700,
          letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 0.95,
          background: 'linear-gradient(135deg, #16141F 0%, #F59050 60%, #F07030 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Charts & PRs
        </h1>
      </div>

      <OverallCard exercises={exercises} />
      <FatigueCard data={fatigueData} />

      {exercises.length === 0 ? (
        <div className="anim-fade-up-2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 6 }}>No data yet</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>Log workouts to see your progress charts.</p>
        </div>
      ) : (
        <>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none', display: 'flex' }}>
              <IcoSearch />
            </span>
            <input
              type="text"
              placeholder="Search exercises…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                paddingLeft: 36, paddingRight: search ? 36 : 12, paddingTop: 10, paddingBottom: 10,
                background: 'var(--surface)', border: '1px solid var(--border)',
                fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)',
                outline: 'none', transition: 'border-color 150ms ease',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 2 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginBottom: 12 }}>
            {search ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}` : `${totalSessions} total sets logged`}
          </p>

          {filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>No exercises found</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>Try a different search term.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map((ex, i) => (
                <div key={ex.id} className="anim-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
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
