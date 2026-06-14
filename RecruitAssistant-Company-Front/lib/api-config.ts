const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "")

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
}
