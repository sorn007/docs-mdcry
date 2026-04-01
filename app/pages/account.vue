<script setup lang="ts">
const auth = useAuth()
const toast = useToast()

const state = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const busy = ref(false)

async function onSubmit() {
  busy.value = true
  try {
    await $fetch('/api/auth/password', {
      method: 'POST',
      body: {
        currentPassword: state.currentPassword,
        newPassword: state.newPassword,
        confirmPassword: state.confirmPassword
      }
    })
    state.currentPassword = ''
    state.newPassword = ''
    state.confirmPassword = ''
    toast.add({ title: 'Password updated', color: 'success' })
  } catch (e: any) {
    const msg = e?.data?.statusMessage || e?.statusMessage || 'Could not update password'
    toast.add({ title: msg, color: 'error' })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-lg p-6 space-y-8">
    <div>
      <h1 class="text-2xl font-semibold">
        Account
      </h1>
      <p class="text-sm text-muted mt-1">
        Manage your login details
      </p>
    </div>

    <UCard>
      <template #header>
        <span class="font-medium">Profile</span>
      </template>
      <div class="space-y-1 text-sm">
        <div>
          <span class="text-muted">Username</span>
          <div class="font-medium">
            {{ auth.user?.username ?? '—' }}
          </div>
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <span class="font-medium">Change password</span>
      </template>

      <UForm :state="state" class="space-y-4" @submit.prevent="onSubmit">
        <UFormField label="Current password" name="currentPassword">
          <UInput
            v-model="state.currentPassword"
            type="password"
            autocomplete="current-password"
          />
        </UFormField>

        <UFormField label="New password" name="newPassword" hint="At least 8 characters">
          <UInput
            v-model="state.newPassword"
            type="password"
            autocomplete="new-password"
          />
        </UFormField>

        <UFormField label="Confirm new password" name="confirmPassword">
          <UInput
            v-model="state.confirmPassword"
            type="password"
            autocomplete="new-password"
          />
        </UFormField>

        <div class="flex justify-end">
          <UButton type="submit" color="primary" :loading="busy">
            Update password
          </UButton>
        </div>
      </UForm>
    </UCard>
  </div>
</template>
