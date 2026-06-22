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
│   ├── page.tsx                    (redirect vers /gate/registration)
│   ├── gate/
│   │   ├── creation/page.tsx       (Gate 0)
│   │   ├── registration/page.tsx   (Gate 1)
│   │   ├── lottery/page.tsx        (Gate 2)
│   │   └── finish/page.tsx         (Gate 3)
│   ├── api/
│   │   └── ai/route.ts             (route API Claude, streaming)
│   └── globals.css                 (CSS vars Datasport)
├── lib/
│   ├── db/
│   │   └── athletes.ts             (500 athletes statiques)
│   ├── types/
│   │   ├── athlete.ts              (type Athlete complet)
│   │   └── gates.ts                (types par gate)
│   ├── ai/
│   │   └── prompts.ts              (system prompts par gate/segment)
│   └── constants.ts                (EVENT, chiffres UI, REREGISTRATION_RATES)
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── gates/
│   │   ├── GateTimeline.tsx
│   │   ├── SegmentCard.tsx
│   │   └── ChannelSelector.tsx
│   └── campaign/
│       ├── CampaignGenerator.tsx
│       ├── AssetCard.tsx
│       └── RegeneratePrompt.tsx
└── public/
    └── fonts/                      (Saans Regular, Saans Medium, Saans Mono)
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
- Distribution segments : respecter les proportions définies dans `docs/GATES.md`
- ~40 athletes avec `externalProspect: true`
- Tous les champs du type `Athlete` doivent être renseignés pour chaque athlete

### Chiffres UI vs DB statique
Les chiffres affichés dans l'interface (tailles de segments, totaux)
proviennent de `lib/constants.ts`, PAS du comptage de la DB statique.
La DB statique sert uniquement à afficher les listes d'athletes.

```ts
// lib/constants.ts — exemple
export const SEGMENT_SIZES = {
  gate1: {
    ambassador: 3200,
    to_reactivate: 2800,
    opportunist: 7500,
    cold_prospect: 6500,
  },
  // ...
}
```

---

## API Claude — règles strictes

### Configuration
```ts
// app/api/ai/route.ts
model: "claude-sonnet-4-6"
max_tokens: 1024
stream: true
```

### System prompts
Définis dans `lib/ai/prompts.ts`, importés depuis `docs/AI_PROMPTS.md`.
Un system prompt par combinaison gate + segment.
Ne jamais écrire les prompts directement dans les composants.

### Format de réponse
Claude répond toujours en JSON structuré (voir `docs/AI_PROMPTS.md`).
Parser la réponse côté client avec un try/catch.
En cas d'erreur de parsing, afficher un message d'erreur propre sans crash.

### Streaming
Utiliser le streaming Next.js (`StreamingTextResponse` ou équivalent App Router).
Le texte s'affiche progressivement dans l'interface pendant la génération.

---

## Comportements critiques pour la démo

1. **Navigation entre gates instantanée** — pas de loading, données statiques
2. **Génération < 8 secondes** — afficher un loader engageant pendant l'attente
3. **Régénération d'un channel seul** — ne pas régénérer les autres assets
4. **JSON malformé** — fallback propre, pas de crash
5. **Chiffres UI toujours visibles** — affichés sur les cartes segment avant toute interaction

---

## Ce que cet outil ne fait PAS

- Pas de génération d'images via IA
- Pas d'authentification
- Pas de base de données réelle (tout est statique)
- Pas d'envoi réel de campagnes ("Approve & schedule" est un bouton UI sans action)
- Pas de liste d'événements — un seul event, Copenhagen Marathon 2026
