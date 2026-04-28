"use client"

import { useState, useRef, useEffect, type CSSProperties } from "react"
import { useSearchParams, useRouter } from "next/navigation"

import { PageContainer, PageHeader } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { PlayCircle, Mic, MicOff, Send, ChevronRight, BarChart3, SkipForward, Phone, PhoneOff, Volume2, Loader2, CheckCircle2, Check, Tag } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useVoiceInterview } from "@/hooks/use-voice-interview"
import { useToast } from "@/hooks/use-toast"
import { useWorkspace } from "@/lib/workspace-context"
import { useMicLevel } from "@/hooks/use-mic-level"
import { RingProgress } from "@/components/calm/ring-progress"

const WAVE_BARS = 20

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

  // Clear categories when switching to HR (categories are only for technical)
  const handleInterviewTypeChange = (value: string) => {
    setInterviewType(value)
    if (value === "hr") {
      setSelectedCategories([])
    }
  }
  const [difficulty, setDifficulty] = useState("junior")
  const [userAnswer, setUserAnswer] = useState("")
  const { t } = useLanguage()

  const { activeWorkspace } = useWorkspace()
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // Reset selection when switching interview type or workspace so the user starts
  // with a blank slate and explicitly opts in to the categories they want.
  useEffect(() => {
    setSelectedCategories([])
  }, [activeWorkspace?.id, interviewType])
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Voice interview hook (sole pipeline)
  const voice = useVoiceInterview()

  // Live mic amplitude → wave bars only animate when the user actually speaks
  const micLevels = useMicLevel(voice.micActive, WAVE_BARS)

  // Back-button guard: check if returning to a completed interview
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)
  const [completedInterviewId, setCompletedInterviewId] = useState<number | null>(null)

  // In-progress session guard: if a previous interview was abandoned (refresh,
  // tab close, etc.), prompt the user to discard it before starting a new one.
  const [inProgressInterview, setInProgressInterview] = useState<{
    id: number
    interview_type: string
    created_at: string
  } | null>(null)
  const [isDiscarding, setIsDiscarding] = useState(false)

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

  // Probe for any in-progress interview in the active workspace whenever the
  // user lands on the setup screen (i.e. before they have started a new session).
  useEffect(() => {
    if (state !== "setup") return
    if (!activeWorkspace) return
    if (searchParams.get("id")) return // skip if we're inspecting a specific id

    const url = `${API_BASE_URL}/interviews/?workspace_id=${activeWorkspace.id}&status=in_progress`
    fetch(url, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((rows) => {
        if (Array.isArray(rows) && rows.length > 0) {
          const latest = rows[0]
          setInProgressInterview({
            id: latest.id,
            interview_type: latest.interview_type,
            created_at: latest.created_at,
          })
        } else {
          setInProgressInterview(null)
        }
      })
      .catch(() => {})
  }, [state, activeWorkspace?.id, searchParams])

  const discardInProgress = async () => {
    if (!inProgressInterview) return
    setIsDiscarding(true)
    try {
      await fetch(`${API_BASE_URL}/interviews/${inProgressInterview.id}/discard`, {
        method: "POST",
        credentials: "include",
      })
      setInProgressInterview(null)
    } catch (err) {
      console.error("Failed to discard interview:", err)
      toast({
        title: t("Error"),
        description: t("Failed to discard the existing interview."),
        variant: "destructive",
      })
    } finally {
      setIsDiscarding(false)
    }
  }

  const resumeInProgress = () => {
    if (!inProgressInterview) return
    // True voice-session resume isn't possible (the WebSocket state is gone),
    // so route the user to interview history where any captured Q&A is visible.
    router.push(`/interview-history`)
  }

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
      categories: selectedCategories.length > 0 ? selectedCategories : ["Genel"],
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
      await voice.toggleMic()
      await voice.transcribeRecording()
    } else {
      await voice.toggleMic()
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
      <div className="flex min-h-[70vh] items-center justify-center px-7 py-7 md:px-9">
        <div className="flex max-w-md flex-col items-center gap-5 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-soft">
            <CheckCircle2 className="h-7 w-7 text-sage" />
          </div>
          <div>
            <h2 className="serif-headline text-[28px] font-normal leading-tight">
              {t("Interview Already Completed")}
            </h2>
            <p className="mt-2 text-[14px] text-muted-foreground">
              {t("This interview has already been completed and evaluated.")}
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            {completedInterviewId && (
              <Link href="/interview-history">
                <Button className="gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                  <BarChart3 className="h-4 w-4" />
                  {t("View Results")}
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              className="gap-2 rounded-lg border-border"
              onClick={() => {
                setAlreadyCompleted(false)
                setCompletedInterviewId(null)
                router.replace("/mock-interview")
              }}
            >
              <PlayCircle className="h-4 w-4" />
              {t("Start New Interview")}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ─── In-progress Session Guard ────────────────────────────────

  if (inProgressInterview && state === "setup") {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-7 py-7 md:px-9">
        <div className="w-full rounded-2xl border border-border bg-card p-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-clay-soft">
            <PlayCircle className="h-6 w-6 text-clay" />
          </div>
          <h2 className="serif-headline text-[24px] font-normal leading-tight">
            {t("You have an ongoing interview")}
          </h2>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {t("A previous interview session is still marked as in progress. Resume to view what was captured, or discard it to start a new one.")}
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Button
              variant="outline"
              className="gap-2 rounded-lg border-border"
              onClick={resumeInProgress}
              disabled={isDiscarding}
            >
              <PlayCircle className="h-4 w-4" />
              {t("Resume Interview")}
            </Button>
            <Button
              variant="outline"
              className="gap-2 rounded-lg border-destructive/40 text-destructive hover:bg-red-600 hover:text-white hover:border-red-600"
              onClick={discardInProgress}
              disabled={isDiscarding}
            >
              {isDiscarding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SkipForward className="h-4 w-4" />
              )}
              {t("Discard Interview")}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Setup Screen ──────────────────────────────────────────────

  if (state === "setup") {
    return (
      <div className="mx-auto w-full max-w-3xl px-7 py-7 md:px-9">
        <div className="mb-6 text-center">
          <p className="eyebrow mb-1.5 text-clay">{t("Mock Interview")}</p>
          <h1 className="serif-headline text-[32px] font-normal leading-tight tracking-tight">
            {t("Configure your practice session")}
          </h1>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            {t("Practice your interview skills with AI-powered feedback")}
          </p>
        </div>

        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-card p-7">
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[12px] font-semibold">{t("Interview Type")}</p>
              <Select value={interviewType} onValueChange={handleInterviewTypeChange}>
                <SelectTrigger className="h-11 rounded-lg border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hr">{t("HR / Behavioral")}</SelectItem>
                  <SelectItem value="technical">{t("Technical")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-1.5 text-[12px] font-semibold">{t("Difficulty Level")}</p>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="h-11 rounded-lg border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="intern">{t("Intern")}</SelectItem>
                  <SelectItem value="junior">{t("Junior / New Grad")}</SelectItem>
                  <SelectItem value="mid">{t("Mid-Level")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {activeWorkspace && (
            <div className="mb-5 rounded-lg border border-border bg-sage-soft px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle">
                {t("Active Workspace")}
              </p>
              <p className="mt-0.5 font-serif text-[18px] tracking-tight">{activeWorkspace.name}</p>
            </div>
          )}

          {interviewType === "technical" && (
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12px] font-semibold">{t("Categories / Topics")}</p>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {selectedCategories.length} / 5
                </span>
              </div>
              {activeWorkspace?.categories && activeWorkspace.categories.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {activeWorkspace.categories.map((cat) => {
                    const isSelected = selectedCategories.includes(cat)
                    const isDisabled = !isSelected && selectedCategories.length >= 5
                    return (
                      <button
                        key={cat}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCategories((prev) => prev.filter((c) => c !== cat))
                          } else if (selectedCategories.length < 5) {
                            setSelectedCategories((prev) => [...prev, cat])
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                          isSelected
                            ? "border-transparent bg-sage-soft text-sage"
                            : isDisabled
                              ? "cursor-not-allowed border-border bg-secondary/40 text-subtle"
                              : "border-border bg-card text-foreground hover:border-primary/40"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        {cat}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-strong bg-secondary/40 py-6 text-center">
                  <Tag className="mx-auto mb-2 h-5 w-5 text-subtle" />
                  <p className="text-[12px] text-muted-foreground">
                    {t("No categories found. Create a workspace with a job description first.")}
                  </p>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={startInterview}
            size="lg"
            className="w-full gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Phone className="h-4 w-4" />
            {t("Start Interview")}
          </Button>
        </div>
      </div>
    )
  }

  // ─── Active Interview ─────────────────

  if (state === "active") {
    const activeQuestions = voice.questions
    const activeQIndex = voice.currentQuestionIndex
    const activeQuestion = activeQuestions[activeQIndex]
    const isConnected = voice.connectionStatus === "connected"

    return (
      <div className="mx-auto w-full max-w-6xl px-7 py-7 md:px-9">
        {/* Header */}
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? "bg-sage" : voice.connectionStatus === "connecting" ? "bg-clay animate-pulse" : "bg-destructive"
                }`}
              />
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {isConnected ? `Live · ${activeQuestion?.topic || ""}` : t("Connecting...")}
              </span>
            </div>
            <h1 className="serif-headline text-[26px] font-normal leading-tight">
              {t("Question")} {activeQIndex + 1}
              <span className="text-subtle"> / {activeQuestions.length || "—"}</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-destructive/40 text-destructive hover:bg-red-600 hover:text-white hover:border-red-600"
              onClick={voice.endSession}
            >
              <PhoneOff className="h-3.5 w-3.5" />
              {t("End")}
            </Button>
          </div>
        </div>

        {/* Progress dots */}
        {activeQuestions.length > 0 && (
          <div className="mb-6 flex gap-1.5">
            {activeQuestions.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i < activeQIndex ? "bg-sage" : i === activeQIndex ? "bg-clay" : "bg-secondary"
                }`}
              />
            ))}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {/* Stage */}
          <div className="rounded-2xl border border-border bg-card p-7">
            {/* Interviewer header */}
            <div className="mb-5 flex items-center gap-3.5">
              <div className="relative flex-shrink-0">
                <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-sage bg-clay-soft">
                  <img
                    src="/avatar/interviewer.png"
                    alt={t("AI interviewer")}
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                <span className="absolute -right-0.5 -bottom-0.5 h-4 w-4 rounded-full border-[3px] border-card bg-sage" />
              </div>
              <div>
                <p className="font-serif text-[18px] tracking-tight">{t("AI Interviewer")}</p>
                <p className="text-[12px] text-muted-foreground">
                  {voice.isAiSpeaking ? t("AI is speaking...") : voice.sessionState === "processing" ? t("Processing your answer...") : t("Senior Recruiter")}
                </p>
              </div>
            </div>

            {/* Question card */}
            {activeQuestion && (
              <div className="mb-4 rounded-xl border border-border bg-background p-5">
                <p className="eyebrow mb-2.5 text-clay">{activeQuestion.topic}</p>
                <p className="font-serif text-[22px] font-normal leading-snug tracking-tight">
                  &ldquo;{activeQuestion.question}&rdquo;
                </p>
              </div>
            )}

            {/* AI speaking / processing indicator */}
            {(voice.isAiSpeaking || voice.sessionState === "processing" || voice.sessionState === "idle") && (
              <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-4">
                <div className="flex items-center gap-2.5">
                  {voice.sessionState === "processing" || voice.sessionState === "idle" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-clay" />
                  ) : (
                    <Volume2 className="h-4 w-4 animate-pulse text-sage" />
                  )}
                  <span className="text-[13px] font-medium">
                    {voice.isAiSpeaking
                      ? t("AI is speaking...")
                      : voice.sessionState === "processing"
                        ? t("Processing your answer...")
                        : t("Preparing interview...")}
                  </span>
                </div>
                {voice.isAiSpeaking && (
                  <Button variant="outline" size="sm" onClick={voice.interrupt} className="gap-1.5">
                    <Mic className="h-3.5 w-3.5" />
                    {t("Interrupt & Speak")}
                  </Button>
                )}
              </div>
            )}

            {/* Answer area */}
            {voice.isListening && (
              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <p className="eyebrow mb-3">
                  {t("Your Answer")}
                  {voice.isTranscribing && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-[10px]">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t("Transcribing...")}
                    </span>
                  )}
                </p>
                <Textarea
                  placeholder={t("Record with the microphone or type your answer here...")}
                  className="min-h-[110px] resize-none rounded-lg border-border bg-card text-[14px] leading-relaxed"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={voice.isTranscribing}
                />

                {/* Wave bars — driven by live mic amplitude; only move when the user actually speaks */}
                <div
                  className="mt-3 flex h-[30px] items-end justify-start gap-[3px]"
                  aria-hidden="true"
                >
                  {micLevels.map((lv, i) => {
                    // Map amplitude (0..1) to a visible bar height (4..30 px).
                    const h = 4 + lv * 26
                    return (
                      <span
                        key={i}
                        className="block w-[3px] rounded-full bg-sage transition-[height,opacity] duration-100 ease-out"
                        style={{
                          height: `${h}px`,
                          opacity: voice.micActive ? Math.max(0.45, 0.45 + lv * 0.55) : 0.25,
                        }}
                      />
                    )
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    onClick={handleMicToggle}
                    disabled={voice.isTranscribing}
                    className={
                      voice.micActive
                        ? "rounded-full gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        : "rounded-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    }
                  >
                    {voice.micActive ? (
                      <>
                        <span className="h-2 w-2 rounded-sm bg-white" />
                        {t("Stop")}
                      </>
                    ) : (
                      <>
                        <Mic className="h-3.5 w-3.5" />
                        {t("Record")}
                      </>
                    )}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setUserAnswer("")
                        voice.passQuestion()
                      }}
                      disabled={voice.sessionState !== "listening" || voice.isTranscribing}
                    >
                      <SkipForward className="h-3.5 w-3.5" />
                      {t("Pass")}
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleSubmit}
                      disabled={!userAnswer.trim() || voice.micActive || voice.isTranscribing}
                    >
                      <Send className="h-3.5 w-3.5" />
                      {t("Submit")}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transcript */}
          <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-3.5 font-serif text-[17px] tracking-tight">
              {t("Conversation")}
            </h2>
            <div
              ref={conversationScrollRef}
              className="flex max-h-[58vh] flex-col gap-2.5 overflow-y-auto pr-1"
            >
              {voice.conversationLog.length === 0 && (
                <p className="py-6 text-center text-[12px] text-muted-foreground">
                  {t("Connecting...")}
                </p>
              )}
              {voice.conversationLog.map((entry, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border-l-2 p-3 text-[13px] leading-relaxed ${
                    entry.role === "interviewer"
                      ? "border-sage bg-sage-soft"
                      : "border-clay bg-secondary"
                  }`}
                >
                  <p
                    className={`eyebrow mb-1 ${
                      entry.role === "interviewer" ? "text-sage" : "text-clay"
                    }`}
                  >
                    {entry.role === "interviewer" ? t("AI Interviewer") : t("You")}
                  </p>
                  <p className="text-foreground">{entry.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Evaluating State ─────────────────

  if (state === "evaluating") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-7 py-7 md:px-9">
        <div className="flex max-w-md flex-col items-center gap-5 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-sage" />
          <div>
            <h2 className="serif-headline text-[28px] font-normal leading-tight">
              {t("Evaluating Your Answers...")}
            </h2>
            <p className="mt-2 text-[14px] text-muted-foreground">
              {t("Reviewing your performance")}
            </p>
          </div>
          <div className="h-1 w-64 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-sage" />
          </div>
        </div>
      </div>
    )
  }

  // ─── Completed State ─────────────────

  const finalEvaluation = voice.evaluation
  const results = finalEvaluation?.results || []
  const overallScore = finalEvaluation?.overall_score || 0
  const overallFeedback = finalEvaluation?.overall_feedback || ""

  return (
    <div className="mx-auto w-full max-w-6xl px-7 py-7 md:px-9">
      <div className="mb-5">
        <p className="eyebrow text-clay">
          {activeWorkspace?.name || ""}{activeWorkspace?.jobName ? ` · ${activeWorkspace.jobName}` : ""}
        </p>
        <h1 className="serif-headline mt-1 text-[32px] font-normal leading-tight tracking-tight">
          {t("Interview Feedback")}
        </h1>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex items-center gap-5 rounded-2xl border border-border bg-card p-6">
          <RingProgress value={overallScore} size={92} />
          <div>
            <p className="eyebrow">{t("Overall Score")}</p>
            <p className="serif-headline mt-1 text-[40px] leading-none tabular-nums">
              {overallScore}<span className="text-[18px] text-subtle">%</span>
            </p>
            <p className="mt-1.5 text-[11px] font-semibold text-sage">
              ↑ {t("above your average")}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-sage" />
            <span className="font-serif text-[17px] tracking-tight">{t("Strengths")}</span>
          </div>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {overallFeedback || t("Review your feedback below.")}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <PlayCircle className="h-4 w-4 text-clay" />
            <span className="font-serif text-[17px] tracking-tight">{t("Next steps")}</span>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              className="justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => { voice.disconnect(); setState("setup"); }}
            >
              <PlayCircle className="h-3.5 w-3.5" />
              {t("Start Another Interview")}
            </Button>
            <Link href="/dashboard">
              <Button size="sm" variant="outline" className="w-full justify-start gap-2 border-border">
                {t("Return to Dashboard")}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-3.5 font-serif text-[17px] font-medium tracking-tight">
          {t("Detailed Feedback")}
        </h2>
        <div className="flex flex-col gap-2">
          {results.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {t("Review your feedback below.")}
            </p>
          )}
          {results.map((result, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[100px_1fr_80px_60px] items-center gap-3.5 rounded-lg border border-border bg-background p-3.5"
            >
              <p className="eyebrow text-clay">{t(result.topic)}</p>
              <p className="text-[13px]">{t(result.question)}</p>
              <div className="h-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full ${result.score < 75 ? "bg-clay" : "bg-sage"}`}
                  style={{ width: `${result.score}%` }}
                />
              </div>
              <span className="text-right font-serif text-[14px] tabular-nums">
                {result.score}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
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
    </div>
  )
}
