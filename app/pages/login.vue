<script setup lang="ts">
definePageMeta({ layout: false })

const auth = useAuth()
const config = useRuntimeConfig()
const siteKey = config.public?.turnstileSiteKey || ''
const turnstileEnabled = Boolean(siteKey)

const state = reactive({
  username: '',
  password: ''
})

const error = ref<string | null>(null)
const busy = ref(false)
const turnstileToken = ref('')

declare global {
  interface Window {
    onTurnstileSuccess?: (token: string) => void
    onTurnstileExpired?: () => void
  }
}

if (import.meta.client && turnstileEnabled) {
  useHead({
    script: [
      { src: 'https://challenges.cloudflare.com/turnstile/v0/api.js', async: true, defer: true }
    ]
  })
}

onMounted(() => {
  if (!import.meta.client || !turnstileEnabled) return
  window.onTurnstileSuccess = (token: string) => {
    turnstileToken.value = token
  }
  window.onTurnstileExpired = () => {
    turnstileToken.value = ''
  }
})

async function onLogin() {
  error.value = null
  busy.value = true
  try {
    await auth.login(state.username, state.password, turnstileToken.value)
    await navigateTo('/')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.statusMessage || 'Login failed'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="min-h-dvh flex items-center justify-center p-6">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <div class="text-lg font-semibold">
              Sign in
            </div>
            <div class="text-sm text-muted">
              Private Markdown portal
            </div>
          </div>
          <UColorModeButton />
        </div>
      </template>

      <UForm :state="state" class="space-y-4" @submit.prevent="onLogin">
        <UFormField label="Username" name="username">
          <UInput v-model="state.username" autocomplete="username" />
        </UFormField>

        <UFormField label="Password" name="password">
          <UInput v-model="state.password" type="password" autocomplete="current-password" />
        </UFormField>

        <div
          v-if="turnstileEnabled"
          class="cf-turnstile"
          :data-sitekey="siteKey"
          data-callback="onTurnstileSuccess"
          data-expired-callback="onTurnstileExpired"
        />

        <UAlert v-if="error" color="error" variant="soft" :title="error" />

        <div class="flex justify-end">
          <UButton type="submit" color="primary" :loading="busy" :disabled="turnstileEnabled && !turnstileToken">
            Login
          </UButton>
        </div>
      </UForm>
    </UCard>
  </div>
</template>

