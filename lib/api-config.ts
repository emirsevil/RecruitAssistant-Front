/** Default backend when not using a custom env (WebSocket must target real host). */
const DEFAULT_BACKEND_ORIGIN = "https://recruitassistant-back-eo8n.onrender.com"

/**
 * HTTP API base for browser `fetch`.
 * Default `/backend` is rewritten by Next.js to `BACKEND_URL` (same-origin, avoids CORS).
 * Set `NEXT_PUBLIC_API_URL` to a full URL (e.g. `http://localhost:8000`) to call the backend directly.
 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "/backend").replace(/\/$/, "")

/**
 * Real backend origin for WebSockets (cannot be proxied by standard Next rewrites).
 * Falls back to `DEFAULT_BACKEND_ORIGIN` when using `/backend` proxy for HTTP.
 */
export function getBackendOriginForWebSocket(): string {
  const ws = process.env.NEXT_PUBLIC_WS_ORIGIN?.replace(/\/$/, "")
  if (ws) return ws
  const api = process.env.NEXT_PUBLIC_API_URL || ""
  if (api.startsWith("http")) return api.replace(/\/$/, "")
  const fromEnv = process.env.NEXT_PUBLIC_BACKEND_ORIGIN?.replace(/\/$/, "")
  if (fromEnv) return fromEnv
  return DEFAULT_BACKEND_ORIGIN
}

export function getVoiceInterviewWebSocketUrl(ticket: string): string {
  const origin = getBackendOriginForWebSocket()
  const u = new URL(origin)
  u.protocol = u.protocol === "https:" ? "wss:" : "ws:"
  u.pathname = "/ws/voice-interview"
  u.search = ticket ? `ticket=${encodeURIComponent(ticket)}` : ""
  return u.toString()
}
