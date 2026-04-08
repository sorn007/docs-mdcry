import { getHeader, createError } from 'h3'
import type { H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'

type NitroNodeEvent = H3Event & {
  node?: { req?: { socket?: { remoteAddress?: string } } }
}

/** In-memory rate limit store. For multi-instance deploy use Redis or similar. */
const store = new Map<string, { count: number, resetAt: number }>()

const CLEANUP_INTERVAL_MS = 60_000
let cleanupTimer: ReturnType<typeof setInterval> | null = null

function cleanup(): void {
  const now = Date.now()
  for (const [k, v] of store.entries()) {
    if (v.resetAt < now) store.delete(k)
  }
}

function ensureCleanup(): void {
  if (!cleanupTimer) {
    cleanupTimer = setInterval(cleanup, CLEANUP_INTERVAL_MS)
    if (cleanupTimer.unref) cleanupTimer.unref()
  }
}

/**
 * Client IP for rate limiting. By default uses the direct socket address only
 * (X-Forwarded-For is ignored) so clients cannot spoof IPs unless you deploy
 * behind a trusted reverse proxy and set `NUXT_RATE_LIMIT_TRUST_PROXY=1`.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For
 */
function isTruthyEnv(v: unknown): boolean {
  if (v === true || v === 1) return true
  if (typeof v === 'string') return v === '1' || v.toLowerCase() === 'true'
  return false
}

export function getClientIp(event: H3Event): string {
  const cfg = useRuntimeConfig(event) as { rateLimit?: { trustProxy?: boolean | string | number } }
  const trustProxy = isTruthyEnv(cfg.rateLimit?.trustProxy)
  if (trustProxy) {
    const xff = getHeader(event, 'x-forwarded-for')
    if (xff) {
      const first = String(xff).split(',')[0]?.trim()
      if (first) return first
    }
  }
  const remote = (event as NitroNodeEvent).node?.req?.socket?.remoteAddress
  if (remote) return remote
  return 'unknown'
}

/**
 * Check rate limit: max `maxRequests` per `windowMs` per key (e.g. IP).
 * Throws 429 if exceeded.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): void {
  ensureCleanup()
  const now = Date.now()
  const entry = store.get(key)
  if (!entry) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return
  }
  if (entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return
  }
  entry.count += 1
  if (entry.count > maxRequests) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: 'Too many attempts. Please try again later.'
    })
  }
}
