# DATA_MODEL.md — Sparta Co-Pilot

## Principe général

Une seule base de données d'athletes, enrichie progressivement à chaque gate.
Les types TypeScript sont distincts par gate pour refléter les champs disponibles
à ce stade du lifecycle. Aucune donnée n'est supprimée entre les gates — elle s'accumule.

La DB est un fichier statique : `lib/db/athletes.ts`
Les types par gate sont dans : `lib/types/`

---

## Paramètres généraux de l'événement

```ts
// lib/db/event.ts
export const EVENT = {
  name: "Copenhagen Marathon",
  edition: 2026,
  date: "2026-05-17",
  city: "Copenhagen",
  country: "Denmark",
  capacity: 15000,           // places disponibles
  ballotOpenDate: "2025-11-01",
  ballotCloseDate: "2025-12-15",
  lotteryDate: "2026-01-10",
  waitlistDeadline: "2026-03-01",  // date limite waitlist — après cette date, un refusé est définitivement out
  distances: ["Marathon 42K", "Half Marathon 21K"],
  historicalReturnRate: 0.65,      // 65% des finishers reviennent naturellement l'édition suivante
  totalApplicants: 20000,          // candidats au ballot 2026
}
```

---

## Historique des éditions (pour chaque athlete)

```ts
type PastEdition = {
  year: number                          // 2021 | 2022 | 2023 | 2024 | 2025
  applied: boolean
  status: 'registered' | 'waitlist' | 'refused' | 'not_applied'
  raceStatus?: 'finisher' | 'dns' | 'dnf'  // si registered
  finishTime?: string                   // ex: "3:42:15"
  upsellsPurchased?: string[]
}
```

---

## Engagement score

Score composite 0–100 calculé à partir de 4 signaux.
Valeur hardcodée par athlete dans la DB statique.

```ts
type EngagementData = {
  score: number                  // 0–100, score composite
  emailOpenRate: number          // 0–1, ex: 0.72
  appOpens: number               // nombre d'ouvertures app sur 90 jours
  smsClickRate: number           // 0–1, ex: 0.45
  instagramFollow: boolean       // suit le compte officiel
  websiteVisits: number          // visites page event sur 90 jours
}
```

---

## Sources d'acquisition

```ts
type AcquisitionSource =
  | 'organic_search'      // trouvé via Google
  | 'social_instagram'    // pub ou post Instagram
  | 'partner_event'       // via un événement partenaire (ex: autre marathon)
  | 'contest'             // via un concours / jeu externe
  | 'word_of_mouth'       // recommandation d'un autre athlete
  | 'returning_athlete'   // a déjà participé à une édition précédente
  | 'external_prospect'   // prospect externe importé (partenaire, liste tierce)
```

---

## Upsells disponibles (Gate 2 — post-lottery)

```ts
type UpsellItem =
  | 'accommodation_package'   // hôtel partenaire 2 nuits, ~€180
  | 'charity_bib'             // dossard caritatif, donation €50+
  | 'vip_finish_line'         // zone VIP à l'arrivée, €75
  | 'race_photo_pack'         // pack photos officielles, €35
  | 'pace_group_access'       // accès groupe de pace dédié, €25
  | 'finisher_tshirt_premium' // t-shirt finisher premium, €40
```

---

## Profil athlete complet (type unifié)

```ts
// lib/types/athlete.ts

export type Athlete = {

  // ─── IDENTITÉ (disponible dès Gate 0) ───────────────────────────────
  id: string                        // ex: "ATH-0001"
  firstName: string
  lastName: string
  email: string
  phone: string
  nationality: string               // 'DK' | 'SE' | 'DE' | 'UK' | 'NL' | 'NO' | 'FR' | 'US' | ...
  city: string
  zipCode: string
  age: number
  gender: 'M' | 'F'
  acquisitionSource: AcquisitionSource
  
  // ─── HISTORIQUE (disponible dès Gate 0) ─────────────────────────────
  pastEditions: PastEdition[]       // éditions 2021–2025
  totalEditionsApplied: number      // calculé
  totalEditionsRaced: number        // calculé
  isReturningAthlete: boolean       // a participé au moins 1 fois
  
  // ─── ENGAGEMENT (disponible dès Gate 0) ─────────────────────────────
  engagement: EngagementData
  
  // ─── GATE 1 — Registration opens ────────────────────────────────────
  registrationDate?: string         // date de dépôt de candidature 2026
  distance?: 'Marathon 42K' | 'Half Marathon 21K'
  estimatedFinishTime?: string      // temps estimé déclaré
  externalProspect?: boolean        // vient d'une source externe (contest, partenaire)
  externalProspectSource?: string   // ex: "Nike Running Contest 2025"
  
  // Score pré-calculé (statique dans la DB)
  candidacyScore?: number           // 0–100, valeur lifetime + probabilité sélection
  anticipatedValue?: number         // €, valeur estimée si sélectionné (upsells + fidélité)
  selectionProbability?: number     // 0–1, probabilité d'être sélectionné historiquement
  
  // Segment pre-lottery (statique)
  preLotterySegment?: 'ambassador' | 'to_reactivate' | 'opportunist' | 'cold_prospect'
  
  // ─── GATE 2 — Lottery result ─────────────────────────────────────────
  registrationStatus?: 'registered' | 'waitlist' | 'refused'
  lotteryDate?: string
  waitlistPosition?: number         // si waitlist, position dans la file
  upsellsPurchased?: UpsellItem[]   // upsells achetés post-sélection
  upsellRevenue?: number            // € total upsells
  paymentStatus?: 'paid' | 'pending' | 'failed'
  
  // Segment post-lottery (statique)
  postLotterySegment?: 'confirmed_engaged' | 'confirmed_passive' | 'waitlist_hot' | 'waitlist_cold' | 'refused_reactivatable' | 'refused_lost'
  
  // ─── GATE 3 — Race finish ────────────────────────────────────────────
  raceStatus?: 'finisher' | 'dns' | 'dnf'
  finishTime?: string               // ex: "3:42:15"
  finishCategory?: string           // ex: "M40-44"
  finishRank?: number               // classement général
  personalBest?: boolean            // nouveau record personnel
  
  // Probabilité de retour édition suivante (statique, calculée sur historique)
  reRegistrationProbability?: number  // 0–1
  
  // Segment post-race (statique)
  postRaceSegment?: 'loyal_finisher' | 'champion_ambassador' | 'at_risk_returner' | 'lost_dns' | 'reconquest_dnf'
}
```

---

## Types par gate (ce que chaque gate "voit")

```ts
// lib/types/gates.ts

// Gate 0 — création event : pas d'athletes individuels
// Vue agrégée uniquement (stats historiques par nationalité, source, etc.)

// Gate 1 — Registration opens
export type Gate1Athlete = Pick<Athlete,
  'id' | 'firstName' | 'lastName' | 'nationality' | 'acquisitionSource' |
  'pastEditions' | 'isReturningAthlete' | 'engagement' |
  'registrationDate' | 'distance' | 'candidacyScore' |
  'anticipatedValue' | 'selectionProbability' | 'preLotterySegment' |
  'externalProspect' | 'externalProspectSource'
>

// Gate 2 — Lottery result
export type Gate2Athlete = Gate1Athlete & Pick<Athlete,
  'registrationStatus' | 'waitlistPosition' | 'upsellsPurchased' |
  'upsellRevenue' | 'paymentStatus' | 'postLotterySegment'
>

// Gate 3 — Race finish
export type Gate3Athlete = Gate2Athlete & Pick<Athlete,
  'raceStatus' | 'finishTime' | 'finishCategory' | 'finishRank' |
  'personalBest' | 'reRegistrationProbability' | 'postRaceSegment'
>
```

---

## Segments par gate (valeurs statiques hardcodées)

### Gate 0 — Event Creation
Pas de segments individuels. Vue agrégée uniquement :
- Distribution historique par nationalité
- Taux de conversion ballot → course par édition
- Revenus upsells par édition

### Gate 1 — Pre-lottery (matrice 4 quadrants)

| Segment | Critère | Taille estimée | Couleur UI |
|---|---|---|---|
| `ambassador` | haute valeur × haute probabilité | ~3,200 athletes | vert |
| `to_reactivate` | haute valeur × faible probabilité | ~2,800 athletes | orange |
| `opportunist` | faible valeur × haute probabilité | ~7,500 athletes | bleu |
| `cold_prospect` | faible valeur × faible probabilité | ~6,500 athletes | gris |

### Gate 2 — Post-lottery

| Segment | Statut | Taille estimée | Couleur UI |
|---|---|---|---|
| `confirmed_engaged` | registered + engagement score > 60 | ~8,200 athletes | vert |
| `confirmed_passive` | registered + engagement score ≤ 60 | ~3,800 athletes | jaune |
| `waitlist_hot` | waitlist + position ≤ 200 | ~800 athletes | orange |
| `waitlist_cold` | waitlist + position > 200 | ~1,200 athletes | gris |
| `refused_reactivatable` | refused + isReturningAthlete | ~2,400 athletes | rouge clair |
| `refused_lost` | refused + première candidature | ~3,600 athletes | gris |

### Gate 3 — Post-race

| Segment | Critère | Taille estimée | Couleur UI |
|---|---|---|---|
| `loyal_finisher` | finisher + reRegistrationProbability > 0.7 | ~6,800 athletes | vert |
| `champion_ambassador` | finisher + personalBest + engagement > 75 | ~1,400 athletes | rouge |
| `at_risk_returner` | finisher + reRegistrationProbability ≤ 0.4 | ~2,100 athletes | orange |
| `lost_dns` | dns | ~1,200 athletes | gris |
| `reconquest_dnf` | dnf | ~500 athletes | jaune |

---

## Distribution nationalités (DB statique)

| Nationalité | % du total | Nb athletes |
|---|---|---|
| DK (Danemark) | 38% | 7,600 |
| SE (Suède) | 14% | 2,800 |
| DE (Allemagne) | 12% | 2,400 |
| UK (Royaume-Uni) | 10% | 2,000 |
| NL (Pays-Bas) | 8% | 1,600 |
| NO (Norvège) | 7% | 1,400 |
| FR (France) | 5% | 1,000 |
| Autres | 6% | 1,200 |

---

## Taux de ré-inscription historique (point 11)

```ts
// Utilisé pour calculer reRegistrationProbability par athlete
// et justifier la valeur du module post-race

export const REREGISTRATION_RATES = {
  naturalReturnRate: 0.65,        // 65% reviennent sans intervention
  aiTargetedReturnRate: 0.82,     // 82% avec campagne AI ciblée (projeté)
  incrementalAthletes: 1950,      // ~1,950 athletes supplémentaires récupérés
  incrementalRevenue: 97500,      // € (1,950 × ~€50 entry fee moyen)
}
```

---

## Note sur les données externes (Gate 1)

Les prospects externes représentent ~8% du total (1,600 athletes).
Sources simulées :
- `"Nike Running Club Copenhagen Contest"` — 600 prospects
- `"Intersport Partner Program"` — 500 prospects
- `"Parkrun Denmark Partnership"` — 500 prospects

Ces athletes ont `externalProspect: true` et n'ont pas forcément d'historique
sur les éditions précédentes. Leur `selectionProbability` est plus faible
et leur segment pre-lottery est majoritairement `cold_prospect` ou `opportunist`.
