'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',     icon: IconDashboard },
  { href: '/progress',   label: 'Progress',       icon: IconProgress },
  { href: '/plan',       label: 'Training Plan',  icon: IconPlan },
  { href: '/skills',     label: 'Skills',         icon: IconSkills },
  { href: '/feed',       label: 'Feed',           icon: IconFeed },
  { href: '/leaderboard',label: 'Leaderboard',    icon: IconLeaderboard },
  { href: '/search',     label: 'Search',         icon: IconSearch },
  { href: '/settings',   label: 'Settings',       icon: IconSettings },
];

function IconDashboard({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconHistory({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
    </svg>
  );
}

function IconProgress({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconPlan({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="14" x2="16" y2="14" />
    </svg>
  );
}

function IconSkills({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

function IconFeed({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconLeaderboard({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
    </svg>
  );
}

function IconSearch({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconSettings({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <div style={{ position: 'relative', width: 18, height: 12 }}>
      <span style={{
        position: 'absolute', left: 0, right: 0, top: 0,
        height: 1.5, borderRadius: 99, background: 'rgba(255,255,255,0.85)',
        transformOrigin: 'center center',
        transform: open ? 'translateY(5px) rotate(45deg)' : 'translateY(0) rotate(0)',
        transition: 'transform 300ms cubic-bezier(0.25,0.46,0.45,0.94)',
      }} />
      <span style={{
        position: 'absolute', left: 0, right: 0, top: '50%', marginTop: -0.75,
        height: 1.5, borderRadius: 99, background: 'rgba(255,255,255,0.85)',
        opacity: open ? 0 : 1,
        transition: 'opacity 200ms ease',
      }} />
      <span style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: 1.5, borderRadius: 99, background: 'rgba(255,255,255,0.85)',
        transformOrigin: 'center center',
        transform: open ? 'translateY(-5px) rotate(-45deg)' : 'translateY(0) rotate(0)',
        transition: 'transform 300ms cubic-bezier(0.25,0.46,0.45,0.94)',
      }} />
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<{ username: string; name: string | null } | null>(null);

  useEffect(() => {
    const supabase = (async () => {
      const { createClient } = await import('@/lib/supabase/client');
      return createClient();
    })();
    supabase.then(async sb => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb.from('profiles').select('username, name').eq('id', user.id).single();
      if (data) setProfile(data);
    });
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (pathname?.startsWith('/auth') || pathname?.startsWith('/onboarding')) return null;

  return (
    <>
      {/* Hamburger — mobile only */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-5 left-4 z-50 w-10 h-10 flex items-center justify-center rounded-full"
        aria-label={open ? 'Close menu' : 'Open menu'}
        style={{
          background: open ? 'rgba(9,7,30,0.97)' : 'rgba(18,14,44,0.93)',
          border: '1px solid rgba(124,90,246,0.35)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.7)',
          transition: 'background 200ms ease',
        }}
      >
        <HamburgerIcon open={open} />
      </button>

      {/* Backdrop */}
      <div
        className=""
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          background: 'rgba(7,5,26,0.85)',
          backdropFilter: 'blur(6px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
          transition: 'opacity 300ms ease',
        }}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full flex flex-col pt-6 pb-8 px-3 transition-transform duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          width: '260px',
          background: 'linear-gradient(180deg, #0c0922 0%, #09071e 100%)',
          borderRight: '1px solid rgba(124,90,246,0.1)',
          boxShadow: '8px 0 60px rgba(0,0,0,0.7)',
        }}
      >
        {/* Wordmark */}
        <div className="px-3 mb-10 mt-12 md:mt-2 relative">
          <div className="flex items-center gap-2.5">
            <div
              className="anim-float w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(124,90,246,0.3) 0%, rgba(90,60,200,0.2) 100%)',
                border: '1px solid rgba(124,90,246,0.35)',
                boxShadow: '0 0 16px rgba(124,90,246,0.25)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span
              className="font-bold text-white"
              style={{ fontSize: '1.35rem', letterSpacing: '-0.04em' }}
            >
              Kinetic
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 flex-1 relative">
          {NAV_ITEMS.map(({ href, label, icon: Icon }, idx) => {
            const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium"
                style={{
                  animationDelay: `${idx * 0.04}s`,
                  background: active
                    ? 'linear-gradient(135deg, rgba(124,90,246,0.18) 0%, rgba(90,60,200,0.1) 100%)'
                    : 'transparent',
                  color: active ? '#a78bf8' : 'rgba(255,255,255,0.38)',
                  boxShadow: active ? 'inset 0 0 0 1px rgba(124,90,246,0.25)' : 'none',
                  transition: 'background 160ms ease, color 160ms ease, box-shadow 160ms ease',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(124,90,246,0.07)';
                    (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.72)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.38)';
                  }
                }}
              >
                <Icon size={17} />
                {label}
                {active && (
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: '#7c5af6', boxShadow: '0 0 8px rgba(124,90,246,0.8)' }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Profile shortcut */}
        <div className="mt-auto pt-5 px-1" style={{ borderTop: '1px solid rgba(124,90,246,0.08)' }}>
          <Link
            href={profile?.username ? `/profile/${profile.username}` : '/settings'}
            className="flex items-center gap-3 px-2 py-2 rounded-xl"
            style={{ transition: 'background 150ms ease' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,90,246,0.07)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(124,90,246,0.2) 0%, rgba(90,60,200,0.1) 100%)',
                border: '1px solid rgba(124,90,246,0.28)',
                color: '#a78bf8',
              }}
            >
              {profile ? (profile.name || profile.username || 'U')[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {profile?.name || profile?.username || 'Profile'}
              </p>
              {profile?.username && (
                <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.25)' }}>@{profile.username}</p>
              )}
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
