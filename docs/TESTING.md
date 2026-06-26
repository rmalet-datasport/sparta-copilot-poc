# TESTING.md — Health checks et tests de routes

## Script de test

`scripts/test-routes.mjs` vérifie les routes HTTP sans appeler Anthropic.
Les routes IA sont testées via des inputs invalides qui déclenchent une erreur 400
avant l'appel API — ce qui permet de tester auth, validation et rate limiting.

**Ce que le script vérifie (9 groupes) :**
1. Page protégée sans auth → redirect vers `/access`
2. Route API protégée sans auth → bloquée
3. Mauvais mot de passe → 401
4. Body JSON malformé → pas de 500
5. Bon mot de passe → cookie `demo_access` avec flags HttpOnly + SameSite
6. Accès authentifié → page accessible
7. Validations input sur les routes IA → 400 avant Anthropic
8. Rate limiting sur `/api/ai/parse-segment` → 429 après 20 req/min/IP
9. **Génération campagne dry-run** → valide gate/segment/channels sans appel Anthropic

### Groupe 9 — Dry-run (`_dryRun: true`)

Passer `_dryRun: true` dans le body de `/api/ai` active un mode fixture :
- La validation s'exécute normalement (gate inconnu → 400, channel invalide → 400)
- L'appel Anthropic est court-circuité — zéro token consommé
- La réponse retourne un JSON `{ assets: [...] }` avec des valeurs `[DRY RUN]`

Cas testés automatiquement :
- 1 segment par gate (gate0–gate3) + `custom_segment` → 200 + shape correcte
- Gate inconnu avec `_dryRun` → toujours 400 (validation avant le flag)
- Channel invalide (`whatsapp`) → 400
- `channelToRegenerate` → 200 + 1 seul asset
- 4 channels simultanés → 200 + 4 assets avec bons noms

---

## Tester en local

Démarrer le serveur de dev (`npm run dev`), puis dans un autre terminal :

```powershell
$env:DEMO_PASSWORD = "votre_mot_de_passe"
node scripts/test-routes.mjs
```

Ou via le script npm (sans mot de passe — les tests 5–8 seront skippés) :

```powershell
npm run test:local
```

---

## Tester la version déployée

Le script accepte une variable `BASE_URL` — il suffit de pointer vers l'URL de prod.

```powershell
$env:BASE_URL      = "https://sparta-copilot.vercel.app"
$env:DEMO_PASSWORD = "votre_mot_de_passe"
node scripts/test-routes.mjs
```

Pour enchaîner les deux en une ligne PowerShell :

```powershell
$env:BASE_URL = "https://sparta-copilot.vercel.app"; $env:DEMO_PASSWORD = "xxx"; node scripts/test-routes.mjs
```

> Le `DEMO_PASSWORD` est celui configuré dans les variables d'environnement Vercel
> (même valeur que `DEMO_PASSWORD` dans `.env.local`).

---

## Variables d'environnement

| Variable | Défaut | Description |
|---|---|---|
| `BASE_URL` | `http://localhost:3000` | URL cible du serveur à tester |
| `DEMO_PASSWORD` | _(vide)_ | Mot de passe de la démo — requis pour les tests 5–8 |

---

## Interprétation des résultats

```
✓  check passé
✗  check échoué (détail entre parenthèses)
–  skipped (DEMO_PASSWORD absent)
```

En fin de run : `N checks — X passed / Y failed`. Exit code 1 si au moins un échec.

---

## Variables d'environnement requises sur Vercel

Trois variables à configurer dans **Settings → Environment variables** du projet Vercel :

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Clé API Anthropic (console.anthropic.com) |
| `DEMO_PASSWORD` | Mot de passe partagé avec les participants à la démo |
| `DEMO_COOKIE_SECRET` | Chaîne aléatoire ≥ 32 caractères pour signer le cookie de session |

Sans ces trois variables, le déploiement démarre mais les routes IA et l'auth échouent.
