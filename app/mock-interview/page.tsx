"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { PageContainer, PageHeader } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { PlayCircle, Mic, MicOff, Clock, Send, ChevronRight, BarChart3 } from "lucide-react"
import Link from "next/link"

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
        <Navigation />
        <PageContainer>
          <PageHeader title="Mock Interview" description="Practice your interview skills with AI-powered feedback" />

          <div className="mx-auto max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Interview Setup</CardTitle>
                <CardDescription>Configure your practice session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Interview Type</Label>
                  <Select value={interviewType} onValueChange={setInterviewType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hr">HR / Behavioral</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intern">Intern</SelectItem>
                      <SelectItem value="junior">Junior / New Grad</SelectItem>
                      <SelectItem value="mid">Mid-Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="spanish">Spanish</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                      <SelectItem value="german">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Microphone</Label>
                      <p className="text-sm text-muted-foreground">Enable voice responses</p>
                    </div>
                    <Switch checked={micEnabled} onCheckedChange={setMicEnabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Question Time Limit</Label>
                      <p className="text-sm text-muted-foreground">2 minutes per question</p>
                    </div>
                    <Switch checked={timeLimit} onCheckedChange={setTimeLimit} />
                  </div>
                </div>

                <Button onClick={startInterview} size="lg" className="w-full gap-2">
                  <PlayCircle className="h-5 w-5" />
                  Start Interview
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
      <>
        <Navigation />
        <PageContainer className="pb-0">
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
            <p className="mt-2 text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {mockQuestions.length}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
            {/* Chat Panel */}
            <Card className="flex flex-col">
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle>Interview Session</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>15:42</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 p-6">
                {/* Question */}
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    AI
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="rounded-2xl rounded-tl-sm bg-secondary px-4 py-3">
                      <p className="text-sm leading-relaxed">{question.question}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {question.topic}
                      </Badge>
                      {timeLimit && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          1:45 remaining
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Answer (if any) */}
                {userAnswer && (
                  <div className="flex items-start gap-3 justify-end">
                    <div className="flex-1 space-y-2 text-right">
                      <div className="inline-block rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-left text-primary-foreground">
                        <p className="text-sm leading-relaxed">{userAnswer}</p>
                      </div>
                    </div>
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                      You
                    </div>
                  </div>
                )}
              </CardContent>
              <div className="border-t border-border p-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your answer here..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                  <div className="flex flex-col gap-2">
                    <Button size="icon" variant="outline" onClick={() => setMicEnabled(!micEnabled)}>
                      {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" onClick={nextQuestion}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Feedback Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Live Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FeedbackMetric label="Clarity" value={82} />
                  <FeedbackMetric label="Technical Depth" value={75} />
                  <FeedbackMetric label="Communication" value={88} />
                  <FeedbackMetric label="Confidence" value={80} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Take notes during the interview..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                </CardContent>
              </Card>

              <Card className="bg-secondary/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
                    Tip: Use the STAR method (Situation, Task, Action, Result) to structure your behavioral answers.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </PageContainer>
      </>
    )
  }

  // Completed state
  return (
    <>
      <Navigation />
      <PageContainer>
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Overall Score */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-8 text-center">
              <div className="mb-2 text-sm font-medium text-muted-foreground">Overall Score</div>
              <div className="mb-4 text-6xl font-bold text-primary">82%</div>
              <p className="text-sm text-muted-foreground">Great job! You've improved from your last interview.</p>
            </CardContent>
          </Card>

          {/* Performance Radar */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Your strengths and areas for improvement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-center justify-center rounded-lg bg-secondary/50">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="mx-auto mb-2 h-12 w-12" />
                  <p className="text-sm">Radar Chart Visualization</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question by Question */}
          <Card>
            <CardHeader>
              <CardTitle>Question-by-Question Breakdown</CardTitle>
              <CardDescription>Detailed feedback for each question</CardDescription>
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
              Start Another Interview
            </Button>
            <Link href="/quizzes" className="flex-1">
              <Button size="lg" variant="outline" className="w-full gap-2 bg-transparent">
                Practice Weak Topics
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
