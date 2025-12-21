"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { PageContainer, PageHeader } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { PlayCircle, Clock, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Award, FileText, Loader2 } from "lucide-react"

// Types to handle the expanded data structure
type Question = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

type QuizData = {
  id: number;
  title: string;
  category: string;
  difficulty: string;
  questionsCount: number;
  duration: string;
  completed: boolean;
  score?: number;
  // New fields for persistence
  pastQuestions?: Question[];
  pastAnswers?: number[];
  feedback?: string;
}

const categories = ["All", "Algorithms", "Data Structures", "Databases", "OOP", "System Design", "Behavioral"]
const difficulties = ["All", "Easy", "Medium", "Hard"]

const INITIAL_QUIZZES: QuizData[] = [
  {
    id: 1,
    title: "Array Algorithms Basics",
    category: "Algorithms",
    difficulty: "Easy",
    questionsCount: 10,
    duration: "15 min",
    completed: true,
    score: 90,
    feedback: "Excellent work! You demonstrated a strong grasp of array manipulation. Keep practicing sliding window problems to reach the next level.",
    pastQuestions: [
      { id: 1, question: "What is the time complexity of access in an Array?", options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"], correctAnswer: 0 },
      { id: 2, question: "Which index is the first element?", options: ["1", "0", "-1", "Length"], correctAnswer: 1 }
    ],
    pastAnswers: [0, 1]
  },
  {
    id: 2,
    title: "Object-Oriented Programming",
    category: "OOP",
    difficulty: "Medium",
    questionsCount: 12,
    duration: "20 min",
    completed: false,
  },
  {
    id: 3,
    title: "SQL Query Optimization",
    category: "Databases",
    difficulty: "Hard",
    questionsCount: 8,
    duration: "25 min",
    completed: false,
  },
  {
    id: 4,
    title: "System Design Fundamentals",
    category: "System Design",
    difficulty: "Medium",
    questionsCount: 10,
    duration: "18 min",
    completed: true,
    score: 75,
    feedback: "Good effort. You understand the core concepts of scalability, but you missed some nuances regarding database sharding strategies.",
    pastQuestions: [],
    pastAnswers: []
  },
  {
    id: 5,
    title: "Behavioral Questions",
    category: "Behavioral",
    difficulty: "Easy",
    questionsCount: 15,
    duration: "12 min",
    completed: false,
  },
  {
    id: 6,
    title: "Advanced Data Structures",
    category: "Data Structures",
    difficulty: "Hard",
    questionsCount: 10,
    duration: "30 min",
    completed: false,
  },
]

const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "What is the time complexity of searching in a balanced binary search tree?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctAnswer: 1,
  },
  {
    id: 2,
    question: "Which data structure uses LIFO (Last In First Out) principle?",
    options: ["Queue", "Stack", "Array", "Linked List"],
    correctAnswer: 1,
  },
  {
    id: 3,
    question: "What is the space complexity of merge sort?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correctAnswer: 2,
  },
]

export default function QuizzesPage() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedDifficulty, setSelectedDifficulty] = useState("All")
  const [quizState, setQuizState] = useState<"browse" | "taking" | "results">("browse")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [currentAnswer, setCurrentAnswer] = useState<number | null>(null)

  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS)
  const [quizzesList, setQuizzesList] = useState<QuizData[]>(INITIAL_QUIZZES)

  const [loadingQuizId, setLoadingQuizId] = useState<number | null>(null)
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)

  // Feedback States
  const [currentFeedback, setCurrentFeedback] = useState<string | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (quizState === "taking" && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [quizState, timeRemaining])

  // Restore session if available
  useEffect(() => {
    const savedData = localStorage.getItem("current_quiz_data")
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          setQuestions(parsed)
        }
      } catch (e) {
        console.error("Failed to parse saved quiz data", e)
      }
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // --- ACTIONS ---

  const startQuiz = async (quizId: number, quizTitle: string, difficulty: string, questionsCount: number, durationStr: string) => {
    setLoadingQuizId(quizId)
    setActiveQuizId(quizId)

    // Reset feedback states
    setCurrentFeedback(null)
    setFeedbackLoading(false)

    const durationMatch = durationStr.match(/(\d+)/)
    const durationMinutes = durationMatch ? parseInt(durationMatch[0]) : 15

    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: quizTitle,
          difficulty: difficulty === "All" ? "Medium" : difficulty,
          numberOfQuestions: questionsCount,
        }),
      })

      if (!response.ok) throw new Error("API Failed")

      const data = await response.json()
      if (data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions)
        localStorage.setItem("current_quiz_data", JSON.stringify(data.questions))
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("Quiz generation failed, using fallback:", error)
      setQuestions(DEFAULT_QUESTIONS)
    } finally {
      setLoadingQuizId(null)
      setQuizState("taking")
      setCurrentQuestion(0)
      setSelectedAnswers([])
      setCurrentAnswer(null)
      setTimeRemaining(durationMinutes * 60)
    }
  }

  const retakeQuiz = (quizId: number) => {
    const quiz = quizzesList.find((q) => q.id === quizId)

    // If we have history of questions, reuse them
    if (quiz && quiz.pastQuestions && quiz.pastQuestions.length > 0) {
      setActiveQuizId(quizId)

      // Reset feedback states
      setCurrentFeedback(null)
      setFeedbackLoading(false)

      // Restore questions from history
      setQuestions(quiz.pastQuestions)

      // Reset Progress
      setQuizState("taking")
      setCurrentQuestion(0)
      setSelectedAnswers([])
      setCurrentAnswer(null)

      // Reset Timer
      const durationMatch = quiz.duration.match(/(\d+)/)
      const durationMinutes = durationMatch ? parseInt(durationMatch[0]) : 15
      setTimeRemaining(durationMinutes * 60)
    } else {
      // If no questions saved (e.g. dummy completed quiz without data), generate new ones
      if (quiz) {
        startQuiz(quiz.id, quiz.title, quiz.difficulty, quiz.questionsCount, quiz.duration)
      }
    }
  }

  const viewResults = (quizId: number) => {
    const quiz = quizzesList.find(q => q.id === quizId)
    if (quiz) {
      setActiveQuizId(quizId)
      setQuestions(quiz.pastQuestions && quiz.pastQuestions.length > 0 ? quiz.pastQuestions : DEFAULT_QUESTIONS)
      setSelectedAnswers(quiz.pastAnswers || [])
      setCurrentFeedback(quiz.feedback || "No feedback recorded for this session.")
      setQuizState("results")
    }
  }

  const generateFeedback = async (score: number, total: number, quizId: number) => {
    setFeedbackLoading(true)
    try {
      const activeQuiz = quizzesList.find(q => q.id === quizId)

      const response = await fetch("/api/generate-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: activeQuiz?.title || "General Coding",
          difficulty: activeQuiz?.difficulty || "Medium",
          score: score,
          totalQuestions: total
        }),
      })

      if (!response.ok) throw new Error("Feedback API failed")

      const data = await response.json()
      const feedbackText = data.feedback

      setCurrentFeedback(feedbackText)

      setQuizzesList(prev => prev.map(q =>
        q.id === quizId ? { ...q, feedback: feedbackText } : q
      ))

    } catch (e) {
      console.error("Feedback error", e)
      setCurrentFeedback("Unable to generate detailed feedback at this time.")
    } finally {
      setFeedbackLoading(false)
    }
  }

  const handleNext = () => {
    if (currentAnswer !== null) {
      const updatedAnswers = [...selectedAnswers, currentAnswer]
      setSelectedAnswers(updatedAnswers)
      setCurrentAnswer(null)

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
      } else {
        finishQuiz(updatedAnswers)
      }
    }
  }

  const finishQuiz = (finalAnswers: number[]) => {
    let correct = 0
    finalAnswers.forEach((answer, idx) => {
      if (questions[idx] && answer === questions[idx].correctAnswer) correct++
    })

    const finalScore = Math.round((correct / questions.length) * 100)
    const correctCount = correct

    if (activeQuizId) {
      setQuizzesList(prev => prev.map(q =>
        q.id === activeQuizId
          ? {
            ...q,
            completed: true,
            score: finalScore,
            pastQuestions: questions,
            pastAnswers: finalAnswers
          }
          : q
      ))

      generateFeedback(correctCount, questions.length, activeQuizId)
    }

    setQuizState("results")
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setCurrentAnswer(selectedAnswers[currentQuestion - 1] ?? null)
      setSelectedAnswers(selectedAnswers.slice(0, -1))
    }
  }

  const calculateScore = () => {
    let correct = 0
    selectedAnswers.forEach((answer, idx) => {
      if (questions[idx] && answer === questions[idx].correctAnswer) {
        correct++
      }
    })
    return Math.round((correct / questions.length) * 100)
  }

  const filteredQuizzes = quizzesList.filter((quiz) => {
    const categoryMatch = selectedCategory === "All" || quiz.category === selectedCategory
    const difficultyMatch = selectedDifficulty === "All" || quiz.difficulty === selectedDifficulty
    return categoryMatch && difficultyMatch
  })

  const recommendedQuizzes = quizzesList.filter((q) => !q.completed).slice(0, 3)

  if (quizState === "taking") {
    const question = questions[currentQuestion]
    const progress = ((currentQuestion + 1) / questions.length) * 100

    return (
      <>
        <Navigation />
        <PageContainer>
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setQuizState("browse")}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Exit Quiz
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatTime(timeRemaining)}</span>
              </div>
            </div>

            <Card>
              <CardHeader>
                <div className="mb-4">
                  <Progress value={progress} className="h-2" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Question {currentQuestion + 1} of {questions.length}
                  </p>
                </div>
                <CardTitle className="text-xl text-balance">{question?.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={currentAnswer?.toString()}
                  onValueChange={(v) => setCurrentAnswer(Number.parseInt(v))}
                >
                  <div className="space-y-3">
                    {question?.options.map((option, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 rounded-lg border p-4 transition-colors cursor-pointer ${currentAnswer === idx ? "border-primary bg-primary/5" : "hover:border-primary/50"
                          }`}
                        onClick={() => setCurrentAnswer(idx)}
                      >
                        <RadioGroupItem value={idx.toString()} id={`option-${idx}`} className="mt-0.5" />
                        <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer font-normal">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                <div className="mt-8 flex justify-between gap-4">
                  <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button onClick={handleNext} disabled={currentAnswer === null}>
                    {currentQuestion < questions.length - 1 ? "Next" : "Finish"}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </PageContainer>
      </>
    )
  }

  if (quizState === "results") {
    const score = calculateScore()

    return (
      <>
        <Navigation />
        <PageContainer>
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setQuizState("browse")}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Exit Results
              </Button>
            </div>

            {/* AI Feedback Section */}
            <Card className="border-l-4 border-l-primary shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-full">
                    {feedbackLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <FileText className="h-5 w-5 text-primary" />}
                  </div>
                  <CardTitle className="text-lg">Performance Feedback</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {feedbackLoading ? (
                  <p className="text-muted-foreground animate-pulse">Analyzing your answers with AI...</p>
                ) : (
                  <p className="text-foreground leading-relaxed">
                    {currentFeedback || "Analysis not available."}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="p-8 text-center">
                <Award className="mx-auto mb-4 h-16 w-16 text-primary" />
                <div className="mb-2 text-sm font-medium text-muted-foreground">Quiz Complete!</div>
                <div className="mb-4 text-6xl font-bold text-primary">{score}%</div>
                <p className="text-sm text-muted-foreground">
                  You got {selectedAnswers.filter((a, i) => questions[i] && a === questions[i].correctAnswer).length} out of{" "}
                  {questions.length} questions correct
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Answer Review</CardTitle>
                <CardDescription>See which questions you got right and wrong</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.map((question, idx) => {
                  const userAnswer = selectedAnswers[idx]
                  if (!question) return null;

                  const isCorrect = userAnswer === question.correctAnswer

                  return (
                    <div key={idx} className="rounded-lg border border-border p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            {isCorrect ? (
                              <CheckCircle2 className="h-5 w-5 text-success" />
                            ) : (
                              <XCircle className="h-5 w-5 text-destructive" />
                            )}
                            <span className="font-medium">Question {idx + 1}</span>
                          </div>
                          <p className="text-sm text-pretty">{question.question}</p>
                        </div>
                      </div>

                      <div className="space-y-2 rounded-lg bg-secondary/50 p-3 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground">Your answer:</span>
                          <span className={isCorrect ? "text-success font-medium" : "text-destructive font-medium"}>
                            {question.options[userAnswer] || "Skipped"}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground">Correct answer:</span>
                            <span className="text-success font-medium">{question.options[question.correctAnswer]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => setQuizState("browse")}>
                Back to Quizzes
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => {
                if (activeQuizId) retakeQuiz(activeQuizId);
              }}>
                Retake Quiz
              </Button>
            </div>
          </div>
        </PageContainer>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <PageContainer>
        <PageHeader title="Quizzes" description="Test your knowledge and track your improvement" />

        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Recommended for You</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {recommendedQuizzes.map((quiz) => (
              <Card key={quiz.id} className="overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary to-accent" />
                <CardContent className="p-6">
                  <Badge className="mb-3">{quiz.category}</Badge>
                  <h3 className="mb-2 font-semibold">{quiz.title}</h3>
                  <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{quiz.questionsCount} questions</span>
                    <span>•</span>
                    <span>{quiz.duration}</span>
                  </div>
                  <Button onClick={() => startQuiz(quiz.id, quiz.title, quiz.difficulty, quiz.questionsCount, quiz.duration)} className="w-full gap-2" disabled={loadingQuizId === quiz.id}>
                    <PlayCircle className="h-4 w-4" />
                    {loadingQuizId === quiz.id ? "Generating..." : "Start Quiz"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {difficulties.map((difficulty) => (
              <Badge
                key={difficulty}
                variant={selectedDifficulty === difficulty ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5"
                onClick={() => setSelectedDifficulty(difficulty)}
              >
                {difficulty}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map((quiz) => (
            <Card key={quiz.id} className="transition-colors hover:border-primary/50">
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <Badge variant="outline">{quiz.category}</Badge>
                  <Badge variant={quiz.difficulty === "Easy" ? "secondary" : quiz.difficulty === "Medium" ? "default" : "destructive"}>
                    {quiz.difficulty}
                  </Badge>
                </div>
                <h3 className="mb-2 font-semibold text-balance">{quiz.title}</h3>
                <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{quiz.questionsCount} questions</span>
                  <span>•</span>
                  <span>{quiz.duration}</span>
                </div>
                {quiz.completed ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Your score</span>
                      <span className="font-semibold text-primary">{quiz.score}%</span>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => viewResults(quiz.id)} variant="secondary" className="flex-1 text-xs">
                        Results & Feedback
                      </Button>
                      {/* UPDATED: Calls retakeQuiz instead of startQuiz */}
                      <Button onClick={() => retakeQuiz(quiz.id)} variant="outline" className="flex-1 bg-transparent text-xs" disabled={loadingQuizId === quiz.id}>
                        Retake
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button onClick={() => startQuiz(quiz.id, quiz.title, quiz.difficulty, quiz.questionsCount, quiz.duration)} className="w-full gap-2" disabled={loadingQuizId === quiz.id}>
                    <PlayCircle className="h-4 w-4" />
                    {loadingQuizId === quiz.id ? "Generating..." : "Start Quiz"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    </>
  )
}
