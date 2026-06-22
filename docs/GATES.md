# GATES.md — Spec fonctionnelle des 4 gates

## Principe général

Le lifecycle Copenhagen Marathon 2026 est découpé en 4 gates fixes.
La navigation entre les gates se fait via la timeline en haut de page.
Chaque gate affiche ses propres segments, channels recommandés et campagnes générées.
La segmentation est statique (hardcodée dans la DB).

---

## Gate 0 — Event Creation

### Quand
Avant l'ouverture du ballot. L'organisateur crée l'édition 2026 et prépare
ses premières communications pour générer des candidatures.

### Données disponibles
Pas d'athletes individuels à ce stade. Vue agrégée uniquement :
- Historique des éditions 2021–2025 (taux de conversion, revenus, nationalités)
- Capacité cible 2026 : 15,000 places
- Objectif candidatures : 20,000 applicants

### Objectif marketing
Maximiser le volume et la qualité des candidatures avant la fermeture du ballot.
Cibler les audiences les plus susceptibles de s'inscrire ET de participer.

### Segments (vue agrégée, pas individuelle)

| Segment | Description | Taille cible | Action |
|---|---|---|---|
| `past_finishers` | Finishers éditions précédentes non réinscrits | ~5,200 | Réactivation prioritaire |
| `past_refused` | Refusés éditions précédentes | ~8,400 | Encouragement candidature |
| `international_targets` | Audiences DE, UK, NL, NO à développer | ~marché externe | Acquisition |
| `external_prospects` | Prospects partenaires / contests | ~1,600 importés | First touch |

### Channels recommandés
- Email (campagne teaser + early bird)
- Instagram (acquisition internationale)
- Push notification (athletes avec app)

### KPIs affichés sur cette gate
- Taux de retour historique par nationalité
- Revenus moyens par édition (entry fees + upsells)
- Objectif candidatures 2026 vs historique

---

## Gate 1 — Registration Opens (Pre-lottery)

### Quand
Ballot ouvert : 1 novembre 2025 → 15 décembre 2025 (45 jours).
20,000 candidatures reçues. Le tirage n'a pas encore eu lieu.

### Données disponibles
Tous les champs Gate 1 du profil athlete (voir DATA_MODEL.md).
Inclut : historique, engagement score, candidacyScore, anticipatedValue,
selectionProbability, preLotterySegment, externalProspect.

### Objectif marketing
Maintenir l'engagement des candidats pendant l'attente du tirage.
Différencier le message selon la valeur et la probabilité de sélection.

### Segments (matrice 4 quadrants)

Axes : `anticipatedValue` (axe Y) × `selectionProbability` (axe X)

| Segment | Badge | Taille | Description | Objectif campagne |
|---|---|---|---|---|
| `ambassador` | 🟢 Ambassadors | ~160 athletes | Haute valeur × haute probabilité | Fidéliser, faire parrainer |
| `to_reactivate` | 🟠 To Reactivate | ~140 athletes | Haute valeur × faible probabilité | Ré-engager, lever les freins |
| `opportunist` | 🔵 Opportunists | ~125 athletes | Faible valeur × haute probabilité | Encourager, upsell anticipé |
| `cold_prospect` | ⚪ Cold Prospects | ~75 athletes | Faible valeur × faible probabilité | Message léger, coût minimal |

Note : les 500 athletes de la DB couvrent tous les segments.
Les chiffres UI (3,200 / 2,800 / 7,500 / 6,500) sont des constantes
affichées pour représenter la DB complète de 20,000 candidats.

### Channels recommandés par segment

**Ambassadors**
- Email (personnalisé, ton premium)
- Push notification
- Rationale : haute valeur justifie un contact multicanal soigné

**To Reactivate**
- Email (contenu émotionnel, storytelling)
- SMS (urgence douce)
- Rationale : besoin de recréer un lien fort avant le tirage

**Opportunists**
- Email (informatif, pratique)
- Rationale : valeur modérée, pas de surcharge de channels

**Cold Prospects**
- Email uniquement (coût minimal)
- Rationale : ROI incertain, on limite l'investissement

### Trigger spécial
**Waitlist drop-in** : si un athlete sélectionné se désiste après le tirage,
la place est proposée en temps réel au premier de la waitlist.
Ce trigger est le seul qui opère hors gate.

---

## Gate 2 — Lottery Result (Post-lottery)

### Quand
Tirage effectué le 10 janvier 2026.
Résultats : registered / waitlist / refused.
Deadline waitlist : 1er mars 2026 (au-delà, un refusé est définitivement out).

### Données disponibles
Tous les champs Gate 2 (Gate 1 + registrationStatus, waitlistPosition,
upsellsPurchased, upsellRevenue, postLotterySegment).

### Objectif marketing
- **Registered** : confirmer, engager, maximiser les upsells
- **Waitlist** : retenir l'intérêt, préparer à l'attente
- **Refused** : reconvertir vers d'autres événements Datasport

### Segments

| Segment | Badge | Taille | Description | Objectif campagne |
|---|---|---|---|---|
| `confirmed_engaged` | 🟢 Confirmed — Engaged | ~205 athletes | Registered + engagement > 60 | Upsells, préparation course |
| `confirmed_passive` | 🟡 Confirmed — Passive | ~95 athletes | Registered + engagement ≤ 60 | Réactiver avant la course |
| `waitlist_hot` | 🟠 Waitlist — Hot | ~20 athletes | Waitlist position ≤ 200 | Maintenir l'espoir, préparer |
| `waitlist_cold` | ⚪ Waitlist — Cold | ~30 athletes | Waitlist position > 200 | Message honnête, alternatives |
| `refused_reactivatable` | 🔴 Refused — Reactivatable | ~60 athletes | Refused + returning athlete | Reconversion autres events |
| `refused_lost` | ⚫ Refused — Lost | ~90 athletes | Refused + première candidature | Message de consolation léger |

Note : même principe que Gate 1 pour les chiffres UI vs DB statique.
Chiffres UI affichés : 8,200 / 3,800 / 800 / 1,200 / 2,400 / 3,600.

### Upsells à proposer (segment confirmed uniquement)

```
- Accommodation Package    €180  (hôtel partenaire 2 nuits)
- Charity Bib              €50+  (dossard caritatif)
- VIP Finish Line          €75   (zone VIP à l'arrivée)
- Race Photo Pack          €35   (photos officielles)
- Pace Group Access        €25   (groupe de pace dédié)
- Finisher T-shirt Premium €40   (t-shirt premium)
```

### Channels recommandés par segment

**Confirmed — Engaged**
- Email (confirmation + upsells)
- Push notification (compte à rebours, tips préparation)
- Rationale : déjà engagés, prêts à acheter des upsells

**Confirmed — Passive**
- Email (storytelling, témoignages finishers)
- SMS (rappel date limite upsells)
- Rationale : besoin de recréer l'excitation

**Waitlist — Hot**
- Email (updates réguliers sur les places disponibles)
- SMS (alerte immédiate si place disponible)
- Rationale : urgence et proximité du résultat

**Waitlist — Cold**
- Email uniquement (message honnête + alternatives)
- Rationale : ne pas surinvestir sur des positions peu probables

**Refused — Reactivatable**
- Email (autres événements Datasport, programme fidélité)
- Rationale : valeur long terme à préserver

**Refused — Lost**
- Email uniquement (message de consolation + invitation 2027)
- Rationale : coût minimal, porte ouverte pour l'an prochain

---

## Gate 3 — Race Finish (Post-race)

### Quand
Après la course du 17 mai 2026.
Données de résultats disponibles dans les 24h post-course.

### Données disponibles
Tous les champs Gate 3 (Gate 2 + raceStatus, finishTime, finishCategory,
finishRank, personalBest, reRegistrationProbability, postRaceSegment).

### Objectif marketing
- Capitaliser sur l'émotion post-course
- Identifier les athletes à risque de ne pas revenir (35% naturellement)
- Maximiser les ré-inscriptions pour l'édition 2027
- Convertir les meilleurs finishers en ambassadeurs

### Segments

| Segment | Badge | Taille | Description | Objectif campagne |
|---|---|---|---|---|
| `loyal_finisher` | 🟢 Loyal Finisher | ~170 athletes | Finisher + reRegistration > 0.7 | Early bird 2027, fidélisation |
| `champion_ambassador` | 🔴 Champion | ~35 athletes | Finisher + personalBest + engagement > 75 | Programme ambassadeur |
| `at_risk_returner` | 🟠 At Risk | ~53 athletes | Finisher + reRegistration ≤ 0.4 | Reconquête proactive |
| `lost_dns` | ⚫ DNS | ~30 athletes | Did not start | Message empathique, retour 2027 |
| `reconquest_dnf` | 🟡 DNF | ~12 athletes | Did not finish | Défi de revanche, soutien |

Note : chiffres UI affichés : 6,800 / 1,400 / 2,100 / 1,200 / 500.

### Channels recommandés par segment

**Loyal Finisher**
- Email (félicitations + early bird 2027)
- Push notification (badge finisher dans l'app)
- Rationale : momentum émotionnel post-course à exploiter immédiatement

**Champion Ambassador**
- Email (invitation programme ambassadeur)
- Instagram (tag et mise en avant sur le compte officiel)
- Rationale : ces athletes sont des vecteurs d'acquisition naturels

**At Risk Returner**
- Email (storytelling, "tu nous manqueras en 2027")
- SMS (offre early bird limitée dans le temps)
- Rationale : urgence nécessaire pour contrer le désengagement

**DNS**
- Email uniquement (ton empathique, pas de pression)
- Rationale : on ne sait pas pourquoi ils n'ont pas couru — respecter la distance

**DNF**
- Email (ton de défi, "tu as l'étoffe d'un finisher")
- SMS (offre spéciale revanche 2027)
- Rationale : l'émotion de l'abandon est un levier puissant si bien utilisé

---

## Règles communes à toutes les gates

1. **Pas de re-segmentation entre les gates** — les segments sont figés à chaque gate
   et ne changent pas tant que la gate suivante n'est pas atteinte.

2. **Exception waitlist** — le trigger waitlist drop-in opère en temps réel,
   hors gate, uniquement après Gate 2.

3. **Un athlete = un segment par gate** — pas de double appartenance.

4. **Les chiffres UI sont des constantes** — ils représentent la DB complète
   de 20,000 athletes, pas les 500 de la DB statique.
   Les listes d'athletes affichées sont issues des 500 de la DB statique.
