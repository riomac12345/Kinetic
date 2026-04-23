'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Level = 'beginner' | 'intermediate' | 'advanced';

const SKILLS = [
  { id: 'pull_ups',     label: 'Pull-ups' },
  { id: 'push_ups',     label: 'Push-ups' },
  { id: 'dips',         label: 'Dips' },
  { id: 'muscle_up',    label: 'Muscle-up' },
  { id: 'front_lever',  label: 'Front Lever' },
  { id: 'planche',      label: 'Planche' },
  { id: 'handstand',    label: 'Handstand' },
  { id: 'l_sit',        label: 'L-sit' },
];

const GOAL_SKILLS = [
  { id: 'muscle_up',   label: 'Muscle-up',   desc: 'Pull yourself above the bar' },
  { id: 'front_lever', label: 'Front Lever',  desc: 'Horizontal body hold on bar' },
  { id: 'planche',     label: 'Planche',      desc: 'Horizontal push hold' },
  { id: 'handstand',   label: 'Handstand',    desc: 'Balance inverted on hands' },
  { id: 'l_sit',       label: 'L-sit',        desc: 'Hold legs parallel to ground' },
];

function ProgressDots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: i === step ? 22 : 6,
            height: 6,
            background: i === step
              ? 'linear-gradient(90deg, #7c5af6, #a78bf8)'
              : 'rgba(124,90,246,0.2)',
            boxShadow: i === step ? '0 0 10px rgba(124,90,246,0.5)' : 'none',
            transition: 'width 300ms cubic-bezier(0.34,1.56,0.64,1), background 300ms ease',
          }}
        />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep]                   = useState(0);
  const [level, setLevel]                 = useState<Level | null>(null);
  const [currentSkills, setCurrentSkills] = useState<string[]>([]);
  const [goalSkill, setGoalSkill]         = useState<string | null>(null);
  const [saving, setSaving]               = useState(false);

  function toggleSkill(id: string) {
    setCurrentSkills(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }

  async function finish() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }

      await supabase.from('profiles').update({ level }).eq('id', user.id);

      if (currentSkills.length > 0) {
        await supabase.from('skill_progressions').upsert(
          currentSkills.map(skill_name => ({ user_id: user.id, skill_name, current_stage: 1 }))
        );
      }
      if (goalSkill) {
        await supabase.from('skill_progressions').upsert(
          [{ user_id: user.id, skill_name: goalSkill, current_stage: 0 }],
          { onConflict: 'user_id,skill_name', ignoreDuplicates: true }
        );
      }

      router.push('/dashboard');
    } catch {
      setSaving(false);
    }
  }

  const STEP_LABELS = ['Step 1 of 3', 'Step 2 of 3', 'Step 3 of 3'];

  return (
    <div className="min-h-dvh flex flex-col px-6 pt-16 pb-10 relative overflow-hidden">
      {/* Purple orb */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[340px]"
        style={{ background: 'radial-gradient(ellipse at 50% -5%, rgba(124,90,246,0.2) 0%, transparent 65%)', animation: 'orb-drift 8s ease-in-out infinite' }}
      />

      <div className="flex-1 relative">
        <ProgressDots step={step} />

        {/* Step 0 — Level */}
        {step === 0 && (
          <div className="anim-fade-up">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#a78bf8' }}>{STEP_LABELS[0]}</p>
            <h1 className="text-3xl font-bold text-white mb-2" style={{ letterSpacing: '-0.03em', lineHeight: '1.15' }}>
              What&apos;s your<br />current level?
            </h1>
            <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.42)', lineHeight: '1.7' }}>
              Be honest — we&apos;ll build the right plan for you.
            </p>

            <div className="flex flex-col gap-3">
              {([
                { id: 'beginner',     label: 'Beginner',      desc: 'New to calisthenics or under 1 year' },
                { id: 'intermediate', label: 'Intermediate',   desc: 'Solid pull-ups, dips, and push-ups' },
                { id: 'advanced',     label: 'Advanced',       desc: 'Working toward front lever or planche' },
              ] as { id: Level; label: string; desc: string }[]).map((opt, i) => (
                <button
                  key={opt.id}
                  onClick={() => setLevel(opt.id)}
                  className="anim-fade-up flex items-center gap-4 px-4 py-4 rounded-2xl text-left active:scale-[0.99]"
                  style={{
                    animationDelay: `${i * 0.07}s`,
                    background: level === opt.id ? 'rgba(124,90,246,0.12)' : 'rgba(124,90,246,0.04)',
                    border: level === opt.id ? '1px solid rgba(124,90,246,0.4)' : '1px solid rgba(124,90,246,0.1)',
                    boxShadow: level === opt.id ? '0 0 20px rgba(124,90,246,0.15)' : 'none',
                    transition: 'background 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{
                      border: level === opt.id ? '2px solid #7c5af6' : '2px solid rgba(124,90,246,0.25)',
                      background: level === opt.id ? '#7c5af6' : 'transparent',
                      boxShadow: level === opt.id ? '0 0 8px rgba(124,90,246,0.6)' : 'none',
                      transition: 'all 200ms cubic-bezier(0.34,1.56,0.64,1)',
                    }}
                  >
                    {level === opt.id && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white" style={{ letterSpacing: '-0.01em' }}>{opt.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1 — Current skills */}
        {step === 1 && (
          <div className="anim-fade-up">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#a78bf8' }}>{STEP_LABELS[1]}</p>
            <h1 className="text-3xl font-bold text-white mb-2" style={{ letterSpacing: '-0.03em', lineHeight: '1.15' }}>
              What can you<br />already do?
            </h1>
            <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.42)', lineHeight: '1.7' }}>
              Select everything you can do for clean reps.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {SKILLS.map((skill, i) => {
                const selected = currentSkills.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    onClick={() => toggleSkill(skill.id)}
                    className="anim-fade-up flex flex-col items-start px-4 py-3.5 rounded-2xl active:scale-[0.98]"
                    style={{
                      animationDelay: `${i * 0.05}s`,
                      background: selected ? 'rgba(124,90,246,0.14)' : 'rgba(124,90,246,0.04)',
                      border: selected ? '1px solid rgba(124,90,246,0.4)' : '1px solid rgba(124,90,246,0.1)',
                      boxShadow: selected ? '0 0 16px rgba(124,90,246,0.15)' : 'none',
                      transition: 'background 150ms ease, border-color 150ms ease',
                    }}
                  >
                    <span className="text-base font-bold mb-1" style={{ color: selected ? '#a78bf8' : 'rgba(255,255,255,0.3)' }}>
                      {selected ? '✓' : '+'}
                    </span>
                    <span className="text-sm font-medium text-white" style={{ letterSpacing: '-0.01em' }}>
                      {skill.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2 — Goal skill */}
        {step === 2 && (
          <div className="anim-fade-up">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#a78bf8' }}>{STEP_LABELS[2]}</p>
            <h1 className="text-3xl font-bold text-white mb-2" style={{ letterSpacing: '-0.03em', lineHeight: '1.15' }}>
              What&apos;s your<br />goal skill?
            </h1>
            <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.42)', lineHeight: '1.7' }}>
              Pick one skill to work toward. You can change this later.
            </p>

            <div className="flex flex-col gap-3">
              {GOAL_SKILLS.map((skill, i) => (
                <button
                  key={skill.id}
                  onClick={() => setGoalSkill(skill.id)}
                  className="anim-fade-up flex items-center gap-4 px-4 py-4 rounded-2xl text-left active:scale-[0.99]"
                  style={{
                    animationDelay: `${i * 0.07}s`,
                    background: goalSkill === skill.id ? 'rgba(124,90,246,0.12)' : 'rgba(124,90,246,0.04)',
                    border: goalSkill === skill.id ? '1px solid rgba(124,90,246,0.4)' : '1px solid rgba(124,90,246,0.1)',
                    boxShadow: goalSkill === skill.id ? '0 0 20px rgba(124,90,246,0.15)' : 'none',
                    transition: 'background 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{
                      border: goalSkill === skill.id ? '2px solid #7c5af6' : '2px solid rgba(124,90,246,0.25)',
                      background: goalSkill === skill.id ? '#7c5af6' : 'transparent',
                      boxShadow: goalSkill === skill.id ? '0 0 8px rgba(124,90,246,0.6)' : 'none',
                      transition: 'all 200ms cubic-bezier(0.34,1.56,0.64,1)',
                    }}
                  >
                    {goalSkill === skill.id && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white" style={{ letterSpacing: '-0.01em' }}>{skill.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{skill.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex-1 py-3.5 rounded-full text-sm font-semibold"
            style={{
              background: 'rgba(124,90,246,0.07)',
              border: '1px solid rgba(124,90,246,0.15)',
              color: 'rgba(255,255,255,0.5)',
              transition: 'background 150ms ease, color 150ms ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.14)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.07)'; }}
          >
            Back
          </button>
        )}
        <button
          onClick={() => step < 2 ? setStep(s => s + 1) : finish()}
          disabled={(step === 0 && !level) || (step === 2 && !goalSkill) || saving}
          className="anim-glow flex-[2] py-3.5 rounded-full text-sm font-semibold text-white active:scale-[0.98] disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, #7c5af6 0%, #6646e0 100%)',
            transition: 'opacity 150ms ease, transform 100ms ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          {saving ? 'Saving…' : step < 2 ? 'Continue' : 'Get started'}
        </button>
      </div>
    </div>
  );
}
