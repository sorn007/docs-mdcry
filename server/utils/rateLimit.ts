import { getHeader, createError } from 'h3'
import type { H3Event } from 'h3'

/** In-memory rate limit store. For multi-instance deploy use Redis or similar. */
const store = new Map<string, { count: number; resetAt: number }>()

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
 * Get client IP from request (supports X-Forwarded-For behind proxy).
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For
 */
export function getClientIp(event: H3Event): string {
  const xff = getHeader(event, 'x-forwarded-for')
  if (xff) {
    const first = String(xff).split(',')[0]?.trim()
    if (first) return first
  }
  const node = (event as any).node
  if (node?.req?.socket?.remoteAddress) return node.req.socket.remoteAddress
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
