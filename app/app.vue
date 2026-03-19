<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'mdcry'
const description = 'Private Markdown portal'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterCard: 'summary_large_image'
})

const route = useRoute()
const auth = useAuth()

const showShell = computed(() => route.path !== '/login' && !route.path.startsWith('/public/'))

async function handleLogout() {
  await auth.logout()
  await navigateTo('/login')
}
</script>

<template>
  <UApp>
    <UHeader v-if="showShell">
      <template #left>
        <NuxtLink to="/">
          <AppLogo class="w-auto h-6 shrink-0" />
        </NuxtLink>
        <UButton to="/" variant="ghost" color="neutral" size="sm">Docs</UButton>
        <UButton to="/admin" variant="ghost" color="neutral" size="sm">Admin</UButton>
      </template>

      <template #right>
        <UColorModeButton />
        <UButton
          color="neutral"
          variant="soft"
          size="sm"
          @click="handleLogout"
        >
          Logout
        </UButton>
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <UFooter v-if="showShell">
      <template #left>
        <p class="text-sm text-muted">
          © {{ new Date().getFullYear() }} mdcry
        </p>
      </template>
    </UFooter>
  </UApp>
</template>
