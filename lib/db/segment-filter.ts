import { athletes } from './athletes'
import type { FilterCondition } from '../types/segments'
import type { Athlete } from '../types/athlete'

const INTERNATIONAL_NATIONALITIES = ['DE', 'UK', 'NL', 'NO']

function getGate0Segment(a: Athlete): string {
  if (a.externalProspect) return 'external_prospects'
  if (INTERNATIONAL_NATIONALITIES.includes(a.nationality)) return 'international_targets'
  if (a.isReturningAthlete && a.totalEditionsRaced > 0) return 'past_finishers'
  return 'past_refused'
}

export function filterAthletes(
  filters: FilterCondition[],
  baseSegmentIds?: string[],
  segmentField?: string
): Athlete[] {
  let pool: Athlete[] = athletes

  if (baseSegmentIds && baseSegmentIds.length > 0 && segmentField) {
    if (segmentField === 'gate0Segment') {
      pool = pool.filter(a => baseSegmentIds.includes(getGate0Segment(a)))
    } else {
      pool = pool.filter(a => baseSegmentIds.includes((a as any)[segmentField] ?? ''))
    }
  }

  if (filters.length === 0) return pool

  return pool.filter(a =>
    filters.every(f => {
      const v = f.value
      switch (f.field) {
        case 'gender':
          return a.gender === v
        case 'age_min':
          return v !== '' && a.age >= parseInt(v)
        case 'age_max':
          return v !== '' && a.age <= parseInt(v)
        case 'nationality':
          return a.nationality === v
        case 'isReturningAthlete':
          return a.isReturningAthlete === (v === 'true')
        case 'total_editions_min':
          return v !== '' && a.totalEditionsRaced >= parseInt(v)
        case 'total_editions_max':
          return v !== '' && a.totalEditionsRaced <= parseInt(v)
        case 'engagement_min':
          return v !== '' && a.engagement.score >= parseInt(v)
        case 'city_contains':
          return v !== '' && a.city.toLowerCase().includes(v.toLowerCase())
        case 'distance':
          return a.distance === v
        default:
          return true
      }
    })
  )
}
