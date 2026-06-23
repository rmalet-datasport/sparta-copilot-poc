'use client';

import { useState, useMemo } from 'react';
import GateTimeline from '@/components/gates/GateTimeline';
import SegmentCard from '@/components/gates/SegmentCard';
import ChannelSelector from '@/components/gates/ChannelSelector';
import CampaignGenerator from '@/components/campaign/CampaignGenerator';
import SegmentBuilder, { type GateSegmentDef } from '@/components/gates/SegmentBuilder';
import { SEGMENT_SIZES, DEFAULT_CHANNELS, KPI } from '@/lib/constants';
import type { Channel } from '@/lib/constants';
import { getAthletesByPreLotterySegment } from '@/lib/db/athletes';
import { filterAthletes } from '@/lib/db/segment-filter';
import type { CustomSegment } from '@/lib/types/segments';
import { buildSegmentDescription, FILTER_FIELD_LABELS, FILTER_VALUE_OPTIONS } from '@/lib/types/segments';

const SEGMENTS = [
  {
    id: 'ambassador',
    label: 'Ambassadors',
    color: '#16A34A',
    colorBg: '#F0FDF4',
    quadrant: { row: 0, col: 1 },
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
    quadrant: { row: 0, col: 0 },
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
    quadrant: { row: 1, col: 1 },
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
    quadrant: { row: 1, col: 0 },
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
  const [customSegments, setCustomSegments] = useState<CustomSegment[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);

  const selectedStatic = SEGMENTS.find(s => s.id === selectedId);
  const selectedCustom = customSegments.find(s => s.id === selectedId);

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
    setCustomSegments(prev => [...prev, seg]);
    setShowBuilder(false);
    handleSelect(seg.id);
  };

  const handleDeleteCustom = (id: string) => {
    setCustomSegments(prev => prev.filter(s => s.id !== id));
    if (selectedId === id) { setSelectedId(null); setChannels([]); }
  };

  const kpi = KPI.gate1;
  const sizes = SEGMENT_SIZES.gate1;
  const GATE_TOTAL = Object.values(sizes).reduce((a, b) => a + b, 0);
  const SEGMENT_FIELD = 'preLotterySegment';

  const GATE_SEGMENTS: GateSegmentDef[] = SEGMENTS.map(s => ({ id: s.id, label: s.label, color: s.color }));

  const getScaledCount = (seg: CustomSegment) => {
    const base = seg.baseSegmentIds.length > 0 ? seg.baseSegmentIds : undefined;
    const raw = filterAthletes(seg.filters, base, SEGMENT_FIELD).length;
    if (seg.baseSegmentIds.length === 0) return Math.round(raw / 500 * GATE_TOTAL);
    const baseTotal = seg.baseSegmentIds.reduce((sum, id) => sum + (sizes[id as keyof typeof sizes] ?? 0), 0);
    const baseRaw = filterAthletes([], seg.baseSegmentIds, SEGMENT_FIELD).length;
    return baseRaw > 0 ? Math.round(raw / baseRaw * baseTotal) : 0;
  };

  return (
    <div style={{ padding: '0 28px 28px' }}>
      <GateTimeline activeGate="registration" />

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, margin: '20px 0' }}>
        {[
          { label: 'Total Applications', value: kpi.totalApplications.toLocaleString(), sub: '2026 ballot' },
          { label: 'Avg Candidacy Score', value: `${kpi.avgCandidacyScore}/100`, sub: 'Composite score' },
          { label: 'Avg Anticipated Value', value: `€${kpi.avgAnticipatedValue}`, sub: 'Per selected athlete' },
          { label: 'External Prospects', value: kpi.externalProspects.toLocaleString(), sub: 'Partner imports' },
        ].map(kpiItem => (
          <div key={kpiItem.label} style={{ background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-lg)', padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 4 }}>{kpiItem.label}</div>
            <div style={{ fontSize: 20, fontWeight: 570, color: 'var(--fg-1)', fontFamily: 'var(--font-mono)' }}>{kpiItem.value}</div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{kpiItem.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Left: segment matrix + custom segments */}
        <div style={{ flex: '0 0 380px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 570, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pre-lottery Segments</span>
              <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--fg-3)' }}>{GATE_TOTAL.toLocaleString()} total athletes in this gate</span>
            </div>
            <button
              onClick={() => setShowBuilder(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-1)', background: 'var(--bg-1)', color: 'var(--fg-2)', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              Créer un segment
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
          {customSegments.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {customSegments.map(seg => (
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
                    <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 1 }}>Segment personnalisé</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleDeleteCustom(seg.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)', padding: 4, display: 'flex', alignItems: 'center' }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M3 3l7 7M10 3l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Sample athletes */}
          {(selectedStatic || selectedCustom) && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Sample athletes ({selectedStatic?.label ?? selectedCustom?.name})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
                {selectedStatic
                  ? getAthletesByPreLotterySegment(selectedStatic.id as any).slice(0, 8).map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', background: 'var(--bg-1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-1)' }}>
                      <span style={{ fontSize: 12, color: 'var(--fg-1)' }}>{a.firstName} {a.lastName}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>{a.nationality}</span>
                        <span style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{a.candidacyScore}</span>
                      </div>
                    </div>
                  ))
                  : customMatchedAthletes.slice(0, 8).map(a => (
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
        {selectedStatic && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-xl)', padding: '20px' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: selectedStatic.color, display: 'inline-block' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 570, margin: 0, color: 'var(--fg-1)' }}>{selectedStatic.label}</h3>
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
              <CampaignGenerator gate="gate1" segment={selectedStatic.id} channels={channels} />
            </div>
          </div>
        )}

        {selectedCustom && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-xl)', padding: '20px' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: selectedCustom.color, display: 'inline-block' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 570, margin: 0, color: 'var(--fg-1)' }}>{selectedCustom.name}</h3>
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
                  {selectedCustom.baseSegmentIds.length === 0 && selectedCustom.filters.length === 0 && 'Tous les athletes, aucun filtre'}
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
                gate="gate1"
                segment="custom_segment"
                channels={channels}
                segmentDescription={buildSegmentDescription(selectedCustom)}
              />
            </div>
          </div>
        )}

        {!selectedStatic && !selectedCustom && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--fg-3)', padding: 40 }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity="0.3">
              <rect x="8" y="8" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="2" />
              <path d="M20 16v8M16 20h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p style={{ fontSize: 13, textAlign: 'center', maxWidth: 240, margin: 0 }}>
              Select a segment to start generating your campaign
            </p>
          </div>
        )}
      </div>

      {showBuilder && (
        <SegmentBuilder
          existingCount={customSegments.length}
          gateTotal={GATE_TOTAL}
          segmentSizes={sizes}
          gateSegments={GATE_SEGMENTS}
          athleteSegmentField={SEGMENT_FIELD}
          onClose={() => setShowBuilder(false)}
          onSave={handleSaveCustom}
        />
      )}
    </div>
  );
}
