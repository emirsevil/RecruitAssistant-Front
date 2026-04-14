"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://recruitassistant-back-eo8n.onrender.com"

// ── Configuration ────────────────────────────────────────────────────
const CHECK_INTERVAL_MS = 60 * 1000          // Check every 1 minute (fast inactivity detection)
const REFRESH_INTERVAL_MS = 12 * 60 * 1000   // Actually refresh tokens every 12 minutes
const INACTIVITY_LIMIT_MS = 15 * 60 * 1000   // Kick user after 15 minutes of no interaction

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Track last user activity timestamp
  const lastActivityRef = useRef<number>(Date.now())
  const lastRefreshRef = useRef<number>(Date.now())
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)

  // ── Activity tracker ─────────────────────────────────────────────
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
  }, [])

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"]
    events.forEach(e => window.addEventListener(e, updateActivity, { passive: true }))
    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity))
    }
  }, [updateActivity])

  // ── Check current user (from existing cookie) ────────────────────
  const checkUser = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
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
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        lastRefreshRef.current = Date.now()
        return true
      }

      if (response.status === 401) {
        setUser(null)
        router.push("/login")
        return false
      }

      return false
    } catch (error) {
      console.error("Token refresh failed:", error)
      return false
    }
  }, [router])

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
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivityRef.current
      const timeSinceLastRefresh = now - lastRefreshRef.current

      // 1. INACTIVITY CHECK — kick user if idle for 15+ minutes
      if (timeSinceLastActivity > INACTIVITY_LIMIT_MS) {
        console.log("[Auth] User inactive for 15+ minutes, logging out")
        setUser(null)
        router.push("/login")
        return
      }

      // 2. REFRESH CHECK — only refresh if 12+ minutes passed since last refresh
      if (timeSinceLastRefresh >= REFRESH_INTERVAL_MS) {
        await refreshTokens()
      }
    }

    // Initial refresh on mount
    refreshTokens()

    refreshTimerRef.current = setInterval(tick, CHECK_INTERVAL_MS)

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
    }
  }, [user, refreshTokens, router])

  // ── Login ────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
      router.push("/dashboard")
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
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
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
      await fetch(`${API_BASE_URL}/auth/logout`, {
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

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, checkUser }}>
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
