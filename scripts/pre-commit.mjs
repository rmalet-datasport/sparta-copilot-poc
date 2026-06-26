/**
 * Pre-commit checks — run automatically by .git/hooks/pre-commit.
 *
 * Step 1 (always): TypeScript type check — blocks commit on errors.
 * Step 2 (conditional): Route health checks — runs only if dev server is
 *   already up on localhost:3000. Skipped with a warning if not running.
 *
 * To run manually: node scripts/pre-commit.mjs
 */

import { execSync } from 'child_process'

function header(label) {
  console.log(`\n\x1b[1m[pre-commit]\x1b[0m ${label}`)
}

function ok(msg)   { console.log(`  \x1b[32m✓\x1b[0m ${msg}`) }
function warn(msg) { console.log(`  \x1b[33m⚠\x1b[0m ${msg}`) }
function err(msg)  { console.error(`  \x1b[31m✗\x1b[0m ${msg}`) }

// ── 1. TypeScript ────────────────────────────────────────────────────────────
header('TypeScript type check...')
try {
  execSync('npx --no-install tsc --noEmit', { stdio: 'inherit' })
  ok('No TypeScript errors\n')
} catch {
  err('TypeScript errors found — fix before committing\n')
  process.exit(1)
}

// ── 2. Route health checks (only if dev server is up) ────────────────────────
header('Checking for dev server on localhost:3000...')

let serverUp = false
try {
  const res = await fetch('http://localhost:3000', {
    signal: AbortSignal.timeout(1500),
    redirect: 'manual',
  })
  serverUp = res.status < 600
} catch { /* server not running */ }

if (serverUp) {
  ok('Dev server detected — running route health checks...\n')
  try {
    execSync('node scripts/test-routes.mjs', { stdio: 'inherit' })
  } catch {
    err('Route checks failed — fix before committing\n')
    process.exit(1)
  }
} else {
  warn('Dev server not running — route checks skipped')
  warn('Run \x1b[2mnpm run dev\x1b[0m\x1b[33m in another terminal, then commit to include route checks\n')
}
