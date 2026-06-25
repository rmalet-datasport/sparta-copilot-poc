'use client';

import { useState, useMemo } from 'react';
import GateTimeline from '@/components/gates/GateTimeline';
import SegmentCard from '@/components/gates/SegmentCard';
import ChannelSelector from '@/components/gates/ChannelSelector';
import CampaignGenerator from '@/components/campaign/CampaignGenerator';
import SegmentBuilder, { type GateSegmentDef } from '@/components/gates/SegmentBuilder';
import { SEGMENT_SIZES, DEFAULT_CHANNELS, KPI, REREGISTRATION_RATES } from '@/lib/constants';
import type { Channel } from '@/lib/constants';
import { getAthletesByPostRaceSegment } from '@/lib/db/athletes';
import { filterAthletes } from '@/lib/db/segment-filter';
import type { CustomSegment } from '@/lib/types/segments';
import { buildSegmentDescription, FILTER_FIELD_LABELS, FILTER_VALUE_OPTIONS } from '@/lib/types/segments';

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
  const [customSegments, setCustomSegments] = useState<CustomSegment[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingSegment, setEditingSegment] = useState<CustomSegment | null>(null);

  const selectedStatic = SEGMENTS.find(s => s.id === selectedId);
  const selectedCustom = customSegments.find(s => s.id === selectedId);
  const sizes = SEGMENT_SIZES.gate3;
  const kpi = KPI.gate3;
  const GATE_TOTAL = Object.values(sizes).reduce((a, b) => a + b, 0);
  const SEGMENT_FIELD = 'postRaceSegment';
  const GATE_SEGMENTS: GateSegmentDef[] = SEGMENTS.map(s => ({ id: s.id, label: s.label, color: s.color }));

  const getScaledCount = (seg: CustomSegment) => {
    const base = seg.baseSegmentIds.length > 0 ? seg.baseSegmentIds : undefined;
    const raw = filterAthletes(seg.filters, base, SEGMENT_FIELD).length;
    if (seg.baseSegmentIds.length === 0) return Math.round(raw / 500 * GATE_TOTAL);
    const baseTotal = seg.baseSegmentIds.reduce((sum, id) => sum + (sizes[id as keyof typeof sizes] ?? 0), 0);
    const baseRaw = filterAthletes([], seg.baseSegmentIds, SEGMENT_FIELD).length;
    return baseRaw > 0 ? Math.round(raw / baseRaw * baseTotal) : 0;
  };

  const customMatchedAthletes = useMemo(() => {
    if (!selectedCustom) return [];
    const base = selectedCustom.baseSegmentIds.length > 0 ? selectedCustom.baseSegmentIds : undefined;
    return filterAthletes(selectedCustom.filters, base, SEGMENT_FIELD);
  }, [selectedCustom]);

  const handleSelect = (id: string) => {
    if (selectedId === id) { setSelectedId(null); setChannels([]); return; }
    setSelectedId(id);
    const isCustom = customSegments.some(s => s.id === id);
    if (isCustom) {
      setChannels(['email']);
    } else {
      setChannels((DEFAULT_CHANNELS[id] ?? ['email']) as Channel[]);
    }
  };

  const handleSaveCustom = (seg: CustomSegment) => {
    if (editingSegment) {
      setCustomSegments(prev => prev.map(s => s.id === seg.id ? seg : s));
    } else {
      setCustomSegments(prev => [...prev, seg]);
    }
    setShowBuilder(false);
    setEditingSegment(null);
    handleSelect(seg.id);
  };

  const handleDeleteCustom = (id: string) => {
    setCustomSegments(prev => prev.filter(s => s.id !== id));
    if (selectedId === id) { setSelectedId(null); setChannels([]); }
  };

  return (
    <div className="sparta-gate-page" style={{ padding: '0 28px 28px' }}>
      <GateTimeline activeGate="finish" />

      {/* KPI strip */}
      <div className="sparta-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, margin: '20px 0' }}>
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
      <div style={{ background: 'linear-gradient(135deg, #FFF0F2 0%, #fff 60%)', border: '1px solid #FECDD3', borderRadius: 'var(--radius-lg)', padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ color: 'var(--primary)', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6L2 8h6l2-6Z" fill="currentColor" opacity="0.15" />
            <path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6L2 8h6l2-6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <span style={{ fontSize: 13, fontWeight: 570, color: 'var(--fg-1)' }}>AI impact projection: </span>
          <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>
            Targeted re-registration campaigns could recover{' '}
            <strong style={{ color: 'var(--primary)' }}>{REREGISTRATION_RATES.incrementalAthletes.toLocaleString()}</strong>{' '}
            additional athletes worth{' '}
            <strong style={{ color: 'var(--primary)' }}>€{REREGISTRATION_RATES.incrementalRevenue.toLocaleString()}</strong>{' '}
            in incremental revenue ({Math.round(REREGISTRATION_RATES.aiTargetedReturnRate * 100)}% vs {Math.round(REREGISTRATION_RATES.naturalReturnRate * 100)}% natural return rate).
          </span>
        </div>
      </div>

      <div className="sparta-gate-layout" style={{ display: 'flex', gap: 20 }}>
        <div className="sparta-gate-left" style={{ flex: '0 0 360px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 570, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Post-race Segments</span>
              <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--fg-3)' }}>{GATE_TOTAL.toLocaleString()} total athletes in this gate</span>
            </div>
            <button
              onClick={() => setShowBuilder(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-1)', background: 'var(--bg-1)', color: 'var(--fg-2)', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              Create a segment
            </button>
          </div>

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

          {/* Custom segments */}
          {customSegments.length > 0 && customSegments.map(seg => (
            <div
              key={seg.id}
              onClick={() => handleSelect(seg.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: selectedId === seg.id ? seg.colorBg : 'var(--bg-1)', border: `1.5px solid ${selectedId === seg.id ? seg.color : 'var(--border-1)'}`, borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all 0.15s' }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 570, color: 'var(--fg-1)' }}>{seg.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 570, fontFamily: 'var(--font-mono)', color: selectedId === seg.id ? seg.color : 'var(--fg-1)' }}>{getScaledCount(seg).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 1 }}>Custom segment</div>
              </div>
              <button onClick={e => { e.stopPropagation(); setEditingSegment(seg); }} style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--fg-2)', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 9l6-6 2 2-6 6H1.5V9z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 3.5l1 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                Edit
              </button>
              <button onClick={e => { e.stopPropagation(); handleDeleteCustom(seg.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)', padding: 4, display: 'flex', alignItems: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M3 3l7 7M10 3l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              </button>
            </div>
          ))}

          {/* Sample athletes */}
          {(selectedStatic || selectedCustom) && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Sample athletes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                {selectedStatic
                  ? getAthletesByPostRaceSegment(selectedStatic.id as any).slice(0, 6).map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', background: 'var(--bg-1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-1)' }}>
                      <span style={{ fontSize: 12, color: 'var(--fg-1)' }}>{a.firstName} {a.lastName}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>{a.nationality}</span>
                        {a.finishTime && <span style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{a.finishTime}</span>}
                      </div>
                    </div>
                  ))
                  : customMatchedAthletes.slice(0, 6).map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', background: 'var(--bg-1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-1)' }}>
                      <span style={{ fontSize: 12, color: 'var(--fg-1)' }}>{a.firstName} {a.lastName}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>{a.nationality}</span>
                        <span style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{a.age} ans</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        {/* Right: campaign panel */}
        {selectedStatic ? (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-xl)', padding: '20px' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: selectedStatic.color, display: 'inline-block' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 570, margin: 0 }}>{selectedStatic.label}</h3>
                  <span style={{ fontSize: 13, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
                    {sizes[selectedStatic.id as keyof typeof sizes].toLocaleString()} athletes
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-3)' }}>{selectedStatic.objective}</p>
              </div>
              <div style={{ borderBottom: '1px solid var(--border-1)', marginBottom: 20 }} />
              <div style={{ marginBottom: 20 }}>
                <ChannelSelector
                  available={(DEFAULT_CHANNELS[selectedStatic.id] ?? ['email']) as Channel[]}
                  selected={channels}
                  onChange={setChannels}
                  rationale={selectedStatic.rationale}
                />
              </div>
              <div style={{ borderBottom: '1px solid var(--border-1)', marginBottom: 20 }} />
              <CampaignGenerator gate="gate3" segment={selectedStatic.id} channels={channels} gateLabel="Race Finish" segmentName={selectedStatic.label} segmentColor={selectedStatic.color} segmentColorBg={selectedStatic.colorBg} />
            </div>
          </div>
        ) : selectedCustom ? (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-xl)', padding: '20px' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: selectedCustom.color, display: 'inline-block' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 570, margin: 0 }}>{selectedCustom.name}</h3>
                  <span style={{ fontSize: 13, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
                    {getScaledCount(selectedCustom).toLocaleString()} athletes
                  </span>
                  <span style={{ fontSize: 10, color: selectedCustom.color, background: selectedCustom.colorBg, padding: '2px 7px', borderRadius: 'var(--radius-full)', fontWeight: 570, letterSpacing: '0.04em' }}>
                    CUSTOM
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.6 }}>
                  {selectedCustom.baseSegmentIds.length > 0 && (
                    <span style={{ display: 'block' }}>
                      <span style={{ color: 'var(--fg-2)', fontWeight: 570 }}>Scope:</span>{' '}
                      {selectedCustom.baseSegmentLabels.join(', ')}
                    </span>
                  )}
                  {selectedCustom.filters.length > 0 && (
                    <span style={{ display: 'block' }}>
                      {selectedCustom.filters.map(f => {
                        const val = FILTER_VALUE_OPTIONS[f.field]?.find(o => o.value === f.value)?.label ?? f.value;
                        return `${FILTER_FIELD_LABELS[f.field]}: ${val}`;
                      }).join(' · ')}
                    </span>
                  )}
                  {selectedCustom.baseSegmentIds.length === 0 && selectedCustom.filters.length === 0 && 'All athletes, no filter'}
                </p>
              </div>
              <div style={{ borderBottom: '1px solid var(--border-1)', marginBottom: 20 }} />
              <div style={{ marginBottom: 20 }}>
                <ChannelSelector
                  available={['email', 'sms', 'push', 'instagram']}
                  selected={channels}
                  onChange={setChannels}
                />
              </div>
              <div style={{ borderBottom: '1px solid var(--border-1)', marginBottom: 20 }} />
              <CampaignGenerator
                gate="gate3"
                segment="custom_segment"
                channels={channels}
                segmentDescription={buildSegmentDescription(selectedCustom)}
                gateLabel="Race Finish"
                segmentName={selectedCustom.name}
                segmentColor={selectedCustom.color}
                segmentColorBg={selectedCustom.colorBg}
              />
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--fg-3)', padding: 40 }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity="0.3">
              <path d="M8 20h24M20 8v24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <p style={{ fontSize: 13, textAlign: 'center', maxWidth: 240, margin: 0 }}>
              Select a post-race segment to generate your re-registration campaign
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
          onSave={handleSaveCustom}
        />
      )}
    </div>
  );
}
