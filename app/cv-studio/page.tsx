"use client"

import Image from "next/image"
import type { ChangeEvent, DragEvent, ReactNode, RefObject } from "react"
import { useMemo, useRef, useState } from "react"

import { PageContainer } from "@/components/page-container"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  Bot,
  BriefcaseBusiness,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileCheck2,
  FileText,
  Gauge,
  GraduationCap,
  Layers3,
  Link2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  UploadCloud,
  UserRound,
  Wand2,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

type ParseStatus = "idle" | "uploaded" | "parsing" | "parsed"
type ActiveAction = "parse" | "generate-cv" | "generate-letter" | "improve" | string | null
type StudioMode = "manual" | "upload"

type UploadedSource = {
  name: string
  type: "PDF" | "DOCX"
  size: string
}

type PersonalInfo = {
  fullName: string
  headline: string
  email: string
  phone: string
  location: string
}

type EducationEntry = {
  id: string
  school: string
  degree: string
  field: string
  startDate: string
  endDate: string
  details: string
}

type ExperienceEntry = {
  id: string
  company: string
  role: string
  location: string
  startDate: string
  endDate: string
  bullets: string[]
}

type ProjectEntry = {
  id: string
  name: string
  role: string
  techStack: string
  description: string
}

type LinkEntry = {
  id: string
  label: string
  url: string
}

type CVData = {
  personal: PersonalInfo
  summary: string
  education: EducationEntry[]
  experience: ExperienceEntry[]
  projects: ProjectEntry[]
  skills: string[]
  links: LinkEntry[]
}

type Analysis = {
  atsScore: number
  roleMatch: number
  missingSkills: string[]
  matchedSkills?: string[]
  recommendations?: string[]
  confidenceLabel?: string
  limitedConfidence?: boolean
}

type SectionQualityStatus = "confident" | "partial" | "missing"

type SectionQuality = {
  status: SectionQualityStatus
  score: number
  message: string
}

type ParseQuality = {
  overallScore: number
  overallStatus: SectionQualityStatus
  sections: Record<string, SectionQuality>
}

type ParseCVResponse = {
  cvData: CVData
  warnings: string[]
  analysis: Analysis | null
  quality: ParseQuality
  sourceName: string
  sourceType: "PDF" | "DOCX"
  extractedTextPreview: string
  extractedText: string
  rawExtractedText: string
}

type ImproveSectionResponse = {
  suggestions: string[]
  warnings: string[]
  improvedText?: string | null
}

type GeneratedDocument = {
  type: "CV" | "Cover Letter"
  latex: string
  generatedAt: string
  pdfBase64?: string | null
  pdfStatus: "idle" | "compiling" | "ready" | "unavailable"
  pdfError?: string
}

type CompileResponse = {
  pdf_base64: string | null
  cv_id?: number | null
  cover_letter_id?: number | null
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

const initialCV: CVData = {
  personal: {
    fullName: "Maya Demir",
    headline: "Senior Frontend Engineer focused on AI-assisted workflow products",
    email: "maya.demir@example.com",
    phone: "+1 (415) 555-0198",
    location: "San Francisco, CA",
  },
  summary:
    "Product-minded frontend engineer with 7 years of experience building complex SaaS workspaces, design systems, and analytics surfaces. Known for turning ambiguous user problems into polished, measurable product improvements with React, TypeScript, and cross-functional teams.",
  education: [
    {
      id: "edu-1",
      school: "Bogazici University",
      degree: "B.S.",
      field: "Computer Engineering",
      startDate: "2013",
      endDate: "2017",
      details: "Graduated with honors. Coursework included human-computer interaction and distributed systems.",
    },
  ],
  experience: [
    {
      id: "exp-1",
      company: "Northstar Labs",
      role: "Senior Frontend Engineer",
      location: "Remote",
      startDate: "Mar 2021",
      endDate: "Present",
      bullets: [
        "Led the rebuild of a customer intelligence workspace in React and TypeScript, reducing task completion time by 28%.",
        "Built a reusable component system with accessibility standards, cutting implementation time for new product surfaces by 35%.",
        "Partnered with product and data teams to launch AI-assisted recommendations grounded in existing customer records.",
      ],
    },
    {
      id: "exp-2",
      company: "SignalPoint",
      role: "Frontend Engineer",
      location: "Istanbul, Turkey",
      startDate: "Jul 2017",
      endDate: "Feb 2021",
      bullets: [
        "Shipped dashboard workflows used by 40,000 monthly active users across recruiting and HR analytics teams.",
        "Improved page performance by replacing legacy client rendering patterns, lifting Lighthouse performance from 62 to 91.",
        "Created onboarding flows that increased activation for new team accounts by 18%.",
      ],
    },
  ],
  projects: [
    {
      id: "project-1",
      name: "AI Brief Builder",
      role: "Lead Frontend Engineer",
      techStack: "React, TypeScript, OpenAI API, Tailwind CSS",
      description:
        "Built an internal tool that converts approved research notes into role-specific interview briefs while preserving source citations.",
    },
    {
      id: "project-2",
      name: "Design System Migration",
      role: "Technical Lead",
      techStack: "Storybook, Radix UI, Playwright",
      description:
        "Moved five product teams onto a shared component library with visual regression checks and accessible interaction patterns.",
    },
  ],
  skills: [
    "React",
    "TypeScript",
    "Next.js",
    "Tailwind CSS",
    "Design Systems",
    "Accessibility",
    "Product Analytics",
    "OpenAI API",
    "Playwright",
    "Cross-functional Leadership",
  ],
  links: [
    { id: "link-1", label: "Portfolio", url: "https://maya-demir.dev" },
    { id: "link-2", label: "LinkedIn", url: "https://linkedin.com/in/mayademir" },
    { id: "link-3", label: "GitHub", url: "https://github.com/mayademir" },
  ],
}

const sampleJobDescription =
  "We are hiring a Senior Frontend Engineer to build AI-powered workflow products for recruiting teams. The role requires React, TypeScript, design systems, accessibility, product analytics, and experience partnering with product, design, and applied AI teams. Candidates should be comfortable improving complex SaaS interfaces, measuring product outcomes, and explaining tradeoffs clearly."

const initialAnalysis: Analysis = {
  atsScore: 86,
  roleMatch: 82,
  missingSkills: ["Experimentation", "WCAG audits", "Recruiting workflows"],
  confidenceLabel: "Based on reviewed CV data",
  limitedConfidence: false,
}

const initialWarnings = ["Please review extracted dates", "Some sections may need confirmation"]

const emptyQuality: ParseQuality = {
  overallScore: 0,
  overallStatus: "missing",
  sections: {
    personal: { status: "missing", score: 0, message: "Not detected" },
    summary: { status: "missing", score: 0, message: "Not detected" },
    experience: { status: "missing", score: 0, message: "Not detected" },
    education: { status: "missing", score: 0, message: "Not detected" },
    projects: { status: "missing", score: 0, message: "Not detected" },
    skills: { status: "missing", score: 0, message: "Not detected" },
    links: { status: "missing", score: 0, message: "Not detected" },
  },
}

const initialQuality: ParseQuality = {
  overallScore: 84,
  overallStatus: "confident",
  sections: {
    personal: { status: "confident", score: 96, message: "Ready" },
    summary: { status: "confident", score: 90, message: "Ready" },
    experience: { status: "confident", score: 88, message: "Ready" },
    education: { status: "confident", score: 82, message: "Ready" },
    projects: { status: "confident", score: 84, message: "Ready" },
    skills: { status: "confident", score: 92, message: "Ready" },
    links: { status: "confident", score: 82, message: "Ready" },
  },
}

export default function CVStudioPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [studioMode, setStudioMode] = useState<StudioMode>("manual")
  const [cvData, setCvData] = useState<CVData>(initialCV)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [sourceFile, setSourceFile] = useState<UploadedSource | null>(null)
  const [parseStatus, setParseStatus] = useState<ParseStatus>("idle")
  const [parseProgress, setParseProgress] = useState(0)
  const [jobDescription, setJobDescription] = useState(sampleJobDescription)
  const [instructions, setInstructions] = useState(
    "Keep the CV concise, leadership-oriented, and grounded in the existing facts. Prioritize measurable frontend and AI workflow impact.",
  )
  const [analysis, setAnalysis] = useState<Analysis | null>(initialAnalysis)
  const [parseQuality, setParseQuality] = useState<ParseQuality>(initialQuality)
  const [warnings, setWarnings] = useState<string[]>([])
  const [activeAction, setActiveAction] = useState<ActiveAction>(null)
  const [aiReview, setAiReview] = useState([
    "Summary is aligned with the target role and avoids unsupported claims.",
    "Experience bullets include measurable outcomes.",
    "Consider confirming whether recruiting workflow exposure should be mentioned.",
  ])
  const [documentStatus, setDocumentStatus] = useState("Manual workspace ready")
  const [apiError, setApiError] = useState("")
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([])
  const [rawExtractedText, setRawExtractedText] = useState("")
  const [rawSourceText, setRawSourceText] = useState("")
  const [showRawText, setShowRawText] = useState(false)

  const latestCvDocument = generatedDocuments.find((document) => document.type === "CV")
  const hasUploadedSource = Boolean(rawExtractedText.trim())
  const canGenerateFromCurrentMode = studioMode === "manual" || hasUploadedSource

  const sourceCompleteness = useMemo(() => {
    const sections = [
      cvData.personal.fullName,
      cvData.summary,
      cvData.education.length,
      cvData.experience.length,
      cvData.projects.length,
      cvData.skills.length,
      cvData.links.length,
    ]

    return Math.round((sections.filter(Boolean).length / sections.length) * 100)
  }, [cvData])

  const jobCompleteness = useMemo(() => {
    if (!jobDescription.trim()) {
      return 0
    }

    return Math.min(100, Math.max(24, Math.round((jobDescription.trim().length / 520) * 100)))
  }, [jobDescription])

  const allPreviewLinks = useMemo(
    () => cvData.links.filter((link) => link.label.trim() || link.url.trim()),
    [cvData.links],
  )

  const visibleSkills = useMemo(() => cvData.skills.filter((skill) => skill.trim()), [cvData.skills])

  const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`

  const requestJson = async <T,>(path: string, init: RequestInit): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${path}`, init)
    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(payload?.detail || payload?.message || "RecruitAssistant API request failed")
    }

    return payload as T
  }

  const readStreamText = async (response: Response) => {
    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw new Error(payload?.detail || "Generation failed")
    }

    if (!response.body) {
      return response.text()
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let output = ""

    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        break
      }
      output += decoder.decode(value, { stream: true })
    }

    return output + decoder.decode()
  }

  const compilePdf = async (latex: string, documentType: "cv" | "cover_letter") => {
    const response = await requestJson<CompileResponse>("/api/compile-latex", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latex_content: latex,
        document_type: documentType,
      }),
    })

    return response.pdf_base64
  }

  const downloadPdf = (document: GeneratedDocument | undefined) => {
    if (!document?.pdfBase64) {
      return
    }

    const byteCharacters = window.atob(document.pdfBase64)
    const byteNumbers = Array.from(byteCharacters, (character) => character.charCodeAt(0))
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const anchor = window.document.createElement("a")
    anchor.href = url
    anchor.download = `RecruitAssistant_${document.type.replace(/\s+/g, "_")}.pdf`
    window.document.body.appendChild(anchor)
    anchor.click()
    window.document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  const formatCandidateProfile = () => {
    const linkedin = cvData.links.find((link) => link.label.toLowerCase().includes("linkedin"))?.url
    const github = cvData.links.find((link) => link.label.toLowerCase().includes("github"))?.url

    return {
      full_name: cvData.personal.fullName,
      email: cvData.personal.email,
      phone: cvData.personal.phone || null,
      linkedin: linkedin || null,
      github: github || null,
      location: cvData.personal.location || null,
      summary: cvData.summary || null,
      skills: cvData.skills.filter(Boolean),
      experience: cvData.experience.map((entry) => ({
        company: entry.company,
        title: entry.role,
        start_date: entry.startDate,
        end_date: entry.endDate || null,
        location: entry.location || null,
        bullets: entry.bullets.filter(Boolean),
      })),
      education: cvData.education.map((entry) => ({
        institution: entry.school,
        degree: [entry.degree, entry.field].filter(Boolean).join(", ") || entry.degree || entry.field || "Education",
        start_date: entry.startDate || null,
        end_date: entry.endDate || null,
        gpa: null,
        highlights: entry.details ? [entry.details] : [],
      })),
      projects: cvData.projects.map((entry) => ({
        name: entry.name,
        description: entry.description,
        technologies: entry.techStack.split(",").map((item) => item.trim()).filter(Boolean),
      })),
      certifications: [],
      languages: [],
    }
  }

  const buildGenerationPayload = () => {
    if (studioMode === "upload") {
      return {
        raw_cv_text: rawExtractedText,
        job_description: jobDescription,
        additional_instructions: instructions,
      }
    }

    return {
      candidate_profile: formatCandidateProfile(),
      job_description: jobDescription,
      additional_instructions: instructions,
    }
  }

  const handleModeChange = (mode: StudioMode) => {
    setStudioMode(mode)
    setGeneratedDocuments([])
    setApiError("")
    setWarnings([])
    setAnalysis(mode === "manual" ? initialAnalysis : null)
    setActiveAction(null)
    setDocumentStatus(mode === "manual" ? "Manual workspace ready" : "Upload a source CV to begin")
    setAiReview(
      mode === "manual"
        ? [
            "Manual fields are the source of truth for AI generation.",
            "Improve with AI can refine wording without adding unsupported facts.",
            "Review generated PDFs before applying.",
          ]
        : [
            "Your uploaded CV is used as source material.",
            "AI tailors the document for the target role without turning the upload into editable fields.",
            "If source information is unclear, it should be omitted rather than invented.",
          ],
    )
  }

  const updatePersonal = (field: keyof PersonalInfo, value: string) => {
    setCvData((current) => ({
      ...current,
      personal: {
        ...current.personal,
        [field]: value,
      },
    }))
  }

  const updateEducation = (id: string, field: keyof EducationEntry, value: string) => {
    setCvData((current) => ({
      ...current,
      education: current.education.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)),
    }))
  }

  const addEducation = () => {
    setCvData((current) => ({
      ...current,
      education: [
        ...current.education,
        {
          id: createId("edu"),
          school: "",
          degree: "",
          field: "",
          startDate: "",
          endDate: "",
          details: "",
        },
      ],
    }))
  }

  const removeEducation = (id: string) => {
    setCvData((current) => ({
      ...current,
      education: current.education.filter((entry) => entry.id !== id),
    }))
  }

  const updateExperience = (id: string, field: keyof Omit<ExperienceEntry, "bullets">, value: string) => {
    setCvData((current) => ({
      ...current,
      experience: current.experience.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)),
    }))
  }

  const addExperience = () => {
    setCvData((current) => ({
      ...current,
      experience: [
        ...current.experience,
        {
          id: createId("exp"),
          company: "",
          role: "",
          location: "",
          startDate: "",
          endDate: "",
          bullets: [""],
        },
      ],
    }))
  }

  const removeExperience = (id: string) => {
    setCvData((current) => ({
      ...current,
      experience: current.experience.filter((entry) => entry.id !== id),
    }))
  }

  const updateExperienceBullet = (experienceId: string, bulletIndex: number, value: string) => {
    setCvData((current) => ({
      ...current,
      experience: current.experience.map((entry) =>
        entry.id === experienceId
          ? {
              ...entry,
              bullets: entry.bullets.map((bullet, index) => (index === bulletIndex ? value : bullet)),
            }
          : entry,
      ),
    }))
  }

  const addExperienceBullet = (experienceId: string) => {
    setCvData((current) => ({
      ...current,
      experience: current.experience.map((entry) =>
        entry.id === experienceId ? { ...entry, bullets: [...entry.bullets, ""] } : entry,
      ),
    }))
  }

  const removeExperienceBullet = (experienceId: string, bulletIndex: number) => {
    setCvData((current) => ({
      ...current,
      experience: current.experience.map((entry) =>
        entry.id === experienceId
          ? { ...entry, bullets: entry.bullets.filter((_, index) => index !== bulletIndex) }
          : entry,
      ),
    }))
  }

  const updateProject = (id: string, field: keyof ProjectEntry, value: string) => {
    setCvData((current) => ({
      ...current,
      projects: current.projects.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)),
    }))
  }

  const addProject = () => {
    setCvData((current) => ({
      ...current,
      projects: [
        ...current.projects,
        {
          id: createId("project"),
          name: "",
          role: "",
          techStack: "",
          description: "",
        },
      ],
    }))
  }

  const removeProject = (id: string) => {
    setCvData((current) => ({
      ...current,
      projects: current.projects.filter((entry) => entry.id !== id),
    }))
  }

  const updateSkill = (index: number, value: string) => {
    setCvData((current) => ({
      ...current,
      skills: current.skills.map((skill, skillIndex) => (skillIndex === index ? value : skill)),
    }))
  }

  const addSkill = () => {
    setCvData((current) => ({
      ...current,
      skills: [...current.skills, ""],
    }))
  }

  const removeSkill = (index: number) => {
    setCvData((current) => ({
      ...current,
      skills: current.skills.filter((_, skillIndex) => skillIndex !== index),
    }))
  }

  const updateLink = (id: string, field: keyof LinkEntry, value: string) => {
    setCvData((current) => ({
      ...current,
      links: current.links.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)),
    }))
  }

  const addLink = () => {
    setCvData((current) => ({
      ...current,
      links: [...current.links, { id: createId("link"), label: "", url: "" }],
    }))
  }

  const removeLink = (id: string) => {
    setCvData((current) => ({
      ...current,
      links: current.links.filter((entry) => entry.id !== id),
    }))
  }

  const acceptFile = (file: File) => {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")

    if (!isPdf) {
      setWarnings(["Upload a PDF CV to extract source text."])
      return
    }

    setUploadedFile(file)
    setSourceFile({
      name: file.name,
      type: "PDF",
      size: formatFileSize(file.size),
    })
    setParseStatus("uploaded")
    setParseProgress(0)
    setAnalysis(null)
    setParseQuality(emptyQuality)
    setApiError("")
    setWarnings([])
    setRawExtractedText("")
    setRawSourceText("")
    setGeneratedDocuments([])
    setDocumentStatus("New source uploaded. Extract text before generating a tailored draft.")
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (file) {
      acceptFile(file)
    }
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]

    if (file) {
      acceptFile(file)
    }
  }

  const parseCV = async () => {
    if (!sourceFile || !uploadedFile) {
      fileInputRef.current?.click()
      return
    }

    setActiveAction("parse")
    setParseStatus("parsing")
    setParseProgress(32)
    setApiError("")
    setGeneratedDocuments([])
    setDocumentStatus("Extracting source text from your CV")

    const progressTimer = window.setTimeout(() => setParseProgress(68), 420)
    try {
      const formData = new FormData()
      formData.append("file", uploadedFile)

      const data = await requestJson<ParseCVResponse>("/api/parse-cv", {
        method: "POST",
        body: formData,
      })

      window.clearTimeout(progressTimer)
      setParseProgress(100)
      setParseStatus("parsed")
      setWarnings(data.extractedText ? [] : ["This PDF may contain embedded fonts or layout patterns that reduce extraction quality"])
      setAnalysis(null)
      setParseQuality(emptyQuality)
      setRawExtractedText(data.extractedText || data.extractedTextPreview)
      setRawSourceText(data.rawExtractedText || "")
      setSourceFile((current) =>
        current
          ? {
              ...current,
              name: data.sourceName,
              type: data.sourceType,
            }
          : current,
      )
      setDocumentStatus("Source CV text extracted for AI tailoring")
      setAiReview([
        data.extractedTextPreview
          ? "Readable source text was extracted and will be used as source material."
          : "The PDF returned limited extractable text. Review the source text before generating.",
        "AI will tailor the document for the target role without turning the upload into editable fields.",
        "Review the generated result before applying.",
      ].slice(0, 3))
    } catch (error) {
      window.clearTimeout(progressTimer)
      setParseStatus("uploaded")
      setParseProgress(0)
      setApiError(error instanceof Error ? error.message : "Could not extract source text")
      setDocumentStatus("Source text extraction failed. Review the PDF and try again.")
    } finally {
      setActiveAction(null)
    }
  }

  const improveWithAI = async (scope: string) => {
    if (studioMode === "upload") {
      setApiError("AI improvement is available in manual mode. Upload mode generates directly from the extracted source CV text.")
      return
    }

    setActiveAction(`improve-${scope}`)
    setApiError("")
    setDocumentStatus(`Reviewing ${scope.toLowerCase()} with AI`)

    try {
      const data = await requestJson<ImproveSectionResponse>("/api/improve-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section_name: scope,
          cvData,
          job_description: jobDescription,
          instructions,
        }),
      })

      if (scope === "Professional Summary" && data.improvedText) {
        setCvData((current) => ({ ...current, summary: data.improvedText || current.summary }))
      }

      setActiveAction(null)
      setDocumentStatus("AI suggestions ready for review")
      setAiReview([
        ...data.suggestions,
        ...data.warnings.map((warning) => `Review note: ${warning}`),
      ].slice(0, 5))
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "AI improvement failed")
      setDocumentStatus("AI review failed. Backend is reachable in the browser console details.")
    } finally {
      setActiveAction(null)
    }
  }

  const generateCV = async () => {
    if (studioMode === "upload" && !rawExtractedText.trim()) {
      setApiError("Upload a PDF and extract source text before generating a tailored CV.")
      setDocumentStatus("Source text is required for upload-and-tailor generation.")
      return
    }

    if (!jobDescription.trim()) {
      setApiError("Paste a target job description before generating a tailored CV.")
      return
    }

    setActiveAction("generate-cv")
    setApiError("")
    setDocumentStatus("Tailoring CV with source-grounded AI")

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-cv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildGenerationPayload()),
      })
      const latex = await readStreamText(response)
      const nextAnalysis =
        studioMode === "manual"
          ? await requestJson<Analysis>("/api/analyze-cv", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                cvData,
                job_description: jobDescription,
                quality: parseQuality,
              }),
            })
          : null
      setGeneratedDocuments((current) => [
        { type: "CV", latex, generatedAt: new Date().toLocaleTimeString(), pdfStatus: "compiling" },
        ...current.filter((document) => document.type !== "CV"),
      ])
      let pdfBase64: string | null = null
      let pdfStatus: GeneratedDocument["pdfStatus"] = "unavailable"
      let pdfError = "PDF export requires the backend LaTeX compiler to be available."
      try {
        pdfBase64 = await compilePdf(latex, "cv")
        pdfStatus = pdfBase64 ? "ready" : "unavailable"
      } catch (error) {
        pdfError = error instanceof Error ? error.message : pdfError
      }
      setAnalysis(nextAnalysis)
      setGeneratedDocuments((current) => [
        {
          type: "CV",
          latex,
          generatedAt: new Date().toLocaleTimeString(),
          pdfBase64,
          pdfStatus,
          pdfError: pdfStatus === "ready" ? undefined : pdfError,
        },
        ...current.filter((document) => document.type !== "CV"),
      ])
      setDocumentStatus("Tailored CV draft ready for review")
      setAiReview([
        studioMode === "upload"
          ? "Backend generated a CV draft from the uploaded source CV text."
          : "Backend generated a CV draft from the editable source profile.",
        "No unsupported experience was introduced.",
        nextAnalysis?.missingSkills.length
          ? `Remaining suggested gaps: ${nextAnalysis.missingSkills.slice(0, 3).join(", ")}.`
          : studioMode === "upload"
            ? "Generated from uploaded source CV text. Review before applying."
            : "No obvious missing skill signals were returned.",
      ])
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "CV generation failed")
      setDocumentStatus("CV generation failed. Check the backend service and try again.")
    } finally {
      setActiveAction(null)
    }
  }

  const generateCoverLetter = async () => {
    if (studioMode === "upload" && !rawExtractedText.trim()) {
      setApiError("Upload a PDF and extract source text before generating a tailored cover letter.")
      setDocumentStatus("Source text is required for upload-and-tailor generation.")
      return
    }

    if (!jobDescription.trim()) {
      setApiError("Paste a target job description before generating a tailored cover letter.")
      return
    }

    setActiveAction("generate-letter")
    setApiError("")
    setDocumentStatus("Drafting cover letter from approved CV facts")

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-cover-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildGenerationPayload()),
      })
      const latex = await readStreamText(response)
      setGeneratedDocuments((current) => [
        { type: "Cover Letter", latex, generatedAt: new Date().toLocaleTimeString(), pdfStatus: "compiling" },
        ...current.filter((document) => document.type !== "Cover Letter"),
      ])
      let pdfBase64: string | null = null
      let pdfStatus: GeneratedDocument["pdfStatus"] = "unavailable"
      let pdfError = "PDF export requires the backend LaTeX compiler to be available."
      try {
        pdfBase64 = await compilePdf(latex, "cover_letter")
        pdfStatus = pdfBase64 ? "ready" : "unavailable"
      } catch (error) {
        pdfError = error instanceof Error ? error.message : pdfError
      }
      setGeneratedDocuments((current) => [
        {
          type: "Cover Letter",
          latex,
          generatedAt: new Date().toLocaleTimeString(),
          pdfBase64,
          pdfStatus,
          pdfError: pdfStatus === "ready" ? undefined : pdfError,
        },
        ...current.filter((document) => document.type !== "Cover Letter"),
      ])
      setDocumentStatus("Cover letter draft ready for review")
      setAiReview([
        studioMode === "upload"
          ? "Backend generated a cover letter from the uploaded source CV text."
          : "Backend generated a cover letter from the approved CV facts.",
        "The draft should be reviewed for company-specific language before sending.",
        "No new roles, dates, or education were needed to create the draft.",
      ])
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Cover letter generation failed")
      setDocumentStatus("Cover letter generation failed. Check the backend service and try again.")
    } finally {
      setActiveAction(null)
    }
  }

  const compileGeneratedDocument = async (document: GeneratedDocument) => {
    setGeneratedDocuments((current) =>
      current.map((item) =>
        item.type === document.type
          ? { ...item, pdfStatus: "compiling", pdfError: undefined }
          : item,
      ),
    )

    try {
      const pdfBase64 = await compilePdf(document.latex, document.type === "CV" ? "cv" : "cover_letter")
      setGeneratedDocuments((current) =>
        current.map((item) =>
          item.type === document.type
            ? {
                ...item,
                pdfBase64,
                pdfStatus: pdfBase64 ? "ready" : "unavailable",
                pdfError: pdfBase64 ? undefined : "PDF export could not produce a file. Review generated content and retry.",
              }
            : item,
        ),
      )
    } catch (error) {
      setGeneratedDocuments((current) =>
        current.map((item) =>
          item.type === document.type
            ? {
                ...item,
                pdfStatus: "unavailable",
                pdfError: error instanceof Error ? error.message : "PDF export failed. Retry after reviewing the generated content.",
              }
            : item,
        ),
      )
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <PageContainer className="py-5 md:py-7">
        <div className="mb-5 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
          <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-6">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge className="rounded-md border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                  AI workspace
                </Badge>
                <Badge variant="outline" className="rounded-md border-amber-200 bg-amber-50 text-amber-700">
                  Source-grounded
                </Badge>
                <Badge variant="outline" className="rounded-md border-zinc-200 bg-zinc-50 text-zinc-700">
                  ATS aware
                </Badge>
              </div>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <h1 className="text-3xl font-semibold text-zinc-950 md:text-4xl">CV Studio</h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 md:text-base">
                    Build a CV manually or upload an existing PDF as source material for tailored AI generation.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {studioMode === "manual" && (
                    <Button
                      variant="outline"
                      className="rounded-md border-zinc-300 bg-white"
                      onClick={() => improveWithAI("Workspace")}
                      disabled={Boolean(activeAction)}
                    >
                      {activeAction === "improve-Workspace" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      Improve with AI
                    </Button>
                  )}
                  <Button
                    className="rounded-md bg-zinc-950 text-white hover:bg-zinc-800"
                    onClick={generateCV}
                    disabled={Boolean(activeAction) || !canGenerateFromCurrentMode}
                  >
                    {activeAction === "generate-cv" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Generate CV
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-md border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    onClick={() => downloadPdf(latestCvDocument)}
                    disabled={!latestCvDocument?.pdfBase64}
                    title={
                      latestCvDocument?.pdfStatus === "unavailable"
                        ? latestCvDocument.pdfError || "Generate and compile a CV before downloading PDF."
                        : !latestCvDocument?.pdfBase64
                          ? "Generate a CV before downloading PDF."
                          : "Download generated CV PDF"
                    }
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/placeholder-user.jpg"
                  alt="Candidate profile"
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-md object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-950">
                    {studioMode === "upload" ? sourceFile?.name || "Upload source CV" : cvData.personal.fullName}
                  </p>
                  <p className="truncate text-xs text-zinc-500">{documentStatus}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <ReadinessTile
                  label={studioMode === "upload" ? "Source text" : "Manual CV"}
                  value={studioMode === "upload" ? (hasUploadedSource ? "Ready" : "Needed") : `${sourceCompleteness}%`}
                  tone={studioMode === "upload" && !hasUploadedSource ? "amber" : "emerald"}
                />
                <ReadinessTile label="Job input" value={jobCompleteness ? `${jobCompleteness}%` : "Needed"} tone="amber" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_390px]">
          <aside className="space-y-5">
            <ModeSwitchCard mode={studioMode} onChange={handleModeChange} />

            {studioMode === "upload" && (
              <>
                <SourceUploadCard
                  fileInputRef={fileInputRef}
                  sourceFile={sourceFile}
                  parseStatus={parseStatus}
                  parseProgress={parseProgress}
                  activeAction={activeAction}
                  onFileChange={handleFileChange}
                  onDrop={handleDrop}
                  onParse={parseCV}
                  onRemove={() => {
                    setUploadedFile(null)
                    setSourceFile(null)
                    setParseStatus("idle")
                    setParseProgress(0)
                    setWarnings([])
                    setAnalysis(null)
                    setParseQuality(emptyQuality)
                    setApiError("")
                    setRawExtractedText("")
                    setRawSourceText("")
                    setShowRawText(false)
                    setDocumentStatus("Upload a source CV to begin")
                  }}
                />

                <RawTextPanel
                  cleanedText={rawExtractedText}
                  rawText={rawSourceText}
                  isOpen={showRawText}
                  onToggle={() => setShowRawText((current) => !current)}
                />
              </>
            )}

            <StudioCard>
              <CardHeader className="px-4 pb-0 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Bot className="h-4 w-4 text-emerald-600" />
                    AI Review
                  </CardTitle>
                  <Badge variant="outline" className="rounded-md border-zinc-200 text-[11px]">
                    Visible
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4 pt-4">
                {aiReview.map((item) => (
                  <div key={item} className="flex gap-2 rounded-md border border-zinc-200 bg-white p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-xs leading-5 text-zinc-600">{item}</p>
                  </div>
                ))}
                <div className="rounded-md bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                  AI can improve wording and structure, but it should not create experience you have not added.
                </div>
              </CardContent>
            </StudioCard>

            <StudioCard>
              <CardHeader className="px-4 pb-0 pt-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-zinc-700" />
                  Trust Cues
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4 pt-4 text-xs leading-5 text-zinc-600">
                <TrustCue label={studioMode === "upload" ? "Uploaded CV used as source text" : "Editable manual sections"} />
                <TrustCue label="No fake claims" />
                <TrustCue label={studioMode === "upload" ? "Review generated result before applying" : "ATS signals are guidance"} />
                <TrustCue label="Human review before export" />
              </CardContent>
            </StudioCard>
          </aside>

          <main className="space-y-5">
            {studioMode === "manual" && parseQuality.overallStatus !== "confident" && parseStatus === "parsed" && (
              <div className="rounded-md border border-amber-300 bg-white p-4 shadow-sm">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-950">Review manual source fields</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">
                      Some uploaded CV sections were not detected confidently. Review the marked sections before using ATS scores, AI generation, or PDF export.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-950">
                        {studioMode === "upload" ? "Source text extraction notice" : "Review checks"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {warnings.map((warning) => (
                          <Badge key={warning} className="rounded-md bg-white text-amber-800 hover:bg-white">
                            {warning}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-md border-amber-300 bg-white text-amber-900"
                    onClick={() => setWarnings([])}
                  >
                    Confirm reviewed
                  </Button>
                </div>
              </div>
            )}

            {apiError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-950">Backend request failed</p>
                    <p className="mt-1 text-sm leading-6 text-red-700">{apiError}</p>
                  </div>
                </div>
              </div>
            )}
            {studioMode === "manual" ? (
              <>

            <SectionPanel
              eyebrow="Manual section"
              title="Personal Information"
              icon={UserRound}
              helper="Edit or clear any personal field before using AI."
              action={
                <ContextAIButton
                  scope="Personal Information"
                  activeAction={activeAction}
                  onClick={() => improveWithAI("Personal Information")}
                />
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <EditableInput
                  label="Full name"
                  value={cvData.personal.fullName}
                  placeholder="Your full name"
                  onChange={(value) => updatePersonal("fullName", value)}
                  onClear={() => updatePersonal("fullName", "")}
                />
                <EditableInput
                  label="Headline"
                  value={cvData.personal.headline}
                  placeholder="Role or positioning statement"
                  onChange={(value) => updatePersonal("headline", value)}
                  onClear={() => updatePersonal("headline", "")}
                />
                <EditableInput
                  label="Email"
                  value={cvData.personal.email}
                  placeholder="name@example.com"
                  onChange={(value) => updatePersonal("email", value)}
                  onClear={() => updatePersonal("email", "")}
                />
                <EditableInput
                  label="Phone"
                  value={cvData.personal.phone}
                  placeholder="+1 555 0100"
                  onChange={(value) => updatePersonal("phone", value)}
                  onClear={() => updatePersonal("phone", "")}
                />
                <EditableInput
                  label="Location"
                  value={cvData.personal.location}
                  placeholder="City, country"
                  onChange={(value) => updatePersonal("location", value)}
                  onClear={() => updatePersonal("location", "")}
                />
              </div>
            </SectionPanel>

            <SectionPanel
              eyebrow="Manual section"
              title="Professional Summary"
              icon={FileCheck2}
              helper="Keep this factual, concise, and connected to the target role."
              action={
                <ContextAIButton
                  scope="Professional Summary"
                  activeAction={activeAction}
                  onClick={() => improveWithAI("Professional Summary")}
                />
              }
            >
              <EditableTextarea
                label="Summary"
                value={cvData.summary}
                placeholder="A concise overview of your background, strengths, and target relevance."
                rows={5}
                onChange={(value) => setCvData((current) => ({ ...current, summary: value }))}
                onClear={() => setCvData((current) => ({ ...current, summary: "" }))}
              />
            </SectionPanel>

            <SectionPanel
              eyebrow="Manual section"
              title="Experience"
              icon={BriefcaseBusiness}
              helper="Add, edit, or remove roles and bullets. Keep achievements source-based."
              action={
                <div className="flex flex-wrap gap-2">
                  <ContextAIButton
                    scope="Experience"
                    activeAction={activeAction}
                    onClick={() => improveWithAI("Experience")}
                  />
                  <Button variant="outline" size="sm" className="rounded-md bg-white" onClick={addExperience}>
                    <Plus className="h-4 w-4" />
                    Add role
                  </Button>
                </div>
              }
            >
              {cvData.experience.length === 0 ? (
                <EmptySection
                  icon={BriefcaseBusiness}
                  title="No experience entries yet"
                  description="Add roles from your source CV before tailoring this section."
                  actionLabel="Add role"
                  onAction={addExperience}
                />
              ) : (
                <div className="space-y-4">
                  {cvData.experience.map((entry, entryIndex) => (
                    <EntryFrame
                      key={entry.id}
                      title={entry.role || `Experience ${entryIndex + 1}`}
                      badge={entry.company || "Company needed"}
                      onRemove={() => removeExperience(entry.id)}
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <EditableInput
                          label="Role"
                          value={entry.role}
                          placeholder="Senior Frontend Engineer"
                          onChange={(value) => updateExperience(entry.id, "role", value)}
                          onClear={() => updateExperience(entry.id, "role", "")}
                        />
                        <EditableInput
                          label="Company"
                          value={entry.company}
                          placeholder="Company"
                          onChange={(value) => updateExperience(entry.id, "company", value)}
                          onClear={() => updateExperience(entry.id, "company", "")}
                        />
                        <EditableInput
                          label="Location"
                          value={entry.location}
                          placeholder="Remote"
                          onChange={(value) => updateExperience(entry.id, "location", value)}
                          onClear={() => updateExperience(entry.id, "location", "")}
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <EditableInput
                            label="Start"
                            value={entry.startDate}
                            placeholder="Jan 2022"
                            onChange={(value) => updateExperience(entry.id, "startDate", value)}
                            onClear={() => updateExperience(entry.id, "startDate", "")}
                          />
                          <EditableInput
                            label="End"
                            value={entry.endDate}
                            placeholder="Present"
                            onChange={(value) => updateExperience(entry.id, "endDate", value)}
                            onClear={() => updateExperience(entry.id, "endDate", "")}
                          />
                        </div>
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <Label className="text-xs font-medium text-zinc-600">Achievements</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-md px-2 text-xs"
                            onClick={() => addExperienceBullet(entry.id)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add bullet
                          </Button>
                        </div>
                        {entry.bullets.length === 0 ? (
                          <MiniEmpty label="No bullets yet. Add source-based achievements." />
                        ) : (
                          entry.bullets.map((bullet, bulletIndex) => (
                            <div key={`${entry.id}-bullet-${bulletIndex}`} className="flex gap-2">
                              <Textarea
                                value={bullet}
                                onChange={(event) =>
                                  updateExperienceBullet(entry.id, bulletIndex, event.target.value)
                                }
                                placeholder="Describe a measurable achievement from this role."
                                className="min-h-[72px] rounded-md border-zinc-200 bg-white text-sm"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="mt-1 h-8 w-8 rounded-md text-zinc-400 hover:text-red-600"
                                onClick={() => removeExperienceBullet(entry.id, bulletIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </EntryFrame>
                  ))}
                </div>
              )}
            </SectionPanel>

            <SectionPanel
              eyebrow="Manual section"
              title="Education"
              icon={GraduationCap}
              helper="Confirm school names, degree details, dates, and relevant notes."
              action={
                <div className="flex flex-wrap gap-2">
                  <ContextAIButton
                    scope="Education"
                    activeAction={activeAction}
                    onClick={() => improveWithAI("Education")}
                  />
                  <Button variant="outline" size="sm" className="rounded-md bg-white" onClick={addEducation}>
                    <Plus className="h-4 w-4" />
                    Add education
                  </Button>
                </div>
              }
            >
              {cvData.education.length === 0 ? (
                <EmptySection
                  icon={GraduationCap}
                  title="No education entries yet"
                  description="Add degrees, certifications, or formal study that belongs on this CV."
                  actionLabel="Add education"
                  onAction={addEducation}
                />
              ) : (
                <div className="space-y-4">
                  {cvData.education.map((entry, entryIndex) => (
                    <EntryFrame
                      key={entry.id}
                      title={entry.school || `Education ${entryIndex + 1}`}
                      badge={entry.degree || "Degree needed"}
                      onRemove={() => removeEducation(entry.id)}
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <EditableInput
                          label="School"
                          value={entry.school}
                          placeholder="University"
                          onChange={(value) => updateEducation(entry.id, "school", value)}
                          onClear={() => updateEducation(entry.id, "school", "")}
                        />
                        <EditableInput
                          label="Degree"
                          value={entry.degree}
                          placeholder="B.S."
                          onChange={(value) => updateEducation(entry.id, "degree", value)}
                          onClear={() => updateEducation(entry.id, "degree", "")}
                        />
                        <EditableInput
                          label="Field"
                          value={entry.field}
                          placeholder="Computer Engineering"
                          onChange={(value) => updateEducation(entry.id, "field", value)}
                          onClear={() => updateEducation(entry.id, "field", "")}
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <EditableInput
                            label="Start"
                            value={entry.startDate}
                            placeholder="2013"
                            onChange={(value) => updateEducation(entry.id, "startDate", value)}
                            onClear={() => updateEducation(entry.id, "startDate", "")}
                          />
                          <EditableInput
                            label="End"
                            value={entry.endDate}
                            placeholder="2017"
                            onChange={(value) => updateEducation(entry.id, "endDate", value)}
                            onClear={() => updateEducation(entry.id, "endDate", "")}
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <EditableTextarea
                          label="Details"
                          value={entry.details}
                          placeholder="Honors, relevant coursework, thesis, or academic highlights."
                          rows={3}
                          onChange={(value) => updateEducation(entry.id, "details", value)}
                          onClear={() => updateEducation(entry.id, "details", "")}
                        />
                      </div>
                    </EntryFrame>
                  ))}
                </div>
              )}
            </SectionPanel>

            <SectionPanel
              eyebrow="Manual section"
              title="Projects"
              icon={Layers3}
              helper="Use projects to show relevant work without inventing role experience."
              action={
                <div className="flex flex-wrap gap-2">
                  <ContextAIButton scope="Projects" activeAction={activeAction} onClick={() => improveWithAI("Projects")} />
                  <Button variant="outline" size="sm" className="rounded-md bg-white" onClick={addProject}>
                    <Plus className="h-4 w-4" />
                    Add project
                  </Button>
                </div>
              }
            >
              {cvData.projects.length === 0 ? (
                <EmptySection
                  icon={Layers3}
                  title="No projects yet"
                  description="Add projects that can be supported by your actual work or portfolio."
                  actionLabel="Add project"
                  onAction={addProject}
                />
              ) : (
                <div className="space-y-4">
                  {cvData.projects.map((entry, entryIndex) => (
                    <EntryFrame
                      key={entry.id}
                      title={entry.name || `Project ${entryIndex + 1}`}
                      badge={entry.role || "Role optional"}
                      onRemove={() => removeProject(entry.id)}
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <EditableInput
                          label="Project name"
                          value={entry.name}
                          placeholder="Project name"
                          onChange={(value) => updateProject(entry.id, "name", value)}
                          onClear={() => updateProject(entry.id, "name", "")}
                        />
                        <EditableInput
                          label="Role"
                          value={entry.role}
                          placeholder="Lead, contributor, maintainer"
                          onChange={(value) => updateProject(entry.id, "role", value)}
                          onClear={() => updateProject(entry.id, "role", "")}
                        />
                      </div>
                      <div className="mt-4">
                        <EditableInput
                          label="Tech stack"
                          value={entry.techStack}
                          placeholder="React, TypeScript, Tailwind CSS"
                          onChange={(value) => updateProject(entry.id, "techStack", value)}
                          onClear={() => updateProject(entry.id, "techStack", "")}
                        />
                      </div>
                      <div className="mt-4">
                        <EditableTextarea
                          label="Description"
                          value={entry.description}
                          placeholder="What you built, why it mattered, and what changed."
                          rows={3}
                          onChange={(value) => updateProject(entry.id, "description", value)}
                          onClear={() => updateProject(entry.id, "description", "")}
                        />
                      </div>
                    </EntryFrame>
                  ))}
                </div>
              )}
            </SectionPanel>

            <SectionPanel
              eyebrow="Manual section"
              title="Skills"
              icon={SearchCheck}
              helper="Include only skills you can discuss confidently in an interview."
              action={
                <div className="flex flex-wrap gap-2">
                  <ContextAIButton scope="Skills" activeAction={activeAction} onClick={() => improveWithAI("Skills")} />
                  <Button variant="outline" size="sm" className="rounded-md bg-white" onClick={addSkill}>
                    <Plus className="h-4 w-4" />
                    Add skill
                  </Button>
                </div>
              }
            >
              {cvData.skills.length === 0 ? (
                <EmptySection
                  icon={SearchCheck}
                  title="No skills added"
                  description="Add confirmed tools, methods, and domain strengths."
                  actionLabel="Add skill"
                  onAction={addSkill}
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {cvData.skills.map((skill, index) => (
                    <div key={`${skill}-${index}`} className="flex gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-2">
                      <Input
                        value={skill}
                        onChange={(event) => updateSkill(index, event.target.value)}
                        placeholder="Skill"
                        className="h-9 rounded-md border-zinc-200 bg-white"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-md text-zinc-400 hover:text-red-600"
                        onClick={() => removeSkill(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </SectionPanel>

            <SectionPanel
              eyebrow="Manual section"
              title="Links"
              icon={Link2}
              helper="Keep portfolio, LinkedIn, GitHub, publications, or proof points visible."
              action={
                <Button variant="outline" size="sm" className="rounded-md bg-white" onClick={addLink}>
                  <Plus className="h-4 w-4" />
                  Add link
                </Button>
              }
            >
              {cvData.links.length === 0 ? (
                <EmptySection
                  icon={Link2}
                  title="No links yet"
                  description="Add links that help reviewers verify your work."
                  actionLabel="Add link"
                  onAction={addLink}
                />
              ) : (
                <div className="space-y-3">
                  {cvData.links.map((entry) => (
                    <div key={entry.id} className="grid gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 md:grid-cols-[160px_minmax(0,1fr)_auto]">
                      <Input
                        value={entry.label}
                        onChange={(event) => updateLink(entry.id, "label", event.target.value)}
                        placeholder="Portfolio"
                        className="rounded-md border-zinc-200 bg-white"
                      />
                      <Input
                        value={entry.url}
                        onChange={(event) => updateLink(entry.id, "url", event.target.value)}
                        placeholder="https://"
                        className="rounded-md border-zinc-200 bg-white"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-md text-zinc-400 hover:text-red-600"
                        onClick={() => removeLink(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </SectionPanel>

              </>
            ) : (
              <UploadTailorWorkspace
                sourceText={rawExtractedText}
                sourceFile={sourceFile}
                onUpload={() => fileInputRef.current?.click()}
                onExtract={parseCV}
                activeAction={activeAction}
              />
            )}

            <SectionPanel
              eyebrow="Tailoring input"
              title="Target Role"
              icon={Target}
              helper="Paste the actual job description so AI can align the CV without guessing."
              action={
                studioMode === "manual" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-md bg-white"
                  onClick={() => improveWithAI("Target Role")}
                  disabled={Boolean(activeAction)}
                >
                  <Sparkles className="h-4 w-4" />
                  Analyze role
                </Button>
                ) : undefined
              }
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <EditableTextarea
                  label="Target Job Description"
                  value={jobDescription}
                  placeholder="Paste the full job description, requirements, and preferred qualifications."
                  rows={10}
                  onChange={(value) => {
                    setJobDescription(value)
                    setAnalysis(value.trim() ? analysis : null)
                  }}
                  onClear={() => {
                    setJobDescription("")
                    setAnalysis(null)
                  }}
                />
                <EditableTextarea
                  label="Additional Instructions for AI"
                  value={instructions}
                  placeholder="Tell the AI what to prioritize, avoid, preserve, or emphasize."
                  rows={10}
                  onChange={setInstructions}
                  onClear={() => setInstructions("")}
                />
              </div>
              <div className="mt-4 flex flex-col gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {studioMode === "upload"
                    ? "We use your uploaded CV as source material. Review the generated result before applying."
                    : "RecruitAssistant uses your manual fields as source material and does not invent missing facts."}
                </span>
                </div>
                <span className="font-medium">{jobDescription.trim().length} role characters</span>
              </div>
            </SectionPanel>

            <div className="grid gap-3 sm:grid-cols-3">
              {studioMode === "upload" && (
                <Button className="rounded-md bg-zinc-950 text-white hover:bg-zinc-800" onClick={parseCV} disabled={Boolean(activeAction)}>
                  {activeAction === "parse" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Extract Source Text
                </Button>
              )}
              <Button className="rounded-md bg-emerald-700 text-white hover:bg-emerald-800" onClick={generateCV} disabled={Boolean(activeAction) || !canGenerateFromCurrentMode}>
                {activeAction === "generate-cv" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate CV
              </Button>
              <Button variant="outline" className="rounded-md border-zinc-300 bg-white" onClick={generateCoverLetter} disabled={Boolean(activeAction) || !canGenerateFromCurrentMode}>
                {activeAction === "generate-letter" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                Generate Cover Letter
              </Button>
            </div>
          </main>

          <aside className="space-y-5 xl:sticky xl:top-20 xl:self-start">
            {studioMode === "manual" ? (
              <ATSPanel analysis={analysis} jobDescription={jobDescription} missingSkills={analysis?.missingSkills ?? []} />
            ) : (
              <UploadTrustPanel hasSource={hasUploadedSource} />
            )}

            <GeneratedDocumentsPanel
              documents={generatedDocuments}
              onDownloadPdf={downloadPdf}
              onRetryPdf={compileGeneratedDocument}
            />

            {studioMode === "manual" && (
            <StudioCard>
              <CardHeader className="px-4 pb-0 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-zinc-700" />
                    Live CV Preview
                  </CardTitle>
                  <Badge variant="outline" className="rounded-md border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700">
                    Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-4">
                <div className="max-h-[760px] overflow-auto rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
                  <PreviewDocument
                    cvData={cvData}
                    visibleSkills={visibleSkills}
                    allPreviewLinks={allPreviewLinks}
                  />
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Button variant="outline" className="rounded-md border-zinc-300 bg-white" onClick={() => improveWithAI("Preview")}>
                    <Wand2 className="h-4 w-4" />
                    Improve with AI
                  </Button>
                  <Button className="rounded-md bg-zinc-950 text-white hover:bg-zinc-800" onClick={generateCoverLetter}>
                    <ClipboardCheck className="h-4 w-4" />
                    Cover Letter
                  </Button>
                </div>
              </CardContent>
            </StudioCard>
            )}
          </aside>
        </div>
      </PageContainer>
    </div>
  )
}

function StudioCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Card className={cn("rounded-md border-zinc-200 bg-white py-0 shadow-sm", className)}>
      {children}
    </Card>
  )
}

function ModeSwitchCard({
  mode,
  onChange,
}: {
  mode: StudioMode
  onChange: (mode: StudioMode) => void
}) {
  return (
    <StudioCard>
      <CardHeader className="px-4 pb-0 pt-4">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Layers3 className="h-4 w-4 text-zinc-700" />
          Workflow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-4 pt-4">
        <button
          type="button"
          onClick={() => onChange("manual")}
          className={cn(
            "w-full rounded-md border p-3 text-left transition",
            mode === "manual" ? "border-emerald-300 bg-emerald-50" : "border-zinc-200 bg-white hover:bg-zinc-50",
          )}
        >
          <p className="text-sm font-medium text-zinc-950">Manual mode</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">Fill and edit structured CV fields yourself.</p>
        </button>
        <button
          type="button"
          onClick={() => onChange("upload")}
          className={cn(
            "w-full rounded-md border p-3 text-left transition",
            mode === "upload" ? "border-emerald-300 bg-emerald-50" : "border-zinc-200 bg-white hover:bg-zinc-50",
          )}
        >
          <p className="text-sm font-medium text-zinc-950">Upload-and-tailor</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">Use uploaded PDF text as source material for AI.</p>
        </button>
      </CardContent>
    </StudioCard>
  )
}

function UploadTailorWorkspace({
  sourceText,
  sourceFile,
  onUpload,
  onExtract,
  activeAction,
}: {
  sourceText: string
  sourceFile: UploadedSource | null
  onUpload: () => void
  onExtract: () => void
  activeAction: ActiveAction
}) {
  return (
    <StudioCard>
      <CardHeader className="border-b border-zinc-100 px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-700">Upload-and-tailor mode</p>
              <CardTitle className="mt-1 text-lg text-zinc-950">Source CV Text</CardTitle>
              <p className="mt-1 text-sm leading-5 text-zinc-500">
                We extract text from your PDF and use it as source material. We do not claim the upload was converted perfectly into fields.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-md bg-white" onClick={onUpload}>
              <UploadCloud className="h-4 w-4" />
              Upload PDF
            </Button>
            <Button size="sm" className="rounded-md bg-zinc-950 text-white hover:bg-zinc-800" onClick={onExtract} disabled={Boolean(activeAction) || !sourceFile}>
              {activeAction === "parse" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Extract text
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-5 py-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs text-zinc-500">Source file</p>
            <p className="mt-1 truncate text-sm font-medium text-zinc-950">{sourceFile?.name || "No PDF uploaded"}</p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs text-zinc-500">Source text</p>
            <p className={cn("mt-1 text-sm font-medium", sourceText ? "text-emerald-700" : "text-amber-700")}>
              {sourceText ? `${sourceText.length.toLocaleString()} characters` : "Not extracted"}
            </p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs text-zinc-500">AI constraint</p>
            <p className="mt-1 text-sm font-medium text-zinc-950">Source-grounded</p>
          </div>
        </div>
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
          AI tailors the document for the target role using the uploaded CV text. If information is missing, it should be left out instead of fabricated.
        </div>
        {sourceText ? (
          <Textarea value={sourceText} readOnly className="min-h-56 rounded-md border-zinc-200 bg-white font-mono text-xs leading-5 text-zinc-700" />
        ) : (
          <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
            <FileText className="mx-auto h-7 w-7 text-zinc-400" />
            <p className="mt-3 text-sm font-medium text-zinc-950">Upload and extract a source CV</p>
            <p className="mx-auto mt-1 max-w-xl text-sm leading-6 text-zinc-500">
              The manual editor will not be populated from this upload. Generated documents will use the cleaned source text directly.
            </p>
          </div>
        )}
      </CardContent>
    </StudioCard>
  )
}

function UploadTrustPanel({ hasSource }: { hasSource: boolean }) {
  return (
    <StudioCard>
      <CardHeader className="px-4 pb-0 pt-4">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ShieldCheck className="h-4 w-4 text-zinc-700" />
          Upload Mode
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 pt-4 text-xs leading-5 text-zinc-600">
        <TrustCue label={hasSource ? "Source CV text extracted" : "Upload a PDF to extract source text"} />
        <TrustCue label="Source text only" />
        <TrustCue label="AI tailors from source material" />
        <TrustCue label="Review generated PDFs before applying" />
      </CardContent>
    </StudioCard>
  )
}

function SourceUploadCard({
  fileInputRef,
  sourceFile,
  parseStatus,
  parseProgress,
  activeAction,
  onFileChange,
  onDrop,
  onParse,
  onRemove,
}: {
  fileInputRef: RefObject<HTMLInputElement | null>
  sourceFile: UploadedSource | null
  parseStatus: ParseStatus
  parseProgress: number
  activeAction: ActiveAction
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onDrop: (event: DragEvent<HTMLDivElement>) => void
  onParse: () => void
  onRemove: () => void
}) {
  const statusLabel =
    parseStatus === "parsed"
      ? "Text extracted"
      : parseStatus === "parsing"
        ? "Extracting"
        : parseStatus === "uploaded"
          ? "Ready to extract"
          : "No source"

  return (
    <StudioCard>
      <CardHeader className="px-4 pb-0 pt-4">
        <CardTitle className="flex items-center gap-2 text-sm">
          <UploadCloud className="h-4 w-4 text-zinc-700" />
          Source CV Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={onFileChange}
        />
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              fileInputRef.current?.click()
            }
          }}
          onDrop={onDrop}
          onDragOver={(event) => event.preventDefault()}
          className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center transition hover:border-emerald-400 hover:bg-emerald-50"
        >
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-white text-zinc-700 shadow-sm">
            <FileText className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-zinc-950">Upload PDF</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">Drop a CV here to extract source text.</p>
        </div>

        {sourceFile ? (
          <div className="mt-3 rounded-md border border-zinc-200 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-md border-zinc-200 text-[11px]">
                    {sourceFile.type}
                  </Badge>
                  <span className="text-xs text-zinc-500">{sourceFile.size}</span>
                </div>
                <p className="mt-2 truncate text-sm font-medium text-zinc-950">{sourceFile.name}</p>
                <p className="mt-1 text-xs text-zinc-500">{statusLabel}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-zinc-400" onClick={onRemove}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {parseStatus !== "idle" && (
              <div className="mt-3 space-y-2">
                <Progress value={parseProgress} className="h-2 bg-zinc-100 [&_[data-slot=progress-indicator]]:bg-emerald-600" />
                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span>Source text extraction</span>
                  <span>{parseStatus === "parsed" ? "Ready" : `${parseProgress}%`}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 rounded-md border border-zinc-200 bg-white p-3 text-xs leading-5 text-zinc-500">
            No CV uploaded yet. Normalized source text will appear after extraction.
          </div>
        )}

        <Button
          className="mt-3 w-full rounded-md bg-zinc-950 text-white hover:bg-zinc-800"
          onClick={onParse}
          disabled={Boolean(activeAction)}
        >
          {activeAction === "parse" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
          Extract source text
        </Button>
      </CardContent>
    </StudioCard>
  )
}

function ExtractionQualityPanel({ quality }: { quality: ParseQuality }) {
  const sectionLabels: Record<string, string> = {
    personal: "Personal",
    summary: "Summary",
    experience: "Experience",
    education: "Education",
    projects: "Projects",
    skills: "Skills",
    links: "Links",
  }

  return (
    <StudioCard>
      <CardHeader className="px-4 pb-0 pt-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <SearchCheck className="h-4 w-4 text-zinc-700" />
            Extraction Quality
          </CardTitle>
          <QualityBadge quality={{ status: quality.overallStatus, score: quality.overallScore, message: quality.overallStatus === "confident" ? "Ready" : quality.overallStatus === "partial" ? "Review needed" : "Not detected" }} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 pt-4">
        <div className="space-y-2">
          <Progress
            value={quality.overallScore}
            className={cn(
              "h-2 bg-zinc-100",
              quality.overallStatus === "confident"
                ? "[&_[data-slot=progress-indicator]]:bg-emerald-600"
                : "[&_[data-slot=progress-indicator]]:bg-amber-500",
            )}
          />
          <p className="text-xs leading-5 text-zinc-500">
            {quality.overallStatus === "confident"
              ? "Manual sections look ready after review."
              : quality.overallStatus === "partial"
                ? "Limited confidence. Review marked sections before applying."
                : "Upload and parse a source CV to begin."}
          </p>
        </div>
        <div className="space-y-2">
          {Object.entries(sectionLabels).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2">
              <span className="text-xs font-medium text-zinc-700">{label}</span>
              <QualityBadge quality={quality.sections[key] ?? emptyQuality.sections[key]} compact />
            </div>
          ))}
        </div>
      </CardContent>
    </StudioCard>
  )
}

function RawTextPanel({
  cleanedText,
  rawText,
  isOpen,
  onToggle,
}: {
  cleanedText: string
  rawText: string
  isOpen: boolean
  onToggle: () => void
}) {
  const visibleText = isOpen && rawText ? rawText : cleanedText

  return (
    <StudioCard>
      <CardHeader className="px-4 pb-0 pt-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-zinc-700" />
            Normalized Source Text
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-md bg-white text-xs"
            onClick={onToggle}
            disabled={!cleanedText || !rawText}
          >
            {isOpen ? "View cleaned" : "View raw"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-4">
        {!cleanedText ? (
          <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-3 text-xs leading-5 text-zinc-500">
            Extract a PDF to inspect the normalized source text used for generation.
          </div>
        ) : (
          <>
            <p className="mb-2 text-xs leading-5 text-zinc-500">
              {isOpen ? "Diagnostic raw extraction from the PDF." : "Cleaned source text used for grounded generation."}
            </p>
            <Textarea
              value={visibleText}
              readOnly
              className="max-h-80 min-h-56 rounded-md border-zinc-200 bg-zinc-50 font-mono text-xs leading-5 text-zinc-700"
            />
          </>
        )}
      </CardContent>
    </StudioCard>
  )
}

function QualityBadge({ quality, compact = false }: { quality: SectionQuality; compact?: boolean }) {
  const styles = {
    confident: "border-emerald-200 bg-emerald-50 text-emerald-700",
    partial: "border-amber-200 bg-amber-50 text-amber-800",
    missing: "border-zinc-200 bg-zinc-50 text-zinc-500",
  }

  const label = quality.status === "confident" ? "Ready" : quality.status === "partial" ? "Review needed" : "Not detected"

  return (
    <Badge variant="outline" className={cn("rounded-md text-[11px]", styles[quality.status])}>
      {compact ? `${quality.score}%` : `${label} · ${quality.score}%`}
    </Badge>
  )
}

function SectionPanel({
  eyebrow,
  title,
  helper,
  icon: Icon,
  quality,
  action,
  children,
}: {
  eyebrow: string
  title: string
  helper: string
  icon: LucideIcon
  quality?: SectionQuality
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <StudioCard>
      <CardHeader className="border-b border-zinc-100 px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-medium text-emerald-700">{eyebrow}</p>
                {quality && <QualityBadge quality={quality} />}
              </div>
              <CardTitle className="mt-1 text-lg text-zinc-950">{title}</CardTitle>
              <p className="mt-1 text-sm leading-5 text-zinc-500">{helper}</p>
            </div>
          </div>
          {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
        </div>
      </CardHeader>
      <CardContent className="px-5 py-5">{children}</CardContent>
    </StudioCard>
  )
}

function ContextAIButton({
  scope,
  activeAction,
  onClick,
}: {
  scope: string
  activeAction: ActiveAction
  onClick: () => void
}) {
  const isActive = activeAction === `improve-${scope}`

  return (
    <Button variant="outline" size="sm" className="rounded-md bg-white" onClick={onClick} disabled={Boolean(activeAction)}>
      {isActive ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      Improve with AI
    </Button>
  )
}

function EditableInput({
  label,
  value,
  placeholder,
  onChange,
  onClear,
}: {
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
  onClear: () => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium text-zinc-600">{label}</Label>
        {value && (
          <button type="button" className="text-xs text-zinc-400 hover:text-red-600" onClick={onClear}>
            Remove
          </button>
        )}
      </div>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border-zinc-200 bg-white"
      />
    </div>
  )
}

function EditableTextarea({
  label,
  value,
  placeholder,
  rows,
  onChange,
  onClear,
}: {
  label: string
  value: string
  placeholder: string
  rows: number
  onChange: (value: string) => void
  onClear: () => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium text-zinc-600">{label}</Label>
        {value && (
          <button type="button" className="text-xs text-zinc-400 hover:text-red-600" onClick={onClear}>
            Remove
          </button>
        )}
      </div>
      <Textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-0 rounded-md border-zinc-200 bg-white text-sm leading-6"
      />
    </div>
  )
}

function EntryFrame({
  title,
  badge,
  onRemove,
  children,
}: {
  title: string
  badge: string
  onRemove: () => void
  children: ReactNode
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-950">{title}</p>
          <p className="mt-1 text-xs text-zinc-500">{badge}</p>
        </div>
        <Button variant="ghost" size="sm" className="rounded-md text-zinc-500 hover:text-red-600" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
          Remove
        </Button>
      </div>
      {children}
    </div>
  )
}

function EmptySection({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-white text-zinc-600 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-medium text-zinc-950">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-zinc-500">{description}</p>
      <Button className="mt-4 rounded-md bg-zinc-950 text-white hover:bg-zinc-800" onClick={onAction}>
        <Plus className="h-4 w-4" />
        {actionLabel}
      </Button>
    </div>
  )
}

function MiniEmpty({ label }: { label: string }) {
  return <div className="rounded-md border border-dashed border-zinc-300 bg-white p-3 text-sm text-zinc-500">{label}</div>
}

function ATSPanel({
  analysis,
  jobDescription,
  missingSkills,
}: {
  analysis: Analysis | null
  jobDescription: string
  missingSkills: string[]
}) {
  return (
    <StudioCard>
      <CardHeader className="px-4 pb-0 pt-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Gauge className="h-4 w-4 text-zinc-700" />
            ATS Analysis
          </CardTitle>
          <Badge
            variant="outline"
            className={cn(
              "rounded-md text-[11px]",
              analysis?.limitedConfidence
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-zinc-200 text-zinc-600",
            )}
          >
            {analysis?.limitedConfidence ? "Limited confidence" : "Guidance"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4 pt-4">
        {!jobDescription.trim() ? (
          <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center">
            <Target className="mx-auto h-6 w-6 text-zinc-400" />
            <p className="mt-2 text-sm font-medium text-zinc-950">Add a target role</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              ATS score and role match will appear after a job description is available.
            </p>
          </div>
        ) : analysis ? (
          <>
            {analysis.limitedConfidence && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                {analysis.confidenceLabel || "Limited source confidence"}. Review low-confidence sections before applying.
              </div>
            )}
            <MetricBlock
              label="ATS Score"
              value={analysis.atsScore}
              description={analysis.limitedConfidence ? "Capped because source extraction is partial" : "Estimated parsing and keyword readiness"}
              colorClass={analysis.limitedConfidence ? "bg-amber-500" : "bg-emerald-600"}
            />
            <MetricBlock
              label="Role Match"
              value={analysis.roleMatch}
              description={analysis.limitedConfidence ? "Limited source confidence" : "Alignment with the pasted role requirements"}
              colorClass="bg-amber-500"
            />
            <Separator />
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-medium text-zinc-950">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Missing Skills
                </p>
                <span className="text-xs text-zinc-500">{missingSkills.length} found</span>
              </div>
              {missingSkills.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {missingSkills.map((skill) => (
                    <Badge key={skill} variant="outline" className="rounded-md border-amber-200 bg-amber-50 text-amber-800">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">
                  No obvious missing skill signals. Still review the source CV before applying.
                </div>
              )}
              <p className="mt-3 text-xs leading-5 text-zinc-500">
                Add a missing skill only if it reflects real experience you can explain.
              </p>
            </div>
          </>
        ) : (
          <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center">
            <SearchCheck className="mx-auto h-6 w-6 text-zinc-400" />
            <p className="mt-2 text-sm font-medium text-zinc-950">Analysis pending</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Parse the CV or run AI improvement to estimate ATS and role match.
            </p>
          </div>
        )}
      </CardContent>
    </StudioCard>
  )
}

function GeneratedDocumentsPanel({
  documents,
  onDownloadPdf,
  onRetryPdf,
}: {
  documents: GeneratedDocument[]
  onDownloadPdf: (document: GeneratedDocument) => void
  onRetryPdf: (document: GeneratedDocument) => void
}) {
  return (
    <StudioCard>
      <CardHeader className="px-4 pb-0 pt-4">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileCheck2 className="h-4 w-4 text-zinc-700" />
          Generated Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 pt-4">
        {documents.length === 0 ? (
          <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center">
            <FileText className="mx-auto h-6 w-6 text-zinc-400" />
            <p className="mt-2 text-sm font-medium text-zinc-950">No generated draft yet</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Generated CV and cover letter LaTeX will appear here after backend generation.
            </p>
          </div>
        ) : (
          documents.map((document) => (
            <div key={document.type} className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-950">{document.type}</p>
                  <p className="mt-1 text-xs text-zinc-500">Generated at {document.generatedAt}</p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-md text-[11px]",
                    document.pdfStatus === "ready"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : document.pdfStatus === "compiling"
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-zinc-200 bg-zinc-50 text-zinc-500",
                  )}
                >
                  {document.pdfStatus === "ready" ? "PDF ready" : document.pdfStatus === "compiling" ? "Compiling" : "PDF unavailable"}
                </Badge>
              </div>
              {document.pdfStatus === "unavailable" && (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                  {document.pdfError || "PDF export is unavailable because the backend compiler is not configured."}
                </div>
              )}
              <pre className="mt-3 max-h-28 overflow-auto rounded-md bg-white p-3 text-[11px] leading-5 text-zinc-600">
                {document.latex.slice(0, 900)}
              </pre>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-md bg-white"
                  onClick={() => navigator.clipboard.writeText(document.latex)}
                >
                  Copy
                </Button>
                {document.pdfBase64 ? (
                  <Button
                    size="sm"
                    className="rounded-md bg-zinc-950 text-white hover:bg-zinc-800"
                    onClick={() => onDownloadPdf(document)}
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="rounded-md bg-zinc-950 text-white hover:bg-zinc-800"
                    onClick={() => onRetryPdf(document)}
                    disabled={document.pdfStatus === "compiling"}
                  >
                    {document.pdfStatus === "compiling" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Retry PDF
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </StudioCard>
  )
}

function MetricBlock({
  label,
  value,
  description,
  colorClass,
}: {
  label: string
  value: number
  description: string
  colorClass: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-950">{label}</p>
          <p className="mt-1 text-xs text-zinc-500">{description}</p>
        </div>
        <p className="text-2xl font-semibold text-zinc-950">{value}%</p>
      </div>
      <div className="h-2 overflow-hidden rounded-md bg-zinc-100">
        <div className={cn("h-full rounded-md transition-all", colorClass)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function PreviewDocument({
  cvData,
  visibleSkills,
  allPreviewLinks,
}: {
  cvData: CVData
  visibleSkills: string[]
  allPreviewLinks: LinkEntry[]
}) {
  return (
    <article className="mx-auto min-h-[680px] max-w-[720px] bg-white text-zinc-950">
      <header className="border-b border-zinc-200 pb-4">
        <h2 className="text-2xl font-semibold">{cvData.personal.fullName || "Your Name"}</h2>
        <p className="mt-1 text-sm text-zinc-600">{cvData.personal.headline || "Target headline"}</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500">
          {cvData.personal.email && (
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {cvData.personal.email}
            </span>
          )}
          {cvData.personal.phone && (
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              {cvData.personal.phone}
            </span>
          )}
          {cvData.personal.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {cvData.personal.location}
            </span>
          )}
        </div>
        {allPreviewLinks.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-emerald-700">
            {allPreviewLinks.map((link) => (
              <span key={link.id}>{link.label || link.url}</span>
            ))}
          </div>
        )}
      </header>

      <PreviewSection title="Professional Summary">
        <p className="text-sm leading-6 text-zinc-700">
          {cvData.summary || "Your professional summary will appear here as you edit."}
        </p>
      </PreviewSection>

      <PreviewSection title="Experience">
        {cvData.experience.length > 0 ? (
          <div className="space-y-4">
            {cvData.experience.map((entry) => (
              <div key={entry.id}>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">{entry.role || "Role"}</p>
                    <p className="text-sm text-zinc-600">{entry.company || "Company"}</p>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <CalendarRange className="h-3.5 w-3.5" />
                    {[entry.startDate, entry.endDate].filter(Boolean).join(" - ") || "Dates"}
                  </p>
                </div>
                {entry.bullets.filter(Boolean).length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-700">
                    {entry.bullets.filter(Boolean).map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Experience entries will appear here.</p>
        )}
      </PreviewSection>

      <PreviewSection title="Projects">
        {cvData.projects.length > 0 ? (
          <div className="space-y-3">
            {cvData.projects.map((project) => (
              <div key={project.id}>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <p className="text-sm font-semibold">{project.name || "Project"}</p>
                  <p className="text-xs text-zinc-500">{project.role}</p>
                </div>
                <p className="mt-1 text-xs text-emerald-700">{project.techStack}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-700">{project.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Projects will appear here.</p>
        )}
      </PreviewSection>

      <PreviewSection title="Education">
        {cvData.education.length > 0 ? (
          <div className="space-y-3">
            {cvData.education.map((entry) => (
              <div key={entry.id} className="text-sm leading-6 text-zinc-700">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <p className="font-semibold text-zinc-950">{entry.school || "School"}</p>
                  <p className="text-xs text-zinc-500">
                    {[entry.startDate, entry.endDate].filter(Boolean).join(" - ")}
                  </p>
                </div>
                <p>
                  {[entry.degree, entry.field].filter(Boolean).join(", ") || "Degree"}
                </p>
                {entry.details && <p className="mt-1 text-zinc-600">{entry.details}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Education entries will appear here.</p>
        )}
      </PreviewSection>

      <PreviewSection title="Skills">
        {visibleSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {visibleSkills.map((skill) => (
              <span key={skill} className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700">
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Skills will appear here.</p>
        )}
      </PreviewSection>
    </article>
  )
}

function PreviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 border-b border-zinc-100 pb-1 text-xs font-semibold uppercase text-zinc-500">{title}</h3>
      {children}
    </section>
  )
}

function ReadinessTile({ label, value, tone }: { label: string; value: string; tone: "emerald" | "amber" }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={cn("mt-1 text-lg font-semibold", tone === "emerald" ? "text-emerald-700" : "text-amber-700")}>
        {value}
      </p>
    </div>
  )
}

function TrustCue({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
      <span>{label}</span>
    </div>
  )
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
