'use client';

import { useState } from 'react';
import GateTimeline from '@/components/gates/GateTimeline';
import SegmentCard from '@/components/gates/SegmentCard';
import ChannelSelector from '@/components/gates/ChannelSelector';
import CampaignGenerator from '@/components/campaign/CampaignGenerator';
import { SEGMENT_SIZES, DEFAULT_CHANNELS, KPI, REREGISTRATION_RATES } from '@/lib/constants';
import type { Channel } from '@/lib/constants';
import { getAthletesByPostRaceSegment } from '@/lib/db/athletes';

const SEGMENTS = [
  {
    id: 'loyal_finisher',
    label: 'Loyal Finisher',
    color: '#16A34A',
    colorBg: '#F0FDF4',
    description: 'Finisher with reRegistrationProbability > 0.7. Prime early-bird targets.',
    objective: 'Capitalize on post-race high. Convert to 2027 early bird.',
    rationale: { email: 'Celebration + early bird.', push: 'Badge unlock — emotional momentum.' } as Partial<Record<Channel, string>>,
  },
  {
    id: 'champion_ambassador',
    label: 'Champion Ambassador',
    color: '#D6001D',
    colorBg: '#FFF0F2',
    description: 'Finisher + personal best + engagement > 75. Natural brand amplifiers.',
    objective: 'Invite into ambassador program. Activate their social reach.',
    rationale: { email: 'Exclusive ambassador invitation.', instagram: 'Feature them — they have followers.' } as Partial<Record<Channel, string>>,
  },
  {
    id: 'at_risk_returner',
    label: 'At Risk Returner',
    color: '#EA580C',
    colorBg: '#FFF7ED',
    description: 'Finisher with reRegistrationProbability ≤ 0.4. At risk of not returning.',
    objective: 'Create urgency before the emotional window closes.',
    rationale: { email: '"Come back" storytelling.', sms: 'Early bird offer with deadline.' } as Partial<Record<Channel, string>>,
  },
  {
    id: 'lost_dns',
    label: 'DNS',
    color: '#6B7280',
    colorBg: '#F9FAFB',
    description: 'Did not start. Reason unknown — injury, life event, or dropout.',
    objective: 'Gentle, empathetic touch. No pressure.',
    rationale: { email: 'Very soft message. Respect the distance.' } as Partial<Record<Channel, string>>,
  },
  {
    id: 'reconquest_dnf',
    label: 'DNF — Reconquest',
    color: '#CA8A04',
    colorBg: '#FEFCE8',
    description: 'Did not finish. The abandonment is a powerful emotional lever.',
    objective: 'Channel the frustration into a comeback narrative.',
    rationale: { email: 'The unfinished story.', sms: 'Early bird for 2027 revenge.' } as Partial<Record<Channel, string>>,
  },
];

export default function FinishPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);

  const selected = SEGMENTS.find(s => s.id === selectedId);
  const sizes = SEGMENT_SIZES.gate3;
  const kpi = KPI.gate3;

  const handleSelect = (id: string) => {
    if (selectedId === id) { setSelectedId(null); setChannels([]); return; }
    setSelectedId(id);
    setChannels((DEFAULT_CHANNELS[id] ?? ['email']) as Channel[]);
  };

  return (
    <div style={{ padding: '0 28px 28px' }}>
      <GateTimeline activeGate="finish" />

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, margin: '20px 0' }}>
        {[
          { label: 'Total Finishers', value: kpi.totalFinishers.toLocaleString(), sub: 'May 17, 2026' },
          { label: 'Avg Finish Time', value: kpi.avgFinishTime, sub: 'All distances' },
          { label: 'Personal Best Rate', value: `${Math.round(kpi.personalBestRate * 100)}%`, sub: 'New records set' },
          { label: 'AI Re-registration', value: `${Math.round(REREGISTRATION_RATES.aiTargetedReturnRate * 100)}%`, sub: `vs ${Math.round(REREGISTRATION_RATES.naturalReturnRate * 100)}% natural` },
        ].map(item => (
          <div key={item.label} style={{ background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-lg)', padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 570, color: 'var(--fg-1)', fontFamily: 'var(--font-mono)' }}>{item.value}</div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* AI impact banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #FFF0F2 0%, #fff 60%)',
          border: '1px solid #FECDD3',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ color: 'var(--primary)', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6L2 8h6l2-6Z" fill="currentColor" opacity="0.15"/>
            <path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6L2 8h6l2-6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <span style={{ fontSize: 13, fontWeight: 570, color: 'var(--fg-1)' }}>
            AI impact projection:{' '}
          </span>
          <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>
            Targeted re-registration campaigns could recover{' '}
            <strong style={{ color: 'var(--primary)' }}>{REREGISTRATION_RATES.incrementalAthletes.toLocaleString()}</strong>{' '}
            additional athletes worth{' '}
            <strong style={{ color: 'var(--primary)' }}>€{REREGISTRATION_RATES.incrementalRevenue.toLocaleString()}</strong>{' '}
            in incremental revenue (82% vs 65% natural return rate).
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 570, color: 'var(--fg-1)', margin: 0 }}>Post-race Segments</h2>
        <p style={{ fontSize: 13, color: 'var(--fg-3)', margin: '4px 0 0' }}>
          Race day: May 17, 2026 · Maximize 2027 re-registrations
        </p>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: '0 0 360px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SEGMENTS.map(seg => (
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

          {selected && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Sample athletes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                {getAthletesByPostRaceSegment(selected.id as any).slice(0, 6).map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', background: 'var(--bg-1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-1)' }}>
                    <span style={{ fontSize: 12, color: 'var(--fg-1)' }}>{a.firstName} {a.lastName}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>{a.nationality}</span>
                      {a.finishTime && (
                        <span style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{a.finishTime}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {selected ? (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-xl)', padding: '20px' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: selected.color, display: 'inline-block' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 570, margin: 0 }}>{selected.label}</h3>
                  <span style={{ fontSize: 13, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
                    {sizes[selected.id as keyof typeof sizes].toLocaleString()} athletes
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-3)' }}>{selected.objective}</p>
              </div>
              <div style={{ borderBottom: '1px solid var(--border-1)', marginBottom: 20 }} />
              <div style={{ marginBottom: 20 }}>
                <ChannelSelector
                  available={(DEFAULT_CHANNELS[selected.id] ?? ['email']) as Channel[]}
                  selected={channels}
                  onChange={setChannels}
                  rationale={selected.rationale}
                />
              </div>
              <div style={{ borderBottom: '1px solid var(--border-1)', marginBottom: 20 }} />
              <CampaignGenerator gate="gate3" segment={selected.id} channels={channels} />
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--fg-3)', padding: 40 }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity="0.3">
              <path d="M8 20h24M20 8v24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <p style={{ fontSize: 13, textAlign: 'center', maxWidth: 240, margin: 0 }}>
              Select a post-race segment to generate your re-registration campaign
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
