import { getQuery, setHeader, getHeader, sendNoContent, createError } from 'h3'
import { requireUser } from '../utils/auth'
import { validateS3Key, assertKeyUnderPrefix } from '../utils/s3Key'
import { s3GetObjectText, s3HeadObject } from '../utils/s3'
import { renderMarkdownToHtml } from '../utils/markdown'
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

  const head = await s3HeadObject(event, key)
  const etag = (head.ETag || '').replaceAll('"', '')
  if (etag) {
    const ifNoneMatch = getHeader(event, 'if-none-match')?.toString().replaceAll('"', '')
    setHeader(event, 'ETag', `"${etag}"`)
    if (ifNoneMatch && ifNoneMatch === etag) {
      setHeader(event, 'Cache-Control', 'private, max-age=0, must-revalidate')
      return sendNoContent(event, 304)
    }
  }

  const markdown = await s3GetObjectText(event, key)
  const html = await renderMarkdownToHtml(markdown, { docKey: key })
  setHeader(event, 'Cache-Control', 'private, max-age=0, must-revalidate')
  return { key, etag, html }
})

