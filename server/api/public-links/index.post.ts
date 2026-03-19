import { readBody, createError } from 'h3'
import { requireUser } from '../../utils/auth'
import { validateS3Key } from '../../utils/s3Key'
import { prisma } from '../../utils/prisma'
import { createPublicToken, hashLinkPassword, hashToken } from '../../utils/publicLinks'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const body = await readBody(event).catch(() => ({}))

  const scopeType = body?.scopeType === 'file' || body?.scopeType === 'folder' ? body.scopeType : null
  const scopeKey = typeof body?.scopeKey === 'string' ? body.scopeKey.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const expiresAt = body?.expiresAt ? new Date(body.expiresAt) : null

  if (!scopeType || !scopeKey) throw createError({ statusCode: 400, statusMessage: 'Invalid scope' })
  validateS3Key(scopeKey)
  if (expiresAt && Number.isNaN(expiresAt.getTime())) throw createError({ statusCode: 400, statusMessage: 'Invalid expiresAt' })

  const token = createPublicToken()
  const tokenHash = hashToken(token)

  const db = prisma()
  const link = await db.publicLink.create({
    data: {
      tokenHash,
      passwordHash: password ? await hashLinkPassword(password) : null,
      scopeType,
      scopeKey,
      expiresAt: expiresAt || null
    }
  })

  return {
    id: link.id,
    token,
    url: `/public/${encodeURIComponent(token)}`,
    requiresPassword: Boolean(link.passwordHash),
    expiresAt: link.expiresAt
  }
})

