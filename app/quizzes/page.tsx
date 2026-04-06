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
import { useQuizzes, type QuizGroup, type AnswerItem } from "@/hooks/use-quizzes"
import { useEffect } from "react"


const workspaceId = 1
const userId = 1

export default function QuizzesPage() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedDifficulty, setSelectedDifficulty] = useState("All")
  const [quizState, setQuizState] = useState<"browse" | "taking" | "results">("browse")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [currentAnswer, setCurrentAnswer] = useState<number | null>(null)
  
  const { quizGroups, userScores, isLoading, error, submitResult, fetchWorkspaceQuizzes, fetchUserScores, submitQuiz } = useQuizzes()
  const [activeQuizGroup, setActiveQuizGroup] = useState<QuizGroup | null>(null)
  
  const { t } = useLanguage()

  useEffect(() => {
    fetchWorkspaceQuizzes(workspaceId)
    fetchUserScores(userId)
  }, [])

  const categories = ["All", ...Array.from(new Set(quizGroups.map(g => g.title)))]
  const difficulties = ["All", "Easy", "Medium", "Hard"]

  const getGroupScore = (title: string, difficulty: string) => {
    const scores = userScores.filter(s => s.quiz_title === title && s.difficulty === difficulty)
    if (scores.length === 0) return null
    return Math.max(...scores.map(s => s.score))
  }

  const filteredQuizzes = quizGroups.filter((group) => {
    const categoryMatch = selectedCategory === "All" || group.title === selectedCategory
    // Check if any question in the group matches difficulty or just use a default
    // For now backend gives "Balanced mix" so we filter titles mostly
    return categoryMatch
  })

  const recommendedQuizzes = quizGroups.filter((g) => getGroupScore(g.title, g.difficulty) === null).slice(0, 3)

  const startQuiz = (group: QuizGroup) => {
    setActiveQuizGroup(group)
    setQuizState("taking")
    setCurrentQuestion(0)
    // Initialize an array of nulls for each question
    setSelectedAnswers(new Array(group.questions.length).fill(null))
    setCurrentAnswer(null)
  }

  const handleNext = async () => {
    if (activeQuizGroup && currentAnswer !== null) {
      // Save current answer to its specific index
      const newAnswers = [...selectedAnswers]
      newAnswers[currentQuestion] = currentAnswer
      setSelectedAnswers(newAnswers)

      if (currentQuestion < activeQuizGroup.questions.length - 1) {
        const nextIdx = currentQuestion + 1
        setCurrentQuestion(nextIdx)
        // Load the next answer if it exists (for navigation purposes)
        setCurrentAnswer(selectedAnswers[nextIdx] ?? null)
      } else {
        // Final Submit: use the updated answers array
        const finalAnswers = [...newAnswers]
        const submission = {
          user_id: userId,
          workspace_id: workspaceId,
          quiz_title: activeQuizGroup.title,
          difficulty: activeQuizGroup.difficulty,
          answers: activeQuizGroup.questions.map((q, idx) => ({
            quiz_id: q.id,
            selected_answer: q.options[finalAnswers[idx] as number]
          }))
        }
        await submitQuiz(submission)
        setQuizState("results")
        fetchUserScores(userId)
      }
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0 && activeQuizGroup) {
      const newAnswers = [...selectedAnswers]
      if (currentAnswer !== null) {
        newAnswers[currentQuestion] = currentAnswer
        setSelectedAnswers(newAnswers)
      }

      const prevIdx = currentQuestion - 1
      setCurrentQuestion(prevIdx)
      // Load the previous answer from the state
      setCurrentAnswer(selectedAnswers[prevIdx] ?? null)
    }
  }


  if (quizState === "taking" && activeQuizGroup) {
    const question = activeQuizGroup.questions[currentQuestion]
    const progress = ((currentQuestion + 1) / activeQuizGroup.questions.length) * 100

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
                <span>{activeQuizGroup.title}</span>
              </div>
            </div>

            <Card>
              <CardHeader>
                <div className="mb-4">
                  <Progress value={progress} className="h-2" />
                  <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                    <p>
                      {t("questions")} {currentQuestion + 1} / {activeQuizGroup.questions.length}
                    </p>
                    {question.difficulty && (
                      <Badge variant="outline" className="text-[10px] scale-90">
                        {t(question.difficulty)}
                      </Badge>
                    )}
                  </div>
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
                  <Button onClick={handleNext} disabled={currentAnswer === null || isLoading}>
                    {isLoading ? (
                      <Clock className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {currentQuestion < activeQuizGroup.questions.length - 1 ? t("Next") : t("Finish")}
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

  if (quizState === "results" && submitResult) {
    return (
      <>
        <PageContainer>
          <div className="mx-auto max-w-3xl space-y-6">
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="p-8 text-center">
                <Award className="mx-auto mb-4 h-16 w-16 text-primary" />
                <div className="mb-2 text-sm font-medium text-muted-foreground">{t("Quiz Complete!")}</div>
                <div className="mb-4 text-6xl font-bold text-primary">{submitResult.score}%</div>
                <p className="text-sm text-muted-foreground">
                  {t("Your score")}: {submitResult.correct_count} / {submitResult.total_questions}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("Answer Review")}</CardTitle>
                <CardDescription>{t("See which questions you got right and wrong")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {submitResult.results.map((result, idx) => (
                  <div key={idx} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          {result.is_correct ? (
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                          <span className="font-medium">{t("questions")} {idx + 1}</span>
                        </div>
                        <p className="text-sm text-pretty">{result.question}</p>
                      </div>
                    </div>

                    <div className="space-y-2 rounded-lg bg-secondary/50 p-3 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground">{t("Your answer:")}</span>
                        <span className={result.is_correct ? "text-success font-medium" : "text-destructive font-medium"}>
                          {result.selected_answer}
                        </span>
                      </div>
                      {!result.is_correct && (
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground">{t("Correct answer:")}</span>
                          <span className="text-success font-medium">{result.correct_answer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => setQuizState("browse")}>
                {t("Back to Quizzes")}
              </Button>
              {activeQuizGroup && (
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => startQuiz(activeQuizGroup)}>
                  {t("Retry Quiz")}
                </Button>
              )}
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
            {recommendedQuizzes.length === 0 && !isLoading && (
              <p className="col-span-full text-center py-8 text-muted-foreground">
                {t("All quizzes completed! Check the list below to retake them.")}
              </p>
            )}
            {recommendedQuizzes.map((group) => (
              <Card key={group.title} className="overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary to-accent" />
                <CardContent className="p-6">
                  <div className="mb-3 flex justify-between items-start">
                    <Badge variant="outline">{t("Technical")}</Badge>
                    <Badge 
                      variant={
                        group.difficulty === "Easy" ? "secondary" : 
                        group.difficulty === "Medium" ? "default" : 
                        "destructive"
                      }
                    >
                      {t(group.difficulty)}
                    </Badge>
                  </div>
                  <h3 className="mb-2 font-semibold text-balance">{group.title}</h3>
                  <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{group.questions.length} {t("questions")}</span>
                  </div>
                  <Button onClick={() => startQuiz(group)} className="w-full gap-2">
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
          {isLoading && quizGroups.length === 0 && (
            <div className="col-span-full text-center py-12">
               <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
               <p>{t("Loading quizzes...")}</p>
            </div>
          )}
          {filteredQuizzes.map((group) => {
            const score = getGroupScore(group.title, group.difficulty)
            const completed = score !== null

            return (
              <Card key={group.title} className="transition-colors hover:border-primary/50">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <Badge variant="outline">{t("Technical")}</Badge>
                    <Badge 
                      variant={
                        group.difficulty === "Easy" ? "secondary" : 
                        group.difficulty === "Medium" ? "default" : 
                        "destructive"
                      }
                    >
                       {t(group.difficulty)}
                    </Badge>
                  </div>
                  <h3 className="mb-2 font-semibold text-balance">{group.title}</h3>
                  <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{group.questions.length} {t("questions")}</span>
                  </div>
                  {completed ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t("Your score")}</span>
                        <span className="font-semibold text-primary">{score}%</span>
                      </div>
                      <Button onClick={() => startQuiz(group)} variant="outline" className="w-full bg-transparent">
                        {t("Retake Quiz")}
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => startQuiz(group)} className="w-full gap-2">
                      <PlayCircle className="h-4 w-4" />
                      {t("Start Quiz")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </PageContainer>
    </>
  )
}
