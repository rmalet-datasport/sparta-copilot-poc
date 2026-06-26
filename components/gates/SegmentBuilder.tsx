'use client';

import { useState, useMemo } from 'react';
import { filterAthletes } from '@/lib/db/segment-filter';
import type { CustomSegment, FilterCondition, FilterField } from '@/lib/types/segments';
import {
  FILTER_FIELD_LABELS,
  FILTER_VALUE_OPTIONS,
  CUSTOM_SEGMENT_COLORS,
} from '@/lib/types/segments';

const ALL_FIELDS: FilterField[] = [
  'gender', 'age_min', 'age_max', 'nationality', 'isReturningAthlete',
  'total_editions_min', 'total_editions_max', 'engagement_min', 'city_contains', 'distance', 'hasInsurance',
];
const DB_SIZE = 500;

export interface GateSegmentDef {
  id: string
  label: string
  color: string
  filters?: FilterCondition[]  // present for AI-generated segments
}

interface SegmentBuilderProps {
  existingCount: number
  gateTotal: number
  segmentSizes: Record<string, number>
  gateSegments: GateSegmentDef[]
  athleteSegmentField?: string
  initialSegment?: CustomSegment
  onClose: () => void
  onSave: (segment: CustomSegment) => void
}

export default function SegmentBuilder({
  existingCount,
  gateTotal,
  segmentSizes,
  gateSegments,
  athleteSegmentField,
  initialSegment,
  onClose,
  onSave,
}: SegmentBuilderProps) {
  const [name, setName] = useState(() => initialSegment?.name ?? '');
  const [objective, setObjective] = useState(() => initialSegment?.objective ?? '');
  const [filters, setFilters] = useState<FilterCondition[]>(() => initialSegment?.filters ?? []);
  const [selectedBaseIds, setSelectedBaseIds] = useState<string[]>(() => initialSegment?.baseSegmentIds ?? []);

  // NL parsing state (describe criteria)
  const [nlQuery, setNlQuery] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [nlInterpretation, setNlInterpretation] = useState<string | null>(null);
  const [nlError, setNlError] = useState<string | null>(null);

  // Objective-based suggestion state (describe a goal)
  const [objQuery, setObjQuery] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<{ portrait: string; insights: string[]; rationale: string } | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const activeBaseIds = selectedBaseIds.length > 0 ? selectedBaseIds : undefined;

  // For AI segments (filter-based), compute a pre-filtered athlete ID set
  const resolvedBaseAthleteIds = useMemo(() => {
    if (selectedBaseIds.length === 0) return undefined;
    const aiSegs = gateSegments.filter(s => s.filters && selectedBaseIds.includes(s.id));
    if (aiSegs.length === 0) return undefined;
    const ids = new Set<string>();
    aiSegs.forEach(seg => filterAthletes(seg.filters!).forEach(a => ids.add(a.id)));
    return ids;
  }, [selectedBaseIds, gateSegments]);

  const matchCount = useMemo(() => {
    if (resolvedBaseAthleteIds) return filterAthletes(filters, undefined, undefined, resolvedBaseAthleteIds).length;
    return filterAthletes(filters, activeBaseIds, athleteSegmentField).length;
  }, [filters, activeBaseIds, athleteSegmentField, resolvedBaseAthleteIds]);

  const baseRawCount = useMemo(() => {
    if (selectedBaseIds.length === 0) return DB_SIZE;
    if (resolvedBaseAthleteIds) return resolvedBaseAthleteIds.size;
    return filterAthletes([], selectedBaseIds, athleteSegmentField).length;
  }, [selectedBaseIds, athleteSegmentField, resolvedBaseAthleteIds]);

  const effectiveTotal = selectedBaseIds.length === 0
    ? gateTotal
    : selectedBaseIds.reduce((sum, id) => sum + (segmentSizes[id] ?? 0), 0);

  const scaledCount = baseRawCount > 0
    ? Math.round(matchCount / baseRawCount * effectiveTotal)
    : 0;

  const toggleBase = (id: string) => {
    setSelectedBaseIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const usedFields = new Set(filters.map(f => f.field));
  const canAdd = usedFields.size < ALL_FIELDS.length;

  const addFilter = () => {
    const field = ALL_FIELDS.find(f => !usedFields.has(f));
    if (!field) return;
    const defaultValue = FILTER_VALUE_OPTIONS[field]?.[0]?.value ?? '';
    setFilters(prev => [...prev, { id: `f${prev.length}_${Date.now()}`, field, value: defaultValue }]);
  };

  const updateFilter = (id: string, patch: Partial<Pick<FilterCondition, 'field' | 'value'>>) => {
    setFilters(prev => prev.map(f => {
      if (f.id !== id) return f;
      if (patch.field && patch.field !== f.field) {
        return { ...f, field: patch.field, value: FILTER_VALUE_OPTIONS[patch.field]?.[0]?.value ?? '' };
      }
      return { ...f, ...patch };
    }));
  };

  const removeFilter = (id: string) => setFilters(prev => prev.filter(f => f.id !== id));

  const handleParseNL = async () => {
    if (!nlQuery.trim()) return;
    setIsParsing(true);
    setNlError(null);
    setNlInterpretation(null);
    try {
      const res = await fetch('/api/ai/parse-segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: nlQuery }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const newFilters: FilterCondition[] = (data.filters ?? []).map((f: { field: string; value: string }, i: number) => ({
        id: `nl_${i}_${Date.now()}`,
        field: f.field as FilterField,
        value: f.value,
      }));
      setFilters(newFilters);
      setNlInterpretation(data.interpretation ?? null);
      if (!name && data.interpretation) setName(data.interpretation);
    } catch {
      setNlError('Analysis failed. Check your API key.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSuggestSegment = async () => {
    if (!objQuery.trim()) return;
    setIsSuggesting(true);
    setSuggestionError(null);
    setSuggestion(null);
    try {
      const res = await fetch('/api/ai/suggest-segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective: objQuery }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const newFilters: FilterCondition[] = (data.filters ?? []).map((f: { field: string; value: string }, i: number) => ({
        id: `sg_${i}_${Date.now()}`,
        field: f.field as FilterField,
        value: f.value,
      }));
      setFilters(newFilters);
      setSuggestion({ portrait: data.portrait ?? '', insights: data.insights ?? [], rationale: data.rationale ?? '' });
      if (!name && data.portrait) setName(objQuery.slice(0, 48));
    } catch {
      setSuggestionError('Analysis failed. Check your API key.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const { color, colorBg } = initialSegment
      ? { color: initialSegment.color, colorBg: initialSegment.colorBg }
      : CUSTOM_SEGMENT_COLORS[existingCount % CUSTOM_SEGMENT_COLORS.length];
    const baseSegmentLabels = gateSegments
      .filter(s => selectedBaseIds.includes(s.id))
      .map(s => s.label);
    onSave({
      id: initialSegment?.id ?? `custom_${Date.now()}`,
      name: name.trim(),
      color,
      colorBg,
      filters,
      baseSegmentIds: selectedBaseIds,
      baseSegmentLabels,
      objective: objective.trim() || undefined,
    });
  };

  const inputStyle: React.CSSProperties = {
    padding: '7px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-1)',
    background: 'var(--bg-1)',
    color: 'var(--fg-1)',
    fontSize: 12,
    fontFamily: 'var(--font-sans)',
    outline: 'none',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,20,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-1)', borderRadius: 'var(--radius-xl)', padding: 28, width: 540, maxWidth: '92vw', border: '1px solid var(--border-1)', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 570, color: 'var(--fg-1)' }}>
          {initialSegment ? 'Edit segment' : 'New segment'}
        </h3>

        {/* Name */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Name</div>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="E.g. Danish women 25—35"
            style={{ ...inputStyle, width: '100%' }}
            autoFocus
          />
        </div>

        {/* NL AI section */}
        <div style={{ marginBottom: 20, padding: '14px 16px', background: 'var(--bg-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1l1 3h3l-2.5 2 1 3-2.5-2-2.5 2 1-3L3 4h3l.5-3Z" fill="var(--primary)" opacity="0.8"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 570, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Describe in plain language
            </span>
          </div>

          <textarea
            value={nlQuery}
            onChange={e => setNlQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleParseNL(); }}
            placeholder="E.g. women aged 25—35 from Copenhagen who participated in at least 2 editions and are highly engaged..."
            rows={2}
            style={{ ...inputStyle, width: '100%', resize: 'none', lineHeight: 1.5, marginBottom: 8 }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleParseNL}
              disabled={!nlQuery.trim() || isParsing}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: !nlQuery.trim() || isParsing ? 'var(--bg-3)' : 'var(--primary)',
                color: !nlQuery.trim() || isParsing ? 'var(--fg-3)' : 'white',
                fontSize: 12,
                fontWeight: 570,
                cursor: !nlQuery.trim() || isParsing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
              }}
            >
              {isParsing ? (
                <>
                  <span style={{ width: 10, height: 10, border: '1.5px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  Analyzing...
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </>
              ) : 'Analyze →'}
            </button>
            <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>⌘ + Enter</span>
          </div>

          {nlInterpretation && (
            <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 'var(--radius-md)', background: '#F0FDF4', border: '1px solid #86EFAC', display: 'flex', alignItems: 'flex-start', gap: 7 }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="6.5" cy="6.5" r="6" stroke="#16A34A" strokeWidth="1.2"/>
                <path d="M4 6.5l2 2 3-3" stroke="#16A34A" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 12, color: '#15803D' }}>{nlInterpretation}</span>
            </div>
          )}

          {nlError && (
            <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 'var(--radius-md)', background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 12, color: '#DC2626' }}>
              {nlError}
            </div>
          )}
        </div>

        {/* Objective-based AI suggestion */}
        <div style={{ marginBottom: 20, padding: '14px 16px', background: 'var(--bg-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="var(--primary)" strokeWidth="1.2"/>
              <path d="M6.5 4v3.5M6.5 9v.5" stroke="var(--primary)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 570, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Define by business goal
            </span>
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--fg-3)', lineHeight: 1.5 }}>
            Describe what you want to achieve — the AI analyses the database distributions and suggests the best matching profile, with criteria and rationale.
          </p>

          <textarea
            value={objQuery}
            onChange={e => setObjQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSuggestSegment(); }}
            placeholder="E.g. I want the athletes most likely to re-register in 2027, around 3,000 people"
            rows={2}
            style={{ ...inputStyle, width: '100%', resize: 'none', lineHeight: 1.5, marginBottom: 8 }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleSuggestSegment}
              disabled={!objQuery.trim() || isSuggesting}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: !objQuery.trim() || isSuggesting ? 'var(--bg-3)' : 'var(--secondary)',
                color: !objQuery.trim() || isSuggesting ? 'var(--fg-3)' : 'white',
                fontSize: 12,
                fontWeight: 570,
                cursor: !objQuery.trim() || isSuggesting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
              }}
            >
              {isSuggesting ? (
                <>
                  <span style={{ width: 10, height: 10, border: '1.5px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  Analyzing...
                </>
              ) : 'Suggest a segment →'}
            </button>
            <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>⌘ + Enter</span>
          </div>

          {suggestion && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Portrait */}
              <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-1)', border: '1px solid var(--border-1)' }}>
                <div style={{ fontSize: 10, fontWeight: 570, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Segment portrait</div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-1)', lineHeight: 1.6 }}>{suggestion.portrait}</p>
              </div>

              {/* Insights libres */}
              {suggestion.insights.length > 0 && (
                <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <div style={{ fontSize: 10, fontWeight: 570, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Non-filterable criteria — keep in mind</div>
                  <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {suggestion.insights.map((ins, i) => (
                      <li key={i} style={{ fontSize: 12, color: '#78350F', lineHeight: 1.5 }}>{ins}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Rationale */}
              {suggestion.rationale && (
                <div style={{ fontSize: 11, color: 'var(--fg-3)', fontStyle: 'italic', lineHeight: 1.5, paddingLeft: 2 }}>
                  {suggestion.rationale}
                </div>
              )}
            </div>
          )}

          {suggestionError && (
            <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 'var(--radius-md)', background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 12, color: '#DC2626' }}>
              {suggestionError}
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border-1)', marginBottom: 20 }} />

        {/* Scope */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Scope</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              onClick={() => setSelectedBaseIds([])}
              style={{ padding: '5px 11px', borderRadius: 'var(--radius-full)', border: `1.5px solid ${selectedBaseIds.length === 0 ? 'var(--fg-2)' : 'var(--border-1)'}`, background: selectedBaseIds.length === 0 ? 'var(--fg-1)' : 'var(--bg-1)', color: selectedBaseIds.length === 0 ? 'var(--bg-1)' : 'var(--fg-3)', fontSize: 11, fontWeight: selectedBaseIds.length === 0 ? 570 : 400, cursor: 'pointer', transition: 'all 0.15s' }}
            >
              All athletes
            </button>
            {gateSegments.map(seg => {
              const isActive = selectedBaseIds.includes(seg.id);
              return (
                <button
                  key={seg.id}
                  onClick={() => toggleBase(seg.id)}
                  style={{ padding: '5px 11px', borderRadius: 'var(--radius-full)', border: `1.5px solid ${isActive ? seg.color : 'var(--border-1)'}`, background: isActive ? seg.color : 'var(--bg-1)', color: isActive ? 'white' : 'var(--fg-2)', fontSize: 11, fontWeight: isActive ? 570 : 400, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  {!isActive && <span style={{ width: 7, height: 7, borderRadius: '50%', background: seg.color, display: 'inline-block', flexShrink: 0 }} />}
                  {seg.label}
                </button>
              );
            })}
          </div>
          {selectedBaseIds.length > 0 && (
            <div style={{ marginTop: 6, fontSize: 11, color: 'var(--fg-3)' }}>
              Filters applied to {selectedBaseIds.length === 1 ? 'this segment' : `these ${selectedBaseIds.length} segments`}
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border-1)', marginBottom: 20 }} />

        {/* Demographic filters */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Filters
            {filters.length > 0 && <span style={{ marginLeft: 6, color: 'var(--primary)', fontWeight: 570 }}>{filters.length}</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filters.map(f => (
              <FilterRow
                key={f.id}
                filter={f}
                usedFields={usedFields}
                onChange={patch => updateFilter(f.id, patch)}
                onRemove={() => removeFilter(f.id)}
                inputStyle={inputStyle}
              />
            ))}
          </div>

          {canAdd && (
            <button
              onClick={addFilter}
              style={{ marginTop: filters.length > 0 ? 8 : 0, width: '100%', padding: '7px 0', border: '1px dashed var(--border-2)', borderRadius: 'var(--radius-md)', background: 'none', color: 'var(--fg-3)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              Add a filter
            </button>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border-1)', marginBottom: 20 }} />

        {/* Objective */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Objective & context
            <span style={{ marginLeft: 6, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— guides AI generation</span>
          </div>
          <textarea
            value={objective}
            onChange={e => setObjective(e.target.value)}
            placeholder="E.g. These women all finished with a PR. Congratulations message + 2027 early bird. Inspiring tone, not promotional."
            rows={2}
            style={{ ...inputStyle, width: '100%', resize: 'vertical', lineHeight: 1.5 }}
          />
        </div>

        {/* Match count */}
        <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-2)', border: '1px solid var(--border-1)', marginBottom: 24, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 570, fontFamily: 'var(--font-mono)', color: 'var(--fg-1)' }}>
            {scaledCount.toLocaleString('en-US')}
          </span>
          <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>
            {selectedBaseIds.length === 0 && filters.length === 0
              ? 'athletes in this gate (no filter applied)'
              : 'athletes match these criteria'}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-1)', background: 'var(--bg-1)', color: 'var(--fg-2)', fontSize: 13, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            style={{ padding: '8px 18px', borderRadius: 'var(--radius-md)', border: 'none', background: name.trim() ? 'var(--primary)' : 'var(--bg-3)', color: name.trim() ? 'white' : 'var(--fg-3)', fontSize: 13, fontWeight: 570, cursor: name.trim() ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}
          >
            {initialSegment ? 'Save changes' : 'Create segment'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface FilterRowProps {
  filter: FilterCondition;
  usedFields: Set<FilterField>;
  onChange: (patch: Partial<Pick<FilterCondition, 'field' | 'value'>>) => void;
  onRemove: () => void;
  inputStyle: React.CSSProperties;
}

const NUMERIC_FIELDS: FilterField[] = ['age_min', 'age_max', 'total_editions_min', 'total_editions_max', 'engagement_min'];
const TEXT_FIELDS: FilterField[] = ['city_contains'];

const FIELD_PLACEHOLDERS: Partial<Record<FilterField, string>> = {
  age_min: 'Ex: 25',
  age_max: 'Ex: 45',
  total_editions_min: 'Ex: 2',
  total_editions_max: 'Ex: 5',
  engagement_min: 'Ex: 70',
  city_contains: 'Ex: Copenhagen',
};

const FIELD_LIMITS: Partial<Record<FilterField, { min: number; max: number }>> = {
  age_min: { min: 16, max: 80 },
  age_max: { min: 16, max: 80 },
  total_editions_min: { min: 0, max: 20 },
  total_editions_max: { min: 0, max: 20 },
  engagement_min: { min: 0, max: 100 },
};

function FilterRow({ filter, usedFields, onChange, onRemove, inputStyle }: FilterRowProps) {
  const availableFields = ALL_FIELDS.filter(f => f === filter.field || !usedFields.has(f));
  const isSelect = !!FILTER_VALUE_OPTIONS[filter.field];
  const isNumeric = NUMERIC_FIELDS.includes(filter.field);
  const isText = TEXT_FIELDS.includes(filter.field);
  const limits = FIELD_LIMITS[filter.field];

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <select
        value={filter.field}
        onChange={e => onChange({ field: e.target.value as FilterField })}
        style={{ ...inputStyle, flex: '0 0 auto' }}
      >
        {availableFields.map(f => (
          <option key={f} value={f}>{FILTER_FIELD_LABELS[f]}</option>
        ))}
      </select>

      {isSelect ? (
        <select value={filter.value} onChange={e => onChange({ value: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
          {FILTER_VALUE_OPTIONS[filter.field]!.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : isNumeric ? (
        <input
          type="number"
          value={filter.value}
          onChange={e => onChange({ value: e.target.value })}
          placeholder={FIELD_PLACEHOLDERS[filter.field]}
          min={limits?.min}
          max={limits?.max}
          style={{ ...inputStyle, flex: 1 }}
        />
      ) : isText ? (
        <input
          type="text"
          value={filter.value}
          onChange={e => onChange({ value: e.target.value })}
          placeholder={FIELD_PLACEHOLDERS[filter.field]}
          style={{ ...inputStyle, flex: 1 }}
        />
      ) : null}

      <button
        onClick={onRemove}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0 }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

