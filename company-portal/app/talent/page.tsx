"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { API_BASE_URL } from "@/lib/api-config"
import type { CandidateProfile, PaginatedCandidates } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, User, ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react"

export default function TalentSearchPage() {
  const [candidates, setCandidates] = useState<CandidateProfile[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [skills, setSkills] = useState("")
  const [title, setTitle] = useState("")
  const [education, setEducation] = useState("")
  const [minTech, setMinTech] = useState("")
  const [minHr, setMinHr] = useState("")

  const PAGE_SIZE = 12

  const fetchCandidates = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (skills.trim()) params.set("skills", skills.trim())
      if (title.trim()) params.set("professional_title", title.trim())
      if (education.trim()) params.set("education_keyword", education.trim())
      if (minTech) params.set("min_tech_score", minTech)
      if (minHr) params.set("min_hr_score", minHr)
      params.set("page", String(page))
      params.set("page_size", String(PAGE_SIZE))

      const res = await fetch(`${API_BASE_URL}/recruiter/candidates?${params}`, {
        credentials: "include",
      })
      if (res.ok) {
        const data: PaginatedCandidates = await res.json()
        setCandidates(data.candidates)
        setTotal(data.total)
      }
    } catch { /* ignore */ }
    setIsLoading(false)
  }, [skills, title, education, minTech, minHr, page])

  useEffect(() => {
    fetchCandidates()
  }, [fetchCandidates])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchCandidates()
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasFilters = !!(skills || title || education || minTech || minHr)

  const clearFilters = () => {
    setSkills("")
    setTitle("")
    setEducation("")
    setMinTech("")
    setMinHr("")
    setPage(1)
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Talent Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find candidates who have opted in to be discoverable
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by skills (e.g. React, Python, SQL)"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
        </div>
        <Button type="submit">Search</Button>
        <Button
          type="button"
          variant={showFilters ? "secondary" : "outline"}
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </form>

      {/* Filters panel */}
      {showFilters && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Filters</p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="text-xs">Professional Title</Label>
              <Input
                className="mt-1"
                placeholder="e.g. Frontend Developer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Education</Label>
              <Input
                className="mt-1"
                placeholder="e.g. Computer Science"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Min Technical Score</Label>
              <Input
                className="mt-1"
                type="number"
                min={0}
                max={100}
                placeholder="0–100"
                value={minTech}
                onChange={(e) => setMinTech(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Min HR Score</Label>
              <Input
                className="mt-1"
                type="number"
                min={0}
                max={100}
                placeholder="0–100"
                value={minHr}
                onChange={(e) => setMinHr(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <User className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">No candidates found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {hasFilters
                  ? "Try adjusting your filters"
                  : "Candidates need to enable profile visibility in their settings"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted-foreground">
            {total} candidate{total !== 1 ? "s" : ""} found
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((c) => (
              <CandidateCard key={c.id} candidate={c} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function CandidateCard({ candidate }: { candidate: CandidateProfile }) {
  const skills = candidate.skills
    ? candidate.skills.split(",").map(s => s.trim()).filter(Boolean).slice(0, 4)
    : []

  const avgScore = (() => {
    let sum = 0, count = 0
    if (candidate.avg_technical_score) { sum += candidate.avg_technical_score; count++ }
    if (candidate.avg_hr_score) { sum += candidate.avg_hr_score; count++ }
    return count > 0 ? Math.round(sum / count) : null
  })()

  return (
    <Link href={`/talent/${candidate.id}`}>
      <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-muted-foreground">
            {candidate.full_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{candidate.full_name || "Anonymous"}</p>
            <p className="text-xs text-muted-foreground truncate">
              {candidate.professional_title || "No title"}
            </p>
          </div>
          {avgScore !== null && (
            <div className="text-right">
              <p className="text-lg font-semibold tabular-nums text-primary">{avgScore}</p>
              <p className="text-[10px] text-muted-foreground">score</p>
            </div>
          )}
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {skills.map(s => (
              <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
          {candidate.completed_interviews > 0 && (
            <span>{candidate.completed_interviews} interviews</span>
          )}
          {candidate.education && (
            <span className="truncate">{candidate.education}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
