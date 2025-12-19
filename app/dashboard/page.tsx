"use client"

import type React from "react"
import { useTranslation } from "react-i18next"
import { Navigation } from "@/components/navigation"
import { PageContainer, PageHeader } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowUpRight, MessageSquare, FileText, Brain, TrendingUp, Clock, CheckCircle2, Target } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { t } = useTranslation()
  return (
    <>
      <Navigation />
      <PageContainer>
        <PageHeader title={t('dashboard.greeting', { name: 'Deniz' })} description={t('dashboard.progressOverview')} />

        {/* KPI Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title={t('dashboard.mockInterviews')}
            value="12"
            subtitle={t('dashboard.completed')}
            icon={<MessageSquare className="h-5 w-5" />}
            trend="+3 this week"
          />
          <KPICard
            title={t('dashboard.avgHRScore')}
            value="82%"
            subtitle={t('dashboard.last5')}
            icon={<Target className="h-5 w-5" />}
            trend={t('dashboard.trend', { val: '+5%', context: 'improvement' })}
            trendUp
          />
          <KPICard
            title={t('dashboard.avgTechScore')}
            value="78%"
            subtitle={t('dashboard.last5')}
            icon={<Brain className="h-5 w-5" />}
            trend={t('dashboard.trend', { val: '+8%', context: 'improvement' })}
            trendUp
          />
          <KPICard
            title={t('dashboard.cvReadiness')}
            value="85%"
            subtitle={t('dashboard.atsOptimized')}
            icon={<FileText className="h-5 w-5" />}
            progress={85}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - 2 columns */}
          <div className="space-y-6 lg:col-span-2">
            {/* Recommended Actions */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.recommendedActions')}</CardTitle>
                <CardDescription>{t('dashboard.continueJourney')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ActionCard
                  title={t('dashboard.actions.practiceBehavioral')}
                  description={t('dashboard.actions.practiceBehavioralDesc', { score: 75 })}
                  action={t('dashboard.actions.startInterview')}
                  href="/mock-interview"
                  icon={<MessageSquare className="h-5 w-5" />}
                  priority="high"
                />
                <ActionCard
                  title={t('dashboard.actions.completeAlgorithms')}
                  description={t('dashboard.actions.completeAlgorithmsDesc', { count: 15 })}
                  action={t('dashboard.actions.takeQuiz')}
                  href="/quizzes"
                  icon={<Brain className="h-5 w-5" />}
                />
                <ActionCard
                  title={t('dashboard.actions.updateCV')}
                  description={t('dashboard.actions.updateCVDesc')}
                  action={t('dashboard.actions.editCV')}
                  href="/cv-studio"
                  icon={<FileText className="h-5 w-5" />}
                />
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
                <CardDescription>{t('dashboard.latestActions')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <TimelineItem
                    title={t('dashboard.activity.completedHRMock')}
                    description={t('dashboard.activity.completedHRMockDesc', { score: 85 })}
                    time={t('dashboard.time.hoursAgo', { count: 2 })}
                    icon={<CheckCircle2 className="h-4 w-4 text-success" />}
                  />
                  <TimelineItem
                    title={t('dashboard.activity.updatedCV')}
                    description={t('dashboard.activity.updatedCVDesc')}
                    time={t('dashboard.time.dayAgo')}
                    icon={<FileText className="h-4 w-4 text-primary" />}
                  />
                  <TimelineItem
                    title={t('dashboard.activity.passedSystemDesign')}
                    description={t('dashboard.activity.passedSystemDesignDesc', { score: 8, total: 10 })}
                    time={t('dashboard.time.daysAgo', { count: 2 })}
                    icon={<CheckCircle2 className="h-4 w-4 text-success" />}
                  />
                  <TimelineItem
                    title={t('dashboard.activity.startedTechnical')}
                    description={t('dashboard.activity.startedTechnicalDesc')}
                    time={t('dashboard.time.daysAgo', { count: 3 })}
                    icon={<Brain className="h-4 w-4 text-primary" />}
                  />
                  <TimelineItem
                    title={t('dashboard.activity.createdProfile')}
                    description={t('dashboard.activity.createdProfileDesc')}
                    time={t('dashboard.time.weekAgo')}
                    icon={<Target className="h-4 w-4 text-muted-foreground" />}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.thisWeek')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('dashboard.interviews')}</span>
                    <span className="font-semibold">3</span>
                  </div>
                  <Progress value={60} className="h-2" />
                  <p className="text-xs text-muted-foreground">{t('dashboard.goal', { target: t('dashboard.units.perWeek', { count: 5 }) })}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('dashboard.quizzes')}</span>
                    <span className="font-semibold">2</span>
                  </div>
                  <Progress value={100} className="h-2" />
                  <p className="text-xs text-success">{t('dashboard.goalAchieved')}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('dashboard.practiceTime')}</span>
                    <span className="font-semibold">4.5h</span>
                  </div>
                  <Progress value={90} className="h-2" />
                  <p className="text-xs text-muted-foreground">{t('dashboard.goal', { target: t('dashboard.units.hours', { count: 5 }) })}</p>
                </div>
              </CardContent>
            </Card>

            {/* Skill Focus */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.skillsToFocus')}</CardTitle>
                <CardDescription>{t('dashboard.basedOnPerformance')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <SkillBadge skill={t('dashboard.skills.communication')} score={75} />
                <SkillBadge skill={t('dashboard.skills.systemDesign')} score={70} />
                <SkillBadge skill={t('dashboard.skills.behavioralAnswers')} score={80} />
                <SkillBadge skill={t('dashboard.skills.codeOptimization')} score={72} />
              </CardContent>
            </Card>

            {/* Upcoming */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.upcoming')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/50 p-3">
                  <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t('dashboard.practiceReminder')}</p>
                    <p className="text-xs text-muted-foreground">{t('dashboard.dailyIn', { hours: 2 })}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/50 p-3">
                  <TrendingUp className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t('dashboard.weeklyReport')}</p>
                    <p className="text-xs text-muted-foreground">{t('dashboard.availableIn', { days: 3 })}</p>
                  </div>
                </div>
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
  progress?: number
}

function KPICard({ title, value, subtitle, icon, trend, trendUp, progress }: KPICardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
          {trend && (
            <Badge variant={trendUp ? "default" : "secondary"} className="text-xs">
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
