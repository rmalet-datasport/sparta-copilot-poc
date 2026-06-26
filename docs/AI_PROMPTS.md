# AI_PROMPTS.md — Prompts système et routes IA

## Vue d'ensemble des routes IA

| Route | Usage | Streaming | Output |
|---|---|---|---|
| `POST /api/ai` | Génération campagne marketing | Oui | JSON assets |
| `POST /api/ai/parse-segment` | NL → filtres structurés | Non | JSON filtres |
| `POST /api/ai/suggest-segment` | Objectif métier → profil segment | Non | JSON portrait + filtres + insights |
| `POST /api/ai/analyze-gate` | Pool athletes → sous-segments IA | Non | JSON segments (3–4) |

---

## Route 1 : Génération de campagne (`/api/ai/route.ts`)

### Configuration
```ts
model: "claude-sonnet-4-6"
max_tokens: 1024
stream: true
```

### Input
```ts
{
  gate: 'gate0' | 'gate1' | 'gate2' | 'gate3'
  segment: string          // ex: 'ambassador', 'custom_segment'
  channels: Channel[]      // ['email', 'sms', 'push', 'instagram']
  segmentDescription?: string  // injecté pour les segments personnalisés
}
```

### Output (JSON streamé)
```json
{
  "assets": [
    { "channel": "email", "subject": "...", "body": "...", "meta": "..." },
    { "channel": "sms", "body": "...", "meta": "..." },
    { "channel": "push", "title": "...", "body": "...", "meta": "..." },
    { "channel": "instagram", "caption": "...", "hashtags": "...", "meta": "..." }
  ]
}
```

Le champ `meta` décrit en une ligne l'intention de l'asset.

### System prompts
Définis dans `lib/ai/prompts.ts`, clés : `gate0.past_finishers`, `gate1.ambassador`, etc.
La clé `custom_segment` existe pour chaque gate et est enrichie via `segmentDescription`.

### User prompt (buildUserPrompt)
```ts
buildUserPrompt({
  channels,
  segmentDescription?,
  historicalExamples?,   // BrandExample[] — injecte un bloc d'exemples passés
  selectedRaces?,        // Race[] — 0 = neutre, 1 = message spécifique, 2+ = message ombrelle
})
```

### Régénération d'un channel seul (buildRegeneratePrompt)
```ts
buildRegeneratePrompt(channel, instructions, historicalExamples?, selectedRaces?)
// Demande à Claude de ne régénérer que l'asset du channel indiqué,
// en tenant compte des instructions libres et du contexte courses.
```

### Exemples historiques (buildHistoricalExamplesBlock)
```ts
buildHistoricalExamplesBlock(examples: BrandExample[]): string
// Formate les exemples en bloc texte inséré dans le prompt.
// Claude est instruit de s'en inspirer stylistiquement sans copier mot pour mot.
```

---

---

## Route 4 : Analyse de gate (`/api/ai/analyze-gate/route.ts`)

### Configuration
```ts
model: "claude-sonnet-4-6"
max_tokens: 1200
stream: false
```

### Input
```ts
{
  athleteIds?: string[]   // IDs des athletes du pool courant
  parentLabel?: string    // label du segment parent (contexte pour le prompt)
}
```

Si `athleteIds` est fourni → stats calculées sur le sous-pool via `formatStatsForSubPool()`.
Sinon → stats de la DB complète via `formatStatsForPrompt()`.

### Output
```ts
{
  segments: AIRawSegment[]  // 3–4 sous-segments
}

type AIRawSegment = {
  id: string
  name: string
  description: string
  suggestedChannels: string[]
  channelRationale: string
  filters: FilterCondition[]
  color: string       // hex couleur principale
  colorBg: string     // hex couleur de fond clair
}
```

### Comportement dans AISubSegments.tsx
- Utilisée par le widget "Découvrir des sous-segments" affiché dans le panel droit
- Résultat affiché comme liste cliquable : cliquer crée un `CustomSegment` avec les filtres
- Les filtres du sous-segment sélectionné sont mergés avec les filtres du parent si disponibles

---

## Route 2 : Parsing langage naturel (`/api/ai/parse-segment/route.ts`)

### Input
```ts
{ text: string }  // ex: "femmes danoises très engagées de Copenhague"
```

### Output
```json
{
  "filters": [
    { "field": "gender", "value": "F" },
    { "field": "nationality", "value": "DK" },
    { "field": "engagement_min", "value": "70" },
    { "field": "city_contains", "value": "Copenhagen" }
  ],
  "interpretation": "Femmes danoises avec un engagement élevé basées à Copenhague"
}
```

### Règles de mapping (system prompt)
- "femmes" → `gender = "F"`, "hommes" → `gender = "M"`
- Nationalités : Danemark/danois → DK, Suède → SE, Allemagne → DE, etc.
- "retournants", "fidèles" → `isReturningAthlete = "true"`
- "engagement élevé" → `engagement_min = "70"`, "très engagés" → `"80"`
- "au moins N éditions" → `total_editions_min = "N"`
- Critères non mappables → ignorés silencieusement

---

## Route 3 : Suggestion par objectif (`/api/ai/suggest-segment/route.ts`)

### Input
```ts
{
  objective: string      // ex: "athletes les plus susceptibles de se réinscrire, ~3000"
  gateContext?: string   // contexte optionnel du gate
}
```

Le system prompt injecte automatiquement les statistiques de la DB via `formatStatsForPrompt()` :
- Engagement : p25, médiane, p75, p90
- Âge : percentiles
- Éditions courues : distribution
- % retournants, % femmes, distribution nationalités

### Output
```json
{
  "portrait": "Les athletes les plus susceptibles de revenir en 2027 sont ceux ayant un engagement score supérieur à 65 et au moins 2 éditions terminées. Ce profil représente environ 28% de la base, soit ~2 800 athletes à l'échelle réelle.",
  "filters": [
    { "field": "engagement_min", "value": "65" },
    { "field": "total_editions_min", "value": "2" },
    { "field": "isReturningAthlete", "value": "true" }
  ],
  "insights": [
    "La probabilité de réinscription est fortement corrélée au fait d'avoir terminé la course (vs DNS/DNF) — non filtrable directement mais capturé par total_editions_min.",
    "Les athletes ayant acheté des upsells par le passé ont un taux de retour 20% plus élevé — non disponible comme filtre dans la base actuelle."
  ],
  "rationale": "Seuil engagement_min=65 correspond au p60 de la distribution, ciblant le tier supérieur sans trop restreindre. total_editions_min=2 élimine les candidats 'touristes' sans historique d'engagement."
}
```

### Affichage dans le SegmentBuilder
- **Portrait** : bloc blanc avec titre "Portrait du segment"
- **Insights** : bloc jaune (#FFFBEB) avec titre "Critères non filtrables — à garder en tête"
- **Rationale** : texte italique sous les insights
- **Filtres** : appliqués automatiquement dans les filtres manuels

---

## Prompt de base (injecté dans tous les system prompts de génération)

```
Tu es Sparta, le co-pilote marketing de Datasport, spécialisé dans
les événements sportifs de masse. Tu génères des campagnes marketing
pour le Copenhagen Marathon 2026.

Ton style est :
- Direct, énergique, inspirant
- Respectueux de l'effort sportif et de la communauté running
- Jamais générique — chaque message doit sembler écrit pour ce segment précis
- En anglais par défaut (sauf instruction contraire)

Informations sur l'événement :
- Événement : Copenhagen Marathon 2026
- Date de course : 17 mai 2026
- Ville : Copenhague, Danemark
- Distances : Marathon 42K et Semi-marathon 21K
- Capacité : 15,000 participants
- Organisateur : Copenhagen Marathon / Datasport

Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks.
```

---

## System prompts par gate et segment

### Gate 0 — Event Creation

**past_finishers** : Finishers éditions précédentes. Lien émotionnel avec expérience passée.
Urgence douce autour de l'ouverture du ballot. Ton chaleureux.

**past_refused** : Candidats refusés précédemment. Redonner espoir sans minimiser déception.
Chaque tirage est une nouvelle chance. Ton empathique, combatif, optimiste.

**international_targets** : Audiences DE/UK/NL/NO. Copenhagen comme destination unique.
Expérience globale : ville, communauté, organisation. Ton aspirationnel.

**external_prospects** : Prospects partenaires (Nike RC, Intersport, Parkrun).
Premier contact. Message simple, CTA clair : appliquer maintenant. Ton accessible.

**custom_segment** : Contexte injecté via `buildSegmentDescription()` dans le user prompt.
Prompt générique qui demande à Claude d'utiliser les caractéristiques du segment.

---

### Gate 1 — Registration Opens (Pre-lottery)

**ambassador** : Athletes haute valeur, fidèles (3+ éditions, engagement ~78/100).
Traitement premium, sentiment d'élite, invitation au parrainage. Ton exclusif.

**to_reactivate** : Haute valeur potentielle mais engagement bas, probabilité sélection faible.
Storytelling émotionnel, lever les freins, urgence avant fermeture ballot. Ton inspirant.

**opportunist** : Bonne probabilité sélection, valeur modeste. Ici pour courir.
Message pratique, info logistique, mention légère des upsells. Ton direct, sportif.

**cold_prospect** : Faible valeur et probabilité. Souvent prospects externes.
Message court, positif, sans pression. Garder la porte ouverte pour 2027.

**custom_segment** : Contexte injecté via `buildSegmentDescription()`.

---

### Gate 2 — Lottery Result (Post-lottery)

**confirmed_engaged** : Sélectionnés + engagement > 60. Fort potentiel upsell.
Célébration, présentation upsells comme ajouts naturels, compte à rebours. Ton festif.

**confirmed_passive** : Sélectionnés + engagement ≤ 60. Risque DNS.
Rallumer l'excitation via storytelling. Rappeler pourquoi ils ont candidaté.

**waitlist_hot** : Position ≤ 200. Réelle chance de repêchage.
Maintenir espoir, préparer à agir vite. Ton optimiste, concret.

**waitlist_cold** : Position > 200. Peu probable.
Message honnête + alternatives Datasport + invitation 2027. Ton empathique.

**refused_reactivatable** : Refusés + returning athlete. Valeur long terme haute.
Amortir déception, autres événements Datasport, programme fidélité.

**refused_lost** : Refusés + première candidature. Relation fragile.
Message court, consolation sincère, invitation 2027. Aucune surexplication.

**custom_segment** : Contexte injecté via `buildSegmentDescription()`.

---

### Gate 3 — Race Finish (Post-race)

**loyal_finisher** : Finisher + reRegistration > 0.7. Momentum émotionnel optimal.
Félicitations + early bird 2027 comme récompense naturelle. Ton célébratoire.

**champion_ambassador** : Finisher + personal best + engagement > 75.
Invitation programme ambassadeur, mise en lumière, vecteurs d'acquisition.

**at_risk_returner** : Finisher + reRegistration ≤ 0.4. Sans intervention, ne reviendra pas.
Urgence émotionnelle, early bird avec deadline. Ton challengeant mais respectueux.

**lost_dns** : Did not start. Raison inconnue.
Message très doux, sans interroger ni juger. "On espère te revoir." Aucune pression.

**reconquest_dnf** : Did not finish. Frustration de l'abandon = levier.
Transformer l'abandon en motivation de revanche. Early bird comme symbole d'engagement.

**custom_segment** : Contexte injecté via `buildSegmentDescription()`.

---

## Régénération d'un channel unique

```ts
// User prompt envoyé lors d'une régénération partielle
`Régénère uniquement l'asset pour le channel "${channel}".
Instructions spécifiques : "${customPrompt}"
Garde le même ton et contexte que les autres assets générés.
Réponds avec un JSON contenant uniquement l'asset pour ce channel.`
```

---

## buildSegmentDescription (segments personnalisés)

Fonction dans `lib/types/segments.ts` qui génère la description textuelle
d'un segment personnalisé pour l'injecter dans le user prompt :

```
Segment personnalisé : "Femmes danoises très engagées"
Scope : Ambassadors, To Reactivate
Critères : Genre = Femme, Nationalité = Danemark, Engagement min. = 70
Objectif : Message de félicitations + early bird 2027. Ton inspirant.
```

Cette string est passée comme `segmentDescription` à `/api/ai/route.ts`,
puis injectée à la fin du user prompt généré par `buildUserPrompt()`.
