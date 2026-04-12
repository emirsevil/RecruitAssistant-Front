import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// ─── Configuration ──────────────────────────────────────────────────

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/reset-password"]
const AUTH_COOKIE_NAME = "access_token"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(AUTH_COOKIE_NAME)

  // Normalize pathname to ensure "/" works correctly
  const path = pathname === "" ? "/" : pathname

  // 1. Exclude static assets and internal Next.js paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    path === route || path === route + "/"
  )
  const isAuthenticated = !!token

  // 1. Root and public routes should ALWAYS be accessible to guests
  if (!isAuthenticated && isPublicRoute) {
    return NextResponse.next()
  }

  // 2. Scenario: User is NOT authenticated and tries to access a protected route
  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // 3. Scenario: User IS authenticated and tries to access login/register/root
  if (isAuthenticated && (path === "/login" || path === "/register" || path === "/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

// 4. Optimization: Only run middleware on specific paths if needed, 
// but here we catch everything and filter in the logic for better robustness.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
