"use client"

import { useState, useRef, useEffect, useCallback, type CSSProperties } from "react"
import { useSearchParams, useRouter } from "next/navigation"

import { PageContainer, PageHeader } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { PlayCircle, Mic, MicOff, Send, ChevronRight, BarChart3, SkipForward, Phone, PhoneOff, Volume2, Loader2, CheckCircle2, Check, Tag, Clock } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useVoiceInterview } from "@/hooks/use-voice-interview"
import { useToast } from "@/hooks/use-toast"
import { useWorkspace } from "@/lib/workspace-context"
import { apiUrl } from "@/lib/api-config"
import { TalkingInterviewerPanel } from "@/components/TalkingInterviewerPanel"
import { useMicLevel } from "@/hooks/use-mic-level"
import { useNavigationGuard } from "@/hooks/use-navigation-guard"
import { RingProgress } from "@/components/calm/ring-progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const WAVE_BARS = 20

type InterviewState = "setup" | "active" | "evaluating" | "completed"

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
  const [durationMinutes, setDurationMinutes] = useState(10)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
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

  // Confirmation modal for navigation-away attempts
  const [navConfirm, setNavConfirm] = useState<{
    target: string
    resolve: (allow: boolean) => void
  } | null>(null)

  // Voice interview hook (sole pipeline)
  const voice = useVoiceInterview()
  const sessionStateRef = useRef(voice.sessionState)

  // Live mic amplitude → wave bars only animate when the user actually speaks
  const micLevels = useMicLevel(voice.micActive, WAVE_BARS)

  // Back-button guard: check if returning to a completed interview
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)
  const [completedInterviewId, setCompletedInterviewId] = useState<number | null>(null)

  useEffect(() => {
    const existingId = searchParams.get("id")
    if (existingId) {
      fetch(apiUrl(`/interviews/${existingId}`), {
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

  // Navigation guard: any attempt to leave the page while the interview is
  // running pops a confirmation modal. Confirm → discard the interview record
  // and allow navigation. Cancel → stay on the interview.
  useNavigationGuard({
    enabled: state === "active",
    requestExit: (target) =>
      new Promise<boolean>((resolve) => {
        setNavConfirm({ target, resolve })
      }),
  })

  const handleConfirmLeave = async () => {
    if (!navConfirm) return
    const id = voice.interviewId
    try {
      // Permanently discard the in-progress session so it doesn't come back
      // in the "ongoing interview" prompt next time the user opens the page.
      if (id) {
        await fetch(apiUrl(`/interviews/${id}/discard`), {
          method: "POST",
          credentials: "include",
        })
      }
      voice.disconnect()
    } catch (err) {
      console.error("Discard on leave failed:", err)
    } finally {
      const resolve = navConfirm.resolve
      setNavConfirm(null)
      resolve(true)
    }
  }

  const handleCancelLeave = () => {
    if (!navConfirm) return
    const resolve = navConfirm.resolve
    setNavConfirm(null)
    resolve(false)
  }

  const [missingCvOpen, setMissingCvOpen] = useState(false)
  const [isCheckingCv, setIsCheckingCv] = useState(false)

  const startInterview = async () => {
    if (!activeWorkspace) {
      toast({
        title: t("Warning"),
        description: t("Please select a workspace from the top menu first."),
        variant: "destructive",
      })
      return
    }

    if (interviewType === "hr") {
      setIsCheckingCv(true)
      try {
        const res = await fetch(
          apiUrl(`/api/cv/workspace/${activeWorkspace.id}/availability`),
          { credentials: "include" },
        )
        if (res.ok) {
          const { has_cv } = await res.json()
          if (!has_cv) {
            setMissingCvOpen(true)
            return
          }
        }
      } catch (err) {
        console.error("CV availability check failed:", err)
        // Fall through and let the backend reject if needed.
      } finally {
        setIsCheckingCv(false)
      }
    }

    setState("active")
    setRemainingSeconds(durationMinutes * 60)
    voice.startSession({
      workspaceId: Number(activeWorkspace.id),
      categories: selectedCategories.length > 0 ? selectedCategories : ["Genel"],
      difficulty,
      interviewType: interviewType,
      avatarProvider: voice.selectedAvatarProvider,
      durationLimit: durationMinutes * 60,
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

  // ─── Countdown Timer ───────────────────────────────────────────
  // Keep sessionStateRef in sync so the interval callback always has the
  // latest session state without needing to re-create the interval.
  useEffect(() => {
    sessionStateRef.current = voice.sessionState
  }, [voice.sessionState])

  useEffect(() => {
    if (state !== "active" || remainingSeconds === null) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    timerRef.current = setInterval(() => {
      // Only tick when it's the user's turn — pause during AI processing/speaking
      if (sessionStateRef.current !== "listening") return

      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!)
          timerRef.current = null
          voice.endSession()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [state, remainingSeconds === null])

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

        <div data-tour="interview-setup" className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-card p-7">
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

          <div className="mb-5">
            <p className="mb-2 text-[12px] font-semibold">{t("Session Duration")}</p>
            <div className="flex flex-wrap gap-1.5">
              {[1, 5, 10, 15, 20].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
                    durationMinutes === mins
                      ? "border-transparent bg-sage-soft text-sage"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  }`}
                >
                  {durationMinutes === mins && <Check className="h-3 w-3" />}
                  <Clock className="h-3 w-3" />
                  {mins} {t("min")}
                  {mins === 1 && <span className="text-[10px] text-muted-foreground">({t("test")})</span>}
                </button>
              ))}
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

          {voice.isLiveAvatarEnabled && (
            <div className="mb-5 space-y-2">
              <Label>{t("Interviewer Mode")}</Label>
              <Select
                value={voice.selectedAvatarProvider}
                onValueChange={(value) =>
                  voice.setSelectedAvatarProvider(value as "voice_call" | "liveavatar_full")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="voice_call">{t("Voice Call (no avatar)")}</SelectItem>
                  <SelectItem value="liveavatar_full">{t("Photoreal LiveAvatar (beta)")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button 
            data-tour="interview-start-btn"
            onClick={startInterview} 
            size="lg" 
            className="w-full gap-2" 
            disabled={isCheckingCv}
          >
            {isCheckingCv ? <Loader2 className="h-5 w-5 animate-spin" /> : <Phone className="h-5 w-5" />}
            {t("Start Interview")}
          </Button>
        </div>

        <Dialog open={missingCvOpen} onOpenChange={setMissingCvOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("CV Required")}</DialogTitle>
              <DialogDescription>
                {t("HR interviews are tailored to your CV. Please upload or generate a CV before starting an HR interview.")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMissingCvOpen(false)}>
                {t("Cancel")}
              </Button>
              <Button
                onClick={() => {
                  setMissingCvOpen(false)
                  router.push("/cv-studio")
                }}
              >
                {t("Go to CV Studio")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // ─── Active Interview — Video Call Layout ─────────────────

  if (state === "active") {
    const activeQuestions = voice.questions
    const activeQIndex = voice.currentQuestionIndex
    const activeQuestion = activeQuestions[activeQIndex]

    // Status label & color for the avatar panel
    const statusConfig = {
      idle: { label: t("Preparing..."), color: "bg-yellow-500", pulse: true },
      ai_speaking: { label: t("Speaking..."), color: "bg-green-500", pulse: true },
      listening: { label: t("Listening..."), color: "bg-blue-500", pulse: false },
      processing: { label: t("Processing..."), color: "bg-yellow-500", pulse: true },
      evaluating: { label: t("Evaluating..."), color: "bg-purple-500", pulse: true },
      done: { label: t("Done"), color: "bg-gray-500", pulse: false },
    }[voice.sessionState] || { label: "", color: "bg-gray-500", pulse: false }

    const isProcessingOrIdle = voice.sessionState === "processing" || voice.sessionState === "idle"
    const isInputDisabled = isProcessingOrIdle || voice.sessionState === "ai_speaking" || voice.isTranscribing

    const answerComposer = (
      <Card className="shrink-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {t("Your Answer")}
            {voice.isTranscribing && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t("Transcribing...")}
              </Badge>
            )}
            {voice.sessionState === "processing" && (
              <Badge variant="outline" className="gap-1 text-xs text-yellow-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t("Processing your answer...")}
              </Badge>
            )}
            {voice.sessionState === "idle" && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t("Preparing interview...")}
              </Badge>
            )}
            {voice.sessionState === "ai_speaking" && (
              <Badge variant="outline" className="gap-1 text-xs text-green-600">
                <Volume2 className="h-3 w-3" />
                {t("AI is speaking...")}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {voice.micActive && (
              <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                <Badge variant="destructive" className="shrink-0 animate-pulse gap-1 text-xs">
                  {t("Recording")}
                </Badge>
                <div className="flex h-8 flex-1 items-center justify-center gap-[3px]" aria-hidden="true">
                  {micLevels.map((level, i) => (
                    <span
                      key={i}
                      className="w-[3px] rounded-full bg-destructive transition-[height] duration-75"
                      style={{ height: `${Math.max(8, level * 100)}%` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <Textarea
              placeholder={isInputDisabled ? "" : t("Record with the microphone or type your answer here...")}
              className="min-h-[80px] max-h-[180px] overflow-y-auto resize-none text-base"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={isInputDisabled}
            />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={voice.micActive ? "destructive" : "outline"}
                  className="gap-1.5"
                  onClick={handleMicToggle}
                  disabled={isInputDisabled}
                >
                  {voice.micActive ? (
                    <>
                      <MicOff className="h-4 w-4" />
                      {t("Stop")}
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      {t("Record")}
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-muted-foreground"
                  onClick={() => {
                    setUserAnswer("")
                    voice.passQuestion()
                  }}
                  disabled={voice.sessionState !== "listening"}
                >
                  <SkipForward className="h-4 w-4" />
                  {t("Pass")}
                </Button>
              </div>

              <Button
                size="sm"
                className="gap-1.5"
                onClick={handleSubmit}
                disabled={!userAnswer.trim() || voice.micActive || isInputDisabled}
              >
                <Send className="h-4 w-4" />
                {t("Submit")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )

    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-background pt-14 lg:pt-0">
        <main className="flex min-h-0 flex-1 flex-col p-3 sm:p-4 md:p-6">
          <div className="mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col space-y-4">
            {/* ── Top Bar ── */}
            <div className="shrink-0 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="gap-1.5 text-[11px]">
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
                  {remainingSeconds !== null && (() => {
                    const isPaused = voice.sessionState !== "listening"
                    return (
                      <Badge
                        variant="outline"
                        className={`gap-1 tabular-nums text-[11px] transition-opacity ${
                          isPaused
                            ? "opacity-50"
                            : remainingSeconds <= 60
                              ? "border-destructive/40 text-destructive animate-pulse"
                              : remainingSeconds <= 120
                                ? "border-yellow-500/40 text-yellow-600 dark:text-yellow-400"
                                : ""
                        }`}
                        title={isPaused ? t("Timer paused — waiting for AI") : t("Time remaining")}
                      >
                        <Clock className="h-3 w-3" />
                        {String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:
                        {String(remainingSeconds % 60).padStart(2, "0")}
                        {isPaused && <span className="text-[9px]">⏸</span>}
                      </Badge>
                    )
                  })()}
                </div>
                <Button variant="destructive" size="sm" className="gap-1.5" onClick={voice.endSession}>
                  <PhoneOff className="h-4 w-4" />
                  {t("End Interview")}
                </Button>
              </div>

              <div>
                <h1 className="serif-headline text-[20px] sm:text-[26px] font-normal leading-tight">
                  {t("Question")} {activeQIndex + 1}
                  <span className="text-subtle"> / {activeQuestions.length || "—"}</span>
                </h1>

                {/* Progress dots */}
                {activeQuestions.length > 0 && (
                  <div className="mt-2 flex gap-1.5">
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
              </div>
            </div>

            <div className="grid min-h-0 flex-1 gap-4 grid-cols-1 lg:grid-cols-[1.6fr_1fr]">
          {/* ── LEFT: Avatar (large) + session state ── */}
          <div className="flex min-h-0 flex-col gap-4 max-h-[55vh] lg:max-h-none lg:h-full">
            {activeQuestion && (
              <Card className="shrink-0 py-3 gap-0">
                <CardContent className="py-0">
                  <div className="mb-1.5">
                    <Badge variant="secondary" className="w-fit text-[10px] py-0 px-2">{activeQuestion.topic}</Badge>
                  </div>
                  <p className="text-[14px] font-medium leading-relaxed lg:text-[15px]">{activeQuestion.question}</p>
                </CardContent>
              </Card>
            )}

            <TalkingInterviewerPanel
              analyserNode={voice.analyserNode}
              isSpeaking={voice.isAiSpeaking}
              activeAvatarProvider={voice.activeAvatarProvider}
              liveAvatarStatus={voice.liveAvatarStatus}
              liveAvatarVideoRef={voice.liveAvatarVideoRef}
              statusLabel={statusConfig.label}
              statusColor={statusConfig.color}
              statusPulse={statusConfig.pulse}
              onInterrupt={voice.interrupt}
              interviewerLabel={t("AI Interviewer")}
              showInterruptButton={voice.isAiSpeaking && !voice.isWrappingUp}
              interruptLabel={t("Interrupt & Speak")}
            />
          </div>

          {/* ── RIGHT: Conversation + Answer ── */}
          <div className="flex min-h-0 flex-col gap-4 lg:h-full lg:overflow-hidden">
            <Card className="flex min-h-0 flex-col overflow-hidden lg:flex-1">
              <CardHeader className="pb-2"><CardTitle className="text-base">{t("Conversation")}</CardTitle></CardHeader>
              <CardContent className="flex min-h-0 flex-1 overflow-hidden p-0">
                <div
                  ref={conversationScrollRef}
                  className="h-[160px] sm:h-[220px] min-h-0 overflow-y-auto overscroll-contain space-y-3 px-4 sm:px-6 pb-4 pr-4 lg:h-full"
                >
                  {voice.conversationLog.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">{t("Conversation will appear here...")}</p>
                  )}
                  {voice.conversationLog.map((entry, idx) => (
                    <div key={idx} className={`flex gap-2 ${entry.role === "interviewer" ? "" : "flex-row-reverse"}`}>
                      <div className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${entry.role === "interviewer" ? "bg-primary/10" : "bg-muted"}`}>
                        <p className="text-xs font-medium mb-1 opacity-60">{entry.role === "interviewer" ? "🤖 AI" : "👤 Sen"}</p>
                        <p className="leading-relaxed">{entry.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {answerComposer}
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
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-7 sm:py-7 md:px-9">
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
              onClick={() => {
                voice.disconnect()
                setState("setup")
                // Strip ?id=… from the URL so the in-progress probe re-runs
                // cleanly and we never carry the just-finished interview's id forward.
                router.replace("/mock-interview", { scroll: false })
              }}
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
              className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3.5 sm:grid sm:grid-cols-[100px_1fr_80px_60px] sm:items-center sm:gap-3.5"
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

function LeaveInterviewDialog({
  open,
  onConfirm,
  onCancel,
  t,
}: {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  t: (key: string) => string
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">{t("Warning")}</DialogTitle>
          <DialogDescription className="pt-2 text-[14px] leading-relaxed">
            {t("If you leave this page, your current interview session will be permanently deleted and your progress will not be saved.")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onCancel}>
            {t("Stay on this page")}
          </Button>
          <Button
            variant="outline"
            onClick={onConfirm}
            className="border-destructive/40 text-destructive hover:bg-red-600 hover:text-white hover:border-red-600"
          >
            {t("Leave & Discard")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
