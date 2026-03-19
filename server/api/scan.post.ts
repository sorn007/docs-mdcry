import { rescanAndSaveDocIndex } from '../utils/docIndex'
import { requireUser } from '../utils/auth'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const index = await rescanAndSaveDocIndex(event)
  return {
    versionHash: index.versionHash,
    updatedAt: index.updatedAt
  }
})

