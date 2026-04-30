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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Plus,
  Pencil,
  Trash2,
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useWorkspace, type Workspace } from "@/lib/workspace-context"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Logo } from "@/components/logo"
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
  const { activeWorkspace, workspaces, setActiveWorkspace, deleteWorkspace, renameWorkspace } = useWorkspace()
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)
  const [newName, setNewName] = useState("")

  useEffect(() => { setMounted(true) }, [])

  const handleWorkspaceSelect = (workspace: Workspace) => {
    setActiveWorkspace(workspace)
    setWorkspaceMenuOpen(false)
  }

  const handleDelete = async () => {
    if (editingWorkspace) {
      try {
        await deleteWorkspace(editingWorkspace.id)
        setEditingWorkspace(null)
        setDeleteDialogOpen(false)
        toast({
          title: language === "tr" ? "Başarılı" : "Success",
          description: language === "tr" ? "Çalışma alanı silindi." : "Workspace deleted.",
        })
      } catch (error) {
        toast({
          variant: "destructive",
          title: language === "tr" ? "Hata" : "Error",
          description: language === "tr" ? "Çalışma alanı silinirken bir hata oluştu." : "Failed to delete workspace.",
        })
      }
    }
  }

  const handleRename = async () => {
    if (editingWorkspace && newName.trim()) {
      try {
        await renameWorkspace(editingWorkspace.id, newName.trim())
        setEditingWorkspace(null)
        setEditDialogOpen(false)
        toast({
          title: language === "tr" ? "Başarılı" : "Success",
          description: language === "tr" ? "Çalışma alanı güncellendi." : "Workspace updated.",
        })
      } catch (error) {
        toast({
          variant: "destructive",
          title: language === "tr" ? "Hata" : "Error",
          description: language === "tr" ? "Çalışma alanı güncellenirken bir hata oluştu." : "Failed to update workspace.",
        })
      }
    }
  }

  const openDeleteDialog = (e: React.MouseEvent, workspace: Workspace) => {
    e.stopPropagation()
    setEditingWorkspace(workspace)
    setDeleteDialogOpen(true)
    setWorkspaceMenuOpen(false)
  }

  const openEditDialog = (e: React.MouseEvent, workspace: Workspace) => {
    e.stopPropagation()
    setEditingWorkspace(workspace)
    setNewName(workspace.name)
    setEditDialogOpen(true)
    setWorkspaceMenuOpen(false)
  }

  const [isDark, setIsDark] = useState(false)
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
        return
      }
      if (saved === "light") {
        document.documentElement.classList.remove("dark")
        setIsDark(false)
        return
      }
    } catch {}

    if (typeof document !== "undefined") {
      const currentDark = document.documentElement.classList.contains("dark")
      setIsDark(currentDark)
    }
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
        <Logo size={30} />
      </Link>

      {/* Workspace switcher */}
      {!mounted ? (
        /* SSR placeholder — matches both server and initial client render */
        <div className="mb-3.5 flex w-full items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle">
              {language === "tr" ? "Aktif çalışma alanı" : "Active workspace"}
            </p>
            <p className="mt-0.5 truncate text-[13px] font-semibold leading-tight">&nbsp;</p>
          </div>
        </div>
      ) : activeWorkspace ? (
        <Popover open={workspaceMenuOpen} onOpenChange={setWorkspaceMenuOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="mb-3.5 flex w-full items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-secondary/50"
            >
              <div className="min-w-0 flex-1">
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
              <ChevronsUpDown className="h-3.5 w-3.5 flex-shrink-0 text-subtle" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" side="right" sideOffset={8} className="w-64 p-0">
            <div className="border-b border-border px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {language === "tr" ? "Çalışma alanları" : "Workspaces"}
              </p>
            </div>
            <div className="max-h-[280px] overflow-y-auto p-1.5">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  onClick={() => handleWorkspaceSelect(ws)}
                  className={cn(
                    "group flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors",
                    ws.id === activeWorkspace.id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-sm text-white shadow-sm",
                      ws.color
                    )}
                  >
                    {ws.emoji}
                  </div>
                  <span className="flex-1 truncate font-medium">{ws.name}</span>
                  {ws.id === activeWorkspace.id && (
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                  )}

                  <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => openEditDialog(e, ws)}
                      className="p-1 rounded hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
                      title={t("editWorkspaceTitle")}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    {workspaces.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => openDeleteDialog(e, ws)}
                        aria-label={t("deleteWorkspace")}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border p-1.5">
              <Link
                href="/workspace/new"
                onClick={() => setWorkspaceMenuOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
              >
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-dashed border-border">
                  <Plus className="h-4 w-4" />
                </div>
                {t("createWorkspace")}
              </Link>
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <Link
          href="/workspace/new"
          className="mb-3.5 flex items-center gap-2 rounded-xl border border-dashed border-border bg-card px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          {t("createWorkspace")}
        </Link>
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
          {mounted && (isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
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
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-clay-soft text-[11px] font-semibold text-clay" suppressHydrationWarning>
            {mounted ? initials : ""}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-semibold leading-tight" suppressHydrationWarning>
              {mounted ? (user?.full_name || t("welcome")) : "\u00A0"}
            </span>
            <span className="block truncate text-[10px] text-subtle" suppressHydrationWarning>{mounted ? (user?.email || "") : "\u00A0"}</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 flex-shrink-0 text-subtle" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-56">
          <DropdownMenuLabel>
            <p className="text-sm font-medium" suppressHydrationWarning>{mounted ? (user?.full_name || t("welcome")) : "\u00A0"}</p>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>{mounted ? (user?.email || "") : "\u00A0"}</p>
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteWorkspace")}</DialogTitle>
            <DialogDescription>
              {language === "tr"
                ? `"${editingWorkspace?.name}" çalışma alanını silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz silinir.`
                : `Are you sure you want to delete the workspace "${editingWorkspace?.name}"? This action cannot be undone and all associated data will be removed.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("editWorkspaceTitle")}</DialogTitle>
            <DialogDescription>
              {language === "tr" ? "Çalışma alanı adını değiştirin." : "Rename your workspace."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="workspace-name" className="sr-only">
              {language === "tr" ? "Çalışma Alanı Adı" : "Workspace Name"}
            </Label>
            <Input
              id="workspace-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={language === "tr" ? "Çalışma Alanı Adı" : "Workspace Name"}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleRename()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim()}>
              {t("Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
