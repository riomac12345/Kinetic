'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const SKILL_ICONS: Record<string, React.ReactNode> = {
  muscle_up: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20V8M8 12l4-4 4 4" /><circle cx="12" cy="5" r="2" fill="currentColor" stroke="none" />
    </svg>
  ),
  front_lever: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="12" x2="22" y2="12" /><circle cx="19" cy="12" r="2.5" fill="currentColor" stroke="none" />
      <path d="M12 12V7M9 9h6" />
    </svg>
  ),
  planche: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h20M14 8l4 4-4 4" /><circle cx="7" cy="12" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  handstand: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="19" r="2" fill="currentColor" stroke="none" />
      <path d="M9 16l3-12 3 12M7 8h10" />
    </svg>
  ),
  l_sit: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v16M6 20h12" /><circle cx="6" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  ),
};

const SKILLS = [
  {
    id: 'muscle_up',
    name: 'Muscle-up',
    desc: 'Pull through the bar',
    stages: [
      'Can do 10+ clean pull-ups',
      'Explosive pull-ups above bar',
      'Bar muscle-up with kip',
      'Strict bar muscle-up',
      'Ring muscle-up',
      'Strict ring muscle-up',
    ],
  },
  {
    id: 'front_lever',
    name: 'Front Lever',
    desc: 'Horizontal hold on bar',
    stages: [
      'Tuck front lever (3s)',
      'Advanced tuck (3s)',
      'One-leg front lever (3s)',
      'Straddle front lever (3s)',
      'Full front lever (3s)',
      'Full front lever (10s)',
    ],
  },
  {
    id: 'planche',
    name: 'Planche',
    desc: 'Horizontal push hold',
    stages: [
      'Planche lean (3s)',
      'Tuck planche (3s)',
      'Advanced tuck planche (3s)',
      'Straddle planche (3s)',
      'Full planche (3s)',
      'Full planche (10s)',
    ],
  },
  {
    id: 'handstand',
    name: 'Handstand',
    desc: 'Balance inverted on hands',
    stages: [
      'Wall handstand (30s)',
      'Kick up to free HS',
      'Free handstand (5s)',
      'Free handstand (15s)',
      'Handstand walk (3 steps)',
      'Handstand push-up',
    ],
  },
  {
    id: 'l_sit',
    name: 'L-sit',
    desc: 'Legs parallel to ground',
    stages: [
      'Foot-supported L-sit',
      'One-leg L-sit (5s)',
      'L-sit on floor (5s)',
      'L-sit on parallettes (10s)',
      'L-sit on rings (10s)',
      'V-sit (5s)',
    ],
  },
];

const QUOTES = [
  { text: 'Strength is built one rep at a time.', author: 'Calisthenics principle' },
  { text: 'The body achieves what the mind believes.', author: 'Unknown' },
  { text: 'Every master was once a beginner.', author: 'Unknown' },
  { text: 'Progress, not perfection.', author: 'Unknown' },
  { text: 'Fall seven times, stand up eight.', author: 'Japanese proverb' },
];

function OverallRing({ pct }: { pct: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: 96, height: 96 }}>
      <svg className="-rotate-90" width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(124,90,246,0.1)" strokeWidth="6" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke="url(#ring-grad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct / 100)}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1)', filter: pct > 0 ? 'drop-shadow(0 0 10px rgba(124,90,246,0.7))' : 'none' }}
        />
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7c5af6" />
            <stop offset="100%" stopColor="#a78bf8" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold text-white leading-none" style={{ fontSize: 20, letterSpacing: '-0.04em' }}>{Math.round(pct)}%</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>overall</span>
      </div>
    </div>
  );
}

function SkillCard({
  skill, stage, onAdvance, onRevert,
}: {
  skill: typeof SKILLS[0]; stage: number; onAdvance: () => void; onRevert: () => void;
}) {
  const pct = (stage / skill.stages.length) * 100;
  const currentStage = skill.stages[stage] ?? 'Mastered';
  const nextStage = skill.stages[stage + 1];
  const isMax = stage >= skill.stages.length;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, rgba(20,16,50,0.9) 0%, rgba(14,11,36,0.95) 100%)',
        border: isMax ? '1px solid rgba(167,139,248,0.25)' : '1px solid rgba(124,90,246,0.13)',
        boxShadow: isMax ? '0 0 24px rgba(124,90,246,0.12)' : '0 2px 8px rgba(0,0,0,0.5)',
      }}
    >
      <div className="px-4 pt-4 pb-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span style={{ color: 'rgba(167,139,248,0.7)', display: 'flex', alignItems: 'center' }}>
              {SKILL_ICONS[skill.id]}
            </span>
            <div>
              <p className="text-base font-bold text-white" style={{ letterSpacing: '-0.02em' }}>{skill.name}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{skill.desc}</p>
            </div>
          </div>
          {isMax ? (
            <div
              className="px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(167,139,248,0.12)', color: '#a78bf8', border: '1px solid rgba(167,139,248,0.25)' }}
            >
              ✓ Mastered
            </div>
          ) : (
            <div style={{ textAlign: 'right' }}>
              <p className="text-xs font-bold" style={{ color: '#a78bf8' }}>Stage {stage}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>of {skill.stages.length}</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full mb-4" style={{ background: 'rgba(124,90,246,0.1)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #7c5af6, #a78bf8)',
              boxShadow: pct > 0 ? '0 0 8px rgba(124,90,246,0.5)' : 'none',
              transition: 'width 500ms cubic-bezier(0.34,1.56,0.64,1)',
            }}
          />
        </div>

        {/* Stage markers */}
        <div className="flex gap-1 mb-4">
          {skill.stages.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full"
              style={{
                background: i < stage
                  ? '#7c5af6'
                  : i === stage
                    ? 'rgba(124,90,246,0.4)'
                    : 'rgba(124,90,246,0.08)',
                transition: 'background 300ms ease',
              }}
            />
          ))}
        </div>

        {/* Current stage */}
        <div
          className="rounded-xl px-3 py-2.5 mb-3"
          style={{ background: 'rgba(124,90,246,0.07)', border: '1px solid rgba(124,90,246,0.12)' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(167,139,248,0.55)' }}>
            {isMax ? '✦ Completed' : 'Current milestone'}
          </p>
          <p className="text-sm text-white" style={{ letterSpacing: '-0.01em' }}>{currentStage}</p>
        </div>

        {/* Next stage */}
        {nextStage && (
          <div className="flex items-center gap-2 mb-4 px-1">
            <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <span style={{ color: 'rgba(255,255,255,0.38)' }}>Up next: </span>{nextStage}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {stage > 0 && (
            <button
              onClick={onRevert}
              className="flex-1 py-2.5 rounded-full text-xs font-semibold"
              style={{
                background: 'rgba(124,90,246,0.07)',
                border: '1px solid rgba(124,90,246,0.14)',
                color: 'rgba(255,255,255,0.45)',
                transition: 'color 150ms ease, background 150ms ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.07)'; }}
            >
              ← Go back
            </button>
          )}
          {!isMax && (
            <button
              onClick={onAdvance}
              className="flex-[2] py-2.5 rounded-full text-xs font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, #7c5af6 0%, #6646e0 100%)',
                boxShadow: '0 0 20px rgba(124,90,246,0.35)',
                transition: 'opacity 150ms ease, transform 100ms ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
              onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              Advance stage →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SkillsView({ userId, progressions }: { userId: string; progressions: { skill_name: string; current_stage: number }[] }) {
  const supabase = createClient();
  const router = useRouter();

  const stageMap = new Map(progressions.map(p => [p.skill_name, p.current_stage]));
  const [stages, setStages] = useState<Map<string, number>>(new Map(
    SKILLS.map(s => [s.id, stageMap.get(s.id) ?? 0])
  ));

  const totalStages = SKILLS.reduce((s, skill) => s + skill.stages.length, 0);
  const achievedStages = SKILLS.reduce((s, skill) => s + Math.min(stages.get(skill.id) ?? 0, skill.stages.length), 0);
  const overallPct = totalStages > 0 ? (achievedStages / totalStages) * 100 : 0;
  const masteredCount = SKILLS.filter(s => (stages.get(s.id) ?? 0) >= s.stages.length).length;

  const quote = QUOTES[Math.floor(achievedStages % QUOTES.length)];

  async function updateStage(skillId: string, newStage: number) {
    setStages(prev => new Map(prev).set(skillId, newStage));
    await supabase.from('skill_progressions').upsert({
      user_id: userId,
      skill_name: skillId,
      current_stage: newStage,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,skill_name' });
    router.refresh();
  }

  return (
    <div className="min-h-dvh px-4 pt-20 pb-10">
      {/* Header */}
      <div className="anim-fade-up mb-5">
        <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'rgba(167,139,248,0.65)' }}>Skills</p>
        <h1 className="text-2xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>Skill tracker</h1>
      </div>

      {/* Overall progress banner */}
      <div
        className="anim-fade-up-1 rounded-3xl p-4 mb-5"
        style={{
          background: 'linear-gradient(160deg, rgba(20,16,50,0.9) 0%, rgba(14,11,36,0.95) 100%)',
          border: '1px solid rgba(124,90,246,0.18)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 0 40px rgba(124,90,246,0.06)',
        }}
      >
        <div className="flex items-center gap-5">
          <OverallRing pct={overallPct} />
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>
              {masteredCount === SKILLS.length
                ? '✦ All skills mastered'
                : masteredCount > 0
                  ? `${masteredCount} skill${masteredCount > 1 ? 's' : ''} mastered`
                  : 'Keep training'}
            </p>
            <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.38)', lineHeight: 1.5 }}>
              {achievedStages} of {totalStages} total stages completed
            </p>
            {/* Mini skill bars */}
            <div className="flex flex-col gap-1.5">
              {SKILLS.map(skill => {
                const s = stages.get(skill.id) ?? 0;
                const p = (s / skill.stages.length) * 100;
                return (
                  <div key={skill.id} className="flex items-center gap-2">
                    <span style={{ width: 16, color: 'rgba(167,139,248,0.5)', display: 'flex', alignItems: 'center', flexShrink: 0, transform: 'scale(0.75)', transformOrigin: 'left center' }}>
                      {SKILL_ICONS[skill.id]}
                    </span>
                    <div style={{ flex: 1, height: 3, background: 'rgba(124,90,246,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${p}%`,
                        background: p >= 100 ? 'linear-gradient(90deg, #a78bf8, #c4b5fd)' : 'linear-gradient(90deg, #7c5af6, #a78bf8)',
                        borderRadius: 99, transition: 'width 600ms cubic-bezier(0.34,1.56,0.64,1)',
                      }} />
                    </div>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600, width: 20, textAlign: 'right' }}>{Math.round(p)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quote */}
      <div
        className="anim-fade-up-2 rounded-2xl px-4 py-3 mb-5"
        style={{ background: 'rgba(124,90,246,0.05)', border: '1px solid rgba(124,90,246,0.1)' }}
      >
        <p className="text-sm italic" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
          &ldquo;{quote.text}&rdquo;
        </p>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>— {quote.author}</p>
      </div>

      {/* Skill cards */}
      <p className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(167,139,248,0.45)' }}>Your skills</p>
      <div className="flex flex-col gap-3">
        {SKILLS.map((skill, i) => (
          <div key={skill.id} className="anim-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
            <SkillCard
              skill={skill}
              stage={stages.get(skill.id) ?? 0}
              onAdvance={() => {
                const cur = stages.get(skill.id) ?? 0;
                if (cur < skill.stages.length) updateStage(skill.id, cur + 1);
              }}
              onRevert={() => {
                const cur = stages.get(skill.id) ?? 0;
                if (cur > 0) updateStage(skill.id, cur - 1);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
