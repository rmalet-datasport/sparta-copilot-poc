# CLAUDE.md — Instructions globales pour Claude Code

## Contexte du projet

Sparta Co-Pilot est un outil de marketing automation pour organisateurs
d'événements sportifs. Ce POC est conçu pour une démo client avec
l'organisateur du Copenhagen Marathon.

Stack : Next.js 15 (App Router), TypeScript, Tailwind CSS, Anthropic API, SheetJS (xlsx).

---

## Structure du projet

```
sparta-copilot/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                         (redirect vers /gate/registration)
│   ├── brand-voice/
│   │   └── page.tsx                     (Brand Voice — upload historique campagnes)
│   ├── campaigns/
│   │   └── page.tsx                     (campagnes sauvegardées)
│   ├── gate/
│   │   ├── creation/page.tsx            (Gate 0 — Event Creation)
│   │   ├── registration/page.tsx        (Gate 1 — Pre-lottery)
│   │   ├── lottery/page.tsx             (Gate 2 — Post-lottery)
│   │   └── finish/page.tsx              (Gate 3 — Post-race)
│   ├── api/
│   │   └── ai/
│   │       ├── route.ts                 (génération campagne, streaming)
│   │       ├── parse-segment/route.ts   (NL → filtres structurés)
│   │       ├── suggest-segment/route.ts (objectif métier → profil + filtres)
│   │       └── analyze-gate/route.ts   (analyse pool athletes → sous-segments IA)
│   └── globals.css                      (CSS vars Datasport)
├── lib/
│   ├── db/
│   │   ├── athletes.ts                  (500 athletes statiques)
│   │   ├── segment-filter.ts            (filterAthletes + dérivation gate0Segment)
│   │   └── segment-stats.ts             (calcul distributions / percentiles DB)
│   ├── types/
│   │   ├── athlete.ts                   (type Athlete complet)
│   │   ├── gates.ts                     (types par gate)
│   │   ├── segments.ts                  (FilterField, FilterCondition, CustomSegment,
│   │   │                                 FILTER_FIELD_LABELS, FILTER_VALUE_OPTIONS,
│   │   │                                 CUSTOM_SEGMENT_COLORS, buildSegmentDescription)
│   │   └── brandHistory.ts              (interface BrandExample)
│   ├── context/
│   │   ├── CampaignHistoryContext.tsx   (historique campagnes sauvegardées)
│   │   └── BrandHistoryContext.tsx      (exemples historiques + parsing xlsx/csv)
│   ├── ai/
│   │   └── prompts.ts                   (system prompts + buildHistoricalExamplesBlock)
│   └── constants.ts                     (EVENT, SEGMENT_SIZES, KPI, REREGISTRATION_RATES, RACES)
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── gates/
│   │   ├── GateTimeline.tsx
│   │   ├── SegmentCard.tsx
│   │   ├── ChannelSelector.tsx
│   │   ├── SegmentBuilder.tsx           (modal création segment personnalisé)
│   │   └── AISubSegments.tsx            (widget découverte sous-segments par IA)
│   └── campaign/
│       ├── CampaignGenerator.tsx
│       ├── AssetCard.tsx
│       └── RegeneratePrompt.tsx
└── public/
    └── fonts/                           (Saans Regular, Saans Medium, Saans Mono)
```

---

## Design system — règles strictes

### Polices
Trois fichiers woff2 dans `/public/fonts/` :
- `Saans-Regular.woff2` (weight 400)
- `Saans-Medium.woff2` (weight 570)
- `SaansMono-Regular.woff2` (weight 380)

Déclarées dans `globals.css` via `@font-face`.
Ne jamais utiliser d'autre police.

### Couleurs
Utiliser exclusivement les CSS variables définies dans `globals.css`.
Ne jamais écrire de valeurs hex directement dans les composants.

Variables principales :
```css
--primary: var(--color-red-700)        /* #D6001D — rouge Datasport */
--secondary: var(--color-grey-900)     /* #141414 — noir sidebar */
--fg-1: var(--color-grey-900)          /* texte principal */
--fg-2: var(--color-grey-700)          /* texte secondaire */
--fg-3: var(--color-grey-500)          /* texte tertiaire */
--bg-1: var(--color-white)             /* surface */
--bg-2: var(--color-grey-50)           /* surface subtile */
--border-1: var(--color-grey-200)      /* bordure légère */
```

### Tailwind
Tailwind est utilisé uniquement pour le layout (flex, grid, gap, padding, margin).
Jamais pour les couleurs, polices ou border-radius — utiliser les CSS vars.

---

## Données — règles strictes

### DB athletes
- Fichier : `lib/db/athletes.ts`
- 500 athletes statiques, générés selon `docs/DATA_MODEL.md`
- Distribution nationalités : 38% DK, 14% SE, 12% DE, 10% UK, 8% NL, 7% NO, 5% FR, 6% autres
- ~40 athletes avec `externalProspect: true`
- Tous les champs du type `Athlete` doivent être renseignés pour chaque athlete

### Chiffres UI vs DB statique
Les chiffres affichés dans l'interface (tailles de segments, totaux)
proviennent de `lib/constants.ts`, PAS du comptage de la DB statique.
La DB statique sert uniquement à filtrer et afficher les listes d'athletes.
Le comptage réel (rawCount) est mis à l'échelle vers les chiffres UI via :

```ts
scaledCount = Math.round(rawCount / DB_SIZE * effectiveTotal)
```

### Filtrage athletes (`lib/db/segment-filter.ts`)
La fonction `filterAthletes(filters, baseSegmentIds?, segmentField?, baseAthleteIds?)` :
- Filtre le pool selon un scope de segments (`baseSegmentIds` + `segmentField`)
- Ou directement selon un `Set<string>` d'IDs (`baseAthleteIds`) — prioritaire sur `baseSegmentIds`
- Applique les filtres démographiques (`FilterCondition[]`)
- Cas spécial : `segmentField === 'gate0Segment'` → segment dérivé dynamiquement
  depuis les champs existants (pas stocké dans la DB)

### Statistiques DB (`lib/db/segment-stats.ts`)
Deux fonctions disponibles :
- `formatStatsForPrompt()` — stats complètes de la DB (engagement p25/50/75/90, âges, éditions, nationalités, % retournants, distance). Injectée dans `/api/ai/suggest-segment` et `/api/ai/analyze-gate` (pool complet).
- `formatStatsForSubPool(pool: Athlete[])` — même structure mais calculée sur un sous-pool arbitraire. Injectée dans `/api/ai/analyze-gate` quand `athleteIds` est fourni.

---

## Segments personnalisés — fonctionnement

Chaque gate permet à l'organisateur de créer des segments personnalisés
via le composant `SegmentBuilder`. Ces segments existent uniquement en mémoire
React (pas de persistance) et disparaissent au rechargement.

### Types (`lib/types/segments.ts`)

```ts
type FilterField =
  | 'gender' | 'age_min' | 'age_max' | 'nationality' | 'isReturningAthlete'
  | 'total_editions_min' | 'total_editions_max' | 'engagement_min' | 'city_contains'
  | 'distance' | 'hasInsurance'

interface FilterCondition { id: string; field: FilterField; value: string }

interface CustomSegment {
  id: string; name: string; color: string; colorBg: string
  filters: FilterCondition[]
  baseSegmentIds: string[]    // scope — vide = tous les athletes
  baseSegmentLabels: string[] // labels lisibles pour l'affichage
  objective?: string          // contexte libre pour la génération IA
}
```

### SegmentBuilder (`components/gates/SegmentBuilder.tsx`)
Modal avec 5 sections dans l'ordre :
1. **Nom** — champ texte libre
2. **Décrire en langage naturel** — NL → `/api/ai/parse-segment` → filtres auto-appliqués
3. **Définir par objectif métier** — objectif → `/api/ai/suggest-segment` → portrait + filtres + insights
4. **Scope** — pills des segments prédéfinis du gate (sélection multiple) + "Tous les athletes"
5. **Filtres** — filtres démographiques manuels (11 champs : gender, age_min, age_max, nationality, isReturningAthlete, total_editions_min, total_editions_max, engagement_min, city_contains, distance, hasInsurance)
6. **Objectif & contexte** — texte libre injecté dans le prompt de génération de campagne
7. **Compteur** — nombre d'athletes correspondant aux critères (mis à l'échelle)

Accepte `initialSegment?: CustomSegment` pour pré-remplir le formulaire (édition d'un segment existant).

`GateSegmentDef` (interface exportée) :
```ts
interface GateSegmentDef {
  id: string
  label: string
  color: string
  filters?: FilterCondition[]   // présent pour les segments générés par IA (AISubSegments)
}
```
Quand `filters` est présent dans un `GateSegmentDef` sélectionné en scope, le compteur calcule l'intersection via `filterAthletes` directement (pas via `athleteSegmentField`).

### Affichage dans les gates
- Header colonne gauche : `[LABEL] [total athletes in this gate] — [+ Créer un segment]`
- Segments prédéfinis : `SegmentCard` en liste verticale
- Segments custom : rows avec point coloré + nom + compteur + bouton delete, directement sous les prédéfinis
- Sélection d'un segment custom : panel campagne à droite avec badge CUSTOM

### AISubSegments (`components/gates/AISubSegments.tsx`)
Widget affiché dans le panneau de droite quand un segment est sélectionné. Permet de découvrir des sous-groupes IA dans la population du segment courant.

Props :
```ts
interface Props {
  parentId: string              // '__full_pool__' ou id d'un segment prédéfini
  parentLabel: string
  parentAthleteIds: string[]    // IDs filtrés du pool courant
  parentScaledSize: number      // taille UI du segment parent
  parentFilters?: FilterCondition[]  // filtres du parent pour merge si AI sub-segment
  onSelect: (seg: CustomSegment) => void
}
```

Comportement :
- État `idle` : bouton "Découvrir des sous-segments"
- Au clic → appelle `/api/ai/analyze-gate` avec `athleteIds` + `parentLabel`
- Affiche 3–4 sous-segments avec nom, description, compteur scalé
- Sélectionner un sous-segment → crée un `CustomSegment` avec les filtres du sous-segment
  (mergés avec `parentFilters` si fournis) et appelle `onSelect()`
- Bouton "Relancer" pour re-analyser une fois les résultats affichés

---

## API Claude — règles strictes

### Route principale : génération de campagne
```ts
// app/api/ai/route.ts
model: "claude-sonnet-4-6"
max_tokens: 1024
stream: true
// Paramètres du body :
segmentDescription?: string    // injecté dans le user prompt pour les segments custom
historicalExamples?: BrandExample[]  // exemples filtrés par BrandHistoryContext
selectedRaces?: Race[]         // courses à promouvoir (sélecteur dans CampaignGenerator)
```

### Route parse-segment : NL → filtres
```ts
// app/api/ai/parse-segment/route.ts
// Input : { text: string }
// Output : { filters: FilterCondition[], interpretation: string }
// Modèle : claude-sonnet-4-6, max_tokens: 512, pas de streaming
```

### Route suggest-segment : objectif → profil
```ts
// app/api/ai/suggest-segment/route.ts
// Input : { objective: string, gateContext?: string }
// Output : { portrait: string, filters: FilterCondition[], insights: string[], rationale: string }
// Modèle : claude-sonnet-4-6, max_tokens: 800, pas de streaming
// Stats DB injectées automatiquement via formatStatsForPrompt()
```

### Route analyze-gate : pool → sous-segments IA
```ts
// app/api/ai/analyze-gate/route.ts
// Input : { athleteIds?: string[], parentLabel?: string }
// Output : { segments: AIRawSegment[] }   (3–4 segments si athleteIds fourni, 4 sinon)
// Modèle : claude-sonnet-4-6, max_tokens: 1200, pas de streaming
// Si athleteIds fourni → formatStatsForSubPool() ; sinon → formatStatsForPrompt()
// Chaque segment retourné : { id, name, description, suggestedChannels, channelRationale, filters, color, colorBg }
```
Utilisée par `AISubSegments.tsx` pour découvrir des sous-groupes actionnables dans un segment parent.

### System prompts
Définis dans `lib/ai/prompts.ts`, importés depuis `docs/AI_PROMPTS.md`.
Un system prompt par combinaison gate + segment.
La clé `custom_segment` existe pour tous les gates — le contexte est injecté
via `buildSegmentDescription(segment)` dans le user prompt.
Ne jamais écrire les prompts directement dans les composants.

### Helpers prompts (`lib/ai/prompts.ts`)
- `buildUserPrompt(params)` — construit le user prompt ; accepte `historicalExamples?: BrandExample[]` et `selectedRaces?: Race[]` (0 = comportement neutre, 1 = message spécifique, 2+ = message ombrelle)
- `buildRegeneratePrompt(channel, instructions, historicalExamples?, selectedRaces?)` — régénération channel seul, intègre aussi le contexte courses
- `buildHistoricalExamplesBlock(examples)` — formate les exemples historiques en bloc texte injecté dans le prompt

### Format de réponse (génération campagne)
Claude répond toujours en JSON structuré (voir `docs/AI_PROMPTS.md`).
Parser la réponse côté client avec un try/catch.
En cas d'erreur de parsing, afficher un message d'erreur propre sans crash.

### Streaming
Activé uniquement pour la génération de campagne (`/api/ai/route.ts`).
Les routes `parse-segment` et `suggest-segment` ne streament pas.

---

## Sélecteur de courses (cross-sell)

`CampaignGenerator` expose un sélecteur "Promote events" avant le bouton Generate.

### Courses disponibles (`lib/constants.ts` → `RACES`)
| id | name | distance | type |
|---|---|---|---|
| `marathon_42k` | Copenhagen Marathon | 42K | main |
| `half_marathon_21k` | Copenhagen Half Marathon | 21K | main |
| `cph_city_run_10k` | CPH City Run | 10K | satellite |
| `cph_city_run_5k` | CPH City Run | 5K | satellite |

### Comportement
- Rien coché par défaut — le client choisit ce qu'il veut promouvoir
- Les courses sont groupées en deux catégories visuelles : Main events / Satellite events
- Le prompt s'adapte selon la sélection :
  - **0 courses cochées** : comportement actuel, pas de contexte course spécifique
  - **1 course cochée** : prompt spécifique à cette course
  - **2+ courses cochées** : prompt ombrelle, message générique couvrant toutes les courses sélectionnées
- `selectedRaces` est passé à l'API dans les deux cas (génération + régénération channel seul)
- Le hint "multi-event = message ombrelle" s'affiche quand 2+ courses sont sélectionnées

---

## Édition inline des assets générés

`AssetCard` supporte l'édition directe du texte après génération.

### Comportement
- Tous les champs texte (subject, title, body, caption, hashtags) sont des `<input>` / `<textarea>` éditables
- Visuellement identiques à du texte statique — bordure subtile au hover/focus
- Les `<textarea>` s'auto-redimensionnent à la saisie
- L'état édité est local à `AssetCard` (`editedAsset` state)
- Reset automatique si l'asset est régénéré (via `useEffect` sur les champs de contenu)

### Preview Instagram Story temps réel
- La Story preview (`InstagramStoryPreview`) reçoit `editedAsset.caption` et `editedAsset.hashtags`
- Toute modification du texte se reflète immédiatement dans la preview

### Save
- `onSave(imageUrl?, editedAsset?)` transmet les champs édités à `CampaignGenerator`
- `saveAsset` utilise `editedAsset ?? asset` pour persister le contenu édité

---

## Brand Voice — historique campagnes

Feature permettant d'uploader des campagnes passées pour enrichir le contexte IA.

### Page (`app/brand-voice/page.tsx`)
- Explication de la feature en 3 étapes
- Table du format attendu + bouton téléchargement template CSV
- Zone drag & drop (`.xlsx`, `.xls`, `.csv`)
- État "chargé" : bannière verte + breakdown par channel et par gate
- Accessible depuis la sidebar (lien "Historique" avec badge compteur vert)

### Context (`lib/context/BrandHistoryContext.tsx`)
```ts
interface BrandHistoryContextValue {
  examples: BrandExample[]
  fileName: string | null
  uploadFile: (file: File) => Promise<void>   // parse xlsx ou csv
  clearExamples: () => void
  getRelevantExamples(context: { gate, segment, channel? }): BrandExample[]
}
```

`getRelevantExamples` filtre par gate + segment (+ channel optionnel), exclut les exemples qui contredisent le contexte, trie par score de spécificité, retourne max 6 exemples.

### Format du fichier Excel/CSV
Colonnes reconnues (FR + EN, insensible à la casse) :

| Colonne | Alias reconnus | Optionnel |
|---|---|---|
| `channel` | canal, ch | oui |
| `gate` | phase, etape, step | oui |
| `segment` | audience, cible, target | oui |
| `subject` | objet, sujet | — |
| `title` | titre | — |
| `body` | texte, contenu, content, message | — |
| `caption` | legende, cap | — |
| `hashtags` | tags, hashtag | — |

Normalisation gate : `registration`/`1`/`gate1` → `gate1`, `lottery`/`2` → `gate2`, etc.

### Injection dans le prompt
`buildHistoricalExamplesBlock(examples)` formate les exemples en bloc texte inséré dans `buildUserPrompt` et `buildRegeneratePrompt`. L'IA est instruite de s'inspirer du style sans copier mot pour mot.

### Scoring et filtrage
- Match channel : +2 pts
- Match gate : +2 pts
- Match segment : +2 pts
- Contradiction sur un champ → exemple exclu
- Max 6 exemples par génération

---

## Comportements critiques pour la démo

1. **Navigation entre gates instantanée** — pas de loading, données statiques
2. **Génération < 8 secondes** — afficher un loader engageant pendant l'attente
3. **Régénération d'un channel seul** — ne pas régénérer les autres assets
4. **JSON malformé** — fallback propre, pas de crash
5. **Chiffres UI toujours visibles** — affichés sur les cartes segment avant toute interaction
6. **Segments custom en mémoire uniquement** — pas de persistance entre rechargements
7. **Brand Voice en mémoire uniquement** — disparaît au rechargement, pas de persistance

---

## Ce que cet outil ne fait PAS

- Pas de génération d'images via IA
- Pas d'authentification
- Pas de base de données réelle (tout est statique)
- Pas d'envoi réel de campagnes ("Approve & schedule" est un bouton UI sans action)
- Pas de liste d'événements — un seul event, Copenhagen Marathon 2026
- Pas de persistance des segments personnalisés (mémoire React uniquement)
- Pas de persistance des exemples Brand Voice (mémoire React uniquement)
