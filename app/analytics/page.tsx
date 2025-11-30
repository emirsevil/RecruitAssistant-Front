import { Navigation } from "@/components/navigation"
import { PageContainer, PageHeader } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Calendar, Download, CheckCircle2 } from "lucide-react"

const scoreData = [
  { week: "Week 1", hr: 65, technical: 60 },
  { week: "Week 2", hr: 70, technical: 65 },
  { week: "Week 3", hr: 75, technical: 70 },
  { week: "Week 4", hr: 82, technical: 78 },
]

const skillData = [
  { skill: "Communication", score: 85, trend: "up" },
  { skill: "Problem Solving", score: 82, trend: "up" },
  { skill: "System Design", score: 70, trend: "neutral" },
  { skill: "Algorithms", score: 88, trend: "up" },
  { skill: "Behavioral", score: 75, trend: "down" },
  { skill: "Code Quality", score: 80, trend: "up" },
]

const cvVersions = [
  { version: "v3", date: "Dec 20, 2024", atsScore: 85, roleMatch: 88, status: "current" },
  { version: "v2", date: "Dec 15, 2024", atsScore: 78, roleMatch: 82, status: "archived" },
  { version: "v1", date: "Dec 10, 2024", atsScore: 72, roleMatch: 75, status: "archived" },
]

const upcomingTasks = [
  { task: "Complete Behavioral Quiz", priority: "high", dueDate: "Today" },
  { task: "Practice System Design Interview", priority: "medium", dueDate: "Tomorrow" },
  { task: "Update CV with new project", priority: "medium", dueDate: "Dec 25" },
  { task: "Review weak topics", priority: "low", dueDate: "This week" },
]

export default function AnalyticsPage() {
  return (
    <>
      <Navigation />
      <PageContainer>
        <PageHeader
          title="Analytics"
          description="Track your progress and performance insights"
          action={
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          }
        />

        <div className="space-y-6">
          {/* Progress Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Score Progress Over Time</CardTitle>
              <CardDescription>Your HR and Technical interview scores by week</CardDescription>
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
                            title={`HR: ${data.hr}%`}
                          />
                          <div
                            className="w-1/2 rounded-t-md bg-accent transition-all hover:opacity-80"
                            style={{ height: `${data.technical * 2}px` }}
                            title={`Technical: ${data.technical}%`}
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
                    <span className="text-muted-foreground">HR Score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-accent" />
                    <span className="text-muted-foreground">Technical Score</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-border bg-secondary/50 p-4 text-center">
                    <p className="text-2xl font-bold text-primary">+17%</p>
                    <p className="text-sm text-muted-foreground">HR Score Improvement</p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/50 p-4 text-center">
                    <p className="text-2xl font-bold text-accent">+18%</p>
                    <p className="text-sm text-muted-foreground">Technical Improvement</p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/50 p-4 text-center">
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-sm text-muted-foreground">Total Interviews</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Skills Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle>Skills Performance</CardTitle>
                <CardDescription>Your current proficiency across key areas</CardDescription>
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
                  <p className="text-sm font-medium">Top Strength: Algorithms</p>
                  <p className="text-xs text-muted-foreground">
                    You've shown consistent excellence in algorithm problem-solving
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* CV Version History */}
            <Card>
              <CardHeader>
                <CardTitle>CV Version History</CardTitle>
                <CardDescription>Track improvements to your resume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cvVersions.map((cv, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-4 ${
                        cv.status === "current" ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{cv.version}</span>
                          {cv.status === "current" && (
                            <Badge variant="default" className="text-xs">
                              Current
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
                          <p className="text-muted-foreground">ATS Score</p>
                          <p className="font-semibold">{cv.atsScore}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Role Match</p>
                          <p className="font-semibold">{cv.roleMatch}%</p>
                        </div>
                      </div>
                      {cv.status === "archived" && (
                        <Button size="sm" variant="ghost" className="mt-3 h-8 text-xs">
                          View Version
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
              <CardTitle>Upcoming Tasks</CardTitle>
              <CardDescription>Auto-generated action items based on your performance</CardDescription>
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
                        <p className="text-sm text-muted-foreground">Due: {task.dueDate}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"
                      }
                    >
                      {task.priority}
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
                  <h3 className="font-semibold">Strong Progress</h3>
                </div>
                <p className="text-sm text-muted-foreground text-pretty">
                  You've improved your average score by 15% over the last month. Keep up the consistent practice!
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-warning">
              <CardContent className="p-6">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-warning" />
                  <h3 className="font-semibold">Area to Focus</h3>
                </div>
                <p className="text-sm text-muted-foreground text-pretty">
                  Your behavioral interview scores have plateaued. Consider practicing more STAR method responses.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </>
  )
}
