type AuthUser = { id: string, username: string }

export function useAuth() {
  const user = useState<AuthUser | null>('auth.user', () => null)
  const loaded = useState<boolean>('auth.loaded', () => false)

  async function refresh() {
    const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
    const res = await $fetch<{ user: AuthUser | null }>('/api/auth/me', { headers }).catch(() => ({ user: null }))
    user.value = res.user
    loaded.value = true
    return res.user
  }

  async function login(username: string, password: string, turnstileToken?: string) {
    await $fetch('/api/auth/login', { method: 'POST', body: { username, password, turnstileToken } })
    await refresh()
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    loaded.value = true
  }

  return { user, loaded, refresh, login, logout }
}

