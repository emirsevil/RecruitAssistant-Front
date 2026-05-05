import { useCallback, useEffect, useState } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://recruitassistant-back-1.onrender.com"

export interface DashboardStats {
  completed_interviews: number
  completed_interviews_this_week: number
  avg_hr_score: number
  avg_hr_score_trend: number
  avg_technical_score: number
  avg_technical_score_trend: number
}

export interface DashboardActivity {
  id: string
  title: string
  description: string | null
  activity_type: string
  created_at: string
}

export interface DashboardSkillScore {
  id: string
  skill_name: string
  category: string | null
  score: number
  updated_at: string
}

export interface DashboardWeeklyGoals {
  interviews_target: number
  interviews_actual: number
  quizzes_target: number
  quizzes_actual: number
  practice_minutes_target: number
  practice_minutes_actual: number
}

export interface DashboardUpcomingEvent {
  id: number
  title: string
  event_type: "interview" | "quiz" | "practice" | "other"
  start_time: string
  end_time: string
}

export interface DashboardData {
  stats: DashboardStats
  activity: DashboardActivity[]
  skill_scores: DashboardSkillScore[]
  weekly_goals: DashboardWeeklyGoals
  upcoming_events: DashboardUpcomingEvent[]
}

export function useDashboard(workspaceId?: number | null) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const url = workspaceId
        ? `${API_BASE_URL}/dashboard/summary?workspace_id=${workspaceId}`
        : `${API_BASE_URL}/dashboard/summary`
      const response = await fetch(url, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data")
      }

      const dashboardData: DashboardData = await response.json()
      setData(dashboardData)
      return dashboardData
    } catch (e: any) {
      setError(e.message || "Failed to fetch dashboard data")
      setData(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  return {
    data,
    isLoading,
    error,
    refetch: fetchDashboard,
    updateGoals: async (goals: {
      interviews_target: number
      quizzes_target: number
      practice_minutes_target: number
    }) => {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/goals`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(goals),
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to update goals")
        }

        await fetchDashboard()
        return true
      } catch (e: any) {
        setError(e.message || "Failed to update goals")
        return false
      }
    },
  }
}
