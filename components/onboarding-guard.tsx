"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useWorkspace } from "@/lib/workspace-context"

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth()
  const { workspaces, isHydrated } = useWorkspace()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Wait for auth and workspace state to be ready
    if (authLoading || !isHydrated) return

    const isAuthPublicPage = ["/login", "/register", "/forgot-password", "/reset-password"].some((p) =>
      pathname.startsWith(p),
    )
    if (isAuthPublicPage) return

    if (!user) {
      if (pathname === "/") return // Home page is public-ish
      // Onboarding: do not redirect to login on transient null (refresh / hydration).
      // Unauthenticated users still hit API errors on submit; real guests rarely land here.
      if (pathname.startsWith("/onboarding")) return
      router.push("/login")
      return
    }

    // User is logged in
    const hasWorkspaces = workspaces.length > 0
    const isOnboarding = pathname.startsWith("/onboarding")

    if (!hasWorkspaces && !isOnboarding) {
      // No workspaces -> Force onboarding
      router.push("/onboarding")
    } else if (hasWorkspaces && isOnboarding) {
      // Full navigation so proxy sees session cookies (same as post-login flow)
      window.location.href = "/dashboard"
    }
  }, [user, workspaces, authLoading, isHydrated, pathname, router])

  // Optional: prevent flickering by hiding content during redirect
  // But usually layout.tsx children should render
  return <>{children}</>
}
