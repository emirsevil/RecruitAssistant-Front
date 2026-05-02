"use client"

import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { PageContainer, PageHeader } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Minus,
  Target,
  TrendingUp,
  TrendingDown,
} from "lucide-react"

import { useLanguage } from "@/lib/language-context"
import { useWorkspace } from "@/lib/workspace-context"
import {
  useAnalytics,
  type AnalyticsRange,
  type DifficultyRow,
  type ModeSplit,
  type ScoreBucket,
} from "@/hooks/use-analytics"

export default function AnalyticsPage() {
  const { t } = useLanguage()
  const { activeWorkspace } = useWorkspace()
  const [range, setRange] = useState<AnalyticsRange>("30d")

  const { data, isLoading, error } = useAnalytics({
    workspaceId: activeWorkspace?.id,
    range,
  })

  // ─── Empty / loading shells ────────────────────────────────────

  if (!activeWorkspace) {
    return (
      <PageContainer>
        <PageHeader title={t("Analytics")} description={t("Track your progress and performance insights")} />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("Select a workspace from the top menu to view analytics.")}
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div data-tour="analytics-header">
      <PageHeader
        title={t("Analytics")}
        description={
          activeWorkspace
            ? `${activeWorkspace.name}${activeWorkspace.jobName ? ` · ${activeWorkspace.jobName}` : ""}`
            : t("Track your progress and performance insights")
        }
        action={
          <Select value={range} onValueChange={(v) => setRange(v as AnalyticsRange)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">{t("Last 30 days")}</SelectItem>
              <SelectItem value="90d">{t("Last 90 days")}</SelectItem>
              <SelectItem value="all">{t("All time")}</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      </div>

      {isLoading && !data && (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("Loading analytics...")}
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="py-8 text-center text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {data && (
        <div className="space-y-6">
          {/* A. KPI strip */}
          <div data-tour="analytics-kpis" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile
              label={t("Interviews")}
              value={data.kpis.interviews.current}
              prev={data.kpis.interviews.prev}
              icon={<MessageSquare className="h-4 w-4" />}
              isPercent={false}
            />
            <KpiTile
              label={t("Avg interview score")}
              value={data.kpis.avg_interview_score.current}
              prev={data.kpis.avg_interview_score.prev}
              icon={<Target className="h-4 w-4" />}
              isPercent
            />
            <KpiTile
              label={t("Quizzes")}
              value={data.kpis.quizzes.current}
              prev={data.kpis.quizzes.prev}
              icon={<Brain className="h-4 w-4" />}
              isPercent={false}
            />
            <KpiTile
              label={t("Avg quiz score")}
              value={data.kpis.avg_quiz_score.current}
              prev={data.kpis.avg_quiz_score.prev}
              icon={<CheckCircle2 className="h-4 w-4" />}
              isPercent
            />
          </div>

          {/* B. Score over time */}
          <ScoreTimeseries
            series={data.score_timeseries}
            bucketUnit={data.bucket_unit}
            t={t}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            {/* C. Topic breakdown */}
            <TopicBreakdown rows={data.topic_breakdown} t={t} />

            {/* F. Quiz breakdown */}
            <QuizBreakdown rows={data.quiz_breakdown} t={t} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* D. Difficulty progression */}
            <DifficultyProgression rows={data.difficulty_breakdown} t={t} />

            {/* E. Mode split */}
            <ModeSplitSection split={data.mode_split} t={t} />
          </div>

          {/* H. Insight cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {data.insights.slice(0, 2).map((card, idx) => (
              <InsightCardView key={idx} card={card} />
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  )
}

// ─────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────

function KpiTile({
  label,
  value,
  prev,
  icon,
  isPercent,
}: {
  label: string
  value: number
  prev: number
  icon: React.ReactNode
  isPercent: boolean
}) {
  const delta = round1(value - prev)
  const trendIcon =
    delta > 0 ? (
      <ArrowUpRight className="h-3.5 w-3.5 text-success" />
    ) : delta < 0 ? (
      <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
    ) : (
      <Minus className="h-3.5 w-3.5 text-muted-foreground" />
    )

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-2 flex items-center justify-between text-muted-foreground">
          <span className="text-[12px] font-medium uppercase tracking-wide">{label}</span>
          {icon}
        </div>
        <div className="font-serif text-[28px] leading-tight tabular-nums">
          {round1(value)}
          {isPercent && <span className="ml-0.5 text-[16px] text-muted-foreground">%</span>}
        </div>
        <div className="mt-1 flex items-center gap-1 text-[12px] text-muted-foreground">
          {trendIcon}
          <span>
            {delta === 0
              ? "no change"
              : `${delta > 0 ? "+" : ""}${delta}${isPercent ? "%" : ""} vs prev`}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function ScoreTimeseries({
  series,
  bucketUnit,
  t,
}: {
  series: ScoreBucket[]
  bucketUnit: "day" | "week"
  t: (k: string) => string
}) {
  const bucketLabel =
    bucketUnit === "day" ? t("each dot = 1 day") : t("each dot = 1 ISO week")

  if (!series.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("Score over time")}</CardTitle>
          <CardDescription>
            {t("Interview and quiz scores in the selected window")} · {bucketLabel}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          {t("No completed attempts yet in this window.")}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Score over time")}</CardTitle>
        <CardDescription>
          {t("Interview and quiz scores in the selected window")} · {bucketLabel}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={series} margin={{ left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Line
              type="monotone"
              dataKey="interview_hr"
              name={t("HR interview")}
              stroke="#8884d8"
              strokeWidth={2}
              connectNulls
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="interview_tech"
              name={t("Technical interview")}
              stroke="#82ca9d"
              strokeWidth={2}
              connectNulls
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="quiz"
              name={t("Quiz")}
              stroke="#f59e0b"
              strokeWidth={2}
              connectNulls
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function TopicBreakdown({
  rows,
  t,
}: {
  rows: { topic: string; attempts: number; avg_score: number; trend: number | null }[]
  t: (k: string) => string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Topic breakdown")}</CardTitle>
        <CardDescription>
          {t("Per-topic average from your interview question scores")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t("Complete a few more interviews to see topic-level scoring.")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Topic")}</TableHead>
                <TableHead className="text-right">{t("Attempts")}</TableHead>
                <TableHead className="text-right">{t("Avg")}</TableHead>
                <TableHead className="text-right">{t("Trend")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 8).map((r) => (
                <TableRow key={r.topic}>
                  <TableCell className="font-medium">{r.topic}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.attempts}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <ScorePill value={r.avg_score} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <TrendCell value={r.trend} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function QuizBreakdown({
  rows,
  t,
}: {
  rows: { title: string; attempts: number; best: number; latest: number; accuracy: number }[]
  t: (k: string) => string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Quiz breakdown")}</CardTitle>
        <CardDescription>{t("Per-quiz performance and retake history")}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t("Take a quiz in this workspace to see results here.")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Quiz")}</TableHead>
                <TableHead className="text-right">{t("Attempts")}</TableHead>
                <TableHead className="text-right">{t("Best")}</TableHead>
                <TableHead className="text-right">{t("Latest")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 8).map((r) => (
                <TableRow key={r.title}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.attempts}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <ScorePill value={r.best} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <ScorePill value={r.latest} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function InsightCardView({
  card,
}: {
  card: { tone: "positive" | "warning" | "neutral"; title: string; body: string }
}) {
  const cls =
    card.tone === "positive"
      ? "border-l-success"
      : card.tone === "warning"
        ? "border-l-warning"
        : "border-l-border"
  const Icon = card.tone === "positive" ? TrendingUp : card.tone === "warning" ? TrendingDown : Minus
  const iconCls =
    card.tone === "positive"
      ? "text-success"
      : card.tone === "warning"
        ? "text-warning"
        : "text-muted-foreground"

  return (
    <Card className={`border-l-4 ${cls}`}>
      <CardContent className="p-6">
        <div className="mb-2 flex items-center gap-2">
          <Icon className={`h-5 w-5 ${iconCls}`} />
          <h3 className="font-semibold">{card.title}</h3>
        </div>
        <p className="text-sm text-muted-foreground text-pretty">{card.body}</p>
      </CardContent>
    </Card>
  )
}

function DifficultyProgression({
  rows,
  t,
}: {
  rows: DifficultyRow[]
  t: (k: string) => string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Difficulty progression")}</CardTitle>
        <CardDescription>{t("Average score by interview difficulty")}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t("No completed interviews in this window.")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={rows} margin={{ left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="difficulty" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  fontSize: "12px",
                }}
                formatter={(v: number, name) => [
                  name === "avg_score" ? `${round1(v)}%` : v,
                  name === "avg_score" ? t("Avg score") : t("Attempts"),
                ]}
              />
              <Bar dataKey="avg_score" name={t("Avg score")} fill="#8884d8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

function ModeSplitSection({
  split,
  t,
}: {
  split: ModeSplit
  t: (k: string) => string
}) {
  const total = split.voice.count + split.text.count
  const data = [
    { name: t("Voice"), value: split.voice.count, fill: "#8884d8" },
    { name: t("Text"), value: split.text.count, fill: "#82ca9d" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Voice vs text")}</CardTitle>
        <CardDescription>{t("Mix and average score per interview mode")}</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t("No completed interviews in this window.")}
          </div>
        ) : (
          <div className="grid grid-cols-2 items-center gap-4">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              <ModeStat
                label={t("Voice")}
                color="#8884d8"
                count={split.voice.count}
                avg={split.voice.avg_score}
              />
              <ModeStat
                label={t("Text")}
                color="#82ca9d"
                count={split.text.count}
                avg={split.text.avg_score}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ModeStat({
  label,
  color,
  count,
  avg,
}: {
  label: string
  color: string
  count: number
  avg: number
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div className="min-w-0">
        <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="font-serif text-[20px] leading-tight tabular-nums">
          {count}{" "}
          <span className="text-[12px] text-muted-foreground">
            · {round1(avg)}% avg
          </span>
        </p>
      </div>
    </div>
  )
}

function ScorePill({ value }: { value: number }) {
  const color =
    value >= 80
      ? "bg-success/10 text-success"
      : value >= 60
        ? "bg-clay-soft text-clay"
        : "bg-destructive/10 text-destructive"
  return (
    <Badge variant="secondary" className={`rounded-md font-semibold ${color}`}>
      {round1(value)}%
    </Badge>
  )
}

function TrendCell({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-muted-foreground">—</span>
  }
  if (value > 0) {
    return <span className="text-success">+{round1(value)}</span>
  }
  if (value < 0) {
    return <span className="text-destructive">{round1(value)}</span>
  }
  return <span className="text-muted-foreground">0</span>
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}
