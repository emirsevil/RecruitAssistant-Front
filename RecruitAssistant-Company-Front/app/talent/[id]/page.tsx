"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { API_BASE_URL } from "@/lib/api-config"
import type { CandidateProfile, JobOpening } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Briefcase, GraduationCap, User, Award, MessageSquare, Plus, Check } from "lucide-react"
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from "recharts"
import { toast } from "sonner"

export default function CandidateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const candidateId = params.id as string

  const [candidate, setCandidate] = useState<CandidateProfile | null>(null)
  const [jobs, setJobs] = useState<JobOpening[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [shortlistingJob, setShortlistingJob] = useState<number | null>(null)
  const [shortlistedJobs, setShortlistedJobs] = useState<Set<number>>(new Set())

  useEffect(() => {
    async function load() {
      try {
        const [candidateRes, jobsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/recruiter/candidates/${candidateId}`, { credentials: "include" }),
          fetch(`${API_BASE_URL}/recruiter/jobs`, { credentials: "include" }),
        ])
        if (candidateRes.ok) setCandidate(await candidateRes.json())
        if (jobsRes.ok) setJobs(await jobsRes.json())
      } catch { /* ignore */ }
      setIsLoading(false)
    }
    load()
  }, [candidateId])

  const handleShortlist = async (jobId: number) => {
    setShortlistingJob(jobId)
    try {
      const res = await fetch(`${API_BASE_URL}/recruiter/jobs/${jobId}/shortlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: Number(candidateId) }),
        credentials: "include",
      })
      if (res.ok) {
        setShortlistedJobs(prev => new Set(prev).add(jobId))
        toast.success("Candidate shortlisted")
      } else if (res.status === 409) {
        setShortlistedJobs(prev => new Set(prev).add(jobId))
        toast.info("Already shortlisted")
      } else {
        const err = await res.json()
        toast.error(err.detail || "Failed to shortlist")
      }
    } catch {
      toast.error("Network error")
    }
    setShortlistingJob(null)
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl">
        <Button variant="ghost" size="sm" className="mb-4 gap-1.5" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <p className="text-sm text-muted-foreground">Candidate not found or not discoverable.</p>
      </div>
    )
  }

  const skills = candidate.skills
    ? candidate.skills.split(",").map(s => s.trim()).filter(Boolean)
    : []

  // Radar chart data from skill_scores
  const radarData = candidate.skill_scores.slice(0, 8).map(s => ({
    skill: s.skill_name.length > 12 ? s.skill_name.slice(0, 12) + "…" : s.skill_name,
    score: s.score,
  }))

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <Button variant="ghost" size="sm" className="mb-4 gap-1.5 text-muted-foreground" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Back to search
      </Button>

      {/* Profile header */}
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-medium text-muted-foreground">
          {candidate.full_name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold">{candidate.full_name || "Anonymous"}</h1>
          <p className="text-sm text-muted-foreground">{candidate.professional_title || "No title set"}</p>
          {candidate.bio && (
            <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{candidate.bio}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        {/* Left column */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <MiniStat
              label="Technical"
              value={candidate.avg_technical_score}
              icon={<Award className="h-3.5 w-3.5" />}
            />
            <MiniStat
              label="HR Score"
              value={candidate.avg_hr_score}
              icon={<MessageSquare className="h-3.5 w-3.5" />}
            />
            <MiniStat
              label="Interviews"
              value={candidate.completed_interviews}
              icon={<User className="h-3.5 w-3.5" />}
            />
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map(s => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Education */}
          {candidate.education && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" /> Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{candidate.education}</p>
              </CardContent>
            </Card>
          )}

          {/* Radar chart */}
          {radarData.length >= 3 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Skill Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="var(--primary)"
                        fill="var(--primary)"
                        fillOpacity={0.15}
                        strokeWidth={1.5}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — Shortlist */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" /> Shortlist for a Job
              </CardTitle>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <p className="text-xs text-muted-foreground">No job openings yet. Create one first.</p>
              ) : (
                <div className="space-y-1.5">
                  {jobs.filter(j => j.is_active).map(job => {
                    const isShortlisted = shortlistedJobs.has(job.id)
                    return (
                      <div key={job.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{job.title}</p>
                          <p className="text-[10px] text-muted-foreground">{job.department || "General"}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={isShortlisted ? "secondary" : "outline"}
                          className="h-7 shrink-0 text-xs gap-1"
                          disabled={isShortlisted || shortlistingJob === job.id}
                          onClick={() => handleShortlist(job.id)}
                        >
                          {isShortlisted ? (
                            <><Check className="h-3 w-3" /> Added</>
                          ) : (
                            <><Plus className="h-3 w-3" /> Add</>
                          )}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value, icon }: { label: string; value: number | null; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-semibold tabular-nums">{value ?? "—"}</p>
    </div>
  )
}
