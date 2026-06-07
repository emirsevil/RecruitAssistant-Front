"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useWorkspace } from "./workspace-context"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface SimulationStatus {
  stage: string // "cv_preparation" | "interview_cycle" | "completed"
  cv_completed: boolean
  cover_letter_completed: boolean
  total_interviews: number
  target_interview_count: number
  total_quizzes: number
  total_feedbacks: number
  can_access_interviews: boolean
}

export interface FeedbackData {
  real_interview_date?: string
  real_interview_type?: string
  company_questions?: string
  app_helpful_rating?: number
  preparation_rating?: number
  what_helped_most?: string
  what_to_improve?: string
  additional_notes?: string
  interview_result?: string
}

export interface FeedbackResponse {
  id: number
  workspace_id: number
  user_id: number
  real_interview_date?: string
  real_interview_type?: string
  company_questions?: string
  app_helpful_rating?: number
  preparation_rating?: number
  what_helped_most?: string
  what_to_improve?: string
  additional_notes?: string
  interview_result?: string
  created_at: string
}

interface SimulationContextType {
  status: SimulationStatus | null
  isLoading: boolean
  refreshStatus: () => Promise<void>
  completeCvStage: () => Promise<void>
  skipCvStage: () => Promise<void>
  markCvCompleted: () => Promise<void>
  markCoverLetterCompleted: () => Promise<void>
  advanceStage: (targetStage?: string) => Promise<void>
  submitFeedback: (data: FeedbackData) => Promise<FeedbackResponse>
  feedbacks: FeedbackResponse[]
  fetchFeedbacks: () => Promise<void>
  updateTargetInterviewCount: (count: number) => Promise<void>
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined)

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const { activeWorkspace } = useWorkspace()
  const [status, setStatus] = useState<SimulationStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>([])

  const workspaceId = activeWorkspace?.id

  const refreshStatus = useCallback(async () => {
    if (!workspaceId) {
      setStatus(null)
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/simulation/${workspaceId}/status`, {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (err) {
      console.error("Failed to fetch simulation status:", err)
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId])

  // Auto-fetch status when workspace changes
  useEffect(() => {
    refreshStatus()
  }, [refreshStatus])

  const completeCvStage = useCallback(async () => {
    if (!workspaceId) return
    try {
      const res = await fetch(`${API_BASE_URL}/simulation/${workspaceId}/complete-cv`, {
        method: "POST",
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (err) {
      console.error("Failed to complete CV stage:", err)
    }
  }, [workspaceId])

  const skipCvStage = useCallback(async () => {
    if (!workspaceId) return
    try {
      const res = await fetch(`${API_BASE_URL}/simulation/${workspaceId}/skip-cv`, {
        method: "POST",
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (err) {
      console.error("Failed to skip CV stage:", err)
    }
  }, [workspaceId])

  const markCvCompleted = useCallback(async () => {
    if (!workspaceId) return
    try {
      const res = await fetch(`${API_BASE_URL}/simulation/${workspaceId}/mark-cv-completed`, {
        method: "POST",
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (err) {
      console.error("Failed to mark CV completed:", err)
    }
  }, [workspaceId])

  const markCoverLetterCompleted = useCallback(async () => {
    if (!workspaceId) return
    try {
      const res = await fetch(`${API_BASE_URL}/simulation/${workspaceId}/mark-cl-completed`, {
        method: "POST",
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (err) {
      console.error("Failed to mark cover letter completed:", err)
    }
  }, [workspaceId])

  const advanceStage = useCallback(async (targetStage?: string) => {
    if (!workspaceId) return
    try {
      const res = await fetch(`${API_BASE_URL}/simulation/${workspaceId}/advance-stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ target_stage: targetStage || null }),
      })
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (err) {
      console.error("Failed to advance stage:", err)
    }
  }, [workspaceId])

  const submitFeedback = useCallback(async (data: FeedbackData): Promise<FeedbackResponse> => {
    if (!workspaceId) throw new Error("No workspace selected")
    const res = await fetch(`${API_BASE_URL}/simulation/${workspaceId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to submit feedback")
    const feedback = await res.json()
    setFeedbacks((prev) => [feedback, ...prev])
    // Refresh status after feedback
    await refreshStatus()
    return feedback
  }, [workspaceId, refreshStatus])

  const fetchFeedbacks = useCallback(async () => {
    if (!workspaceId) return
    try {
      const res = await fetch(`${API_BASE_URL}/simulation/${workspaceId}/feedbacks`, {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setFeedbacks(data)
      }
    } catch (err) {
      console.error("Failed to fetch feedbacks:", err)
    }
  }, [workspaceId])

  const updateTargetInterviewCount = useCallback(async (count: number) => {
    if (!workspaceId) return
    try {
      const res = await fetch(`${API_BASE_URL}/simulation/${workspaceId}/target-interviews`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ target_interview_count: count }),
      })
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (err) {
      console.error("Failed to update target interviews:", err)
    }
  }, [workspaceId])

  return (
    <SimulationContext.Provider
      value={{
        status,
        isLoading,
        refreshStatus,
        completeCvStage,
        skipCvStage,
        markCvCompleted,
        markCoverLetterCompleted,
        advanceStage,
        submitFeedback,
        feedbacks,
        fetchFeedbacks,
        updateTargetInterviewCount,
      }}
    >
      {children}
    </SimulationContext.Provider>
  )
}

export function useSimulation() {
  const context = useContext(SimulationContext)
  if (context === undefined) {
    throw new Error("useSimulation must be used within a SimulationProvider")
  }
  return context
}
