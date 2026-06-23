'use client';

import { useState, useRef, useEffect } from 'react';

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
  onRegenerate?: (channel: string, instructions: string) => void;
  isRegenerating?: boolean;
  onSave?: (imageUrl?: string, editedAsset?: Asset) => void;
  isSaved?: boolean;
  savedImageUrl?: string;
}

const CHANNEL_COLORS: Record<string, { color: string; bg: string }> = {
  email:     { color: '#2563EB', bg: '#EFF6FF' },
  sms:       { color: '#16A34A', bg: '#F0FDF4' },
  push:      { color: '#7C3AED', bg: '#F5F3FF' },
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

const IMAGE_CHANNELS = ['email', 'instagram'];

const IMAGE_SPECS: Record<string, { dims: string; ratio: string }> = {
  email:     { dims: '600×300 px', ratio: 'Email banner' },
  instagram: { dims: '1080×1080 px', ratio: 'Square · 1080×1920 px for stories' },
};

function InstagramStoryPreview({ caption, hashtags, imageUrl }: { caption?: string; hashtags?: string; imageUrl?: string | null }) {
  const hasImage = !!imageUrl;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0 8px' }}>
      {/* Phone shell */}
      <div style={{
        width: 220,
        height: 390,
        borderRadius: 28,
        overflow: 'hidden',
        position: 'relative',
        background: hasImage ? '#000' : 'linear-gradient(160deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.35), 0 0 0 2px rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        {/* Background image */}
        {hasImage && (
          <img
            src={imageUrl!}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        {/* Top gradient overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 120,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Bottom gradient overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 160,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Story progress bars */}
        <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', gap: 3 }}>
          {[1, 2, 3].map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 2, borderRadius: 2,
              background: i === 0 ? 'white' : 'rgba(255,255,255,0.35)',
            }} />
          ))}
        </div>

        {/* Top bar: avatar + name + time + icons */}
        <div style={{
          position: 'absolute', top: 20, left: 10, right: 10,
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          {/* Avatar */}
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #f97316, #dc2626)',
            border: '2px solid white', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 8l3.5-4.5H3.5L7 8z" fill="white"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'white', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              copenhagen_marathon
            </div>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)', lineHeight: 1.2 }}>
              Now
            </div>
          </div>
          {/* Close + mute */}
          <div style={{ display: 'flex', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="1.2" fill="white"/>
              <circle cx="3" cy="7" r="1.2" fill="white"/>
              <circle cx="11" cy="7" r="1.2" fill="white"/>
            </svg>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 3l8 6M2 9l8-6" stroke="rgba(255,255,255,0.8)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* Caption + hashtags at bottom */}
        <div style={{
          position: 'absolute', bottom: 42, left: 10, right: 10,
        }}>
          {caption && (
            <div style={{
              fontSize: 10, color: 'white', lineHeight: 1.55, fontWeight: 500,
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              display: '-webkit-box', WebkitLineClamp: 6,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
              marginBottom: hashtags ? 6 : 0,
            }}>
              {caption}
            </div>
          )}
          {hashtags && (
            <div style={{
              fontSize: 9, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5,
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {hashtags}
            </div>
          )}
        </div>

        {/* Swipe up bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          paddingBottom: 10, gap: 3,
        }}>
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
            <path d="M2 8l6-6 6 6" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            See more
          </div>
        </div>

        {/* Bottom send / reaction row */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 12px', gap: 8,
        }}>
          <div style={{
            flex: 1, height: 24, borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', paddingLeft: 10,
          }}>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.55)' }}>Send a message...</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 2l12 6-12 6V9.5l8-1.5-8-1.5V2z" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 10, color: 'var(--fg-3)', textAlign: 'center' }}>
        Story Preview · 1080×1920 px
      </div>
    </div>
  );
}

export default function AssetCard({ asset, onRegenerate, isRegenerating, onSave, isSaved, savedImageUrl }: AssetCardProps) {
  const [showRegen, setShowRegen] = useState(false);
  const [showStoryPreview, setShowStoryPreview] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editedAsset, setEditedAsset] = useState<Asset>({ ...asset });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedAsset({ ...asset });
  }, [asset.subject, asset.title, asset.body, asset.caption, asset.hashtags, asset.meta]);

  const setField = (field: keyof Asset, value: string) =>
    setEditedAsset(prev => ({ ...prev, [field]: value }));

  const style = CHANNEL_COLORS[asset.channel] ?? { color: '#6B7280', bg: '#F9FAFB' };
  const needsImage = IMAGE_CHANNELS.includes(asset.channel);
  const isInstagram = asset.channel === 'instagram';
  const displayImage = localImageUrl ?? savedImageUrl ?? null;

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => setLocalImageUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmitRegen = () => {
    if (!instructions.trim() || !onRegenerate) return;
    onRegenerate(asset.channel, instructions);
    setShowRegen(false);
    setInstructions('');
  };

  return (
    <div style={{ border: '1px solid var(--border-1)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-1)', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: style.bg, borderBottom: '1px solid var(--border-1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: style.color }}>
          {CHANNEL_ICONS[asset.channel]}
          <span style={{ fontSize: 12, fontWeight: 570, textTransform: 'capitalize' }}>{asset.channel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Story preview toggle — instagram only */}
          {isInstagram && (
            <button
              onClick={() => setShowStoryPreview(!showStoryPreview)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 9px', borderRadius: 'var(--radius-md)',
                border: `1px solid ${showStoryPreview ? style.color : 'var(--border-1)'}`,
                background: showStoryPreview ? style.bg : 'var(--bg-1)',
                color: showStoryPreview ? style.color : 'var(--fg-2)',
                fontSize: 11, cursor: 'pointer', transition: 'all 0.15s ease',
              }}
            >
              <svg width="10" height="11" viewBox="0 0 10 11" fill="none">
                <rect x="1" y="0.5" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="2.5" y="2" width="5" height="3.5" rx="0.5" fill="currentColor" opacity="0.3"/>
                <path d="M2.5 7h5M2.5 8.5h3" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
              </svg>
              Story Preview
            </button>
          )}
          {onSave && (
            <button
              onClick={() => onSave(localImageUrl ?? undefined, editedAsset)}
              disabled={isSaved}
              title={isSaved ? 'Saved' : 'Save this asset'}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 9px', borderRadius: 'var(--radius-md)',
                border: `1px solid ${isSaved ? style.color : 'var(--border-1)'}`,
                background: isSaved ? style.bg : 'var(--bg-1)',
                color: isSaved ? style.color : 'var(--fg-2)',
                fontSize: 11, cursor: isSaved ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {isSaved ? (
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M1.5 6l3 3 5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M2 1.5h7l1 1.5v6.5l-3.5-2L3 9.5V3l-1-1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
              )}
              {isSaved ? 'Saved' : 'Save'}
            </button>
          )}
          {onRegenerate && (
            <button
              onClick={() => setShowRegen(!showRegen)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-1)', background: 'var(--bg-1)', color: 'var(--fg-2)', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s ease' }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M9.5 2A5 5 0 102 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M9.5 2v3h-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Regenerate
            </button>
          )}
        </div>
      </div>

      {/* Story preview */}
      {showStoryPreview && isInstagram && (
        <div style={{ borderBottom: '1px solid var(--border-1)', background: '#0a0a0a' }}>
          <InstagramStoryPreview
            caption={editedAsset.caption ?? editedAsset.body}
            hashtags={editedAsset.hashtags}
            imageUrl={displayImage}
          />
        </div>
      )}

      {/* Content — hidden when story preview is active */}
      {!showStoryPreview && (
        <div style={{ padding: '14px 16px' }}>
          <style>{`
            .sparta-editable-line {
              border: 1px solid transparent;
              border-radius: 3px;
              background: transparent;
              outline: none;
              padding: 2px 5px;
              margin: -2px -5px;
              font-family: var(--font-sans);
              color: var(--fg-1);
              width: calc(100% + 10px);
              display: block;
              transition: border-color 0.12s, background-color 0.12s;
              box-sizing: border-box;
            }
            .sparta-editable-line:hover { background-color: var(--bg-2); border-color: var(--border-1); }
            .sparta-editable-line:focus { background-color: var(--bg-1); border-color: var(--color-grey-400, #9CA3AF); }
            .sparta-editable-area {
              border: 1px solid transparent;
              border-radius: 3px;
              background: transparent;
              outline: none;
              padding: 2px 5px;
              margin: -2px -5px;
              font-family: var(--font-sans);
              color: var(--fg-1);
              width: calc(100% + 10px);
              display: block;
              resize: none;
              overflow: hidden;
              transition: border-color 0.12s, background-color 0.12s;
              box-sizing: border-box;
            }
            .sparta-editable-area:hover { background-color: var(--bg-2); border-color: var(--border-1); }
            .sparta-editable-area:focus { background-color: var(--bg-1); border-color: var(--color-grey-400, #9CA3AF); }
          `}</style>

          {editedAsset.subject !== undefined && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Subject</div>
              <input
                className="sparta-editable-line"
                value={editedAsset.subject ?? ''}
                onChange={e => setField('subject', e.target.value)}
                style={{ fontSize: 13, fontWeight: 570 }}
              />
            </div>
          )}
          {editedAsset.title !== undefined && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Title</div>
              <input
                className="sparta-editable-line"
                value={editedAsset.title ?? ''}
                onChange={e => setField('title', e.target.value)}
                style={{ fontSize: 13, fontWeight: 570 }}
              />
            </div>
          )}
          {editedAsset.caption !== undefined && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Caption</div>
              <textarea
                className="sparta-editable-area"
                value={editedAsset.caption ?? ''}
                onChange={e => { setField('caption', e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                onFocus={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                rows={Math.max(2, (editedAsset.caption ?? '').split('\n').length)}
                style={{ fontSize: 12, lineHeight: 1.6 }}
              />
            </div>
          )}
          {editedAsset.body !== undefined && (
            <div style={{ marginBottom: 10 }}>
              {(editedAsset.subject !== undefined || editedAsset.title !== undefined) && (
                <div style={{ fontSize: 10, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Body</div>
              )}
              <textarea
                className="sparta-editable-area"
                value={editedAsset.body ?? ''}
                onChange={e => { setField('body', e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                onFocus={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                rows={Math.max(2, (editedAsset.body ?? '').split('\n').length)}
                style={{ fontSize: 12, lineHeight: 1.6 }}
              />
            </div>
          )}
          {editedAsset.hashtags !== undefined && (
            <div style={{ marginTop: 8 }}>
              <input
                className="sparta-editable-line"
                value={editedAsset.hashtags ?? ''}
                onChange={e => setField('hashtags', e.target.value)}
                style={{ fontSize: 11, color: style.color }}
              />
            </div>
          )}
          {editedAsset.meta && (
            <div style={{ marginTop: 12, padding: '6px 10px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', fontSize: 11, color: 'var(--fg-3)', fontStyle: 'italic' }}>
              {editedAsset.meta}
            </div>
          )}
        </div>
      )}

      {/* Image upload zone — email & instagram only */}
      {needsImage && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ borderTop: '1px solid var(--border-1)', paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Visual
              </span>
              <span style={{ fontSize: 10, color: 'var(--fg-3)' }}>
                {IMAGE_SPECS[asset.channel]?.dims} · {IMAGE_SPECS[asset.channel]?.ratio}
              </span>
            </div>

            {displayImage ? (
              <div>
                {!showStoryPreview && (
                  <img
                    src={displayImage}
                    alt="Visual"
                    style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-1)', display: 'block', maxHeight: 200, objectFit: 'cover' }}
                  />
                )}
                {showStoryPreview && (
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', padding: '2px 0 6px', fontStyle: 'italic' }}>
                    Visual applied to the story above ↑
                  </div>
                )}
                {onSave && (
                  <div style={{ display: 'flex', gap: 8, marginTop: showStoryPreview ? 0 : 8 }}>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{ flex: 1, padding: '5px 0', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-1)', background: 'var(--bg-1)', color: 'var(--fg-2)', fontSize: 11, cursor: 'pointer' }}
                    >
                      Change
                    </button>
                    <button
                      onClick={() => setLocalImageUrl(null)}
                      style={{ flex: 1, padding: '5px 0', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-1)', background: 'var(--bg-1)', color: 'var(--fg-3)', fontSize: 11, cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ) : onSave ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                style={{
                  border: `1.5px dashed ${isDragging ? style.color : 'var(--border-1)'}`,
                  borderRadius: 'var(--radius-md)',
                  background: isDragging ? style.bg : 'var(--bg-2)',
                  padding: '20px 16px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ color: 'var(--fg-3)' }}>
                  <rect x="2" y="3" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                  <circle cx="7.5" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M2 13l5-4 4 4 3-3 6 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11 19v-4M9 17l2-2 2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--fg-2)', fontWeight: 570 }}>Add a photo</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>Drag & drop or click · PNG, JPG</div>
                </div>
              </div>
            ) : null}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
            />
          </div>
        </div>
      )}

      {/* Regenerate panel */}
      {showRegen && onRegenerate && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-1)', background: 'var(--bg-2)' }}>
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            placeholder={`Custom instructions for ${asset.channel}...`}
            rows={2}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-1)', background: 'var(--bg-1)', color: 'var(--fg-1)', fontSize: 12, fontFamily: 'var(--font-sans)', resize: 'vertical', outline: 'none', marginBottom: 8 }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setShowRegen(false); setInstructions(''); }}
              style={{ padding: '5px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-1)', background: 'var(--bg-1)', color: 'var(--fg-2)', fontSize: 12, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitRegen}
              disabled={isRegenerating || !instructions.trim()}
              style={{ padding: '5px 12px', borderRadius: 'var(--radius-md)', border: 'none', background: isRegenerating ? 'var(--fg-3)' : 'var(--primary)', color: 'white', fontSize: 12, fontWeight: 570, cursor: isRegenerating ? 'not-allowed' : 'pointer' }}
            >
              {isRegenerating ? 'Regenerating…' : 'Regenerate'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
