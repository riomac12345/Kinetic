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

/* ── Rest timer ── */
function RestTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) { playBeep(); onDone(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onDone]);

  const pct = ((seconds - remaining) / seconds) * 100;
  const radius = 44;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 24px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      <p style={{
        fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 28,
      }}>Rest</p>

      {/* Circular progress */}
      <div style={{ position: 'relative', marginBottom: 28 }}>
        <svg width={100} height={100} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={50} cy={50} r={radius} fill="none" stroke="rgba(240,112,48,0.12)" strokeWidth={4} />
          <circle
            cx={50} cy={50} r={radius}
            fill="none"
            stroke="url(#restGrad)"
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
          <defs>
            <linearGradient id="restGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F07030" />
              <stop offset="100%" stopColor="#F59050" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 600,
            color: 'var(--text)', letterSpacing: '-0.04em', lineHeight: 1,
          }}>
            {remaining}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>sec</span>
        </div>
      </div>

      <button
        onClick={onDone}
        style={{
          padding: '10px 28px', borderRadius: 10,
          background: 'rgba(240,112,48,0.1)',
          border: '1px solid rgba(240,112,48,0.28)',
          color: 'var(--text-2)', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          transition: 'all 160ms ease',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,112,48,0.5)';
          (e.currentTarget as HTMLElement).style.color = 'var(--accent-light)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,112,48,0.28)';
          (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
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
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

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
    if (data) { onSessionCreated(data.id); return data.id; }
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

      let currentBest = 0, historicalBest = 0;
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
      await supabase.from('session_sets').insert(finalSets.map(s => ({ session_exercise_id: seData.id, ...s })));

      if (prHit) { setIsPR(true); setPrValue(currentBest); }
      setDone(true);
      onLogged?.(pe.exercises.id);
      setTimeout(onClose, prHit ? 3000 : 1000);
    } catch { setSaving(false); }
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

  function afterRest() { setResting(false); setCurrentSet(s => s + 1); }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '18px 12px', borderRadius: 12,
    background: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(240,112,48,0.22)',
    color: 'var(--text)', outline: 'none',
    fontFamily: 'var(--font-mono)', fontSize: 46, fontWeight: 500,
    letterSpacing: '-0.03em', textAlign: 'center' as const,
    transition: 'border-color 160ms ease, box-shadow 160ms ease',
  };

  /* ── Done state ── */
  if (done) {
    const prUnit = type === 'timed' ? 's' : type === 'weighted' ? 'kg' : ' reps';
    return (
      <div className="fixed inset-0 z-50 flex items-end">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
        <div
          className="anim-slide-up relative w-full flex flex-col items-center"
          style={{
            background: 'rgba(255, 255, 255, 0.98)',
            borderTop: '1px solid rgba(240,112,48,0.25)',
            borderRadius: '20px 20px 0 0',
            padding: '44px 24px',
            paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {isPR ? (
            <>
              {/* PR ambient glow */}
              <div style={{
                position: 'absolute',
                top: 0, left: '20%', right: '20%', height: 2,
                background: 'linear-gradient(90deg, transparent, #F07030, #F59050, transparent)',
                borderRadius: '0 0 4px 4px',
              }} />
              <div className="anim-pr-burst" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 16px', marginBottom: 20, borderRadius: 20,
                background: 'linear-gradient(135deg, rgba(240,112,48,0.25) 0%, rgba(168,124,255,0.15) 100%)',
                border: '1px solid rgba(240,112,48,0.5)',
                boxShadow: '0 0 30px rgba(240,112,48,0.4)',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="18 15 12 9 6 15"/>
                </svg>
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-light)',
                }}>
                  New Record
                </span>
              </div>
              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: 72, fontWeight: 600,
                letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6,
                background: 'linear-gradient(135deg, #16141F 0%, #F59050 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                {prValue}<span style={{ fontSize: 28 }}>{prUnit}</span>
              </p>
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.04em',
                textTransform: 'uppercase', color: 'var(--text-2)', marginTop: 10,
              }}>{pe.exercises.name}</p>
            </>
          ) : (
            <>
              <div style={{
                width: 56, height: 56, borderRadius: 14, marginBottom: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(240,112,48,0.25) 0%, rgba(168,124,255,0.15) 100%)',
                border: '1px solid rgba(240,112,48,0.4)',
                boxShadow: '0 0 24px rgba(240,112,48,0.3)',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700,
                letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 8,
              }}>
                {pe.exercises.name}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-3)' }}>
                {totalSets} sets logged
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ── Main sheet ── */
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div
        className="anim-slide-up relative w-full flex flex-col"
        style={{
          background: 'rgba(248, 250, 252, 0.97)',
          borderTop: '1px solid rgba(240,112,48,0.2)',
          borderRadius: '20px 20px 0 0',
          maxHeight: '90vh', overflow: 'hidden',
        }}
      >
        {/* Top glow line */}
        <div style={{
          position: 'absolute',
          top: 0, left: '25%', right: '25%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(240,112,48,0.6), transparent)',
        }} />

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 4px' }}>
          <div style={{ width: 38, height: 3, background: 'rgba(240,112,48,0.25)', borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{
          padding: '14px 24px 14px',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(240,112,48,0.1)',
        }}>
          <div>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
              letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text)', lineHeight: 1,
            }}>
              {pe.exercises.name}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>
                Set {currentSet} / {totalSets}
              </p>
              {currentPR !== null && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  color: 'var(--accent-light)',
                  padding: '2px 7px', borderRadius: 4,
                  background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
                }}>
                  PR {currentPR}{type === 'timed' ? 's' : type === 'weighted' ? 'kg' : ' reps'}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(240,112,48,0.08)',
              border: '1px solid rgba(240,112,48,0.2)',
              color: 'var(--text-2)', cursor: 'pointer',
              transition: 'all 160ms ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,112,48,0.4)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,112,48,0.2)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Set progress dots */}
        <div style={{ display: 'flex', gap: 4, padding: '12px 24px 4px' }}>
          {[...Array(totalSets)].map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i < loggedSets.length
                ? 'linear-gradient(90deg, #F07030, #F59050)'
                : i === currentSet - 1
                  ? 'rgba(240,112,48,0.4)'
                  : 'rgba(240,112,48,0.12)',
              boxShadow: i < loggedSets.length ? '0 0 6px rgba(240,112,48,0.4)' : 'none',
              transition: 'background 300ms ease, box-shadow 300ms ease',
            }} />
          ))}
        </div>

        {resting ? (
          <RestTimer seconds={pe.rest_timer_seconds} onDone={afterRest} />
        ) : (
          <div style={{ padding: '16px 24px', paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
            {/* PR alert */}
            {(() => {
              const inputVal = type === 'timed' ? (parseInt(holdTime) || 0) : type === 'weighted' ? (parseFloat(weight) || 0) : (parseInt(reps) || 0);
              const beatsPR = currentPR !== null && inputVal > currentPR && inputVal > 0;
              return beatsPR ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 16px', marginBottom: 18, borderRadius: 10,
                  background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
                  boxShadow: '0 0 16px rgba(240,112,48,0.2)',
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="18 15 12 9 6 15"/>
                  </svg>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-light)' }}>
                    New record — beats {currentPR}{type === 'timed' ? 's' : type === 'weighted' ? 'kg' : ' reps'}
                  </p>
                </div>
              ) : null;
            })()}

            {/* Input grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: type === 'weighted' ? '1fr 1fr' : '1fr',
              gap: 12, marginBottom: 24,
            }}>
              {type !== 'timed' && (
                <div>
                  <label style={{
                    display: 'block', fontFamily: 'var(--font-display)',
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'var(--text-3)', marginBottom: 8,
                  }}>Reps</label>
                  <input
                    type="number" inputMode="numeric" value={reps}
                    onChange={e => setReps(e.target.value)} style={inputStyle}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = 'rgba(240,112,48,0.55)';
                      e.currentTarget.style.boxShadow = '0 0 24px rgba(240,112,48,0.2)';
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = 'rgba(240,112,48,0.22)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              )}
              {type === 'timed' && (
                <div>
                  <label style={{
                    display: 'block', fontFamily: 'var(--font-display)',
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'var(--text-3)', marginBottom: 8,
                  }}>Hold (s)</label>
                  <input
                    type="number" inputMode="numeric" value={holdTime}
                    onChange={e => setHoldTime(e.target.value)} style={inputStyle}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = 'rgba(0,212,255,0.55)';
                      e.currentTarget.style.boxShadow = '0 0 24px rgba(0,212,255,0.15)';
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = 'rgba(240,112,48,0.22)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              )}
              {type === 'weighted' && (
                <div>
                  <label style={{
                    display: 'block', fontFamily: 'var(--font-display)',
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'var(--text-3)', marginBottom: 8,
                  }}>kg</label>
                  <input
                    type="number" inputMode="decimal" value={weight}
                    onChange={e => setWeight(e.target.value)} style={inputStyle}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = 'rgba(255,107,53,0.55)';
                      e.currentTarget.style.boxShadow = '0 0 24px rgba(255,107,53,0.15)';
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = 'rgba(240,112,48,0.22)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <button
              onClick={logSet}
              disabled={saving}
              style={{
                width: '100%', padding: '16px 24px', borderRadius: 12,
                background: saving
                  ? 'rgba(240,112,48,0.15)'
                  : 'linear-gradient(135deg, #F07030 0%, #F59050 100%)',
                border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: saving ? 'var(--text-3)' : 'white',
                boxShadow: saving ? 'none' : '0 0 28px rgba(240,112,48,0.45)',
                transition: 'all 160ms ease',
              }}
              onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
              onMouseLeave={e => { if (!saving) (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            >
              {saving ? 'Saving…' : currentSet >= totalSets ? 'Finish' : `Log set ${currentSet}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
