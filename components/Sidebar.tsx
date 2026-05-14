'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const NAV = [
  { href: '/dashboard',   label: 'Dashboard',    icon: IconDashboard },
  { href: '/plan',        label: 'Training Plan', icon: IconPlan },
  { href: '/daily-log',   label: 'Daily Log',     icon: IconDailyLog },
  { href: '/nutrition',   label: 'Nutrition',     icon: IconNutrition },
  { href: '/progress',    label: 'Progress',      icon: IconProgress },
  { href: '/feed',        label: 'Feed',          icon: IconFeed },
  { href: '/leaderboard', label: 'Leaderboard',   icon: IconLeaderboard },
  { href: '/search',      label: 'Search',        icon: IconSearch },
  { href: '/settings',    label: 'Settings',      icon: IconSettings },
];

const BOTTOM_NAV = [
  { href: '/dashboard',  label: 'Home',      icon: IconDashboard },
  { href: '/plan',       label: 'Train',     icon: IconPlan },
  { href: '/daily-log',  label: 'Log',       icon: IconDailyLog },
  { href: '/nutrition',  label: 'Nutrition', icon: IconNutrition },
  { href: '/settings',   label: 'Settings',  icon: IconSettings },
];

function IconNutrition({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  );
}
function IconDashboard({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  );
}
function IconPlan({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/>
    </svg>
  );
}
function IconDailyLog({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  );
}
function IconProgress({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}
function IconFeed({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function IconLeaderboard({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>
    </svg>
  );
}
function IconSearch({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function IconSettings({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<{ username: string; name: string | null } | null>(null);

  useEffect(() => {
    (async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb.from('profiles').select('username, name').eq('id', user.id).single();
      if (data) setProfile(data);
    })();
  }, []);

  if (pathname?.startsWith('/auth') || pathname?.startsWith('/onboarding')) return null;

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname?.startsWith(href));

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex fixed top-0 left-0 h-full flex-col"
        style={{
          width: 'var(--sidebar-w)',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(240, 112, 48, 0.14)',
          zIndex: 40,
        }}
      >
        {/* Wordmark */}
        <div style={{ padding: '26px 18px 22px', borderBottom: '1px solid rgba(240, 112, 48, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Logo mark */}
            <div style={{
              width: 32, height: 32, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #F07030 0%, #F59050 100%)',
              boxShadow: '0 0 16px rgba(240, 112, 48, 0.5)',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18, fontWeight: 700,
              letterSpacing: '0.10em', textTransform: 'uppercase',
              background: 'linear-gradient(90deg, #16141F 0%, #F59050 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Kinetic
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  color: active ? '#16141F' : 'var(--text-3)',
                  background: active
                    ? 'linear-gradient(90deg, rgba(240,112,48,0.22) 0%, rgba(240,112,48,0.08) 100%)'
                    : 'transparent',
                  borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                  boxShadow: active ? 'inset 0 1px 0 rgba(180,140,255,0.06)' : 'none',
                  transition: 'all 160ms ease',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(240,112,48,0.08)';
                    (e.currentTarget as HTMLElement).style.borderLeftColor = 'rgba(240,112,48,0.3)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-3)';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent';
                  }
                }}
              >
                <Icon size={15} />
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 12, fontWeight: active ? 600 : 500,
                  letterSpacing: '0.07em', textTransform: 'uppercase',
                }}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Profile */}
        <div style={{ borderTop: '1px solid rgba(240,112,48,0.1)', padding: '12px 10px' }}>
          <Link
            href={profile?.username ? `/profile/${profile.username}` : '/settings'}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 10, textDecoration: 'none',
              transition: 'background 160ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(240,112,48,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{
              width: 28, height: 28, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(240,112,48,0.35) 0%, rgba(240,112,48,0.15) 100%)',
              border: '1px solid rgba(240,112,48,0.3)',
              color: 'var(--accent-light)',
              fontFamily: 'var(--font-display)',
              fontSize: 12, fontWeight: 700,
            }}>
              {profile ? (profile.name || profile.username || 'U')[0].toUpperCase() : 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11, fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: 'var(--text-2)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {profile?.name || profile?.username || 'Profile'}
              </p>
            </div>
          </Link>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0"
        style={{
          zIndex: 40,
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(240, 112, 48, 0.14)',
          display: 'flex',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '12px 4px',
                textDecoration: 'none',
                color: active ? 'var(--accent-light)' : 'var(--text-3)',
                position: 'relative',
                transition: 'color 160ms ease',
              }}
            >
              {active && (
                <div style={{
                  position: 'absolute',
                  top: 0, left: '20%', right: '20%',
                  height: 2,
                  background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                  borderRadius: '0 0 2px 2px',
                }} />
              )}
              <Icon size={18} />
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 9, fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginTop: 4,
              }}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
