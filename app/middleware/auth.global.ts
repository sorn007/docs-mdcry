export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/public/')) return
  if (to.path === '/login') return

  const auth = useAuth()
  if (!auth.loaded.value) {
    await auth.refresh()
  }
  if (!auth.user.value) {
    return navigateTo('/login')
  }
})

