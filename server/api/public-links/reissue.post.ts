import { readBody, createError } from 'h3'
import { requireUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'
import { createPublicToken, hashToken } from '../../utils/publicLinks'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const body = await readBody(event).catch(() => ({}))
  const id = typeof body?.id === 'string' ? body.id : ''
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const db = prisma()
  const prev = await db.publicLink.findUnique({ where: { id } })
  if (!prev) throw createError({ statusCode: 404, statusMessage: 'Link not found' })
  if (prev.revokedAt) throw createError({ statusCode: 410, statusMessage: 'Link revoked' })

  const token = createPublicToken()
  const tokenHash = hashToken(token)
  const link = await db.publicLink.create({
    data: {
      token,
      tokenHash,
      passwordHash: prev.passwordHash,
      allowMarkdownDownload: prev.allowMarkdownDownload,
      allowExportWord: prev.allowExportWord,
      scopeType: prev.scopeType,
      scopeKey: prev.scopeKey,
      expiresAt: prev.expiresAt
    }
  })

  return {
    id: link.id,
    token,
    url: `/public/${encodeURIComponent(token)}`,
    requiresPassword: Boolean(link.passwordHash),
    allowMarkdownDownload: link.allowMarkdownDownload,
    allowExportWord: link.allowExportWord,
    expiresAt: link.expiresAt
  }
})

