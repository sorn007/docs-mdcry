import { getQuery, setHeader, getHeader, sendNoContent, createError } from 'h3'
import { validateS3Key } from '../../utils/s3Key'
import { assertKeyInScope, resolvePublicLinkOrThrow, requirePublicPasswordIfNeeded } from '../../utils/publicLinks'
import { s3GetObjectText, s3HeadObject } from '../../utils/s3'
import { renderMarkdownToHtml } from '../../utils/markdown'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const token = typeof q.token === 'string' ? q.token : ''
  const key = typeof q.key === 'string' ? q.key : ''
  if (!token || !key) throw createError({ statusCode: 400, statusMessage: 'Missing token or key' })
  validateS3Key(key)

  const link = await resolvePublicLinkOrThrow(token)
  await requirePublicPasswordIfNeeded(event, link)
  assertKeyInScope(link.scopeType, link.scopeKey, key)

  const head = await s3HeadObject(event, key)
  const etag = (head.ETag || '').replaceAll('"', '')
  if (etag) {
    const ifNoneMatch = getHeader(event, 'if-none-match')?.toString().replaceAll('"', '')
    setHeader(event, 'ETag', `"${etag}"`)
    if (ifNoneMatch && ifNoneMatch === etag) {
      setHeader(event, 'Cache-Control', 'public, max-age=0, must-revalidate')
      return sendNoContent(event, 304)
    }
  }

  const markdown = await s3GetObjectText(event, key)
  const html = await renderMarkdownToHtml(markdown, {
    docKey: key,
    docLinkBase: `/public/${encodeURIComponent(token)}?key=`,
    assetLinkBase: `/api/public/asset?token=${encodeURIComponent(token)}&key=`
  })

  const db = prisma()
  await db.publicLink.update({ where: { id: link.id }, data: { lastAccessAt: new Date() } })

  setHeader(event, 'Cache-Control', 'public, max-age=0, must-revalidate')
  return { key, etag, html }
})

