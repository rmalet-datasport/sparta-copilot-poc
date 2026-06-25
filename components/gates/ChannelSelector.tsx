'use client';

import type { Channel } from '@/lib/constants';

interface ChannelSelectorProps {
  available: Channel[];
  selected: Channel[];
  onChange: (channels: Channel[]) => void;
  rationale?: Partial<Record<Channel, string>>;
}

const CHANNEL_ICONS: Record<Channel, React.ReactNode> = {
  email: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1.5" y="3" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M1.5 5.5l5.5 3 5.5-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  sms: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1.5" y="2" width="11" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M4 12l2-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  push: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1.5v1M10.5 3l-.75.75M3.5 3l.75.75" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M2.5 9h9l-1.2-5a3.3 3.3 0 00-6.6 0L2.5 9Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M5.5 9a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  ),
  instagram: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="2" y="2" width="10" height="10" rx="3" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="7" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="10.2" cy="3.8" r="0.8" fill="currentColor"/>
    </svg>
  ),
  offline: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1.5" y="1.5" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="8.5" y="1.5" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="1.5" y="8.5" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="2.8" y="2.8" width="1.4" height="1.4" fill="currentColor"/>
      <rect x="9.8" y="2.8" width="1.4" height="1.4" fill="currentColor"/>
      <rect x="2.8" y="9.8" width="1.4" height="1.4" fill="currentColor"/>
      <path d="M8.5 8.5h1.5v1.5M10 10v2.5M12 8.5v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

const CHANNEL_LABELS: Record<Channel, string> = {
  email: 'Email', sms: 'SMS', push: 'Push', instagram: 'Instagram', offline: 'Offline',
};

export default function ChannelSelector({ available, selected, onChange, rationale }: ChannelSelectorProps) {
  const toggle = (ch: Channel) => {
    if (selected.includes(ch)) {
      onChange(selected.filter(c => c !== ch));
    } else {
      onChange([...selected, ch]);
    }
  };

  const ALL_CHANNELS: Channel[] = ['email', 'sms', 'push', 'instagram', 'offline'];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 570, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Channels
        </div>
        {available.length > 0 && (
          <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>
            recommended: {available.map(ch => CHANNEL_LABELS[ch]).join(', ')}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {ALL_CHANNELS.map(ch => {
          const isRecommended = available.includes(ch);
          const isSelected = selected.includes(ch);

          return (
            <button
              key={ch}
              onClick={() => toggle(ch)}
              title={rationale?.[ch]}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border-1)'}`,
                background: isSelected ? '#FFF0F2' : 'var(--bg-1)',
                color: isSelected ? 'var(--primary)' : 'var(--fg-1)',
                fontSize: 12,
                fontWeight: isSelected ? 570 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              {CHANNEL_ICONS[ch]}
              {CHANNEL_LABELS[ch]}
              {isRecommended && !isSelected && (
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--primary)', opacity: 0.5, flexShrink: 0 }} />
              )}
            </button>
          );
        })}
      </div>
      {rationale && selected.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {selected.filter(ch => rationale[ch]).map(ch => (
            <p key={ch} style={{ fontSize: 11, color: 'var(--fg-3)', margin: '3px 0', display: 'flex', gap: 5 }}>
              <span style={{ color: 'var(--primary)', fontWeight: 570 }}>{CHANNEL_LABELS[ch]}:</span>
              {rationale[ch]}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
