"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"

import { PageContainer, PageHeader } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { PlayCircle, Mic, MicOff, Clock, Send, ChevronRight, BarChart3, SkipForward, Phone, PhoneOff, Volume2, Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useMockInterview } from "@/hooks/use-mock-interview"
import { useVoiceInterview, type ConversationEntry } from "@/hooks/use-voice-interview"
import { useSpeechToText } from "@/hooks/use-speech-to-text"
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
  const [voiceMode, setVoiceMode] = useState(false)
  const [timeLimit, setTimeLimit] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [notes, setNotes] = useState("")
  const { t } = useLanguage()

  const [workspaceId, setWorkspaceId] = useState("1")
  const [categories, setCategories] = useState("")
  const { questions, setQuestions, isLoading, generateQuestions, saveAnswer, answers, evaluation, isEvaluating, evaluateAnswers, interviewId: textInterviewId } = useMockInterview()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Voice interview hook
  const voice = useVoiceInterview()

  // Back-button guard: check if returning to a completed interview
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)
  const [completedInterviewId, setCompletedInterviewId] = useState<number | null>(null)

  useEffect(() => {
    const existingId = searchParams.get("id")
    if (existingId) {
      fetch(`http://localhost:8000/interviews/${existingId}`)
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

  // Speech-to-text for text mode (browser-native)
  const stt = useSpeechToText({
    language: "tr-TR",
    onTranscript: (text) => {
      setUserAnswer((prev) => prev + (prev ? " " : "") + text)
    },
  })

  const conversationEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll conversation log
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [voice.conversationLog])

  // Push interview ID into URL for back-button guard
  useEffect(() => {
    const id = voiceMode ? voice.interviewId : textInterviewId
    if (id && state === "active") {
      router.replace(`/mock-interview?id=${id}`, { scroll: false })
    }
  }, [textInterviewId, voice.interviewId, state, voiceMode, router])

  const startInterview = async () => {
    if (voiceMode) {
      // Voice mode — use WebSocket
      setState("active")
      voice.startSession({
        workspaceId: parseInt(workspaceId) || 1,
        categories: categories || "Genel",
        difficulty,
        interviewType: interviewType,
      })
    } else {
      // Text mode — existing REST flow
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
        setQuestions(mockQuestions)
        setState("active")
        setCurrentQuestion(0)
      }
    }
  }

  const nextQuestion = async () => {
    saveAnswer(currentQuestion, userAnswer)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setUserAnswer("")
    } else {
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

  // ─── Voice mode state transitions ──────────────────────────────

  // Map voice session state to page state
  useEffect(() => {
    if (!voiceMode) return

    if (voice.sessionState === "evaluating") {
      voice.stopPlayback()  // Stop any lingering TTS audio
      setState("evaluating")
    }
    if (voice.sessionState === "done") {
      voice.stopPlayback()  // Stop any lingering TTS audio
      setState("completed")
    }
  }, [voice.sessionState, voiceMode])

  // Show voice errors
  useEffect(() => {
    if (voice.error) {
      toast({
        title: "Hata",
        description: voice.error,
        variant: "destructive",
      })
    }
  }, [voice.error, toast])

  const progress = voiceMode
    ? voice.questions.length > 0
      ? ((voice.currentQuestionIndex + 1) / voice.questions.length) * 100
      : 0
    : questions.length > 0
    ? ((currentQuestion + 1) / questions.length) * 100
    : 0

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
                      <Label className="flex items-center gap-2">
                        <Mic className="h-4 w-4" />
                        {t("Voice Mode")}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {voiceMode
                          ? t("Real-time voice conversation with AI interviewer (Turkish)")
                          : t("Type your answers in text")}
                      </p>
                    </div>
                    <Switch checked={voiceMode} onCheckedChange={setVoiceMode} />
                  </div>
                  {!voiceMode && (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{t("Question Time Limit")}</Label>
                        <p className="text-sm text-muted-foreground">{t("2 minutes per question")}</p>
                      </div>
                      <Switch checked={timeLimit} onCheckedChange={setTimeLimit} />
                    </div>
                  )}
                </div>

                <Button onClick={startInterview} size="lg" className="w-full gap-2" disabled={isLoading}>
                  {isLoading ? (
                    <Clock className="h-5 w-5 animate-spin" />
                  ) : voiceMode ? (
                    <Phone className="h-5 w-5" />
                  ) : (
                    <PlayCircle className="h-5 w-5" />
                  )}
                  {isLoading
                    ? t("Generating Questions...")
                    : voiceMode
                    ? t("Start Voice Interview")
                    : t("Start Interview")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </PageContainer>
      </>
    )
  }

  // ─── Active Interview: Voice Mode ──────────────────────────────

  if (state === "active" && voiceMode) {
    const activeQuestions = voice.questions
    const activeQIndex = voice.currentQuestionIndex
    const activeQuestion = activeQuestions[activeQIndex]

    return (
      <div className="flex min-h-screen flex-col bg-background">
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-5xl space-y-6">
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
                <Badge variant="outline">
                  {t("Voice Interview")}
                </Badge>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  voice.endSession()
                }}
              >
                <PhoneOff className="h-4 w-4" />
                {t("End Interview")}
              </Button>
            </div>

            {/* Progress */}
            {activeQuestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t("Question")} {activeQIndex + 1} / {activeQuestions.length}</span>
                  <span>{activeQuestion?.topic || ""}</span>
                </div>
                <Progress
                  value={((activeQIndex + 1) / activeQuestions.length) * 100}
                  className="h-2"
                />
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-5">
              {/* Main interaction area */}
              <div className="lg:col-span-3 space-y-6">
                {/* Current Question */}
                {activeQuestion && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{activeQuestion.topic}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-medium leading-relaxed">{activeQuestion.question}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Voice Status Indicator */}
                <Card className="overflow-hidden">
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center justify-center gap-6">
                      {/* AI Speaking Indicator */}
                      {voice.isAiSpeaking && (
                        <div className="text-center space-y-4">
                          <div className="relative mx-auto">
                            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                              <Volume2 className="h-10 w-10 text-primary animate-pulse" />
                            </div>
                            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">{t("AI is speaking...")}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={voice.interrupt}
                            className="gap-1.5"
                          >
                            <Mic className="h-4 w-4" />
                            {t("Interrupt & Speak")}
                          </Button>
                        </div>
                      )}

                      {/* Listening — Push to Talk */}
                      {voice.isListening && (
                        <div className="text-center space-y-4">
                          <div className="relative mx-auto">
                            <button
                              onClick={voice.toggleMic}
                              className={`h-24 w-24 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                                voice.micActive
                                  ? "bg-red-500/20 hover:bg-red-500/30"
                                  : "bg-muted hover:bg-muted/80"
                              }`}
                            >
                              {voice.micActive ? (
                                <Mic className="h-10 w-10 text-red-500" />
                              ) : (
                                <MicOff className="h-10 w-10 text-muted-foreground" />
                              )}
                            </button>
                            {voice.micActive && (
                              <div className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-pulse pointer-events-none" />
                            )}
                          </div>
                          <p className="text-sm font-medium">
                            {voice.micActive ? (
                              <span className="text-red-500">{t("Recording... Click to pause")}</span>
                            ) : (
                              <span className="text-muted-foreground">{t("Click microphone to start speaking")}</span>
                            )}
                          </p>
                          {/* Submit Answer Button */}
                          <div className="pt-2">
                            <Button
                              onClick={voice.submitAnswer}
                              size="sm"
                              className="gap-1.5"
                            >
                              <Send className="h-4 w-4" />
                              {t("Submit Answer")}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Processing Indicator */}
                      {voice.sessionState === "processing" && (
                        <div className="text-center space-y-4">
                          <div className="h-24 w-24 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
                            <Loader2 className="h-10 w-10 text-yellow-500 animate-spin" />
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">{t("Processing your answer...")}</p>
                        </div>
                      )}

                      {/* Idle / Connecting */}
                      {(voice.sessionState === "idle") && (
                        <div className="text-center space-y-4">
                          <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mx-auto">
                            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">{t("Preparing interview...")}</p>
                        </div>
                      )}
                    </div>


                  </CardContent>

                  {/* Action Buttons */}
                  <CardFooter className="flex justify-center gap-3 border-t bg-muted/20 p-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground gap-1"
                      onClick={voice.passQuestion}
                      disabled={voice.sessionState !== "listening"}
                    >
                      <SkipForward className="h-4 w-4" />
                      {t("Pass Question")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 gap-1"
                      onClick={voice.endSession}
                    >
                      <PhoneOff className="h-4 w-4" />
                      {t("End Interview")}
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {/* Conversation Log */}
              <div className="lg:col-span-2">
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{t("Conversation")}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto max-h-[60vh] space-y-3">
                    {voice.conversationLog.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {t("Conversation will appear here...")}
                      </p>
                    )}
                    {voice.conversationLog.map((entry, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-2 ${
                          entry.role === "interviewer" ? "" : "flex-row-reverse"
                        }`}
                      >
                        <div
                          className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                            entry.role === "interviewer"
                              ? "bg-primary/10 text-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <p className="text-xs font-medium mb-1 opacity-60">
                            {entry.role === "interviewer" ? "🤖 AI" : "👤 Sen"}
                          </p>
                          <p className="leading-relaxed">{entry.text}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={conversationEndRef} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ─── Active Interview: Text Mode (existing) ────────────────────

  if (state === "active" && !voiceMode) {
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
                      <p className="text-sm font-medium text-muted-foreground">{t("Text mode — type your answer below")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Text Input & Actions */}
              <div className="space-y-2">
                <div className="relative">
                  <Textarea
                    placeholder={t("Type your answer or use the microphone...")}
                    className="min-h-[120px] resize-none pr-24 text-base"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                  />
                  <div className="absolute bottom-4 right-4 flex items-center gap-2">
                    {stt.isSupported && (
                      <Button
                        size="icon"
                        variant={stt.isRecording ? "destructive" : "outline"}
                        className={`h-8 w-8 ${stt.isRecording ? "animate-pulse" : ""}`}
                        onClick={stt.toggleRecording}
                        title={stt.isRecording ? t("Stop recording") : t("Start recording")}
                      >
                        {stt.isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button
                      size="icon"
                      className="h-8 w-8"
                      onClick={nextQuestion}
                      disabled={!userAnswer}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  {stt.isRecording && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="destructive" className="gap-1 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        {t("Recording")}
                      </Badge>
                    </div>
                  )}
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

  // ─── Evaluating State ──────────────────────────────────────────

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

  // ─── Completed State ───────────────────────────────────────────

  const finalEvaluation = voiceMode ? voice.evaluation : evaluation
  const results = finalEvaluation?.results || mockResults
  const overallScore = finalEvaluation?.overall_score || 0
  const overallFeedback = finalEvaluation?.overall_feedback || ""

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

          {/* Conversation Log (voice mode only) */}
          {voiceMode && voice.conversationLog.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("Interview Transcript")}</CardTitle>
                <CardDescription>{t("Full conversation from your voice interview")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {voice.conversationLog.map((entry, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2 ${
                      entry.role === "interviewer" ? "" : "flex-row-reverse"
                    }`}
                  >
                    <div
                      className={`rounded-lg px-3 py-2 text-sm max-w-[80%] ${
                        entry.role === "interviewer"
                          ? "bg-primary/10"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-xs font-medium mb-1 opacity-60">
                        {entry.role === "interviewer" ? "🤖 AI" : "👤 Sen"}
                      </p>
                      <p>{entry.text}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="flex-1 gap-2" onClick={() => {
              if (voiceMode) voice.disconnect()
              setState("setup")
            }}>
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
