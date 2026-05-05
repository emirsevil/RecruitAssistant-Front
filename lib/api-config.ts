/**
 * Browser API calls must use getApiBaseUrl() / apiUrl() so deployed sites always hit `/ra-api`
 * (first-party cookies). Never rely on a build-inlined absolute backend URL in the client.
 *
 * Local dev (localhost / 127.0.0.1): uses NEXT_PUBLIC_API_URL or defaults from resolveServerApiBase.
 *
 * Opt out of production proxy (not recommended): NEXT_PUBLIC_API_USE_DIRECT=true
 */
const BACKEND_PUBLIC_ORIGIN = (
  process.env.NEXT_PUBLIC_BACKEND_PUBLIC_ORIGIN ||
  "https://recruitassistant-back-1.onrender.com"
).replace(/\/+$/, "")

function isLocalApiHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h.endsWith(".local")
}

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

/** Node / build-time base (SSR, WS derivation). No `window`. */
function resolveServerApiBase(): string {
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
        /* ignore */
      }
    }
  }

  if (shouldForceSameOriginProxy(fromEnv)) {
    return "/ra-api"
  }

  return fromEnv
}

/**
 * Call this when building fetch URLs in the browser. Forces `/ra-api` on any non-local host
 * so mis-built chunks cannot point at recruitassistant-back-*.onrender.com.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined" && !isLocalApiHost(window.location.hostname)) {
    return "/ra-api"
  }
  return resolveServerApiBase()
}

export function apiUrl(path: string) {
  const base = getApiBaseUrl()
  const p = path.startsWith("/") ? path : `/${path}`
  return `${base}${p}`
}

const wsHttpBase = resolveServerApiBase()

export const WS_BASE_URL = (() => {
  const override = process.env.NEXT_PUBLIC_WS_URL?.replace(/\/+$/, "")
  if (override) return override
  if (wsHttpBase.startsWith("https://")) {
    return wsHttpBase.replace(/^https:\/\//, "wss://")
  }
  if (wsHttpBase.startsWith("http://")) {
    return wsHttpBase.replace(/^http:\/\//, "ws://")
  }
  return BACKEND_PUBLIC_ORIGIN.replace(/^https:\/\//, "wss://")
})()

export const LIVEAVATAR_ENABLED = process.env.NEXT_PUBLIC_ENABLE_LIVEAVATAR === "true"

export function wsUrl(path: string) {
  return `${WS_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
}
