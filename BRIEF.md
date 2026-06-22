# BRIEF.md — Sparta Co-Pilot

## Mission

Construire une app Next.js 14 appelée Sparta Co-Pilot.
C'est un outil de marketing automation pour l'organisateur du Copenhagen Marathon.
L'app permet de segmenter la base d'athletes par gate du lifecycle
et de générer des campagnes marketing personnalisées via Claude (Anthropic API).

---

## Fichiers de référence à lire en premier

Avant d'écrire la moindre ligne de code, lire dans cet ordre :

1. `docs/DATA_MODEL.md` — structure des données, types, segments
2. `docs/GATES.md` — spec fonctionnelle des 4 gates
3. `docs/AI_PROMPTS.md` — prompts système par gate et segment
4. `CLAUDE.md` — règles globales, structure projet, design system

---

## Ordre de build recommandé

### Étape 1 — Setup
- `npx create-next-app@latest sparta-copilot --typescript --tailwind --app`
- Installer : `@anthropic-ai/sdk`
- Copier les fichiers woff2 Saans dans `/public/fonts/`
- Créer `app/globals.css` avec tous les CSS vars Datasport (voir CLAUDE.md)

### Étape 2 — Types et constantes
- Créer `lib/types/athlete.ts` (type Athlete complet, voir DATA_MODEL.md)
- Créer `lib/types/gates.ts` (types Gate1Athlete, Gate2Athlete, Gate3Athlete)
- Créer `lib/constants.ts` (EVENT, SEGMENT_SIZES, REREGISTRATION_RATES)

### Étape 3 — Base de données statique
Générer `lib/db/athletes.ts` avec **500 athletes fictifs** respectant :
- Distribution nationalités : 38% DK, 14% SE, 12% DE, 10% UK, 8% NL, 7% NO, 5% FR, 6% autres
- Distribution segments gate1 : ~160 ambassador, ~140 to_reactivate, ~125 opportunist, ~75 cold_prospect
- Distribution segments gate2 : ~205 confirmed_engaged, ~95 confirmed_passive, ~20 waitlist_hot, ~30 waitlist_cold, ~60 refused_reactivatable, ~90 refused_lost
- Distribution segments gate3 : ~170 loyal_finisher, ~35 champion_ambassador, ~53 at_risk_returner, ~30 lost_dns, ~12 reconquest_dnf
- ~40 athletes avec externalProspect: true
- Tous les champs du type Athlete renseignés (pastEditions 2021-2025, engagement, upsells, etc.)
- Noms réalistes selon les nationalités (prénoms danois pour DK, allemands pour DE, etc.)

### Étape 4 — Layout global
- `components/layout/Sidebar.tsx` — sidebar noire (#141414), navigation 4 gates
- `components/layout/Topbar.tsx` — breadcrumb, badge "Live", logo Datasport
- `app/layout.tsx` — sidebar + topbar, scroll sur le contenu principal

### Étape 5 — Prompts AI
- Créer `lib/ai/prompts.ts` en transcrivant exactement les prompts de `docs/AI_PROMPTS.md`
- Un objet `SYSTEM_PROMPTS` avec une clé par gate et par segment

### Étape 6 — Route API
- Créer `app/api/ai/route.ts`
- POST handler avec streaming
- Reçoit : `{ gate, segment, channels, customInstructions? }`
- Sélectionne le bon system prompt depuis `lib/ai/prompts.ts`
- Construit le user prompt dynamiquement avec les stats du segment
- Retourne le stream Claude

### Étape 7 — Composants gates
- `components/gates/GateTimeline.tsx` — timeline 4 gates cliquables
- `components/gates/SegmentCard.tsx` — carte cliquable par segment (badge, taille, description)
- `components/gates/ChannelSelector.tsx` — toggle email/SMS/push/instagram avec rationale AI

### Étape 8 — Composants campagne
- `components/campaign/CampaignGenerator.tsx` — bouton Generate + loading state
- `components/campaign/AssetCard.tsx` — affichage d'un asset généré (email/SMS/push/instagram)
- `components/campaign/RegeneratePrompt.tsx` — textarea + bouton régénération par channel

### Étape 9 — Pages gates
- `app/gate/creation/page.tsx` — Gate 0 (vue agrégée, pas de segments individuels)
- `app/gate/registration/page.tsx` — Gate 1 (matrice 4 quadrants)
- `app/gate/lottery/page.tsx` — Gate 2 (6 segments)
- `app/gate/finish/page.tsx` — Gate 3 (5 segments)
- `app/page.tsx` — redirect vers `/gate/registration`

### Étape 10 — Polish
- KPI strip en haut de chaque gate (chiffres constants depuis lib/constants.ts)
- Animations de loading pendant la génération (dots animés, pas juste un spinner)
- Gestion d'erreur propre si JSON malformé
- Vérifier que la navigation entre gates est instantanée

---

## Référence visuelle

Le fichier `docs/standalone.html` est la référence visuelle du projet.
Le design Next.js doit être fidèle à ce standalone :
- Même sidebar noire avec navigation
- Même topbar avec breadcrumb et badge Live
- Même timeline de gates
- Mêmes cartes segments avec badges colorés
- Même interface de génération avec les asset cards

---

## Variables d'environnement

```
ANTHROPIC_API_KEY=sk-ant-...
```

Fichier `.env.local` à la racine, jamais commité.

---

## Ce que cet outil ne fait PAS

- Pas de génération d'images (les visuels sont des placeholders UI)
- Pas d'authentification
- Pas de base de données réelle
- Pas d'envoi réel ("Approve & schedule" = bouton UI sans action backend)
- Pas de liste d'événements — un seul event fixe : Copenhagen Marathon 2026
