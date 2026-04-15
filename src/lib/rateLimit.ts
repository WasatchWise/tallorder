// Simple in-memory rate limiter for serverless functions.
// Resets on cold start, which is acceptable for basic abuse prevention.

const store = new Map<string, { count: number; resetAt: number }>()

/**
 * Rate limit by key. Returns { success: true } if under limit.
 * @param key - unique identifier (e.g., userId or IP)
 * @param limit - max requests per window (default 10)
 * @param windowMs - time window in milliseconds (default 60s)
 */
export function rateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000
): { success: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count }
}
