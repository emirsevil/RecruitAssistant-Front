import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND_ORIGIN = (
  process.env.BACKEND_PROXY_URL || "https://recruitassistant-back-1.onrender.com"
).replace(/\/$/, "")

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
])

const RA_API_PREFIX = "/ra-api"

/** Path under /ra-api as sent by Next (trailing slash often stripped). */
function backendPathnameFromRequest(req: NextRequest): string {
  const p = req.nextUrl.pathname
  if (!p.startsWith(RA_API_PREFIX)) return "/"
  let rest = p.slice(RA_API_PREFIX.length)
  if (!rest) rest = "/"
  else if (!rest.startsWith("/")) rest = `/${rest}`
  return rest
}

/**
 * Next strips `/ra-api/foo/` → `/ra-api/foo`. Some FastAPI routers register only `GET /foo/`; a 307 chain
 * plus Node fetch redirect-follow can drop cookies → 401.
 * Do NOT add `/schedule/events`: backend routes are `/schedule/events` (no trailing slash); forcing `/events/`
 * triggers a redirect back and can strip auth on POST.
 */
const FASTAPI_SLASH_COLLECTION = new Set(["/workspaces", "/interviews"])

function coerceFastApiCollectionSlashes(pathname: string): string {
  if (FASTAPI_SLASH_COLLECTION.has(pathname)) return `${pathname}/`
  return pathname
}

/**
 * Server-side BFF proxy: browser only talks to the app origin. Cookies stay first-party.
 * Uses redirect: "follow" so upstream redirects stay on the server and never
 * rewrite the browser to recruitassistant-back-*.onrender.com (which would drop cookies).
 */
async function proxy(req: NextRequest, _ctx: { params: Promise<{ path?: string[] }> }) {
  const pathname = coerceFastApiCollectionSlashes(backendPathnameFromRequest(req))
  const target = new URL(`${pathname}${req.nextUrl.search}`, `${BACKEND_ORIGIN}/`)

  const forward = new Headers()
  req.headers.forEach((value, key) => {
    const k = key.toLowerCase()
    if (k === "host") return
    if (k === "cookie") return // rebuilt below — some runtimes omit raw Cookie on the header bag
    if (HOP_BY_HOP.has(k)) return
    forward.set(key, value)
  })

  const rawCookie = req.headers.get("cookie")
  const fromJar =
    typeof req.cookies?.getAll === "function"
      ? req.cookies.getAll().map((c) => `${c.name}=${c.value}`).join("; ")
      : ""
  const cookieHeader = rawCookie?.length ? rawCookie : fromJar
  if (cookieHeader) forward.set("Cookie", cookieHeader)

  const init: RequestInit = {
    method: req.method,
    headers: forward,
    redirect: "follow",
    cache: "no-store",
  }

  if (!["GET", "HEAD"].includes(req.method)) {
    init.body = await req.arrayBuffer()
    forward.delete("content-length")
  }

  const upstream = await fetch(target.toString(), init)

  const isHead = req.method === "HEAD"

  // Buffer as raw bytes so PDFs and other binaries are not corrupted by UTF-8 text decoding.
  const bodyOut = isHead ? null : await upstream.arrayBuffer()

  const res = new NextResponse(isHead ? null : bodyOut, {
    status: upstream.status,
    statusText: upstream.statusText,
  })

  const raw = upstream.headers as Headers & { getSetCookie?: () => string[] }
  const cookieList = typeof raw.getSetCookie === "function" ? raw.getSetCookie() : []
  for (const c of cookieList) {
    res.headers.append("set-cookie", c)
  }

  const SKIP_RESPONSE = new Set([
    ...HOP_BY_HOP,
    "set-cookie",
    "content-encoding",
  ])

  if (!isHead) {
    SKIP_RESPONSE.add("content-length")
  }

  upstream.headers.forEach((value, key) => {
    const k = key.toLowerCase()
    if (SKIP_RESPONSE.has(k)) return
    res.headers.set(key, value)
  })

  return res
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
export const OPTIONS = proxy
export const HEAD = proxy
