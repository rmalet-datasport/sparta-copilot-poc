# DATA_MODEL.md — Sparta Co-Pilot

## Principe général

Une seule base de données d'athletes, enrichie progressivement à chaque gate.
Les types TypeScript sont distincts par gate pour refléter les champs disponibles
à ce stade du lifecycle. Aucune donnée n'est supprimée entre les gates — elle s'accumule.

```
lib/db/athletes.ts         → 500 athletes statiques (source unique de vérité)
lib/db/segment-filter.ts   → filtrage dynamique + dérivation gate0Segment
lib/db/segment-stats.ts    → calcul percentiles / distributions pour l'IA
lib/types/athlete.ts       → type Athlete complet
lib/types/gates.ts         → types par gate (Gate1Athlete, Gate2Athlete, Gate3Athlete)
lib/types/segments.ts      → types segments personnalisés + constantes UI
```

---

## Paramètres généraux de l'événement (`lib/constants.ts`)

```ts
export const EVENT = {
  name: "Copenhagen Marathon",
  edition: 2026,
  date: "2026-05-17",
  city: "Copenhagen",
  country: "Denmark",
  capacity: 15000,
  ballotOpenDate: "2025-11-01",
  ballotCloseDate: "2025-12-15",
  lotteryDate: "2026-01-10",
  waitlistDeadline: "2026-03-01",
  distances: ["Marathon 42K", "Half Marathon 21K"],
  historicalReturnRate: 0.65,
  totalApplicants: 20000,
}

export const SEGMENT_SIZES = {
  gate0: { past_finishers: 5200, past_refused: 8400, international_targets: 12000, external_prospects: 1600 },
  gate1: { ambassador: 3200, to_reactivate: 2800, opportunist: 7500, cold_prospect: 6500 },
  gate2: { confirmed_engaged: 8200, confirmed_passive: 3800, waitlist_hot: 800, waitlist_cold: 1200, refused_reactivatable: 2400, refused_lost: 3600 },
  gate3: { loyal_finisher: 6800, champion_ambassador: 1400, at_risk_returner: 2100, lost_dns: 1200, reconquest_dnf: 500 },
}

export const REREGISTRATION_RATES = {
  naturalReturnRate: 0.65,
  aiTargetedReturnRate: 0.82,
  incrementalAthletes: 1950,
  incrementalRevenue: 97500,
}
```

---

## Historique des éditions (par athlete)

```ts
type PastEdition = {
  year: number                            // 2021–2025
  applied: boolean
  status: 'registered' | 'waitlist' | 'refused' | 'not_applied'
  raceStatus?: 'finisher' | 'dns' | 'dnf'
  finishTime?: string                     // ex: "3:42:15"
  upsellsPurchased?: string[]
}
```

---

## Engagement score

Score composite 0–100, hardcodé par athlete dans la DB statique.

```ts
type EngagementData = {
  score: number           // 0–100, score composite
  emailOpenRate: number   // 0–1
  appOpens: number        // ouvertures app sur 90 jours
  smsClickRate: number    // 0–1
  instagramFollow: boolean
  websiteVisits: number   // visites page event sur 90 jours
}
```

Distributions dans la DB (500 athletes) :
- p25 ≈ 35, médiane ≈ 55, p75 ≈ 72, p90 ≈ 83

---

## Profil athlete complet (`lib/types/athlete.ts`)

```ts
export type Athlete = {

  // ─── IDENTITÉ ───────────────────────────────────────────────────────────
  id: string                  // "ATH-0001"
  firstName: string
  lastName: string
  email: string
  phone: string
  nationality: string         // 'DK' | 'SE' | 'DE' | 'UK' | 'NL' | 'NO' | 'FR' | ...
  city: string
  zipCode: string
  age: number
  gender: 'M' | 'F'
  acquisitionSource: AcquisitionSource

  // ─── HISTORIQUE ─────────────────────────────────────────────────────────
  pastEditions: PastEdition[]
  totalEditionsApplied: number
  totalEditionsRaced: number
  isReturningAthlete: boolean

  // ─── ENGAGEMENT ─────────────────────────────────────────────────────────
  engagement: EngagementData

  // ─── GATE 1 — Registration opens ────────────────────────────────────────
  registrationDate?: string
  distance?: 'Marathon 42K' | 'Half Marathon 21K'
  estimatedFinishTime?: string
  externalProspect?: boolean
  externalProspectSource?: string
  candidacyScore?: number           // 0–100
  anticipatedValue?: number         // €
  selectionProbability?: number     // 0–1
  preLotterySegment?: 'ambassador' | 'to_reactivate' | 'opportunist' | 'cold_prospect'

  // ─── GATE 2 — Lottery result ─────────────────────────────────────────────
  registrationStatus?: 'registered' | 'waitlist' | 'refused'
  lotteryDate?: string
  waitlistPosition?: number
  upsellsPurchased?: UpsellItem[]
  upsellRevenue?: number
  paymentStatus?: 'paid' | 'pending' | 'failed'
  postLotterySegment?: 'confirmed_engaged' | 'confirmed_passive' | 'waitlist_hot' | 'waitlist_cold' | 'refused_reactivatable' | 'refused_lost'

  // ─── GATE 3 — Race finish ────────────────────────────────────────────────
  raceStatus?: 'finisher' | 'dns' | 'dnf'
  finishTime?: string
  finishCategory?: string
  finishRank?: number
  personalBest?: boolean
  reRegistrationProbability?: number  // 0–1
  postRaceSegment?: 'loyal_finisher' | 'champion_ambassador' | 'at_risk_returner' | 'lost_dns' | 'reconquest_dnf'
}
```

> **Note Gate 0** : il n'existe pas de champ `gate0Segment` dans le type Athlete.
> Le segment est dérivé à la volée par `getGate0Segment(athlete)` dans `segment-filter.ts`.

---

## Filtrage athletes (`lib/db/segment-filter.ts`)

```ts
export function filterAthletes(
  filters: FilterCondition[],
  baseSegmentIds?: string[],
  segmentField?: string
): Athlete[]
```

**Cas spécial Gate 0** : quand `segmentField === 'gate0Segment'`, le pool est filtré
via `getGate0Segment()` plutôt que via un champ direct de l'athlete.

```ts
function getGate0Segment(a: Athlete): string {
  if (a.externalProspect) return 'external_prospects'
  if (['DE', 'UK', 'NL', 'NO'].includes(a.nationality)) return 'international_targets'
  if (a.isReturningAthlete && a.totalEditionsRaced > 0) return 'past_finishers'
  return 'past_refused'
}
```

**Champs filtrables (9 champs)** :

| FilterField | Type | Description |
|---|---|---|
| `gender` | select | 'M' \| 'F' |
| `age_min` | number | âge ≥ valeur |
| `age_max` | number | âge ≤ valeur |
| `nationality` | select | code pays 2 lettres |
| `isReturningAthlete` | boolean | 'true' \| 'false' |
| `total_editions_min` | number | totalEditionsRaced ≥ valeur |
| `total_editions_max` | number | totalEditionsRaced ≤ valeur |
| `engagement_min` | number | engagement.score ≥ valeur |
| `city_contains` | text | city.includes(valeur) |

---

## Statistiques DB (`lib/db/segment-stats.ts`)

Utilisé par `/api/ai/suggest-segment` pour calibrer intelligemment les filtres.

```ts
export function formatStatsForPrompt(): string
// Retourne une string avec :
// - Engagement : p25, médiane, p75, p90
// - Âge : p25, médiane, p75
// - Éditions courues : distribution 0 / 1 / 2-3 / 4+
// - % athletes retournants
// - % femmes / hommes
// - Distribution nationalités (top pays)
```

---

## Types segments personnalisés (`lib/types/segments.ts`)

```ts
export type FilterField =
  | 'gender' | 'age_min' | 'age_max' | 'nationality' | 'isReturningAthlete'
  | 'total_editions_min' | 'total_editions_max' | 'engagement_min' | 'city_contains'

export interface FilterCondition {
  id: string
  field: FilterField
  value: string
}

export interface CustomSegment {
  id: string
  name: string
  color: string           // couleur principale (hex)
  colorBg: string         // couleur de fond (hex clair)
  filters: FilterCondition[]
  baseSegmentIds: string[]    // vide = tous les athletes
  baseSegmentLabels: string[] // labels lisibles pour l'affichage
  objective?: string          // texte libre injecté dans le prompt IA
}

// Palette de 5 couleurs pour les segments personnalisés
export const CUSTOM_SEGMENT_COLORS = [
  { color: '#7C3AED', colorBg: '#F5F3FF' },  // violet
  { color: '#0891B2', colorBg: '#ECFEFF' },  // cyan
  { color: '#DB2777', colorBg: '#FDF2F8' },  // rose
  { color: '#059669', colorBg: '#ECFDF5' },  // vert
  { color: '#D97706', colorBg: '#FFFBEB' },  // ambre
]

// Génère une description textuelle du segment pour le prompt IA
export function buildSegmentDescription(segment: CustomSegment): string
// Retourne : "Segment personnalisé : \"Nom\"\nScope : ...\nCritères : ...\nObjectif : ..."
```

---

## Distribution nationalités (DB statique — 500 athletes)

| Nationalité | % | Nb athletes |
|---|---|---|
| DK | 38% | 190 |
| SE | 14% | 70 |
| DE | 12% | 60 |
| UK | 10% | 50 |
| NL | 8% | 40 |
| NO | 7% | 35 |
| FR | 5% | 25 |
| Autres | 6% | 30 |

Ces proportions se reflètent dans les chiffres UI via `SEGMENT_SIZES`.

---

## Sources d'acquisition

```ts
type AcquisitionSource =
  | 'organic_search'
  | 'social_instagram'
  | 'partner_event'
  | 'contest'
  | 'word_of_mouth'
  | 'returning_athlete'
  | 'external_prospect'   // ~40 athletes avec externalProspect: true
```

Prospects externes (~40 athletes) :
- Nike Running Club Copenhagen Contest — ~15 athletes
- Intersport Partner Program — ~13 athletes
- Parkrun Denmark Partnership — ~12 athletes
