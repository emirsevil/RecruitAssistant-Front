import { useState, useEffect, useCallback } from "react"
import { API_BASE_URL } from "@/lib/api-config"

// ─── Types ──────────────────────────────────────────────────────────

export interface InterviewSummary {
  id: number
  workspace_id: number
  interview_type: string
  mode: string
  difficulty: string | null
  categories: string | null
  overall_score: number | null
  duration_seconds: number | null
  status: string
  created_at: string
  company_name: string | null
}

export interface InterviewDetailQA {
  question: string
  topic: string
  answer: string
  score: number | null
  feedback: string | null
}

export interface InterviewDetail {
  id: number
  workspace_id: number
  interview_type: string
  mode: string
  difficulty: string | null
  categories: string | null
  overall_score: number | null
  overall_feedback: string | null
  duration_seconds: number | null
  status: string
  created_at: string
  company_name: string | null
  questions: InterviewDetailQA[]
  conversation_history: Array<{ role: string; text: string }> | null
}

// ─── List Hook ──────────────────────────────────────────────────────

export function useInterviewHistory() {
  const [interviews, setInterviews] = useState<InterviewSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInterviews = useCallback(async (workspaceId?: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const url = workspaceId
        ? `${API_BASE_URL}/interviews/?workspace_id=${workspaceId}`
        : `${API_BASE_URL}/interviews/`

      const res = await fetch(url, {
        credentials: "include",
      })

      if (!res.ok) {
        throw new Error("Failed to fetch interview history")
      }

      const data: InterviewSummary[] = await res.json()
      setInterviews(data)
    } catch (e: any) {
      console.error("Interview history fetch error:", e)
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInterviews()
  }, [fetchInterviews])

  return {
    interviews,
    isLoading,
    error,
    refetch: fetchInterviews,
  }
}

// ─── Detail Hook ────────────────────────────────────────────────────

export function useInterviewDetail(interviewId: number | null) {
  const [detail, setDetail] = useState<InterviewDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = useCallback(async (id: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE_URL}/interviews/${id}`, {
        credentials: "include",
      })

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Interview not found")
        }
        throw new Error("Failed to fetch interview details")
      }

      const data: InterviewDetail = await res.json()
      setDetail(data)
    } catch (e: any) {
      console.error("Interview detail fetch error:", e)
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (interviewId) {
      fetchDetail(interviewId)
    }
  }, [interviewId, fetchDetail])

  return {
    detail,
    isLoading,
    error,
    refetch: () => interviewId && fetchDetail(interviewId),
  }
}
