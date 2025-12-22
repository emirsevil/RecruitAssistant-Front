"use client"

import { useState } from "react"

import { PageContainer, PageHeader } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { PlayCircle, Clock, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Award } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

const categories = ["All", "Algorithms", "Data Structures", "Databases", "OOP", "System Design", "Behavioral"]
const difficulties = ["All", "Easy", "Medium", "Hard"]

const quizzes = [
  {
    id: 1,
    title: "Array Algorithms Basics",
    category: "Algorithms",
    difficulty: "Easy",
    questions: 10,
    duration: "15 min",
    completed: true,
    score: 90,
  },
  {
    id: 2,
    title: "Object-Oriented Programming",
    category: "OOP",
    difficulty: "Medium",
    questions: 12,
    duration: "20 min",
    completed: false,
  },
  {
    id: 3,
    title: "SQL Query Optimization",
    category: "Databases",
    difficulty: "Hard",
    questions: 8,
    duration: "25 min",
    completed: false,
  },
  {
    id: 4,
    title: "System Design Fundamentals",
    category: "System Design",
    difficulty: "Medium",
    questions: 10,
    duration: "18 min",
    completed: true,
    score: 75,
  },
  {
    id: 5,
    title: "Behavioral Questions",
    category: "Behavioral",
    difficulty: "Easy",
    questions: 15,
    duration: "12 min",
    completed: false,
  },
  {
    id: 6,
    title: "Advanced Data Structures",
    category: "Data Structures",
    difficulty: "Hard",
    questions: 3,
    duration: "10 min",
    completed: false,
  },
]

const mockQuizQuestions = [
  {
    id: 1,
    question: "What is the worst-case time complexity for lookup in a Hash Table?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctAnswer: 2,
  },
  {
    id: 2,
    question: "Which data structure is primarily used to implement a Priority Queue?",
    options: ["Stack", "Queue", "Heap", "Linked List"],
    correctAnswer: 2,
  },
  {
    id: 3,
    question: "What is the primary advantage of a B-Tree over a Binary Search Tree?",
    options: ["Faster in-memory search", "Optimized for disk storage", "Simpler implementation", "Uses less memory"],
    correctAnswer: 1,
  },
]

export default function QuizzesPage() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedDifficulty, setSelectedDifficulty] = useState("All")
  const [quizState, setQuizState] = useState<"browse" | "taking" | "results">("browse")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [currentAnswer, setCurrentAnswer] = useState<number | null>(null)
  const { t } = useLanguage()

  const filteredQuizzes = quizzes.filter((quiz) => {
    const categoryMatch = selectedCategory === "All" || quiz.category === selectedCategory
    const difficultyMatch = selectedDifficulty === "All" || quiz.difficulty === selectedDifficulty
    return categoryMatch && difficultyMatch
  })

  const recommendedQuizzes = quizzes.filter((q) => !q.completed).slice(0, 3)

  const startQuiz = () => {
    setQuizState("taking")
    setCurrentQuestion(0)
    setSelectedAnswers([])
    setCurrentAnswer(null)
  }

  const handleNext = () => {
    if (currentAnswer !== null) {
      setSelectedAnswers([...selectedAnswers, currentAnswer])
      setCurrentAnswer(null)

      if (currentQuestion < mockQuizQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
      } else {
        setQuizState("results")
      }
    }
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
      if (answer === mockQuizQuestions[idx].correctAnswer) {
        correct++
      }
    })
    return Math.round((correct / mockQuizQuestions.length) * 100)
  }

  if (quizState === "taking") {
    const question = mockQuizQuestions[currentQuestion]
    const progress = ((currentQuestion + 1) / mockQuizQuestions.length) * 100

    return (
      <>
        <PageContainer>
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setQuizState("browse")}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                {t("Exit Quiz")}
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>12:35</span>
              </div>
            </div>

            <Card>
              <CardHeader>
                <div className="mb-4">
                  <Progress value={progress} className="h-2" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("questions")} {currentQuestion + 1} / {mockQuizQuestions.length}
                  </p>
                </div>
                <CardTitle className="text-xl text-balance">{question.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={currentAnswer?.toString()}
                  onValueChange={(v) => setCurrentAnswer(Number.parseInt(v))}
                >
                  <div className="space-y-3">
                    {question.options.map((option, idx) => (
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
                    {t("Previous")}
                  </Button>
                  <Button onClick={handleNext} disabled={currentAnswer === null}>
                    {currentQuestion < mockQuizQuestions.length - 1 ? t("Next") : t("Finish")}
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
        <PageContainer>
          <div className="mx-auto max-w-3xl space-y-6">
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="p-8 text-center">
                <Award className="mx-auto mb-4 h-16 w-16 text-primary" />
                <div className="mb-2 text-sm font-medium text-muted-foreground">{t("Quiz Complete!")}</div>
                <div className="mb-4 text-6xl font-bold text-primary">{score}%</div>
                <p className="text-sm text-muted-foreground">
                  {t("Your score")}: {selectedAnswers.filter((a, i) => a === mockQuizQuestions[i].correctAnswer).length} / {mockQuizQuestions.length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("Answer Review")}</CardTitle>
                <CardDescription>{t("See which questions you got right and wrong")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockQuizQuestions.map((question, idx) => {
                  const userAnswer = selectedAnswers[idx]
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
                            <span className="font-medium">{t("questions")} {idx + 1}</span>
                          </div>
                          <p className="text-sm text-pretty">{question.question}</p>
                        </div>
                      </div>

                      <div className="space-y-2 rounded-lg bg-secondary/50 p-3 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground">{t("Your answer:")}</span>
                          <span className={isCorrect ? "text-success font-medium" : "text-destructive font-medium"}>
                            {question.options[userAnswer]}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground">{t("Correct answer:")}</span>
                            <span className="text-success font-medium">{question.options[question.correctAnswer]}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {isCorrect
                          ? t("Great job! Your answer demonstrates a solid understanding.")
                          : t("Review this concept to improve your understanding.")}
                      </p>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => setQuizState("browse")}>
                {t("Back to Quizzes")}
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent" onClick={startQuiz}>
                {t("Retry Quiz")}
              </Button>
            </div>
          </div>
        </PageContainer>
      </>
    )
  }

  return (
    <>
      <PageContainer>
        <PageHeader title={t("Quizzes")} description={t("Test your knowledge and track your improvement")} />

        {/* Recommended Quizzes */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">{t("Recommended for You")}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {recommendedQuizzes.map((quiz) => (
              <Card key={quiz.id} className="overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary to-accent" />
                <CardContent className="p-6">
                  <Badge className="mb-3">{t(quiz.category)}</Badge>
                  <h3 className="mb-2 font-semibold">{t(quiz.title)}</h3>
                  <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{quiz.questions} {t("questions")}</span>
                    <span>•</span>
                    <span>{quiz.duration.replace("min", t("min"))}</span>
                  </div>
                  <Button onClick={startQuiz} className="w-full gap-2">
                    <PlayCircle className="h-4 w-4" />
                    {t("Start Quiz")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5"
                onClick={() => setSelectedCategory(category)}
              >
                {t(category)}
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
                {t(difficulty)}
              </Badge>
            ))}
          </div>
        </div>

        {/* All Quizzes */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map((quiz) => (
            <Card key={quiz.id} className="transition-colors hover:border-primary/50">
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <Badge variant="outline">{t(quiz.category)}</Badge>
                  <Badge
                    variant={
                      quiz.difficulty === "Easy"
                        ? "secondary"
                        : quiz.difficulty === "Medium"
                          ? "default"
                          : "destructive"
                    }
                  >
                    {t(quiz.difficulty)}
                  </Badge>
                </div>
                <h3 className="mb-2 font-semibold text-balance">{t(quiz.title)}</h3>
                <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{quiz.questions} {t("questions")}</span>
                  <span>•</span>
                  <span>{quiz.duration.replace("min", t("min"))}</span>
                </div>
                {quiz.completed ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("Your score")}</span>
                      <span className="font-semibold text-primary">{quiz.score}%</span>
                    </div>
                    <Button onClick={startQuiz} variant="outline" className="w-full bg-transparent">
                      {t("Retake Quiz")}
                    </Button>
                  </div>
                ) : (
                  <Button onClick={startQuiz} className="w-full gap-2">
                    <PlayCircle className="h-4 w-4" />
                    {t("Start Quiz")}
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
