"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useWorkspace } from "@/lib/workspace-context"
import { useSimulation } from "@/lib/simulation-context"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth()
  const { workspaces, isHydrated } = useWorkspace()
  const { status: simStatus, isLoading: simLoading } = useSimulation()
  const { language } = useLanguage()
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
      return
    } else if (hasWorkspaces && isOnboarding) {
      // Already has workspaces -> Prevent onboarding
      router.push("/dashboard")
      return
    }

    // Simulation gating
    if (!simLoading && simStatus) {
      const isInterviewPage = ["/quizzes", "/mock-interview", "/interview-history"].some(p => pathname.startsWith(p))
      if (isInterviewPage && !simStatus.can_access_interviews) {
        toast.error(
          language === "tr" ? "Kilitli aşama" : "Stage locked",
          { description: language === "tr" ? "Önce CV aşamanızı tamamlayın veya atlayın." : "Complete or skip the CV stage first." }
        )
        router.push("/dashboard")
      }
    }
  }, [user, workspaces, authLoading, isHydrated, pathname, router, simStatus, simLoading, language])

  // Optional: prevent flickering by hiding content during redirect
  // But usually layout.tsx children should render
  return <>{children}</>
}
