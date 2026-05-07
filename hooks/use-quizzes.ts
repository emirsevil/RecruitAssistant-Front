import { useState, useCallback } from "react"

import { apiUrl } from "@/lib/api-config"

export interface QuizQuestion {
  id: number
  question: string
  options: string[]
  created_at: string
}

export interface QuizGroup {
  id: number
  title: string
  difficulty: string
  questions: QuizQuestion[]
  attempts_count: number
}

export interface AnswerItem {
  question_id: number
  selected_answer: string
}

export interface QuestionResult {
  question_id: number
  question: string
  selected_answer: string
  correct_answer: string
  is_correct: boolean
}

export interface QuizSubmitResponse {
  quiz_id: number
  score: number
  correct_count: number
  total_questions: number
  results: QuestionResult[]
  score_id: number
  attempt_number: number
}

export interface QuizScore {
  id: number
  user_id: number
  quiz_id: number
  quiz_title: string
  difficulty: string
  score: number
  total_questions: number
  correct_answers: number
  attempt_number: number
  completed_at: string
}

export interface QuizSubmitRequest {
  quiz_id: number
  answers: AnswerItem[]
}

export interface SkillSelection {
  title: string
  difficulties: string[]
}

export interface TargetedQuizRequest {
  selections: SkillSelection[]
  language: string
}

function isQuizGroup(x: unknown): x is QuizGroup {
  if (!x || typeof x !== "object") return false
  const g = x as Record<string, unknown>
  return typeof g.id === "number" && typeof g.title === "string" && Array.isArray(g.questions)
}

/** Backend may return a bare array or a wrapped object. */
function extractQuizList(data: unknown): QuizGroup[] {
  if (data == null) return []
  if (Array.isArray(data)) {
    return data.filter(isQuizGroup)
  }
  if (typeof data === "object") {
    const o = data as Record<string, unknown>
    for (const key of ["quizzes", "items", "data", "results"]) {
      const v = o[key]
      if (Array.isArray(v)) return extractQuizList(v)
    }
  }
  return []
}

export function useQuizzes() {
  const [quizGroups, setQuizGroups] = useState<QuizGroup[]>([])
  const [userScores, setUserScores] = useState<QuizScore[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitResult, setSubmitResult] = useState<QuizSubmitResponse | null>(null)

  const fetchWorkspaceQuizzes = useCallback(async (workspaceId: string | number) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(apiUrl(`/workspaces/${workspaceId}/quizzes`), {
        credentials: "include"
      })
      if (!res.ok) throw new Error("Failed to fetch quizzes")
      const raw = await res.text()
      let parsed: unknown = []
      try {
        parsed = raw ? JSON.parse(raw) : []
      } catch {
        throw new Error("Invalid quizzes response")
      }
      const list = extractQuizList(parsed)
      setQuizGroups(list)
      return list
    } catch (e: any) {
      setError(e.message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchUserScores = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/quizzes/scores/me"), {
        credentials: "include"
      })
      if (!res.ok) throw new Error("Failed to fetch scores")
      const data = await res.json()
      setUserScores(data)
      return data
    } catch (e: any) {
      console.error(e)
      return []
    }
  }, [])

  const submitQuiz = async (submission: QuizSubmitRequest) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(apiUrl("/quizzes/submit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
        credentials: "include",
      })
      
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || "Failed to submit quiz")
      }
      
      const data = await res.json()
      setSubmitResult(data)
      return data
    } catch (e: any) {
      setError(e.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const checkCanStart = async (quizId: number) => {
    try {
      const res = await fetch(apiUrl(`/quizzes/${quizId}/can-start`), {
        credentials: "include"
      })
      if (!res.ok) return { can_start: false }
      return await res.json()
    } catch (e) {
      return { can_start: false }
    }
  }



  const generateTargetedQuizzes = async (
    workspaceId: string | number,
    selections: SkillSelection[],
    language: string = "tr"
  ): Promise<QuizGroup[]> => {
    setIsGenerating(true)
    setError(null)
    try {
      const res = await fetch(apiUrl(`/workspaces/${workspaceId}/quizzes/generate-targeted`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selections, language }),
        credentials: "include",
      })
      if (!res.ok) {
        let detail = ""
        try {
          const errBody = await res.json()
          if (typeof errBody?.detail === "string") detail = errBody.detail
        } catch { /* ignore */ }
        throw new Error(detail || "Failed to generate quizzes")
      }
      const raw = await res.text()
      let parsed: unknown = []
      try {
        parsed = raw ? JSON.parse(raw) : []
      } catch {
        throw new Error("Invalid response from quiz generator")
      }
      const created = extractQuizList(parsed)
      await fetchWorkspaceQuizzes(workspaceId)
      return created
    } catch (e: any) {
      setError(e?.message ?? "Failed to generate quizzes")
      throw e
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    quizGroups,
    userScores,
    isLoading,
    isGenerating,
    error,
    submitResult,
    fetchWorkspaceQuizzes,
    fetchUserScores,
    submitQuiz,
    checkCanStart,
    generateTargetedQuizzes,
  }
}
