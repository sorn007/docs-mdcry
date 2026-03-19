import { createError } from 'h3'

/**
 * Validates S3 key to prevent path traversal and invalid keys.
 * Rejects: empty, '..', leading slash, backslash, null bytes.
 * @see https://owasp.org/www-community/attacks/Path_Traversal
 */
export function validateS3Key(key: string): void {
  if (!key || typeof key !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid key' })
  }
  const trimmed = key.trim()
  if (trimmed.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid key' })
  }
  if (trimmed.includes('..') || trimmed.startsWith('/') || trimmed.includes('\\') || trimmed.includes('\0')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid key' })
  }
}

/**
 * Ensures key is under the given prefix (e.g. docs root).
 * Prefix should be normalized (e.g. end with / or be empty).
 */
export function assertKeyUnderPrefix(key: string, prefix: string): void {
  if (!prefix) return
  const normalized = prefix.endsWith('/') ? prefix : `${prefix}/`
  if (!key.startsWith(normalized)) {
    throw createError({ statusCode: 403, statusMessage: 'Key out of scope' })
  }
}
