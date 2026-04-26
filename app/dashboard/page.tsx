"use client"

import Link from "next/link"
import { useEffect } from "react"
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
import { RingProgress } from "@/components/calm/ring-progress"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { workspaces, isHydrated } = useWorkspace()
  const { data, isLoading } = useDashboard()
  const { t, language } = useLanguage()
  const dateLocale = language === "tr" ? tr : enUS

  useEffect(() => {
    if (isHydrated && workspaces.length === 0 && user) {
      router.replace("/onboarding")
    }
  }, [isHydrated, workspaces.length, router, user])

  const firstName = (user?.full_name || user?.email || "").split(" ")[0] || ""

  const greeting = (() => {
    const h = new Date().getHours()
    if (language === "tr") {
      if (h < 12) return "Günaydın"
      if (h < 18) return "İyi günler"
      return "İyi akşamlar"
    }
    if (h < 12) return "Good morning"
    if (h < 18) return "Good afternoon"
    return "Good evening"
  })()

  const today = new Date().toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const readiness = data
    ? Math.round((data.stats.avg_hr_score + data.stats.avg_technical_score + data.stats.cv_ats_score) / 3) || 0
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

  // Days of the week (Mon = 0)
  const todayIdx = (new Date().getDay() + 6) % 7
  const dayLetters =
    language === "tr" ? ["P", "S", "Ç", "P", "C", "C", "P"] : ["M", "T", "W", "T", "F", "S", "S"]

  return (
    <div className="px-7 py-7 md:px-9">
      {/* Hero header */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{today}</p>
          <h1 className="serif-headline mt-1.5 text-[32px] font-normal leading-tight tracking-tight">
            {greeting}
            {firstName && (
              <>
                , <em className="italic">{firstName}</em>
              </>
            )}
            .
          </h1>
        </div>
        {weeklyActive > 0 && (
          <div className="inline-flex items-center gap-2 rounded-full bg-clay-soft px-3 py-1.5 text-[12px] font-semibold text-clay">
            <Flame className="h-3.5 w-3.5" />
            {weeklyActive} {language === "tr" ? "bu hafta" : "this week"}
          </div>
        )}
      </div>

      {/* Hero readiness band */}
      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="flex items-center gap-5 rounded-2xl border border-border bg-card p-5">
          <RingProgress value={readiness} size={92} />
          <div>
            <p className="eyebrow">{language === "tr" ? "Hazırlığın" : "Your readiness"}</p>
            <p className="serif-headline mt-1.5 text-[36px] leading-none tabular-nums">
              {readiness}
              <span className="text-[18px] text-subtle">%</span>
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {language === "tr" ? "Genel hazırlık" : "Overall readiness"}
              {trend !== 0 && (
                <>
                  {" "}
                  ·{" "}
                  <span className="font-semibold text-sage">
                    {trend > 0 ? "+" : ""}
                    {trend}%
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <GoalCard
          label={language === "tr" ? "Mülakatlar" : "Interviews"}
          done={weekly.interviews_actual}
          target={weekly.interviews_target}
          accent="sage"
        />
        <GoalCard
          label={language === "tr" ? "Testler" : "Quizzes"}
          done={weekly.quizzes_actual}
          target={weekly.quizzes_target}
          accent="clay"
        />
        <GoalCard
          label={language === "tr" ? "Pratik süresi" : "Practice time"}
          done={weekly.practice_minutes_actual}
          target={weekly.practice_minutes_target}
          unit="m"
          accent="plum"
        />
      </div>

      {/* Two-col main */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-4">
          {/* Next actions */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <header className="mb-4 flex items-baseline justify-between">
              <h2 className="font-serif text-[19px] font-medium tracking-tight">
                {language === "tr" ? "Sıradaki adımlar" : "Next actions"}
              </h2>
              <span className="text-[11px] text-subtle">
                3 {language === "tr" ? "öneri" : "suggestions"}
              </span>
            </header>
            <div className="flex flex-col gap-2.5">
              <ActionRow
                primary
                icon={<MessageSquare className="h-[18px] w-[18px]" />}
                accent="sage"
                title={language === "tr" ? "Mock mülakat yap" : "Run a mock interview"}
                sub={
                  language === "tr"
                    ? "Bugün için planlanan System Design oturumu"
                    : "Your System Design round is queued for today"
                }
                cta={language === "tr" ? "Şimdi başla" : "Start now"}
                href="/mock-interview"
              />
              <ActionRow
                icon={<FileQuestion className="h-[18px] w-[18px]" />}
                accent="clay"
                title={language === "tr" ? "Test çöz" : "Take a quiz"}
                sub={
                  language === "tr"
                    ? "PostgreSQL · 12 soru · ortalama 4 dk"
                    : "PostgreSQL · 12 questions · ~4 min"
                }
                cta={language === "tr" ? "Aç" : "Open"}
                href="/quizzes"
              />
              <ActionRow
                icon={<FileText className="h-[18px] w-[18px]" />}
                accent="plum"
                title={language === "tr" ? "CV'yi geliştir" : "Polish your CV"}
                sub={
                  language === "tr"
                    ? "ATS skoru: " + (data?.stats.cv_ats_score ?? 0) + "% — birkaç hızlı düzenleme bekliyor"
                    : "ATS score: " + (data?.stats.cv_ats_score ?? 0) + "% — a few quick wins available"
                }
                cta={language === "tr" ? "Aç" : "Open"}
                href="/cv-studio"
              />
            </div>
          </section>

          {/* Skills focus */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-3.5 font-serif text-[19px] font-medium tracking-tight">
              {language === "tr" ? "Odaklanılacak yetenekler" : "Skills to focus on"}
            </h2>
            {skills.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {language === "tr"
                  ? "Önce bir test çözerek odak alanını belirleyelim."
                  : "Take a baseline quiz so we can surface focus areas."}
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {skills.map((s) => (
                  <SkillRow key={s.id} name={t(s.skill_name)} score={s.score} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-border bg-card p-6">
            <header className="mb-3.5 flex items-baseline justify-between">
              <h2 className="font-serif text-[19px] font-medium tracking-tight">
                {language === "tr" ? "Yaklaşan" : "Upcoming"}
              </h2>
              <span className="text-[11px] text-subtle">
                {language === "tr" ? "Bugün / yarın" : "Today / tomorrow"}
              </span>
            </header>

            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-6 text-center">
                <Calendar className="h-5 w-5 text-subtle" />
                <p className="text-[12px] text-muted-foreground">
                  {language === "tr"
                    ? "Planlanmış etkinlik yok."
                    : "No upcoming events."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {upcoming.map((u, i) => (
                  <UpcomingRow
                    key={u.id}
                    title={t(u.title)}
                    type={u.event_type}
                    when={format(new Date(u.start_time), "MMM d, HH:mm", { locale: dateLocale })}
                    primary={i === 0}
                    href={u.event_type === "interview" ? "/mock-interview" : u.event_type === "quiz" ? "/quizzes" : "/schedule"}
                    ctaLabel={language === "tr" ? "Başla" : "Start"}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Streak calendar */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-3.5 font-serif text-[19px] font-medium tracking-tight">
              {language === "tr" ? "Bu hafta" : "This week"}
            </h2>
            <div className="grid grid-cols-7 gap-1.5">
              {dayLetters.map((d, i) => {
                const filled = i < todayIdx
                const today = i === todayIdx
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] text-subtle">{d}</span>
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-semibold",
                        filled && "bg-sage text-white",
                        today && "border-2 border-clay",
                        !filled && !today && "bg-secondary text-subtle"
                      )}
                    >
                      {filled && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="mt-3.5 text-center text-[12px] text-muted-foreground">
              {language === "tr"
                ? "Devam et — küçük adımlar büyük fark yaratır."
                : "Keep it up — small daily reps compound."}
            </p>
          </section>
        </div>
      </div>

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
    <div className="grid grid-cols-[180px_1fr_36px] items-center gap-3.5">
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
