import { getQuery, createError } from 'h3'
import { resolvePublicLinkOrThrow, requirePublicPasswordIfNeeded } from '../../utils/publicLinks'
import { s3ListAllKeys } from '../../utils/s3'
import { buildDocTreeFromKeys } from '../../utils/docIndex'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const token = typeof q.token === 'string' ? q.token : ''
  if (!token) throw createError({ statusCode: 400, statusMessage: 'Missing token' })

  const link = await resolvePublicLinkOrThrow(token)
  await requirePublicPasswordIfNeeded(event, link)

  if (link.scopeType === 'file') {
    return {
      scopeType: 'file',
      file: { type: 'file', name: link.scopeKey.split('/').pop() || link.scopeKey, key: link.scopeKey }
    }
  }

  const prefix = link.scopeKey.endsWith('/') ? link.scopeKey : `${link.scopeKey}/`
  const keys = await s3ListAllKeys(event, { prefix })
  const tree = buildDocTreeFromKeys(keys, prefix)
  return {
    scopeType: 'folder',
    tree
  }
})

