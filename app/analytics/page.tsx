"use client"

import { Navigation } from "@/components/navigation"
import { PageContainer, PageHeader } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { TrendingUp, TrendingDown, Calendar, Download, CheckCircle2 } from "lucide-react"

export default function AnalyticsPage() {
  const { t } = useTranslation()

  const scoreData = [
    { week: `${t('analytics.week')} 1`, hr: 65, technical: 60 },
    { week: `${t('analytics.week')} 2`, hr: 70, technical: 65 },
    { week: `${t('analytics.week')} 3`, hr: 75, technical: 70 },
    { week: `${t('analytics.week')} 4`, hr: 82, technical: 78 },
  ]

  const skillData = [
    { skill: t('dashboard.skills.communication'), score: 85, trend: "up" },
    { skill: t('dashboard.skills.problemSolving'), score: 82, trend: "up" },
    { skill: t('dashboard.skills.systemDesign'), score: 70, trend: "neutral" },
    { skill: t('dashboard.skills.algorithms'), score: 88, trend: "up" },
    { skill: t('dashboard.skills.behavioral'), score: 75, trend: "down" },
    { skill: t('dashboard.skills.codeQuality'), score: 80, trend: "up" },
  ]

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(t('language.code', { defaultValue: 'en-US' }), {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const cvVersions = [
    { version: "v3", date: formatDate(new Date(2024, 11, 20)), atsScore: 85, roleMatch: 88, status: "current" },
    { version: "v2", date: formatDate(new Date(2024, 11, 15)), atsScore: 78, roleMatch: 82, status: "archived" },
    { version: "v1", date: formatDate(new Date(2024, 11, 10)), atsScore: 72, roleMatch: 75, status: "archived" },
  ]

  const upcomingTasks = [
    { task: t('analytics.tasks.behavioralQuiz'), priority: "high", dueDate: t('analytics.today') },
    { task: t('analytics.tasks.systemDesignPractice'), priority: "medium", dueDate: t('analytics.tomorrow') },
    { task: t('analytics.tasks.updateCV'), priority: "medium", dueDate: formatDate(new Date(2024, 11, 25)) },
    { task: t('analytics.tasks.reviewWeakTopics'), priority: "low", dueDate: t('analytics.thisWeek') },
  ]

  return (
    <>
      <Navigation />
      <PageContainer>
        <PageHeader
          title={t('analytics.title')}
          description={t('analytics.description')}
          action={
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              {t('analytics.exportReport')}
            </Button>
          }
        />

        <div className="space-y-6">
          {/* Progress Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.scoreProgress')}</CardTitle>
              <CardDescription>{t('analytics.scoreProgressDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Chart Visualization */}
                <div className="h-64 rounded-lg border border-border bg-secondary/20 p-6">
                  <div className="flex h-full items-end justify-around gap-4">
                    {scoreData.map((data, idx) => (
                      <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex w-full gap-2">
                          <div
                            className="w-1/2 rounded-t-md bg-primary transition-all hover:opacity-80"
                            style={{ height: `${data.hr * 2}px` }}
                            title={`${t('analytics.hrScore')}: ${data.hr}%`}
                          />
                          <div
                            className="w-1/2 rounded-t-md bg-accent transition-all hover:opacity-80"
                            style={{ height: `${data.technical * 2}px` }}
                            title={`${t('analytics.technicalScore')}: ${data.technical}%`}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{data.week}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-primary" />
                    <div className="h-3 w-3 rounded-sm bg-primary" />
                    <span className="text-muted-foreground">{t('analytics.hrScore')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-accent" />
                    <span className="text-muted-foreground">{t('analytics.technicalScore')}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-border bg-secondary/50 p-4 text-center">
                    <p className="text-2xl font-bold text-primary">+17%</p>
                    <p className="text-sm text-muted-foreground">{t('analytics.hrImprovement')}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/50 p-4 text-center">
                    <p className="text-2xl font-bold text-accent">+18%</p>
                    <p className="text-sm text-muted-foreground">{t('analytics.technicalImprovement')}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/50 p-4 text-center">
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-sm text-muted-foreground">{t('analytics.totalInterviews')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Skills Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.skillsPerformance')}</CardTitle>
                <CardDescription>{t('analytics.skillsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {skillData.map((skill, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{skill.skill}</span>
                          {skill.trend === "up" && <TrendingUp className="h-4 w-4 text-success" />}
                          {skill.trend === "down" && <TrendingDown className="h-4 w-4 text-destructive" />}
                        </div>
                        <span className="text-sm font-semibold">{skill.score}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${skill.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-medium">{t('analytics.topStrength', { strength: t('dashboard.skills.algorithms') })}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('analytics.topStrengthDesc')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* CV Version History */}
            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.cvVersionHistory')}</CardTitle>
                <CardDescription>{t('analytics.cvVersionDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cvVersions.map((cv, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-4 ${cv.status === "current" ? "border-primary bg-primary/5" : "border-border"
                        }`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{cv.version}</span>
                          {cv.status === "current" && (
                            <Badge variant="default" className="text-xs">
                              {t('analytics.current')}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {cv.date}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">{t('analytics.atsScore')}</p>
                          <p className="font-semibold">{cv.atsScore}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('analytics.roleMatch')}</p>
                          <p className="font-semibold">{cv.roleMatch}%</p>
                        </div>
                      </div>
                      {cv.status === "archived" && (
                        <Button size="sm" variant="ghost" className="mt-3 h-8 text-xs">
                          {t('analytics.viewVersion')}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.upcomingTasks')}</CardTitle>
              <CardDescription>{t('analytics.upcomingTasksDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingTasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:border-primary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{task.task}</p>
                        <p className="text-sm text-muted-foreground">{t('analytics.due', { date: task.dueDate })}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"
                      }
                    >
                      {task.priority === "high" ? t('analytics.high') : task.priority === "medium" ? t('analytics.medium') : t('analytics.low')}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-l-4 border-l-success">
              <CardContent className="p-6">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  <h3 className="font-semibold">{t('analytics.strongProgress')}</h3>
                </div>
                <p className="text-sm text-muted-foreground text-pretty">
                  {t('analytics.strongProgressDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-warning">
              <CardContent className="p-6">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-warning" />
                  <h3 className="font-semibold">{t('analytics.areaToFocus')}</h3>
                </div>
                <p className="text-sm text-muted-foreground text-pretty">
                  {t('analytics.areaToFocusDesc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </>
  )
}
