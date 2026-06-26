'use client'

import { useState } from 'react'
import type { CustomSegment, FilterCondition } from '@/lib/types/segments'
import { filterAthletes } from '@/lib/db/segment-filter'

interface AIRawSegment {
  id: string
  name: string
  description: string
  filters: FilterCondition[]
  color: string
  colorBg: string
}

interface Props {
  parentId: string
  parentLabel: string
  parentAthleteIds: string[]
  parentScaledSize: number
  parentFilters?: FilterCondition[]
  onSelect: (seg: CustomSegment) => void
}

export default function AISubSegments({
  parentId,
  parentLabel,
  parentAthleteIds,
  parentScaledSize,
  parentFilters,
  onSelect,
}: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [subSegments, setSubSegments] = useState<AIRawSegment[]>([])
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null)

  const isFullPool = parentId === '__full_pool__'

  async function analyze() {
    setStatus('loading')
    setSubSegments([])
    setSelectedSubId(null)
    try {
      const res = await fetch('/api/ai/analyze-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteIds: parentAthleteIds.length > 0 ? parentAthleteIds : undefined,
          parentLabel,
        }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setSubSegments(data.segments ?? [])
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  function getScaledCount(seg: AIRawSegment): number {
    if (parentAthleteIds.length === 0) return 0
    const parentIds = new Set(parentAthleteIds)
    const filtered = filterAthletes(seg.filters, undefined, undefined, parentIds)
    return Math.round((filtered.length / parentAthleteIds.length) * parentScaledSize)
  }

  function handleSelect(seg: AIRawSegment) {
    setSelectedSubId(seg.id)
    const mergedFilters: FilterCondition[] = parentFilters
      ? [...parentFilters.map((f, i) => ({ ...f, id: `parent_${i}` })), ...seg.filters]
      : seg.filters

    const customSeg: CustomSegment = {
      id: `ai_sub_${parentId}_${seg.id}`,
      name: seg.name,
      color: seg.color,
      colorBg: seg.colorBg,
      filters: parentFilters ? mergedFilters : seg.filters,
      baseSegmentIds: parentFilters ? [] : (isFullPool ? [] : [parentId]),
      baseSegmentLabels: parentFilters ? [] : (isFullPool ? [] : [parentLabel]),
      objective: seg.description,
    }
    onSelect(customSeg)
  }

  const contextLine = isFullPool
    ? `Pool complet Â· ${parentScaledSize.toLocaleString('en-US')} athletes`
    : `${parentLabel} Â· ${parentScaledSize.toLocaleString('en-US')} athletes`

  return (
    <div style={{
      background: 'linear-gradient(135deg, #FFF0F2 0%, var(--bg-1) 70%)',
      border: '1.5px solid #FECDD3',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 14px 10px', borderBottom: status === 'idle' ? 'none' : '1px solid #FECDD3' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 570, color: 'var(--fg-1)' }}>Analyse IA</span>
          </div>
          {status === 'done' && (
            <button
              onClick={analyze}
              title="Re-analyser"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)', padding: '2px 4px', fontSize: 11, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 3 }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Relancer
            </button>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--fg-3)' }}>{contextLine}</p>
      </div>

      {/* Idle state â€” prominent CTA */}
      {status === 'idle' && (
        <div style={{ padding: '12px 14px 14px' }}>
          <button
            onClick={analyze}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 16px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 570,
              fontFamily: 'inherit',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
            </svg>
            DÃ©couvrir des sous-segments
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--fg-3)', textAlign: 'center', lineHeight: 1.5 }}>
            L&apos;IA analyse les patterns de cette population et identifie des sous-groupes actionnables
          </p>
        </div>
      )}

      {/* Loading */}
      {status === 'loading' && (
        <div style={{ padding: '12px 14px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span style={{ fontSize: 12, color: 'var(--fg-2)' }}>Analyse en coursâ€¦</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: 52,
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-grey-100)',
                animation: `pulse 1.5s ease-in-out ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div style={{ padding: '12px 14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Analyse Ã©chouÃ©e</span>
          <button
            onClick={analyze}
            style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 570 }}
          >
            RÃ©essayer â†’
          </button>
        </div>
      )}

      {/* Results */}
      {status === 'done' && (
        <div style={{ padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {subSegments.map(seg => {
            const count = getScaledCount(seg)
            const isSelected = selectedSubId === seg.id
            return (
              <button
                key={seg.id}
                onClick={() => handleSelect(seg)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '9px 11px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? seg.colorBg : 'var(--bg-1)',
                  border: `1.5px solid ${isSelected ? seg.color : 'var(--border-1)'}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                  width: '100%',
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, flexShrink: 0, marginTop: 4 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 570, color: 'var(--fg-1)' }}>{seg.name}</span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: isSelected ? seg.color : 'var(--fg-2)', flexShrink: 0 }}>
                      ~{count.toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--fg-3)', margin: '2px 0 0', lineHeight: 1.4 }}>
                    {seg.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

