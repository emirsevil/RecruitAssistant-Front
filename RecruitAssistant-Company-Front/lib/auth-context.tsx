"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { API_BASE_URL } from "./api-config"
import type { Recruiter } from "./types"

interface AuthContextType {
  recruiter: Recruiter | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { full_name: string; email: string; password: string; company: { name: string; website?: string; description?: string } }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const CHECK_INTERVAL_MS = 60 * 1000
const REFRESH_INTERVAL_MS = 12 * 60 * 1000
const INACTIVITY_LIMIT_MS = 15 * 60 * 1000

const PUBLIC_PATHS = ["/login", "/register"]

export function RecruiterAuthProvider({ children }: { children: React.ReactNode }) {
  const [recruiter, setRecruiter] = useState<Recruiter | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const lastActivityRef = useRef<number>(Date.now())
  const lastRefreshRef = useRef<number>(Date.now())
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Activity tracker
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
  }, [])

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"]
    events.forEach(e => window.addEventListener(e, updateActivity, { passive: true }))
    const handleVisibility = () => {
      if (document.visibilityState === "visible") updateActivity()
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity))
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [updateActivity])

  // Token refresh
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/recruiter/auth/refresh`, {
        method: "POST",
        credentials: "include",
      })
      if (res.ok) {
        lastRefreshRef.current = Date.now()
        return true
      }
      if (res.status === 401) {
        setRecruiter(null)
        if (!PUBLIC_PATHS.some(p => window.location.pathname.startsWith(p))) {
          window.location.href = "/login"
        }
        return false
      }
      return false
    } catch {
      return false
    }
  }, [])

  // Check current recruiter
  const checkRecruiter = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/recruiter/auth/me`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })
      if (res.ok) {
        setRecruiter(await res.json())
      } else if (res.status === 401) {
        const refreshed = await refreshTokens()
        if (refreshed) {
          const retry = await fetch(`${API_BASE_URL}/recruiter/auth/me`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          })
          if (retry.ok) {
            setRecruiter(await retry.json())
            return
          }
        }
        setRecruiter(null)
      } else {
        setRecruiter(null)
      }
    } catch {
      setRecruiter(null)
    } finally {
      setIsLoading(false)
    }
  }, [refreshTokens])

  useEffect(() => {
    checkRecruiter()
  }, [checkRecruiter])

  // Redirect logic
  useEffect(() => {
    if (isLoading) return
    const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
    if (!recruiter && !isPublic) {
      router.replace("/login")
    }
    if (recruiter && isPublic) {
      router.replace("/dashboard")
    }
  }, [recruiter, isLoading, pathname, router])

  // Refresh loop
  useEffect(() => {
    if (!recruiter) {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
      return
    }
    const tick = async () => {
      const now = Date.now()
      if (now - lastActivityRef.current > INACTIVITY_LIMIT_MS) {
        try {
          await fetch(`${API_BASE_URL}/recruiter/auth/logout`, { method: "POST", credentials: "include" })
        } catch { /* best effort */ }
        setRecruiter(null)
        window.location.href = "/login"
        return
      }
      if (now - lastRefreshRef.current >= REFRESH_INTERVAL_MS) {
        await refreshTokens()
      }
    }
    refreshTimerRef.current = setInterval(tick, CHECK_INTERVAL_MS)
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    }
  }, [recruiter, refreshTokens])

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/recruiter/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || "Login failed")
    }
    const data = await res.json()
    // Fetch full recruiter profile
    await checkRecruiter()
  }

  const register = async (data: { full_name: string; email: string; password: string; company: { name: string; website?: string; description?: string } }) => {
    const res = await fetch(`${API_BASE_URL}/recruiter/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || "Registration failed")
    }
  }

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/recruiter/auth/logout`, {
        method: "POST",
        credentials: "include",
      })
    } catch { /* best effort */ }
    setRecruiter(null)
    window.location.href = "/login"
  }

  return (
    <AuthContext.Provider value={{ recruiter, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within RecruiterAuthProvider")
  return ctx
}
