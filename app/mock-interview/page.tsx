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
import { PlayCircle, Mic, MicOff, Clock, Send, ChevronRight, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

type InterviewState = "setup" | "active" | "completed"

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

  const startInterview = () => {
    setState("active")
    setCurrentQuestion(0)
  }

  const nextQuestion = () => {
    if (currentQuestion < mockQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setUserAnswer("")
    } else {
      setState("completed")
    }
  }

  const progress = ((currentQuestion + 1) / mockQuestions.length) * 100

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
                  <Label>{t("Language")}</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">{t("English")}</SelectItem>
                      <SelectItem value="spanish">{t("Spanish")}</SelectItem>
                      <SelectItem value="french">{t("French")}</SelectItem>
                      <SelectItem value="german">{t("German")}</SelectItem>
                    </SelectContent>
                  </Select>
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

                <Button onClick={startInterview} size="lg" className="w-full gap-2">
                  <PlayCircle className="h-5 w-5" />
                  {t("Start Interview")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </PageContainer>
      </>
    )
  }

  if (state === "active") {
    const question = mockQuestions[currentQuestion]
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
                  <CardTitle className="text-xl lg:text-2xl leading-relaxed">{mockQuestions[currentQuestion].question}</CardTitle>
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

              {/* Text Input Fallback */}
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

  // Completed state
  return (
    <>
      <PageContainer>
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Overall Score */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-8 text-center">
              <div className="mb-2 text-sm font-medium text-muted-foreground">{t("Overall Score")}</div>
              <div className="mb-4 text-6xl font-bold text-primary">82%</div>
              <p className="text-sm text-muted-foreground">{t("Great job! You've improved from your last interview.")}</p>
            </CardContent>
          </Card>

          {/* Performance Radar */}
          <Card>
            <CardHeader>
              <CardTitle>{t("Performance Overview")}</CardTitle>
              <CardDescription>{t("Your strengths and areas for improvement")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-center justify-center rounded-lg bg-secondary/50">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="mx-auto mb-2 h-12 w-12" />
                  <p className="text-sm">{t("Radar Chart Visualization")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question by Question */}
          <Card>
            <CardHeader>
              <CardTitle>{t("Question-by-Question Breakdown")}</CardTitle>
              <CardDescription>{t("Detailed feedback for each question")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockResults.map((result, idx) => (
                <div key={idx} className="rounded-lg border border-border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2">
                        {result.topic}
                      </Badge>
                      <p className="font-medium text-pretty">{result.question}</p>
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
