"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useWorkspace } from "@/lib/workspace-context"

// ── Storage keys (scoped per user) ─────────────────────────────────
const completedKey = (userId: number) => `ra-tour-completed:${userId}`
const replayKey = (userId: number) => `ra-tour-replay:${userId}`
const STEP_KEY = "ra-tour-step"

// ── Helpers (safe for SSR — guarded by typeof window) ──────────────
function readFlag(key: string): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(key) !== null
  } catch {
    return false
  }
}

function writeFlag(key: string, value: string): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, value)
  } catch {
    // localStorage may be full or disabled — fail silently
  }
}

function removeFlag(key: string): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(key)
  } catch {}
}

// ── Hook ───────────────────────────────────────────────────────────
export interface ProductTourState {
  /** Whether the tour should auto-start (first-time user on /dashboard) */
  shouldStart: boolean
  /** Whether the current user has completed/skipped the tour */
  hasCompleted: boolean
  /** Mark as completed (persists to localStorage) */
  markCompleted: () => void
  /** Clear the completion flag and set replay signal */
  resetTour: () => void
}

export function useProductTour(): ProductTourState {
  const { user, isLoading: authLoading } = useAuth()
  const { isHydrated } = useWorkspace()
  const pathname = usePathname()

  const [hasCompleted, setHasCompleted] = useState(true) // default true to avoid flash
  const [shouldStart, setShouldStart] = useState(false)

  const userId = user?.id ?? null

  // ── Sync hasCompleted from localStorage whenever auth or pathname changes ──
  useEffect(() => {
    if (authLoading || userId === null) return

    // Check for replay signal first
    const hasReplay = readFlag(replayKey(userId))
    if (hasReplay) {
      removeFlag(replayKey(userId))
      setHasCompleted(false)
      return // let next render pick up hasCompleted=false
    }

    const completed = readFlag(completedKey(userId))
    setHasCompleted(completed)
  }, [authLoading, userId, pathname])

  // ── Derive shouldStart: fires when all conditions are met ────────
  useEffect(() => {
    if (authLoading || userId === null) return
    if (!isHydrated) return // wait for workspace data to load
    if (pathname !== "/dashboard") return

    if (!hasCompleted) {
      setShouldStart(true)
    }
  }, [authLoading, userId, isHydrated, pathname, hasCompleted])

  // ── Public API ───────────────────────────────────────────────────
  const markCompleted = useCallback(() => {
    if (userId === null) return
    writeFlag(completedKey(userId), JSON.stringify({ completedAt: new Date().toISOString() }))
    setHasCompleted(true)
    setShouldStart(false)
  }, [userId])

  const resetTour = useCallback(() => {
    if (userId === null) return
    removeFlag(completedKey(userId))
    writeFlag(replayKey(userId), "1")
    setHasCompleted(false)
    // Clear any stale session step
    if (typeof window !== "undefined") {
      try { sessionStorage.removeItem(STEP_KEY) } catch {}
    }
  }, [userId])

  return { shouldStart, hasCompleted, markCompleted, resetTour }
}
