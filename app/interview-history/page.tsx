"use client"

import { useState } from "react"
import { format, type Locale } from "date-fns"
import { enUS, tr } from "date-fns/locale"
import Link from "next/link"
import {
  ArrowLeft,
  CircleCheck,
  ClipboardList,
  Clock,
  Lightbulb,
  MessageSquare,
  Mic,
  PlayCircle,
  Target,
  Type,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { useWorkspace } from "@/lib/workspace-context"
import { useInterviewHistory, useInterviewDetail } from "@/hooks/use-interview-history"
import type { InterviewSummary } from "@/hooks/use-interview-history"
import { RingProgress } from "@/components/calm/ring-progress"
import { cn } from "@/lib/utils"

export default function InterviewHistoryPage() {
  const { t, language } = useLanguage()
  const dateLocale = language === "tr" ? tr : enUS
  const { activeWorkspace } = useWorkspace()
  const workspaceId = activeWorkspace ? Number(activeWorkspace.id) : undefined
  const { interviews, isLoading, error } = useInterviewHistory(workspaceId)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  if (selectedId) {
    return <InterviewDetailView interviewId={selectedId} onBack={() => setSelectedId(null)} />
  }

  return (
    <div className="px-4 py-5 sm:px-7 sm:py-7 md:px-9">
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-clay">{t("interviewHistory")}</p>
          <h1 className="serif-headline mt-1 text-[32px] font-normal leading-tight tracking-tight">
            {language === "tr" ? "Geçmiş mülakatların" : "Your past interviews"}
          </h1>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            {language === "tr"
              ? "Daha önce yaptığın mülakatları ve geri bildirimleri tek bir yerden gör."
              : "Review every session and the feedback that came with it, all in one place."}
          </p>
        </div>
        <Link href="/mock-interview">
          <Button className="gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <PlayCircle className="h-4 w-4" />
            {t("Start New Interview")}
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-sage border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-center text-[13px] text-destructive">
          {error}
        </div>
      )}

      {!isLoading && !error && interviews.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-strong bg-secondary/30 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-soft">
            <ClipboardList className="h-6 w-6 text-sage" />
          </div>
          <div>
            <h3 className="font-serif text-[19px] tracking-tight">
              {language === "tr" ? "Henüz mülakat yok" : "No interviews yet"}
            </h3>
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              {language === "tr"
                ? "İlk mock mülakatını yap, geri bildirimlerin burada görünecek."
                : "Start your first mock interview to see your history here."}
            </p>
          </div>
          <Link href="/mock-interview">
            <Button className="gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
              <PlayCircle className="h-3.5 w-3.5" />
              {language === "tr" ? "Mock mülakata git" : "Go to Mock Interview"}
            </Button>
          </Link>
        </div>
      )}

      {!isLoading && interviews.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {interviews.map((interview) => (
            <InterviewRow
              key={interview.id}
              interview={interview}
              dateLocale={dateLocale}
              onSelect={() => setSelectedId(interview.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function InterviewRow({
  interview,
  dateLocale,
  onSelect,
}: {
  interview: InterviewSummary
  dateLocale: Locale
  onSelect: () => void
}) {
  const { t } = useLanguage()
  const typeLabel = interview.interview_type === "technical" ? t("Technical") : t("HR")

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 sm:p-5"
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-sage-soft sm:h-14 sm:w-14">
        {interview.overall_score !== null ? (
          <span className="serif-headline text-lg tabular-nums">{interview.overall_score}</span>
        ) : (
          <Target className="h-5 w-5 text-subtle" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-[14px] font-semibold">
            {interview.company_name || `Workspace #${interview.workspace_id}`}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {interview.mode === "voice" ? <Mic className="h-2.5 w-2.5" /> : <Type className="h-2.5 w-2.5" />}
            {interview.mode === "voice" ? t("Voice") : t("Text")}
          </span>
          <span className="inline-flex rounded-full bg-clay-soft px-2 py-0.5 text-[10px] font-semibold text-clay">
            {typeLabel}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span>{format(new Date(interview.created_at), "MMM d, yyyy HH:mm", { locale: dateLocale })}</span>
          {interview.difficulty && (
            <span className="capitalize">· {interview.difficulty}</span>
          )}
          {interview.duration_seconds && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(interview.duration_seconds)}
            </span>
          )}
        </div>
      </div>

      <span className="hidden text-[12px] font-semibold text-muted-foreground sm:inline-flex sm:items-center sm:gap-1">
        {t("View Results")} →
      </span>
    </button>
  )
}

function InterviewDetailView({
  interviewId,
  onBack,
}: {
  interviewId: number
  onBack: () => void
}) {
  const { t, language } = useLanguage()
  const dateLocale = language === "tr" ? tr : enUS
  const { detail, isLoading, error } = useInterviewDetail(interviewId)
  const { activeWorkspace } = useWorkspace()

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-5 sm:px-7 sm:py-7 md:px-9">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-sage border-t-transparent" />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="px-4 py-5 sm:px-7 sm:py-7 md:px-9">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-center text-[13px] text-destructive">
          {error || "Interview not found"}
        </div>
        <Button variant="outline" className="mt-4 rounded-lg border-border" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          {t("Back to History")}
        </Button>
      </div>
    )
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Derive strengths / improvements from per-question feedback
  const strengths = detail.questions
    .filter((q) => (q.score ?? 0) >= 80 && q.feedback)
    .slice(0, 3)
    .map((q) => q.feedback as string)
  const improvements = detail.questions
    .filter((q) => (q.score ?? 0) < 80 && q.feedback)
    .slice(0, 3)
    .map((q) => q.feedback as string)

  return (
    <div className="px-4 py-5 sm:px-7 sm:py-7 md:px-9">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 gap-1.5 text-muted-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("Back to History")}
      </Button>

      <div className="mb-5">
        <p className="eyebrow text-clay">
          {detail.company_name || activeWorkspace?.name || ""}
          {(detail.interview_type ? ` · ${detail.interview_type === "technical" ? t("Technical") : t("HR")}` : "")}
        </p>
        <h1 className="serif-headline mt-1 text-[32px] font-normal leading-tight tracking-tight">
          {language === "tr" ? "Mülakat geri bildirimi" : "Interview Feedback"}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
          <span>{format(new Date(detail.created_at), "MMMM d, yyyy HH:mm", { locale: dateLocale })}</span>
          {detail.duration_seconds && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(detail.duration_seconds)}
            </span>
          )}
        </div>
      </div>

      {/* Top row: ring + strengths + improvements */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {detail.overall_score !== null && (
          <div className="flex items-center gap-5 rounded-2xl border border-border bg-card p-6">
            <RingProgress value={detail.overall_score} size={92} />
            <div>
              <p className="eyebrow">{t("Overall Score")}</p>
              <p className="serif-headline mt-1 text-[40px] leading-none tabular-nums">
                {detail.overall_score}<span className="text-[18px] text-subtle">%</span>
              </p>
              <p className="mt-1.5 text-[11px] font-semibold text-sage">
                ↑ {language === "tr" ? "iyi seviyede" : "above your average"}
              </p>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <CircleCheck className="h-4 w-4 text-sage" />
            <span className="font-serif text-[17px] tracking-tight">
              {language === "tr" ? "Güçlü yönler" : "Strengths"}
            </span>
          </div>
          <div className="flex flex-col gap-1.5 text-[12.5px] leading-snug">
            {(strengths.length > 0
              ? strengths
              : [
                  language === "tr"
                    ? "Cevapların net ve yapılandırılmıştı."
                    : "Answers stayed structured and on point.",
                ]
            ).map((s, i) => (
              <div key={i} className="flex gap-2">
                <span className="mt-0.5 text-sage">·</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-clay" />
            <span className="font-serif text-[17px] tracking-tight">
              {language === "tr" ? "Geliştirilecekler" : "Improvements"}
            </span>
          </div>
          <div className="flex flex-col gap-1.5 text-[12.5px] leading-snug">
            {(improvements.length > 0
              ? improvements
              : [
                  language === "tr"
                    ? "Etkini sayılarla destekleyebilirsin."
                    : "Quantify your impact more often.",
                ]
            ).map((s, i) => (
              <div key={i} className="flex gap-2">
                <span className="mt-0.5 text-clay">·</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-question table */}
      {detail.questions.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-3.5 font-serif text-[17px] font-medium tracking-tight">
            {language === "tr" ? "Soru bazında analiz" : "Per-question breakdown"}
          </h2>
          <div className="flex flex-col gap-2">
            {detail.questions.map((qa, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border border-border bg-background p-3.5 sm:grid sm:grid-cols-[100px_1fr_80px_60px] sm:items-center sm:gap-3.5"
                )}
              >
                <span className="eyebrow text-clay">{qa.topic || `Q${idx + 1}`}</span>
                <span className="line-clamp-2 text-[13px]">{qa.question}</span>
                {qa.score !== null && qa.score !== undefined ? (
                  <>
                    <div className="h-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full rounded-full ${qa.score < 75 ? "bg-clay" : "bg-sage"}`}
                        style={{ width: `${qa.score}%` }}
                      />
                    </div>
                    <span className="text-right font-serif text-[14px] tabular-nums">
                      {qa.score}%
                    </span>
                  </>
                ) : (
                  <>
                    <span />
                    <span />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversation Transcript */}
      {detail.conversation_history && detail.conversation_history.length > 0 && (
        <ConversationTranscript
          history={detail.conversation_history}
          questions={detail.questions}
          language={language}
        />
      )}

      {/* Footer actions */}
      <div className="mt-6 flex gap-2.5">
        <Link href="/mock-interview">
          <Button className="gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <PlayCircle className="h-4 w-4" />
            {language === "tr" ? "Tekrar dene" : "Retake"}
          </Button>
        </Link>
        <Button variant="outline" className="gap-2 rounded-lg border-border" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          {t("Back to History")}
        </Button>
      </div>
    </div>
  )
}

// ─── Conversation Transcript ───────────────────────────────────────

type ConversationEntry = {
  role: string
  text: string
  action?: string
  type?: string
  interrupted?: boolean
}

interface QuestionGroup {
  questionNumber: number
  topic: string
  messages: ConversationEntry[]
}

function groupMessagesByQuestion(
  history: ConversationEntry[],
  questions: { question: string; topic: string }[]
): QuestionGroup[] {
  const groups: QuestionGroup[] = []
  let currentGroup: QuestionGroup | null = null
  let questionCounter = 0

  for (const entry of history) {
    const isNewQuestion =
      entry.role === "interviewer" &&
      (entry.type === "intro" ||
        entry.action === "next_question" ||
        entry.action === "resume")

    if (isNewQuestion) {
      questionCounter++
      const matchedQ = questions[questionCounter - 1]
      currentGroup = {
        questionNumber: questionCounter,
        topic: matchedQ?.topic || "",
        messages: [entry],
      }
      groups.push(currentGroup)
    } else if (entry.action === "wrap_up" && entry.role === "interviewer") {
      // Wrap-up goes into its own block
      groups.push({
        questionNumber: 0,
        topic: "wrap_up",
        messages: [entry],
      })
    } else {
      // Follow-up answers, follow-up questions, candidate answers
      if (currentGroup) {
        currentGroup.messages.push(entry)
      } else {
        // Shouldn't happen, but create a fallback group
        currentGroup = {
          questionNumber: questionCounter + 1,
          topic: "",
          messages: [entry],
        }
        groups.push(currentGroup)
      }
    }
  }

  return groups
}

function ConversationTranscript({
  history,
  questions,
  language,
}: {
  history: ConversationEntry[]
  questions: { question: string; topic: string }[]
  language: string
}) {
  const groups = groupMessagesByQuestion(history, questions)
  const [expanded, setExpanded] = useState(false)

  return (
    <section className="mt-4 rounded-2xl border border-border bg-card p-6">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <MessageSquare className="h-4.5 w-4.5 text-sage" />
          <h2 className="font-serif text-[17px] font-medium tracking-tight">
            {language === "tr" ? "Konuşma dökümü" : "Conversation Transcript"}
          </h2>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {history.length} {language === "tr" ? "mesaj" : "messages"}
          </span>
        </div>
        <span
          className={cn(
            "text-[12px] font-semibold text-muted-foreground transition-transform",
            expanded && "rotate-180"
          )}
        >
          ▼
        </span>
      </button>

      {expanded && (
        <div className="mt-5 flex flex-col gap-5">
          {groups.map((group, gIdx) => (
            <div key={gIdx}>
              {/* Question header */}
              {group.topic === "wrap_up" ? (
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-plum-soft text-[10px] font-bold text-plum">
                    ✓
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-plum">
                    {language === "tr" ? "Kapanış" : "Wrap-up"}
                  </span>
                </div>
              ) : (
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-sage-soft text-[10px] font-bold text-sage">
                    {group.questionNumber}
                  </span>
                  {group.topic && (
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-sage">
                      {group.topic}
                    </span>
                  )}
                </div>
              )}

              {/* Messages */}
              <div className="flex flex-col gap-2">
                {group.messages.map((msg, mIdx) => {
                  const isInterviewer = msg.role === "interviewer"
                  const isFollowUp = msg.action === "follow_up"

                  return (
                    <div
                      key={mIdx}
                      className={cn(
                        "flex gap-2.5",
                        isInterviewer ? "pr-8" : "flex-row-reverse pl-8"
                      )}
                    >
                      {/* Avatar */}
                      <div
                        className={cn(
                          "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                          isInterviewer
                            ? "bg-sage-soft text-sage"
                            : "bg-clay-soft text-clay"
                        )}
                      >
                        {isInterviewer ? (
                          <MessageSquare className="h-3.5 w-3.5" />
                        ) : (
                          <User className="h-3.5 w-3.5" />
                        )}
                      </div>

                      {/* Bubble */}
                      <div
                        className={cn(
                          "min-w-0 flex-1 rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                          isInterviewer
                            ? "rounded-tl-sm bg-secondary/80"
                            : "rounded-tr-sm bg-primary/[0.07]",
                          msg.interrupted && "opacity-70"
                        )}
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {isInterviewer
                              ? language === "tr"
                                ? "Mülakatçı"
                                : "Interviewer"
                              : language === "tr"
                                ? "Aday"
                                : "Candidate"}
                          </span>
                          {isFollowUp && (
                            <span className="rounded-full bg-clay-soft px-1.5 py-0.5 text-[9px] font-semibold text-clay">
                              {language === "tr" ? "Takip sorusu" : "Follow-up"}
                            </span>
                          )}
                          {msg.interrupted && (
                            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                              {language === "tr" ? "Kesildi" : "Interrupted"}
                            </span>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Separator between question groups */}
              {gIdx < groups.length - 1 && (
                <div className="mt-4 border-t border-border/60" />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
