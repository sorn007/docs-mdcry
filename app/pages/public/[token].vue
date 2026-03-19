<script setup lang="ts">
definePageMeta({ layout: false })

type PublicInfo = {
  scopeType: 'file' | 'folder'
  scopeKey: string
  expiresAt: string | null
  requiresPassword: boolean
}

type DocTreeNode = { type: 'folder' | 'file', name: string, key: string, children?: DocTreeNode[] }
type DocTree = { rootPrefix: string, projects: DocTreeNode[] }

const route = useRoute()
const token = computed(() => String(route.params.token || ''))
const key = computed(() => typeof route.query.key === 'string' ? route.query.key : '')

const password = ref('')
const passwordNeeded = ref(false)

function authHeaders() {
  const headers: Record<string, string> = {}
  if (password.value) headers['x-public-password'] = password.value
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

async function loadInfo() {
  info.value = await $fetch<PublicInfo>('/api/public/info', { query: { token: token.value } })
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

function openKey(k: string) {
  navigateTo({ path: `/public/${encodeURIComponent(token.value)}`, query: { key: k } })
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

        <UCard v-if="passwordNeeded && !password" class="max-w-lg mx-auto">
          <template #header>
            <div class="font-semibold">Password required</div>
          </template>
          <div class="space-y-3">
            <UInput v-model="password" type="password" placeholder="Enter password" />
            <UButton :loading="loading" @click="refresh">
              Continue
            </UButton>
          </div>
        </UCard>

        <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <UCard class="lg:col-span-4">
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

          <UCard class="lg:col-span-8">
            <template #header>
              <div class="flex items-center justify-between">
                <div class="font-semibold truncate">
                  {{ docKey || 'Select a file' }}
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

