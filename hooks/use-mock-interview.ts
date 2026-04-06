import { useState } from "react"

export interface MockQuestion {
  id: number
  question: string
  topic: string
  aiResponse?: boolean
}

export interface EvaluationResult {
  question: string
  topic: string
  score: number
  feedback: string
}

export interface FullEvaluation {
  results: EvaluationResult[]
  overall_score: number
  overall_feedback: string
}

interface UseMockInterviewProps {
  workspaceId: string
  categories: string
  difficulty: string
  interviewType: string
}

export function useMockInterview() {
  const [questions, setQuestions] = useState<MockQuestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [interviewId, setInterviewId] = useState<number | null>(null)

  // Answers map: question index -> user answer text
  const [answers, setAnswers] = useState<Record<number, string>>({})

  // Evaluation results
  const [evaluation, setEvaluation] = useState<FullEvaluation | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)

  const saveAnswer = (questionIndex: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answer }))
  }

  const generateQuestions = async ({
    workspaceId,
    categories,
    difficulty,
    interviewType,
  }: UseMockInterviewProps) => {
    setIsLoading(true)
    setError(null)
    setAnswers({})
    setEvaluation(null)
    
    try {
      const res = await fetch("http://localhost:8000/interviews/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: parseInt(workspaceId) || 1,
          categories: categories || "General",
          difficulty: difficulty,
          interview_type: interviewType,
        }),
      })
      
      if (!res.ok) {
        let msg = "Failed to fetch questions"
        try {
          const errData = await res.json()
          msg = errData.detail || msg
        } catch {
          msg = await res.text() || msg
        }
        throw new Error(msg)
      }

      const data = await res.json()
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions)
        setInterviewId(data.interview_id)
        return true
      } else {
        throw new Error("No questions were generated")
      }
    } catch (e: any) {
      console.error(e)
      setError(e.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const evaluateAnswers = async (lastAnswerOverride?: { index: number, answer: string }, difficulty?: string) => {
    if (!interviewId || questions.length === 0) return false

    setIsEvaluating(true)
    setError(null)

    try {
      // Merge the last answer override into the answers map
      const mergedAnswers = { ...answers }
      if (lastAnswerOverride) {
        mergedAnswers[lastAnswerOverride.index] = lastAnswerOverride.answer
      }

      const qa_pairs = questions.map((q, idx) => ({
        question: q.question,
        topic: q.topic,
        answer: mergedAnswers[idx] || "(No answer provided)",
      }))

      const res = await fetch("http://localhost:8000/interviews/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interview_id: interviewId,
          difficulty: difficulty || "junior",
          qa_pairs,
        }),
      })

      if (!res.ok) {
        let msg = "Failed to evaluate answers"
        try {
          const errData = await res.json()
          msg = errData.detail || msg
        } catch {
          msg = await res.text() || msg
        }
        throw new Error(msg)
      }

      const data: FullEvaluation = await res.json()
      setEvaluation(data)
      return true
    } catch (e: any) {
      console.error(e)
      setError(e.message)
      return false
    } finally {
      setIsEvaluating(false)
    }
  }

  return {
    questions,
    setQuestions,
    isLoading,
    error,
    interviewId,
    answers,
    saveAnswer,
    evaluation,
    isEvaluating,
    generateQuestions,
    evaluateAnswers,
  }
}
