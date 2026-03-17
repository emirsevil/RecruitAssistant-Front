"use client"

import { useState, useRef, useEffect } from "react"
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
import {
  ChevronsUpDown,
  Plus,
  Check,
  Pencil,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function WorkspaceSelector() {
  const {
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    createWorkspace,
    renameWorkspace,
    deleteWorkspace,
  } = useWorkspace()
  const { t } = useLanguage()

  const [open, setOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState("")
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)
  const [renameName, setRenameName] = useState("")

  const inputRef = useRef<HTMLInputElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (createDialogOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [createDialogOpen])

  useEffect(() => {
    if (renameDialogOpen && renameInputRef.current) {
      setTimeout(() => renameInputRef.current?.focus(), 50)
    }
  }, [renameDialogOpen])

  const handleSelect = (workspace: Workspace) => {
    setActiveWorkspace(workspace)
    setOpen(false)
  }

  const handleCreate = () => {
    if (newWorkspaceName.trim()) {
      createWorkspace(newWorkspaceName.trim())
      setNewWorkspaceName("")
      setCreateDialogOpen(false)
      setOpen(false)
    }
  }

  const handleRename = () => {
    if (editingWorkspace && renameName.trim()) {
      renameWorkspace(editingWorkspace.id, renameName.trim())
      setRenameName("")
      setEditingWorkspace(null)
      setRenameDialogOpen(false)
    }
  }

  const handleDelete = () => {
    if (editingWorkspace) {
      deleteWorkspace(editingWorkspace.id)
      setEditingWorkspace(null)
      setDeleteDialogOpen(false)
    }
  }

  const openRenameDialog = (e: React.MouseEvent, workspace: Workspace) => {
    e.stopPropagation()
    setEditingWorkspace(workspace)
    setRenameName(workspace.name)
    setRenameDialogOpen(true)
    setOpen(false)
  }

  const openDeleteDialog = (e: React.MouseEvent, workspace: Workspace) => {
    e.stopPropagation()
    setEditingWorkspace(workspace)
    setDeleteDialogOpen(true)
    setOpen(false)
  }

  // No workspace yet (e.g. during onboarding) - show placeholder
  if (!activeWorkspace) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-muted-foreground">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-dashed border-muted-foreground/40 text-xs">
          ?
        </div>
        <span className="hidden text-sm font-medium sm:inline-block">
          {t("createWorkspace")}
        </span>
      </div>
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
            {activeWorkspace ? (
              <>
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
              </>
            ) : (
              <>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-dashed border-muted-foreground/50">
                  <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="hidden text-sm font-medium text-muted-foreground sm:inline-block">
                  {t("createWorkspace")}
                </span>
                <ChevronsUpDown className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground sm:inline-block" />
              </>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-72 p-0" sideOffset={8}>
          {/* Header */}
          <div className="px-3 py-2.5 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("workspaces")}
            </p>
          </div>

          {/* Workspace list */}
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

                {/* Action buttons - visible on hover */}
                <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={(e) => openRenameDialog(e, workspace)}
                    className="p-1 rounded hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  {workspaces.length > 1 && (
                    <button
                      onClick={(e) => openDeleteDialog(e, workspace)}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Create button */}
          <div className="border-t border-border p-1.5">
            <button
              onClick={() => {
                setOpen(false)
                setCreateDialogOpen(true)
              }}
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
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Create Workspace Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("createWorkspace")}</DialogTitle>
            <DialogDescription>{t("createWorkspaceDesc")}</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              ref={inputRef}
              placeholder={t("workspaceNamePlaceholder")}
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate()
              }}
              className="h-10"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleCreate} disabled={!newWorkspaceName.trim()}>
              {t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Workspace Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("renameWorkspace")}</DialogTitle>
            <DialogDescription>{t("renameWorkspaceDesc")}</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              ref={renameInputRef}
              placeholder={t("workspaceNamePlaceholder")}
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename()
              }}
              className="h-10"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleRename} disabled={!renameName.trim()}>
              {t("Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Workspace Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteWorkspace")}</DialogTitle>
            <DialogDescription>
              {t("deleteWorkspaceDesc")} <strong>{editingWorkspace?.name}</strong>?
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
    </>
  )
}
