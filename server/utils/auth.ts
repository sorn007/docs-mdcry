import { randomBytes, createHash } from 'node:crypto'
import { getCookie, setCookie, deleteCookie, createError } from 'h3'
import type { H3Event } from 'h3'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { useRuntimeConfig } from '#imports'

const SESSION_COOKIE = 'mdcry_session'

function sha256(input: string) {
  return createHash('sha256').update(input).digest('hex')
}

function base64Url(bytes: Uint8Array) {
  return Buffer.from(bytes).toString('base64').replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, passwordHash: string) {
  return await bcrypt.compare(password, passwordHash)
}

export async function getCurrentUser(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return null
  const tokenHash = sha256(token)

  const db = prisma()
  const session = await db.session.findFirst({
    where: { tokenHash, expiresAt: { gt: new Date() } },
    include: { user: true }
  })
  if (!session) return null
  return session.user
}

export async function requireUser(event: H3Event) {
  const user = await getCurrentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  return user
}

export async function createSessionForUser(event: H3Event, userId: string) {
  const cfg = useRuntimeConfig(event)
  const ttlSeconds = Number(cfg.auth?.sessionTtlSeconds || 60 * 60 * 24 * 14)

  const token = base64Url(randomBytes(32))
  const tokenHash = sha256(token)
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

  const db = prisma()
  await db.session.create({
    data: { userId, tokenHash, expiresAt }
  })

  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt
  })
}

export async function logout(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE)
  if (token) {
    const tokenHash = sha256(token)
    const db = prisma()
    await db.session.deleteMany({ where: { tokenHash } })
  }
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

/** After password change: invalidate other sessions; current cookie stays valid. */
export async function deleteOtherSessionsForUser(event: H3Event, userId: string) {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return
  const tokenHash = sha256(token)
  const db = prisma()
  await db.session.deleteMany({ where: { userId, NOT: { tokenHash } } })
}

