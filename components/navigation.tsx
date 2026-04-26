"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  MessageSquare,
  FileQuestion,
  FileText,
  BarChart3,
  LogOut,
  Settings,
  User,
  Calendar,
  Globe,
  Check,
  ClipboardList,
  Moon,
  Sun,
  ChevronsUpDown,
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useWorkspace } from "@/lib/workspace-context"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

const navItems = [
  { href: "/dashboard", label: "dashboard", icon: LayoutDashboard },
  { href: "/mock-interview", label: "mockInterview", icon: MessageSquare },
  { href: "/quizzes", label: "quizzes", icon: FileQuestion },
  { href: "/cv-studio", label: "cvStudio", icon: FileText },
  { href: "/schedule", label: "schedule", icon: Calendar },
  { href: "/interview-history", label: "interviewHistory", icon: ClipboardList },
  { href: "/analytics", label: "analytics", icon: BarChart3 },
] as const

export function Navigation() {
  const pathname = usePathname()
  const { t, language, setLanguage } = useLanguage()
  const { user, logout } = useAuth()
  const { activeWorkspace } = useWorkspace()

  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    if (typeof document !== "undefined") {
      setIsDark(document.documentElement.classList.contains("dark"))
    }
  }, [])
  const toggleDark = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle("dark", next)
    try {
      localStorage.setItem("ra-theme", next ? "dark" : "light")
    } catch {}
  }
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ra-theme")
      if (saved === "dark") {
        document.documentElement.classList.add("dark")
        setIsDark(true)
      }
    } catch {}
  }, [])

  // Hide on auth/landing/onboarding
  if (
    pathname === "/" ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/reset-password") ||
    pathname?.startsWith("/onboarding")
  ) {
    return null
  }

  const initials = (user?.full_name || user?.email || "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <aside
      className="hidden lg:flex sticky top-0 h-screen w-[232px] flex-shrink-0 flex-col gap-1 border-r border-border bg-sidebar px-3.5 py-5"
    >
      {/* Logo */}
      <Link href="/dashboard" className="mb-4 flex items-center gap-2.5 px-2 py-1.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-serif text-sm font-semibold text-primary-foreground">
          R
        </span>
        <span className="font-serif text-[17px] tracking-tight">
          Recruit<span className="italic">Assistant</span>
        </span>
      </Link>

      {/* Workspace card */}
      {activeWorkspace && (
        <div className="mb-3.5 rounded-xl border border-border bg-card px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle">
            {language === "tr" ? "Aktif çalışma alanı" : "Active workspace"}
          </p>
          <p className="mt-0.5 truncate text-[13px] font-semibold leading-tight">
            {activeWorkspace.name}
          </p>
          {activeWorkspace.jobName && (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {activeWorkspace.jobName}
            </p>
          )}
        </div>
      )}

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {t(item.label)}
            </Link>
          )
        })}
      </nav>

      <div className="flex-1" />

      {/* Bottom: theme + lang + user */}
      <div className="flex items-center gap-1 px-1 pb-2">
        <button
          type="button"
          aria-label="Toggle theme"
          onClick={toggleDark}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Switch language"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Globe className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top">
            <DropdownMenuItem onClick={() => setLanguage("en")}>
              <span className="flex items-center gap-2">
                {language === "en" && <Check className="h-3.5 w-3.5" />}
                <span className={language !== "en" ? "pl-5" : ""}>English</span>
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage("tr")}>
              <span className="flex items-center gap-2">
                {language === "tr" && <Check className="h-3.5 w-3.5" />}
                <span className={language !== "tr" ? "pl-5" : ""}>Türkçe</span>
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* User chip */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-2.5 py-2 text-left transition-colors hover:bg-secondary/50">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-clay-soft text-[11px] font-semibold text-clay">
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-semibold leading-tight">
              {user?.full_name || t("welcome")}
            </span>
            <span className="block truncate text-[10px] text-subtle">{user?.email || ""}</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 flex-shrink-0 text-subtle" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-56">
          <DropdownMenuLabel>
            <p className="text-sm font-medium">{user?.full_name || t("welcome")}</p>
            <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex w-full items-center">
              <User className="mr-2 h-4 w-4" />
              {t("profile")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex w-full items-center">
              <Settings className="mr-2 h-4 w-4" />
              {t("settings")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => logout()}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t("logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </aside>
  )
}
