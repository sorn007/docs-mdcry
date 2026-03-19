import { readBody, createError } from 'h3'
import { getClientIp, checkRateLimit } from '../../utils/rateLimit'
import { prisma } from '../../utils/prisma'
import { createSessionForUser, verifyPassword } from '../../utils/auth'

const LOGIN_WINDOW_MS = 60 * 1000
const LOGIN_MAX_ATTEMPTS = 5

export default defineEventHandler(async (event) => {
  const ip = getClientIp(event)
  checkRateLimit(`login:${ip}`, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS)

  const body = await readBody(event).catch(() => ({}))
  const username = typeof body?.username === 'string' ? body.username : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!username || !password) throw createError({ statusCode: 400, statusMessage: 'Missing credentials' })

  const db = prisma()
  const user = await db.user.findUnique({ where: { username } })
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })

  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })

  await createSessionForUser(event, user.id)
  return { ok: true }
})

