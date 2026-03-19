<script setup lang="ts">
export type AdminScopeNode = {
  type: 'folder' | 'file'
  name: string
  key: string
  children?: AdminScopeNode[]
}

const props = defineProps<{
  node: AdminScopeNode
  activeKey?: string
}>()

const emit = defineEmits<{
  (e: 'select', node: AdminScopeNode): void
}>()

const open = ref(true)
const isFolder = computed(() => props.node.type === 'folder')
const isActive = computed(() => props.activeKey === props.node.key)

function toggleFolder() {
  if (!isFolder.value) return
  open.value = !open.value
}

function selectNode() {
  emit('select', props.node)
}
</script>

<template>
  <div class="space-y-1">
    <div class="flex items-center gap-1">
      <UButton
        v-if="isFolder"
        size="xs"
        variant="ghost"
        color="neutral"
        class="shrink-0"
        :ui="{ rounded: 'rounded-md', padding: 'p-1' }"
        @click="toggleFolder"
      >
        {{ open ? '▾' : '▸' }}
      </UButton>

      <UButton
        variant="ghost"
        :color="isActive ? 'primary' : 'neutral'"
        class="w-full justify-start"
        @click="selectNode"
      >
        <span class="truncate">
          {{ node.name }}
        </span>
        <UBadge size="xs" color="neutral" variant="soft" class="ml-2">
          {{ node.type }}
        </UBadge>
      </UButton>
    </div>

    <div v-if="isFolder && open && node.children?.length" class="pl-4 space-y-1">
      <AdminScopeTree
        v-for="child in node.children"
        :key="child.key"
        :node="child"
        :active-key="activeKey"
        @select="emit('select', $event)"
      />
    </div>
  </div>
</template>

