/**
 * Browser API base. Default `/ra-api` is rewritten to the real backend (next.config.mjs)
 * so HttpOnly auth cookies are first-party on the app domain (fixes cross-site cookie issues, e.g. Safari).
 *
 * For local dev against a direct backend: NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
 */
const rawApiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "/ra-api").trim()

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "") || "/ra-api"

/** Backend HTTPS origin when HTTP API is proxied — used for WebSocket (Next rewrites do not proxy WS). */
const BACKEND_PUBLIC_ORIGIN = (
  process.env.NEXT_PUBLIC_BACKEND_PUBLIC_ORIGIN ||
  "https://recruitassistant-back-1.onrender.com"
).replace(/\/+$/, "")

export const WS_BASE_URL = (() => {
  const override = process.env.NEXT_PUBLIC_WS_URL
  if (override) {
    return override.replace(/\/+$/, "")
  }

  if (API_BASE_URL.startsWith("https://")) {
    return API_BASE_URL.replace(/^https:\/\//, "wss://")
  }
  if (API_BASE_URL.startsWith("http://")) {
    return API_BASE_URL.replace(/^http:\/\//, "ws://")
  }

  return BACKEND_PUBLIC_ORIGIN.replace(/^https:\/\//, "wss://")
})()

export const LIVEAVATAR_ENABLED = process.env.NEXT_PUBLIC_ENABLE_LIVEAVATAR === "true"

export function apiUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`
  if (API_BASE_URL.startsWith("http://") || API_BASE_URL.startsWith("https://")) {
    return `${API_BASE_URL}${p}`
  }
  return `${API_BASE_URL}${p}`
}

export function wsUrl(path: string) {
  return `${WS_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
}
