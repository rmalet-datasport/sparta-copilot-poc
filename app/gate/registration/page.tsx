'use client';

import { useState } from 'react';
import GateTimeline from '@/components/gates/GateTimeline';
import SegmentCard from '@/components/gates/SegmentCard';
import ChannelSelector from '@/components/gates/ChannelSelector';
import CampaignGenerator from '@/components/campaign/CampaignGenerator';
import { SEGMENT_SIZES, DEFAULT_CHANNELS, KPI } from '@/lib/constants';
import type { Channel } from '@/lib/constants';
import { getAthletesByPreLotterySegment } from '@/lib/db/athletes';

const SEGMENTS = [
  {
    id: 'ambassador',
    label: 'Ambassadors',
    color: '#16A34A',
    colorBg: '#F0FDF4',
    quadrant: { row: 0, col: 1 }, // top-right: high value, high prob
    description: 'High anticipated value × high selection probability. Your most loyal, high-engagement athletes.',
    objective: 'Reinforce elite status, encourage referrals.',
    rationale: {
      email: 'Premium touch: personalized tone justifies multicanal investment.',
      push: 'High app engagement — push notifications are well received.',
    } as Partial<Record<Channel, string>>,
  },
  {
    id: 'to_reactivate',
    label: 'To Reactivate',
    color: '#EA580C',
    colorBg: '#FFF7ED',
    quadrant: { row: 0, col: 0 }, // top-left: high value, low prob
    description: 'High value but low selection probability. Need re-engagement before lottery.',
    objective: 'Revive intent, remove friction, create urgency.',
    rationale: {
      email: 'Emotional storytelling channel for deep re-engagement.',
      sms: 'Soft urgency to push them to act before ballot closes.',
    } as Partial<Record<Channel, string>>,
  },
  {
    id: 'opportunist',
    label: 'Opportunists',
    color: '#2563EB',
    colorBg: '#EFF6FF',
    quadrant: { row: 1, col: 1 }, // bottom-right: low value, high prob
    description: 'Frequent applicants with moderate anticipated value. Here to run.',
    objective: 'Maintain engagement, subtle upsell introduction.',
    rationale: {
      email: 'Practical info channel. No overinvestment needed.',
    } as Partial<Record<Channel, string>>,
  },
  {
    id: 'cold_prospect',
    label: 'Cold Prospects',
    color: '#6B7280',
    colorBg: '#F9FAFB',
    quadrant: { row: 1, col: 0 }, // bottom-left: low value, low prob
    description: 'First-time or external applicants. Low ROI per contact.',
    objective: 'Light touch. Keep door open for 2027.',
    rationale: {
      email: 'Minimal cost, positive brand image. No other channel justified.',
    } as Partial<Record<Channel, string>>,
  },
];

export default function RegistrationPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);

  const selected = SEGMENTS.find(s => s.id === selectedId);

  const handleSelect = (id: string) => {
    if (selectedId === id) {
      setSelectedId(null);
      setChannels([]);
      return;
    }
    setSelectedId(id);
    const seg = SEGMENTS.find(s => s.id === id);
    if (seg) setChannels((DEFAULT_CHANNELS[id] ?? ['email']) as Channel[]);
  };

  const kpi = KPI.gate1;
  const sizes = SEGMENT_SIZES.gate1;

  return (
    <div style={{ padding: '0 28px 28px' }}>
      {/* Gate timeline */}
      <GateTimeline activeGate="registration" />

      {/* KPI strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          margin: '20px 0',
        }}
      >
        {[
          { label: 'Total Applications', value: kpi.totalApplications.toLocaleString(), sub: '2026 ballot' },
          { label: 'Avg Candidacy Score', value: `${kpi.avgCandidacyScore}/100`, sub: 'Composite score' },
          { label: 'Avg Anticipated Value', value: `€${kpi.avgAnticipatedValue}`, sub: 'Per selected athlete' },
          { label: 'External Prospects', value: kpi.externalProspects.toLocaleString(), sub: 'Partner imports' },
        ].map(kpiItem => (
          <div
            key={kpiItem.label}
            style={{
              background: 'var(--bg-1)',
              border: '1px solid var(--border-1)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px 16px',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 4 }}>{kpiItem.label}</div>
            <div style={{ fontSize: 20, fontWeight: 570, color: 'var(--fg-1)', fontFamily: 'var(--font-mono)' }}>
              {kpiItem.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{kpiItem.sub}</div>
          </div>
        ))}
      </div>

      {/* Section title */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 570, color: 'var(--fg-1)', margin: 0 }}>Pre-lottery Segments</h2>
        <p style={{ fontSize: 13, color: 'var(--fg-3)', margin: '4px 0 0' }}>
          4-quadrant matrix: Anticipated Value (Y) × Selection Probability (X)
        </p>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Left: segment matrix */}
        <div style={{ flex: '0 0 420px' }}>
          {/* Matrix grid (2×2) */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            {/* Axis labels */}
            <div
              style={{
                position: 'absolute',
                left: -28,
                top: '50%',
                transform: 'translateY(-50%) rotate(-90deg)',
                fontSize: 10,
                color: 'var(--fg-3)',
                whiteSpace: 'nowrap',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Anticipated Value →
            </div>
            <div
              style={{
                textAlign: 'center',
                fontSize: 10,
                color: 'var(--fg-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 8,
                paddingLeft: 20,
              }}
            >
              ← Selection Probability →
            </div>

            {/* 2×2 grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gridTemplateRows: '1fr 1fr',
                gap: 8,
                paddingLeft: 20,
              }}
            >
              {/* Row 0, Col 0: top-left = to_reactivate */}
              {[
                SEGMENTS.find(s => s.quadrant.row === 0 && s.quadrant.col === 0)!, // top-left
                SEGMENTS.find(s => s.quadrant.row === 0 && s.quadrant.col === 1)!, // top-right
                SEGMENTS.find(s => s.quadrant.row === 1 && s.quadrant.col === 0)!, // bottom-left
                SEGMENTS.find(s => s.quadrant.row === 1 && s.quadrant.col === 1)!, // bottom-right
              ].map(seg => (
                <SegmentCard
                  key={seg.id}
                  segment={seg.id}
                  label={seg.label}
                  size={sizes[seg.id as keyof typeof sizes]}
                  description={seg.description}
                  color={seg.color}
                  colorBg={seg.colorBg}
                  channels={(DEFAULT_CHANNELS[seg.id] ?? ['email']) as string[]}
                  isSelected={selectedId === seg.id}
                  onClick={() => handleSelect(seg.id)}
                />
              ))}
            </div>
          </div>

          {/* Sample athletes */}
          {selected && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Sample athletes ({selected.label})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
                {getAthletesByPreLotterySegment(selected.id as any).slice(0, 8).map(a => (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 10px',
                      background: 'var(--bg-1)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-1)',
                    }}
                  >
                    <span style={{ fontSize: 12, color: 'var(--fg-1)' }}>
                      {a.firstName} {a.lastName}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>{a.nationality}</span>
                      <span style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
                        {a.candidacyScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: campaign panel */}
        {selected && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                background: 'var(--bg-1)',
                border: '1px solid var(--border-1)',
                borderRadius: 'var(--radius-xl)',
                padding: '20px',
              }}
            >
              {/* Segment header */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: selected.color, display: 'inline-block' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 570, margin: 0, color: 'var(--fg-1)' }}>
                    {selected.label}
                  </h3>
                  <span style={{ fontSize: 13, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
                    {sizes[selected.id as keyof typeof sizes].toLocaleString()} athletes
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-3)' }}>{selected.objective}</p>
              </div>

              <div style={{ borderBottom: '1px solid var(--border-1)', marginBottom: 20 }} />

              {/* Channel selector */}
              <div style={{ marginBottom: 20 }}>
                <ChannelSelector
                  available={(DEFAULT_CHANNELS[selected.id] ?? ['email']) as Channel[]}
                  selected={channels}
                  onChange={setChannels}
                  rationale={selected.rationale}
                />
              </div>

              <div style={{ borderBottom: '1px solid var(--border-1)', marginBottom: 20 }} />

              {/* Campaign generator */}
              <CampaignGenerator
                gate="gate1"
                segment={selected.id}
                channels={channels}
              />
            </div>
          </div>
        )}

        {!selected && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 12,
              color: 'var(--fg-3)',
              padding: 40,
            }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity="0.3">
              <rect x="8" y="8" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="2"/>
              <path d="M20 16v8M16 20h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p style={{ fontSize: 13, textAlign: 'center', maxWidth: 240, margin: 0 }}>
              Select a segment to start generating your campaign
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
