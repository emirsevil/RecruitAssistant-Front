import { useState } from "react"

export interface QuizQuestion {
  id: number
  workspace_id: number | null
  title: string | null
  difficulty: string | null
  question: string
  options: string[]
  created_at: string
}

export interface QuizGroup {
  title: string
  difficulty: string
  questions: QuizQuestion[]
}

export interface AnswerItem {
  quiz_id: number
  selected_answer: string
}

export interface QuestionResult {
  quiz_id: number
  question: string
  selected_answer: string
  correct_answer: string
  is_correct: boolean
}

export interface QuizSubmitResponse {
  quiz_title: string
  score: number
  correct_count: number
  total_questions: number
  results: QuestionResult[]
  score_id: number
}

export interface QuizScore {
  id: number
  user_id: number
  workspace_id: number
  quiz_title: string
  difficulty: string
  score: number
  total_questions: number
  correct_answers: number
  completed_at: string
}

export interface QuizSubmitRequest {
  user_id?: number
  workspace_id: number
  quiz_title: string
  difficulty: string
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

export function useQuizzes() {
  const [quizGroups, setQuizGroups] = useState<QuizGroup[]>([])
  const [userScores, setUserScores] = useState<QuizScore[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitResult, setSubmitResult] = useState<QuizSubmitResponse | null>(null)

  const fetchWorkspaceQuizzes = async (workspaceId: string | number) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`http://localhost:8000/workspaces/${workspaceId}/quizzes`, {
        credentials: "include"
      })
      if (!res.ok) throw new Error("Failed to fetch quizzes")
      const data = await res.json()
      setQuizGroups(data)
      return data
    } catch (e: any) {
      setError(e.message)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserScores = async () => {
    try {
      const res = await fetch(`http://localhost:8000/quizzes/scores/me`, {
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
  }

  const submitQuiz = async (submission: QuizSubmitRequest) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("http://localhost:8000/quizzes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to submit quiz")
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

  const extractSkills = async (workspaceId: string | number) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`http://localhost:8000/workspaces/${workspaceId}/skills/extract`, {
        method: "POST",
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to extract skills")
      const data = await res.json()
      return data as string[]
    } catch (e: any) {
      setError(e.message)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  const generateTargetedQuizzes = async (workspaceId: string | number, selections: SkillSelection[], language: string = "tr") => {
    setIsGenerating(true)
    setError(null)
    try {
      const res = await fetch(`http://localhost:8000/workspaces/${workspaceId}/quizzes/generate-targeted`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selections, language }),
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to generate quizzes")
      const data = await res.json()
      // Refresh quizzes after generation
      await fetchWorkspaceQuizzes(workspaceId)
      return data
    } catch (e: any) {
      setError(e.message)
      return null
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
    extractSkills,
    generateTargetedQuizzes,
  }
}
