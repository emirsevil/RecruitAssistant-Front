"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"

import { apiUrl } from "@/lib/api-config"

interface User {
  id: number
  email: string
  full_name: string | null
  education: string | null
  phone: string | null
  address: string | null
  bio: string | null
  professional_title: string | null
  skills: string | null
  profile_image: string | null
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string, education?: string) => Promise<void>
  logout: () => Promise<void>
  checkUser: () => Promise<void>
  updateProfile: (data: { full_name?: string; education?: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ── Configuration ────────────────────────────────────────────────────
const CHECK_INTERVAL_MS = 60 * 1000          // Check every 1 minute (fast inactivity detection)
const REFRESH_INTERVAL_MS = 12 * 60 * 1000   // Actually refresh tokens every 12 minutes
const INACTIVITY_LIMIT_MS = 15 * 60 * 1000   // Kick user after 15 minutes of no interaction

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Track last user activity timestamp
  const lastActivityRef = useRef<number>(Date.now())
  const lastRefreshRef = useRef<number>(Date.now())
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)

  // ── Activity tracker ─────────────────────────────────────────────
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
  }, [])

  useEffect(() => {
    // input/pointerdown: mobile typing in fields often skips keydown; avoids false inactivity logout
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart", "input", "pointerdown"]
    events.forEach(e => window.addEventListener(e, updateActivity, { passive: true }))

    // Reset activity when the user switches back to this tab — prevents
    // false inactivity timeouts while the user is simply reading the page.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateActivity()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity))
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [updateActivity])

  // ── Check current user (from existing cookie) ────────────────────
  const checkUser = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(apiUrl("/auth/me"), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Failed to check auth status:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkUser()
  }, [checkUser])

  // ── Silent token refresh ─────────────────────────────────────────
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(apiUrl("/auth/refresh"), {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        lastRefreshRef.current = Date.now()
        return true
      }

      if (response.status === 401) {
        setUser(null)
        // Do not router.push here — OnboardingGuard handles /onboarding; avoids kicking users mid-form.
        return false
      }

      return false
    } catch (error) {
      console.error("Token refresh failed:", error)
      return false
    }
  }, [])

  // ── Combined check loop (runs every 1 minute) ───────────────────
  useEffect(() => {
    if (!user) {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
      return
    }

    const tick = async () => {
      // Long onboarding forms: no inactivity kick / token refresh spam (prevents random /login)
      if (pathname.startsWith("/onboarding")) {
        return
      }

      const now = Date.now()
      const timeSinceLastActivity = now - lastActivityRef.current
      const timeSinceLastRefresh = now - lastRefreshRef.current

      // 1. INACTIVITY CHECK — kick user if idle for 15+ minutes
      if (timeSinceLastActivity > INACTIVITY_LIMIT_MS) {
        console.log("[Auth] User inactive for 15+ minutes, logging out")
        // Call the logout endpoint so the HttpOnly cookie is also cleared.
        // Without this the cookie remains valid and a page refresh would
        // silently restore the session (causing workspace to re-appear).
        try {
          await fetch(apiUrl("/auth/logout"), {
            method: "POST",
            credentials: "include",
          })
        } catch {
          // Best-effort — proceed with local logout even if the request fails
        }
        setUser(null)
        router.push("/login")
        return
      }

      // 2. REFRESH CHECK — only refresh if 12+ minutes passed since last refresh
      if (timeSinceLastRefresh >= REFRESH_INTERVAL_MS) {
        await refreshTokens()
      }
    }

    // Do not call refresh here on mount. Right after login, cookies are already
    // fresh; an immediate /auth/refresh can 401 (race or rotation) and clear
    // the session before the user leaves the login flow.

    refreshTimerRef.current = setInterval(tick, CHECK_INTERVAL_MS)

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
    }
  }, [user, refreshTokens, router, pathname])

  // ── Login ────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(apiUrl("/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Important to receive the cookie
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || "Login failed")
      }

      const data = await response.json()
      setUser(data.user)
      lastActivityRef.current = Date.now() // Reset activity timer on login
      lastRefreshRef.current = Date.now() // Fresh tokens from login; defer periodic refresh
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // ── Register ─────────────────────────────────────────────────────
  const register = async (email: string, password: string, fullName: string, education?: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(apiUrl("/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName, education }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || "Registration failed")
      }
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // ── Logout ───────────────────────────────────────────────────────
  const logout = async () => {
    setIsLoading(true)
    try {
      await fetch(apiUrl("/auth/logout"), {
        method: "POST",
        credentials: "include",
      })
      setUser(null)
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = useCallback(async (profileData: { full_name?: string; education?: string }) => {
    try {
      const response = await fetch(apiUrl("/auth/profile"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
        credentials: "include",
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUser(updatedUser)
      } else {
        const errData = await response.json()
        throw new Error(errData.detail || "Failed to update profile")
      }
    } catch (error) {
      console.error("Failed to update profile:", error)
      throw error
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, checkUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
