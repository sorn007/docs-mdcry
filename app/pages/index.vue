<script setup lang="ts">
import type { DocTreeNode } from '../components/DocTree.vue'

type DocTree = { rootPrefix: string, projects: DocTreeNode[] }

const route = useRoute()
const key = computed(() => typeof route.query.key === 'string' ? route.query.key : '')

const tree = ref<DocTree | null>(null)
const html = ref('')
const docKey = ref('')
const loadingTree = ref(false)
const loadingDoc = ref(false)
const error = ref<string | null>(null)
const search = ref('')
const markdownRoot = ref<HTMLElement | null>(null)
const { focusFromHash } = useMarkdownHashFocus(markdownRoot)
useMermaidDiagrams(markdownRoot, html)

async function fetchTree() {
  loadingTree.value = true
  try {
    const res = await $fetch<any>('/api/tree')
    tree.value = res.tree as DocTree
  } finally {
    loadingTree.value = false
  }
}

async function fetchDoc(k: string) {
  if (!k) return
  loadingDoc.value = true
  error.value = null
  try {
    const res = await $fetch<{ html: string, key: string }>('/api/doc', { query: { key: k } })
    html.value = res.html
    docKey.value = res.key
    await nextTick()
    focusFromHash()
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.statusMessage || 'Failed to load document'
  } finally {
    loadingDoc.value = false
  }
}

function openKey(k: string) {
  navigateTo({ path: '/', query: { key: k } })
}

function flattenFiles(nodes: DocTreeNode[], out: DocTreeNode[] = []) {
  for (const n of nodes) {
    if (n.type === 'file') out.push(n)
    if (n.children?.length) flattenFiles(n.children, out)
  }
  return out
}

const searchResults = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q || !tree.value) return []
  const files = flattenFiles(tree.value.projects)
  return files.filter(f => f.name.toLowerCase().includes(q)).slice(0, 50)
})

watch(() => key.value, (k) => {
  if (k) fetchDoc(k)
}, { immediate: true })

onMounted(fetchTree)
</script>

<template>
  <UContainer class="py-6">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <UCard class="lg:col-span-4">
        <template #header>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="font-semibold">Projects</div>
              <UButton size="xs" variant="soft" color="neutral" :loading="loadingTree" @click="fetchTree">
                Refresh
              </UButton>
            </div>
            <UInput v-model="search" placeholder="Search files…" />
          </div>
        </template>

        <div v-if="searchResults.length" class="space-y-1">
          <div class="text-xs text-muted mb-2">Search results</div>
          <UButton
            v-for="f in searchResults"
            :key="f.key"
            variant="ghost"
            color="neutral"
            class="w-full justify-start"
            :disabled="f.key === docKey"
            @click="openKey(f.key)"
          >
            {{ f.name }}
          </UButton>
          <USeparator class="my-3" />
        </div>

        <div v-if="tree?.projects?.length" class="space-y-2">
          <DocTree
            v-for="project in tree.projects"
            :key="project.key"
            :node="project"
            :active-key="docKey"
            @open="openKey"
          />
        </div>
        <div v-else class="text-sm text-muted">
          Configure S3 env vars and click <span class="font-medium">Rescan now</span> in Admin.
        </div>
      </UCard>

      <UCard class="lg:col-span-8">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div class="font-semibold truncate">
              {{ docKey || 'Select a file' }}
            </div>
            <UButton
              v-if="docKey"
              size="xs"
              color="neutral"
              variant="soft"
              :to="`/view?key=${encodeURIComponent(docKey)}`"
            >
              Open
            </UButton>
          </div>
        </template>

        <UAlert v-if="error" color="error" variant="soft" :title="error" class="mb-3" />

        <div v-if="loadingDoc" class="space-y-2">
          <USkeleton class="h-4 w-2/3" />
          <USkeleton class="h-4 w-5/6" />
          <USkeleton class="h-4 w-4/6" />
        </div>

        <div v-else-if="html" ref="markdownRoot" class="md max-w-none" v-html="html" />
        <div v-else class="text-sm text-muted">
          Pick a markdown file from the left.
        </div>
      </UCard>
    </div>
  </UContainer>
</template>
