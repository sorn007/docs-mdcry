<script setup lang="ts">
definePageMeta({ layout: false })

import { exportRenderedMarkdownToDocx } from '~/utils/exportRenderedMarkdownToDocx'

type PublicInfo = {
  scopeType?: 'file' | 'folder'
  scopeKey?: string
  expiresAt: string | null
  requiresPassword: boolean
  allowMarkdownDownload: boolean
  allowExportWord: boolean
}

type DocTreeNode = { type: 'folder' | 'file', name: string, key: string, children?: DocTreeNode[] }
type DocTree = { rootPrefix: string, projects: DocTreeNode[] }

const route = useRoute()
const toast = useToast()
const config = useRuntimeConfig()
const turnstileSiteKey = config.public?.turnstileSiteKey || ''
const turnstileEnabled = Boolean(turnstileSiteKey)
const token = computed(() => String(route.params.token || ''))
const key = computed(() => typeof route.query.key === 'string' ? route.query.key : '')

const password = ref('')
const passwordNeeded = ref(false)
const passwordSubmitted = ref(false)
const publicTurnstileToken = ref('')

declare global {
  interface Window {
    onPublicTurnstileSuccess?: (token: string) => void
    onPublicTurnstileExpired?: () => void
  }
}

if (import.meta.client && turnstileEnabled) {
  useHead({
    script: [
      { src: 'https://challenges.cloudflare.com/turnstile/v0/api.js', async: true, defer: true }
    ]
  })
}

onMounted(() => {
  if (!import.meta.client || !turnstileEnabled) return
  window.onPublicTurnstileSuccess = (token: string) => {
    publicTurnstileToken.value = token
  }
  window.onPublicTurnstileExpired = () => {
    publicTurnstileToken.value = ''
  }
})

function authHeaders() {
  const headers: Record<string, string> = {}
  if (passwordSubmitted.value && password.value) headers['x-public-password'] = password.value
  if (turnstileEnabled && publicTurnstileToken.value) headers['x-turnstile-token'] = publicTurnstileToken.value
  return headers
}

const info = ref<PublicInfo | null>(null)
const tree = ref<DocTree | null>(null)
const html = ref<string>('')
const docKey = ref<string>('')
const loading = ref(false)
const error = ref<string | null>(null)
const markdownRoot = ref<HTMLElement | null>(null)
const { focusFromHash } = useMarkdownHashFocus(markdownRoot)
useMermaidDiagrams(markdownRoot, html)
const { isFocusMode, toggleFocus } = useReaderFocusLayout()

const allowMarkdownDownload = computed(() => info.value?.allowMarkdownDownload === true)
const allowExportWord = computed(() => info.value?.allowExportWord === true)
const canDownloadMd = computed(
  () => allowMarkdownDownload.value && docKey.value.toLowerCase().endsWith('.md')
)

const downloadingMd = ref(false)
const exportingWord = ref(false)

async function loadInfo() {
  const headers: Record<string, string> = {}
  if (passwordSubmitted.value && password.value) headers['x-public-password'] = password.value
  info.value = await $fetch<PublicInfo>('/api/public/info', { query: { token: token.value }, headers })
  passwordNeeded.value = info.value.requiresPassword
}

async function loadTree() {
  const res = await $fetch<any>('/api/public/tree', { query: { token: token.value }, headers: authHeaders() })
  tree.value = res.tree || null
  if (res.scopeType === 'file') {
    docKey.value = res.file.key
  }
}

async function loadDoc(targetKey: string) {
  const res = await $fetch<{ html: string, key: string }>('/api/public/doc', {
    query: { token: token.value, key: targetKey },
    headers: authHeaders()
  })
  html.value = res.html
  docKey.value = res.key
  await nextTick()
  focusFromHash()
}

async function refresh() {
  loading.value = true
  error.value = null
  try {
    await loadInfo()
    if (passwordNeeded.value && !passwordSubmitted.value) {
      html.value = ''
      docKey.value = ''
      tree.value = null
      return
    }
    await loadTree()
    const target = key.value || docKey.value
    if (target) await loadDoc(target)
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.statusMessage || 'Failed to load'
  } finally {
    loading.value = false
  }
}

watch(() => [token.value, key.value], () => refresh(), { immediate: true })
watch(() => token.value, () => {
  passwordSubmitted.value = false
  password.value = ''
  publicTurnstileToken.value = ''
})

function openKey(k: string) {
  navigateTo({ path: `/public/${encodeURIComponent(token.value)}`, query: { key: k } })
}

async function submitPassword() {
  if (turnstileEnabled && !publicTurnstileToken.value) {
    toast.add({ title: 'Please complete Turnstile verification first', color: 'warning' })
    return
  }
  passwordSubmitted.value = true
  await refresh()
}

async function downloadCurrentMarkdown() {
  if (!import.meta.client || !canDownloadMd.value) return
  downloadingMd.value = true
  try {
    const u = new URL('/api/public/asset', window.location.origin)
    u.searchParams.set('token', token.value)
    u.searchParams.set('key', docKey.value)
    const res = await fetch(u.toString(), { headers: authHeaders(), redirect: 'follow' })
    if (!res.ok) {
      throw new Error(res.status === 403 ? 'ไม่อนุญาตดาวน์โหลด Markdown' : `HTTP ${res.status}`)
    }
    const blob = await res.blob()
    const name = (docKey.value.split('/').pop() || 'document.md').replace(/[^\w.\u0E00-\u0E7F-]+/g, '_')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name.endsWith('.md') ? name : `${name}.md`
    a.rel = 'noopener'
    a.click()
    URL.revokeObjectURL(url)
    toast.add({ title: 'ดาวน์โหลดแล้ว' })
  } catch (e: any) {
    toast.add({ title: e?.message || 'ดาวน์โหลดไม่สำเร็จ', color: 'error' })
  } finally {
    downloadingMd.value = false
  }
}

async function exportCurrentWord() {
  if (!import.meta.client || !allowExportWord.value || !markdownRoot.value || !docKey.value) return
  exportingWord.value = true
  try {
    await exportRenderedMarkdownToDocx(markdownRoot.value, docKey.value)
    toast.add({ title: 'ส่งออก Word แล้ว' })
  } catch (e: any) {
    toast.add({ title: e?.message || 'ส่งออก Word ไม่สำเร็จ', color: 'error' })
  } finally {
    exportingWord.value = false
  }
}
</script>

<template>
  <div class="min-h-dvh">
    <UHeader>
      <template #left>
        <div class="flex items-center gap-3">
          <AppLogo class="w-auto h-6 shrink-0" />
          <span class="text-sm text-muted">Public share</span>
        </div>
      </template>
      <template #right>
        <UColorModeButton />
      </template>
    </UHeader>

    <UMain>
      <UContainer class="py-6">
        <UAlert v-if="error" color="error" variant="soft" :title="error" />

        <UCard v-if="passwordNeeded && !passwordSubmitted" class="max-w-lg mx-auto">
          <template #header>
            <div class="font-semibold">Password required</div>
          </template>
          <div class="space-y-3">
            <UInput v-model="password" type="password" placeholder="Enter password" />
            <div
              v-if="turnstileEnabled"
              class="cf-turnstile"
              :data-sitekey="turnstileSiteKey"
              data-callback="onPublicTurnstileSuccess"
              data-expired-callback="onPublicTurnstileExpired"
            />
            <UButton :loading="loading" @click="submitPassword">
              Continue
            </UButton>
          </div>
        </UCard>

        <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <UCard :class="isFocusMode ? 'lg:col-span-3' : 'lg:col-span-4'">
            <template #header>
              <div class="flex items-center justify-between">
                <div class="font-semibold">Files</div>
                <UButton size="xs" variant="soft" color="neutral" :loading="loading" @click="refresh">
                  Refresh
                </UButton>
              </div>
            </template>

            <div v-if="tree?.projects?.length" class="space-y-2">
              <div v-for="project in tree.projects" :key="project.key" class="space-y-1">
                <div class="text-sm font-medium">{{ project.name }}</div>
                <div class="pl-3 space-y-1">
                  <template v-for="child in project.children || []" :key="child.key">
                    <UButton
                      v-if="child.type === 'file'"
                      variant="ghost"
                      color="neutral"
                      class="w-full justify-start"
                      :disabled="child.key === docKey"
                      @click="openKey(child.key)"
                    >
                      {{ child.name }}
                    </UButton>
                  </template>
                </div>
              </div>
            </div>
            <div v-else class="text-sm text-muted">
              No files
            </div>
          </UCard>

          <UCard :class="isFocusMode ? 'lg:col-span-9' : 'lg:col-span-8'">
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <div class="font-semibold truncate">
                  {{ docKey || 'Select a file' }}
                </div>
                <div class="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                  <UButton
                    v-if="canDownloadMd"
                    size="xs"
                    color="neutral"
                    variant="soft"
                    icon="i-lucide-download"
                    :loading="downloadingMd"
                    @click="downloadCurrentMarkdown"
                  >
                    ดาวน์โหลด .md
                  </UButton>
                  <UButton
                    v-if="allowExportWord && html"
                    size="xs"
                    color="neutral"
                    variant="soft"
                    icon="i-lucide-file-text"
                    :loading="exportingWord"
                    @click="exportCurrentWord"
                  >
                    Export Word
                  </UButton>
                  <UButton
                    size="xs"
                    color="neutral"
                    variant="soft"
                    :icon="isFocusMode ? 'i-lucide-panel-right-close' : 'i-lucide-panel-right-open'"
                    :aria-pressed="isFocusMode"
                    :aria-label="isFocusMode ? 'แสดงเมนูเต็ม' : 'โฟกัสเนื้อหา'"
                    :title="isFocusMode ? 'แสดงเมนูเต็ม' : 'โฟกัสเนื้อหา'"
                    @click="toggleFocus"
                  />
                </div>
              </div>
            </template>

            <div v-if="html" ref="markdownRoot" class="md max-w-none" v-html="html" />
            <div v-else class="text-sm text-muted">
              Select a markdown file to view.
            </div>
          </UCard>
        </div>
      </UContainer>
    </UMain>
  </div>
</template>

