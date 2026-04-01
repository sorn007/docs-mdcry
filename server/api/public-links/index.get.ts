import { requireUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const db = prisma()
  const links = await db.publicLink.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200
  })
  return {
    links: links.map(l => ({
      id: l.id,
      url: l.token ? `/public/${encodeURIComponent(l.token)}` : null,
      scopeType: l.scopeType,
      scopeKey: l.scopeKey,
      createdAt: l.createdAt,
      expiresAt: l.expiresAt,
      revokedAt: l.revokedAt,
      requiresPassword: Boolean(l.passwordHash)
    }))
  }
})

