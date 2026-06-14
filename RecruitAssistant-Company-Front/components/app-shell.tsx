"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Search, Briefcase, LogOut, Building2 } from "lucide-react"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/talent", label: "Talent Search", icon: Search },
  { href: "/jobs", label: "Job Openings", icon: Briefcase },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const { recruiter, isLoading, logout } = useAuth()
  const pathname = usePathname()

  // Don't show shell on public pages
  if (!recruiter || isLoading) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-border bg-card">
        {/* Logo / Brand */}
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Talent Hunter</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom — Company info + Logout */}
        <div className="border-t border-border p-3">
          <div className="mb-2 px-3 py-1.5">
            <p className="text-xs font-medium truncate">{recruiter.full_name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{recruiter.company.name}</p>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
