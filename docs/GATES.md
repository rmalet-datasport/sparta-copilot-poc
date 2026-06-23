# GATES.md — Spec fonctionnelle des 4 gates

## Principe général

Le lifecycle Copenhagen Marathon 2026 est découpé en 4 gates fixes.
La navigation entre les gates se fait via la timeline en haut de page.
Chaque gate affiche ses propres segments, channels recommandés et campagnes générées.

**Segmentation hybride** : chaque gate dispose de segments prédéfinis statiques
ET d'un bouton "Créer un segment" permettant de créer des segments personnalisés
dynamiquement via filtres manuels ou IA.

---

## Layout commun à toutes les gates

```
[KPI strip — 4 métriques clés]

Colonne gauche (380px fixe)                   Colonne droite (flex 1)
─────────────────────────────                 ──────────────────────
[LABEL] [total athletes] [+ Créer]            [Panel campagne du segment sélectionné]
[Segment Card 1]                              ou
[Segment Card 2]                              [Empty state si aucun sélectionné]
[...]
[Segment custom 1] (si créé)
[Segment custom 2] (si créé)
[Sample athletes du segment sélectionné]
```

---

## Gate 0 — Event Creation

### Quand
Avant l'ouverture du ballot. L'organisateur crée l'édition 2026 et prépare
ses premières communications pour générer des candidatures.

### Objectif marketing
Maximiser le volume et la qualité des candidatures avant la fermeture du ballot.

### Segments prédéfinis (vue agrégée)

| Segment | Description | Taille UI | Dérivation depuis la DB |
|---|---|---|---|
| `past_finishers` | Finishers éditions précédentes non réinscrits | 5,200 | `isReturningAthlete && totalEditionsRaced > 0` |
| `past_refused` | Refusés éditions précédentes | 8,400 | fallback (ni finisher, ni prospect, ni international) |
| `international_targets` | Audiences DE, UK, NL, NO | 12,000 | `nationality in ['DE','UK','NL','NO']` |
| `external_prospects` | Prospects partenaires importés | 1,600 | `externalProspect === true` |

**Total gate 0** : 27,200 prospects (somme des 4 segments)

> Note : Gate 0 n'a pas de champ `gate0Segment` dans la DB.
> Le segment est dérivé dynamiquement dans `filterAthletes()` via `getGate0Segment(athlete)`.
> Priorité de dérivation : external_prospects > international_targets > past_finishers > past_refused.

### Contenu spécifique
- Tableau **Historical Performance** (2021–2025) affiché sous la liste des segments
- KPIs : capacité 2026, objectif candidatures, revenu moyen / édition, taux retour naturel

### Channels recommandés
- Email (campagne teaser + early bird)
- Instagram (acquisition internationale)
- Push notification (athletes avec app)

---

## Gate 1 — Registration Opens (Pre-lottery)

### Quand
Ballot ouvert : 1 novembre 2025 → 15 décembre 2025.
20,000 candidatures reçues. Le tirage n'a pas encore eu lieu.

### Données disponibles
Tous les champs Gate 1 du profil athlete (voir DATA_MODEL.md).
Inclut : historique, engagement score, candidacyScore, anticipatedValue,
selectionProbability, preLotterySegment, externalProspect.

### Objectif marketing
Maintenir l'engagement des candidats pendant l'attente du tirage.

### Segments prédéfinis

Champ DB : `preLotterySegment`

| Segment | Taille UI | Description | Objectif campagne |
|---|---|---|---|
| `ambassador` | 3,200 | Haute valeur × haute probabilité | Fidéliser, faire parrainer |
| `to_reactivate` | 2,800 | Haute valeur × faible probabilité | Ré-engager, lever les freins |
| `opportunist` | 7,500 | Faible valeur × haute probabilité | Encourager, upsell anticipé |
| `cold_prospect` | 6,500 | Faible valeur × faible probabilité | Message léger, coût minimal |

**Total gate 1** : 20,000 athletes

### Channels recommandés par segment

| Segment | Channels | Rationale |
|---|---|---|
| ambassador | email, push | Haute valeur justifie multicanal soigné |
| to_reactivate | email, sms | Besoin de recréer un lien fort |
| opportunist | email | ROI modéré, pas de surcharge |
| cold_prospect | email | ROI incertain, investissement minimal |

---

## Gate 2 — Lottery Result (Post-lottery)

### Quand
Tirage effectué le 10 janvier 2026.
Résultats : registered / waitlist / refused.
Deadline waitlist : 1er mars 2026.

### Données disponibles
Gate 1 + registrationStatus, waitlistPosition, upsellsPurchased, upsellRevenue,
paymentStatus, postLotterySegment.

### Objectif marketing
- Registered : confirmer, engager, maximiser les upsells
- Waitlist : retenir l'intérêt, préparer à l'attente
- Refused : reconvertir vers d'autres événements Datasport

### Segments prédéfinis

Champ DB : `postLotterySegment`

| Segment | Taille UI | Description | Objectif |
|---|---|---|---|
| `confirmed_engaged` | 8,200 | Registered + engagement > 60 | Upsells, préparation course |
| `confirmed_passive` | 3,800 | Registered + engagement ≤ 60 | Réactiver avant la course |
| `waitlist_hot` | 800 | Waitlist position ≤ 200 | Maintenir l'espoir |
| `waitlist_cold` | 1,200 | Waitlist position > 200 | Message honnête, alternatives |
| `refused_reactivatable` | 2,400 | Refused + returning athlete | Fidélisation long terme |
| `refused_lost` | 3,600 | Refused + première candidature | Message consolation léger |

**Total gate 2** : 20,000 athletes

### Upsells disponibles (segment confirmed uniquement)

| Upsell | Prix |
|---|---|
| Accommodation Package | ~€180 |
| Charity Bib | €50+ |
| VIP Finish Line | €75 |
| Race Photo Pack | €35 |
| Pace Group Access | €25 |
| Finisher T-shirt Premium | €40 |

---

## Gate 3 — Race Finish (Post-race)

### Quand
Après la course du 17 mai 2026.
Données de résultats disponibles dans les 24h post-course.

### Données disponibles
Gate 2 + raceStatus, finishTime, finishCategory, finishRank, personalBest,
reRegistrationProbability, postRaceSegment.

### Objectif marketing
Capitaliser sur l'émotion post-course et maximiser les ré-inscriptions 2027.

### Segments prédéfinis

Champ DB : `postRaceSegment`

| Segment | Taille UI | Description | Objectif |
|---|---|---|---|
| `loyal_finisher` | 6,800 | Finisher + reRegistration > 0.7 | Early bird 2027 |
| `champion_ambassador` | 1,400 | Finisher + personalBest + engagement > 75 | Programme ambassadeur |
| `at_risk_returner` | 2,100 | Finisher + reRegistration ≤ 0.4 | Reconquête proactive |
| `lost_dns` | 1,200 | Did not start | Message empathique |
| `reconquest_dnf` | 500 | Did not finish | Narrative de revanche |

**Total gate 3** : 12,000 athletes

### Bannière impact IA (spécifique Gate 3)
Affichée au-dessus des segments :
> "Targeted re-registration campaigns could recover **1,950** additional athletes
> worth **€97,500** in incremental revenue (82% vs 65% natural return rate)."

---

## Création de segments personnalisés (commun à toutes les gates)

### Accès
Bouton "+ Créer un segment" dans le header de la colonne gauche, à droite du total.

### Composant : SegmentBuilder (modal)

**Section 1 — Nom** : champ texte libre

**Section 2 — Décrire en langage naturel** (IA)
- Textarea + bouton "Analyser →" (rouge)
- Appel à `/api/ai/parse-segment`
- Retourne : filtres structurés appliqués automatiquement + interprétation en vert
- Raccourci : ⌘+Entrée

**Section 3 — Définir par objectif métier** (IA)
- Textarea + bouton "Suggérer un segment →" (noir)
- Appel à `/api/ai/suggest-segment` avec stats agrégées de la DB
- Retourne :
  - **Portrait** : description naturelle du segment (qui + pourquoi)
  - **Filtres** : appliqués automatiquement
  - **Insights** (fond jaune) : critères non-filtrables expliqués
  - **Rationale** (italique) : justification des seuils choisis
- Raccourci : ⌘+Entrée

**Section 4 — Scope**
- Pills des segments prédéfinis du gate (sélection multiple)
- "Tous les athletes" si aucun sélectionné
- Scope = pool sur lequel les filtres sont appliqués

**Section 5 — Filtres manuels** (9 champs disponibles)

| Champ | Type | Options |
|---|---|---|
| `gender` | select | M / F |
| `age_min` | number | 16–80 |
| `age_max` | number | 16–80 |
| `nationality` | select | DK, SE, DE, UK, NL, NO, FR, US, IT, CH, PL, BE |
| `isReturningAthlete` | select | Oui / Non |
| `total_editions_min` | number | 0–20 |
| `total_editions_max` | number | 0–20 |
| `engagement_min` | number | 0–100 |
| `city_contains` | text | recherche partielle |

**Section 6 — Objectif & contexte** : texte libre injecté dans le prompt de génération

**Section 7 — Compteur** : nombre d'athletes correspondant (mis à l'échelle vers les chiffres réels)

### Scaling du compteur

```
Si scope = tous les athletes :
  scaledCount = round(rawCount / 500 * GATE_TOTAL)

Si scope = segments sélectionnés :
  effectiveTotal = somme des tailles UI des segments sélectionnés
  baseRaw = count(athletes in selected segments, no filter)
  scaledCount = round(rawCount / baseRaw * effectiveTotal)
```

### Affichage du segment créé
- Row dans la colonne gauche sous les segments prédéfinis
- Point coloré + nom + compteur mis à l'échelle + bouton delete
- Badge CUSTOM dans le panel campagne à droite
- Génération via prompt `custom_segment` enrichi de `buildSegmentDescription()`

---

## Règles communes à toutes les gates

1. **Un athlete = un segment par gate** — pas de double appartenance (segments prédéfinis)
2. **Segments custom = mémoire React uniquement** — disparaissent au rechargement
3. **Chiffres UI = constantes** — jamais calculés depuis la DB statique
4. **Scaling obligatoire** — toujours mettre à l'échelle rawCount → chiffres réels
