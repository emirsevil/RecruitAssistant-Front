"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { enUS, tr } from "date-fns/locale"
import {
  ArrowRight,
  Calendar,
  Check,
  FileQuestion,
  FileText,
  Flame,
  MessageSquare,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { useWorkspace } from "@/lib/workspace-context"
import { useDashboard } from "@/hooks/use-dashboard"
import { useSimulation } from "@/lib/simulation-context"
import { RingProgress } from "@/components/calm/ring-progress"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { workspaces, isHydrated, activeWorkspace } = useWorkspace()
  const { data, isLoading } = useDashboard(activeWorkspace ? Number(activeWorkspace.id) : null)
  const { status: simStatus } = useSimulation()
  const { t, language } = useLanguage()
  const dateLocale = language === "tr" ? tr : enUS

  useEffect(() => {
    if (isHydrated && workspaces.length === 0 && user) {
      router.replace("/onboarding")
    }
  }, [isHydrated, workspaces.length, router, user])

  // Auto-redirect to active stage if incomplete
  useEffect(() => {
    if (simStatus) {
      if (simStatus.stage === "cv_preparation") {
        router.replace("/cv-studio")
      } else if (simStatus.stage === "interview_cycle") {
        router.replace("/mock-interview")
      }
    }
  }, [simStatus, router])

  const firstName = (user?.full_name || user?.email || "").split(" ")[0] || ""

  // Defer date-dependent values to avoid SSR/client hydration mismatch
  const [mounted, setMounted] = useState(false)
  const [greeting, setGreeting] = useState("")
  const [today, setToday] = useState("")
  const [todayIdx, setTodayIdx] = useState(-1)

  useEffect(() => {
    setMounted(true)
    const h = new Date().getHours()
    if (language === "tr") {
      setGreeting(h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar")
    } else {
      setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening")
    }
    setToday(
      new Date().toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    )
    setTodayIdx((new Date().getDay() + 6) % 7)
  }, [language])

  const readiness = data
    ? Math.round((data.stats.avg_hr_score + data.stats.avg_technical_score) / 2) || 0
    : 0
  const trend = data?.stats?.avg_hr_score_trend ?? 0

  const weekly = data?.weekly_goals ?? {
    interviews_target: 4,
    interviews_actual: 0,
    quizzes_target: 6,
    quizzes_actual: 0,
    practice_minutes_target: 240,
    practice_minutes_actual: 0,
  }

  const weeklyActive = weekly.interviews_actual + weekly.quizzes_actual

  const skills = data?.skill_scores?.slice(0, 5) ?? []

  const upcoming = data?.upcoming_events?.slice(0, 3) ?? []

  const dayLetters =
    language === "tr" ? ["P", "S", "Ç", "P", "C", "C", "P"] : ["M", "T", "W", "T", "F", "S", "S"]

  return (
    <div className="px-4 py-5 sm:px-7 sm:py-7 md:px-9">
      {/* Hero header */}
      <div data-tour="dashboard-header" className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{mounted ? today : ""}</p>
          <h1 className="serif-headline mt-1.5 text-[24px] sm:text-[32px] font-normal leading-tight tracking-tight">
            {mounted ? (
              <>
                {greeting}
                {firstName && (
                  <>
                    , <em className="italic">{firstName}</em>
                  </>
                )}
                .
              </>
            ) : (
              <span className="opacity-0">.</span>
            )}
          </h1>
        </div>
        {weeklyActive > 0 && (
          <div className="inline-flex items-center gap-2 rounded-full bg-clay-soft px-3 py-1.5 text-[12px] font-semibold text-clay">
            <Flame className="h-3.5 w-3.5" />
            {weeklyActive} {language === "tr" ? "bu hafta" : "this week"}
          </div>
        )}
      </div>

      {simStatus && (
        <div className="mb-5 rounded-2xl border border-sage/30 bg-sage-soft p-5 sm:p-6 lg:col-span-1 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex-1">
            <p className="eyebrow text-sage mb-1">{language === "tr" ? "Mülakat Simülasyonu" : "Interview Simulation"}</p>
            <h2 className="serif-headline text-[24px] tracking-tight">
              {simStatus.stage === "cv_preparation" 
                ? (language === "tr" ? "Aşama 1: CV Hazırlığı" : "Stage 1: CV Preparation")
                : simStatus.stage === "interview_cycle" 
                ? (language === "tr" ? "Aşama 2: Mülakat Döngüsü" : "Stage 2: Interview Cycle")
                : (language === "tr" ? "Simülasyon Tamamlandı" : "Simulation Completed")}
            </h2>
            <p className="mt-2 text-sm text-sage/80 max-w-xl">
              {simStatus.stage === "cv_preparation" 
                ? (language === "tr" ? "Gerçek bir işe alım sürecindeymiş gibi CV ve niyet mektubunuzu oluşturarak başlayın." : "Start by creating your CV and cover letter as if you are in a real hiring process.")
                : simStatus.stage === "interview_cycle"
                ? (language === "tr" ? "Pratik yapın, mülakatlara katılın ve gerçek mülakatınız sonrası deneyiminizi bizimle paylaşın." : "Practice, attend mock interviews, and share your real interview feedback with us.")
                : (language === "tr" ? "Tebrikler! Mülakat simülasyonunu tamamladınız. Dashboard'u özgürce kullanabilirsiniz." : "Congratulations! You have completed the interview simulation. You can use the dashboard freely.")}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-[28px] font-semibold text-sage leading-none tabular-nums">
                {simStatus.total_interviews}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wider text-sage/70 mt-1">
                {language === "tr" ? "Mock Mülakat" : "Mock Intvs"}
              </p>
            </div>
            <div className="w-px h-10 bg-sage/20" />
            <div className="text-center">
              <p className="text-[28px] font-semibold text-sage leading-none tabular-nums">
                {simStatus.total_feedbacks}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wider text-sage/70 mt-1">
                {language === "tr" ? "Gerçek Geri Bildirim" : "Real Feedbacks"}
              </p>
            </div>
            {simStatus.stage === "cv_preparation" && (
              <Button
                onClick={() => router.push("/cv-studio")}
                className="bg-sage text-white hover:bg-sage/90 ml-2"
              >
                {language === "tr" ? "CV Studio'ya Git" : "Go to CV Studio"}
              </Button>
            )}
            {simStatus.stage === "interview_cycle" && (
              <Button
                onClick={() => router.push("/interview-feedback")}
                className="bg-sage text-white hover:bg-sage/90 ml-2"
              >
                {language === "tr" ? "Gerçek Mülakat Geri Bildirimi Ekle" : "Add Real Interview Feedback"}
              </Button>
            )}
          </div>
        </div>
      )}

      {isLoading && !data && (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {language === "tr" ? "Yükleniyor..." : "Loading..."}
        </p>
      )}
    </div>
  )
}

function GoalCard({
  label,
  done,
  target,
  unit,
  accent,
}: {
  label: string
  done: number
  target: number
  unit?: string
  accent: "sage" | "clay" | "plum"
}) {
  const pct = target > 0 ? Math.min(100, (done / target) * 100) : 0
  const accentMap = {
    sage: { bar: "bg-sage", track: "bg-sage-soft" },
    clay: { bar: "bg-clay", track: "bg-clay-soft" },
    plum: { bar: "bg-plum", track: "bg-plum-soft" },
  } as const
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="eyebrow">{label}</p>
      <div className="mt-2 flex items-baseline gap-1 font-serif">
        <span className="text-[28px] tabular-nums">{done}</span>
        <span className="text-[14px] text-subtle">
          / {target}
          {unit || ""}
        </span>
      </div>
      <div className={`mt-2.5 h-1 overflow-hidden rounded-full ${accentMap[accent].track}`}>
        <div
          className={`h-full rounded-full ${accentMap[accent].bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function ActionRow({
  icon,
  title,
  sub,
  cta,
  href,
  primary,
  accent,
}: {
  icon: React.ReactNode
  title: string
  sub: string
  cta: string
  href: string
  primary?: boolean
  accent: "sage" | "clay" | "plum"
}) {
  const accentMap = {
    sage: "bg-sage-soft text-sage",
    clay: "bg-clay-soft text-clay",
    plum: "bg-plum-soft text-plum",
  } as const
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3.5 rounded-xl border border-border p-3.5 transition-colors hover:border-primary/40",
        primary && "bg-secondary/60"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
          accentMap[accent]
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold leading-tight">{title}</p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">{sub}</p>
      </div>
      <span
        className={cn(
          "inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold",
          primary
            ? "border-transparent bg-sage text-white"
            : "border-border bg-card text-foreground"
        )}
      >
        {cta}
        <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  )
}

function SkillRow({ name, score }: { name: string; score: number }) {
  const color = score < 65 ? "bg-clay" : score < 80 ? "bg-[var(--gold)]" : "bg-sage"
  return (
    <div className="grid grid-cols-[minmax(80px,1fr)_2fr_36px] items-center gap-3.5">
      <span className="truncate text-[13px] font-medium">{name}</span>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-right text-[12px] tabular-nums text-muted-foreground">
        {score}%
      </span>
    </div>
  )
}

function UpcomingRow({
  title,
  type,
  when,
  primary,
  href,
  ctaLabel,
}: {
  title: string
  type: "interview" | "quiz" | "practice" | "other"
  when: string
  primary?: boolean
  href: string
  ctaLabel: string
}) {
  const Icon = type === "interview" ? MessageSquare : FileQuestion
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3",
        primary ? "border-primary/30 bg-sage-soft" : "border-border"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
          primary ? "bg-sage text-white" : "bg-secondary text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold">{title}</p>
        <p className="text-[11px] text-muted-foreground">{when}</p>
      </div>
      {primary && (
        <Link
          href={href}
          className="rounded-md bg-sage px-2.5 py-1 text-[11px] font-semibold text-white"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  )
}
