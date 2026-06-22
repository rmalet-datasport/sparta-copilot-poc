'use client';

import { useState } from 'react';
import GateTimeline from '@/components/gates/GateTimeline';
import SegmentCard from '@/components/gates/SegmentCard';
import ChannelSelector from '@/components/gates/ChannelSelector';
import CampaignGenerator from '@/components/campaign/CampaignGenerator';
import { SEGMENT_SIZES, DEFAULT_CHANNELS, KPI } from '@/lib/constants';
import type { Channel } from '@/lib/constants';
import { getAthletesByPostLotterySegment } from '@/lib/db/athletes';

const SEGMENTS = [
  {
    id: 'confirmed_engaged',
    label: 'Confirmed — Engaged',
    color: '#16A34A',
    colorBg: '#F0FDF4',
    description: 'Selected + engagement score > 60. Ready to buy upsells.',
    objective: 'Celebrate, upsell, countdown to race day.',
    rationale: { email: 'Confirmation + upsell showcase.', push: 'Countdown & training tips — they are active users.' } as Partial<Record<Channel, string>>,
  },
  {
    id: 'confirmed_passive',
    label: 'Confirmed — Passive',
    color: '#CA8A04',
    colorBg: '#FEFCE8',
    description: 'Selected but low engagement. Risk of DNS.',
    objective: 'Reignite excitement before it fades.',
    rationale: { email: 'Emotional storytelling.', sms: 'Upsell deadline reminder — creates urgency.' } as Partial<Record<Channel, string>>,
  },
  {
    id: 'waitlist_hot',
    label: 'Waitlist — Hot',
    color: '#EA580C',
    colorBg: '#FFF7ED',
    description: 'Waitlist position ≤ 200. Real chance of being called up.',
    objective: 'Keep hope alive, prepare them to move fast.',
    rationale: { email: 'Regular updates on spots.', sms: 'Instant alert if a spot opens.' } as Partial<Record<Channel, string>>,
  },
  {
    id: 'waitlist_cold',
    label: 'Waitlist — Cold',
    color: '#6B7280',
    colorBg: '#F9FAFB',
    description: 'Waitlist position > 200. Unlikely to race in 2026.',
    objective: 'Be honest, offer alternatives, keep 2027 door open.',
    rationale: { email: 'Honest message + Datasport alternatives. No overinvestment.' } as Partial<Record<Channel, string>>,
  },
  {
    id: 'refused_reactivatable',
    label: 'Refused — Reactivatable',
    color: '#DC2626',
    colorBg: '#FEF2F2',
    description: 'Refused but returning athlete. Long-term value is high.',
    objective: 'Cushion the blow, maintain loyalty, bridge to 2027.',
    rationale: { email: 'Loyalty recognition + other Datasport events.' } as Partial<Record<Channel, string>>,
  },
  {
    id: 'refused_lost',
    label: 'Refused — Lost',
    color: '#374151',
    colorBg: '#F1F5F9',
    description: 'First-time applicant, refused. Fragile relationship.',
    objective: 'Short, warm message. Leave door open.',
    rationale: { email: 'Minimal investment. Brief consolation + 2027 invite.' } as Partial<Record<Channel, string>>,
  },
];

export default function LotteryPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);

  const selected = SEGMENTS.find(s => s.id === selectedId);
  const sizes = SEGMENT_SIZES.gate2;
  const kpi = KPI.gate2;

  const handleSelect = (id: string) => {
    if (selectedId === id) {
      setSelectedId(null);
      setChannels([]);
      return;
    }
    setSelectedId(id);
    setChannels((DEFAULT_CHANNELS[id] ?? ['email']) as Channel[]);
  };

  return (
    <div style={{ padding: '0 28px 28px' }}>
      <GateTimeline activeGate="lottery" />

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, margin: '20px 0' }}>
        {[
          { label: 'Total Confirmed', value: kpi.totalConfirmed.toLocaleString(), sub: 'Registered for 2026' },
          { label: 'On Waitlist', value: kpi.totalWaitlist.toLocaleString(), sub: 'Awaiting spot' },
          { label: 'Refused', value: kpi.totalRefused.toLocaleString(), sub: 'Not selected' },
          { label: 'Avg Upsell Revenue', value: `€${kpi.avgUpsellRevenue}`, sub: `${Math.round(kpi.upsellConversionRate * 100)}% conversion` },
        ].map(item => (
          <div key={item.label} style={{ background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-lg)', padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 570, color: 'var(--fg-1)', fontFamily: 'var(--font-mono)' }}>{item.value}</div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 570, color: 'var(--fg-1)', margin: 0 }}>Post-lottery Segments</h2>
        <p style={{ fontSize: 13, color: 'var(--fg-3)', margin: '4px 0 0' }}>
          Lottery results: Jan 10, 2026 · Waitlist deadline: Mar 1, 2026
        </p>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Left: segment list */}
        <div style={{ flex: '0 0 380px', display: 'flex', flexDirection: 'column', gap: 8 }}>
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

          {/* Sample athletes */}
          {selected && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Sample athletes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                {getAthletesByPostLotterySegment(selected.id as any).slice(0, 6).map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', background: 'var(--bg-1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-1)' }}>
                    <span style={{ fontSize: 12, color: 'var(--fg-1)' }}>{a.firstName} {a.lastName}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>{a.nationality}</span>
                      {a.upsellRevenue !== undefined && (
                        <span style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>€{a.upsellRevenue}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: campaign panel */}
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
              <CampaignGenerator gate="gate2" segment={selected.id} channels={channels} />
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--fg-3)', padding: 40 }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity="0.3">
              <rect x="8" y="8" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="2"/>
              <path d="M20 16v8M16 20h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p style={{ fontSize: 13, textAlign: 'center', maxWidth: 240, margin: 0 }}>
              Select a segment to generate your post-lottery campaign
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
