'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Profile = { id: string; username: string; name: string | null; bio: string | null; level: string | null };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-bold tracking-widest uppercase px-1 mb-2" style={{ color: 'rgba(167,139,248,0.55)' }}>{title}</p>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgba(20,16,50,0.9) 0%, rgba(14,11,36,0.95) 100%)',
          border: '1px solid rgba(124,90,246,0.12)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = 'text', placeholder,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="px-4 py-3.5" style={{ borderBottom: '1px solid rgba(124,90,246,0.08)' }}>
      <label className="block text-[10px] font-bold tracking-widest uppercase mb-1.5" style={{ color: 'rgba(167,139,248,0.55)' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm font-medium text-white outline-none"
        style={{ color: '#fff' }}
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

  return (
    <div className="min-h-dvh px-4 pt-16 pb-12">
      <div className="anim-fade-up mb-8 pt-4">
        <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(167,139,248,0.65)' }}>Settings</p>
        <h1 className="font-bold text-white leading-none" style={{ fontSize: 'clamp(36px, 10vw, 48px)', letterSpacing: '-0.04em' }}>Account</h1>
      </div>

      {msg && (
        <div
          className="anim-scale-in mb-5 px-4 py-3 rounded-2xl text-sm font-medium"
          style={{
            background: isSuccess ? 'rgba(124,90,246,0.1)' : 'rgba(239,68,68,0.07)',
            color: isSuccess ? '#a78bf8' : '#f87171',
            border: `1px solid ${isSuccess ? 'rgba(124,90,246,0.25)' : 'rgba(239,68,68,0.18)'}`,
            boxShadow: isSuccess ? '0 0 16px rgba(124,90,246,0.15)' : 'none',
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
          <div className="px-4 py-3.5" style={{ borderTop: '1px solid rgba(124,90,246,0.08)' }}>
            <p className="text-[10px] font-bold tracking-widest uppercase mb-1.5" style={{ color: 'rgba(167,139,248,0.55)' }}>Email</p>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{email}</p>
          </div>
        </Section>

        <button
          onClick={saveProfile}
          disabled={saving}
          className="anim-glow w-full py-4 rounded-full text-sm font-bold text-white mb-5 disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #7c5af6 0%, #6646e0 100%)',
            transition: 'opacity 150ms ease, transform 100ms cubic-bezier(0.34,1.56,0.64,1)',
          }}
          onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
          onMouseLeave={e => { if (!saving) (e.currentTarget as HTMLElement).style.opacity = '1'; }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
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
          className="w-full py-4 rounded-full text-sm font-semibold mb-5 disabled:opacity-50"
          style={{
            background: 'rgba(124,90,246,0.07)',
            border: '1px solid rgba(124,90,246,0.14)',
            color: 'rgba(255,255,255,0.5)',
            transition: 'background 150ms ease, color 150ms ease',
          }}
          onMouseEnter={e => { if (!pwSaving) { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.14)'; } }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.07)'; }}
        >
          {pwSaving ? 'Updating…' : 'Update password'}
        </button>
      </div>

      <div className="anim-fade-up-3">
        <Section title="Account">
          <button
            onClick={signOut}
            className="w-full px-4 py-3.5 text-left text-sm font-medium transition-colors"
            style={{ color: 'rgba(255,255,255,0.45)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; }}
          >
            Sign out
          </button>
        </Section>

        <div className="mt-6">
          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              className="w-full py-3 text-xs transition-colors"
              style={{ color: 'rgba(255,255,255,0.25)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.25)'; }}
            >
              Delete account
            </button>
          ) : (
            <div className="anim-scale-in rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-sm font-semibold text-red-400 mb-1">Delete account?</p>
              <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>This is permanent and cannot be undone. All your data will be lost.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDelete(false)}
                  className="flex-1 py-2.5 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(124,90,246,0.07)', border: '1px solid rgba(124,90,246,0.14)', color: 'rgba(255,255,255,0.5)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAccount}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold text-white"
                  style={{ background: '#ef4444' }}
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
