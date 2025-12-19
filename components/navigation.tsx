"use client"

import Link from "next/link"
import { useState } from "react"
import { useTranslation } from "react-i18next"
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
} from "lucide-react"


export function Navigation() {
  const { t, i18n } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    { href: "/dashboard", label: t('navigation.dashboard'), icon: LayoutDashboard },
    { href: "/mock-interview", label: t('navigation.mockInterview'), icon: MessageSquare },
    { href: "/quizzes", label: t('navigation.quizzes'), icon: FileQuestion },
    { href: "/cv-studio", label: t('navigation.cvStudio'), icon: FileText },
    { href: "/analytics", label: t('navigation.analytics'), icon: BarChart3 },
  ]

  return (
    <>
      {/* Desktop/Mobile Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-6">
            {/* Mobile menu button */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <MobileNav onClose={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-lg font-bold">R</span>
              </div>
              <span className="hidden text-lg font-semibold sm:inline-block">RecruitAssistant</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex lg:gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button variant="ghost" className="gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <span className="sr-only">Toggle language</span>
                  <span className="text-sm font-medium">{i18n.language === 'tr' ? 'TR' : 'EN'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => i18n.changeLanguage('tr')}>
                  Türkçe
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => i18n.changeLanguage('en')}>
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/diverse-user-avatars.png" alt="User" />
                    <AvatarFallback>DN</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">Deniz</p>
                    <p className="text-xs text-muted-foreground">deniz@example.com</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  {t('navigation.profile')}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  {t('navigation.settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('navigation.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-16 flex-col border-r border-border bg-background lg:flex">
        <div className="flex h-16 items-center justify-center border-b border-border">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          >
            <span className="text-lg font-bold">R</span>
          </Link>
        </div>
        <nav className="flex flex-1 flex-col items-center gap-2 py-4">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button variant="ghost" size="icon" className="h-12 w-12" title={item.label}>
                <item.icon className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
              </Button>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}

function MobileNav({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const navItems = [
    { href: "/dashboard", label: t('navigation.dashboard'), icon: LayoutDashboard },
    { href: "/mock-interview", label: t('navigation.mockInterview'), icon: MessageSquare },
    { href: "/quizzes", label: t('navigation.quizzes'), icon: FileQuestion },
    { href: "/cv-studio", label: t('navigation.cvStudio'), icon: FileText },
    { href: "/analytics", label: t('navigation.analytics'), icon: BarChart3 },
  ]
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span className="text-lg font-bold">R</span>
        </div>
        <span className="text-lg font-semibold">RecruitAssistant</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} onClick={onClose}>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <item.icon className="h-5 w-5" />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>
      <div className="border-t border-border p-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={i18n.language === 'tr' ? 'default' : 'outline'}
            size="sm"
            onClick={() => i18n.changeLanguage('tr')}
          >
            Türkçe
          </Button>
          <Button
            variant={i18n.language === 'en' ? 'default' : 'outline'}
            size="sm"
            onClick={() => i18n.changeLanguage('en')}
          >
            English
          </Button>
        </div>
      </div>
    </div>
  )
}
