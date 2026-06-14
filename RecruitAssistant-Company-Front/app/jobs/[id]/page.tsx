"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { API_BASE_URL } from "@/lib/api-config"
import type { JobOpening, CandidateMatch, ShortlistEntry, ShortlistStatus, PaginatedMatches } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Users, Target, Loader2, ChevronDown } from "lucide-react"
import { toast } from "sonner"

const STATUS_LABELS: Record<ShortlistStatus, string> = {
  shortlisted: "Shortlisted",
  contacted: "Contacted",
  interviewing: "Interviewing",
  hired: "Hired",
  rejected: "Rejected",
}

const STATUS_COLORS: Record<ShortlistStatus, string> = {
  shortlisted: "bg-chart-1/10 text-chart-1",
  contacted: "bg-chart-2/10 text-chart-2",
  interviewing: "bg-chart-3/10 text-chart-3",
  hired: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [job, setJob] = useState<JobOpening | null>(null)
  const [tab, setTab] = useState<"matches" | "pipeline">("matches")
  const [matches, setMatches] = useState<CandidateMatch[]>([])
  const [shortlists, setShortlists] = useState<ShortlistEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingTab, setIsLoadingTab] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/recruiter/jobs/${jobId}`, { credentials: "include" })
        if (res.ok) setJob(await res.json())
      } catch { /* ignore */ }
      setIsLoading(false)
    }
    load()
  }, [jobId])

  useEffect(() => {
    if (!job) return
    setIsLoadingTab(true)
    if (tab === "matches") {
      fetch(`${API_BASE_URL}/recruiter/jobs/${jobId}/matches?page_size=50`, { credentials: "include" })
        .then(r => r.ok ? r.json() : null)
        .then((data: PaginatedMatches | null) => { if (data) setMatches(data.matches) })
        .finally(() => setIsLoadingTab(false))
    } else {
      fetch(`${API_BASE_URL}/recruiter/jobs/${jobId}/shortlist`, { credentials: "include" })
        .then(r => r.ok ? r.json() : null)
        .then((data: ShortlistEntry[] | null) => { if (data) setShortlists(data) })
        .finally(() => setIsLoadingTab(false))
    }
  }, [job, tab, jobId])

  const handleStatusChange = async (shortlistId: number, newStatus: ShortlistStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/recruiter/shortlist/${shortlistId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include",
      })
      if (res.ok) {
        setShortlists(prev => prev.map(s => s.id === shortlistId ? { ...s, status: newStatus } : s))
        toast.success(`Status updated to ${STATUS_LABELS[newStatus]}`)
      }
    } catch {
      toast.error("Failed to update status")
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl">
        <Button variant="ghost" size="sm" className="mb-4 gap-1.5" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <p className="text-sm text-muted-foreground">Job not found.</p>
      </div>
    )
  }

  const reqSkills = job.required_skills?.split(",").map(s => s.trim()).filter(Boolean) || []

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <Button variant="ghost" size="sm" className="mb-4 gap-1.5 text-muted-foreground" onClick={() => router.push("/jobs")}>
        <ArrowLeft className="h-4 w-4" /> All jobs
      </Button>

      {/* Job header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-semibold">{job.title}</h1>
          <Badge variant={job.is_active ? "default" : "secondary"}>
            {job.is_active ? "Active" : "Closed"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {job.department && <span>{job.department}</span>}
          {job.difficulty_level && <span>· <span className="capitalize">{job.difficulty_level}</span></span>}
        </div>
        <p className="mt-3 text-sm text-foreground/80 leading-relaxed max-w-2xl">{job.description}</p>
        {reqSkills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {reqSkills.map(s => <Badge key={s} variant="outline">{s}</Badge>)}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-border">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "matches" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onClick={() => setTab("matches")}
        >
          <Target className="inline h-3.5 w-3.5 mr-1.5" />
          Matches
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "pipeline" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onClick={() => setTab("pipeline")}
        >
          <Users className="inline h-3.5 w-3.5 mr-1.5" />
          Pipeline ({shortlists.length})
        </button>
      </div>

      {/* Tab content */}
      {isLoadingTab ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : tab === "matches" ? (
        <MatchesTab matches={matches} />
      ) : (
        <PipelineTab shortlists={shortlists} onStatusChange={handleStatusChange} />
      )}
    </div>
  )
}

function MatchesTab({ matches }: { matches: CandidateMatch[] }) {
  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No matches found. Candidates need to enable profile visibility.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {matches.map((m, i) => (
        <Link key={m.candidate.id} href={`/talent/${m.candidate.id}`}>
          <div className="flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-secondary/50">
            {/* Rank */}
            <span className="w-6 text-center text-xs font-medium text-muted-foreground tabular-nums">
              {i + 1}
            </span>

            {/* Avatar */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-muted-foreground">
              {m.candidate.full_name?.charAt(0)?.toUpperCase() || "?"}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{m.candidate.full_name || "Anonymous"}</p>
              <p className="text-xs text-muted-foreground truncate">
                {m.candidate.professional_title || "No title"}
              </p>
            </div>

            {/* Matched skills */}
            <div className="hidden sm:flex flex-wrap gap-1 max-w-[200px]">
              {m.breakdown.matched_skills.slice(0, 3).map(s => (
                <Badge key={s} variant="default" className="text-[10px]">{s}</Badge>
              ))}
            </div>

            {/* Score */}
            <div className="text-right shrink-0">
              <p className="text-lg font-semibold tabular-nums text-primary">{Math.round(m.match_percentage)}%</p>
              <p className="text-[10px] text-muted-foreground">match</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function PipelineTab({ shortlists, onStatusChange }: { shortlists: ShortlistEntry[]; onStatusChange: (id: number, status: ShortlistStatus) => void }) {
  if (shortlists.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No candidates in the pipeline yet. Search for talent and shortlist them.</p>
        </CardContent>
      </Card>
    )
  }

  const statuses: ShortlistStatus[] = ["shortlisted", "contacted", "interviewing", "hired", "rejected"]

  return (
    <div className="space-y-2">
      {shortlists.map(entry => (
        <div key={entry.id} className="flex items-center justify-between rounded-xl border border-border p-4">
          <div>
            <p className="text-sm font-medium">Candidate #{entry.candidate_id}</p>
            <p className="text-xs text-muted-foreground">
              Added {new Date(entry.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[entry.status]}`}>
              {STATUS_LABELS[entry.status]}
            </span>
            <div className="relative">
              <select
                className="h-7 appearance-none rounded-md border border-input bg-transparent pl-2 pr-6 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                value={entry.status}
                onChange={e => onStatusChange(entry.id, e.target.value as ShortlistStatus)}
              >
                {statuses.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
