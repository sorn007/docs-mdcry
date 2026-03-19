import { getQuery, sendRedirect, createError, setHeader } from 'h3'
import { validateS3Key } from '../../utils/s3Key'
import { assertKeyInScope, resolvePublicLinkOrThrow, requirePublicPasswordIfNeeded } from '../../utils/publicLinks'
import { s3SignedGetUrl } from '../../utils/s3'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const token = typeof q.token === 'string' ? q.token : ''
  const key = typeof q.key === 'string' ? q.key : ''
  if (!token || !key) throw createError({ statusCode: 400, statusMessage: 'Missing token or key' })
  validateS3Key(key)

  const link = await resolvePublicLinkOrThrow(token)
  await requirePublicPasswordIfNeeded(event, link)
  assertKeyInScope(link.scopeType, link.scopeKey, key)

  const url = await s3SignedGetUrl(event, key, 60)
  setHeader(event, 'Cache-Control', 'public, max-age=0, must-revalidate')
  return await sendRedirect(event, url, 302)
})

