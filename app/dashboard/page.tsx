"use client"

import type React from "react"
import { format } from "date-fns"
import { useSchedule } from "@/lib/schedule-context"
import { Navigation } from "@/components/navigation"
import { PageContainer, PageHeader } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowUpRight, MessageSquare, FileText, Brain, TrendingUp, Clock, CheckCircle2, Target } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

export default function DashboardPage() {
  const { events } = useSchedule()
  const { t } = useLanguage()

  return (
    <>
      <Navigation />
      <PageContainer>
        <PageHeader title={`${t("Good evening")}, Deniz`} description={t("Here's your progress overview")} />

        {/* KPI Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title={t("Mock Interviews")}
            value="12"
            subtitle={t("Completed")}
            icon={<MessageSquare className="h-5 w-5" />}
            trend="+3 this week"
          />
          <KPICard
            title={t("Avg HR Score")}
            value="82%"
            subtitle={t("Last 5 interviews")}
            icon={<Target className="h-5 w-5" />}
            trend="+5% improvement"
            trendUp
          />
          <KPICard
            title={t("Avg Technical Score")}
            value="78%"
            subtitle={t("Last 5 interviews")}
            icon={<Brain className="h-5 w-5" />}
            trend="+8% improvement"
            trendUp
          />
          <KPICard
            title={t("CV Readiness")}
            value="85%"
            subtitle={t("ATS optimized")}
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
                <CardTitle>{t("Recommended Next Actions")}</CardTitle>
                <CardDescription>{t("Continue your preparation journey")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ActionCard
                  title={t("Practice Behavioral Questions")}
                  description={t("You scored 75% on communication last time. Let's improve it!")}
                  action={t("Start Interview")}
                  href="/mock-interview"
                  icon={<MessageSquare className="h-5 w-5" />}
                  priority="high"
                />
                <ActionCard
                  title={t("Complete Algorithms Quiz")}
                  description={t("Test your data structures knowledge with 15 questions")}
                  action={t("Take Quiz")}
                  href="/quizzes"
                  icon={<Brain className="h-5 w-5" />}
                />
                <ActionCard
                  title={t("Update Your CV")}
                  description={t("Add your latest project to boost your CV score")}
                  action={t("Edit CV")}
                  href="/cv-studio"
                  icon={<FileText className="h-5 w-5" />}
                />
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
                  <TimelineItem
                    title={t("Completed HR Mock Interview")}
                    description={t("Scored 85% on behavioral questions")}
                    time={t("2 hours ago")}
                    icon={<CheckCircle2 className="h-4 w-4 text-success" />}
                  />
                  <TimelineItem
                    title={t("Updated CV - Added Experience")}
                    description={t("Added Software Engineering Intern at TechCorp")}
                    time={t("1 day ago")}
                    icon={<FileText className="h-4 w-4 text-primary" />}
                  />
                  <TimelineItem
                    title={t("Passed System Design Quiz")}
                    description={t("8/10 correct - Great improvement!")}
                    time={t("2 days ago")}
                    icon={<CheckCircle2 className="h-4 w-4 text-success" />}
                  />
                  <TimelineItem
                    title={t("Started Technical Interview Practice")}
                    description={t("Completed coding challenges on arrays")}
                    time={t("3 days ago")}
                    icon={<Brain className="h-4 w-4 text-primary" />}
                  />
                  <TimelineItem
                    title={t("Created Your Profile")}
                    description={t("Welcome to RecruitAssistant!")}
                    time={t("1 week ago")}
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
                <CardTitle>{t("This Week")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("Interviews")}</span>
                    <span className="font-semibold">3</span>
                  </div>
                  <Progress value={60} className="h-2" />
                  <p className="text-xs text-muted-foreground">{t("Goal: 5 per week")}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("Quizzes")}</span>
                    <span className="font-semibold">2</span>
                  </div>
                  <Progress value={100} className="h-2" />
                  <p className="text-xs text-success">{t("Goal achieved!")}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("Practice Time")}</span>
                    <span className="font-semibold">4.5h</span>
                  </div>
                  <Progress value={90} className="h-2" />
                  <p className="text-xs text-muted-foreground">{t("Goal: 5 hours")}</p>
                </div>
              </CardContent>
            </Card>

            {/* Skill Focus */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Skills to Focus On")}</CardTitle>
                <CardDescription>{t("Based on your recent performance")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <SkillBadge skill="Communication" score={75} />
                <SkillBadge skill="System Design" score={70} />
                <SkillBadge skill="Behavioral Answers" score={80} />
                <SkillBadge skill="Code Optimization" score={72} />
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
                {events.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">{t("No upcoming events scheduled.")}</p>
                ) : (
                  events
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 3) // Show top 3
                    .map((event) => (
                      <div key={event.id} className="flex items-start gap-3 rounded-lg border border-border bg-secondary/50 p-3">
                        {event.type === "quiz" ? (
                          <Brain className="mt-0.5 h-4 w-4 text-purple-500" />
                        ) : event.type === "interview" ? (
                          <MessageSquare className="mt-0.5 h-4 w-4 text-blue-500" />
                        ) : (
                          <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.date), "MMM d, h:mm a")}
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
