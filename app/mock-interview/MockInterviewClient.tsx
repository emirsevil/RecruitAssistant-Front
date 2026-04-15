"use client"

import { useState, useRef, useEffect, type CSSProperties } from "react"
import { useSearchParams, useRouter } from "next/navigation"

import { PageContainer, PageHeader } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { PlayCircle, Mic, MicOff, Send, ChevronRight, BarChart3, SkipForward, Phone, PhoneOff, Volume2, Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useVoiceInterview } from "@/hooks/use-voice-interview"
import { useToast } from "@/hooks/use-toast"
import { useWorkspace } from "@/lib/workspace-context"

type InterviewState = "setup" | "active" | "evaluating" | "completed"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"


const AVATAR_IDLE_FRAME = "/avatar/interviewer.png"
const AVATAR_FRAME_STYLE = {
  objectPosition: "50% 0%",
  scale: 1.08,
}
const AVATAR_SPEAKING_FRAMES = [
  { src: "/avatar/interviewer-1.png", duration: 240 },
  { src: "/avatar/interviewer-2.png", duration: 310 },
  { src: "/avatar/interviewer-1.png", duration: 210 },
  { src: "/avatar/interviewer.png", duration: 200 },
  { src: "/avatar/interviewer-3.png", duration: 300 },
  { src: "/avatar/interviewer-2.png", duration: 370 },
  { src: "/avatar/interviewer-1.png", duration: 260 },
  { src: "/avatar/interviewer-1.png", duration: 330 },
  { src: "/avatar/interviewer-2.png", duration: 280 },
  { src: "/avatar/interviewer.png", duration: 100 },
]

export default function MockInterviewClient() {
  const [state, setState] = useState<InterviewState>("setup")
  const [interviewType, setInterviewType] = useState("hr")
  const [difficulty, setDifficulty] = useState("junior")
  const [userAnswer, setUserAnswer] = useState("")
  const { t } = useLanguage()

  const { activeWorkspace } = useWorkspace()
  const [categories, setCategories] = useState("")
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Voice interview hook (sole pipeline)
  const voice = useVoiceInterview()

  // Back-button guard: check if returning to a completed interview
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)
  const [completedInterviewId, setCompletedInterviewId] = useState<number | null>(null)

  useEffect(() => {
    const existingId = searchParams.get("id")
    if (existingId) {
      fetch(`${API_BASE_URL}/interviews/${existingId}`, {
        credentials: "include"
      })
        .then((res) => {
          if (!res.ok) return null
          return res.json()
        })
        .then((data) => {
          if (data && data.status === "completed") {
            setAlreadyCompleted(true)
            setCompletedInterviewId(parseInt(existingId))
          }
        })
        .catch(() => {})
    }
  }, [searchParams])

  const conversationScrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll only inside the conversation panel
  useEffect(() => {
    const el = conversationScrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [voice.conversationLog])

  // Push interview ID into URL for back-button guard
  useEffect(() => {
    if (voice.interviewId && state === "active") {
      router.replace(`/mock-interview?id=${voice.interviewId}`, { scroll: false })
    }
  }, [voice.interviewId, state, router])

  const startInterview = async () => {
    if (!activeWorkspace) {
      toast({
        title: t("Warning"),
        description: t("Please select a workspace from the top menu first."),
        variant: "destructive",
      })
      return
    }

    setState("active")
    voice.startSession({
      workspaceId: Number(activeWorkspace.id),
      categories: categories || "Genel",
      difficulty,
      interviewType: interviewType,
    })
  }

  // ─── Voice mode state transitions ──────────────────────────────

  useEffect(() => {
    if (voice.sessionState === "evaluating") {
      voice.stopPlayback()
      setState("evaluating")
    }
    if (voice.sessionState === "done") {
      voice.stopPlayback()
      setState("completed")
    }
  }, [voice.sessionState])

  // Show voice errors
  useEffect(() => {
    if (voice.error) {
      toast({
        title: t("Error"),
        description: voice.error,
        variant: "destructive",
      })
    }
  }, [voice.error, toast, t])

  // Clear textarea when AI starts speaking a new question
  useEffect(() => {
    if (voice.sessionState === "ai_speaking") {
      setUserAnswer("")
    }
  }, [voice.sessionState])

  // When pending transcript arrives (mic toggled off → Whisper done), populate the textarea
  useEffect(() => {
    if (voice.pendingTranscript) {
      setUserAnswer((prev) => {
        if (prev.trim()) {
          return prev + " " + voice.pendingTranscript
        }
        return voice.pendingTranscript
      })
    }
  }, [voice.pendingTranscript])

  const progress = voice.questions.length > 0
    ? ((voice.currentQuestionIndex + 1) / voice.questions.length) * 100
    : 0

  // Handle mic toggle
  const handleMicToggle = async () => {
    if (voice.micActive) {
      voice.toggleMic()
      await voice.transcribeRecording()
    } else {
      voice.toggleMic()
    }
  }

  // Handle submit
  const handleSubmit = () => {
    if (!userAnswer.trim()) return
    voice.submitTextAnswer(userAnswer.trim())
    setUserAnswer("")
  }

  // ─── Already Completed Guard ────────────────────────────────────

  if (alreadyCompleted) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-2xl flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{t("Interview Already Completed")}</h2>
            <p className="text-muted-foreground">{t("This interview has already been completed and evaluated.")}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {completedInterviewId && (
              <Link href="/interview-history">
                <Button size="lg" className="gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t("View Results")}
                </Button>
              </Link>
            )}
            <Button
              size="lg"
              variant="outline"
              className="gap-2"
              onClick={() => {
                setAlreadyCompleted(false)
                setCompletedInterviewId(null)
                router.replace("/mock-interview")
              }}
            >
              <PlayCircle className="h-5 w-5" />
              {t("Start New Interview")}
            </Button>
          </div>
        </div>
      </PageContainer>
    )
  }

  // ─── Setup Screen ──────────────────────────────────────────────

  if (state === "setup") {
    return (
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

              {activeWorkspace && (
                <div className="rounded-lg bg-primary/5 p-4 border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-1">{t("Active Workspace")}</p>
                  <p className="text-lg font-bold">{activeWorkspace.name}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>{t("Categories / Topics")}</Label>
                <Textarea value={categories} onChange={e => setCategories(e.target.value)} placeholder={t("e.g. React, Node.js, System Design...")} />
              </div>

              <Button onClick={startInterview} size="lg" className="w-full gap-2">
                <Phone className="h-5 w-5" />
                {t("Start Interview")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    )
  }

  // ─── Active Interview ─────────────────

  if (state === "active") {
    const activeQuestions = voice.questions
    const activeQIndex = voice.currentQuestionIndex
    const activeQuestion = activeQuestions[activeQIndex]

    return (
      <div className="flex min-h-screen flex-col bg-background">
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${
                    voice.connectionStatus === "connected" ? "bg-green-500" : 
                    voice.connectionStatus === "connecting" ? "bg-yellow-500 animate-pulse" : 
                    "bg-red-500"
                  }`} />
                  {voice.connectionStatus === "connected" ? t("Connected") :
                   voice.connectionStatus === "connecting" ? t("Connecting...") :
                   t("Disconnected")}
                </Badge>
                <Badge variant="outline">{t("Interview Session")}</Badge>
              </div>
              <Button variant="destructive" size="sm" className="gap-1.5" onClick={voice.endSession}>
                <PhoneOff className="h-4 w-4" />
                {t("End Interview")}
              </Button>
            </div>

            {activeQuestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t("Question")} {activeQIndex + 1} / {activeQuestions.length}</span>
                  <span>{activeQuestion?.topic || ""}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3 space-y-6">
                {activeQuestion && (
                  <Card>
                    <CardHeader className="pb-3">
                      <Badge variant="secondary" className="w-fit text-xs">{activeQuestion.topic}</Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-medium leading-relaxed">{activeQuestion.question}</p>
                    </CardContent>
                  </Card>
                )}

                {(voice.isAiSpeaking || voice.sessionState === "processing" || voice.sessionState === "idle") && (
                  <Card className="overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col items-center justify-center gap-6">
                        {voice.isAiSpeaking && (
                          <div className="w-full text-center space-y-4">
                            <InterviewerAvatarDisplay isSpeaking />
                            <p className="text-sm font-medium text-muted-foreground">{t("AI is speaking...")}</p>
                            <Button variant="outline" size="sm" onClick={voice.interrupt} className="gap-1.5">
                              <Mic className="h-4 w-4" />
                              {t("Interrupt & Speak")}
                            </Button>
                          </div>
                        )}
                        {voice.sessionState === "processing" && (
                          <div className="text-center space-y-4">
                            <InterviewerAvatarDisplay />
                            <p className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                              {t("Processing your answer...")}
                            </p>
                          </div>
                        )}
                        {voice.sessionState === "idle" && (
                          <div className="text-center space-y-4">
                            <InterviewerAvatarDisplay />
                            <p className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {t("Preparing interview...")}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {voice.isListening && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        {t("Your Answer")}
                        {voice.isTranscribing && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {t("Transcribing...")}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="relative">
                          <Textarea
                            placeholder={t("Record with the microphone or type your answer here...")}
                            className="min-h-[120px] resize-none pr-12 text-base"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            disabled={voice.isTranscribing}
                          />
                          {voice.micActive && (
                            <div className="absolute top-2 right-2">
                              <Badge variant="destructive" className="gap-1 text-xs animate-pulse">
                                {t("Recording")}
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <Button 
                            size="sm" 
                            variant={voice.micActive ? "destructive" : "outline"}
                            className="gap-1.5"
                            onClick={handleMicToggle}
                            disabled={voice.isTranscribing}
                          >
                            {voice.micActive ? <><MicOff className="h-4 w-4" />{t("Stop")}</> : <><Mic className="h-4 w-4" />{t("Record")}</>}
                          </Button>

                          <Button size="sm" className="gap-1.5" onClick={handleSubmit} disabled={!userAnswer.trim() || voice.micActive || voice.isTranscribing}>
                            <Send className="h-4 w-4" />
                            {t("Submit")}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-center gap-3 border-t bg-muted/20 p-4">
                      <Button variant="ghost" size="sm" className="text-muted-foreground gap-1" onClick={() => { setUserAnswer(""); voice.passQuestion(); }} disabled={voice.sessionState !== "listening"}>
                        <SkipForward className="h-4 w-4" />
                        {t("Pass")}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 gap-1" onClick={voice.endSession}>
                        <PhoneOff className="h-4 w-4" />
                        {t("End")}
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </div>

              <div className="lg:col-span-2">
                <Card className="h-full flex flex-col">
                  <CardHeader><CardTitle className="text-base">{t("Conversation")}</CardTitle></CardHeader>
                  <CardContent className="flex-1 p-0 overflow-hidden">
                    <div ref={conversationScrollRef} className="max-h-[60vh] overflow-y-auto space-y-3 px-6 pb-6">
                      {voice.conversationLog.map((entry, idx) => (
                        <div
                          key={idx}
                          className={`flex gap-2 ${
                            entry.role === "interviewer" ? "" : "flex-row-reverse"
                          }`}
                        >
                          {entry.role === "interviewer" && (
                            <img
                              src="/avatar/interviewer.png"
                              alt={t("AI interviewer")}
                              className="mt-1 h-8 w-8 shrink-0 rounded-md border object-cover object-top"
                            />
                          )}
                          <div
                            className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                              entry.role === "interviewer"
                                ? "bg-primary/10 text-foreground"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            <p className="text-xs font-medium mb-1 opacity-60">
                              {entry.role === "interviewer" ? t("AI Interviewer") : "👤 Sen"}
                            </p>
                            <p className="leading-relaxed">{entry.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ─── Evaluating State ─────────────────

  if (state === "evaluating") {
    return (
      <PageContainer>
        <div className="mx-auto max-w-2xl flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <BarChart3 className="h-12 w-12 text-primary animate-pulse" />
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{t("Evaluating Your Answers...")}</h2>
            <p className="text-muted-foreground">{t("Reviewing your performance")}</p>
          </div>
          <Progress value={66} className="w-64 h-2" />
        </div>
      </PageContainer>
    )
  }

  // ─── Completed State ─────────────────

  const finalEvaluation = voice.evaluation
  const results = finalEvaluation?.results || []
  const overallScore = finalEvaluation?.overall_score || 0
  const overallFeedback = finalEvaluation?.overall_feedback || ""

  return (
    <PageContainer>
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="border-2 border-primary/20 bg-primary/5 p-8 text-center">
          <div className="mb-2 text-sm font-medium text-muted-foreground">{t("Overall Score")}</div>
          <div className="mb-4 text-6xl font-bold text-primary">{overallScore}%</div>
          <p className="text-sm text-muted-foreground">{overallFeedback || t("Review your feedback below.")}</p>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("Detailed Feedback")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {results.map((result, idx) => (
              <div key={idx} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2">{t(result.topic)}</Badge>
                    <p className="font-medium">{t(result.question)}</p>
                  </div>
                  <div className="text-2xl font-bold text-primary">{result.score}%</div>
                </div>
                <p className="text-sm text-muted-foreground">{result.feedback}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row pb-20">
          <Button size="lg" className="flex-1 gap-2" onClick={() => { voice.disconnect(); setState("setup"); }}>
            <PlayCircle className="h-5 w-5" />
            {t("Start Another Interview")}
          </Button>
          <Link href="/dashboard" className="flex-1">
            <Button size="lg" variant="outline" className="w-full">{t("Return to Dashboard")}</Button>
          </Link>
        </div>
      </PageContainer>
    </>
  )
}

function InterviewerAvatarDisplay({
  isSpeaking = false,
}: {
  isSpeaking?: boolean
}) {
  const [frameIndex, setFrameIndex] = useState(0)

  useEffect(() => {
    for (const src of [AVATAR_IDLE_FRAME, ...AVATAR_SPEAKING_FRAMES.map((frame) => frame.src)]) {
      const image = new Image()
      image.src = src
    }
  }, [])

  useEffect(() => {
    if (!isSpeaking) {
      setFrameIndex(0)
      return
    }

    const currentFrame = AVATAR_SPEAKING_FRAMES[frameIndex]
    const timeout = window.setTimeout(() => {
      setFrameIndex((index) => (index + 1) % AVATAR_SPEAKING_FRAMES.length)
    }, currentFrame.duration)

    return () => window.clearTimeout(timeout)
  }, [frameIndex, isSpeaking])

  const currentFrame = isSpeaking ? AVATAR_SPEAKING_FRAMES[frameIndex] : null
  const avatarFrame = currentFrame?.src || AVATAR_IDLE_FRAME
  const imageStyle = {
    objectPosition: AVATAR_FRAME_STYLE.objectPosition,
    transform: `scale(${AVATAR_FRAME_STYLE.scale})`,
  } satisfies CSSProperties

  return (
    <div className="mx-auto w-full space-y-3">
      <div
        className={`relative mx-auto h-[380px] w-[270px] overflow-hidden rounded-lg border bg-muted shadow-sm sm:h-[470px] sm:w-[335px] ${
          isSpeaking ? "ring-2 ring-primary/30" : ""
        }`}
      >
        <div className="absolute inset-0 origin-center">
          <img
            src={avatarFrame}
            alt="AI interviewer"
            draggable={false}
            style={imageStyle}
            className="h-full w-full select-none object-cover transition-[transform,opacity] duration-150 ease-out"
          />
        </div>
        {isSpeaking && (
          <div className="absolute bottom-2 right-2 rounded-md bg-background/85 p-1.5 text-primary shadow-sm">
            <Volume2 className="h-4 w-4 animate-pulse" />
          </div>
        )}
      </div>
      {isSpeaking && (
        <div className="mx-auto h-1.5 w-36 overflow-hidden rounded-full bg-primary/10">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
        </div>
      )}
    </div>
  )
}

function FeedbackMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value}%</span>
      </div>
    </PageContainer>
  )
}
