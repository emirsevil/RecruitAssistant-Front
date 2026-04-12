"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useAuth } from "./auth-context"

export interface Workspace {
  id: string
  name: string
  emoji: string
  color: string
  createdAt: string
  jobName?: string
  jobDescription?: string
}

export interface CreateWorkspaceOptions {
  name: string
  emoji?: string
  jobName?: string
  jobDescription?: string
}

export type WorkspaceDetailsUpdate = Partial<
  Pick<Workspace, "name" | "emoji" | "jobName" | "jobDescription">
>

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface WorkspaceContextType {
  workspaces: Workspace[]
  activeWorkspace: Workspace | null
  isHydrated: boolean
  setActiveWorkspace: (workspace: Workspace) => void
  createWorkspace: (name: string, emoji?: string, options?: { jobName?: string; jobDescription?: string }) => Promise<Workspace>
  renameWorkspace: (id: string, name: string) => Promise<void>
  updateWorkspace: (id: string, updates: WorkspaceDetailsUpdate) => Promise<void>
  deleteWorkspace: (id: string) => Promise<void>
  updateWorkspaceEmoji: (id: string, emoji: string) => Promise<void>
}

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

function getColorForIndex(index: number): string {
  return WORKSPACE_COLORS[index % WORKSPACE_COLORS.length]
}

function getEmojiForIndex(index: number): string {
  return DEFAULT_EMOJIS[index % DEFAULT_EMOJIS.length]
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Mapping function from API to Frontend model
  const mapApiToWorkspace = useCallback((apiWs: any): Workspace => {
    return {
      id: apiWs.id.toString(),
      name: apiWs.company_name,
      emoji: apiWs.emoji || "💼",
      color: apiWs.color || "bg-violet-500",
      createdAt: apiWs.created_at,
      jobName: apiWs.job_name,
      jobDescription: apiWs.job_description,
    }
  }, [])

  // Hydrate from API on mount or when user changes
  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!user) {
        setWorkspaces([])
        setActiveWorkspaceState(null)
        setIsHydrated(true)
        return
      }

      setIsHydrated(false)
      try {
        const response = await fetch(`${API_BASE_URL}/workspaces/`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Scoped by HttpOnly cookie
        })
        if (response.ok) {
          const data = await response.json()
          const mappedWorkspaces = data.map(mapApiToWorkspace)
          setWorkspaces(mappedWorkspaces)

          const savedActiveId = localStorage.getItem(ACTIVE_WORKSPACE_KEY)
          if (mappedWorkspaces.length > 0) {
            const active = mappedWorkspaces.find((ws: Workspace) => ws.id === savedActiveId) ?? mappedWorkspaces[0]
            setActiveWorkspaceState(active)
          } else {
            setActiveWorkspaceState(null)
          }
        }
      } catch (error) {
        console.error("Failed to fetch workspaces:", error)
      } finally {
        setIsHydrated(true)
      }
    }

    fetchWorkspaces()
  }, [mapApiToWorkspace, user])

  // Persist active workspace ID
  useEffect(() => {
    if (!isHydrated || !activeWorkspace) return
    localStorage.setItem(ACTIVE_WORKSPACE_KEY, activeWorkspace.id)
  }, [activeWorkspace, isHydrated])

  const setActiveWorkspace = useCallback((workspace: Workspace) => {
    setActiveWorkspaceState(workspace)
  }, [])

  const createWorkspace = useCallback(async (
    name: string,
    emoji?: string,
    options?: { jobName?: string; jobDescription?: string }
  ): Promise<Workspace> => {
    if (!user) throw new Error("Authentication required")
    
    const wsEmoji = emoji ?? getEmojiForIndex(workspaces.length)
    const wsColor = getColorForIndex(workspaces.length)

    const response = await fetch(`${API_BASE_URL}/workspaces/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        company_name: name,
        job_name: options?.jobName,
        job_description: options?.jobDescription,
        emoji: wsEmoji,
        color: wsColor,
        user_id: user.id
      }),
    })

    if (!response.ok) throw new Error("Failed to create workspace")
    
    const data = await response.json()
    const newWorkspace = mapApiToWorkspace(data)
    
    setWorkspaces((prev) => [...prev, newWorkspace])
    setActiveWorkspaceState(newWorkspace)
    return newWorkspace
  }, [workspaces.length, mapApiToWorkspace, user])

  const renameWorkspace = useCallback(async (id: string, name: string) => {
    const response = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ company_name: name }),
    })
    
    if (!response.ok) throw new Error("Failed to rename workspace")

    setWorkspaces((prev) =>
      prev.map((ws) => (ws.id === id ? { ...ws, name } : ws))
    )
    setActiveWorkspaceState((prev) => (prev && prev.id === id ? { ...prev, name } : prev))
  }, [])

  const updateWorkspace = useCallback(async (id: string, updates: WorkspaceDetailsUpdate) => {
    const response = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        company_name: updates.name,
        job_name: updates.jobName,
        job_description: updates.jobDescription,
        emoji: updates.emoji
      }),
    })

    if (!response.ok) throw new Error("Failed to update workspace")

    setWorkspaces((prev) =>
      prev.map((ws) => (ws.id === id ? { ...ws, ...updates } : ws))
    )
    setActiveWorkspaceState((prev) => {
      if (!prev || prev.id !== id) return prev
      return { ...prev, ...updates }
    })
  }, [])

  const deleteWorkspace = useCallback(async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (!response.ok) throw new Error("Failed to delete workspace")

    setWorkspaces((prev) => {
      const filtered = prev.filter((ws) => ws.id !== id)
      return filtered
    })
    setActiveWorkspaceState((prev) => {
      if (!prev || prev.id === id) {
        const remaining = workspaces.filter((ws) => ws.id !== id)
        return remaining[0] ?? null
      }
      return prev
    })
  }, [workspaces])

  const updateWorkspaceEmoji = useCallback(async (id: string, emoji: string) => {
    const response = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ emoji }),
    })

    if (!response.ok) throw new Error("Failed to update emoji")

    setWorkspaces((prev) =>
      prev.map((ws) => (ws.id === id ? { ...ws, emoji } : ws))
    )
    setActiveWorkspaceState((prev) => (prev && prev.id === id ? { ...prev, emoji } : prev))
  }, [])

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        isHydrated,
        setActiveWorkspace,
        createWorkspace,
        renameWorkspace,
        updateWorkspace,
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
