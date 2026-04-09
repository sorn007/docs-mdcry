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

function isTruthy(v: unknown): boolean {
  if (v === true || v === 1) return true
  if (typeof v === 'string') return v === '1' || v.toLowerCase() === 'true'
  return false
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

  const body = new URLSearchParams()
  body.set('secret', secret)
  body.set('response', token.trim())
  const ip = getClientIp(event)
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
}
