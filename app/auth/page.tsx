'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Mode = 'login' | 'signup';

function IconGoogle({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = '/dashboard';
      } else {
        const trimmedUsername = username.trim().toLowerCase();
        if (!trimmedUsername) throw new Error('Username is required');
        if (!/^[a-z0-9_]+$/.test(trimmedUsername)) throw new Error('Username: letters, numbers, underscores only');
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { preferred_username: trimmedUsername },
          },
        });
        if (error) throw error;
        setSuccessMsg('Check your email to confirm your account.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setGoogleLoading(false);
    }
  }

  function switchMode(m: Mode) {
    setMode(m); setError(null); setSuccessMsg(null); setUsername('');
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px 20px',
    }}>
      <div className="anim-scale-in" style={{ width: '100%', maxWidth: 380 }}>

        {/* Wordmark */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #F07030 0%, #F59050 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(240, 112, 48, 0.5)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              background: 'linear-gradient(90deg, #16141F 0%, #F59050 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Kinetic</span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 12vw, 58px)', fontWeight: 700,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            lineHeight: 0.95, marginBottom: 12,
            background: 'linear-gradient(135deg, #16141F 0%, #F59050 60%, #F07030 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            {mode === 'login' ? <>Welcome<br />Back.</> : <>Create<br />Account.</>}
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
            {mode === 'login' ? 'Sign in to continue your training' : 'Start tracking your training progress'}
          </p>
        </div>

        {error && (
          <div className="anim-scale-in" style={{
            marginBottom: 16, padding: '10px 14px', borderRadius: 10,
            background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
            fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--danger)',
          }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div className="anim-scale-in" style={{
            marginBottom: 16, padding: '10px 14px', borderRadius: 10,
            background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
            fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-light)',
          }}>
            {successMsg}
          </div>
        )}

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading || loading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '12px', marginBottom: 14, borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.8)', border: '1px solid rgba(240,112,48,0.25)',
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-2)',
            cursor: 'pointer', opacity: (googleLoading || loading) ? 0.5 : 1,
            transition: 'all 160ms ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,112,48,0.5)';
            (e.currentTarget as HTMLElement).style.color = 'var(--text)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,112,48,0.25)';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
          }}
        >
          {googleLoading ? <Spinner /> : <IconGoogle />}
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(240,112,48,0.15)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(240,112,48,0.15)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{
            border: '1px solid rgba(240,112,48,0.22)',
            borderRadius: 12, overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.65)',
          }}>
            {[
              { id: 'email', label: 'Email', type: 'email', value: email, onChange: setEmail, placeholder: 'you@example.com', show: true },
              { id: 'username', label: 'Username', type: 'text', value: username, onChange: (v: string) => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, '')), placeholder: 'your_username', show: mode === 'signup' },
              { id: 'password', label: 'Password', type: 'password', value: password, onChange: setPassword, placeholder: '••••••••', show: true },
            ].filter(f => f.show).map((f, idx, arr) => (
              <div key={f.id} style={{
                padding: '12px 16px',
                borderBottom: idx < arr.length - 1 ? '1px solid rgba(240,112,48,0.15)' : 'none',
              }}>
                <label style={{
                  display: 'block', fontFamily: 'var(--font-display)',
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--text-3)', marginBottom: 5,
                }} htmlFor={f.id}>
                  {f.label}
                </label>
                <input
                  id={f.id} type={f.type} value={f.value}
                  onChange={e => f.onChange(e.target.value)}
                  placeholder={f.placeholder} required
                  minLength={f.id === 'password' ? 6 : undefined}
                  style={{
                    width: '100%', background: 'transparent', border: 'none',
                    fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text)', outline: 'none',
                  }}
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            style={{
              width: '100%', padding: '14px', marginTop: 12, borderRadius: 12,
              background: loading || googleLoading
                ? 'rgba(240,112,48,0.2)'
                : 'linear-gradient(135deg, #F07030 0%, #F59050 100%)',
              border: 'none', cursor: loading || googleLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: loading || googleLoading ? 'var(--text-3)' : 'white',
              boxShadow: loading || googleLoading ? 'none' : '0 0 24px rgba(240,112,48,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: (loading || googleLoading) ? 0.6 : 1,
              transition: 'opacity 150ms ease',
            }}
            onMouseEnter={e => { if (!loading && !googleLoading) (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { if (!loading && !googleLoading) (e.currentTarget as HTMLElement).style.opacity = '1'; }}
          >
            {loading && <Spinner />}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginTop: 20, lineHeight: 1.7 }}>
          {mode === 'login' ? (
            <>No account?{' '}
              <button onClick={() => switchMode('signup')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-light)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, padding: 0 }}>
                Sign up
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-light)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, padding: 0 }}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
