const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "")

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
  return API_BASE_URL
})()

export const LIVEAVATAR_ENABLED = process.env.NEXT_PUBLIC_ENABLE_LIVEAVATAR === "true"

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

export function wsUrl(path: string) {
  return `${WS_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
}
