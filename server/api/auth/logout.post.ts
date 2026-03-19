import { logout } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await logout(event)
  return { ok: true }
})

