'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Profile = { id: string; username: string; name: string | null; bio: string | null; level: string | null };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{
        fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)',
        marginBottom: 8, paddingLeft: 2,
      }}>{title}</p>
      <div style={{
        border: '1px solid rgba(240,112,48,0.18)',
        background: 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 14,
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, readOnly }: {
  label: string; value: string; onChange?: (v: string) => void; type?: string; placeholder?: string; readOnly?: boolean;
}) {
  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(240,112,48,0.12)' }}>
      <label style={{
        display: 'block', fontFamily: 'var(--font-display)',
        fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--text-3)', marginBottom: 5,
      }}>{label}</label>
      <input
        type={type} value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{
          width: '100%', background: 'transparent', border: 'none',
          fontSize: 14, fontWeight: 500, color: readOnly ? 'var(--text-3)' : 'var(--text)',
          outline: 'none',
        }}
      />
    </div>
  );
}

export default function SettingsView({ profile, userId, email }: { profile: Profile | null; userId: string; email: string }) {
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState(profile?.name ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const isSuccess = msg === 'Saved!' || msg === 'Password updated!';

  async function saveProfile() {
    setSaving(true); setMsg(null);
    const { error } = await supabase.from('profiles').update({ name, username, bio }).eq('id', userId);
    setSaving(false);
    setMsg(error ? error.message : 'Saved!');
    setTimeout(() => setMsg(null), 2500);
    router.refresh();
  }

  async function changePassword() {
    if (!newPassword || newPassword.length < 6) { setMsg('Password must be 6+ characters'); return; }
    setPwSaving(true); setMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwSaving(false);
    setMsg(error ? error.message : 'Password updated!');
    setNewPassword('');
    setTimeout(() => setMsg(null), 2500);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/auth');
  }

  async function deleteAccount() {
    await supabase.auth.signOut();
    router.push('/auth');
  }

  const btnPrimary: React.CSSProperties = {
    width: '100%', padding: '13px', borderRadius: 12,
    background: 'linear-gradient(135deg, #F07030 0%, #F59050 100%)',
    border: 'none', cursor: 'pointer',
    fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
    letterSpacing: '0.1em', textTransform: 'uppercase', color: 'white',
    boxShadow: '0 0 20px rgba(240,112,48,0.35)',
    transition: 'opacity 120ms ease', marginBottom: 20,
  };

  const btnSecondary: React.CSSProperties = {
    width: '100%', padding: '13px', borderRadius: 12,
    background: 'rgba(240,112,48,0.08)', border: '1px solid rgba(240,112,48,0.22)', cursor: 'pointer',
    fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
    letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-2)',
    transition: 'all 160ms ease', marginBottom: 20,
  };

  return (
    <div style={{ minHeight: '100dvh', padding: '0 20px 48px' }}>
      <div className="anim-fade-up" style={{ paddingTop: 52, paddingBottom: 24, borderBottom: '1px solid rgba(240,112,48,0.1)', marginBottom: 24 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Settings</p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(48px, 12vw, 72px)', fontWeight: 700,
          letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 0.95,
          background: 'linear-gradient(135deg, #16141F 0%, #F59050 60%, #F07030 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Account
        </h1>
      </div>

      {msg && (
        <div
          className="anim-scale-in"
          style={{
            marginBottom: 20, padding: '12px 16px',
            background: isSuccess ? 'var(--accent-bg)' : 'var(--danger-bg)',
            border: `1px solid ${isSuccess ? 'var(--accent-border)' : 'var(--danger-border)'}`,
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: isSuccess ? 'var(--accent)' : 'var(--danger)',
          }}
        >
          {msg}
        </div>
      )}

      <div className="anim-fade-up-1">
        <Section title="Profile">
          <Field label="Name" value={name} onChange={setName} placeholder="Your name" />
          <Field label="Username" value={username} onChange={setUsername} placeholder="username" />
          <Field label="Bio" value={bio} onChange={setBio} placeholder="A short bio" />
          <Field label="Email" value={email} readOnly />
        </Section>

        <button
          onClick={saveProfile}
          disabled={saving}
          style={{ ...btnPrimary, opacity: saving ? 0.4 : 1 }}
          onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLElement).style.opacity = '0.82'; }}
          onMouseLeave={e => { if (!saving) (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <div className="anim-fade-up-2">
        <Section title="Security">
          <Field label="New password" value={newPassword} onChange={setNewPassword} type="password" placeholder="6+ characters" />
        </Section>

        <button
          onClick={changePassword}
          disabled={pwSaving}
          style={{ ...btnSecondary, opacity: pwSaving ? 0.4 : 1 }}
          onMouseEnter={e => { if (!pwSaving) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; } }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; }}
        >
          {pwSaving ? 'Updating…' : 'Update password'}
        </button>
      </div>

      <div className="anim-fade-up-3">
        <Section title="Account">
          <button
            onClick={signOut}
            style={{
              width: '100%', padding: '14px 16px', textAlign: 'left',
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 500, color: 'var(--text-2)',
              transition: 'color 140ms ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; }}
          >
            Sign out
          </button>
        </Section>

        <div style={{ marginTop: 24 }}>
          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              style={{
                width: '100%', padding: '12px', background: 'transparent', border: 'none',
                fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--text-3)', cursor: 'pointer', transition: 'color 140ms ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}
            >
              Delete account
            </button>
          ) : (
            <div className="anim-scale-in" style={{ padding: 18, background: 'var(--danger-bg)', border: '1px solid var(--danger-border)' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)', marginBottom: 4 }}>Delete account?</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.65, marginBottom: 16 }}>
                This is permanent and cannot be undone. All your data will be lost.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setShowDelete(false)}
                  style={{
                    flex: 1, padding: '11px',
                    background: 'transparent', border: '1px solid var(--border)',
                    fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-2)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAccount}
                  style={{
                    flex: 1, padding: '11px',
                    background: 'var(--danger)', border: 'none',
                    fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
