/**
 * Browser API base. Default `/ra-api` is rewritten to the real backend (next.config.mjs)
 * so HttpOnly auth cookies are first-party on the app domain (required for proxy + dashboard).
 *
 * Local dev: NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
 *
 * If NEXT_PUBLIC_API_URL is set to the same host as the deployed backend, we ignore it and
 * use `/ra-api` anyway — otherwise cookies stay on the API host and GET /dashboard (front)
 * has no access_token (proxy redirects to /login).
 */
const BACKEND_PUBLIC_ORIGIN = (
  process.env.NEXT_PUBLIC_BACKEND_PUBLIC_ORIGIN ||
  "https://recruitassistant-back-1.onrender.com"
).replace(/\/+$/, "")

function resolveApiBaseUrl(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "")
  if (!fromEnv) {
    return "/ra-api"
  }
  // Render/common mistake: point NEXT_PUBLIC_API_URL at API host → breaks same-site cookies
  if (fromEnv === BACKEND_PUBLIC_ORIGIN) {
    return "/ra-api"
  }
  return fromEnv
}

const rawApiBaseUrl = resolveApiBaseUrl()

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "") || "/ra-api"

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
