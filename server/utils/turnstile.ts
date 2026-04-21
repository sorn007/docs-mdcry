import { createError } from 'h3'
import type { H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'
import { getClientIp } from './rateLimit'

type TurnstileSiteverifyResponse = {
  success: boolean
  hostname?: string
  action?: string
  'error-codes'?: string[]
}

const VERIFIED_TOKEN_TTL_MS = 4 * 60 * 1000
const verifiedTokenCache = new Map<string, number>()

function isTruthy(v: unknown): boolean {
  if (v === true || v === 1) return true
  if (typeof v === 'string') return v === '1' || v.toLowerCase() === 'true'
  return false
}

function makeCacheKey(token: string, ip: string) {
  return `${token}::${ip || 'unknown'}`
}

function isTokenRecentlyVerified(token: string, ip: string) {
  const now = Date.now()
  for (const [k, exp] of verifiedTokenCache) {
    if (exp <= now) verifiedTokenCache.delete(k)
  }
  const key = makeCacheKey(token, ip)
  const exp = verifiedTokenCache.get(key) || 0
  return exp > now
}

function rememberVerifiedToken(token: string, ip: string) {
  const key = makeCacheKey(token, ip)
  verifiedTokenCache.set(key, Date.now() + VERIFIED_TOKEN_TTL_MS)
}

export async function verifyTurnstileOrThrow(event: H3Event, token: string) {
  const cfg = useRuntimeConfig(event) as {
    turnstile?: { enabled?: boolean | string | number, secretKey?: string }
  }
  const enabled = isTruthy(cfg.turnstile?.enabled)
  if (!enabled) return

  const secret = cfg.turnstile?.secretKey?.trim() || ''
  if (!secret) {
    throw createError({ statusCode: 500, statusMessage: 'Turnstile secret key is not configured' })
  }
  if (!token?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Turnstile token is required' })
  }
  const normalizedToken = token.trim()
  const ip = getClientIp(event)
  if (isTokenRecentlyVerified(normalizedToken, ip)) return

  const body = new URLSearchParams()
  body.set('secret', secret)
  body.set('response', normalizedToken)
  if (ip && ip !== 'unknown') body.set('remoteip', ip)

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  })

  if (!res.ok) {
    throw createError({ statusCode: 502, statusMessage: 'Turnstile verification failed' })
  }

  const json = await res.json() as TurnstileSiteverifyResponse
  if (!json.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Turnstile verification failed',
      data: { errors: json['error-codes'] || [] }
    })
  }
  rememberVerifiedToken(normalizedToken, ip)
}
