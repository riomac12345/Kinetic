'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

type Exercise = { id: string; name: string; type: string };
type PlanExercise = {
  id: string; sets: number; reps: number | null; weight: number | null;
  hold_time: number | null; rest_timer_seconds: number; exercises: Exercise;
};
type LoggedSet = { reps: number | null; weight: number | null; hold_time_seconds: number | null };

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch {}
}

function RestTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) { playBeep(); onDone(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onDone]);

  const pct = ((seconds - remaining) / seconds) * 100;
  const r = 44;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center py-10">
      <p className="text-[10px] font-bold tracking-widest uppercase mb-6" style={{ color: 'rgba(167,139,248,0.6)' }}>Rest</p>
      <div className="relative mb-6 anim-float" style={{ width: 120, height: 120 }}>
        <svg className="absolute inset-0 -rotate-90" width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(124,90,246,0.1)" strokeWidth="5" />
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke="#7c5af6" strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct / 100)}
            style={{
              transition: 'stroke-dashoffset 1s linear',
              filter: 'drop-shadow(0 0 10px rgba(124,90,246,0.7))',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold text-white leading-none" style={{ fontSize: '36px', letterSpacing: '-0.04em' }}>
            {remaining}
          </span>
          <span className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>sec</span>
        </div>
      </div>
      <button
        onClick={onDone}
        className="text-xs font-semibold px-5 py-2 rounded-full"
        style={{
          background: 'rgba(124,90,246,0.1)',
          border: '1px solid rgba(124,90,246,0.18)',
          color: 'rgba(255,255,255,0.55)',
          transition: 'color 150ms ease, background 150ms ease',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.color = '#ffffff';
          (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.18)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)';
          (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.1)';
        }}
      >
        Skip rest
      </button>
    </div>
  );
}

export default function LogSheet({
  pe, sessionId, onClose, onSessionCreated, onLogged, userId,
}: {
  pe: PlanExercise; sessionId: string | null; userId: string;
  onClose: () => void; onSessionCreated: (id: string) => void; onLogged?: (exerciseId: string) => void;
}) {
  const supabase = createClient();
  const type = pe.exercises.type;
  const totalSets = pe.sets;

  const [currentSet, setCurrentSet] = useState(1);
  const [resting, setResting] = useState(false);
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([]);
  const [reps, setReps] = useState(pe.reps?.toString() ?? '');
  const [weight, setWeight] = useState(pe.weight?.toString() ?? '');
  const [holdTime, setHoldTime] = useState(pe.hold_time?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [isPR, setIsPR] = useState(false);
  const [prValue, setPrValue] = useState<number | null>(null);
  const [currentPR, setCurrentPR] = useState<number | null>(null);


  useEffect(() => {
    supabase
      .from('session_sets')
      .select('reps, weight, hold_time_seconds, session_exercises!inner(exercise_id)')
      .eq('session_exercises.exercise_id', pe.exercises.id)
      .then(({ data }) => {
        if (!data?.length) return;
        const best = type === 'timed'
          ? Math.max(...data.map((s: { hold_time_seconds: number | null }) => s.hold_time_seconds ?? 0))
          : type === 'weighted'
            ? Math.max(...data.map((s: { weight: number | null }) => s.weight ?? 0))
            : Math.max(...data.map((s: { reps: number | null }) => s.reps ?? 0));
        if (best > 0) setCurrentPR(best);
      });
  }, []);

  async function ensureSession(): Promise<string> {
    if (sessionId) return sessionId;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('sessions')
      .insert({ user_id: userId, date: today })
      .select('id')
      .single();
    if (data) {
      onSessionCreated(data.id);
      return data.id;
    }
    throw new Error('Failed to create session');
  }

  const saveAndFinish = useCallback(async (finalSets: LoggedSet[]) => {
    setSaving(true);
    try {
      const sid = await ensureSession();

      const { data: historicalSets } = await supabase
        .from('session_sets')
        .select('reps, weight, hold_time_seconds, session_exercises!inner(exercise_id)')
        .eq('session_exercises.exercise_id', pe.exercises.id);

      let currentBest = 0;
      let historicalBest = 0;
      if (type === 'timed') {
        currentBest = Math.max(...finalSets.map(s => s.hold_time_seconds ?? 0));
        historicalBest = historicalSets ? Math.max(0, ...historicalSets.map((s: { hold_time_seconds: number | null }) => s.hold_time_seconds ?? 0)) : 0;
      } else if (type === 'weighted') {
        currentBest = Math.max(...finalSets.map(s => s.weight ?? 0));
        historicalBest = historicalSets ? Math.max(0, ...historicalSets.map((s: { weight: number | null }) => s.weight ?? 0)) : 0;
      } else {
        currentBest = Math.max(...finalSets.map(s => s.reps ?? 0));
        historicalBest = historicalSets ? Math.max(0, ...historicalSets.map((s: { reps: number | null }) => s.reps ?? 0)) : 0;
      }
      const prHit = currentBest > 0 && historicalBest > 0 && currentBest > historicalBest;

      const { data: seData } = await supabase
        .from('session_exercises')
        .insert({ session_id: sid, exercise_id: pe.exercises.id, type })
        .select('id')
        .single();
      if (!seData) throw new Error();
      await supabase.from('session_sets').insert(
        finalSets.map(s => ({ session_exercise_id: seData.id, ...s }))
      );

      if (prHit) { setIsPR(true); setPrValue(currentBest); }
      setDone(true);
      onLogged?.(pe.exercises.id);
      setTimeout(onClose, prHit ? 2500 : 900);
    } catch {
      setSaving(false);
    }
  }, []);

  async function logSet() {
    const set: LoggedSet = {
      reps: type !== 'timed' ? (parseInt(reps) || null) : null,
      weight: type === 'weighted' ? (parseFloat(weight) || null) : null,
      hold_time_seconds: type === 'timed' ? (parseInt(holdTime) || null) : null,
    };
    const newSets = [...loggedSets, set];
    setLoggedSets(newSets);

    if (currentSet >= totalSets) {
      await saveAndFinish(newSets);
    } else {
      setResting(true);
    }
  }

  function afterRest() {
    setResting(false);
    setCurrentSet(s => s + 1);
  }

  if (done) {
    const prUnit = type === 'timed' ? 's' : type === 'weighted' ? 'kg' : 'reps';
    return (
      <div className="fixed inset-0 z-50 flex items-end">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
        <div
          className="anim-slide-up relative w-full rounded-t-[2rem] flex flex-col items-center py-14"
          style={{
            background: isPR ? 'linear-gradient(160deg, #120f2a 0%, #0e0b24 100%)' : 'linear-gradient(160deg, #120f2a 0%, #0e0b24 100%)',
            border: isPR ? '1px solid rgba(251,191,36,0.25)' : '1px solid rgba(124,90,246,0.2)',
            boxShadow: isPR ? '0 -24px 80px rgba(251,191,36,0.1)' : '0 -24px 80px rgba(124,90,246,0.15)',
          }}
        >
          {isPR ? (
            <>
              <div
                className="anim-glow w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </div>
              <div className="px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase mb-4"
                style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>
                Personal Record
              </div>
              <p className="font-bold text-white mb-1" style={{ fontSize: '48px', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {prValue}<span className="text-2xl ml-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{prUnit}</span>
              </p>
              <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{pe.exercises.name}</p>
            </>
          ) : (
            <>
              <div
                className="anim-glow w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'rgba(124,90,246,0.12)', border: '1px solid rgba(124,90,246,0.25)' }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#a78bf8" strokeWidth="2" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-xl font-bold text-white mb-1" style={{ letterSpacing: '-0.03em' }}>
                {pe.exercises.name}
              </p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{totalSets} sets logged</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div
        className="anim-slide-up relative w-full rounded-t-[2rem] flex flex-col"
        style={{
          background: 'linear-gradient(160deg, #120f2a 0%, #0e0b24 100%)',
          border: '1px solid rgba(124,90,246,0.18)',
          boxShadow: '0 -8px 60px rgba(0,0,0,0.8), 0 -2px 0 rgba(124,90,246,0.2)',
          maxHeight: '88vh',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3.5 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(124,90,246,0.25)' }} />
        </div>

        {/* Header */}
        <div className="px-6 pt-4 pb-3 flex items-start justify-between">
          <div>
            <p className="text-xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>
              {pe.exercises.name}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs font-medium" style={{ color: 'rgba(167,139,248,0.6)' }}>
                Set {currentSet} of {totalSets}
              </p>
              {currentPR !== null && (
                <div className="flex items-center gap-1" style={{ color: '#fbbf24' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                    <path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                  </svg>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>
                    PR {currentPR}{type === 'timed' ? 's' : type === 'weighted' ? 'kg' : ' reps'}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(124,90,246,0.08)',
              border: '1px solid rgba(124,90,246,0.14)',
              color: 'rgba(255,255,255,0.5)',
              transition: 'background 150ms ease, color 150ms ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.16)';
              (e.currentTarget as HTMLElement).style.color = '#ffffff';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.08)';
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Progress bars */}
        <div className="flex items-center gap-1.5 px-6 pb-5">
          {[...Array(totalSets)].map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full flex-1"
              style={{
                background: i < loggedSets.length
                  ? '#7c5af6'
                  : i === currentSet - 1
                    ? 'rgba(124,90,246,0.35)'
                    : 'rgba(124,90,246,0.1)',
                transition: 'background 300ms ease',
                boxShadow: i < loggedSets.length ? '0 0 8px rgba(124,90,246,0.6)' : 'none',
              }}
            />
          ))}
        </div>

        {resting ? (
          <RestTimer seconds={pe.rest_timer_seconds} onDone={afterRest} />
        ) : (
          <div className="px-6 pb-10">
            {(() => {
              const inputVal = type === 'timed'
                ? (parseInt(holdTime) || 0)
                : type === 'weighted'
                  ? (parseFloat(weight) || 0)
                  : (parseInt(reps) || 0);
              const beatsPR = currentPR !== null && inputVal > currentPR && inputVal > 0;
              return beatsPR ? (
                <div className="mb-4 px-4 py-2.5 rounded-2xl flex items-center gap-2" style={{
                  background: 'rgba(251,191,36,0.08)',
                  border: '1px solid rgba(251,191,36,0.25)',
                  boxShadow: '0 0 20px rgba(251,191,36,0.1)',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                    <path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                  </svg>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>
                    New PR! Beats your {currentPR}{type === 'timed' ? 's' : type === 'weighted' ? 'kg' : ' reps'} record
                  </p>
                </div>
              ) : null;
            })()}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {type !== 'timed' && (
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(167,139,248,0.6)' }}>
                    Reps
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={reps}
                    onChange={e => setReps(e.target.value)}
                    className="w-full px-4 py-5 rounded-2xl font-bold text-white text-center outline-none"
                    style={{
                      fontSize: '40px', letterSpacing: '-0.04em',
                      background: 'rgba(124,90,246,0.07)',
                      border: '1px solid rgba(124,90,246,0.14)',
                      transition: 'border-color 150ms ease',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,90,246,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(124,90,246,0.14)')}
                  />
                </div>
              )}
              {type === 'timed' && (
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(167,139,248,0.6)' }}>
                    Hold (s)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={holdTime}
                    onChange={e => setHoldTime(e.target.value)}
                    className="w-full px-4 py-5 rounded-2xl font-bold text-white text-center outline-none"
                    style={{
                      fontSize: '40px', letterSpacing: '-0.04em',
                      background: 'rgba(124,90,246,0.07)',
                      border: '1px solid rgba(124,90,246,0.14)',
                      transition: 'border-color 150ms ease',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,90,246,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(124,90,246,0.14)')}
                  />
                </div>
              )}
              {type === 'weighted' && (
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(167,139,248,0.6)' }}>
                    kg
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    className="w-full px-4 py-5 rounded-2xl font-bold text-white text-center outline-none"
                    style={{
                      fontSize: '40px', letterSpacing: '-0.04em',
                      background: 'rgba(124,90,246,0.07)',
                      border: '1px solid rgba(124,90,246,0.14)',
                      transition: 'border-color 150ms ease',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,90,246,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(124,90,246,0.14)')}
                  />
                </div>
              )}
            </div>

            <button
              onClick={logSet}
              disabled={saving}
              className="anim-glow w-full py-5 rounded-full font-bold text-white disabled:opacity-50"
              style={{
                fontSize: '16px',
                background: 'linear-gradient(135deg, #7c5af6 0%, #6646e0 100%)',
                boxShadow: '0 0 36px rgba(124,90,246,0.45), 0 4px 20px rgba(0,0,0,0.6)',
                transition: 'opacity 150ms ease, transform 100ms cubic-bezier(0.34,1.56,0.64,1)',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
              onMouseLeave={e => { if (!saving) (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {saving ? 'Saving…' : currentSet >= totalSets ? 'Finish' : `Log set ${currentSet}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
