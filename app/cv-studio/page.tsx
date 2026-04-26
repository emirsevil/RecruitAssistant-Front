"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  Download,
  FileText,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useWorkspace } from "@/lib/workspace-context"

import Editor from "@monaco-editor/react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function CVStudioPage() {
  const { t } = useLanguage()
  const { activeWorkspace } = useWorkspace()
  const [language, setLanguage] = useState("en")
  const [cvData, setCvData] = useState({
    name: "Deniz Ozturk",
    email: "deniz.ozturk@example.com",
    phone: "+90 555 123 45 67",
    location: "Istanbul, Turkey",
    linkedin: "",
    github: "",
    summary:
      "Senior Full Stack Developer with 5+ years of experience in building scalable web applications. Passionate about clean code, performance optimization, and AI integration. Proven track record of leading teams and delivering high-impact projects.",
    education: [
      {
        degree: "B.S. Computer Engineering",
        school: "Technical University of Istanbul",
        gpa: "3.8/4.0",
        startDate: "2015",
        endDate: "2019",
      },
    ],
    experience: [
      {
        role: "Senior Frontend Developer",
        company: "TechFlow Solutions",
        bullets: [
          "Led migration of legacy codebase to Next.js 14, improving performance by 40%.",
          "Implemented CI/CD pipelines reducing deployment time by 15 minutes.",
          "Mentored 3 junior developers and established code review standards.",
        ],
        startDate: "Jan 2022",
        endDate: "Present",
      },
      {
        role: "Software Engineer",
        company: "DataCorp",
        bullets: [
          "Developed RESTful APIs serving 1M+ daily requests using Node.js.",
          "Collaborated with UX team to redesign the customer portal, increasing conversion by 20%.",
          "Optimized database queries, reducing response times by 30%.",
        ],
        startDate: "Jun 2019",
        endDate: "Dec 2021",
      },
    ],
    projects: [
      {
        title: "AI Resume Builder",
        techStack: "React, OpenAI API, Node.js",
        date: "2024",
        description:
          "Built an AI-powered resume generator helping 500+ users optimize their CVs with ATS-friendly formats.",
      },
      {
        title: "Crypto Portfolio Tracker",
        techStack: "Vue.js, Firebase, CoinGecko API",
        date: "2023",
        description:
          "Real-time cryptocurrency tracking application with price alerts and portfolio analysis tools.",
      },
    ],
    skills: [
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "PostgreSQL",
      "AWS",
      "Docker",
      "Tailwind CSS",
      "GraphQL",
    ],
    targetJob: "",
    specialInstructions: "",
  })

  const [isParsing, setIsParsing] = useState(false)

  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false)
  const [generatedLatex, setGeneratedLatex] = useState("")
  const [generatedPdfBase64, setGeneratedPdfBase64] = useState<string | null>(null)

  const [generatedCoverLetterLatex, setGeneratedCoverLetterLatex] = useState("")
  const [generatedCoverLetterPdfBase64, setGeneratedCoverLetterPdfBase64] = useState<
    string | null
  >(null)

  const [generationError, setGenerationError] = useState("")
  const [isGenerated, setIsGenerated] = useState(false)
  const [isCoverLetterGenerated, setIsCoverLetterGenerated] = useState(false)
  const [isCompiling, setIsCompiling] = useState(false)

  const addExperience = () => {
    setCvData({
      ...cvData,
      experience: [
        ...cvData.experience,
        { role: "", company: "", bullets: [""], startDate: "", endDate: "" },
      ],
    })
  }
  const removeExperience = (i: number) =>
    setCvData({ ...cvData, experience: cvData.experience.filter((_, idx) => idx !== i) })

  const addProject = () =>
    setCvData({
      ...cvData,
      projects: [
        ...cvData.projects,
        { title: "", techStack: "", date: "", description: "" },
      ],
    })
  const removeProject = (i: number) =>
    setCvData({ ...cvData, projects: cvData.projects.filter((_, idx) => idx !== i) })

  const addSkill = () => {
    const skill = prompt("Enter a new skill:")
    if (skill && skill.trim()) {
      setCvData({ ...cvData, skills: [...cvData.skills, skill.trim()] })
    }
  }
  const removeSkill = (i: number) =>
    setCvData({ ...cvData, skills: cvData.skills.filter((_, idx) => idx !== i) })

  const addBullet = (expIndex: number) => {
    const next = [...cvData.experience]
    next[expIndex].bullets.push("")
    setCvData({ ...cvData, experience: next })
  }
  const removeBullet = (expIndex: number, bIndex: number) => {
    const next = [...cvData.experience]
    next[expIndex].bullets = next[expIndex].bullets.filter((_, idx) => idx !== bIndex)
    setCvData({ ...cvData, experience: next })
  }
  const updateExperienceBullet = (expIndex: number, bIndex: number, value: string) => {
    const next = [...cvData.experience]
    next[expIndex].bullets[bIndex] = value
    setCvData({ ...cvData, experience: next })
  }
  const updateExperience = (i: number, field: string, value: string) => {
    const next = [...cvData.experience]
    ;(next[i] as any)[field] = value
    setCvData({ ...cvData, experience: next })
  }
  const updateProject = (i: number, field: string, value: string) => {
    const next = [...cvData.projects]
    ;(next[i] as any)[field] = value
    setCvData({ ...cvData, projects: next })
  }
  const updateEducation = (i: number, field: string, value: string) => {
    const next = [...cvData.education]
    ;(next[i] as any)[field] = value
    setCvData({ ...cvData, education: next })
  }

  const formatCandidateProfile = () => ({
    full_name: cvData.name,
    email: cvData.email,
    phone: cvData.phone || null,
    linkedin: cvData.linkedin || null,
    github: cvData.github || null,
    location: cvData.location || null,
    summary: cvData.summary || null,
    skills: cvData.skills,
    experience: cvData.experience.map((e) => ({
      company: e.company,
      title: e.role,
      start_date: e.startDate,
      end_date: e.endDate || null,
      bullets: e.bullets,
    })),
    education: cvData.education.map((e) => ({
      institution: e.school,
      degree: e.degree,
      start_date: e.startDate || null,
      end_date: e.endDate || null,
      gpa: e.gpa || null,
      highlights: [],
    })),
    projects: cvData.projects.map((p) => ({
      name: p.title,
      description: p.description,
      date: p.date || null,
      technologies: p.techStack
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    })),
    certifications: [],
  })

  const buildTargetJobContext = () => {
    const manual = cvData.targetJob.trim()
    const ws = activeWorkspace?.jobDescription?.trim()
    const jd = manual || ws || ""
    const parts: string[] = []
    if (activeWorkspace?.name?.trim()) parts.push(`Company: ${activeWorkspace.name.trim()}`)
    if (activeWorkspace?.jobName?.trim()) parts.push(`Role: ${activeWorkspace.jobName.trim()}`)
    if (jd) parts.push(`Job Description:\n${jd}`)
    return parts.join("\n\n")
  }

  const normalizeResumeSectionDividers = (latex: string) =>
    latex.replace(
      /(\\section\*\{[^{}]+\})\s*(?:\\vspace\{[^{}]+\}\s*)?\\hrule\s*(?:\\vspace\{[^{}]+\}\s*)?/g,
      "$1\\vspace{-0.65em}\n\\hrule\n\\vspace{0.45em}\n"
    )

  const compileLatexLocally = async (latex: string, isCoverLetter: boolean) => {
    setIsCompiling(true)
    try {
      const workspaceId = activeWorkspace ? parseInt(activeWorkspace.id) : null
      const documentType = isCoverLetter ? "cover_letter" : "cv"
      const response = await fetch(`${API_BASE}/api/compile-latex`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latex_content: latex,
          workspace_id: workspaceId,
          document_type: documentType,
        }),
        credentials: "include",
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Compilation failed on backend")
      if (isCoverLetter) setGeneratedCoverLetterPdfBase64(data.pdf_base64)
      else setGeneratedPdfBase64(data.pdf_base64)
    } catch (e: any) {
      console.error("Compile Error:", e.message)
      if (isCoverLetter) setGeneratedCoverLetterPdfBase64(null)
      else setGeneratedPdfBase64(null)
    } finally {
      setIsCompiling(false)
    }
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsParsing(true)
    setGenerationError("")
    const fd = new FormData()
    fd.append("file", file)
    try {
      const res = await fetch("/api/parse-resume", {
        method: "POST",
        body: fd,
        credentials: "include",
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to parse resume")
      }
      const parsed = await res.json()
      setCvData((prev) => ({
        ...prev,
        name: parsed.name || prev.name,
        email: parsed.email || prev.email,
        phone: parsed.phone || prev.phone,
        location: parsed.location || prev.location,
        linkedin: parsed.linkedin || prev.linkedin,
        github: parsed.github || prev.github,
        summary: parsed.summary || prev.summary,
        education: parsed.education?.length ? parsed.education : prev.education,
        experience: parsed.experience?.length ? parsed.experience : prev.experience,
        projects: parsed.projects?.length ? parsed.projects : prev.projects,
        skills: parsed.skills?.length ? parsed.skills : prev.skills,
      }))
    } catch (e: any) {
      setGenerationError(e.message || "An error occurred while parsing the resume")
    } finally {
      setIsParsing(false)
      e.target.value = ""
    }
  }

  const generateCV = async () => {
    setIsGenerating(true)
    setIsGenerated(true)
    setGenerationError("")
    setGeneratedPdfBase64(null)
    setGeneratedLatex("")
    try {
      const targetJobContext = buildTargetJobContext()
      const res = await fetch(`${API_BASE}/api/generate-cv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_profile: formatCandidateProfile(),
          job_description: targetJobContext,
          special_instructions: cvData.specialInstructions,
          output_language: language,
        }),
        credentials: "include",
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || t("Failed to generate CV"))
      }
      if (!res.body) throw new Error("ReadableStream not supported")
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let latex = ""
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        latex += decoder.decode(value, { stream: true })
        setGeneratedLatex(latex)
      }
      latex = normalizeResumeSectionDividers(latex)
      setGeneratedLatex(latex)
      await compileLatexLocally(latex, false)
    } catch (e: any) {
      setGenerationError(e.message || t("An error occurred while generating the CV"))
      setIsGenerated(false)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateCoverLetter = async () => {
    setIsGeneratingCoverLetter(true)
    setIsCoverLetterGenerated(true)
    setGenerationError("")
    setGeneratedCoverLetterPdfBase64(null)
    setGeneratedCoverLetterLatex("")
    try {
      const dateLocale = language === "Turkish" ? "tr-TR" : "en-US"
      const currentDate = new Date().toLocaleDateString(dateLocale, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
      const targetJobContext = buildTargetJobContext()
      const recipientInstruction =
        language === "Turkish"
          ? "Alıcı bloğunda İşe Alım Yetkilisi ifadesini ve iş ilanından çıkarılabilirse gerçek şirket adını kullan. Hiring Manager, Company Address, Address veya başka İngilizce alıcı/adres etiketi yazma. Bilinmeyen adres satırlarını tamamen atla. Yer/ülke bilgisi gerekiyorsa Türkçe kullan."
          : "In the recipient block, include Hiring Manager and the actual company name extracted from the job description when available. Do not include a Company Address line. Never output placeholder text."
      const coverLetterInstructions = [
        `Use this exact cover letter date: ${currentDate}.`,
        recipientInstruction,
        cvData.specialInstructions,
      ]
        .filter(Boolean)
        .join("\n")

      const res = await fetch(`${API_BASE}/api/generate-cover-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_profile: formatCandidateProfile(),
          job_description: targetJobContext,
          special_instructions: coverLetterInstructions,
          output_language: language,
        }),
        credentials: "include",
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || t("Failed to generate Cover Letter"))
      }
      if (!res.body) throw new Error("ReadableStream not supported")
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let latex = ""
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        latex += decoder.decode(value, { stream: true })
        setGeneratedCoverLetterLatex(latex)
      }
      await compileLatexLocally(latex, true)
    } catch (e: any) {
      setGenerationError(e.message || t("An error occurred while generating the Cover Letter"))
      setIsCoverLetterGenerated(false)
    } finally {
      setIsGeneratingCoverLetter(false)
    }
  }

  const downloadLatex = (content: string, prefix: string) => {
    if (!content) return
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${cvData.name.replace(/\s+/g, "_")}_${prefix}.tex`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadPDF = (b64: string | null, prefix: string) => {
    if (!b64) return
    try {
      const byteCharacters = atob(b64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i)
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${cvData.name.replace(/\s+/g, "_")}_${prefix}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error("Error creating PDF download blob:", e)
    }
  }

  return (
    <div className="px-7 py-7 md:px-9">
      {/* Header */}
      <div className="mb-7">
        <p className="eyebrow text-clay">{t("cvStudio")}</p>
        <h1 className="serif-headline mt-1 text-[32px] font-normal leading-tight tracking-tight">
          {t("CV Studio")}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* Input Form (col 8) */}
        <div className="space-y-5 lg:col-span-8">
          {/* Upload Resume */}
          <Section
            title={t("Upload Resume")}
            iconBg="sage"
            icon={<Upload className="h-5 w-5" />}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleResumeUpload}
                disabled={isParsing}
                className="h-11 cursor-pointer rounded-lg border border-border bg-background px-3 text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-secondary file:px-3 file:text-xs file:font-medium file:text-foreground hover:bg-secondary/40"
              />
              {isParsing && (
                <div className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("Parsing...")}
                </div>
              )}
            </div>
          </Section>

          {/* Personal Information */}
          <Section title={t("Personal Information")}>
            <div className="space-y-2">
              <Label className="text-[12px] font-semibold">{t("CV language")}</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-11 rounded-lg border-border bg-background">
                  <SelectValue placeholder={t("Select language")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t("English")}</SelectItem>
                  <SelectItem value="tr">{t("Turkish")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("Full Name")}>
                <Input
                  value={cvData.name}
                  onChange={(e) => setCvData({ ...cvData, name: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label={t("Email")}>
                <Input
                  type="email"
                  value={cvData.email}
                  onChange={(e) => setCvData({ ...cvData, email: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label={t("Phone")}>
                <Input
                  value={cvData.phone}
                  onChange={(e) => setCvData({ ...cvData, phone: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label={t("Location")}>
                <Input
                  value={cvData.location}
                  onChange={(e) => setCvData({ ...cvData, location: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label={t("LinkedIn URL")}>
                <Input
                  value={cvData.linkedin}
                  onChange={(e) => setCvData({ ...cvData, linkedin: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label={t("GitHub/Portfolio URL")}>
                <Input
                  value={cvData.github}
                  onChange={(e) => setCvData({ ...cvData, github: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label={t("Professional Summary")}>
              <Textarea
                value={cvData.summary}
                onChange={(e) => setCvData({ ...cvData, summary: e.target.value })}
                className="min-h-[120px] resize-none rounded-lg border-border bg-background px-3.5 py-2.5 text-[14px] leading-relaxed"
              />
            </Field>
          </Section>

          {/* Education */}
          <Section title={t("Education")}>
            {cvData.education.map((edu, idx) => (
              <SubCard key={idx}>
                <Field label={t("Degree")}>
                  <Input
                    value={edu.degree}
                    onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("School")}>
                    <Input
                      value={edu.school}
                      onChange={(e) => updateEducation(idx, "school", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label={t("GPA")}>
                    <Input
                      value={edu.gpa}
                      onChange={(e) => updateEducation(idx, "gpa", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label={t("Start Date")}>
                    <Input
                      value={edu.startDate}
                      onChange={(e) => updateEducation(idx, "startDate", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label={t("End Date")}>
                    <Input
                      value={edu.endDate}
                      onChange={(e) => updateEducation(idx, "endDate", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </SubCard>
            ))}
          </Section>

          {/* Experience */}
          <Section
            title={t("Experience")}
            action={
              <AddButton onClick={addExperience} label={t("Add")} />
            }
          >
            {cvData.experience.map((exp, idx) => (
              <SubCard key={idx}>
                {cvData.experience.length > 1 && (
                  <RemoveButton onClick={() => removeExperience(idx)} />
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("Role")}>
                    <Input
                      value={exp.role}
                      placeholder={t("Software Engineer")}
                      onChange={(e) => updateExperience(idx, "role", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label={t("Company")}>
                    <Input
                      value={exp.company}
                      placeholder={t("Tech Company Inc.")}
                      onChange={(e) => updateExperience(idx, "company", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label={t("Start Date")}>
                    <Input
                      value={exp.startDate}
                      placeholder={t("Jan 2023")}
                      onChange={(e) => updateExperience(idx, "startDate", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label={t("End Date")}>
                    <Input
                      value={exp.endDate}
                      placeholder={t("Present")}
                      onChange={(e) => updateExperience(idx, "endDate", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </div>
                <div className="space-y-2.5">
                  <Label className="text-[12px] font-semibold">
                    {t("Responsibilities & Achievements")}
                  </Label>
                  {exp.bullets.map((bullet, bIdx) => (
                    <div key={bIdx} className="group/bullet flex gap-2">
                      <Textarea
                        value={bullet}
                        onChange={(e) => updateExperienceBullet(idx, bIdx, e.target.value)}
                        className="min-h-[78px] flex-1 resize-none rounded-lg border-border bg-background px-3.5 py-2.5 text-[14px] leading-relaxed"
                        placeholder="• Developed features that improved..."
                      />
                      {exp.bullets.length > 1 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="mt-1 h-8 w-8 self-start rounded-md text-muted-foreground opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover/bullet:opacity-100"
                          onClick={() => removeBullet(idx, bIdx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <AddButton onClick={() => addBullet(idx)} label={t("Add bullet point")} small />
                </div>
              </SubCard>
            ))}
          </Section>

          {/* Projects */}
          <Section
            title={t("Projects")}
            action={<AddButton onClick={addProject} label={t("Add")} />}
          >
            {cvData.projects.map((project, idx) => (
              <SubCard key={idx}>
                {cvData.projects.length > 1 && (
                  <RemoveButton onClick={() => removeProject(idx)} />
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("Project Title")}>
                    <Input
                      value={project.title}
                      placeholder={t("E-commerce Platform")}
                      onChange={(e) => updateProject(idx, "title", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label={t("Project Date")}>
                    <Input
                      value={project.date}
                      placeholder="2024"
                      onChange={(e) => updateProject(idx, "date", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label={t("Tech Stack")}>
                      <Input
                        value={project.techStack}
                        placeholder="React, Node.js, MongoDB"
                        onChange={(e) => updateProject(idx, "techStack", e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </div>
                <Field label={t("Description")}>
                  <Textarea
                    value={project.description}
                    onChange={(e) => updateProject(idx, "description", e.target.value)}
                    className="min-h-[120px] resize-none rounded-lg border-border bg-background px-3.5 py-2.5 text-[14px] leading-relaxed"
                    placeholder={t("Built a full-stack application that...")}
                  />
                </Field>
              </SubCard>
            ))}
          </Section>

          {/* Skills */}
          <Section title={t("Skills")}>
            <div className="flex flex-wrap gap-2">
              {cvData.skills.map((skill, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="gap-1.5 rounded-full border-border bg-sage-soft px-3 py-1.5 text-[12px] font-medium text-sage hover:bg-sage hover:text-white"
                >
                  {skill}
                  <Trash2
                    className="ml-0.5 h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
                    onClick={() => removeSkill(idx)}
                  />
                </Badge>
              ))}
              <AddButton onClick={addSkill} label={t("Add skill")} small />
            </div>
          </Section>
        </div>

        {/* Right rail (col 4) — JD + actions */}
        <div className="space-y-5 lg:sticky lg:top-6 lg:col-span-4">
          <Section title={t("Target Job Description")}>
            <Textarea
              value={cvData.targetJob}
              onChange={(e) => setCvData({ ...cvData, targetJob: e.target.value })}
              className="min-h-[240px] resize-none rounded-lg border-border bg-background px-3.5 py-2.5 text-[13px] leading-relaxed"
              placeholder={t("Paste the full job description here...")}
            />
            <Field label={t("Special Instructions (Optional)")}>
              <Textarea
                value={cvData.specialInstructions}
                onChange={(e) =>
                  setCvData({ ...cvData, specialInstructions: e.target.value })
                }
                className="min-h-[120px] resize-none rounded-lg border-border bg-background px-3.5 py-2.5 text-[13px] leading-relaxed"
                placeholder={t(
                  "e.g., 'Make it more professional', 'Focus on my leadership skills', 'Keep it under one page'"
                )}
              />
            </Field>
          </Section>

          {generationError && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>{generationError}</p>
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            <Button
              className="gap-2 rounded-lg bg-primary px-5 py-3 text-[14px] font-semibold text-primary-foreground hover:bg-primary/90"
              onClick={generateCV}
              disabled={isGenerating || isGeneratingCoverLetter}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("Generating CV...")}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {t("Generate CV")}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="gap-2 rounded-lg border-border px-5 py-3 text-[13px] font-semibold"
              onClick={generateCoverLetter}
              disabled={isGenerating || isGeneratingCoverLetter}
            >
              {isGeneratingCoverLetter ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("Generating Letter...")}
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  {t("Generate Cover Letter")}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Generated Documents */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 font-serif text-[19px] font-medium tracking-tight">
          {t("Generated Documents")}
        </h2>
        {isGenerating || isGeneratingCoverLetter ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-secondary/30 py-16">
            <Loader2 className="h-7 w-7 animate-spin text-sage" />
          </div>
        ) : !isGenerated && !isCoverLetterGenerated ? (
          <div className="grid place-items-center rounded-xl border border-dashed border-border bg-secondary/30 py-16">
            <FileText className="h-6 w-6 text-subtle" />
          </div>
        ) : (
          <Tabs defaultValue={isGenerated ? "cv" : "cover-letter"} className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-2 rounded-lg bg-secondary p-1">
              <TabsTrigger value="cv" disabled={!isGenerated}>
                {t("CV")}
              </TabsTrigger>
              <TabsTrigger value="cover-letter" disabled={!isCoverLetterGenerated}>
                {t("Cover Letter")}
              </TabsTrigger>
            </TabsList>

            {isGenerated && (
              <TabsContent value="cv" className="space-y-4">
                <Tabs defaultValue="pdf" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 rounded-lg bg-secondary p-1">
                    <TabsTrigger value="pdf">{t("PDF View")}</TabsTrigger>
                    <TabsTrigger value="latex">{t("LaTeX Source")}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="pdf">
                    <div className="flex flex-col justify-center rounded-xl border border-border bg-background">
                      {generatedPdfBase64 ? (
                        <iframe
                          src={`data:application/pdf;base64,${generatedPdfBase64}`}
                          className="min-h-[65vh] w-full rounded-xl"
                          title="CV PDF"
                        />
                      ) : isCompiling ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-20">
                          <Loader2 className="h-7 w-7 animate-spin text-sage" />
                          <p className="text-sm font-medium text-muted-foreground">
                            {t("Compiling PDF...")}
                          </p>
                        </div>
                      ) : (
                        <div className="p-6">
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>{t("Compilation Failed")}</AlertTitle>
                            <AlertDescription>
                              {t(
                                "The backend could not render the LaTeX into a PDF. Please check the LaTeX Source tab, correct any syntax errors, and re-compile."
                              )}
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex flex-col gap-2 xl:flex-row">
                      <Button
                        className="flex-1 gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                        disabled={!generatedPdfBase64}
                        onClick={() => downloadPDF(generatedPdfBase64, "CV")}
                      >
                        <Download className="h-4 w-4" />
                        {t("Download CV PDF")}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="latex">
                    <div className="overflow-hidden rounded-xl border border-border">
                      <Editor
                        height="65vh"
                        defaultLanguage="latex"
                        theme="vs-dark"
                        value={generatedLatex}
                        onChange={(val) => setGeneratedLatex(val || "")}
                        options={{
                          minimap: { enabled: false },
                          wordWrap: "on",
                          padding: { top: 16 },
                        }}
                      />
                    </div>
                    <div className="mt-4 flex flex-col gap-2 xl:flex-row">
                      <Button
                        className="flex-1 gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                        disabled={isCompiling}
                        onClick={() => compileLatexLocally(generatedLatex, false)}
                      >
                        {isCompiling ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                        {t("Re-compile PDF")}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 gap-2 rounded-lg border-border"
                        onClick={() => navigator.clipboard.writeText(generatedLatex)}
                      >
                        <FileText className="h-4 w-4" />
                        {t("Copy LaTeX Code")}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 gap-2 rounded-lg border-border"
                        onClick={() => downloadLatex(generatedLatex, "CV")}
                      >
                        <Download className="h-4 w-4" />
                        {t("Download .tex")}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            )}

            {isCoverLetterGenerated && (
              <TabsContent value="cover-letter" className="space-y-4">
                <Tabs defaultValue="pdf" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 rounded-lg bg-secondary p-1">
                    <TabsTrigger value="pdf">{t("PDF View")}</TabsTrigger>
                    <TabsTrigger value="latex">{t("LaTeX Source")}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="pdf">
                    <div className="flex flex-col justify-center rounded-xl border border-border bg-background">
                      {generatedCoverLetterPdfBase64 ? (
                        <iframe
                          src={`data:application/pdf;base64,${generatedCoverLetterPdfBase64}`}
                          className="min-h-[65vh] w-full rounded-xl"
                          title="Cover Letter PDF"
                        />
                      ) : isCompiling ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-20">
                          <Loader2 className="h-7 w-7 animate-spin text-sage" />
                          <p className="text-sm font-medium text-muted-foreground">
                            {t("Compiling PDF...")}
                          </p>
                        </div>
                      ) : (
                        <div className="p-6">
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>{t("Compilation Failed")}</AlertTitle>
                            <AlertDescription>
                              {t(
                                "The backend could not render the LaTeX into a PDF. Please check the LaTeX Source tab, correct any syntax errors, and re-compile."
                              )}
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex flex-col gap-2 xl:flex-row">
                      <Button
                        className="flex-1 gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                        disabled={!generatedCoverLetterPdfBase64}
                        onClick={() => downloadPDF(generatedCoverLetterPdfBase64, "CoverLetter")}
                      >
                        <Download className="h-4 w-4" />
                        {t("Download Cover Letter PDF")}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="latex">
                    <div className="overflow-hidden rounded-xl border border-border">
                      <Editor
                        height="65vh"
                        defaultLanguage="latex"
                        theme="vs-dark"
                        value={generatedCoverLetterLatex}
                        onChange={(val) => setGeneratedCoverLetterLatex(val || "")}
                        options={{
                          minimap: { enabled: false },
                          wordWrap: "on",
                          padding: { top: 16 },
                        }}
                      />
                    </div>
                    <div className="mt-4 flex flex-col gap-2 xl:flex-row">
                      <Button
                        className="flex-1 gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                        disabled={isCompiling}
                        onClick={() => compileLatexLocally(generatedCoverLetterLatex, true)}
                      >
                        {isCompiling ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                        {t("Re-compile PDF")}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 gap-2 rounded-lg border-border"
                        onClick={() => navigator.clipboard.writeText(generatedCoverLetterLatex)}
                      >
                        <FileText className="h-4 w-4" />
                        {t("Copy LaTeX Code")}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 gap-2 rounded-lg border-border"
                        onClick={() => downloadLatex(generatedCoverLetterLatex, "CoverLetter")}
                      >
                        <Download className="h-4 w-4" />
                        {t("Download .tex")}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
    </div>
  )
}

const inputCls =
  "h-11 rounded-lg border-border bg-background text-[14px] focus-visible:bg-card"

function Section({
  title,
  children,
  action,
  icon,
  iconBg,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
  icon?: React.ReactNode
  iconBg?: "sage" | "clay" | "plum"
}) {
  const iconBgClass =
    iconBg === "sage"
      ? "bg-sage-soft text-sage"
      : iconBg === "clay"
        ? "bg-clay-soft text-clay"
        : iconBg === "plum"
          ? "bg-plum-soft text-plum"
          : "bg-secondary text-muted-foreground"
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 font-serif text-[18px] font-medium tracking-tight">
          {icon && (
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBgClass}`}
            >
              {icon}
            </span>
          )}
          {title}
        </h2>
        {action}
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

function SubCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col gap-4 rounded-xl border border-border bg-secondary/40 p-4">
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-semibold">{label}</Label>
      {children}
    </div>
  )
}

function AddButton({
  onClick,
  label,
  small,
}: {
  onClick: () => void
  label: string
  small?: boolean
}) {
  return (
    <Button
      onClick={onClick}
      size="sm"
      variant="ghost"
      className={`gap-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground ${small ? "px-3 text-[12px]" : "px-3 text-[12px]"}`}
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </Button>
  )
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      size="icon"
      variant="ghost"
      className="absolute right-3 top-3 h-8 w-8 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      onClick={onClick}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  )
}
