import { getRequestURL } from 'h3'
import { getClientIp, checkRateLimit } from '../utils/rateLimit'

/** Per-IP limit for all `/api/public/*` routes (token guessing, asset abuse). */
const PUBLIC_WINDOW_MS = 60 * 1000
const PUBLIC_MAX_REQUESTS = 120

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/public')) return
  const ip = getClientIp(event)
  checkRateLimit(`public:${ip}`, PUBLIC_MAX_REQUESTS, PUBLIC_WINDOW_MS)
})
