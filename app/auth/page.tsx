'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Mode = 'login' | 'signup';

function IconGoogle({ size = 18 }: { size?: number }) {
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
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        router.push('/dashboard');
      } else {
        const trimmedUsername = username.trim().toLowerCase();
        if (!trimmedUsername) throw new Error('Username is required');
        if (!/^[a-z0-9_]+$/.test(trimmedUsername)) throw new Error('Username can only contain letters, numbers, and underscores');
        const { error } = await supabase.auth.signUp({
          email,
          password,
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
    setMode(m);
    setError(null);
    setSuccessMsg(null);
    setUsername('');
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: '#07051a' }}
    >
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(100,60,220,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(100,60,220,0.055) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      {/* Purple orb */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2"
        style={{
          width: '700px', height: '500px',
          background: 'radial-gradient(ellipse at 50% -5%, rgba(124,90,246,0.22) 0%, transparent 65%)',
          animation: 'orb-drift 8s ease-in-out infinite',
        }}
      />

      {/* Card */}
      <div
        className="anim-scale-in relative w-full max-w-[360px]"
        style={{
          background: 'linear-gradient(160deg, rgba(20,16,50,0.95) 0%, rgba(14,11,36,0.98) 100%)',
          border: '1px solid rgba(124,90,246,0.18)',
          borderRadius: '1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.8), 0 16px 60px rgba(0,0,0,0.7), 0 0 80px rgba(124,90,246,0.08)',
          padding: '2rem',
        }}
      >
        {/* Logo */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-8">
            <div
              className="anim-float w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(124,90,246,0.3) 0%, rgba(90,60,200,0.2) 100%)',
                border: '1px solid rgba(124,90,246,0.35)',
                boxShadow: '0 0 16px rgba(124,90,246,0.3)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span className="text-base font-bold text-white" style={{ letterSpacing: '-0.03em' }}>Kinetic</span>
          </div>

          <h1
            className="font-bold text-white"
            style={{ fontSize: 'clamp(32px, 10vw, 40px)', letterSpacing: '-0.04em', lineHeight: '1.1' }}
          >
            {mode === 'login' ? <>Welcome<br />back.</> : <>Create<br />account.</>}
          </h1>
          <p className="text-sm mt-3" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: '1.65' }}>
            {mode === 'login'
              ? 'Sign in to continue your training'
              : 'Start tracking your calisthenics progress'}
          </p>
        </div>

        {error && (
          <div className="anim-scale-in mb-5 px-4 py-3 rounded-2xl text-sm"
            style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171' }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div className="anim-scale-in mb-5 px-4 py-3 rounded-2xl text-sm"
            style={{ background: 'rgba(124,90,246,0.1)', border: '1px solid rgba(124,90,246,0.25)', color: '#a78bf8' }}>
            {successMsg}
          </div>
        )}

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-full text-sm font-semibold text-white mb-5 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
            transition: 'background 150ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
        >
          {googleLoading ? <Spinner /> : <IconGoogle />}
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: 'rgba(124,90,246,0.15)' }} />
          <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>or</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(124,90,246,0.15)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
          {[
            { id: 'email', label: 'Email', type: 'email', value: email, onChange: setEmail, placeholder: 'you@example.com', show: true },
            { id: 'username', label: 'Username', type: 'text', value: username, onChange: (v: string) => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, '')), placeholder: 'your_username', show: mode === 'signup' },
            { id: 'password', label: 'Password', type: 'password', value: password, onChange: setPassword, placeholder: '••••••••', show: true },
          ].filter(f => f.show).map(f => (
            <div key={f.id}>
              <label
                className="block text-[11px] font-semibold tracking-wider uppercase mb-2"
                style={{ color: 'rgba(167,139,248,0.6)' }}
                htmlFor={f.id}
              >
                {f.label}
              </label>
              <input
                id={f.id}
                type={f.type}
                value={f.value}
                onChange={e => f.onChange(e.target.value)}
                placeholder={f.placeholder}
                required
                minLength={f.id === 'password' ? 6 : undefined}
                className="w-full px-4 py-3.5 rounded-2xl text-sm text-white outline-none"
                style={{
                  background: 'rgba(124,90,246,0.07)',
                  border: '1px solid rgba(124,90,246,0.16)',
                  transition: 'border-color 150ms ease',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,90,246,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(124,90,246,0.16)')}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="anim-glow w-full flex items-center justify-center gap-2 py-4 rounded-full text-sm font-bold text-white mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #7c5af6 0%, #6646e0 100%)',
              transition: 'opacity 150ms ease, transform 100ms cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onMouseEnter={e => { if (!loading && !googleLoading) (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { if (!loading && !googleLoading) (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {loading ? <Spinner /> : null}
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {/* Mode toggle */}
        <p className="text-center text-sm mt-6" style={{ color: 'rgba(255,255,255,0.38)', lineHeight: '1.7' }}>
          {mode === 'login' ? (
            <>
              No account?{' '}
              <button
                onClick={() => switchMode('signup')}
                className="font-semibold"
                style={{ color: '#a78bf8', transition: 'color 150ms ease' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#a78bf8')}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => switchMode('login')}
                className="font-semibold"
                style={{ color: '#a78bf8', transition: 'color 150ms ease' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#a78bf8')}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
