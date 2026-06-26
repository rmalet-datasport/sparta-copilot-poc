/**
 * Route health check — runs against the local dev server (or any BASE_URL).
 * Does NOT call Anthropic. AI routes are tested via invalid inputs that fail
 * before the API call, which lets us verify auth, validation, and rate limiting.
 *
 * Usage:
 *   $env:DEMO_PASSWORD="your_password"; node scripts/test-routes.mjs
 *
 * Options (env vars):
 *   BASE_URL      — default: http://localhost:3000
 *   DEMO_PASSWORD — required for tests 4–7 (cookie-gated tests)
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const PASSWORD  = process.env.DEMO_PASSWORD ?? ''

let pass = 0, fail = 0

function ok(name)        { console.log(`  \x1b[32m✓\x1b[0m ${name}`); pass++ }
function ko(name, detail){ console.log(`  \x1b[31m✗\x1b[0m ${name}  \x1b[2m(${detail})\x1b[0m`); fail++ }
function skip(reason)    { console.log(`  \x1b[33m–\x1b[0m skipped: ${reason}`) }
function check(name, cond, detail = '') { cond ? ok(name) : ko(name, detail) }

async function r(path, { method = 'POST', cookie, body, ip } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (cookie) headers['Cookie']           = cookie
  if (ip)     headers['X-Forwarded-For']  = ip
  return fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  })
}

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\nChecking ${BASE_URL}\n${'─'.repeat(50)}`)

// 1. UNAUTHENTICATED — protected page should redirect
console.log('\n[1] Unauthenticated access to protected page')
{
  const res = await r('/gate/registration', { method: 'GET' })
  check('redirects (3xx)',             [301,302,307,308].includes(res.status), `status=${res.status}`)
  check('location points to /access',  res.headers.get('location')?.includes('/access'), res.headers.get('location') ?? 'none')
}

// 2. UNAUTHENTICATED — protected API should also redirect
console.log('\n[2] Unauthenticated access to protected API route')
{
  const res = await r('/api/ai/parse-segment', { body: { text: 'test' } })
  check('blocked (3xx or 4xx)',        res.status >= 300, `status=${res.status}`)
}

// 3. WRONG PASSWORD → 401
console.log('\n[3] Login with wrong password')
{
  const res = await r('/api/access', { body: { password: 'wrong_password_xyz' } })
  check('status 401',                 res.status === 401, `status=${res.status}`)
  const body = await res.json()
  check('error message returned',     typeof body.error === 'string', JSON.stringify(body))
}

// 4. MALFORMED JSON BODY — should not 500
console.log('\n[4] Malformed JSON body on /api/access')
{
  const res = await fetch(`${BASE_URL}/api/access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{not valid json!!',
    redirect: 'manual',
  })
  check('no unhandled 500',           res.status !== 500, `status=${res.status}`)
}

// 5. CORRECT PASSWORD → cookie
console.log('\n[5] Login with correct password')
let cookie = ''
if (!PASSWORD) {
  skip('DEMO_PASSWORD env var not set — set it to run auth-dependent tests')
} else {
  const res = await r('/api/access', { body: { password: PASSWORD } })
  check('status 200',                 res.status === 200,     `status=${res.status}`)
  const sc = res.headers.get('set-cookie') ?? ''
  check('demo_access cookie present', sc.includes('demo_access='),               sc.slice(0, 60))
  check('HttpOnly flag set',          sc.toLowerCase().includes('httponly'),      sc.slice(0, 80))
  check('SameSite flag set',          sc.toLowerCase().includes('samesite'),      sc.slice(0, 80))
  cookie = sc.split(';')[0]  // "demo_access=VALUE"
}

// 6. AUTHENTICATED ACCESS
console.log('\n[6] Authenticated access to protected page')
if (!cookie) {
  skip('no cookie from step 5')
} else {
  const res = await r('/gate/registration', { method: 'GET', cookie })
  check('not redirected to /access',  !res.headers.get('location')?.includes('/access'), `location=${res.headers.get('location') ?? 'none'}, status=${res.status}`)
}

// 7. AI ROUTE VALIDATIONS (no Anthropic calls — invalid bodies return 4xx before the API call)
console.log('\n[7] AI route input validation')
if (!cookie) {
  skip('no cookie from step 5')
} else {
  // parse-segment: empty text → 400 before Anthropic
  const p1 = await r('/api/ai/parse-segment', { cookie, body: { text: '' } })
  check('parse-segment: empty text → 400',        p1.status === 400, `status=${p1.status}`)

  // suggest-segment: empty objective → 400 before Anthropic
  const p2 = await r('/api/ai/suggest-segment', { cookie, body: { objective: '' } })
  check('suggest-segment: empty objective → 400', p2.status === 400, `status=${p2.status}`)

  // main AI route: unknown gate → 400 before Anthropic
  const p3 = await r('/api/ai', { cookie, body: { gate: 'unknown', segment: 'x', channels: [] } })
  check('main ai route: unknown gate → 400',      p3.status === 400, `status=${p3.status}`)
}

// 8. RATE LIMITING on AI routes
// Uses a dedicated test IP (RFC 5737 TEST-NET-3) to avoid polluting the dev session counter.
// Sends requests with empty body → 400 for first 20, then 429.
console.log('\n[8] Rate limit on /api/ai/parse-segment (20 req/min/IP)')
if (!cookie) {
  skip('no cookie from step 5')
} else {
  const TEST_IP = '203.0.113.42'   // RFC 5737 TEST-NET-3 — safe for testing
  let hit429 = false
  let attempts = 0
  for (let i = 0; i < 25; i++) {
    const res = await r('/api/ai/parse-segment', { cookie, ip: TEST_IP, body: { text: '' } })
    attempts++
    if (res.status === 429) { hit429 = true; break }
  }
  check(`429 returned within 25 requests (after 20 exactly)`, hit429, `never got 429 in ${attempts} attempts`)
  if (hit429) ok(`rate limit triggered at attempt ${attempts}`)
}

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`)
console.log(`${pass + fail} checks  —  \x1b[32m${pass} passed\x1b[0m  /  \x1b[31m${fail} failed\x1b[0m\n`)
if (fail > 0) process.exit(1)
