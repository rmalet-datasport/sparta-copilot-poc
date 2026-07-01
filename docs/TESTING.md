# TESTING.md — Health checks, tests de routes et pre-commit hook

## Script de test

`scripts/test-routes.mjs` vérifie les routes HTTP sans appeler Anthropic.
Les routes IA sont testées via des inputs invalides qui déclenchent une erreur 400
avant l'appel API — ce qui permet de tester auth, validation et rate limiting.

**Ce que le script vérifie (10 groupes) :**
1. Page protégée sans auth → redirect vers `/access`
2. Route API protégée sans auth → bloquée
3. Mauvais mot de passe → 401
4. Body JSON malformé → pas de 500
5. Bon mot de passe → cookie `demo_access` avec flags HttpOnly + SameSite
6. Accès authentifié → page accessible
7. Validations input sur les routes IA → 400 avant Anthropic
8. **Génération campagne dry-run** → valide gate/segment/channels sans appel Anthropic
9. **Appel Anthropic réel** → intégrité JSON sur les 7 channels (nécessite `ANTHROPIC_API_KEY`)
10. Rate limiting sur `/api/ai/parse-segment` → 429 après 20 req/min/IP

### Groupe 8 — Dry-run (`_dryRun: true`)

Passer `_dryRun: true` dans le body de `/api/ai` active un mode fixture :
- La validation s'exécute normalement (gate inconnu → 400, channel invalide → 400)
- L'appel Anthropic est court-circuité — zéro token consommé
- La réponse retourne un JSON `{ assets: [...] }` avec des valeurs `[DRY RUN]`

Cas testés automatiquement :
- 1 segment par gate (gate0–gate3) + `custom_segment` → 200 + shape correcte
- Gate inconnu avec `_dryRun` → toujours 400 (validation avant le flag)
- Channel invalide (`whatsapp`) → 400
- `channelToRegenerate` → 200 + 1 seul asset
- **7 channels simultanés** → 200 + shape vérifiée channel par channel (`subject`, `caption`, `utmCampaign`, etc.)

### Groupe 9 — Appel Anthropic réel (`ANTHROPIC_API_KEY` requis)

Ce test fait un vrai appel Anthropic avec les 7 channels (`email`, `sms`, `push`, `instagram`,
`linkedin`, `facebook`, `partner`) pour valider deux choses critiques :

1. **Intégrité JSON** : si `max_tokens` est trop bas, Claude tronque le JSON → `JSON.parse` lève
   une `SyntaxError` et le check échoue immédiatement.
2. **Shape des assets** : chaque channel retourne les bons champs depuis une vraie réponse IA.

Ce test est **intentionnellement exclu du pre-commit hook** (coût en tokens). À lancer manuellement
avant une démo ou après tout changement sur `max_tokens` ou les prompts.

---

## Tester en local

Démarrer le serveur de dev (`npm run dev`), puis dans un autre terminal :

```powershell
$env:DEMO_PASSWORD = "votre_mot_de_passe"
node scripts/test-routes.mjs
```

Ou via le script npm (sans mot de passe — les tests 5–10 seront skippés) :

```powershell
npm run test:local
```

---

## Tester la version déployée

URL de prod : **https://sparta-copilot.lab.datasport.com**

```powershell
# Tests sans Anthropic (groupes 1–8 + [10])
$env:BASE_URL = "https://sparta-copilot.lab.datasport.com"; $env:DEMO_PASSWORD = "xxx"; node scripts/test-routes.mjs

# Tests complets avec appel Claude réel (groupes 1–10)
$env:BASE_URL = "https://sparta-copilot.lab.datasport.com"; $env:DEMO_PASSWORD = "xxx"; $env:ANTHROPIC_API_KEY = "sk-ant-..."; node scripts/test-routes.mjs
```

> Pas besoin de démarrer le serveur local — le script tape directement sur l'URL distante.
>
> **Note** : le test [10] (rate limiting) s'exécute en dernier car il épuise intentionnellement
> le quota — les tests dry-run [8] et l'appel Anthropic réel [9] doivent tourner avant.

---

## Variables d'environnement

| Variable | Défaut | Description |
|---|---|---|
| `BASE_URL` | `http://localhost:3000` | URL cible du serveur à tester |
| `DEMO_PASSWORD` | _(vide)_ | Requis pour les tests [5]–[10] |
| `ANTHROPIC_API_KEY` | _(vide)_ | Requis pour le test [9] uniquement (appel Anthropic réel) |

**Combinaisons :**

| Env vars | Tests qui tournent |
|---|---|
| aucune | [1]–[4] |
| `DEMO_PASSWORD` | [1]–[8] + [10] |
| `DEMO_PASSWORD` + `ANTHROPIC_API_KEY` | [1]–[10] (complet) |

```powershell
# Tests sans Anthropic (pre-commit / quotidien)
$env:DEMO_PASSWORD = "xxx"; node scripts/test-routes.mjs

# Tests complets avec Anthropic (avant démo ou après changement de prompts)
$env:DEMO_PASSWORD = "xxx"; $env:ANTHROPIC_API_KEY = "sk-ant-..."; node scripts/test-routes.mjs
```

---

## Interprétation des résultats

```
✓  check passé
✗  check échoué (détail entre parenthèses)
–  skipped (DEMO_PASSWORD absent)
```

En fin de run : `N checks — X passed / Y failed`. Exit code 1 si au moins un échec.

---

---

## Pre-commit hook

Un hook git s'exécute automatiquement avant chaque `git commit`. Il enchaîne deux étapes :

### Étape 1 — TypeScript (toujours, bloquant)
```
npx tsc --noEmit
```
Si des erreurs de type sont trouvées → le commit est bloqué. Pas de serveur requis.

### Étape 2 — Route health checks (conditionnel)
- **Si `localhost:3000` répond** → `node scripts/test-routes.mjs` est lancé. Échec = commit bloqué.
- **Si le serveur n'est pas démarré** → warning non-bloquant, le commit passe quand même.

Pour avoir les tests auth-dépendants (groupes 5–8 + [10]) lors des commits, définir `DEMO_PASSWORD`
dans le profil PowerShell (`$PROFILE`) ou dans une variable d'env de session :
```powershell
$env:DEMO_PASSWORD = "votre_mot_de_passe"
```

### Installation (automatique)

Le hook s'installe automatiquement à chaque `npm install` via le script `prepare` :
```powershell
npm install   # installe aussi .git/hooks/pre-commit
```

Pour l'installer manuellement sans relancer `npm install` :
```powershell
node scripts/setup-hooks.mjs
```

Pour tester le hook sans faire de commit :
```powershell
node scripts/pre-commit.mjs
# ou
npm run test:precommit
```

### Fichiers concernés

| Fichier | Rôle |
|---|---|
| `scripts/pre-commit.mjs` | Logique du hook (TypeScript + route tests) |
| `scripts/setup-hooks.mjs` | Installe le hook dans `.git/hooks/pre-commit` |
| `package.json` → `prepare` | Déclenche `setup-hooks.mjs` à chaque `npm install` |

> **Note CI** : `setup-hooks.mjs` détecte l'absence de `.git/hooks/` (Vercel, GitHub Actions)
> et se termine silencieusement sans erreur.

---

## Variables d'environnement requises sur Vercel

Trois variables à configurer dans **Settings → Environment variables** du projet Vercel :

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Clé API Anthropic (console.anthropic.com) |
| `DEMO_PASSWORD` | Mot de passe partagé avec les participants à la démo |
| `DEMO_COOKIE_SECRET` | Chaîne aléatoire ≥ 32 caractères pour signer le cookie de session |

Sans ces trois variables, le déploiement démarre mais les routes IA et l'auth échouent.
