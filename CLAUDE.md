# CLAUDE.md — Instructions globales pour Claude Code

## Contexte du projet

Sparta Co-Pilot est un outil de marketing automation pour organisateurs
d'événements sportifs. Ce POC est conçu pour une démo client avec
l'organisateur du Copenhagen Marathon.

Stack : Next.js 14 (App Router), TypeScript, Tailwind CSS, Anthropic API.

---

## Structure du projet

```
sparta-copilot/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                         (redirect vers /gate/registration)
│   ├── gate/
│   │   ├── creation/page.tsx            (Gate 0 — Event Creation)
│   │   ├── registration/page.tsx        (Gate 1 — Pre-lottery)
│   │   ├── lottery/page.tsx             (Gate 2 — Post-lottery)
│   │   └── finish/page.tsx              (Gate 3 — Post-race)
│   ├── api/
│   │   └── ai/
│   │       ├── route.ts                 (génération campagne, streaming)
│   │       ├── parse-segment/route.ts   (NL → filtres structurés)
│   │       └── suggest-segment/route.ts (objectif métier → profil + filtres)
│   └── globals.css                      (CSS vars Datasport)
├── lib/
│   ├── db/
│   │   ├── athletes.ts                  (500 athletes statiques)
│   │   ├── segment-filter.ts            (filterAthletes + dérivation gate0Segment)
│   │   └── segment-stats.ts             (calcul distributions / percentiles DB)
│   ├── types/
│   │   ├── athlete.ts                   (type Athlete complet)
│   │   ├── gates.ts                     (types par gate)
│   │   └── segments.ts                  (FilterField, FilterCondition, CustomSegment,
│   │                                     FILTER_FIELD_LABELS, FILTER_VALUE_OPTIONS,
│   │                                     CUSTOM_SEGMENT_COLORS, buildSegmentDescription)
│   ├── ai/
│   │   └── prompts.ts                   (system prompts par gate/segment)
│   └── constants.ts                     (EVENT, SEGMENT_SIZES, KPI, REREGISTRATION_RATES)
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── gates/
│   │   ├── GateTimeline.tsx
│   │   ├── SegmentCard.tsx
│   │   ├── ChannelSelector.tsx
│   │   └── SegmentBuilder.tsx           (modal création segment personnalisé)
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
La fonction `filterAthletes(filters, baseSegmentIds?, segmentField?)` :
- Filtre le pool selon un scope de segments (`baseSegmentIds` + `segmentField`)
- Applique les filtres démographiques (`FilterCondition[]`)
- Cas spécial : `segmentField === 'gate0Segment'` → segment dérivé dynamiquement
  depuis les champs existants (pas stocké dans la DB)

### Statistiques DB (`lib/db/segment-stats.ts`)
`formatStatsForPrompt()` calcule les percentiles et distributions de la DB
(engagement p25/50/75/90, âges, éditions, nationalités, % retournants)
et retourne une string injectée dans le prompt `/api/ai/suggest-segment`.

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
5. **Filtres** — filtres démographiques manuels (9 champs disponibles)
6. **Objectif & contexte** — texte libre injecté dans le prompt de génération de campagne
7. **Compteur** — nombre d'athletes correspondant aux critères (mis à l'échelle)

### Affichage dans les gates
- Header colonne gauche : `[LABEL] [total athletes in this gate] — [+ Créer un segment]`
- Segments prédéfinis : `SegmentCard` en liste verticale
- Segments custom : rows avec point coloré + nom + compteur + bouton delete, directement sous les prédéfinis
- Sélection d'un segment custom : panel campagne à droite avec badge CUSTOM

---

## API Claude — règles strictes

### Route principale : génération de campagne
```ts
// app/api/ai/route.ts
model: "claude-sonnet-4-6"
max_tokens: 1024
stream: true
// Paramètre supplémentaire :
segmentDescription?: string  // injecté dans le user prompt pour les segments custom
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

### System prompts
Définis dans `lib/ai/prompts.ts`, importés depuis `docs/AI_PROMPTS.md`.
Un system prompt par combinaison gate + segment.
La clé `custom_segment` existe pour tous les gates — le contexte est injecté
via `buildSegmentDescription(segment)` dans le user prompt.
Ne jamais écrire les prompts directement dans les composants.

### Format de réponse (génération campagne)
Claude répond toujours en JSON structuré (voir `docs/AI_PROMPTS.md`).
Parser la réponse côté client avec un try/catch.
En cas d'erreur de parsing, afficher un message d'erreur propre sans crash.

### Streaming
Activé uniquement pour la génération de campagne (`/api/ai/route.ts`).
Les routes `parse-segment` et `suggest-segment` ne streament pas.

---

## Comportements critiques pour la démo

1. **Navigation entre gates instantanée** — pas de loading, données statiques
2. **Génération < 8 secondes** — afficher un loader engageant pendant l'attente
3. **Régénération d'un channel seul** — ne pas régénérer les autres assets
4. **JSON malformé** — fallback propre, pas de crash
5. **Chiffres UI toujours visibles** — affichés sur les cartes segment avant toute interaction
6. **Segments custom en mémoire uniquement** — pas de persistance entre rechargements

---

## Ce que cet outil ne fait PAS

- Pas de génération d'images via IA
- Pas d'authentification
- Pas de base de données réelle (tout est statique)
- Pas d'envoi réel de campagnes ("Approve & schedule" est un bouton UI sans action)
- Pas de liste d'événements — un seul event, Copenhagen Marathon 2026
- Pas de persistance des segments personnalisés (mémoire React uniquement)
