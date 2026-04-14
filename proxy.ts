import { NextResponse } from "next/server"

/**
 * Edge proxy: do not gate on `access_token` — that cookie is set on the API host only,
 * so checking it here always fails and forces /dashboard → /login (307). Auth runs client-side.
 */
export function proxy() {
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
