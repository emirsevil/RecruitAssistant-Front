"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

export interface Workspace {
  id: string
  name: string
  emoji: string
  color: string
  createdAt: string
}

interface WorkspaceContextType {
  workspaces: Workspace[]
  activeWorkspace: Workspace
  setActiveWorkspace: (workspace: Workspace) => void
  createWorkspace: (name: string, emoji?: string) => Workspace
  renameWorkspace: (id: string, name: string) => void
  deleteWorkspace: (id: string) => void
  updateWorkspaceEmoji: (id: string, emoji: string) => void
}

const WORKSPACE_STORAGE_KEY = "ra-workspaces"
const ACTIVE_WORKSPACE_KEY = "ra-active-workspace"

const WORKSPACE_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-teal-500",
]

const DEFAULT_EMOJIS = ["💼", "🚀", "🎯", "📊", "🔬", "🏗️", "💡", "🎨"]

function generateId(): string {
  return `ws_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

function getColorForIndex(index: number): string {
  return WORKSPACE_COLORS[index % WORKSPACE_COLORS.length]
}

function getEmojiForIndex(index: number): string {
  return DEFAULT_EMOJIS[index % DEFAULT_EMOJIS.length]
}

const defaultWorkspaces: Workspace[] = [
  {
    id: generateId(),
    name: "Workspace 1",
    emoji: "💼",
    color: "bg-violet-500",
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: "Workspace 2",
    emoji: "🚀",
    color: "bg-blue-500",
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: "Workspace 3",
    emoji: "🎯",
    color: "bg-emerald-500",
    createdAt: new Date().toISOString(),
  },
]

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(defaultWorkspaces)
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace>(defaultWorkspaces[0])
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const savedWorkspaces = localStorage.getItem(WORKSPACE_STORAGE_KEY)
      const savedActiveId = localStorage.getItem(ACTIVE_WORKSPACE_KEY)

      if (savedWorkspaces) {
        const parsed: Workspace[] = JSON.parse(savedWorkspaces)
        if (parsed.length > 0) {
          setWorkspaces(parsed)
          const active = parsed.find((ws) => ws.id === savedActiveId) ?? parsed[0]
          setActiveWorkspaceState(active)
        }
      }
    } catch {
      // If parsing fails, keep defaults
    }
    setIsHydrated(true)
  }, [])

  // Persist workspaces to localStorage whenever they change
  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspaces))
  }, [workspaces, isHydrated])

  // Persist active workspace ID
  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem(ACTIVE_WORKSPACE_KEY, activeWorkspace.id)
  }, [activeWorkspace, isHydrated])

  const setActiveWorkspace = useCallback((workspace: Workspace) => {
    setActiveWorkspaceState(workspace)
  }, [])

  const createWorkspace = useCallback((name: string, emoji?: string): Workspace => {
    const newWorkspace: Workspace = {
      id: generateId(),
      name,
      emoji: emoji ?? getEmojiForIndex(workspaces.length),
      color: getColorForIndex(workspaces.length),
      createdAt: new Date().toISOString(),
    }
    setWorkspaces((prev) => [...prev, newWorkspace])
    setActiveWorkspaceState(newWorkspace)
    return newWorkspace
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaces.length])

  const renameWorkspace = useCallback((id: string, name: string) => {
    setWorkspaces((prev) =>
      prev.map((ws) => (ws.id === id ? { ...ws, name } : ws))
    )
    setActiveWorkspaceState((prev) => (prev.id === id ? { ...prev, name } : prev))
  }, [])

  const deleteWorkspace = useCallback((id: string) => {
    setWorkspaces((prev) => {
      const filtered = prev.filter((ws) => ws.id !== id)
      if (filtered.length === 0) return prev // Prevent deleting all workspaces
      return filtered
    })
    setActiveWorkspaceState((prev) => {
      if (prev.id === id) {
        // Switch to another workspace
        const remaining = workspaces.filter((ws) => ws.id !== id)
        return remaining[0] ?? prev
      }
      return prev
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaces])

  const updateWorkspaceEmoji = useCallback((id: string, emoji: string) => {
    setWorkspaces((prev) =>
      prev.map((ws) => (ws.id === id ? { ...ws, emoji } : ws))
    )
    setActiveWorkspaceState((prev) => (prev.id === id ? { ...prev, emoji } : prev))
  }, [])

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        setActiveWorkspace,
        createWorkspace,
        renameWorkspace,
        deleteWorkspace,
        updateWorkspaceEmoji,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider")
  }
  return context
}
