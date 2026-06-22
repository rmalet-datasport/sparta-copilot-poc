'use client';

import { useState } from 'react';

interface RegeneratePromptProps {
  channel: string;
  onRegenerate: (instructions: string) => void;
  isLoading: boolean;
}

export default function RegeneratePrompt({ channel, onRegenerate, isLoading }: RegeneratePromptProps) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (!value.trim() || isLoading) return;
    onRegenerate(value.trim());
    setValue('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={`Instructions for ${channel} regeneration...`}
        rows={2}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-1)',
          background: 'var(--bg-1)',
          color: 'var(--fg-1)',
          fontSize: 12,
          fontFamily: 'var(--font-sans)',
          resize: 'vertical',
          outline: 'none',
        }}
      />
      <button
        onClick={handleSubmit}
        disabled={isLoading || !value.trim()}
        style={{
          alignSelf: 'flex-end',
          padding: '6px 14px',
          borderRadius: 'var(--radius-md)',
          border: 'none',
          background: isLoading ? 'var(--fg-3)' : 'var(--primary)',
          color: 'white',
          fontSize: 12,
          fontWeight: 570,
          cursor: isLoading || !value.trim() ? 'not-allowed' : 'pointer',
          opacity: !value.trim() ? 0.5 : 1,
        }}
      >
        {isLoading ? 'Regenerating…' : `Regenerate ${channel}`}
      </button>
    </div>
  );
}
