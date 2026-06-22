'use client';

import { usePathname } from 'next/navigation';

const GATE_LABELS: Record<string, { gate: string; label: string }> = {
  '/gate/creation': { gate: 'Gate 0', label: 'Event Creation' },
  '/gate/registration': { gate: 'Gate 1', label: 'Registration Opens' },
  '/gate/lottery': { gate: 'Gate 2', label: 'Lottery Result' },
  '/gate/finish': { gate: 'Gate 3', label: 'Race Finish' },
};

export default function Topbar() {
  const pathname = usePathname();
  const current = Object.entries(GATE_LABELS).find(([path]) => pathname.startsWith(path));
  const gateInfo = current?.[1];

  return (
    <header
      style={{
        height: 52,
        borderBottom: '1px solid var(--border-1)',
        background: 'var(--bg-1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--fg-3)', fontSize: 13 }}>Copenhagen Marathon 2026</span>
        {gateInfo && (
          <>
            <span style={{ color: 'var(--border-2)', fontSize: 13 }}>/</span>
            <span style={{ color: 'var(--fg-3)', fontSize: 13 }}>{gateInfo.gate}</span>
            <span style={{ color: 'var(--border-2)', fontSize: 13 }}>/</span>
            <span style={{ color: 'var(--fg-1)', fontSize: 13, fontWeight: 570 }}>{gateInfo.label}</span>
          </>
        )}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Live badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 'var(--radius-full)',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#16A34A',
              animation: 'pulse 2s infinite',
              display: 'block',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 570, color: '#15803D', letterSpacing: '0.05em' }}>
            LIVE
          </span>
        </div>

        {/* Datasport logo text */}
        <div style={{ color: 'var(--fg-3)', fontSize: 12 }}>
          Datasport
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </header>
  );
}
