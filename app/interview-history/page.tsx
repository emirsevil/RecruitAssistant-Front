"use client"

import { useState } from "react"
import { format, type Locale } from "date-fns"
import { enUS, tr } from "date-fns/locale"

import { PageContainer, PageHeader } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  MessageSquare,
  Mic,
  Type,
  Clock,
  Target,
  PlayCircle,
  ChevronRight,
  ClipboardList,
} from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useInterviewHistory, useInterviewDetail } from "@/hooks/use-interview-history"
import type { InterviewSummary } from "@/hooks/use-interview-history"
import { STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR } from "next/dist/lib/constants"

export default function InterviewHistoryPage() {
  const { t, language } = useLanguage()
  const dateLocale = language === "tr" ? tr : enUS
  const { interviews, isLoading, error } = useInterviewHistory()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Detail view
  if (selectedId) {
    return (
      <InterviewDetailView
        interviewId={selectedId}
        onBack={() => setSelectedId(null)}
      />
    )
  }

  // List view
  return (
    <PageContainer>
      <PageHeader
        title={t("Interview History")}
        description={t("View your past interview sessions and results")}
        action={
          <Link href="/mock-interview">
            <Button className="gap-2">
              <PlayCircle className="h-4 w-4" />
              {t("Start New Interview")}
            </Button>
          </Link>
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6 text-center text-destructive">
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && interviews.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-4 p-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">{t("No interviews yet")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("Start your first mock interview to see your history here.")}
              </p>
            </div>
            <Link href="/mock-interview">
              <Button className="gap-2">
                <PlayCircle className="h-4 w-4" />
                {t("Go to Mock Interview")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!isLoading && interviews.length > 0 && (
        <div className="space-y-3">
          {interviews.map((interview) => (
            <InterviewCard
              key={interview.id}
              interview={interview}
              dateLocale={dateLocale}
              onSelect={() => setSelectedId(interview.id)}
            />
          ))}
        </div>
      )}
    </PageContainer>
  )
}

// ─── Interview Card Component ──────────────────────────────────────

function InterviewCard({
  interview,
  dateLocale,
  onSelect,
}: {
  interview: InterviewSummary
  dateLocale: Locale
  onSelect: () => void
}) {
  const { t } = useLanguage()

  const statusColor = {
    completed: "bg-green-500/10 text-green-600 border-green-500/20",
    in_progress: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
  }[interview.status] || "bg-muted text-muted-foreground"

  const statusLabel = {
    completed: t("Completed"),
    in_progress: t("In Progress"),
    cancelled: t("Cancelled"),
  }[interview.status] || interview.status

  const typeLabel = interview.interview_type === "technical" ? t("Technical") : t("HR")
  const modeLabel = interview.mode === "voice" ? t("Voice") : t("Text")

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return t("N/A")
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-md"
      onClick={onSelect}
    >
      <CardContent className="flex items-center gap-4 p-4 sm:p-6">
        {/* Score circle */}
        <div className="hidden sm:flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
          {interview.overall_score !== null ? (
            <span className="text-lg font-bold text-primary">{interview.overall_score}</span>
          ) : (
            <Target className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-sm sm:text-base">
              {interview.company_name || `Workspace #${interview.workspace_id}`}
            </span>
            <Badge variant="outline" className="text-xs gap-1">
              {interview.mode === "voice" ? <Mic className="h-3 w-3" /> : <Type className="h-3 w-3" />}
              {modeLabel}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {typeLabel}
            </Badge>
            <Badge className={`text-xs border ${statusColor}`} variant="outline">
              {statusLabel}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{format(new Date(interview.created_at), "MMM d, yyyy HH:mm", { locale: dateLocale })}</span>
            {interview.difficulty && (
              <span className="capitalize">• {interview.difficulty}</span>
            )}
            {interview.duration_seconds && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(interview.duration_seconds)}
              </span>
            )}
            {interview.categories && (
              <span className="truncate max-w-[200px]">• {interview.categories}</span>
            )}
          </div>
        </div>

        {/* Score on mobile + chevron */}
        <div className="flex items-center gap-3">
          <div className="sm:hidden text-center">
            {interview.overall_score !== null && (
              <span className="text-xl font-bold text-primary">{interview.overall_score}%</span>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Interview Detail View ─────────────────────────────────────────

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

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </PageContainer>
    )
  }

  if (error || !detail) {
    return (
      <PageContainer>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{error || "Interview not found"}</p>
            <Button variant="outline" className="mt-4" onClick={onBack}>
              {t("Back to History")}
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  const typeLabel = detail.interview_type === "technical" ? t("Technical") : t("HR")
  const modeLabel = detail.mode === "voice" ? t("Voice") : t("Text")

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4 gap-1.5" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          {t("Back to History")}
        </Button>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{t("Interview Details")}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{format(new Date(detail.created_at), "MMMM d, yyyy HH:mm", { locale: dateLocale })}</span>
              <Badge variant="outline" className="gap-1">
                {detail.mode === "voice" ? <Mic className="h-3 w-3" /> : <Type className="h-3 w-3" />}
                {modeLabel}
              </Badge>
              <Badge variant="outline">{typeLabel}</Badge>
              {detail.difficulty && (
                <Badge variant="outline" className="capitalize">{detail.difficulty}</Badge>
              )}
              {detail.duration_seconds && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(detail.duration_seconds)}
                </Badge>
              )}
            </div>
          </div>
          <Link href="/mock-interview">
            <Button variant="outline" className="gap-2">
              <PlayCircle className="h-4 w-4" />
              {t("Retake Interview")}
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Overall Score */}
        {detail.overall_score !== null && (
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-8 text-center">
              <div className="mb-2 text-sm font-medium text-muted-foreground">{t("Overall Score")}</div>
              <div className="mb-4 text-6xl font-bold text-primary">{detail.overall_score}%</div>
              {detail.overall_feedback && (
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto">{detail.overall_feedback}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Questions & Answers */}
        {detail.questions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("Questions & Answers")}</CardTitle>
              <CardDescription>{t("Detailed feedback for each question")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {detail.questions.map((qa, idx) => (
                <div key={idx} className="rounded-lg border border-border p-4 space-y-3">
                  {/* Question header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">{qa.topic || `Q${idx + 1}`}</Badge>
                      </div>
                      <p className="font-medium">{qa.question}</p>
                    </div>
                    {qa.score !== null && qa.score !== undefined && (
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-bold text-primary">{qa.score}%</div>
                      </div>
                    )}
                  </div>

                  {/* Answer */}
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">{t("Your Answer")}</p>
                    <p className="text-sm">
                      {qa.answer || <span className="italic text-muted-foreground">{t("No answer provided")}</span>}
                    </p>
                  </div>

                  {/* Feedback */}
                  {qa.feedback && (
                    <div className="rounded-md bg-primary/5 border border-primary/10 p-3">
                      <p className="text-xs font-medium text-primary mb-1">{t("AI Feedback")}</p>
                      <p className="text-sm text-muted-foreground">{qa.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Conversation Transcript (voice mode) */}
        {detail.conversation_history && detail.conversation_history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("Conversation Transcript")}</CardTitle>
              <CardDescription>{t("Full conversation from the voice interview")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {detail.conversation_history.map((entry, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 ${entry.role === "interviewer" ? "" : "flex-row-reverse"
                    }`}
                >
                  <div
                    className={`rounded-lg px-3 py-2 text-sm max-w-[80%] ${entry.role === "interviewer"
                        ? "bg-primary/10"
                        : "bg-muted"
                      }`}
                  >
                    <p className="text-xs font-medium mb-1 opacity-60">
                      {entry.role === "interviewer" ? "🤖 AI" : "👤"}
                    </p>
                    <p className="leading-relaxed">{entry.text}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/mock-interview" className="flex-1">
            <Button size="lg" className="w-full gap-2">
              <PlayCircle className="h-5 w-5" />
              {t("Start New Interview")}
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="flex-1 gap-2" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
            {t("Back to History")}
          </Button>
        </div>
      </div>
    </PageContainer>
  )
}