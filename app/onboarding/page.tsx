'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Level = 'beginner' | 'intermediate' | 'advanced';

const SKILLS = [
  { id: 'pull_ups',    label: 'Pull-ups' },
  { id: 'push_ups',    label: 'Push-ups' },
  { id: 'dips',        label: 'Dips' },
  { id: 'muscle_up',   label: 'Muscle-up' },
  { id: 'front_lever', label: 'Front Lever' },
  { id: 'planche',     label: 'Planche' },
  { id: 'handstand',   label: 'Handstand' },
  { id: 'l_sit',       label: 'L-sit' },
];

const GOAL_SKILLS = [
  { id: 'muscle_up',   label: 'Muscle-up',   desc: 'Pull yourself above the bar' },
  { id: 'front_lever', label: 'Front Lever',  desc: 'Horizontal body hold on bar' },
  { id: 'planche',     label: 'Planche',      desc: 'Horizontal push hold' },
  { id: 'handstand',   label: 'Handstand',    desc: 'Balance inverted on hands' },
  { id: 'l_sit',       label: 'L-sit',        desc: 'Hold legs parallel to ground' },
];

function StepIndicator({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 32 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          height: 3, borderRadius: 2,
          background: i <= step
            ? 'linear-gradient(90deg, #F07030, #F59050)'
            : 'rgba(240,112,48,0.15)',
          flex: i === step ? 2 : 1,
          boxShadow: i <= step ? '0 0 8px rgba(240,112,48,0.4)' : 'none',
          transition: 'flex 300ms ease, background 300ms ease',
        }} />
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
    setCurrentSkills(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
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

  const STEP_LABELS = ['1 / 3', '2 / 3', '3 / 3'];

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', padding: '48px 20px 32px' }}>
      <div style={{ flex: 1 }}>
        <StepIndicator step={step} />

        {step === 0 && (
          <div className="anim-fade-up">
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginBottom: 10 }}>{STEP_LABELS[0]}</p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 12vw, 60px)', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--text)', lineHeight: 0.95, marginBottom: 8 }}>
              Current<br />Level
            </h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)', marginBottom: 28, lineHeight: 1.6 }}>
              Be honest — we&apos;ll build the right plan for you.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {([
                { id: 'beginner',     label: 'Beginner',     desc: 'New to calisthenics or under 1 year' },
                { id: 'intermediate', label: 'Intermediate',  desc: 'Solid pull-ups, dips, and push-ups' },
                { id: 'advanced',     label: 'Advanced',      desc: 'Working toward front lever or planche' },
              ] as { id: Level; label: string; desc: string }[]).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setLevel(opt.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', textAlign: 'left',
                    background: level === opt.id ? 'rgba(240,112,48,0.15)' : 'rgba(255, 255, 255, 0.6)',
                    border: `1px solid ${level === opt.id ? 'rgba(240,112,48,0.5)' : 'rgba(240,112,48,0.18)'}`,
                    borderRadius: 12,
                    cursor: 'pointer', transition: 'all 160ms ease',
                    boxShadow: level === opt.id ? '0 0 16px rgba(240,112,48,0.2)' : 'none',
                  }}
                >
                  <div style={{
                    width: 18, height: 18, flexShrink: 0,
                    border: `2px solid ${level === opt.id ? 'rgba(240,112,48,0.8)' : 'rgba(240,112,48,0.25)'}`,
                    background: level === opt.id ? 'linear-gradient(135deg, #F07030, #F59050)' : 'transparent',
                    borderRadius: 5,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 150ms ease',
                  }}>
                    {level === opt.id && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 2 }}>{opt.label}</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="anim-fade-up">
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginBottom: 10 }}>{STEP_LABELS[1]}</p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 12vw, 60px)', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--text)', lineHeight: 0.95, marginBottom: 8 }}>
              What Can<br />You Do?
            </h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)', marginBottom: 28, lineHeight: 1.6 }}>
              Select everything you can do for clean reps.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {SKILLS.map(skill => {
                const selected = currentSkills.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    onClick={() => toggleSkill(skill.id)}
                    style={{
                      padding: '14px 16px', textAlign: 'left',
                      background: selected ? 'var(--accent-bg)' : 'var(--surface)',
                      border: `1px solid ${selected ? 'var(--accent-border)' : 'var(--border)'}`,
                      cursor: 'pointer', transition: 'background 150ms ease, border-color 150ms ease',
                    }}
                  >
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: selected ? 'var(--accent)' : 'var(--text-3)', marginBottom: 4 }}>
                      {selected ? '✓' : '+'}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{skill.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="anim-fade-up">
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginBottom: 10 }}>{STEP_LABELS[2]}</p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 12vw, 60px)', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--text)', lineHeight: 0.95, marginBottom: 8 }}>
              Goal<br />Skill
            </h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)', marginBottom: 28, lineHeight: 1.6 }}>
              Pick one skill to work toward. You can change this later.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {GOAL_SKILLS.map(skill => (
                <button
                  key={skill.id}
                  onClick={() => setGoalSkill(skill.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', textAlign: 'left',
                    background: goalSkill === skill.id ? 'rgba(240,112,48,0.15)' : 'rgba(255, 255, 255, 0.6)',
                    border: `1px solid ${goalSkill === skill.id ? 'rgba(240,112,48,0.5)' : 'rgba(240,112,48,0.18)'}`,
                    borderRadius: 12,
                    cursor: 'pointer', transition: 'all 160ms ease',
                    boxShadow: goalSkill === skill.id ? '0 0 16px rgba(240,112,48,0.2)' : 'none',
                  }}
                >
                  <div style={{
                    width: 18, height: 18, flexShrink: 0,
                    border: `2px solid ${goalSkill === skill.id ? 'rgba(240,112,48,0.8)' : 'rgba(240,112,48,0.25)'}`,
                    background: goalSkill === skill.id ? 'linear-gradient(135deg, #F07030, #F59050)' : 'transparent',
                    borderRadius: 5,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 150ms ease',
                  }}>
                    {goalSkill === skill.id && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 2 }}>{skill.label}</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>{skill.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ display: 'flex', gap: 8, marginTop: 32 }}>
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            style={{
              flex: 1, padding: '13px', borderRadius: 12,
              background: 'rgba(240,112,48,0.08)', border: '1px solid rgba(240,112,48,0.22)', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-2)',
              transition: 'all 160ms ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; }}
          >
            Back
          </button>
        )}
        <button
          onClick={() => step < 2 ? setStep(s => s + 1) : finish()}
          disabled={(step === 0 && !level) || (step === 2 && !goalSkill) || saving}
          style={{
            flex: 2, padding: '13px', borderRadius: 12,
            background: 'linear-gradient(135deg, #F07030 0%, #F59050 100%)',
            border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase', color: 'white',
            boxShadow: '0 0 20px rgba(240,112,48,0.4)',
            opacity: ((step === 0 && !level) || (step === 2 && !goalSkill) || saving) ? 0.4 : 1,
            transition: 'opacity 150ms ease',
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; if (!el.disabled) el.style.opacity = '0.82'; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; if (!el.disabled) el.style.opacity = '1'; }}
        >
          {saving ? 'Saving…' : step < 2 ? 'Continue' : 'Get Started'}
        </button>
      </div>
    </div>
  );
}
