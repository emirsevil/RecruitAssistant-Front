"use client"

import { usePathname } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { SimulationTopBar } from "@/components/simulation-top-bar"
import { RealInterviewPrompt } from "@/components/real-interview-prompt"
import { cn } from "@/lib/utils"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isPublicPage =
    pathname === "/" ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/reset-password") ||
    pathname?.startsWith("/onboarding")

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Navigation />
      <main
        className={cn(
          "min-w-0 flex-1 flex flex-col",
          !isPublicPage && "pt-14 lg:pt-0 lg:pl-[232px]"
        )}
      >
        {!isPublicPage && <SimulationTopBar />}
        <div className="flex-1">
          {children}
        </div>
        {!isPublicPage && <RealInterviewPrompt />}
      </main>
    </div>
  )
}
