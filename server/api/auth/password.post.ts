import { readBody, createError } from 'h3'
import { getClientIp, checkRateLimit } from '../../utils/rateLimit'
import { prisma } from '../../utils/prisma'
import { requireUser, hashPassword, verifyPassword } from '../../utils/auth'

const WINDOW_MS = 60 * 60 * 1000
const MAX_ATTEMPTS = 10

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const ip = getClientIp(event)
  checkRateLimit(`password-change:${ip}`, MAX_ATTEMPTS, WINDOW_MS)

  const body = await readBody(event).catch(() => ({}))
  const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : ''
  const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : ''
  const confirmPassword = typeof body?.confirmPassword === 'string' ? body.confirmPassword : ''

  if (!currentPassword.trim() || !newPassword.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Current and new password are required' })
  }

  const next = newPassword.trim()
  const confirm = confirmPassword.trim() || next
  if (next !== confirm) {
    throw createError({ statusCode: 400, statusMessage: 'New passwords do not match' })
  }
  if (next.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'New password must be at least 8 characters' })
  }
  if (currentPassword.trim() === next) {
    throw createError({ statusCode: 400, statusMessage: 'New password must differ from current password' })
  }

  const db = prisma()
  const row = await db.user.findUnique({ where: { id: user.id } })
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const ok = await verifyPassword(currentPassword.trim(), row.passwordHash)
  if (!ok) {
    throw createError({ statusCode: 401, statusMessage: 'Current password is incorrect' })
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next) }
  })

  return { ok: true }
})
