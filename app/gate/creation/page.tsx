'use client';

import { useState, useMemo } from 'react';
import GateTimeline from '@/components/gates/GateTimeline';
import ChannelSelector from '@/components/gates/ChannelSelector';
import CampaignGenerator from '@/components/campaign/CampaignGenerator';
import SegmentBuilder from '@/components/gates/SegmentBuilder';
import AISubSegments from '@/components/gates/AISubSegments';
import { SEGMENT_SIZES, DEFAULT_CHANNELS, KPI, EVENT } from '@/lib/constants';
import type { Channel } from '@/lib/constants';
import { filterAthletes } from '@/lib/db/segment-filter';
import type { CustomSegment } from '@/lib/types/segments';
import { buildSegmentDescription } from '@/lib/types/segments';

const SEGMENTS = [
  {
    id: 'past_finishers',
    label: 'Past Finishers',
    color: '#16A34A',
    colorBg: '#F0FDF4',
    description: 'Athletes who finished in 2021-2025 but have not applied for 2026 yet.',
    size: SEGMENT_SIZES.gate0.past_finishers,
    objective: 'Re-activate before ballot closes. Emotional hook on their past experience.',
    icon: '🏅',
    rationale: { email: 'Warm reactivation - reference their past finish.', push: 'App-engaged returning athletes.' } as Partial<Record<Channel, string>>,
  },
  {
    id: 'past_refused',
    label: 'Past Refused',
    color: '#EA580C',
    colorBg: '#FFF7ED',
    description: 'Athletes who applied in previous editions but were not selected.',
    size: SEGMENT_SIZES.gate0.past_refused,
    objective: 'Restore confidence. Each lottery is a fresh start.',
    icon: '🔄',
    rationale: { email: 'Empathetic tone - acknowledge the past rejection.', sms: 'Soft nudge to apply again.' } as Partial<Record<Channel, string>>,
  },
  {
    id: 'international_targets',
    label: 'International Targets',
    color: '#2563EB',
    colorBg: '#EFF6FF',
    description: 'Runner audiences in DE, UK, NL, NO - new acquisition priority.',
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
  { year: 2025, applicants: 18500, finishers: 10800 },
  { year: 2024, applicants: 17200, finishers: 10200 },
  { year: 2023, applicants: 15800, finishers: 9600 },
  { year: 2022, applicants: 14200, finishers: 8900 },
  { year: 2021, applicants: 11500, finishers: 7200 },
];

const GATE_TOTAL = Object.values(SEGMENT_SIZES.gate0).reduce((a, b) => a + b, 0);
const sizes = SEGMENT_SIZES.gate0;
const DB_SIZE = 500;
const SEGMENT_FIELD = 'gate0Segment';
const GATE_SEGMENTS = SEGMENTS.map(s => ({ id: s.id, label: s.label, color: s.color }));

export default function CreationPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [customSegments, setCustomSegments] = useState<CustomSegment[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingSegment, setEditingSegment] = useState<CustomSegment | null>(null);
  const [aiParentId, setAiParentId] = useState<string>('__full_pool__');

  const selected = SEGMENTS.find(s => s.id === selectedId);
  const selectedCustom = customSegments.find(s => s.id === selectedId);
  const kpi = KPI.gate0;

  const aiParentInfo = useMemo(() => {
    if (aiParentId === '__full_pool__') {
      return { label: 'All pre-ballot prospects', scaledSize: GATE_TOTAL, athleteIds: [] as string[] };
    }
    const seg = SEGMENTS.find(s => s.id === aiParentId);
    if (!seg) return { label: 'All prospects', scaledSize: GATE_TOTAL, athleteIds: [] as string[] };
    return {
      label: seg.label,
      scaledSize: seg.size,
      athleteIds: filterAthletes([], [seg.id], SEGMENT_FIELD).map(a => a.id),
    };
  }, [aiParentId]);

  const handleSelect = (id: string) => {
    if (selectedId === id) { setSelectedId(null); setChannels([]); return; }
    setSelectedId(id);
    setChannels((DEFAULT_CHANNELS[id] ?? ['email']) as Channel[]);
    if (SEGMENTS.some(s => s.id === id)) setAiParentId(id);
  };

  const handleAISubSelect = (seg: CustomSegment) => {
    setCustomSegments(prev => prev.some(s => s.id === seg.id) ? prev : [...prev, seg]);
    setSelectedId(seg.id);
    setChannels(['email']);
  };

  const getScaledCount = (seg: CustomSegment) => {
    const base = seg.baseSegmentIds.length > 0 ? seg.baseSegmentIds : undefined;
    const raw = filterAthletes(seg.filters, base, SEGMENT_FIELD).length;
    if (seg.baseSegmentIds.length === 0) return Math.round(raw / DB_SIZE * GATE_TOTAL);
    const baseTotal = seg.baseSegmentIds.reduce((sum, id) => sum + (sizes[id as keyof typeof sizes] ?? 0), 0);
    const baseRaw = filterAthletes([], seg.baseSegmentIds, SEGMENT_FIELD).length;
    return baseRaw > 0 ? Math.round(raw / baseRaw * baseTotal) : 0;
  };

  return (
    <div className="sparta-gate-page" style={{ padding: '0 28px 28px' }}>
      <GateTimeline activeGate="creation" />

      {/* KPI strip */}
      <div className="sparta-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, margin: '20px 0' }}>
        {[
          { label: '2026 Capacity', value: EVENT.capacity.toLocaleString('en-US'), sub: 'Marathon + Half' },
          { label: 'Target Applicants', value: EVENT.totalApplicants.toLocaleString('en-US'), sub: `vs ${kpi.historicalAvgApplicants.toLocaleString('en-US')} avg` },
          { label: 'Avg Revenue / Edition', value: '€' + (kpi.avgRevenuePerEdition / 1000).toFixed(0) + 'k', sub: 'Entry fees + upsells' },
          { label: 'Natural Return Rate', value: '65%', sub: 'Finishers > next edition' },
        ].map(item => (
          <div key={item.label} style={{ background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-lg)', padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 570, color: 'var(--fg-1)', fontFamily: 'var(--font-mono)' }}>{item.value}</div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      <div className="sparta-gate-layout" style={{ display: 'flex', gap: 20 }}>
        {/* Left */}
        <div className="sparta-gate-left" style={{ flex: '0 0 360px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 570, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pre-ballot Segments</span>
              <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--fg-3)' }}>{GATE_TOTAL.toLocaleString('en-US')} total prospects in this gate</span>
            </div>
            <button
              onClick={() => setShowBuilder(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-1)', background: 'var(--bg-1)', color: 'var(--fg-2)', fontSize: 11, cursor: 'pointer' }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              Create a segment
            </button>
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
                      {seg.size.toLocaleString('en-US')}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--fg-3)', lineHeight: 1.4 }}>{seg.description}</p>
                </div>
              </button>
            ))}

            <AISubSegments
              key={aiParentId}
              parentId={aiParentId}
              parentLabel={aiParentInfo.label}
              parentAthleteIds={aiParentInfo.athleteIds}
              parentScaledSize={aiParentInfo.scaledSize}
              onSelect={handleAISubSelect}
            />

            {customSegments.map(seg => (
              <div
                key={seg.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: selectedId === seg.id ? seg.colorBg : 'var(--bg-1)', border: `1.5px solid ${selectedId === seg.id ? seg.color : 'var(--border-1)'}`, borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all 0.15s' }}
                onClick={() => handleSelect(seg.id)}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 570, color: 'var(--fg-1)' }}>{seg.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 570, fontFamily: 'var(--font-mono)', color: selectedId === seg.id ? seg.color : 'var(--fg-1)' }}>
                      {getScaledCount(seg).toLocaleString('en-US')}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 1 }}>Custom segment</div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setEditingSegment(seg); }}
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--fg-2)', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 9l6-6 2 2-6 6H1.5V9z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 3.5l1 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  Edit
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setCustomSegments(p => p.filter(s => s.id !== seg.id)); if (selectedId === seg.id) { setSelectedId(null); setChannels([]); } }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)', padding: 4, display: 'flex', alignItems: 'center' }}
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M3 3l7 7M10 3l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                </button>
              </div>
            ))}
          </div>

          {/* Historical data */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 570, color: 'var(--fg-2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Historical Performance
            </div>
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-1)' }}>
                    {['Year', 'Applicants', 'Finishers'].map(h => (
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
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--fg-2)' }}>{row.applicants.toLocaleString('en-US')}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--fg-2)' }}>{row.finishers.toLocaleString('en-US')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: campaign panel */}
        {selectedCustom ? (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-xl)', padding: '20px' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ padding: '2px 7px', borderRadius: 'var(--radius-sm)', background: selectedCustom.colorBg, color: selectedCustom.color, fontSize: 10, fontWeight: 570, letterSpacing: '0.06em' }}>CUSTOM</span>
                  <h3 style={{ fontSize: 15, fontWeight: 570, margin: 0 }}>{selectedCustom.name}</h3>
                  <span style={{ fontSize: 13, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
                    {getScaledCount(selectedCustom).toLocaleString('en-US')} athletes
                  </span>
                </div>
                {selectedCustom.objective && <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-3)' }}>{selectedCustom.objective}</p>}
              </div>
              <div style={{ borderBottom: '1px solid var(--border-1)', marginBottom: 20 }} />
              <div style={{ marginBottom: 20 }}>
                <ChannelSelector available={['email', 'sms', 'push', 'instagram']} selected={channels} onChange={setChannels} rationale={{}} />
              </div>
              <div style={{ borderBottom: '1px solid var(--border-1)', marginBottom: 20 }} />
              <CampaignGenerator gate="gate0" segment="custom_segment" channels={channels} segmentDescription={buildSegmentDescription(selectedCustom)} gateLabel="Event Creation" segmentName={selectedCustom.name} segmentColor={selectedCustom.color} segmentColorBg={selectedCustom.colorBg} />
            </div>
          </div>
        ) : selected ? (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-xl)', padding: '20px' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 20 }}>{selected.icon}</span>
                  <h3 style={{ fontSize: 15, fontWeight: 570, margin: 0 }}>{selected.label}</h3>
                  <span style={{ fontSize: 13, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
                    {selected.size.toLocaleString('en-US')} athletes
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
              <CampaignGenerator gate="gate0" segment={selected.id} channels={channels} gateLabel="Event Creation" segmentName={selected.label} segmentColor={selected.color} segmentColorBg={selected.colorBg} />
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

      {(showBuilder || editingSegment) && (
        <SegmentBuilder
          existingCount={customSegments.length}
          gateTotal={GATE_TOTAL}
          segmentSizes={sizes}
          gateSegments={GATE_SEGMENTS}
          athleteSegmentField={SEGMENT_FIELD}
          initialSegment={editingSegment ?? undefined}
          onClose={() => { setShowBuilder(false); setEditingSegment(null); }}
          onSave={seg => {
            if (editingSegment) {
              setCustomSegments(p => p.map(s => s.id === seg.id ? seg : s));
            } else {
              setCustomSegments(p => [...p, seg]);
            }
            setShowBuilder(false);
            setEditingSegment(null);
            setSelectedId(seg.id);
            setChannels(['email']);
          }}
        />
      )}
    </div>
  );
}
