import { getQuery, sendRedirect, setHeader } from 'h3'
import { requireUser } from '../utils/auth'
import { validateS3Key, assertKeyUnderPrefix } from '../utils/s3Key'
import { s3SignedGetUrl } from '../utils/s3'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const q = getQuery(event)
  const key = typeof q.key === 'string' ? q.key : ''
  if (!key) throw createError({ statusCode: 400, statusMessage: 'Missing key' })
  validateS3Key(key)
  const config = useRuntimeConfig(event)
  const rootPrefix = (config.docs?.rootPrefix as string) || ''
  if (rootPrefix) assertKeyUnderPrefix(key, rootPrefix)

  const url = await s3SignedGetUrl(event, key, 60)
  setHeader(event, 'Cache-Control', 'private, max-age=0, must-revalidate')
  return await sendRedirect(event, url, 302)
})

