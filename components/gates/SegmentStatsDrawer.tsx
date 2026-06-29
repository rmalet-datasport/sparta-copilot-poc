'use client';

import { useMemo } from 'react';
import { athletes } from '@/lib/db/athletes';

interface Criteria { l: string; v: string }

interface Props {
  isOpen: boolean
  onClose: () => void
  segmentName: string
  segmentDescription: string
  segmentColor: string
  criteria: Criteria[]
  athleteIds: string[]
  scaledSize: number
  onGenerateCampaign?: () => void
}

const COUNTRY_NAMES: Record<string, string> = {
  DK: 'Denmark', SE: 'Sweden', DE: 'Germany', UK: 'United Kingdom',
  NL: 'Netherlands', NO: 'Norway', FR: 'France', US: 'United States',
  IT: 'Italy', CH: 'Switzerland', PL: 'Poland', BE: 'Belgium',
}

const NAT_PALETTE = ['var(--color-red-700, #D6001D)', '#DC2626', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB']

export default function SegmentStatsDrawer({
  isOpen, onClose, segmentName, segmentDescription, segmentColor,
  criteria, athleteIds, scaledSize, onGenerateCampaign,
}: Props) {
  const stats = useMemo(() => {
    const idSet = new Set(athleteIds)
    const pool = athletes.filter(a => idSet.has(a.id))
    if (pool.length === 0) return null
    const n = pool.length

    const engScores = pool.map(a =>
      a.reRegistrationProbability != null
        ? Math.round(a.reRegistrationProbability * 100)
        : a.engagement.score
    )
    const avgEng = Math.round(engScores.reduce((s, v) => s + v, 0) / n)
    const high = Math.round(pool.filter((_, i) => engScores[i] >= 70).length / n * 100)
    const med = Math.round(pool.filter((_, i) => engScores[i] >= 40 && engScores[i] < 70).length / n * 100)
    const low = Math.max(0, 100 - high - med)

    const avgEditions = (pool.reduce((s, a) => s + a.totalEditionsRaced, 0) / n).toFixed(1)
    const returningPct = Math.round(pool.filter(a => a.isReturningAthlete).length / n * 100)
    const marathonPct = Math.round(pool.filter(a => a.distance === 'Marathon 42K').length / n * 100)
    const halfPct = 100 - marathonPct
    const genderM = Math.round(pool.filter(a => a.gender === 'M').length / n * 100)
    const genderF = Math.round(pool.filter(a => a.gender === 'F').length / n * 100)
    const genderO = Math.max(0, 100 - genderM - genderF)

    const natCount: Record<string, number> = {}
    for (const a of pool) natCount[a.nationality] = (natCount[a.nationality] ?? 0) + 1
    const natMax = Math.max(...Object.values(natCount))
    const nationalities = Object.entries(natCount)
      .sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([code, count]) => ({
        label: COUNTRY_NAMES[code] ?? code,
        pct: Math.round(count / n * 100),
        bar: Math.round(count / natMax * 100),
      }))

    const edBuckets = ['0', '1', '2', '3', '4+'].map((label, i) => {
      const count = label === '4+'
        ? pool.filter(a => a.totalEditionsRaced >= 4).length
        : pool.filter(a => a.totalEditionsRaced === i).length
      return { label, pct: Math.round(count / n * 100) }
    })
    const edMax = Math.max(...edBuckets.map(b => b.pct), 1)

    const ageBuckets = [
      { label: '18–29', pct: Math.round(pool.filter(a => a.age >= 18 && a.age <= 29).length / n * 100) },
      { label: '30–39', pct: Math.round(pool.filter(a => a.age >= 30 && a.age <= 39).length / n * 100) },
      { label: '40–49', pct: Math.round(pool.filter(a => a.age >= 40 && a.age <= 49).length / n * 100) },
      { label: '50–59', pct: Math.round(pool.filter(a => a.age >= 50 && a.age <= 59).length / n * 100) },
      { label: '60+', pct: Math.round(pool.filter(a => a.age >= 60).length / n * 100) },
    ]
    const ageMax = Math.max(...ageBuckets.map(b => b.pct), 1)

    return { avgEng, high, med, low, avgEditions, returningPct, marathonPct, halfPct, genderM, genderF, genderO, nationalities, edBuckets, edMax, ageBuckets, ageMax }
  }, [athleteIds])

  const accent = segmentColor

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(20,20,20,0.45)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.28s ease',
          zIndex: 40,
        }}
      />

      {/* Drawer */}
      <aside
        style={{
          position: 'fixed', top: 0, right: 0,
          height: '100vh', width: 540,
          background: 'var(--bg-1)',
          boxShadow: '-8px 0 40px rgba(20,20,20,0.14)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.32s cubic-bezier(.2,.8,.2,1)',
          zIndex: 50,
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid var(--border-1)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: segmentColor + '22',
                border: `1.5px solid ${segmentColor}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: segmentColor }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 570 }}>Segment statistics</div>
                <div style={{ fontSize: 17, fontWeight: 570, color: 'var(--fg-1)', marginTop: 2 }}>{segmentName}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ border: 'none', background: 'var(--bg-2)', width: 34, height: 34, borderRadius: 8, cursor: 'pointer', fontSize: 15, color: 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >✕</button>
          </div>

          {segmentDescription && (
            <p style={{ fontSize: 13, color: 'var(--fg-3)', margin: '14px 0 0', lineHeight: 1.5 }}>{segmentDescription}</p>
          )}

          {criteria.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
              {criteria.map((cr, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '4px 10px', background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 6, fontSize: 11, whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{cr.l}</span>
                  <span style={{ color: 'var(--fg-1)', fontWeight: 570 }}>{cr.v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 30 }}>
          {!stats ? (
            <p style={{ color: 'var(--fg-3)', fontSize: 13 }}>No athlete data available for this segment.</p>
          ) : (
            <>
              {/* KPI grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Total prospects', value: scaledSize.toLocaleString('en-US') },
                  { label: 'Re-apply likelihood', value: stats.avgEng + '%', colored: true },
                  { label: 'Avg. editions', value: stats.avgEditions },
                  { label: 'Returning share', value: stats.returningPct + '%' },
                ].map(kpi => (
                  <div key={kpi.label} style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 570 }}>{kpi.label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, color: kpi.colored ? accent : 'var(--fg-1)', marginTop: 7, lineHeight: 1 }}>{kpi.value}</div>
                  </div>
                ))}
              </div>

              {/* Nationalities */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 570, color: 'var(--fg-1)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Nationalities</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {stats.nationalities.map((n, i) => (
                    <div key={n.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: 13, color: 'var(--fg-2)', width: 130, flexShrink: 0 }}>{n.label}</div>
                      <div style={{ flex: 1, height: 8, background: 'var(--bg-2)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: n.bar + '%', background: NAT_PALETTE[i] ?? 'var(--border-1)', borderRadius: 99 }} />
                      </div>
                      <div style={{ width: 38, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-1)' }}>{n.pct}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Distance & Returning donuts */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 570, color: 'var(--fg-1)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Distance & Returning</div>
                <div style={{ display: 'flex', gap: 14 }}>
                  {[
                    {
                      label: 'Distance', mainPct: stats.marathonPct, mainLabel: `Marathon ${stats.marathonPct}%`,
                      secLabel: `Half ${stats.halfPct}%`, grad: `conic-gradient(${accent} 0 ${stats.marathonPct}%, var(--bg-2) ${stats.marathonPct}% 100%)`,
                      dotColor: accent,
                    },
                    {
                      label: 'Returning vs first-time', mainPct: stats.returningPct, mainLabel: `Returning ${stats.returningPct}%`,
                      secLabel: `First-time ${100 - stats.returningPct}%`, grad: `conic-gradient(var(--fg-1) 0 ${stats.returningPct}%, var(--bg-2) ${stats.returningPct}% 100%)`,
                      dotColor: 'var(--fg-1)',
                    },
                  ].map(d => (
                    <div key={d.label} style={{ flex: 1, background: 'var(--bg-2)', borderRadius: 12, padding: '18px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 86, height: 86, borderRadius: '50%', background: d.grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--fg-1)' }}>
                          {d.mainPct}%
                        </div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 570, color: 'var(--fg-1)', marginTop: 12 }}>{d.label}</div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--fg-3)' }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: d.dotColor, flexShrink: 0 }} />{d.mainLabel}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--fg-3)' }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--border-1)', flexShrink: 0 }} />{d.secLabel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Editions bar chart */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 570, color: 'var(--fg-1)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Editions / Loyalty</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 110, paddingTop: 10 }}>
                  {stats.edBuckets.map((e, i) => (
                    <div key={e.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 6 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-2)' }}>{e.pct}%</div>
                      <div style={{
                        width: '100%', maxWidth: 44,
                        height: Math.max(4, Math.round(e.pct / stats.edMax * 76)) + 'px',
                        background: i === 0 ? accent : 'var(--border-1)',
                        borderRadius: '5px 5px 0 0',
                      }} />
                      <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{e.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 8 }}>Completed editions per athlete</div>
              </div>

              {/* Age & Gender */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 570, color: 'var(--fg-1)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Age & Gender</div>
                <div style={{ display: 'flex', height: 10, borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ width: stats.genderM + '%', background: 'var(--fg-1)' }} />
                  <div style={{ width: stats.genderF + '%', background: accent }} />
                  {stats.genderO > 0 && <div style={{ width: stats.genderO + '%', background: 'var(--border-1)' }} />}
                </div>
                <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                  {[
                    { label: `Men ${stats.genderM}%`, color: 'var(--fg-1)' },
                    { label: `Women ${stats.genderF}%`, color: accent },
                    ...(stats.genderO > 0 ? [{ label: `Other ${stats.genderO}%`, color: 'var(--border-1)' }] : []),
                  ].map(g => (
                    <span key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--fg-3)' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: g.color, flexShrink: 0 }} />{g.label}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {stats.ageBuckets.map(a => (
                    <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: 13, color: 'var(--fg-2)', width: 58, flexShrink: 0 }}>{a.label}</div>
                      <div style={{ flex: 1, height: 8, background: 'var(--bg-2)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: Math.round(a.pct / stats.ageMax * 100) + '%', background: 'var(--fg-2)', borderRadius: 99 }} />
                      </div>
                      <div style={{ width: 38, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-1)' }}>{a.pct}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Readiness */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 570, color: 'var(--fg-1)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Engagement / Readiness</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 40, lineHeight: 1, color: accent }}>{stats.avgEng}%</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 5, maxWidth: 100 }}>avg. engagement score</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', height: 10, borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: stats.high + '%', background: accent }} />
                      <div style={{ width: stats.med + '%', background: 'var(--fg-3)' }} />
                      <div style={{ width: stats.low + '%', background: 'var(--border-1)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 12 }}>
                      {[
                        { label: 'High intent', pct: stats.high, color: accent },
                        { label: 'Medium', pct: stats.med, color: 'var(--fg-3)' },
                        { label: 'Low', pct: stats.low, color: 'var(--border-1)' },
                      ].map(r => (
                        <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>{r.label}</span>
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-1)' }}>{r.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border-1)', display: 'flex', gap: 12, flexShrink: 0, background: 'var(--bg-1)' }}>
          <button
            onClick={onClose}
            style={{ flexShrink: 0, padding: '11px 18px', border: '1px solid var(--border-1)', background: 'var(--bg-1)', borderRadius: 6, fontFamily: 'var(--font-sans, inherit)', fontWeight: 570, fontSize: 14, cursor: 'pointer', color: 'var(--fg-1)' }}
          >
            Close
          </button>
          {onGenerateCampaign && (
            <button
              onClick={() => { onClose(); onGenerateCampaign(); }}
              style={{ flex: 1, padding: '11px 18px', border: 'none', background: accent, color: '#fff', borderRadius: 6, fontWeight: 570, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              Generate campaign →
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
