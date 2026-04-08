<script setup lang="ts">
import type { AdminScopeNode } from '../components/AdminScopeTree.vue'

type DocTreeNode = AdminScopeNode
type DocTree = { rootPrefix: string, projects: DocTreeNode[] }

type PublicLinkRow = {
  id: string
  url: string | null
  scopeType: 'file' | 'folder'
  scopeKey: string
  createdAt: string
  expiresAt: string | null
  revokedAt: string | null
  requiresPassword: boolean
  allowMarkdownDownload: boolean
  allowExportWord: boolean
}

const toast = useToast()

const tree = ref<DocTree | null>(null)
const links = ref<PublicLinkRow[]>([])
const loading = ref(false)
const selectedNode = ref<DocTreeNode | null>(null)

const createForm = reactive({
  scopeType: 'file' as 'file' | 'folder',
  scopeKey: '',
  password: '',
  expiresAt: '' as string,
  allowMarkdownDownload: false,
  allowExportWord: false
})

async function refreshTree() {
  const res = await $fetch<any>('/api/tree')
  tree.value = res.tree as DocTree
}

async function rescan() {
  loading.value = true
  try {
    await $fetch('/api/scan', { method: 'POST' })
    await refreshTree()
    toast.add({ title: 'Rescan complete' })
  } finally {
    loading.value = false
  }
}

async function refreshLinks() {
  const res = await $fetch<{ links: PublicLinkRow[] }>('/api/public-links')
  links.value = res.links
}

async function createLink() {
  if (!createForm.scopeKey) {
    toast.add({ title: 'Select scope first', color: 'warning' })
    return
  }
  if (selectedNode.value && selectedNode.value.type !== createForm.scopeType) {
    toast.add({ title: 'Scope type does not match selected node', color: 'warning' })
    return
  }

  loading.value = true
  try {
    const res = await $fetch<any>('/api/public-links', {
      method: 'POST',
      body: {
        scopeType: createForm.scopeType,
        scopeKey: createForm.scopeKey,
        password: createForm.password || undefined,
        expiresAt: createForm.expiresAt || undefined,
        allowMarkdownDownload: createForm.allowMarkdownDownload,
        allowExportWord: createForm.allowExportWord
      }
    })
    await refreshLinks()
    toast.add({ title: 'Public link created', description: res.url })
    createForm.password = ''
    createForm.expiresAt = ''
  } finally {
    loading.value = false
  }
}

async function copyLink(id: string) {
  const row = links.value.find(l => l.id === id)
  const url = row?.url
  if (!url) {
    toast.add({ title: 'Link URL unavailable (created before update)', color: 'warning' })
    return
  }
  const absolute = new URL(url, window.location.origin).toString()
  await navigator.clipboard.writeText(absolute)
  toast.add({ title: 'Copied public link' })
}

function toAbsoluteUrl(url: string | null) {
  if (!url || !import.meta.client) return ''
  return new URL(url, window.location.origin).toString()
}

async function revoke(id: string) {
  loading.value = true
  try {
    await $fetch('/api/public-links/revoke', { method: 'POST', body: { id } })
    await refreshLinks()
    toast.add({ title: 'Revoked' })
  } finally {
    loading.value = false
  }
}

function onSelectScope(node: DocTreeNode) {
  selectedNode.value = node
  createForm.scopeType = node.type
  createForm.scopeKey = node.key
}

onMounted(async () => {
  await Promise.all([refreshTree(), refreshLinks()])
})
</script>

<template>
  <UContainer class="py-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <div class="text-lg font-semibold">Admin</div>
        <div class="text-sm text-muted">Rescan docs and manage public links</div>
      </div>
      <div class="flex items-center gap-2">
        <UButton variant="soft" color="neutral" :loading="loading" @click="refreshLinks">
          Refresh
        </UButton>
        <UButton color="primary" :loading="loading" @click="rescan">
          Rescan now
        </UButton>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <UCard class="lg:col-span-5">
        <template #header>
          <div class="font-semibold">Pick scope</div>
        </template>
        <div v-if="tree?.projects?.length" class="space-y-3">
          <AdminScopeTree
            v-for="project in tree.projects"
            :key="project.key"
            :node="project"
            :active-key="selectedNode?.key"
            @select="onSelectScope"
          />
        </div>
        <div v-else class="text-sm text-muted">
          No index yet. Configure S3 env vars and click Rescan.
        </div>
      </UCard>

      <UCard class="lg:col-span-7">
        <template #header>
          <div class="font-semibold">Create public link</div>
        </template>

        <div class="space-y-4">
          <UAlert
            v-if="selectedNode"
            color="primary"
            variant="soft"
            :title="`Selected ${selectedNode.type}: ${selectedNode.name}`"
            :description="selectedNode.key"
          />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <UFormField label="Scope type">
              <USelect v-model="createForm.scopeType" :items="['file', 'folder']" />
            </UFormField>
            <UFormField label="Scope key (S3 key or prefix)">
              <UInput v-model="createForm.scopeKey" placeholder="docs/ProjectA/README.md" />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <UFormField label="Password (optional)">
              <UInput v-model="createForm.password" type="password" />
            </UFormField>
            <UFormField label="Expires at (optional, ISO)">
              <UInput v-model="createForm.expiresAt" placeholder="2026-12-31T00:00:00Z" />
            </UFormField>
          </div>

          <div class="flex flex-col sm:flex-row sm:flex-wrap gap-4">
            <UCheckbox v-model="createForm.allowMarkdownDownload" label="อนุญาตดาวน์โหลดไฟล์ Markdown (.md) จากลิงก์สาธารณะ" />
            <UCheckbox v-model="createForm.allowExportWord" label="อนุญาต Export Word (.docx) จากหน้า public (สร้างในเบราว์เซอร์)" />
          </div>

          <UButton color="primary" :loading="loading" @click="createLink">
            Generate link
          </UButton>
        </div>

        <USeparator class="my-6" />

        <div class="space-y-3">
          <div class="font-semibold">Recent links</div>
          <div v-if="links.length" class="space-y-2">
            <UCard v-for="l in links" :key="l.id" class="p-3">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="text-sm font-medium truncate">
                    {{ l.scopeType }} • {{ l.scopeKey }}
                  </div>
                  <div class="text-xs text-muted">
                    {{ l.requiresPassword ? 'password' : 'no password' }}
                    <span v-if="l.expiresAt"> • expires {{ l.expiresAt }}</span>
                    <span v-if="l.revokedAt"> • revoked</span>
                  </div>
                  <div class="text-xs text-muted mt-0.5">
                    md download: {{ l.allowMarkdownDownload ? 'on' : 'off' }}
                    · export Word: {{ l.allowExportWord ? 'on' : 'off' }}
                  </div>
                  <div v-if="l.url" class="text-xs mt-1 break-all text-primary">
                    {{ toAbsoluteUrl(l.url) }}
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <UButton
                    v-if="!l.revokedAt"
                    size="xs"
                    color="neutral"
                    variant="soft"
                    icon="i-lucide-copy"
                    @click="copyLink(l.id)"
                  >
                    Copy link
                  </UButton>
                  <UButton
                    v-if="!l.revokedAt"
                    size="xs"
                    color="error"
                    variant="soft"
                    :loading="loading"
                    @click="revoke(l.id)"
                  >
                    Revoke
                  </UButton>
                </div>
              </div>
            </UCard>
          </div>
          <div v-else class="text-sm text-muted">
            No links yet.
          </div>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>

