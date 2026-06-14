"use client"

import { usePathname } from "next/navigation"
import { Navigation } from "@/components/navigation"
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
          "min-w-0 flex-1",
          !isPublicPage && "pt-14 lg:pt-0 lg:pl-[232px]"
        )}
      >
        {children}
      </main>
    </div>
  )
}
