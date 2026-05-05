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

/**
 * Server-side BFF proxy: browser only talks to the app origin. Cookies stay first-party.
 * Uses redirect: "follow" so FastAPI/Starlette slash redirects stay on the server and never
 * rewrite the browser to recruitassistant-back-*.onrender.com (which would drop cookies).
 */
async function proxy(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path: segments } = await ctx.params
  const subpath = segments?.join("/") ?? ""
  const pathname = subpath ? `/${subpath}` : "/"
  const target = new URL(`${pathname}${req.nextUrl.search}`, `${BACKEND_ORIGIN}/`)

  const forward = new Headers()
  req.headers.forEach((value, key) => {
    const k = key.toLowerCase()
    if (k === "host") return
    if (HOP_BY_HOP.has(k)) return
    forward.set(key, value)
  })

  const init: RequestInit = {
    method: req.method,
    headers: forward,
    redirect: "follow",
    cache: "no-store",
  }

  if (!["GET", "HEAD"].includes(req.method)) {
    init.body = await req.arrayBuffer()
  }

  const upstream = await fetch(target.toString(), init)

  const isHead = req.method === "HEAD"

  // Fully buffer before responding. Prefer text() for JSON APIs so UTF-8 decoding is explicit.
  const bodyOut = isHead
    ? null
    : await upstream.text()

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
