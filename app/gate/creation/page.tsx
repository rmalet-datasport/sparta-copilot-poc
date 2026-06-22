'use client';

import { useState } from 'react';
import GateTimeline from '@/components/gates/GateTimeline';
import ChannelSelector from '@/components/gates/ChannelSelector';
import CampaignGenerator from '@/components/campaign/CampaignGenerator';
import { SEGMENT_SIZES, DEFAULT_CHANNELS, KPI, EVENT } from '@/lib/constants';
import type { Channel } from '@/lib/constants';

const SEGMENTS = [
  {
    id: 'past_finishers',
    label: 'Past Finishers',
    color: '#16A34A',
    colorBg: '#F0FDF4',
    description: 'Athletes who finished in 2021–2025 but haven\'t applied for 2026 yet.',
    size: SEGMENT_SIZES.gate0.past_finishers,
    objective: 'Re-activate before ballot closes. Emotional hook on their past experience.',
    icon: '🏅',
    rationale: { email: 'Warm reactivation — reference their past finish.', push: 'App-engaged returning athletes.' } as Partial<Record<Channel, string>>,
  },
  {
    id: 'past_refused',
    label: 'Past Refused',
    color: '#EA580C',
    colorBg: '#FFF7ED',
    description: 'Athletes who applied in previous editions but were not selected.',
    size: SEGMENT_SIZES.gate0.past_refused,
    objective: 'Restore confidence. Each lottery is a fresh start.',
    icon: '🔁',
    rationale: { email: 'Empathetic tone — acknowledge the past rejection.', sms: 'Soft nudge to apply again.' } as Partial<Record<Channel, string>>,
  },
  {
    id: 'international_targets',
    label: 'International Targets',
    color: '#2563EB',
    colorBg: '#EFF6FF',
    description: 'Runner audiences in DE, UK, NL, NO — new acquisition priority.',
    size: SEGMENT_SIZES.gate0.international_targets,
    objective: 'Present Copenhagen as the unmissable European marathon experience.',
    icon: '🌍',
    rationale: { email: 'Aspirational destination marketing.', instagram: 'Visual storytelling for international reach.' } as Partial<Record<Channel, string>>,
  },
  {
    id: 'external_prospects',
    label: 'External Prospects',
    color: '#7C3AED',
    colorBg: '#F5F3FF',
    description: 'Imported from Nike RC, Intersport, Parkrun. First contact with the event.',
    size: SEGMENT_SIZES.gate0.external_prospects,
    objective: 'Strong first impression. One clear CTA: apply now.',
    icon: '🤝',
    rationale: { email: 'Simple, clear. Reference the partner source for trust.' } as Partial<Record<Channel, string>>,
  },
];

const HISTORICAL = [
  { year: 2025, applicants: 18500, finishers: 10800, upsellRevenue: 298000 },
  { year: 2024, applicants: 17200, finishers: 10200, upsellRevenue: 271000 },
  { year: 2023, applicants: 15800, finishers: 9600, upsellRevenue: 244000 },
  { year: 2022, applicants: 14200, finishers: 8900, upsellRevenue: 218000 },
  { year: 2021, applicants: 11500, finishers: 7200, upsellRevenue: 176000 },
];

export default function CreationPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);

  const selected = SEGMENTS.find(s => s.id === selectedId);
  const kpi = KPI.gate0;

  const handleSelect = (id: string) => {
    if (selectedId === id) { setSelectedId(null); setChannels([]); return; }
    setSelectedId(id);
    setChannels((DEFAULT_CHANNELS[id] ?? ['email']) as Channel[]);
  };

  return (
    <div style={{ padding: '0 28px 28px' }}>
      <GateTimeline activeGate="creation" />

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, margin: '20px 0' }}>
        {[
          { label: '2026 Capacity', value: EVENT.capacity.toLocaleString(), sub: 'Marathon + Half' },
          { label: 'Target Applicants', value: EVENT.totalApplicants.toLocaleString(), sub: `vs ${kpi.historicalAvgApplicants.toLocaleString()} avg` },
          { label: 'Avg Revenue / Edition', value: `€${(kpi.avgRevenuePerEdition / 1000).toFixed(0)}k`, sub: 'Entry fees + upsells' },
          { label: 'Natural Return Rate', value: '65%', sub: 'Finishers → next edition' },
        ].map(item => (
          <div key={item.label} style={{ background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-lg)', padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 570, color: 'var(--fg-1)', fontFamily: 'var(--font-mono)' }}>{item.value}</div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Left */}
        <div style={{ flex: '0 0 360px' }}>
          {/* Historical data */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 570, color: 'var(--fg-2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Historical Performance
            </div>
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-1)' }}>
                    {['Year', 'Applicants', 'Finishers', 'Upsells'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--fg-3)', fontWeight: 570, fontSize: 11, letterSpacing: '0.04em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HISTORICAL.map((row, i) => (
                    <tr key={row.year} style={{ borderBottom: i < HISTORICAL.length - 1 ? '1px solid var(--border-1)' : 'none', background: i % 2 === 0 ? 'transparent' : 'var(--bg-2)' }}>
                      <td style={{ padding: '7px 12px', fontFamily: 'var(--font-mono)', color: 'var(--fg-1)', fontWeight: 570 }}>{row.year}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--fg-2)' }}>{row.applicants.toLocaleString()}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--fg-2)' }}>{row.finishers.toLocaleString()}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--fg-2)' }}>€{(row.upsellRevenue / 1000).toFixed(0)}k</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Segment cards */}
          <div style={{ fontSize: 12, fontWeight: 570, color: 'var(--fg-2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Pre-ballot Segments
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SEGMENTS.map(seg => (
              <button
                key={seg.id}
                onClick={() => handleSelect(seg.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  background: selectedId === seg.id ? seg.colorBg : 'var(--bg-1)',
                  border: `1.5px solid ${selectedId === seg.id ? seg.color : 'var(--border-1)'}`,
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: 20 }}>{seg.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 570, color: 'var(--fg-1)' }}>{seg.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 570, fontFamily: 'var(--font-mono)', color: selectedId === seg.id ? seg.color : 'var(--fg-1)' }}>
                      {seg.size.toLocaleString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--fg-3)', lineHeight: 1.4 }}>{seg.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: campaign panel */}
        {selected ? (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-xl)', padding: '20px' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 20 }}>{selected.icon}</span>
                  <h3 style={{ fontSize: 15, fontWeight: 570, margin: 0 }}>{selected.label}</h3>
                  <span style={{ fontSize: 13, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
                    {selected.size.toLocaleString()} athletes
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
              <CampaignGenerator gate="gate0" segment={selected.id} channels={channels} />
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--fg-3)', padding: 40 }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity="0.3">
              <rect x="8" y="10" width="24" height="20" rx="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M14 10V8M26 10V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M8 18h24" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <p style={{ fontSize: 13, textAlign: 'center', maxWidth: 240, margin: 0 }}>
              Select a pre-ballot segment to generate your acquisition campaign
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
