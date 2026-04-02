<script setup lang="ts">
const route = useRoute()
const key = computed(() => typeof route.query.key === 'string' ? route.query.key : '')

const html = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const markdownRoot = ref<HTMLElement | null>(null)
const { focusFromHash } = useMarkdownHashFocus(markdownRoot)
useMermaidDiagrams(markdownRoot, html)

async function fetchDoc() {
  if (!key.value) return
  loading.value = true
  error.value = null
  try {
    const res = await $fetch<{ html: string }>('/api/doc', { query: { key: key.value } })
    html.value = res.html
    await nextTick()
    focusFromHash()
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.statusMessage || 'Failed to load'
  } finally {
    loading.value = false
  }
}

watch(() => key.value, () => fetchDoc(), { immediate: true })
</script>

<template>
  <UContainer class="py-6">
    <div class="flex items-center justify-between gap-3 mb-4">
      <div class="font-semibold truncate">
        {{ key || 'View' }}
      </div>
      <UButton to="/" variant="soft" color="neutral">Back</UButton>
    </div>

    <UAlert v-if="error" color="error" variant="soft" :title="error" class="mb-3" />

    <div v-if="loading" class="space-y-2">
      <USkeleton class="h-4 w-2/3" />
      <USkeleton class="h-4 w-5/6" />
      <USkeleton class="h-4 w-4/6" />
    </div>

    <div v-else-if="html" ref="markdownRoot" class="md max-w-none" v-html="html" />
    <div v-else class="text-sm text-muted">
      Missing key.
    </div>
  </UContainer>
</template>

