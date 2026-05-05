/**
 * Browser API base. Default `/ra-api` is rewritten to the real backend (next.config.mjs)
 * so HttpOnly auth cookies are first-party on the app domain (required for proxy + dashboard).
 *
 * Local dev: NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
 *
 * Production: any remote `http(s)://…` API URL is forced to `/ra-api` unless
 * `NEXT_PUBLIC_API_USE_DIRECT=true` (cookies never work reliably on cross-site fetch to API host).
 */
const BACKEND_PUBLIC_ORIGIN = (
  process.env.NEXT_PUBLIC_BACKEND_PUBLIC_ORIGIN ||
  "https://recruitassistant-back-1.onrender.com"
).replace(/\/+$/, "")

function isLocalApiHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h.endsWith(".local")
}

/** Same hostname as configured backend (any path / casing). */
function shouldForceSameOriginProxy(fromEnv: string): boolean {
  const trimmed = fromEnv.trim().replace(/\/+$/, "")
  if (!trimmed || trimmed === "/ra-api" || trimmed.startsWith("/ra-api/")) return false
  const candidateUrl = trimmed.includes("://") ? trimmed : `https://${trimmed}`
  if (!/^https?:\/\//i.test(candidateUrl)) return false
  try {
    const a = new URL(candidateUrl)
    const b = new URL(BACKEND_PUBLIC_ORIGIN)
    return a.hostname.toLowerCase() === b.hostname.toLowerCase()
  } catch {
    return false
  }
}

function resolveApiBaseUrl(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "")
  if (!fromEnv || fromEnv === "/ra-api" || fromEnv.startsWith("/ra-api/")) {
    return "/ra-api"
  }

  const isProd = process.env.NODE_ENV === "production"
  const allowDirectRemote = process.env.NEXT_PUBLIC_API_USE_DIRECT === "true"

  if (isProd && !allowDirectRemote) {
    const withScheme = fromEnv.includes("://") ? fromEnv : `https://${fromEnv}`
    if (/^https?:\/\//i.test(withScheme)) {
      try {
        const { hostname } = new URL(withScheme)
        if (!isLocalApiHost(hostname)) {
          return "/ra-api"
        }
      } catch {
        /* fall through */
      }
    }
  }

  if (shouldForceSameOriginProxy(fromEnv)) {
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
  return `${API_BASE_URL}${p}`
}

export function wsUrl(path: string) {
  return `${WS_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
}
