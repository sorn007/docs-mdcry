import { randomBytes, createHash } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { createError, getHeader } from 'h3'
import type { H3Event } from 'h3'
import { prisma } from './prisma'
import { verifyTurnstileOrThrow } from './turnstile'

function sha256(input: string) {
  return createHash('sha256').update(input).digest('hex')
}

function base64Url(bytes: Uint8Array) {
  return Buffer.from(bytes).toString('base64').replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

export function createPublicToken() {
  return base64Url(randomBytes(32))
}

export function hashToken(token: string) {
  return sha256(token)
}

export async function hashLinkPassword(password: string) {
  return await bcrypt.hash(password, 12)
}

export async function verifyLinkPassword(password: string, passwordHash: string) {
  return await bcrypt.compare(password, passwordHash)
}

function normalizeFolderKey(key: string) {
  return key.endsWith('/') ? key : `${key}/`
}

export function isMarkdownObjectKey(key: string) {
  return key.toLowerCase().endsWith('.md')
}

export function assertKeyInScope(scopeType: 'file' | 'folder', scopeKey: string, key: string) {
  if (scopeType === 'file') {
    if (key !== scopeKey) throw createError({ statusCode: 403, statusMessage: 'Key out of scope' })
    return
  }
  const base = normalizeFolderKey(scopeKey)
  if (!key.startsWith(base)) throw createError({ statusCode: 403, statusMessage: 'Key out of scope' })
}

export async function resolvePublicLinkOrThrow(token: string) {
  const db = prisma()
  const tokenHash = hashToken(token)
  const link = await db.publicLink.findFirst({
    where: {
      OR: [{ token }, { tokenHash }]
    }
  })
  if (!link) throw createError({ statusCode: 404, statusMessage: 'Link not found' })
  if (link.revokedAt) throw createError({ statusCode: 410, statusMessage: 'Link revoked' })
  if (link.expiresAt && link.expiresAt <= new Date()) throw createError({ statusCode: 410, statusMessage: 'Link expired' })
  return link
}

export async function requirePublicPasswordIfNeeded(event: H3Event, link: { passwordHash: string | null }) {
  if (!link.passwordHash) return
  const provided = getHeader(event, 'x-public-password')?.toString() || ''
  if (!provided) throw createError({ statusCode: 401, statusMessage: 'Password required' })
  const turnstileToken = getHeader(event, 'x-turnstile-token')?.toString() || ''
  await verifyTurnstileOrThrow(event, turnstileToken)
  const ok = await verifyLinkPassword(provided, link.passwordHash)
  if (!ok) throw createError({ statusCode: 401, statusMessage: 'Invalid password' })
}

