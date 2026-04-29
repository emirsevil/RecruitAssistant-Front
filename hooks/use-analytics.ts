"use client"

import { useCallback, useEffect, useState } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export type AnalyticsRange = "30d" | "90d" | "all"

export interface KpiCounter {
  current: number
  prev: number
}

export interface AnalyticsKpis {
  interviews: KpiCounter
  avg_interview_score: KpiCounter
  quizzes: KpiCounter
  avg_quiz_score: KpiCounter
}

export interface ScoreBucket {
  bucket: string
  interview_hr: number | null
  interview_tech: number | null
  quiz: number | null
}

export interface TopicRow {
  topic: string
  attempts: number
  avg_score: number
  trend: number | null
}

export interface QuizRow {
  title: string
  attempts: number
  best: number
  latest: number
  accuracy: number
}

export interface DifficultyRow {
  difficulty: string
  attempts: number
  avg_score: number
}

export interface ModeBucket {
  count: number
  avg_score: number
}

export interface ModeSplit {
  voice: ModeBucket
  text: ModeBucket
}

export interface InsightCard {
  tone: "positive" | "warning" | "neutral"
  title: string
  body: string
}

export interface AnalyticsSummary {
  range: { start: string; end: string }
  bucket_unit: "day" | "week"
  kpis: AnalyticsKpis
  score_timeseries: ScoreBucket[]
  topic_breakdown: TopicRow[]
  quiz_breakdown: QuizRow[]
  difficulty_breakdown: DifficultyRow[]
  mode_split: ModeSplit
  insights: InsightCard[]
}

interface UseAnalyticsArgs {
  workspaceId: string | null | undefined
  range: AnalyticsRange
}

export function useAnalytics({ workspaceId, range }: UseAnalyticsArgs) {
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    if (!workspaceId) {
      setData(null)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `${API_BASE_URL}/analytics/summary?workspace_id=${workspaceId}&range=${range}`,
        { credentials: "include" }
      )
      if (!res.ok) throw new Error(`Failed to fetch analytics (${res.status})`)
      const payload: AnalyticsSummary = await res.json()
      setData(payload)
    } catch (e: any) {
      setError(e?.message || "Failed to fetch analytics")
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, range])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return {
    data,
    isLoading,
    error,
    refetch: fetchAnalytics,
  }
}
