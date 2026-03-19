import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'
import { prisma } from './prisma'
import { s3ListAllKeys } from './s3'

export type DocTreeNode = {
  type: 'folder' | 'file'
  name: string
  key: string
  children?: DocTreeNode[]
}

export type DocTree = {
  rootPrefix: string
  projects: DocTreeNode[]
}

function normalizePrefix(prefix: string) {
  if (!prefix) return ''
  return prefix.endsWith('/') ? prefix : `${prefix}/`
}

function sha256(input: string) {
  return createHash('sha256').update(input).digest('hex')
}

function splitKey(relativeKey: string) {
  return relativeKey.split('/').filter(Boolean)
}

function upsertChildFolder(parent: DocTreeNode, folderName: string, key: string) {
  if (!parent.children) parent.children = []
  let node = parent.children.find(c => c.type === 'folder' && c.name === folderName)
  if (!node) {
    node = { type: 'folder', name: folderName, key, children: [] }
    parent.children.push(node)
  }
  return node
}

function addFile(parent: DocTreeNode, fileName: string, key: string) {
  if (!parent.children) parent.children = []
  if (parent.children.some(c => c.type === 'file' && c.key === key)) return
  parent.children.push({ type: 'file', name: fileName, key })
}

function sortTree(node: DocTreeNode) {
  if (!node.children) return
  node.children.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  for (const c of node.children) sortTree(c)
}

export function buildDocTreeFromKeys(keys: string[], rootPrefix: string): DocTree {
  const prefix = normalizePrefix(rootPrefix)
  const filtered = keys
    .filter(k => k.startsWith(prefix))
    .map(k => k.slice(prefix.length))
    .filter(k => k && !k.endsWith('/'))

  const projectMap = new Map<string, DocTreeNode>()

  for (const relKey of filtered) {
    const parts = splitKey(relKey)
    if (parts.length === 0) continue
    const project = parts[0]!
    const fullProjectKey = `${prefix}${project}/`

    let projectNode = projectMap.get(project)
    if (!projectNode) {
      projectNode = { type: 'folder', name: project, key: fullProjectKey, children: [] }
      projectMap.set(project, projectNode)
    }

    let cursor = projectNode
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i]!
      const isLast = i === parts.length - 1
      if (isLast) {
        const fullKey = `${prefix}${parts.slice(0, i + 1).join('/')}`
        addFile(cursor, part, fullKey)
      } else {
        const folderKey = `${prefix}${parts.slice(0, i + 1).join('/')}/`
        cursor = upsertChildFolder(cursor, part, folderKey)
      }
    }
  }

  const projects = [...projectMap.values()]
  for (const p of projects) sortTree(p)
  projects.sort((a, b) => a.name.localeCompare(b.name))

  return { rootPrefix: prefix, projects }
}

export async function rescanAndSaveDocIndex(event: H3Event) {
  const cfg = useRuntimeConfig(event)
  const rootPrefix = (cfg.docs?.rootPrefix as string) || ''

  const keys = await s3ListAllKeys(event, { prefix: normalizePrefix(rootPrefix) || undefined })
  const tree = buildDocTreeFromKeys(keys, rootPrefix)
  const versionHash = sha256(JSON.stringify(keys.sort()))

  const db = prisma()
  const existing = await db.docIndex.findFirst()
  if (!existing) {
    return await db.docIndex.create({
      data: { versionHash, treeJson: JSON.stringify(tree) }
    })
  }
  return await db.docIndex.update({
    where: { id: existing.id },
    data: { versionHash, treeJson: JSON.stringify(tree) }
  })
}

export async function getDocIndexOrRescan(event: H3Event) {
  const db = prisma()
  const existing = await db.docIndex.findFirst()
  if (existing) return existing
  return await rescanAndSaveDocIndex(event)
}

