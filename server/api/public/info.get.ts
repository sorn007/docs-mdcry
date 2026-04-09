import { getQuery, getHeader, createError } from 'h3'
import { resolvePublicLinkOrThrow, requirePublicPasswordIfNeeded } from '../../utils/publicLinks'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const token = typeof q.token === 'string' ? q.token : ''
  if (!token) throw createError({ statusCode: 400, statusMessage: 'Missing token' })

  const link = await resolvePublicLinkOrThrow(token)

  if (link.passwordHash) {
    const provided = getHeader(event, 'x-public-password')?.toString() || ''
    if (!provided) {
      return {
        requiresPassword: true as const,
        expiresAt: link.expiresAt,
        allowMarkdownDownload: link.allowMarkdownDownload,
        allowExportWord: link.allowExportWord
      }
    }
    await requirePublicPasswordIfNeeded(event, link)
  }

  return {
    id: link.id,
    scopeType: link.scopeType,
    scopeKey: link.scopeKey,
    expiresAt: link.expiresAt,
    requiresPassword: Boolean(link.passwordHash),
    allowMarkdownDownload: link.allowMarkdownDownload,
    allowExportWord: link.allowExportWord
  }
})

