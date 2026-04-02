import { onMounted, ref, watch } from 'vue'

const STORAGE_KEY = 'docs-mdcry-reader-focus'

export function useReaderFocusLayout() {
  const isFocusMode = ref(false)

  function readStored(): boolean {
    if (!import.meta.client) return false
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  }

  function persist(value: boolean) {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
    } catch {
      /* ignore */
    }
  }

  onMounted(() => {
    isFocusMode.value = readStored()
  })

  watch(isFocusMode, (v) => {
    persist(v)
  })

  function setFocus(on: boolean) {
    isFocusMode.value = on
  }

  function toggleFocus() {
    isFocusMode.value = !isFocusMode.value
  }

  return { isFocusMode, setFocus, toggleFocus }
}
