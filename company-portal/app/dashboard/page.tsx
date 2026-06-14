"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { API_BASE_URL } from "@/lib/api-config"
import type { JobOpening } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Briefcase, Users, Search, ArrowRight, Plus } from "lucide-react"

export default function DashboardPage() {
  const { recruiter } = useAuth()
  const [jobs, setJobs] = useState<JobOpening[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/recruiter/jobs`, { credentials: "include" })
        if (res.ok) setJobs(await res.json())
      } catch { /* ignore */ }
      setIsLoading(false)
    }
    load()
  }, [])

  const activeJobs = jobs.filter(j => j.is_active).length
  const firstName = recruiter?.full_name?.split(" ")[0] || ""

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <p className="eyebrow mb-1">{recruiter?.company.name}</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back{firstName ? `, ${firstName}` : ""}.
        </h1>
      </div>

      {/* Stats Row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Active Jobs"
          value={isLoading ? null : activeJobs}
          icon={<Briefcase className="h-4 w-4" />}
        />
        <StatCard
          label="Total Positions"
          value={isLoading ? null : jobs.length}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Quick Action"
          value={null}
          icon={<Search className="h-4 w-4" />}
          action={
            <Link href="/talent">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                Search Talent <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          }
        />
      </div>

      {/* Recent Jobs */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent Job Openings</h2>
          <Link href="/jobs">
            <Button size="sm" variant="ghost" className="gap-1 text-xs text-muted-foreground">
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">No job openings yet</p>
                <p className="text-xs text-muted-foreground">Create your first job to start matching candidates</p>
              </div>
              <Link href="/jobs">
                <Button size="sm" className="mt-1 gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Create Job
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {jobs.slice(0, 5).map(job => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <div className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{job.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.department || "General"} · {job.difficulty_level || "Any level"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {job.is_active ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        Closed
                      </span>
                    )}
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  action,
}: {
  label: string
  value: number | null
  icon: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          {value !== null ? (
            <p className="text-2xl font-semibold tabular-nums">{value}</p>
          ) : action ? (
            action
          ) : (
            <Skeleton className="h-7 w-12" />
          )}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}
