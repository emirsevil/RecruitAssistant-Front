"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format, formatDistanceToNow } from "date-fns"
import { enUS, tr } from "date-fns/locale"
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  ChevronRight,
  FileQuestion,
  FileText,
  Flame,
  Loader2,
  MessageSquare,
  Minus,
  Pencil,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { useWorkspace } from "@/lib/workspace-context"
import { useDashboard } from "@/hooks/use-dashboard"
import { RingProgress } from "@/components/calm/ring-progress"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { workspaces, isHydrated, activeWorkspace } = useWorkspace()
  const workspaceIdNum = activeWorkspace ? Number(activeWorkspace.id) : null
  const { data, isLoading, updateGoals } = useDashboard(workspaceIdNum)
  const { t, language } = useLanguage()
  const tr_ = language === "tr"
  const dateLocale = tr_ ? tr : enUS

  useEffect(() => {
    if (isHydrated && workspaces.length === 0 && user) {
      router.replace("/onboarding")
    }
  }, [isHydrated, workspaces.length, router, user])

  const firstName = (user?.full_name || user?.email || "").split(" ")[0] || ""

  // Defer date-dependent values to avoid SSR/client hydration mismatch
  const [mounted, setMounted] = useState(false)
  const [greeting, setGreeting] = useState("")
  const [today, setToday] = useState("")

  useEffect(() => {
    setMounted(true)
    const h = new Date().getHours()
    if (tr_) {
      setGreeting(h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar")
    } else {
      setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening")
    }
    setToday(
      new Date().toLocaleDateString(tr_ ? "tr-TR" : "en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    )
  }, [tr_])

  const stats = data?.stats
  const readiness = stats
    ? Math.round(((stats.avg_hr_score || 0) + (stats.avg_technical_score || 0)) / 2)
    : 0

  const weekly = data?.weekly_goals ?? {
    interviews_target: 4,
    interviews_actual: 0,
    quizzes_target: 6,
    quizzes_actual: 0,
    practice_minutes_target: 240,
    practice_minutes_actual: 0,
  }

  // Lowest-scoring skills first → that's where the user should focus
  const focusSkills = useMemo(() => {
    if (!data?.skill_scores) return []
    return [...data.skill_scores].sort((a, b) => a.score - b.score).slice(0, 5)
  }, [data?.skill_scores])

  const upcoming = data?.upcoming_events ?? []
  const activity = data?.activity ?? []

  // ── Real workspace-derived facts (no mock copy) ───────────────────
  const categoryCount = activeWorkspace?.categories?.length ?? 0
  const hasGeneratedCv = Boolean(activeWorkspace?.generated_cv_id)

  return (
    <div className="px-4 py-5 sm:px-7 sm:py-7 md:px-9">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div
        data-tour="dashboard-header"
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4"
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {mounted ? today : ""}
          </p>
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
          {activeWorkspace && (
            <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[12px] text-muted-foreground">
              <span className="text-base leading-none">{activeWorkspace.emoji}</span>
              <span className="font-medium text-foreground">{activeWorkspace.name}</span>
              {activeWorkspace.jobName && (
                <>
                  <span className="text-subtle">·</span>
                  <span>{activeWorkspace.jobName}</span>
                </>
              )}
            </p>
          )}
        </div>
      </div>

      {/* ── KPI Strip ────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={<MessageSquare className="h-4 w-4" />}
          label={tr_ ? "Tamamlanan mülakat" : "Interviews completed"}
          value={stats?.completed_interviews ?? 0}
          isLoading={!stats && isLoading}
          accent="sage"
        />
        <KpiCard
          icon={<Flame className="h-4 w-4" />}
          label={tr_ ? "Bu hafta" : "This week"}
          value={stats?.completed_interviews_this_week ?? 0}
          isLoading={!stats && isLoading}
          accent="clay"
        />
        <KpiCard
          icon={<Trophy className="h-4 w-4" />}
          label={tr_ ? "HR puan ort." : "Avg HR score"}
          value={Math.round(stats?.avg_hr_score ?? 0)}
          unit="%"
          trend={stats?.avg_hr_score_trend}
          isLoading={!stats && isLoading}
          accent="plum"
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          label={tr_ ? "Teknik puan ort." : "Avg Technical score"}
          value={Math.round(stats?.avg_technical_score ?? 0)}
          unit="%"
          trend={stats?.avg_technical_score_trend}
          isLoading={!stats && isLoading}
          accent="sage"
        />
      </div>

      {/* ── Quick Action Tiles (real subtitles only) ────────── */}
      <div data-tour="dashboard-actions" className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ActionTile
          href="/mock-interview"
          icon={<MessageSquare className="h-5 w-5" />}
          title={tr_ ? "Mülakat yap" : "Mock interview"}
          subtitle={
            stats && stats.completed_interviews > 0
              ? tr_
                ? `${stats.completed_interviews} tamamlandı`
                : `${stats.completed_interviews} completed`
              : tr_
                ? "Konuş ve geri bildirim al"
                : "Practice and get feedback"
          }
          accent="sage"
          primary
        />
        <ActionTile
          href="/quizzes"
          icon={<FileQuestion className="h-5 w-5" />}
          title={tr_ ? "Test çöz" : "Take a quiz"}
          subtitle={
            categoryCount > 0
              ? tr_
                ? `${categoryCount} kategori hazır`
                : `${categoryCount} categories ready`
              : tr_
                ? "Önce kategorilerini seç"
                : "Pick categories first"
          }
          accent="clay"
        />
        <ActionTile
          href="/schedule"
          icon={<Calendar className="h-5 w-5" />}
          title={tr_ ? "Takvim" : "Schedule"}
          subtitle={
            upcoming.length > 0
              ? tr_
                ? `${upcoming.length} yaklaşan etkinlik`
                : `${upcoming.length} upcoming`
              : tr_
                ? "Etkinlik planlanmamış"
                : "No events planned"
          }
          accent="plum"
        />
        <ActionTile
          href="/cv-studio"
          icon={<FileText className="h-5 w-5" />}
          title={tr_ ? "CV Stüdyosu" : "CV Studio"}
          subtitle={
            hasGeneratedCv
              ? tr_
                ? "CV hazır · görüntüle"
                : "CV ready · view"
              : tr_
                ? "CV'ni oluştur"
                : "Build your CV"
          }
          accent="sage"
        />
      </div>

      {/* ── Two-column main ─────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* ── Left column ──────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Readiness + Weekly Goals */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-stretch md:gap-7">
              {/* Readiness ring */}
              <div
                data-tour="dashboard-readiness"
                className="flex flex-shrink-0 items-center gap-4 md:flex-col md:items-start md:justify-center md:border-r md:border-border md:pr-7"
              >
                <RingProgress value={readiness} size={104} />
                <div>
                  <p className="eyebrow">{tr_ ? "Hazırlığın" : "Readiness"}</p>
                  <p className="serif-headline mt-1 text-[40px] leading-none tabular-nums">
                    {readiness}
                    <span className="text-[18px] text-subtle">%</span>
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {tr_ ? "HR + Teknik ortalaması" : "HR + Technical avg."}
                  </p>
                </div>
              </div>

              {/* Weekly goals — interactive editing */}
              <div className="flex-1">
                <header className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="eyebrow flex items-center gap-1.5">
                      <Target className="h-3 w-3" />
                      {tr_ ? "Bu haftaki hedefler" : "This week's goals"}
                    </p>
                  </div>
                </header>

                <div className="flex flex-col gap-3">
                  <GoalRow
                    label={tr_ ? "Mülakatlar" : "Interviews"}
                    reachedLabel={tr_ ? "Tamam" : "Hit"}
                    actual={weekly.interviews_actual}
                    target={weekly.interviews_target}
                    accent="sage"
                    onChangeTarget={(next) =>
                      updateGoals({
                        interviews_target: next,
                        quizzes_target: weekly.quizzes_target,
                        practice_minutes_target: weekly.practice_minutes_target,
                      })
                    }
                  />
                  <GoalRow
                    label={tr_ ? "Testler" : "Quizzes"}
                    reachedLabel={tr_ ? "Tamam" : "Hit"}
                    actual={weekly.quizzes_actual}
                    target={weekly.quizzes_target}
                    accent="clay"
                    onChangeTarget={(next) =>
                      updateGoals({
                        interviews_target: weekly.interviews_target,
                        quizzes_target: next,
                        practice_minutes_target: weekly.practice_minutes_target,
                      })
                    }
                  />
                  <GoalRow
                    label={tr_ ? "Pratik dakika" : "Practice minutes"}
                    reachedLabel={tr_ ? "Tamam" : "Hit"}
                    actual={weekly.practice_minutes_actual}
                    target={weekly.practice_minutes_target}
                    accent="plum"
                    step={30}
                    onChangeTarget={(next) =>
                      updateGoals({
                        interviews_target: weekly.interviews_target,
                        quizzes_target: weekly.quizzes_target,
                        practice_minutes_target: next,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Skills focus */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <header className="mb-4 flex items-baseline justify-between">
              <h2 className="font-serif text-[19px] font-medium tracking-tight">
                {tr_ ? "Odak yetenekler" : "Skills to focus on"}
              </h2>
              {focusSkills.length > 0 && (
                <Link
                  href="/quizzes"
                  className="text-[12px] font-semibold text-sage transition-colors hover:text-sage/80"
                >
                  {tr_ ? "Test çöz" : "Practice"}
                  <ArrowRight className="ml-0.5 inline h-3 w-3" />
                </Link>
              )}
            </header>

            {focusSkills.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="h-5 w-5 text-subtle" />}
                title={tr_ ? "Henüz veri yok" : "No data yet"}
                description={
                  tr_
                    ? "Bir mülakat veya test tamamla, odak alanlarını burada gösterelim."
                    : "Finish an interview or quiz so we can surface your focus areas."
                }
                cta={tr_ ? "İlk testini çöz" : "Take your first quiz"}
                href="/quizzes"
              />
            ) : (
              <div className="flex flex-col gap-3">
                {focusSkills.map((s) => (
                  <SkillRow key={s.id} name={t(s.skill_name)} score={s.score} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── Right column ─────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Upcoming */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <header className="mb-4 flex items-baseline justify-between">
              <h2 className="font-serif text-[19px] font-medium tracking-tight">
                {tr_ ? "Yaklaşan" : "Upcoming"}
              </h2>
              <Link
                href="/schedule"
                className="text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                {tr_ ? "Tümü" : "All"}
                <ChevronRight className="ml-0.5 inline h-3 w-3" />
              </Link>
            </header>

            {upcoming.length === 0 ? (
              <EmptyState
                icon={<Calendar className="h-5 w-5 text-subtle" />}
                title={tr_ ? "Etkinlik yok" : "Nothing planned"}
                description={
                  tr_
                    ? "Bir mülakat veya test planlayarak ritim yakala."
                    : "Schedule an interview or quiz to build a rhythm."
                }
                cta={tr_ ? "Planla" : "Schedule"}
                href="/schedule"
              />
            ) : (
              <div className="flex flex-col gap-2">
                {upcoming.slice(0, 4).map((e, i) => (
                  <UpcomingRow
                    key={e.id}
                    title={t(e.title)}
                    type={e.event_type}
                    when={format(new Date(e.start_time), "MMM d, HH:mm", { locale: dateLocale })}
                    primary={i === 0}
                    href={
                      e.event_type === "interview"
                        ? "/mock-interview"
                        : e.event_type === "quiz"
                          ? "/quizzes"
                          : "/schedule"
                    }
                    ctaLabel={tr_ ? "Aç" : "Open"}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Recent activity */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <header className="mb-4 flex items-baseline justify-between">
              <h2 className="font-serif text-[19px] font-medium tracking-tight">
                {tr_ ? "Son aktivite" : "Recent activity"}
              </h2>
            </header>

            {activity.length === 0 ? (
              <EmptyState
                icon={<Activity className="h-5 w-5 text-subtle" />}
                title={tr_ ? "Henüz aktivite yok" : "No activity yet"}
                description={
                  tr_
                    ? "Çalışmaya başla, ilerlemen burada görünecek."
                    : "Once you start practicing, your progress will land here."
                }
              />
            ) : (
              <ol className="relative ml-2 flex flex-col gap-3 border-l border-border pl-4">
                {activity.slice(0, 6).map((a) => (
                  <ActivityRow
                    key={a.id}
                    title={t(a.title)}
                    description={a.description ? t(a.description) : null}
                    when={formatDistanceToNow(new Date(a.created_at), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                    type={a.activity_type}
                  />
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>

      {isLoading && !data && (
        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          {tr_ ? "Yükleniyor..." : "Loading..."}
        </p>
      )}
    </div>
  )
}

// ─── KPI card with optional trend arrow ─────────────────────────────
function KpiCard({
  icon,
  label,
  value,
  unit,
  trend,
  isLoading,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number
  unit?: string
  trend?: number
  isLoading?: boolean
  accent: "sage" | "clay" | "plum"
}) {
  const accentMap = {
    sage: "bg-sage-soft text-sage",
    clay: "bg-clay-soft text-clay",
    plum: "bg-plum-soft text-plum",
  } as const

  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/20">
      <span
        className={cn(
          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
          accentMap[accent]
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              <span className="font-serif text-[22px] tabular-nums">{value}</span>
              {unit && <span className="text-[12px] text-subtle">{unit}</span>}
              {typeof trend === "number" && trend !== 0 && (
                <span
                  className={cn(
                    "ml-auto inline-flex items-center text-[11px] font-semibold",
                    trend > 0 ? "text-sage" : "text-clay"
                  )}
                  title={trend > 0 ? "Trending up" : "Trending down"}
                >
                  {trend > 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(Math.round(trend))}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Quick action tile ──────────────────────────────────────────────
function ActionTile({
  href,
  icon,
  title,
  subtitle,
  accent,
  primary,
}: {
  href: string
  icon: React.ReactNode
  title: string
  subtitle: string
  accent: "sage" | "clay" | "plum"
  primary?: boolean
}) {
  const accentMap = {
    sage: { soft: "bg-sage-soft text-sage", border: "hover:border-sage/40", glow: "bg-sage/15" },
    clay: { soft: "bg-clay-soft text-clay", border: "hover:border-clay/40", glow: "bg-clay/15" },
    plum: { soft: "bg-plum-soft text-plum", border: "hover:border-plum/40", glow: "bg-plum/15" },
  } as const
  const a = accentMap[accent]

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-200",
        a.border,
        primary && "ring-1 ring-sage/20"
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl transition-opacity duration-200 opacity-50 group-hover:opacity-100",
          a.glow
        )}
        aria-hidden
      />
      <div className="relative flex items-center justify-between">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", a.soft)}>
          {icon}
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
      <div className="relative">
        <p className="font-serif text-[16px] font-medium leading-tight tracking-tight">{title}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{subtitle}</p>
      </div>
    </Link>
  )
}

// ─── Editable weekly goal row ───────────────────────────────────────
function GoalRow({
  label,
  reachedLabel,
  actual,
  target,
  accent,
  step = 1,
  onChangeTarget,
}: {
  label: string
  reachedLabel: string
  actual: number
  target: number
  accent: "sage" | "clay" | "plum"
  step?: number
  onChangeTarget: (next: number) => Promise<boolean> | void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(target)
  const [saving, setSaving] = useState(false)
  const pct = target > 0 ? Math.min(100, (actual / target) * 100) : 0
  const reached = actual >= target && target > 0
  const accentMap = {
    sage: { bar: "bg-sage", track: "bg-sage-soft", chip: "text-sage bg-sage-soft" },
    clay: { bar: "bg-clay", track: "bg-clay-soft", chip: "text-clay bg-clay-soft" },
    plum: { bar: "bg-plum", track: "bg-plum-soft", chip: "text-plum bg-plum-soft" },
  } as const
  const a = accentMap[accent]

  useEffect(() => {
    if (!editing) setDraft(target)
  }, [target, editing])

  const save = async () => {
    if (draft === target) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await onChangeTarget(Math.max(step, draft))
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-background/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("h-1.5 w-1.5 rounded-full", a.bar)} />
          <span className="text-[13px] font-medium">{label}</span>
          {reached && (
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", a.chip)}>
              <Check className="h-2.5 w-2.5" />
              {reachedLabel}
            </span>
          )}
        </div>

        {editing ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setDraft((d) => Math.max(step, d - step))}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-border hover:bg-secondary"
              aria-label="decrement"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="min-w-[28px] text-center text-[13px] font-semibold tabular-nums">{draft}</span>
            <button
              type="button"
              onClick={() => setDraft((d) => d + step)}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-border hover:bg-secondary"
              aria-label="increment"
            >
              <Plus className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="ml-1 flex h-6 w-6 items-center justify-center rounded-md bg-sage text-white hover:bg-sage/90"
              aria-label="save"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-border hover:bg-secondary"
              aria-label="cancel"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="group flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-secondary"
            title="Edit target"
          >
            <span className="font-serif text-[14px] tabular-nums">
              {actual}
              <span className="text-subtle"> / {target}</span>
            </span>
            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}
      </div>
      <div className={cn("mt-2.5 h-1.5 overflow-hidden rounded-full", a.track)}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", a.bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Skill row (focus list) ─────────────────────────────────────────
function SkillRow({ name, score }: { name: string; score: number }) {
  const safe = Math.max(0, Math.min(100, Math.round(score)))
  const color = safe < 65 ? "bg-clay" : safe < 80 ? "bg-[var(--gold)]" : "bg-sage"
  return (
    <div className="grid grid-cols-[minmax(80px,1fr)_2fr_42px] items-center gap-3.5">
      <span className="truncate text-[13px] font-medium">{name}</span>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${safe}%` }} />
      </div>
      <span className="text-right text-[12px] tabular-nums text-muted-foreground">{safe}%</span>
    </div>
  )
}

// ─── Upcoming row ───────────────────────────────────────────────────
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
  const Icon = type === "interview" ? MessageSquare : type === "quiz" ? FileQuestion : Calendar
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-lg border p-3 transition-colors",
        primary
          ? "border-sage/30 bg-sage-soft hover:border-sage/50"
          : "border-border hover:border-foreground/20"
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
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

// ─── Activity timeline row ──────────────────────────────────────────
function ActivityRow({
  title,
  description,
  when,
  type,
}: {
  title: string
  description: string | null
  when: string
  type: string
}) {
  const Icon =
    type.includes("interview") ? MessageSquare : type.includes("quiz") ? FileQuestion : Activity

  return (
    <li className="relative">
      <span className="absolute -left-[21px] top-1 flex h-3 w-3 items-center justify-center rounded-full border-2 border-card bg-sage" />
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="text-[13px] font-medium leading-snug">{title}</p>
          {description && (
            <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{description}</p>
          )}
          <p className="mt-0.5 text-[11px] text-subtle">{when}</p>
        </div>
      </div>
    </li>
  )
}

// ─── Empty state ────────────────────────────────────────────────────
function EmptyState({
  icon,
  title,
  description,
  cta,
  href,
}: {
  icon: React.ReactNode
  title: string
  description: string
  cta?: string
  href?: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-8 text-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
        {icon}
      </span>
      <p className="text-[13px] font-semibold">{title}</p>
      <p className="max-w-[260px] text-[11.5px] leading-relaxed text-muted-foreground">
        {description}
      </p>
      {cta && href && (
        <Button asChild size="sm" variant="outline" className="mt-1.5 h-8 text-[12px]">
          <Link href={href}>
            {cta}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      )}
    </div>
  )
}
