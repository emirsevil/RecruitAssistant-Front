"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { API_BASE_URL } from "@/lib/api-config"
import type { JobOpening } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Plus, Briefcase, ArrowRight, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobOpening[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const loadJobs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/recruiter/jobs`, { credentials: "include" })
      if (res.ok) setJobs(await res.json())
    } catch { /* ignore */ }
    setIsLoading(false)
  }

  useEffect(() => { loadJobs() }, [])

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Job Openings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your company&apos;s open positions
          </p>
        </div>
        <Button className="gap-1.5" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New Job
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <CreateJobForm
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadJobs() }}
        />
      )}

      {/* Job list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">No job openings</p>
              <p className="text-xs text-muted-foreground mt-1">Create your first position to start matching candidates</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {jobs.map(job => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <div className="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-secondary/50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{job.title}</p>
                    {job.is_active ? (
                      <Badge variant="default" className="text-[10px]">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Closed</Badge>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    {job.department && <span>{job.department}</span>}
                    {job.department && job.difficulty_level && <span>·</span>}
                    {job.difficulty_level && <span className="capitalize">{job.difficulty_level}</span>}
                    {job.required_skills && (
                      <>
                        <span>·</span>
                        <span className="truncate max-w-[200px]">{job.required_skills}</span>
                      </>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateJobForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("")
  const [department, setDepartment] = useState("")
  const [description, setDescription] = useState("")
  const [requiredSkills, setRequiredSkills] = useState("")
  const [difficulty, setDifficulty] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/recruiter/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          department: department || undefined,
          description,
          required_skills: requiredSkills || undefined,
          difficulty_level: difficulty || undefined,
        }),
        credentials: "include",
      })
      if (res.ok) {
        toast.success("Job created")
        onCreated()
      } else {
        const err = await res.json()
        toast.error(err.detail || "Failed to create job")
      }
    } catch {
      toast.error("Network error")
    }
    setIsSubmitting(false)
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">New Job Opening</CardTitle>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Job Title *</Label>
              <Input className="mt-1" placeholder="e.g. Senior React Developer" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div>
              <Label className="text-xs">Department</Label>
              <Input className="mt-1" placeholder="e.g. Engineering" value={department} onChange={e => setDepartment(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Description *</Label>
            <Textarea className="mt-1" rows={3} placeholder="Describe the role, responsibilities, and requirements…" value={description} onChange={e => setDescription(e.target.value)} required />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Required Skills</Label>
              <Input className="mt-1" placeholder="react, typescript, node.js" value={requiredSkills} onChange={e => setRequiredSkills(e.target.value)} />
              <p className="mt-0.5 text-[10px] text-muted-foreground">Comma-separated</p>
            </div>
            <div>
              <Label className="text-xs">Level</Label>
              <select
                className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
              >
                <option value="">Any</option>
                <option value="intern">Intern</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5">
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create Job
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
