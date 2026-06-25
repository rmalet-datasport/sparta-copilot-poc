'use client';

import { useState, useMemo } from 'react';
import GateTimeline from '@/components/gates/GateTimeline';
import SegmentCard from '@/components/gates/SegmentCard';
import ChannelSelector from '@/components/gates/ChannelSelector';
import CampaignGenerator from '@/components/campaign/CampaignGenerator';
import SegmentBuilder, { type GateSegmentDef } from '@/components/gates/SegmentBuilder';
import AISubSegments from '@/components/gates/AISubSegments';
import { KPI } from '@/lib/constants';
import type { Channel } from '@/lib/constants';
import { filterAthletes } from '@/lib/db/segment-filter';
import type { CustomSegment, FilterCondition } from '@/lib/types/segments';
import { buildSegmentDescription, FILTER_FIELD_LABELS, FILTER_VALUE_OPTIONS } from '@/lib/types/segments';

const DB_SIZE = 500;
const GATE_TOTAL = KPI.gate1.totalApplications;

const GATE1_SEGMENTS = [
  {
    id: 'returning_marathon',
    label: 'Returning — Marathon',
    color: '#16A34A',
    colorBg: '#F0FDF4',
    description: 'Athletes who participated in a previous edition, now targeting the full 42K.',
    objective: 'Reward loyalty. Reference their past race. Strong emotional hook.',
    channels: ['email', 'push'] as Channel[],
    rationale: { email: 'Personalized message referencing past editions.', push: 'Countdown + training tips — active users.' } as Partial<Record<Channel, string>>,
    filters: [
      { id: 'f1', field: 'isReturningAthlete', value: 'true' },
      { id: 'f2', field: 'distance', value: 'Marathon 42K' },
    ] as FilterCondition[],
  },
  {
    id: 'returning_half',
    label: 'Returning — Half Marathon',
    color: '#2563EB',
    colorBg: '#EFF6FF',
    description: 'Returning athletes applying for the half marathon distance.',
    objective: 'Acknowledge their experience. Offer upgrade path to 42K.',
    channels: ['email', 'sms'] as Channel[],
    rationale: { email: 'Community angle — reference their journey.', sms: 'Early bird urgency.' } as Partial<Record<Channel, string>>,
    filters: [
      { id: 'f1', field: 'isReturningAthlete', value: 'true' },
      { id: 'f2', field: 'distance', value: 'Half Marathon 21K' },
    ] as FilterCondition[],
  },
  {
    id: 'new_marathon',
    label: 'First-Time — Marathon',
    color: '#EA580C',
    colorBg: '#FFF7ED',
    description: 'First-time applicants aiming for the full marathon. High ambition, higher dropout risk.',
    objective: 'Build excitement and commitment early.',
    channels: ['email', 'instagram'] as Channel[],
    rationale: { email: 'Welcome + what to expect.', instagram: 'Inspirational visuals for new runners.' } as Partial<Record<Channel, string>>,
    filters: [
      { id: 'f1', field: 'isReturningAthlete', value: 'false' },
      { id: 'f2', field: 'distance', value: 'Marathon 42K' },
    ] as FilterCondition[],
  },
  {
    id: 'new_half',
    label: 'First-Time — Half Marathon',
    color: '#7C3AED',
    colorBg: '#F5F3FF',
    description: 'New applicants for the half marathon. Easier entry point, high acquisition potential.',
    objective: 'Convert and create long-term fan. Entry to the Sparta community.',
    channels: ['email'] as Channel[],
    rationale: { email: 'Simple, welcoming. Low friction CTA.' } as Partial<Record<Channel, string>>,
    filters: [
      { id: 'f1', field: 'isReturningAthlete', value: 'false' },
      { id: 'f2', field: 'distance', value: 'Half Marathon 21K' },
    ] as FilterCondition[],
  },
];

const GATE_SEGMENTS: GateSegmentDef[] = GATE1_SEGMENTS.map(s => ({
  id: s.id,
  label: s.label,
  color: s.color,
  filters: s.filters,
}));

export default function RegistrationPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [customSegments, setCustomSegments] = useState<CustomSegment[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingSegment, setEditingSegment] = useState<CustomSegment | null>(null);
  const [aiParentId, setAiParentId] = useState<string>('__full_pool__');

  const kpi = KPI.gate1;
  const selectedStatic = GATE1_SEGMENTS.find(s => s.id === selectedId);
  const selectedCustom = customSegments.find(s => s.id === selectedId);

  const segmentSizes = useMemo(() => {
    return Object.fromEntries(
      GATE1_SEGMENTS.map(seg => [
        seg.id,
        Math.round(filterAthletes(seg.filters).length / DB_SIZE * GATE_TOTAL),
      ])
    );
  }, []);

  const aiParentInfo = useMemo(() => {
    if (aiParentId === '__full_pool__') {
      return { label: 'Tous les athletes (pré-loterie)', scaledSize: GATE_TOTAL, athleteIds: [] as string[], filters: undefined as FilterCondition[] | undefined };
    }
    const seg = GATE1_SEGMENTS.find(s => s.id === aiParentId);
    if (!seg) return { label: 'Tous les athletes', scaledSize: GATE_TOTAL, athleteIds: [] as string[], filters: undefined as FilterCondition[] | undefined };
    return {
      label: seg.label,
      scaledSize: segmentSizes[seg.id] ?? 0,
      athleteIds: filterAthletes(seg.filters).map(a => a.id),
      filters: seg.filters,
    };
  }, [aiParentId, segmentSizes]);

  const getCustomScaledCount = (seg: CustomSegment) => {
    const raw = filterAthletes(seg.filters).length;
    return Math.round(raw / DB_SIZE * GATE_TOTAL);
  };

  const handleSelect = (id: string) => {
    if (selectedId === id) { setSelectedId(null); setChannels([]); return; }
    setSelectedId(id);
    const staticSeg = GATE1_SEGMENTS.find(s => s.id === id);
    setChannels(staticSeg ? staticSeg.channels : ['email']);
    if (staticSeg) setAiParentId(id);
  };

  const handleAISubSelect = (seg: CustomSegment) => {
    setCustomSegments(prev => prev.some(s => s.id === seg.id) ? prev : [...prev, seg]);
    setSelectedId(seg.id);
    setChannels(['email']);
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
      <GateTimeline activeGate="registration" />

      {/* KPI strip */}
      <div className="sparta-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, margin: '20px 0' }}>
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

      <div className="sparta-gate-layout" style={{ display: 'flex', gap: 20 }}>
        {/* Left: segments */}
        <div className="sparta-gate-left" style={{ flex: '0 0 380px', display: 'flex', flexDirection: 'column', gap: 8 }}>
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
              Create a segment
            </button>
          </div>

          {GATE1_SEGMENTS.map(seg => (
            <SegmentCard
              key={seg.id}
              segment={seg.id}
              label={seg.label}
              size={segmentSizes[seg.id] ?? 0}
              description={seg.description}
              color={seg.color}
              colorBg={seg.colorBg}
              channels={seg.channels}
              isSelected={selectedId === seg.id}
              onClick={() => handleSelect(seg.id)}
            />
          ))}

          <AISubSegments
            key={aiParentId}
            parentId={aiParentId}
            parentLabel={aiParentInfo.label}
            parentAthleteIds={aiParentInfo.athleteIds}
            parentScaledSize={aiParentInfo.scaledSize}
            parentFilters={aiParentInfo.filters}
            onSelect={handleAISubSelect}
          />

          {/* Custom segments */}
          {customSegments.length > 0 && (
            <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                      <span style={{ fontSize: 13, fontWeight: 570, fontFamily: 'var(--font-mono)', color: selectedId === seg.id ? seg.color : 'var(--fg-1)' }}>{getCustomScaledCount(seg).toLocaleString()}</span>
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
                  <h3 style={{ fontSize: 15, fontWeight: 570, margin: 0, color: 'var(--fg-1)' }}>{selectedStatic.label}</h3>
                  <span style={{ fontSize: 13, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
                    {(segmentSizes[selectedStatic.id] ?? 0).toLocaleString()} athletes
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-3)' }}>{selectedStatic.objective}</p>
              </div>
              <div style={{ borderBottom: '1px solid var(--border-1)', marginBottom: 20 }} />
              <div style={{ marginBottom: 20 }}>
                <ChannelSelector
                  available={selectedStatic.channels}
                  selected={channels}
                  onChange={setChannels}
                  rationale={selectedStatic.rationale}
                />
              </div>
              <div style={{ borderBottom: '1px solid var(--border-1)', marginBottom: 20 }} />
              <CampaignGenerator
                gate="gate1"
                segment={selectedStatic.id}
                channels={channels}
                gateLabel="Registration"
                segmentName={selectedStatic.label}
                segmentColor={selectedStatic.color}
                segmentColorBg={selectedStatic.colorBg}
              />
            </div>
          </div>
        ) : selectedCustom ? (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-xl)', padding: '20px' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: selectedCustom.color, display: 'inline-block' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 570, margin: 0, color: 'var(--fg-1)' }}>{selectedCustom.name}</h3>
                  <span style={{ fontSize: 13, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
                    {getCustomScaledCount(selectedCustom).toLocaleString()} athletes
                  </span>
                  <span style={{ fontSize: 10, color: selectedCustom.color, background: selectedCustom.colorBg, padding: '2px 7px', borderRadius: 'var(--radius-full)', fontWeight: 570, letterSpacing: '0.04em' }}>
                    CUSTOM
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.6 }}>
                  {selectedCustom.objective ?? buildSegmentDescription(selectedCustom)}
                </p>
              </div>
              <div style={{ borderBottom: '1px solid var(--border-1)', marginBottom: 20 }} />
              <div style={{ marginBottom: 20 }}>
                <ChannelSelector available={['email', 'sms', 'push', 'instagram']} selected={channels} onChange={setChannels} />
              </div>
              <div style={{ borderBottom: '1px solid var(--border-1)', marginBottom: 20 }} />
              <CampaignGenerator
                gate="gate1"
                segment="custom_segment"
                channels={channels}
                segmentDescription={buildSegmentDescription(selectedCustom)}
                gateLabel="Registration"
                segmentName={selectedCustom.name}
                segmentColor={selectedCustom.color}
                segmentColorBg={selectedCustom.colorBg}
              />
            </div>
          </div>
        ) : (
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

      {(showBuilder || editingSegment) && (
        <SegmentBuilder
          existingCount={customSegments.length}
          gateTotal={GATE_TOTAL}
          segmentSizes={segmentSizes}
          gateSegments={GATE_SEGMENTS}
          initialSegment={editingSegment ?? undefined}
          onClose={() => { setShowBuilder(false); setEditingSegment(null); }}
          onSave={handleSaveCustom}
        />
      )}
    </div>
  );
}
