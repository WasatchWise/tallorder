import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// In-memory fallback for local dev when Upstash env vars are not set.
// Resets on cold start — NOT suitable for production abuse prevention.
const memStore = new Map<string, { count: number; resetAt: number }>()

function memRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { success: boolean; remaining: number } {
  const now = Date.now()
  const entry = memStore.get(key)
  if (!entry || now > entry.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }
  if (entry.count >= limit) return { success: false, remaining: 0 }
  entry.count++
  return { success: true, remaining: limit - entry.count }
}

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

// Cache Ratelimit instances by window key so we don't recreate on every request
const limiters = new Map<string, Ratelimit>()

function getLimiter(limit: number, windowMs: number): Ratelimit {
  const key = `${limit}:${windowMs}`
  if (!limiters.has(key)) {
    limiters.set(
      key,
      new Ratelimit({
        redis: new Redis({ url: upstashUrl!, token: upstashToken! }),
        limiter: Ratelimit.slidingWindow(limit, `${windowMs}ms`),
        prefix: 'tall-order:rl',
      }),
    )
  }
  return limiters.get(key)!
}

/**
 * Rate limit by key. Returns { success: true } if under limit.
 * Uses Upstash Redis in production; falls back to in-memory if env vars are absent.
 */
export async function rateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000,
): Promise<{ success: boolean; remaining: number }> {
  if (!upstashUrl || !upstashToken) {
    return memRateLimit(key, limit, windowMs)
  }
  const { success, remaining } = await getLimiter(limit, windowMs).limit(key)
  return { success, remaining: remaining ?? 0 }
}
