'use client';

interface SegmentCardProps {
  segment: string;
  label: string;
  size: number;
  description: string;
  color: string;
  colorBg: string;
  channels: string[];
  isSelected: boolean;
  onClick: () => void;
  onViewStats?: () => void;
  onEdit?: () => void;
  icon?: string;
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  email: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="2.5" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M1 4.5l5 3 5-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  sms: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="1.5" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M3.5 10.5l1.5-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  push: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 1v1M9.5 2.5l-.7.7M2.5 2.5l.7.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M2 7.5h8l-1-4.5a3 3 0 00-6 0L2 7.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M4.5 7.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  instagram: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="1.5" y="1.5" width="9" height="9" rx="2.5" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="9" cy="3" r="0.75" fill="currentColor"/>
    </svg>
  ),
};

export default function SegmentCard({
  label, size, description, color, colorBg, channels, isSelected, onClick, onViewStats, onEdit, icon,
}: SegmentCardProps) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      style={{
        width: '100%',
        textAlign: 'left',
        background: isSelected ? colorBg : 'var(--bg-1)',
        border: `1.5px solid ${isSelected ? color : 'var(--border-1)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: isSelected ? `0 0 0 3px ${colorBg}` : 'none',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      {icon && (
        <span style={{ fontSize: 20, lineHeight: 1, marginTop: 1, flexShrink: 0 }}>{icon}</span>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!icon && (
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0,
                }}
              />
            )}
            <span style={{ fontSize: 13, fontWeight: 570, color: 'var(--fg-1)' }}>{label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {onEdit && (
              <button
                onClick={e => { e.stopPropagation(); onEdit(); }}
                style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--fg-2)', padding: '3px 7px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 9l6-6 2 2-6 6H1.5V9z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 3.5l1 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                Edit
              </button>
            )}
            <span
              style={{
                fontSize: 15, fontWeight: 570,
                color: isSelected ? color : 'var(--fg-1)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {size.toLocaleString('en-US')}
            </span>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: 12, color: 'var(--fg-3)', margin: '0 0 10px', lineHeight: 1.5 }}>
          {description}
        </p>

        {/* View statistics link */}
        {onViewStats && (
          <div
            onClick={e => { e.stopPropagation(); onViewStats(); }}
            style={{ fontSize: 12, fontWeight: 570, color: 'var(--primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
          >
            View statistics <span style={{ fontSize: 13 }}>→</span>
          </div>
        )}

        {/* Channels */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {channels.map(ch => (
            <span
              key={ch}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 7px', borderRadius: 'var(--radius-full)',
                background: isSelected ? 'white' : 'var(--bg-2)',
                border: '1px solid var(--border-1)',
                fontSize: 11, color: 'var(--fg-2)',
              }}
            >
              {CHANNEL_ICONS[ch]}
              {ch}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
