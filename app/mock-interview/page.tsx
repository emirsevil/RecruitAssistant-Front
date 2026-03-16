"use client"

import { useState } from "react"

import { PageContainer, PageHeader } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { PlayCircle, Mic, MicOff, Clock, Send, ChevronRight, BarChart3, SkipForward } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useMockInterview } from "@/hooks/use-mock-interview"
import { useToast } from "@/hooks/use-toast"

type InterviewState = "setup" | "active" | "evaluating" | "completed"

const mockQuestions = [
  { id: 1, question: "Tell me about yourself and your background.", topic: "Introduction", aiResponse: true },
  { id: 2, question: "Why are you interested in this role?", topic: "Motivation", aiResponse: false },
  { id: 3, question: "Describe a challenging project you've worked on.", topic: "Experience", aiResponse: false },
]

const mockResults = [
  {
    question: "Tell me about yourself and your background.",
    topic: "Introduction",
    score: 85,
    feedback: "Clear and concise introduction. Good structure.",
  },
  {
    question: "Why are you interested in this role?",
    topic: "Motivation",
    score: 78,
    feedback: "Strong passion shown. Could elaborate more on specific aspects of the role.",
  },
  {
    question: "Describe a challenging project you've worked on.",
    topic: "Experience",
    score: 82,
    feedback: "Excellent use of STAR method. Great technical detail.",
  },
]

export default function MockInterviewPage() {
  const [state, setState] = useState<InterviewState>("setup")
  const [interviewType, setInterviewType] = useState("hr")
  const [difficulty, setDifficulty] = useState("junior")
  const [language, setLanguage] = useState("english")
  const [micEnabled, setMicEnabled] = useState(false)
  const [timeLimit, setTimeLimit] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [notes, setNotes] = useState("")
  const { t } = useLanguage()

  const [workspaceId, setWorkspaceId] = useState("1")
  const [categories, setCategories] = useState("")
  const { questions, setQuestions, isLoading, generateQuestions, saveAnswer, answers, evaluation, isEvaluating, evaluateAnswers } = useMockInterview()
  const { toast } = useToast()

  const startInterview = async () => {
    const success = await generateQuestions({
      workspaceId,
      categories,
      difficulty,
      interviewType
    })

    if (success) {
      setState("active")
      setCurrentQuestion(0)
    } else {
      toast({
        title: "Error",
        description: "Could not generate questions. Does the workspace have a job description?",
        variant: "destructive"
      })
      // Fallback to mockQuestions so development isn't blocked completely
      setQuestions(mockQuestions)
      setState("active")
      setCurrentQuestion(0)
    }
  }

  const nextQuestion = async () => {
    // Save the current answer
    saveAnswer(currentQuestion, userAnswer)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setUserAnswer("")
    } else {
      // Last question — trigger evaluation
      // Pass the current answer as override since saveAnswer setState is async
      setState("evaluating")
      const success = await evaluateAnswers({ index: currentQuestion, answer: userAnswer }, difficulty)
      if (!success) {
        toast({
          title: "Evaluation Error",
          description: "Could not evaluate your answers. Showing results anyway.",
          variant: "destructive"
        })
      }
      setState("completed")
    }
  }

  const passQuestion = async () => {
    saveAnswer(currentQuestion, "(Passed)")

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setUserAnswer("")
    } else {
      setState("evaluating")
      const success = await evaluateAnswers({ index: currentQuestion, answer: "(Passed)" }, difficulty)
      if (!success) {
        toast({
          title: "Evaluation Error",
          description: "Could not evaluate your answers. Showing results anyway.",
          variant: "destructive"
        })
      }
      setState("completed")
    }
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100

  if (state === "setup") {
    return (
      <>
        <PageContainer>
          <PageHeader title={t("Mock Interview")} description={t("Practice your interview skills with AI-powered feedback")} />

          <div className="mx-auto max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>{t("Interview Setup")}</CardTitle>
                <CardDescription>{t("Configure your practice session")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{t("Interview Type")}</Label>
                  <Select value={interviewType} onValueChange={setInterviewType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hr">{t("HR / Behavioral")}</SelectItem>
                      <SelectItem value="technical">{t("Technical")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("Difficulty Level")}</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intern">{t("Intern")}</SelectItem>
                      <SelectItem value="junior">{t("Junior / New Grad")}</SelectItem>
                      <SelectItem value="mid">{t("Mid-Level")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("Workspace ID (For Job Description)")}</Label>
                  <div className="flex">
                    <input className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background" value={workspaceId} onChange={e => setWorkspaceId(e.target.value)} type="number" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("Categories / Topics")}</Label>
                  <Textarea value={categories} onChange={e => setCategories(e.target.value)} placeholder={t("e.g. React, Node.js, System Design...")} />
                </div>

                <div className="space-y-4 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t("Microphone")}</Label>
                      <p className="text-sm text-muted-foreground">{t("Enable voice responses")}</p>
                    </div>
                    <Switch checked={micEnabled} onCheckedChange={setMicEnabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t("Question Time Limit")}</Label>
                      <p className="text-sm text-muted-foreground">{t("2 minutes per question")}</p>
                    </div>
                    <Switch checked={timeLimit} onCheckedChange={setTimeLimit} />
                  </div>
                </div>

                <Button onClick={startInterview} size="lg" className="w-full gap-2" disabled={isLoading}>
                  {isLoading ? (
                    <Clock className="h-5 w-5 animate-spin" />
                  ) : (
                    <PlayCircle className="h-5 w-5" />
                  )}
                  {isLoading ? t("Generating Questions...") : t("Start Interview")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </PageContainer>
      </>
    )
  }

  if (state === "active") {
    const question = questions[currentQuestion]
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2 lg:h-[calc(100vh-140px)]">
            {/* Question & Camera Area */}
            <div className="flex flex-col gap-6">
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{t("Interview Session")}</Badge>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>01:45</span>
                    </div>
                  </div>
                  <Progress value={progress} className="h-2 mb-2" />
                  <CardTitle className="text-xl lg:text-2xl leading-relaxed">{t(questions[currentQuestion].question)}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 bg-muted/30 m-6 rounded-lg border border-dashed flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                    <div className="text-center">
                      <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mic className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">{micEnabled ? t("Listening...") : t("Microphone disabled")}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center gap-4 pb-8">
                  <Button
                    variant={micEnabled ? "default" : "outline"}
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={() => setMicEnabled(!micEnabled)}
                  >
                    {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                </CardFooter>
              </Card>

              {/* Text Input & Actions */}
              <div className="space-y-2">
                <div className="relative">
                  <Textarea
                    placeholder={t("Type your answer here...")}
                    className="min-h-[120px] resize-none pr-12 text-base"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                  />
                  <Button
                    size="icon"
                    className="absolute bottom-4 right-4 h-8 w-8"
                    onClick={nextQuestion}
                    disabled={!userAnswer && !micEnabled}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground gap-1"
                  onClick={passQuestion}
                >
                  <SkipForward className="h-4 w-4" />
                  {t("Pass this question")}
                </Button>
              </div>
            </div>

            {/* AI Feedback & Notes */}
            <div className="flex flex-col gap-6 h-full text-balance">
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    {t("Live Feedback")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-lg bg-yellow-500/10 p-4 text-sm text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
                      <p className="font-semibold mb-1">💡 {t("Tip")}</p>
                      {t("Try to structure your answer using the STAR method (Situation, Task, Action, Result).")}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle>{t("Notes")}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <Textarea
                    placeholder={t("Take notes during the interview...")}
                    className="h-full resize-none border-0 focus-visible:ring-0 p-0"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </CardContent>
              </Card>

            </div>
          </div>
        </main>
      </div>
    )
  }

  // Evaluating state — loading screen
  if (state === "evaluating") {
    return (
      <PageContainer>
        <div className="mx-auto max-w-2xl flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{t("Evaluating Your Answers...")}</h2>
            <p className="text-muted-foreground">{t("Our AI is reviewing your interview performance")}</p>
          </div>
          <Progress value={66} className="w-64 h-2" />
        </div>
      </PageContainer>
    )
  }

  const results = evaluation?.results || mockResults
  const overallScore = evaluation?.overall_score || 0
  const overallFeedback = evaluation?.overall_feedback || ""

  // Completed state
  return (
    <>
      <PageContainer>
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Overall Score */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-8 text-center">
              <div className="mb-2 text-sm font-medium text-muted-foreground">{t("Overall Score")}</div>
              <div className="mb-4 text-6xl font-bold text-primary">{overallScore}%</div>
              <p className="text-sm text-muted-foreground">{overallFeedback || t("Great job! Review your detailed feedback below.")}</p>
            </CardContent>
          </Card>

          {/* Question by Question */}
          <Card>
            <CardHeader>
              <CardTitle>{t("Question-by-Question Breakdown")}</CardTitle>
              <CardDescription>{t("Detailed feedback for each question")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.map((result, idx) => (
                <div key={idx} className="rounded-lg border border-border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2">
                        {t(result.topic)}
                      </Badge>
                      <p className="font-medium text-pretty">{t(result.question)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{result.score}%</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-pretty">{result.feedback}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="flex-1 gap-2" onClick={() => setState("setup")}>
              <PlayCircle className="h-5 w-5" />
              {t("Start Another Interview")}
            </Button>
            <Link href="/quizzes" className="flex-1">
              <Button size="lg" variant="outline" className="w-full gap-2 bg-transparent">
                {t("Practice Weak Topics")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </PageContainer>
    </>
  )
}

function FeedbackMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  )
}
