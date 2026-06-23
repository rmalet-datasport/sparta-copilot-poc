'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCampaignHistory } from '@/lib/context/CampaignHistoryContext';
import { useBrandHistory } from '@/lib/context/BrandHistoryContext';

const GATES = [
  {
    id: 'creation',
    label: 'Event Creation',
    sublabel: 'Gate 0',
    href: '/gate/creation',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M11.5 9v6M8.5 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'registration',
    label: 'Registration',
    sublabel: 'Gate 1',
    href: '/gate/registration',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M1.5 13c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M14.5 13c0-2.071-1.343-3.847-3.23-4.37" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'lottery',
    label: 'Lottery Result',
    sublabel: 'Gate 2',
    href: '/gate/lottery',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="5.5" cy="5.5" r="1" fill="currentColor"/>
        <circle cx="10.5" cy="5.5" r="1" fill="currentColor"/>
        <circle cx="5.5" cy="10.5" r="1" fill="currentColor"/>
        <circle cx="10.5" cy="10.5" r="1" fill="currentColor"/>
        <circle cx="8" cy="8" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: 'finish',
    label: 'Race Finish',
    sublabel: 'Gate 3',
    href: '/gate/finish',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 8h10M3 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13 3v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { savedAssets } = useCampaignHistory();
  const { examples } = useBrandHistory();

  return (
    <aside
      style={{
        width: 224,
        minHeight: '100vh',
        background: 'var(--color-grey-900)',
        borderRight: '1px solid var(--color-grey-800)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 20px 0',
          borderBottom: '1px solid var(--color-grey-800)',
          paddingBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: 'var(--primary)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 14l5-6.5h-4l.75-6.5-5 7.5h4L9 14Z" fill="white"/>
            </svg>
          </div>
          <div>
            <div style={{ color: 'var(--color-white)', fontWeight: 570, fontSize: 14, lineHeight: 1.2 }}>
              Sparta Co-Pilot
            </div>
            <div style={{ color: 'var(--color-grey-500)', fontSize: 11, marginTop: 1 }}>
              by Datasport
            </div>
          </div>
        </div>
      </div>

      {/* Event pill */}
      <div style={{ padding: '12px 16px' }}>
        <div
          style={{
            background: 'var(--color-grey-800)',
            borderRadius: 8,
            padding: '8px 10px',
          }}
        >
          <div style={{ color: 'var(--color-grey-400)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
            Event
          </div>
          <div style={{ color: 'var(--color-white)', fontSize: 12, fontWeight: 570 }}>
            Copenhagen Marathon
          </div>
          <div style={{ color: 'var(--color-grey-500)', fontSize: 11, marginTop: 1 }}>
            2026 · May 17
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '4px 0' }}>
        <div style={{ padding: '4px 16px 8px', color: 'var(--color-grey-600)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Gates
        </div>
        {GATES.map((gate) => {
          const isActive = pathname.startsWith(gate.href);
          return (
            <Link
              key={gate.id}
              href={gate.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 16px',
                color: isActive ? 'var(--color-white)' : 'var(--color-grey-500)',
                background: isActive ? 'var(--color-grey-800)' : 'transparent',
                borderRadius: 6,
                margin: '1px 8px',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                borderLeft: isActive ? '2px solid var(--primary)' : '2px solid transparent',
              }}
            >
              <span style={{ color: isActive ? 'var(--primary)' : 'var(--color-grey-600)', flexShrink: 0 }}>
                {gate.icon}
              </span>
              <div>
                <div style={{ fontSize: 12, fontWeight: isActive ? 570 : 400, lineHeight: 1.3 }}>
                  {gate.label}
                </div>
                <div style={{ fontSize: 10, color: isActive ? 'var(--color-grey-400)' : 'var(--color-grey-600)', marginTop: 1 }}>
                  {gate.sublabel}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Campaigns */}
      <div style={{ padding: '8px 0', borderTop: '1px solid var(--color-grey-800)' }}>
        <div style={{ padding: '8px 16px 6px', color: 'var(--color-grey-600)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Campaigns
        </div>
        <Link
          href="/campaigns"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 16px',
            color: pathname === '/campaigns' ? 'var(--color-white)' : 'var(--color-grey-500)',
            background: pathname === '/campaigns' ? 'var(--color-grey-800)' : 'transparent',
            borderRadius: 6, margin: '1px 8px', textDecoration: 'none',
            transition: 'all 0.15s ease',
            borderLeft: pathname === '/campaigns' ? '2px solid var(--primary)' : '2px solid transparent',
          }}
        >
          <span style={{ color: pathname === '/campaigns' ? 'var(--primary)' : 'var(--color-grey-600)', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 2h10l1.5 2.5v9a1 1 0 01-1 1H2.5a1 1 0 01-1-1V4.5L3 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M5.5 2v4h5V2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M4.5 10h7M4.5 12.5h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </span>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: pathname === '/campaigns' ? 570 : 400, lineHeight: 1.3 }}>
                Saved
              </div>
            </div>
            {savedAssets.length > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 570, minWidth: 18, height: 18,
                background: 'var(--primary)', color: 'white',
                borderRadius: 'var(--radius-full)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: '0 5px',
              }}>
                {savedAssets.length}
              </span>
            )}
          </div>
        </Link>
      </div>

      {/* Brand Voice */}
      <div style={{ padding: '8px 0', borderTop: '1px solid var(--color-grey-800)' }}>
        <div style={{ padding: '8px 16px 6px', color: 'var(--color-grey-600)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Brand Voice
        </div>
        <Link
          href="/brand-voice"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 16px',
            color: pathname === '/brand-voice' ? 'var(--color-white)' : 'var(--color-grey-500)',
            background: pathname === '/brand-voice' ? 'var(--color-grey-800)' : 'transparent',
            borderRadius: 6, margin: '1px 8px', textDecoration: 'none',
            transition: 'all 0.15s ease',
            borderLeft: pathname === '/brand-voice' ? '2px solid var(--primary)' : '2px solid transparent',
          }}
        >
          <span style={{ color: pathname === '/brand-voice' ? 'var(--primary)' : 'var(--color-grey-600)', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2C4.686 2 2 4.686 2 8s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5.5 8c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <circle cx="8" cy="8" r="1" fill="currentColor"/>
            </svg>
          </span>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, fontWeight: pathname === '/brand-voice' ? 570 : 400, lineHeight: 1.3 }}>
              Historique
            </div>
            {examples.length > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 570, minWidth: 18, height: 18,
                background: '#16A34A', color: 'white',
                borderRadius: 'var(--radius-full)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: '0 5px',
              }}>
                {examples.length}
              </span>
            )}
          </div>
        </Link>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--color-grey-800)',
          color: 'var(--color-grey-600)',
          fontSize: 11,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
          <span>claude-sonnet-4-6</span>
        </div>
      </div>
    </aside>
  );
}
