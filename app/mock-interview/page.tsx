"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
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
  const { t } = useTranslation()
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
          <PageHeader title={t('mockInterview.title')} description={t('mockInterview.description')} />

          <div className="mx-auto max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>{t('mockInterview.setupTitle')}</CardTitle>
                <CardDescription>{t('mockInterview.setupDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{t('mockInterview.interviewType')}</Label>
                  <Select value={interviewType} onValueChange={setInterviewType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hr">{t('mockInterview.types.hr')}</SelectItem>
                      <SelectItem value="technical">{t('mockInterview.types.technical')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('mockInterview.difficultyLevel')}</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intern">{t('mockInterview.difficulties.intern')}</SelectItem>
                      <SelectItem value="junior">{t('mockInterview.difficulties.junior')}</SelectItem>
                      <SelectItem value="mid">{t('mockInterview.difficulties.mid')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('mockInterview.language')}</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">{t('mockInterview.languages.english')}</SelectItem>
                      <SelectItem value="spanish">{t('mockInterview.languages.spanish')}</SelectItem>
                      <SelectItem value="french">{t('mockInterview.languages.french')}</SelectItem>
                      <SelectItem value="german">{t('mockInterview.languages.german')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t('mockInterview.microphone')}</Label>
                      <p className="text-sm text-muted-foreground">{t('mockInterview.enableVoice')}</p>
                    </div>
                    <Switch checked={micEnabled} onCheckedChange={setMicEnabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t('mockInterview.questionTimeLimit')}</Label>
                      <p className="text-sm text-muted-foreground">{t('mockInterview.timeLimitDesc')}</p>
                    </div>
                    <Switch checked={timeLimit} onCheckedChange={setTimeLimit} />
                  </div>
                </div>

                <Button onClick={startInterview} size="lg" className="w-full gap-2">
                  <PlayCircle className="h-5 w-5" />
                  {t('mockInterview.startInterview')}
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
              {t('mockInterview.progress', { current: currentQuestion + 1, total: mockQuestions.length })}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
            {/* Chat Panel */}
            <Card className="flex flex-col">
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle>{t('mockInterview.session')}</CardTitle>
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
                          1:45 {t('mockInterview.remaining')}
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
                    placeholder={t('mockInterview.typeAnswer')}
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
                  <CardTitle className="text-lg">{t('mockInterview.liveFeedback')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FeedbackMetric label={t('mockInterview.clarity')} value={82} />
                  <FeedbackMetric label={t('mockInterview.technicalDepth')} value={75} />
                  <FeedbackMetric label={t('mockInterview.communication')} value={88} />
                  <FeedbackMetric label={t('mockInterview.confidence')} value={80} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('mockInterview.notes')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder={t('mockInterview.takeNotes')}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                </CardContent>
              </Card>

              <Card className="bg-secondary/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
                    {t('mockInterview.tip')} {t('mockInterview.tipContent')}
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
              <div className="mb-2 text-sm font-medium text-muted-foreground">{t('mockInterview.overallScore')}</div>
              <div className="mb-4 text-6xl font-bold text-primary">82%</div>
              <p className="text-sm text-muted-foreground">{t('mockInterview.greatJob')}</p>
            </CardContent>
          </Card>

          {/* Performance Radar */}
          <Card>
            <CardHeader>
              <CardTitle>{t('mockInterview.performanceOverview')}</CardTitle>
              <CardDescription>{t('mockInterview.strengthsWeaknesses')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-center justify-center rounded-lg bg-secondary/50">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="mx-auto mb-2 h-12 w-12" />
                  <p className="text-sm">{t('mockInterview.viz')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question by Question */}
          <Card>
            <CardHeader>
              <CardTitle>{t('mockInterview.breakdown')}</CardTitle>
              <CardDescription>{t('mockInterview.breakdownDesc')}</CardDescription>
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
              {t('mockInterview.startAnother')}
            </Button>
            <Link href="/quizzes" className="flex-1">
              <Button size="lg" variant="outline" className="w-full gap-2 bg-transparent">
                {t('mockInterview.practiceWeak')}
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
