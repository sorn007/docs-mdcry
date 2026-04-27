import { onMounted, ref, watch } from 'vue'

const FOCUS_STORAGE_KEY = 'docs-mdcry-reader-focus'
const SIDEBAR_LOCK_STORAGE_KEY = 'docs-mdcry-sidebar-lock'

export function useReaderFocusLayout() {
  const isFocusMode = ref(false)
  const isSidebarLocked = ref(false)

  function readStored(key: string): boolean {
    if (!import.meta.client) return false
    try {
      return localStorage.getItem(key) === '1'
    } catch {
      return false
    }
  }

  function persist(key: string, value: boolean) {
    if (!import.meta.client) return
    try {
      localStorage.setItem(key, value ? '1' : '0')
    } catch {
      /* ignore */
    }
  }

  onMounted(() => {
    isFocusMode.value = readStored(FOCUS_STORAGE_KEY)
    isSidebarLocked.value = readStored(SIDEBAR_LOCK_STORAGE_KEY)
  })

  watch(isFocusMode, (v) => {
    persist(FOCUS_STORAGE_KEY, v)
  })

  watch(isSidebarLocked, (v) => {
    persist(SIDEBAR_LOCK_STORAGE_KEY, v)
  })

  function setFocus(on: boolean) {
    isFocusMode.value = on
  }

  function toggleFocus() {
    isFocusMode.value = !isFocusMode.value
  }

  function setSidebarLock(on: boolean) {
    isSidebarLocked.value = on
  }

  function toggleSidebarLock() {
    isSidebarLocked.value = !isSidebarLocked.value
  }

  return {
    isFocusMode,
    isSidebarLocked,
    setFocus,
    toggleFocus,
    setSidebarLock,
    toggleSidebarLock
  }
}
