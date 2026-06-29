export type FilterField =
  | 'gender'
  | 'age_min'
  | 'age_max'
  | 'nationality'
  | 'isReturningAthlete'
  | 'total_editions_min'
  | 'total_editions_max'
  | 'engagement_min'
  | 'city_contains'
  | 'distance'
  | 'hasInsurance'

export interface FilterCondition {
  id: string
  field: FilterField
  value: string
}

export interface CustomSegment {
  id: string
  name: string
  color: string
  colorBg: string
  filters: FilterCondition[]
  baseSegmentIds: string[]    // empty = all athletes in the gate
  baseSegmentLabels: string[] // human-readable labels for display
  objective?: string          // free-text context for AI generation
}

export const FILTER_FIELD_LABELS: Record<FilterField, string> = {
  gender: 'Gender',
  age_min: 'Min age',
  age_max: 'Max age',
  nationality: 'Nationality',
  isReturningAthlete: 'Returning',
  total_editions_min: 'Min editions',
  total_editions_max: 'Max editions',
  engagement_min: 'Min engagement',
  city_contains: 'City',
  distance: 'Distance',
  hasInsurance: 'Cancellation insurance',
}

export const FILTER_VALUE_OPTIONS: Partial<Record<FilterField, { value: string; label: string }[]>> = {
  gender: [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
    { value: 'X', label: 'Other' },
  ],
  nationality: [
    { value: 'DK', label: 'Denmark' },
    { value: 'SE', label: 'Sweden' },
    { value: 'DE', label: 'Germany' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'NL', label: 'Netherlands' },
    { value: 'NO', label: 'Norway' },
    { value: 'FR', label: 'France' },
    { value: 'US', label: 'United States' },
    { value: 'IT', label: 'Italy' },
    { value: 'CH', label: 'Switzerland' },
    { value: 'PL', label: 'Poland' },
    { value: 'BE', label: 'Belgium' },
  ],
  isReturningAthlete: [
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' },
  ],
  hasInsurance: [
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' },
  ],
  distance: [
    { value: 'Marathon 42K', label: 'Marathon 42K' },
    { value: 'Half Marathon 21K', label: 'Half Marathon 21K' },
  ],
}

export const CUSTOM_SEGMENT_COLORS = [
  { color: '#7C3AED', colorBg: '#F5F3FF' },
  { color: '#0891B2', colorBg: '#ECFEFF' },
  { color: '#DB2777', colorBg: '#FDF2F8' },
  { color: '#059669', colorBg: '#ECFDF5' },
  { color: '#D97706', colorBg: '#FFFBEB' },
]

export function buildSegmentDescription(segment: CustomSegment): string {
  const parts: string[] = []

  if (segment.baseSegmentIds.length > 0) {
    parts.push(`Scope: ${segment.baseSegmentLabels.join(', ')}`)
  }

  if (segment.filters.length > 0) {
    const filterLabels = segment.filters.map(f => {
      const valueLabel = FILTER_VALUE_OPTIONS[f.field]?.find(o => o.value === f.value)?.label ?? f.value
      return `${FILTER_FIELD_LABELS[f.field]} = ${valueLabel}`
    })
    parts.push(`Criteria: ${filterLabels.join(', ')}`)
  }

  if (segment.objective) {
    parts.push(`Objective: ${segment.objective}`)
  }

  if (parts.length === 0) {
    return `Custom segment: "${segment.name}" (all athletes, no filters)`
  }

  return `Custom segment: "${segment.name}"\n${parts.join('\n')}`
}
