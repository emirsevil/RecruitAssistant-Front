"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { PageContainer, PageHeader } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Calendar, Download, CheckCircle2, ChevronLeft, ChevronRight, Brain, MessageSquare, Target } from "lucide-react"
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import { useLanguage } from "@/lib/language-context"

// Mock Data (Static labels kept as is or could be translated via mapping)
const quizProgressData = [
  { attempt: 'Q1', score: 65, avg: 60 },
  { attempt: 'Q2', score: 75, avg: 62 },
  { attempt: 'Q3', score: 72, avg: 65 },
  { attempt: 'Q4', score: 85, avg: 68 },
  { attempt: 'Q5', score: 82, avg: 70 },
  { attempt: 'Q6', score: 90, avg: 72 },
]

const interviewPerformanceData = [
  { subject: 'Communication', A: 85, fullMark: 100 },
  { subject: 'Problem Solving', A: 80, fullMark: 100 },
  { subject: 'Coding', A: 90, fullMark: 100 },
  { subject: 'System Design', A: 70, fullMark: 100 },
  { subject: 'Behavioral', A: 75, fullMark: 100 },
]

const skillTrendData = [
  { month: 'Sep', Frontend: 60, Backend: 40 },
  { month: 'Oct', Frontend: 70, Backend: 55 },
  { month: 'Nov', Frontend: 75, Backend: 70 },
  { month: 'Dec', Frontend: 85, Backend: 75 },
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
  const { t } = useLanguage()
  const [currentSlide, setCurrentSlide] = useState(0)
  const totalSlides = 3

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)

  const slides = [
    {
      title: t("Quiz Score Trend"),
      description: t("Comparison of your scores vs class average"),
      icon: <Brain className="h-5 w-5 text-purple-500" />,
      component: (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={quizProgressData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="attempt" />
            <YAxis />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend />
            <Line type="monotone" dataKey="score" stroke="#8884d8" name={t("Your Score")} strokeWidth={3} activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="avg" stroke="#82ca9d" name={t("Average")} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      )
    },
    {
      title: t("Interview Skill Radar"),
      description: t("Holistic view of your technical and soft skills"),
      icon: <MessageSquare className="h-5 w-5 text-blue-500" />,
      component: (
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={interviewPerformanceData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar name={t("My Skills")} dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      )
    },
    {
      title: t("Skill Growth (Frontend vs Backend)"),
      description: t("Progress over the last 4 months"),
      icon: <Target className="h-5 w-5 text-red-500" />,
      component: (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={skillTrendData}>
            <defs>
              <linearGradient id="colorFe" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorBe" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="Frontend" stroke="#8884d8" fillOpacity={1} fill="url(#colorFe)" />
            <Area type="monotone" dataKey="Backend" stroke="#82ca9d" fillOpacity={1} fill="url(#colorBe)" />
          </AreaChart>
        </ResponsiveContainer>
      )
    }
  ]

  return (
    <>
      <Navigation />
      <PageContainer>
        <PageHeader
          title={t("Analytics")}
          description={t("Track your progress and performance insights")}
          action={
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              {t("Export Report")}
            </Button>
          }
        />

        <div className="space-y-6">
          {/* Main Chart Carousel */}
          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {slides[currentSlide].icon}
                    <CardTitle>{slides[currentSlide].title}</CardTitle>
                  </div>
                  <CardDescription>{slides[currentSlide].description}</CardDescription>
                </div>

                {/* Carousel Controls */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={prevSlide}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-medium w-12 text-center text-muted-foreground">
                    {currentSlide + 1} / {totalSlides}
                  </div>
                  <Button variant="outline" size="icon" onClick={nextSlide}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full min-h-[300px] transition-all duration-300 ease-in-out">
                {slides[currentSlide].component}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* CV Version History */}
            <Card>
              <CardHeader>
                <CardTitle>{t("CV Version History")}</CardTitle>
                <CardDescription>{t("Track improvements to your resume")}</CardDescription>
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
                              {t("Current")}
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
                          <p className="text-muted-foreground">{t("ATS Score")}</p>
                          <p className="font-semibold">{cv.atsScore}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t("Role Match")}</p>
                          <p className="font-semibold">{cv.roleMatch}%</p>
                        </div>
                      </div>
                      {cv.status === "archived" && (
                        <Button size="sm" variant="ghost" className="mt-3 h-8 text-xs">
                          {t("View Version")}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Upcoming Tasks")}</CardTitle>
                <CardDescription>{t("Auto-generated action items based on your performance")}</CardDescription>
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
                          <p className="text-sm text-muted-foreground">{t("Due")}: {task.dueDate}</p>
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
          </div>

          {/* Insights Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-l-4 border-l-success">
              <CardContent className="p-6">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  <h3 className="font-semibold">{t("Strong Progress")}</h3>
                </div>
                <p className="text-sm text-muted-foreground text-pretty">
                  {t("You've improved your average score by 15% over the last month. Keep up the consistent practice!")}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-warning">
              <CardContent className="p-6">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-warning" />
                  <h3 className="font-semibold">{t("Area to Focus")}</h3>
                </div>
                <p className="text-sm text-muted-foreground text-pretty">
                  {t("Your behavioral interview scores have plateaued. Consider practicing more STAR method responses.")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </>
  )
}
