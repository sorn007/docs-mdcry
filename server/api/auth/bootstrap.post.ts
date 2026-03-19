import { readBody, createError } from 'h3'
import { getClientIp, checkRateLimit } from '../../utils/rateLimit'
import { prisma } from '../../utils/prisma'
import { createSessionForUser, hashPassword } from '../../utils/auth'

const BOOTSTRAP_WINDOW_MS = 60 * 60 * 1000
const BOOTSTRAP_MAX_ATTEMPTS = 3

export default defineEventHandler(async (event) => {
  const ip = getClientIp(event)
  checkRateLimit(`bootstrap:${ip}`, BOOTSTRAP_MAX_ATTEMPTS, BOOTSTRAP_WINDOW_MS)

  await readBody(event).catch(() => ({}))

  const db = prisma()
  const existing = await db.user.findFirst()
  if (existing) return { ok: true, created: false }

  const username = process.env.OWNER_USERNAME || 'admin'
  const password = process.env.OWNER_PASSWORD || ''
  if (!password) throw createError({ statusCode: 400, statusMessage: 'OWNER_PASSWORD is required for bootstrap' })

  const user = await db.user.create({
    data: {
      username,
      passwordHash: await hashPassword(password)
    }
  })

  await createSessionForUser(event, user.id)
  return { ok: true, created: true, username: user.username }
})

