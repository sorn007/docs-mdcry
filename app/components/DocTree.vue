<script setup lang="ts">
export type DocTreeNode = { type: 'folder' | 'file', name: string, key: string, children?: DocTreeNode[] }

const props = defineProps<{
  node: DocTreeNode
  activeKey?: string
}>()

const emit = defineEmits<{
  (e: 'open', key: string): void
}>()

const open = ref(true)

function onClick() {
  if (props.node.type === 'file') {
    emit('open', props.node.key)
  } else {
    open.value = !open.value
  }
}
</script>

<template>
  <div>
    <UButton
      variant="ghost"
      color="neutral"
      class="w-full justify-start"
      :disabled="node.type === 'file' && node.key === activeKey"
      @click="onClick"
    >
      <span v-if="node.type === 'folder'" class="mr-2 text-muted">
        {{ open ? '▾' : '▸' }}
      </span>
      <span class="truncate">{{ node.name }}</span>
    </UButton>

    <div v-if="node.type === 'folder' && open && node.children?.length" class="pl-3 space-y-1">
      <DocTree
        v-for="child in node.children"
        :key="child.key"
        :node="child"
        :active-key="activeKey"
        @open="emit('open', $event)"
      />
    </div>
  </div>
</template>

