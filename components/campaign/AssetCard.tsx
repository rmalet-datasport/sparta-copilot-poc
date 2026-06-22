'use client';

import { useState } from 'react';

interface Asset {
  channel: string;
  subject?: string;
  title?: string;
  body?: string;
  caption?: string;
  hashtags?: string;
  meta?: string;
}

interface AssetCardProps {
  asset: Asset;
  onRegenerate: (channel: string, instructions: string) => void;
  isRegenerating: boolean;
}

const CHANNEL_COLORS: Record<string, { color: string; bg: string }> = {
  email: { color: '#2563EB', bg: '#EFF6FF' },
  sms: { color: '#16A34A', bg: '#F0FDF4' },
  push: { color: '#7C3AED', bg: '#F5F3FF' },
  instagram: { color: '#EA580C', bg: '#FFF7ED' },
};

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
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
};

export default function AssetCard({ asset, onRegenerate, isRegenerating }: AssetCardProps) {
  const [showRegen, setShowRegen] = useState(false);
  const [instructions, setInstructions] = useState('');

  const style = CHANNEL_COLORS[asset.channel] ?? { color: '#6B7280', bg: '#F9FAFB' };

  const handleSubmitRegen = () => {
    if (!instructions.trim()) return;
    onRegenerate(asset.channel, instructions);
    setShowRegen(false);
    setInstructions('');
  };

  return (
    <div
      style={{
        border: '1px solid var(--border-1)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-1)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: style.bg,
          borderBottom: '1px solid var(--border-1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: style.color }}>
          {CHANNEL_ICONS[asset.channel]}
          <span style={{ fontSize: 12, fontWeight: 570, textTransform: 'capitalize' }}>
            {asset.channel}
          </span>
        </div>
        <button
          onClick={() => setShowRegen(!showRegen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 9px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-1)',
            background: 'var(--bg-1)',
            color: 'var(--fg-2)',
            fontSize: 11,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M9.5 2A5 5 0 102 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            <path d="M9.5 2v3h-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Regenerate
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px' }}>
        {asset.subject && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
              Subject
            </div>
            <div style={{ fontSize: 13, fontWeight: 570, color: 'var(--fg-1)' }}>{asset.subject}</div>
          </div>
        )}
        {asset.title && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
              Title
            </div>
            <div style={{ fontSize: 13, fontWeight: 570, color: 'var(--fg-1)' }}>{asset.title}</div>
          </div>
        )}
        {asset.caption && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
              Caption
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-1)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{asset.caption}</div>
          </div>
        )}
        {asset.body && (
          <div style={{ marginBottom: 10 }}>
            {(asset.subject || asset.title) && (
              <div style={{ fontSize: 10, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                Body
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--fg-1)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{asset.body}</div>
          </div>
        )}
        {asset.hashtags && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: style.color }}>{asset.hashtags}</div>
          </div>
        )}
        {asset.meta && (
          <div
            style={{
              marginTop: 12,
              padding: '6px 10px',
              background: 'var(--bg-2)',
              borderRadius: 'var(--radius-md)',
              fontSize: 11,
              color: 'var(--fg-3)',
              fontStyle: 'italic',
            }}
          >
            {asset.meta}
          </div>
        )}
      </div>

      {/* Regenerate panel */}
      {showRegen && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border-1)',
            background: 'var(--bg-2)',
          }}
        >
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            placeholder={`Custom instructions for ${asset.channel}...`}
            rows={2}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-1)',
              background: 'var(--bg-1)',
              color: 'var(--fg-1)',
              fontSize: 12,
              fontFamily: 'var(--font-sans)',
              resize: 'vertical',
              outline: 'none',
              marginBottom: 8,
            }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setShowRegen(false); setInstructions(''); }}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-1)',
                background: 'var(--bg-1)',
                color: 'var(--fg-2)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitRegen}
              disabled={isRegenerating || !instructions.trim()}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: isRegenerating ? 'var(--fg-3)' : 'var(--primary)',
                color: 'white',
                fontSize: 12,
                fontWeight: 570,
                cursor: isRegenerating ? 'not-allowed' : 'pointer',
              }}
            >
              {isRegenerating ? 'Regenerating…' : 'Regenerate'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
