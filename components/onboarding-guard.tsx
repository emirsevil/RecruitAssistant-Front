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

    const isPublicPage = ["/login", "/register", "/forgot-password", "/reset-password"].some(p => pathname.startsWith(p))
    if (isPublicPage) return

    if (!user) {
      if (pathname === "/") return // Home page is public-ish
      router.push("/login")
      return
    }

    // User is logged in
    const hasWorkspaces = workspaces.length > 0
    const isOnboarding = pathname === "/onboarding"

    if (!hasWorkspaces && !isOnboarding) {
      // No workspaces -> Force onboarding
      router.push("/onboarding")
    } else if (hasWorkspaces && isOnboarding) {
      // Already has workspaces -> Prevent onboarding
      router.push("/dashboard")
    }
  }, [user, workspaces, authLoading, isHydrated, pathname, router])

  // Optional: prevent flickering by hiding content during redirect
  // But usually layout.tsx children should render
  return <>{children}</>
}
