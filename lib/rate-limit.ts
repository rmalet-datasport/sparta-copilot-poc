const counts = new Map<string, { count: number; resetAt: number }>()

export function isRateLimited(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = counts.get(ip)

  if (!entry || now > entry.resetAt) {
    counts.set(ip, { count: 1, resetAt: now + windowMs })
    return false
  }

  if (entry.count >= limit) return true

  entry.count++
  return false
}
