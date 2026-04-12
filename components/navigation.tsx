"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  MessageSquare,
  FileQuestion,
  FileText,
  BarChart3,
  Menu,
  LogOut,
  Settings,
  User,
  Calendar,
  Globe,
  Check,
  ClipboardList,
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { WorkspaceSelector } from "@/components/workspace-selector"
import { useWorkspace } from "@/lib/workspace-context"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "dashboard", icon: LayoutDashboard },
  { href: "/mock-interview", label: "mockInterview", icon: MessageSquare },
  { href: "/interview-history", label: "interviewHistory", icon: ClipboardList },
  { href: "/quizzes", label: "quizzes", icon: FileQuestion },
  { href: "/cv-studio", label: "cvStudio", icon: FileText },
  { href: "/schedule", label: "schedule", icon: Calendar },
  { href: "/analytics", label: "analytics", icon: BarChart3 },
]

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { t, language, setLanguage } = useLanguage()
  const { user, logout } = useAuth()
  const pathname = usePathname()

  // Hide navigation on auth pages, onboarding, and the landing page
  if (pathname === "/" ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/reset-password")) {
    return null
  }

  return (
    <>
      {/* Desktop/Mobile Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="page-shell flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <MobileNav onClose={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-sm font-bold">R</span>
              </div>
              <span className="hidden text-sm font-semibold sm:inline-block">RecruitAssistant</span>
            </Link>

            {/* Separator */}
            <div className="hidden h-5 w-px bg-border sm:block" />

            {/* Workspace Selector */}
            <WorkspaceSelector />

            {/* Desktop Navigation - hidden on mobile, shown on lg+ */}
            <nav className="hidden lg:flex lg:gap-0.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "gap-1.5 h-8 px-2.5 text-xs font-medium",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {t(item.label)}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-1">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Globe className="h-3.5 w-3.5" />
                  <span className="sr-only">Switch language</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage("en")}>
                  <span className="flex items-center gap-2">
                    {language === "en" && <Check className="h-4 w-4" />}
                    <span className={language !== "en" ? "pl-6" : ""}>English</span>
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("tr")}>
                  <span className="flex items-center gap-2">
                    {language === "tr" && <Check className="h-4 w-4" />}
                    <span className={language !== "tr" ? "pl-6" : ""}>Türkçe</span>
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src="/diverse-user-avatars.png" alt="User" />
                    <AvatarFallback className="text-xs">DN</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{user?.full_name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email || "user@example.com"}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/profile" className="flex w-full items-center">
                    <User className="mr-2 h-4 w-4" />
                    {t("profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings" className="flex w-full items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    {t("settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  )
}

function MobileNav({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage()
  const { activeWorkspace } = useWorkspace()
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      {/* Mobile header with workspace info */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span className="text-sm font-bold">R</span>
        </div>
        <span className="text-sm font-semibold">RecruitAssistant</span>
      </div>

      {/* Active workspace indicator */}
      {activeWorkspace && (
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm shadow-sm text-white",
              activeWorkspace.color
            )}
          >
            {activeWorkspace.emoji}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{activeWorkspace.name}</span>
            <span className="text-xs text-muted-foreground">{t("currentWorkspace")}</span>
          </div>
        </div>
      )}

      {/* Navigation items */}
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href} onClick={onClose}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-9",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {t(item.label)}
              </Button>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
