"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { enUS, tr } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { useWorkspace } from "@/lib/workspace-context"

import { PageContainer, PageHeader } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ArrowUpRight, MessageSquare, FileText, Brain, Clock, CheckCircle2, Target, Sparkles, CalendarPlus, Edit2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { DashboardActivity, DashboardData, DashboardUpcomingEvent, useDashboard } from "@/hooks/use-dashboard"

type DashboardAction = {
  title: string
  description: string
  action: string
  href: string
  icon: React.ReactNode
  priority?: "high" | "normal"
}

function formatPracticeHours(minutes: number, t: (key: string) => string) {
  const hours = minutes / 60
  const unit = t("H")
  if (Number.isInteger(hours)) return `${hours}${unit}`
  return `${hours.toFixed(1)}${unit}`
}

function goalProgress(actual: number, target: number) {
  if (target <= 0) return 0
  return Math.min(100, Math.round((actual / target) * 100))
}

function formatRelativeTime(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day

  if (diffMs < minute) return "just now"
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} minutes ago`
  if (diffMs < day) return `${Math.floor(diffMs / hour)} hours ago`
  if (diffMs < week) return `${Math.floor(diffMs / day)} days ago`
  return `${Math.floor(diffMs / week)} weeks ago`
}

function getActivityIcon(activity: DashboardActivity) {
  switch (activity.activity_type) {
    case "interview":
      return <CheckCircle2 className="h-4 w-4 text-success" />
    case "quiz":
      return <Brain className="h-4 w-4 text-primary" />
    case "cv":
      return <FileText className="h-4 w-4 text-primary" />
    default:
      return <Target className="h-4 w-4 text-muted-foreground" />
  }
}

function getUpcomingIcon(event: DashboardUpcomingEvent) {
  if (event.event_type === "quiz") return <Brain className="mt-0.5 h-4 w-4 text-purple-500" />
  if (event.event_type === "interview") return <MessageSquare className="mt-0.5 h-4 w-4 text-blue-500" />
  return <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
}

function hasDashboardHistory(data: DashboardData | null) {
  if (!data) return false

  return (
    data.stats.completed_interviews > 0 ||
    data.stats.avg_hr_score > 0 ||
    data.stats.avg_technical_score > 0 ||
    data.stats.cv_ats_score > 0 ||
    data.activity.length > 0 ||
    data.skill_scores.length > 0 ||
    data.weekly_goals.quizzes_actual > 0 ||
    data.weekly_goals.practice_minutes_actual > 0
  )
}

function buildRecommendedActions(data: DashboardData | null, t: (key: string) => string): DashboardAction[] {
  if (!data) return []

  const actions: DashboardAction[] = []
  const { stats, weekly_goals, skill_scores, upcoming_events } = data

  // 1. URGENT: Upcoming events today
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const tomorrow = today + 24 * 60 * 60 * 1000
  
  const todayEvent = upcoming_events.find(e => {
    const startTime = new Date(e.start_time).getTime()
    return startTime >= today && startTime < tomorrow
  })

  if (todayEvent) {
    const isInterview = todayEvent.event_type === "interview"
    actions.push({
      title: `${t("Upcoming")}: ${t(todayEvent.title)}`,
      description: isInterview 
        ? t("You have an interview scheduled for today. Best of luck!") 
        : t("Don't forget your scheduled practice session today."),
      action: isInterview ? t("Start Interview") : t("Open Schedule"),
      href: isInterview ? "/mock-interview" : "/schedule",
      icon: isInterview ? <MessageSquare className="h-5 w-5" /> : <Clock className="h-5 w-5" />,
      priority: "high",
    })
  }

  // 2. KNOWLEDGE GAP: Practice weakest skill
  const weakestSkill = skill_scores[0] // Backend returns them ordered by score asc
  if (weakestSkill && weakestSkill.score < 80) {
    const isBehavioral = /behavioral|communication|soft skill/i.test(weakestSkill.skill_name)
    actions.push({
      title: `${t("Improve")} ${t(weakestSkill.skill_name)}`,
      description: `${t("Your current score is")} ${weakestSkill.score}%. ${t("Targeting 80%+ will boost your readiness.")}`,
      action: isBehavioral ? t("Start Interview") : t("Take Quiz"),
      href: isBehavioral ? "/mock-interview" : "/quizzes",
      icon: isBehavioral ? <MessageSquare className="h-5 w-5" /> : <Brain className="h-5 w-5" />,
      priority: actions.length === 0 ? "high" : "normal",
    })
  }

  // 3. GOAL GAP: Weekly goals progress
  const quizProgress = weekly_goals.quizzes_target > 0 ? weekly_goals.quizzes_actual / weekly_goals.quizzes_target : 1
  const interviewProgress = weekly_goals.interviews_target > 0 ? weekly_goals.interviews_actual / weekly_goals.interviews_target : 1

  // Show Interview goal if not met
  if (interviewProgress < 1 && actions.length < 3) {
    actions.push({
      title: t("Weekly Interview Goal"),
      description: `${t("You've completed")} ${weekly_goals.interviews_actual}/${weekly_goals.interviews_target} ${t("interviews")}. ${t("Keep the momentum going!")}`,
      action: t("Start Interview"),
      href: "/mock-interview",
      icon: <MessageSquare className="h-5 w-5" />,
    })
  }

  // Show Quiz goal if not met and there is space
  if (quizProgress < 1 && actions.length < 3) {
    actions.push({
      title: t("Weekly Quiz Goal"),
      description: `${t("You've completed")} ${weekly_goals.quizzes_actual}/${weekly_goals.quizzes_target} ${t("quizzes")}. ${t("Complete one more to stay on track!")}`,
      action: t("Take Quiz"),
      href: "/quizzes",
      icon: <Brain className="h-5 w-5" />,
    })
  }

  // 4. CV OPTIMIZATION
  if (actions.length < 3 && stats.cv_ats_score < 85) {
    actions.push({
      title: t("Optimize Your CV"),
      description: `${t("Your CV score is")} ${stats.cv_ats_score}%. ${t("Improving it can significantly increase your response rate.")}`,
      action: t("Edit CV"),
      href: "/cv-studio",
      icon: <FileText className="h-5 w-5" />,
    })
  }

  // Fallback if still empty (though unlikely for active users)
  if (actions.length === 0) {
    actions.push({
      title: t("Explore New Topics"),
      description: t("Try a mock interview or a new quiz to discover your strengths."),
      action: t("Go to Quizzes"),
      href: "/quizzes",
      icon: <Brain className="h-5 w-5" />,
    })
  }

  return actions.slice(0, 3)
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { data, isLoading, error, updateGoals } = useDashboard()
  const { workspaces, isHydrated } = useWorkspace()
  const { t, language } = useLanguage()
  const dateLocale = language === "tr" ? tr : enUS
  const recommendedActions = buildRecommendedActions(data, t)
  const hasHistory = hasDashboardHistory(data)

  useEffect(() => {
    // Only redirect if we ARE sure there are no workspaces after hydration
    if (isHydrated && workspaces.length === 0 && user) {
      router.replace("/onboarding")
    }
  }, [isHydrated, workspaces.length, router, user])

  return (
    <>
      <PageContainer>
        <PageHeader title={`${t("Good evening")}, ${user?.full_name || user?.email || t("welcome")}`} description={t("Here's your progress overview")} />
        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

        {/* KPI Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading || !data ? (
            <>
              <KPICardSkeleton />
              <KPICardSkeleton />
              <KPICardSkeleton />
              <KPICardSkeleton />
            </>
          ) : (
            <>
              <KPICard
                title={t("Mock Interviews")}
                value={data.stats.completed_interviews.toString()}
                subtitle={t("Completed")}
                icon={<MessageSquare className="h-5 w-5" />}
                trend={
                  data.stats.completed_interviews_this_week > 0
                    ? `+${data.stats.completed_interviews_this_week} ${t("this week")}`
                    : !hasHistory
                      ? t("New")
                      : undefined
                }
                trendTone={data.stats.completed_interviews_this_week > 0 ? "positive" : "neutral"}
              />
              <KPICard
                title={t("Avg HR Score")}
                value={`${data.stats.avg_hr_score}%`}
                subtitle={t("Last 5 interviews")}
                icon={<Target className="h-5 w-5" />}
                trend={
                  data.stats.avg_hr_score_trend !== 0
                    ? `${data.stats.avg_hr_score_trend >= 0 ? "+" : ""}${data.stats.avg_hr_score_trend}% ${t("improvement")}`
                    : data.stats.avg_hr_score === 0
                      ? t("New")
                      : undefined
                }
                trendUp={data.stats.avg_hr_score_trend >= 0}
                trendTone={data.stats.avg_hr_score_trend !== 0 ? "positive" : "neutral"}
              />
              <KPICard
                title={t("Avg Technical Score")}
                value={`${data.stats.avg_technical_score}%`}
                subtitle={t("Last 5 interviews")}
                icon={<Brain className="h-5 w-5" />}
                trend={
                  data.stats.avg_technical_score_trend !== 0
                    ? `${data.stats.avg_technical_score_trend >= 0 ? "+" : ""}${data.stats.avg_technical_score_trend}% ${t("improvement")}`
                    : data.stats.avg_technical_score === 0
                      ? t("New")
                      : undefined
                }
                trendUp={data.stats.avg_technical_score_trend >= 0}
                trendTone={data.stats.avg_technical_score_trend !== 0 ? "positive" : "neutral"}
              />
              <KPICard
                title={t("CV Readiness")}
                value={`${data.stats.cv_ats_score}%`}
                subtitle={t("ATS optimized")}
                icon={<FileText className="h-5 w-5" />}
                progress={data.stats.cv_ats_score}
                trend={data.stats.cv_ats_score === 0 ? t("New") : undefined}
                trendTone="neutral"
              />
            </>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - 2 columns */}
          <div className="space-y-6 lg:col-span-2">
            {/* Recommended Actions */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Recommended Next Actions")}</CardTitle>
                <CardDescription>{t("Continue your preparation journey")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading || !data ? (
                  <>
                    <ActionCardSkeleton />
                    <ActionCardSkeleton />
                    <ActionCardSkeleton />
                  </>
                ) : recommendedActions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("You're on track. Keep going!")}</p>
                ) : (
                  recommendedActions.map((action) => (
                    <ActionCard
                      key={`${action.title}-${action.href}`}
                      title={action.title}
                      description={action.description}
                      action={action.action}
                      href={action.href}
                      icon={action.icon}
                      priority={action.priority}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Recent Activity")}</CardTitle>
                <CardDescription>{t("Your latest actions and milestones")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading || !data ? (
                    <>
                      <TimelineSkeleton />
                      <TimelineSkeleton />
                      <TimelineSkeleton />
                      <TimelineSkeleton />
                    </>
                  ) : data.activity.length === 0 ? (
                    <EmptyState
                      icon={<Sparkles className="h-5 w-5" />}
                      title={t("Your journey starts here")}
                      description={t("Complete a mock interview to start building your activity timeline.")}
                      action={t("Go to Mock Interviews")}
                      href="/mock-interview"
                    />
                  ) : (
                    data.activity.map((activity) => (
                      <TimelineItem
                        key={activity.id}
                        title={t(activity.title)}
                        description={activity.description?.startsWith("Scored") 
                          ? activity.description.replace("Scored", t("Scored")) 
                          : activity.description?.includes("correct")
                          ? activity.description.replace("correct", t("correct"))
                          : t(activity.description || "")}
                        time={formatRelativeTime(activity.created_at)}
                        icon={getActivityIcon(activity)}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t("This Week")}</CardTitle>
                  {data && (
                    <GoalEditModal
                      currentGoals={data.weekly_goals}
                      onSave={async (newGoals) => {
                        const success = await updateGoals(newGoals)
                        if (success) {
                          toast.success(t("Goals updated successfully!"))
                        }
                      }}
                      t={t}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading || !data ? (
                  <WeeklyGoalsSkeleton />
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t("Interviews")}</span>
                        <span className="font-semibold">{data.weekly_goals.interviews_actual}</span>
                      </div>
                      <Progress value={goalProgress(data.weekly_goals.interviews_actual, data.weekly_goals.interviews_target)} className="h-2" />
                      <p className="text-xs text-muted-foreground">{t("Goal")}: {data.weekly_goals.interviews_target} {t("per week")}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t("Quizzes")}</span>
                        <span className="font-semibold">{data.weekly_goals.quizzes_actual}</span>
                      </div>
                      <Progress value={goalProgress(data.weekly_goals.quizzes_actual, data.weekly_goals.quizzes_target)} className="h-2" />
                      <p className={`text-xs ${data.weekly_goals.quizzes_actual >= data.weekly_goals.quizzes_target ? "text-success" : "text-muted-foreground"}`}>
                        {data.weekly_goals.quizzes_actual >= data.weekly_goals.quizzes_target ? t("Goal achieved!") : `${t("Goal")}: ${data.weekly_goals.quizzes_target} ${t("per week")}`}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t("Practice Time")}</span>
                        <span className="font-semibold">{formatPracticeHours(data.weekly_goals.practice_minutes_actual, t)}</span>
                      </div>
                      <Progress value={goalProgress(data.weekly_goals.practice_minutes_actual, data.weekly_goals.practice_minutes_target)} className="h-2" />
                      <p className="text-xs text-muted-foreground">{t("Goal")}: {formatPracticeHours(data.weekly_goals.practice_minutes_target, t)}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Skill Focus */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Skills to Focus On")}</CardTitle>
                <CardDescription>{t("Based on your recent performance")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {isLoading || !data ? (
                  <>
                    <SkillBadgeSkeleton />
                    <SkillBadgeSkeleton />
                    <SkillBadgeSkeleton />
                    <SkillBadgeSkeleton />
                  </>
                ) : data.skill_scores.length === 0 ? (
                  <EmptyState
                    icon={<Brain className="h-5 w-5" />}
                    title={t("Discover your focus areas")}
                    description={t("Take a baseline quiz so we can surface the skills that need attention.")}
                    action={t("Take Quiz")}
                    href="/quizzes"
                  />
                ) : (
                  data.skill_scores.map((skill) => (
                    <SkillBadge key={skill.id} skill={t(skill.skill_name)} score={skill.score} />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Upcoming */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold">{t("Upcoming")}</CardTitle>
                <Link href="/schedule">
                  <Button variant="ghost" size="sm" className="h-8 text-xs">{t("View All")}</Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {isLoading || !data ? (
                  <>
                    <UpcomingSkeleton />
                    <UpcomingSkeleton />
                    <UpcomingSkeleton />
                  </>
                ) : data.upcoming_events.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">{t("No upcoming events scheduled.")}</p>
                ) : (
                  data.upcoming_events
                    .map((event) => (
                      <div key={event.id} className="flex items-start gap-3 rounded-lg border border-border bg-secondary/50 p-3">
                        {getUpcomingIcon(event)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{t(event.title)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.start_time), "MMM d, h:mm a", { locale: dateLocale })}
                          </p>
                        </div>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </>
  )
}

interface KPICardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
  trendTone?: "positive" | "neutral"
  progress?: number
}

function KPICardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

function KPICard({ title, value, subtitle, icon, trend, trendUp, trendTone = "positive", progress }: KPICardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
          {trend && (
            <Badge variant={trendTone === "neutral" || !trendUp ? "secondary" : "default"} className="text-xs">
              {trend}
            </Badge>
          )}
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {progress !== undefined && <Progress value={progress} className="mt-3 h-2" />}
      </CardContent>
    </Card>
  )
}

interface ActionCardProps {
  title: string
  description: string
  action: string
  href: string
  icon: React.ReactNode
  priority?: "high" | "normal"
}

function ActionCardSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-lg border p-4">
      <Skeleton className="h-10 w-10 flex-shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  )
}

function EmptyState({
  icon,
  title,
  description,
  action,
  href,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action: string
  href: string
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-6 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-background text-primary shadow-sm">
        {icon}
      </div>
      <h4 className="mt-4 text-sm font-semibold">{title}</h4>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground text-pretty">{description}</p>
      <Link href={href}>
        <Button size="sm" className="mt-4 gap-1">
          {action}
          <ArrowUpRight className="h-3 w-3" />
        </Button>
      </Link>
    </div>
  )
}

function ActionCard({ title, description, action, href, icon, priority }: ActionCardProps) {
  return (
    <div
      className={`flex items-start gap-4 rounded-lg border p-4 transition-colors hover:border-primary/50 ${priority === "high" ? "border-primary/20 bg-primary/5" : ""
        }`}
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <h4 className="font-medium leading-none">{title}</h4>
        <p className="text-sm text-muted-foreground text-pretty">{description}</p>
      </div>
      <Link href={href}>
        <Button size="sm" className="flex-shrink-0 gap-1">
          {action}
          <ArrowUpRight className="h-3 w-3" />
        </Button>
      </Link>
    </div>
  )
}

function TimelineSkeleton() {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="h-full w-px bg-border" />
      </div>
      <div className="flex-1 space-y-2 pb-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
  )
}

function TimelineItem({
  title,
  description,
  time,
  icon,
}: {
  title: string
  description: string
  time: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">{icon}</div>
        <div className="h-full w-px bg-border" />
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-sm font-medium">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{time}</span>
        </div>
      </div>
    </div>
  )
}

function WeeklyGoalsSkeleton() {
  return (
    <>
      {[0, 1, 2].map((item) => (
        <div key={item} className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
    </>
  )
}

function SkillBadgeSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <Skeleton className="h-4 w-32" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-2 w-16" />
        <Skeleton className="h-3 w-8" />
      </div>
    </div>
  )
}

function SkillBadge({ skill, score }: { skill: string; score: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <span className="text-sm font-medium">{skill}</span>
      <div className="flex items-center gap-2">
        <Progress value={score} className="h-2 w-16" />
        <span className="text-xs font-medium text-muted-foreground">{score}%</span>
      </div>
    </div>
  )
}

function UpcomingSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/50 p-3">
      <Skeleton className="mt-0.5 h-4 w-4 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

function GoalEditModal({
  currentGoals,
  onSave,
  t,
}: {
  currentGoals: any
  onSave: (goals: any) => Promise<void>
  t: any
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [goals, setGoals] = useState({
    interviews_target: currentGoals.interviews_target,
    quizzes_target: currentGoals.quizzes_target,
    practice_minutes_target: currentGoals.practice_minutes_target,
  })

  // Update local state if currentGoals change (e.g. after a refetch)
  useEffect(() => {
    setGoals({
      interviews_target: currentGoals.interviews_target,
      quizzes_target: currentGoals.quizzes_target,
      practice_minutes_target: currentGoals.practice_minutes_target,
    })
  }, [currentGoals])

  const handleSave = async () => {
    setIsUpdating(true)
    await onSave(goals)
    setIsUpdating(false)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("Weekly Targets")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="interviews">{t("Interviews")} ({t("per week")})</Label>
            <Input
              id="interviews"
              type="number"
              value={goals.interviews_target}
              onChange={(e) => setGoals({ ...goals, interviews_target: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quizzes">{t("Quizzes")} ({t("per week")})</Label>
            <Input
              id="quizzes"
              type="number"
              value={goals.quizzes_target}
              onChange={(e) => setGoals({ ...goals, quizzes_target: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="practice">{t("Practice Time")} ({t("Min")})</Label>
            <Input
              id="practice"
              type="number"
              value={goals.practice_minutes_target}
              onChange={(e) => setGoals({ ...goals, practice_minutes_target: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? t("Updating...") : t("Save Goals")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
