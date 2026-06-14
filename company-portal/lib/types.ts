// ── Recruiter & Company ─────────────────────────────────

export interface Company {
  id: number
  name: string
  logo_url: string | null
  website: string | null
  description: string | null
  created_at: string
}

export interface Recruiter {
  id: number
  full_name: string
  email: string
  company: Company
  created_at: string
}

// ── Job Openings ────────────────────────────────────────

export interface JobOpening {
  id: number
  company_id: number
  title: string
  department: string | null
  description: string
  required_skills: string | null
  difficulty_level: string | null
  is_active: boolean
  created_at: string
}

// ── Candidate Profiles ──────────────────────────────────

export interface SkillScoreItem {
  skill_name: string
  category: string | null
  score: number
}

export interface CandidateProfile {
  id: number
  full_name: string | null
  professional_title: string | null
  education: string | null
  skills: string | null
  bio: string | null
  profile_image: string | null
  created_at: string
  skill_scores: SkillScoreItem[]
  avg_technical_score: number | null
  avg_hr_score: number | null
  completed_interviews: number
}

// ── Match Results ───────────────────────────────────────

export interface MatchBreakdown {
  matched_skills: string[]
  missing_skills: string[]
  skill_match_pct: number
  score_bonus: number
}

export interface CandidateMatch {
  candidate: CandidateProfile
  match_percentage: number
  breakdown: MatchBreakdown
}

// ── Shortlist ───────────────────────────────────────────

export type ShortlistStatus = "shortlisted" | "contacted" | "interviewing" | "hired" | "rejected"

export interface ShortlistEntry {
  id: number
  job_opening_id: number
  candidate_id: number
  status: ShortlistStatus
  notes: string | null
  created_at: string
  updated_at: string | null
}

// ── API Responses ───────────────────────────────────────

export interface PaginatedCandidates {
  candidates: CandidateProfile[]
  total: number
  page: number
  page_size: number
}

export interface PaginatedMatches {
  matches: CandidateMatch[]
  total: number
  page: number
  page_size: number
}
