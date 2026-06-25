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
  gender: 'Genre',
  age_min: 'Âge minimum',
  age_max: 'Âge maximum',
  nationality: 'Nationalité',
  isReturningAthlete: 'Retournant',
  total_editions_min: 'Éditions min.',
  total_editions_max: 'Éditions max.',
  engagement_min: 'Engagement min.',
  city_contains: 'Ville',
  distance: 'Distance',
}

export const FILTER_VALUE_OPTIONS: Partial<Record<FilterField, { value: string; label: string }[]>> = {
  gender: [
    { value: 'M', label: 'Homme' },
    { value: 'F', label: 'Femme' },
    { value: 'X', label: 'Autre' },
  ],
  nationality: [
    { value: 'DK', label: 'Danemark' },
    { value: 'SE', label: 'Suède' },
    { value: 'DE', label: 'Allemagne' },
    { value: 'UK', label: 'Royaume-Uni' },
    { value: 'NL', label: 'Pays-Bas' },
    { value: 'NO', label: 'Norvège' },
    { value: 'FR', label: 'France' },
    { value: 'US', label: 'États-Unis' },
    { value: 'IT', label: 'Italie' },
    { value: 'CH', label: 'Suisse' },
    { value: 'PL', label: 'Pologne' },
    { value: 'BE', label: 'Belgique' },
  ],
  isReturningAthlete: [
    { value: 'true', label: 'Oui' },
    { value: 'false', label: 'Non' },
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
    parts.push(`Scope : ${segment.baseSegmentLabels.join(', ')}`)
  }

  if (segment.filters.length > 0) {
    const filterLabels = segment.filters.map(f => {
      const valueLabel = FILTER_VALUE_OPTIONS[f.field]?.find(o => o.value === f.value)?.label ?? f.value
      return `${FILTER_FIELD_LABELS[f.field]} = ${valueLabel}`
    })
    parts.push(`Critères : ${filterLabels.join(', ')}`)
  }

  if (segment.objective) {
    parts.push(`Objectif : ${segment.objective}`)
  }

  if (parts.length === 0) {
    return `Segment personnalisé : "${segment.name}" (tous les athletes, aucun filtre)`
  }

  return `Segment personnalisé : "${segment.name}"\n${parts.join('\n')}`
}
