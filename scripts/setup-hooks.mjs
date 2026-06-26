/**
 * Installs the git pre-commit hook.
 * Called automatically via the "prepare" npm lifecycle script (runs on npm install).
 * Can also be run manually: node scripts/setup-hooks.mjs
 */

import { writeFileSync, chmodSync, existsSync } from 'fs'
import { join } from 'path'

const hooksDir = join(process.cwd(), '.git', 'hooks')
const hookPath = join(hooksDir, 'pre-commit')

if (!existsSync(hooksDir)) {
  // CI environments (Vercel, GitHub Actions) have no .git directory
  process.exit(0)
}

writeFileSync(hookPath, '#!/bin/sh\nnode scripts/pre-commit.mjs\n', 'utf8')

try {
  // chmod +x — no-op on Windows, required on Mac/Linux
  chmodSync(hookPath, 0o755)
} catch { /* Windows: Git handles execution via sh, chmod not needed */ }

console.log('  \x1b[32m✓\x1b[0m Git pre-commit hook installed (.git/hooks/pre-commit)')
