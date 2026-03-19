import { getDocIndexOrRescan } from '../utils/docIndex'
import { requireUser } from '../utils/auth'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const index = await getDocIndexOrRescan(event)
  return {
    versionHash: index.versionHash,
    updatedAt: index.updatedAt,
    tree: JSON.parse(index.treeJson)
  }
})

