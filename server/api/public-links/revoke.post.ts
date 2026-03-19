import { readBody, createError } from 'h3'
import { requireUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const body = await readBody(event).catch(() => ({}))
  const id = typeof body?.id === 'string' ? body.id : ''
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const db = prisma()
  await db.publicLink.update({
    where: { id },
    data: { revokedAt: new Date() }
  })
  return { ok: true }
})

