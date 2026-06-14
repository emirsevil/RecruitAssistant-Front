"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useWorkspace, type Workspace } from "@/lib/workspace-context"
import { useLanguage } from "@/lib/language-context"
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
  ChevronsUpDown,
  Plus,
  Check,
  Pencil,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export function WorkspaceSelector() {
  const {
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    deleteWorkspace,
    renameWorkspace,
  } = useWorkspace()
  const { t } = useLanguage()
  const { toast } = useToast()

  const [open, setOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)
  const [newName, setNewName] = useState("")

  const handleSelect = (workspace: Workspace) => {
    setActiveWorkspace(workspace)
    setOpen(false)
  }

  const handleDelete = async () => {
    if (editingWorkspace) {
      try {
        await deleteWorkspace(editingWorkspace.id)
        setEditingWorkspace(null)
        setDeleteDialogOpen(false)
        toast({
          title: "Başarılı",
          description: "Çalışma alanı silindi.",
        })
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Çalışma alanı silinirken bir hata oluştu.",
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
          title: "Başarılı",
          description: "Çalışma alanı güncellendi.",
        })
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Çalışma alanı güncellenirken bir hata oluştu.",
        })
      }
    }
  }

  const openDeleteDialog = (e: React.MouseEvent, workspace: Workspace) => {
    e.stopPropagation()
    setEditingWorkspace(workspace)
    setDeleteDialogOpen(true)
    setOpen(false)
  }

  const openEditDialog = (e: React.MouseEvent, workspace: Workspace) => {
    e.stopPropagation()
    setEditingWorkspace(workspace)
    setNewName(workspace.name)
    setEditDialogOpen(true)
    setOpen(false)
  }

  // No workspace yet — link to full creation flow (same as first workspace)
  if (!activeWorkspace) {
    return (
      <Button variant="outline" size="sm" className="h-8 gap-2 border-dashed" asChild>
        <Link href="/workspace/new">
          <Plus className="h-3.5 w-3.5" />
          <span className="text-sm font-medium">{t("createWorkspace")}</span>
        </Link>
      </Button>
    )
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5",
              "hover:bg-accent/50 transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              "cursor-pointer select-none"
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm",
                activeWorkspace.color,
                "text-white shadow-sm"
              )}
            >
              {activeWorkspace.emoji}
            </div>
            <span className="hidden text-sm font-medium sm:inline-block max-w-[140px] truncate">
              {activeWorkspace.name}
            </span>
            <ChevronsUpDown className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground sm:inline-block" />
          </button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-72 p-0" sideOffset={8}>
          <div className="px-3 py-2.5 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("workspaces")}
            </p>
          </div>

          <div className="p-1.5 max-h-[280px] overflow-y-auto">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                onClick={() => handleSelect(workspace)}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-2.5 py-2 cursor-pointer transition-colors duration-100",
                  workspace.id === activeWorkspace.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm shadow-sm",
                    workspace.color,
                    "text-white"
                  )}
                >
                  {workspace.emoji}
                </div>
                <span className="flex-1 text-sm font-medium truncate">
                  {workspace.name}
                </span>

                {workspace.id === activeWorkspace.id && (
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                )}

                <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => openEditDialog(e, workspace)}
                    className="p-1 rounded hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
                    title={t("editWorkspaceTitle")}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  {workspaces.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => openDeleteDialog(e, workspace)}
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
              onClick={() => setOpen(false)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2",
                "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                "cursor-pointer transition-colors duration-100"
              )}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-dashed border-border">
                <Plus className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">{t("createWorkspace")}</span>
            </Link>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteWorkspace")}</DialogTitle>
            <DialogDescription>
              {t("deleteWorkspaceMessage").replace(
                "{{name}}",
                editingWorkspace?.name ?? ""
              )}
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
              Çalışma alanı adını değiştirin.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="workspace-name" className="sr-only">
              Çalışma Alanı Adı
            </Label>
            <Input
              id="workspace-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Çalışma Alanı Adı"
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
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
