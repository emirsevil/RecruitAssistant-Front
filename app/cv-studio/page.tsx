"use client"

import { useState } from "react"

import { PageContainer, PageHeader } from "@/components/page-container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Download, Sparkles, RotateCcw, Save, Plus, Trash2, AlertCircle, Loader2, FileText, Eye, Upload } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useWorkspace } from "@/lib/workspace-context"

import Editor from "@monaco-editor/react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
    summary: "Senior Full Stack Developer with 5+ years of experience in building scalable web applications. Passionate about clean code, performance optimization, and AI integration. Proven track record of leading teams and delivering high-impact projects.",
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
        description: "Built an AI-powered resume generator helping 500+ users optimize their CVs with ATS-friendly formats.",
      },
      {
        title: "Crypto Portfolio Tracker",
        techStack: "Vue.js, Firebase, CoinGecko API",
        date: "2023",
        description: "Real-time cryptocurrency tracking application with price alerts and portfolio analysis tools.",
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
      "GraphQL"
    ],
    targetJob: "",
    specialInstructions: "",
  })

  const [isParsing, setIsParsing] = useState(false)

  const [atsScore, setAtsScore] = useState(0)
  const [roleMatch, setRoleMatch] = useState(0)
  const [missingSkills] = useState<string[]>([])

  // New state for AI generation
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false)
  const [generatedLatex, setGeneratedLatex] = useState("")
  const [generatedPdfBase64, setGeneratedPdfBase64] = useState<string | null>(null)
  
  const [generatedCoverLetterLatex, setGeneratedCoverLetterLatex] = useState("")
  const [generatedCoverLetterPdfBase64, setGeneratedCoverLetterPdfBase64] = useState<string | null>(null)
  
  const [showLatex, setShowLatex] = useState(false)
  const [generationError, setGenerationError] = useState("")
  const [isGenerated, setIsGenerated] = useState(false)
  const [isCoverLetterGenerated, setIsCoverLetterGenerated] = useState(false)
  const [isCompiling, setIsCompiling] = useState(false)

  const addExperience = () => {
    setCvData({
      ...cvData,
      experience: [
        ...cvData.experience,
        {
          role: "",
          company: "",
          bullets: [""],
          startDate: "",
          endDate: "",
        },
      ],
    })
  }

  const removeExperience = (indexToRemove: number) => {
    setCvData({
      ...cvData,
      experience: cvData.experience.filter((_, idx) => idx !== indexToRemove),
    })
  }

  const addProject = () => {
    setCvData({
      ...cvData,
      projects: [
        ...cvData.projects,
        {
          title: "",
          techStack: "",
          date: "",
          description: "",
        },
      ],
    })
  }

  const removeProject = (indexToRemove: number) => {
    setCvData({
      ...cvData,
      projects: cvData.projects.filter((_, idx) => idx !== indexToRemove),
    })
  }

  const addSkill = () => {
    const skill = prompt("Enter a new skill:")
    if (skill && skill.trim()) {
      setCvData({
        ...cvData,
        skills: [...cvData.skills, skill.trim()],
      })
    }
  }

  const removeSkill = (indexToRemove: number) => {
    setCvData({
      ...cvData,
      skills: cvData.skills.filter((_, idx) => idx !== indexToRemove),
    })
  }

  const addBullet = (expIndex: number) => {
    const newExperience = [...cvData.experience]
    newExperience[expIndex].bullets.push("")
    setCvData({ ...cvData, experience: newExperience })
  }

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    const newExperience = [...cvData.experience]
    newExperience[expIndex].bullets = newExperience[expIndex].bullets.filter((_, idx) => idx !== bulletIndex)
    setCvData({ ...cvData, experience: newExperience })
  }

  const updateExperienceBullet = (expIndex: number, bulletIndex: number, value: string) => {
    const newExperience = [...cvData.experience]
    newExperience[expIndex].bullets[bulletIndex] = value
    setCvData({ ...cvData, experience: newExperience })
  }

  const updateExperience = (index: number, field: string, value: string) => {
    const newExperience = [...cvData.experience]
      ; (newExperience[index] as any)[field] = value
    setCvData({ ...cvData, experience: newExperience })
  }

  const updateProject = (index: number, field: string, value: string) => {
    const newProjects = [...cvData.projects]
      ; (newProjects[index] as any)[field] = value
    setCvData({ ...cvData, projects: newProjects })
  }

  const updateEducation = (index: number, field: string, value: string) => {
    const newEducation = [...cvData.education]
      ; (newEducation[index] as any)[field] = value
    setCvData({ ...cvData, education: newEducation })
  }

  const formatCandidateProfile = () => {
    return {
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
        technologies: p.techStack.split(",").map((s) => s.trim()).filter(Boolean),
      })),
      certifications: [],
      languages: [language],
    };
  }

  const compileLatexLocally = async (latexContent: string, isCoverLetter: boolean) => {
    setIsCompiling(true)
    try {
      const workspaceId = activeWorkspace ? parseInt(activeWorkspace.id) : null
      const documentType = isCoverLetter ? "cover_letter" : "cv"

      const response = await fetch("http://localhost:8000/api/compile-latex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          latex_content: latexContent,
          workspace_id: workspaceId,
          document_type: documentType
        }),
        credentials: "include",
      })
      
      const data = await response.json()
      if (!response.ok) {
          throw new Error(data.error || "Compilation failed on backend")
      }
      
      if (isCoverLetter) {
        setGeneratedCoverLetterPdfBase64(data.pdf_base64)
      } else {
        setGeneratedPdfBase64(data.pdf_base64)
      }
    } catch(error: any) {
      console.error("Compile Error:", error.message)
      if (isCoverLetter) {
        setGeneratedCoverLetterPdfBase64(null)
      } else {
        setGeneratedPdfBase64(null)
      }
    } finally {
      setIsCompiling(false)
    }
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsParsing(true)
    setGenerationError("")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to parse resume")
      }

      const parsedData = await response.json()

      // Update cvData with parsed information
      setCvData((prev) => ({
        ...prev,
        name: parsedData.name || prev.name,
        email: parsedData.email || prev.email,
        phone: parsedData.phone || prev.phone,
        location: parsedData.location || prev.location,
        summary: parsedData.summary || prev.summary,
        education: parsedData.education?.length ? parsedData.education : prev.education,
        experience: parsedData.experience?.length ? parsedData.experience : prev.experience,
        skills: parsedData.skills?.length ? parsedData.skills : prev.skills,
      }))
    } catch (error: any) {
      setGenerationError(error.message || "An error occurred while parsing the resume")
    } finally {
      setIsParsing(false)
      // Reset input
      e.target.value = ""
    }
  }

  // Generate CV using AI
  const generateCV = async () => {
    setIsGenerating(true)
    setIsGenerated(true) // Set immediately for streaming
    setGenerationError("")
    setGeneratedPdfBase64(null)
    setGeneratedLatex("")

    try {
      const response = await fetch("http://localhost:8000/api/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_profile: formatCandidateProfile(),
          job_description: cvData.targetJob,
          special_instructions: cvData.specialInstructions,
          language: language
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t("Failed to generate CV"))
      }

      if (!response.body) throw new Error("ReadableStream not supported")
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let currentLatex = ""

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        currentLatex += chunk
        setGeneratedLatex(currentLatex)
      }
      
      setAtsScore(Math.floor(Math.random() * 15) + 85)
      setRoleMatch(Math.floor(Math.random() * 10) + 90)

      await compileLatexLocally(currentLatex, false)
    } catch (error: any) {
      setGenerationError(error.message || t("An error occurred while generating the CV"))
      setIsGenerated(false)
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate Cover Letter using AI
  const generateCoverLetter = async () => {
    setIsGeneratingCoverLetter(true)
    setIsCoverLetterGenerated(true) // Set immediately for streaming
    setGenerationError("")
    setGeneratedCoverLetterPdfBase64(null)
    setGeneratedCoverLetterLatex("")

    try {
      const currentDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      const coverLetterInstructions = [
        `Use this exact cover letter date: ${currentDate}.`,
        "In the recipient block, include Hiring Manager and the actual company name extracted from the job description when available. Do not include a Company Address line. Never output placeholder text.",
        cvData.specialInstructions
      ].filter(Boolean).join("\n")

      const response = await fetch("http://localhost:8000/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_profile: formatCandidateProfile(),
          job_description: cvData.targetJob,
          special_instructions: coverLetterInstructions,
          language: language
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t("Failed to generate Cover Letter"))
      }

      if (!response.body) throw new Error("ReadableStream not supported")
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let currentLatex = ""

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        currentLatex += chunk
        setGeneratedCoverLetterLatex(currentLatex)
      }
      
      await compileLatexLocally(currentLatex, true)
    } catch (error: any) {
      setGenerationError(error.message || t("An error occurred while generating the Cover Letter"))
      setIsCoverLetterGenerated(false)
    } finally {
      setIsGeneratingCoverLetter(false)
    }
  }

  // Download LaTeX file
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

  // Download PDF file
  const downloadPDF = (base64Content: string | null, prefix: string) => {
    if (!base64Content) return
    try {
      const byteCharacters = atob(base64Content)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
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
    } catch (error) {
      console.error("Error creating PDF download blob:", error)
    }
  }


  return (
    <>
      <PageContainer className="min-h-screen bg-zinc-50 py-6 text-zinc-950 md:py-8">
        <PageHeader title={t("CV Studio")} />

        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          {/* Input Form */}
          <div className="space-y-8 lg:col-span-8">
            <Card className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md">
              <CardHeader className="p-0 pb-6">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold tracking-tight text-gray-900">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shadow-sm">
                    <Upload className="h-5 w-5 transition-transform group-hover:scale-110" />
                  </span>
                  {t("Upload Resume")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleResumeUpload}
                    disabled={isParsing}
                    className="h-12 cursor-pointer rounded-xl border-0 bg-gray-50 px-4 text-sm shadow-none transition-all file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-white file:px-4 file:text-sm file:font-medium file:text-gray-900 hover:bg-gray-100 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                  />
                  {isParsing && (
                    <div className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-zinc-700">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("Parsing...")}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <CardHeader className="p-0 pb-6">
                <CardTitle className="text-lg font-semibold tracking-tight text-gray-900">{t("Personal Information")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-0">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">{t("CV Language")}</Label>
                    <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="h-12 rounded-xl border-0 bg-gray-50 shadow-none transition-all hover:bg-gray-100 focus:ring-2 focus:ring-black">
                      <SelectValue placeholder={t("Select language")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">{t("English")}</SelectItem>
                      <SelectItem value="tr">{t("Turkish")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">{t("Full Name")}</Label>
                    <Input
                      id="name"
                      value={cvData.name}
                      onChange={(e) => setCvData({ ...cvData, name: e.target.value })}
                      className="h-12 rounded-xl border-0 bg-gray-50 shadow-none transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">{t("Email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={cvData.email}
                      onChange={(e) => setCvData({ ...cvData, email: e.target.value })}
                      className="h-12 rounded-xl border-0 bg-gray-50 shadow-none transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">{t("Phone")}</Label>
                    <Input
                      id="phone"
                      value={cvData.phone}
                      onChange={(e) => setCvData({ ...cvData, phone: e.target.value })}
                      className="h-12 rounded-xl border-0 bg-gray-50 shadow-none transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium text-gray-700">{t("Location")}</Label>
                    <Input
                      id="location"
                      value={cvData.location}
                      onChange={(e) => setCvData({ ...cvData, location: e.target.value })}
                      className="h-12 rounded-xl border-0 bg-gray-50 shadow-none transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="text-sm font-medium text-gray-700">{t("LinkedIn URL")}</Label>
                    <Input
                      id="linkedin"
                      value={cvData.linkedin}
                      onChange={(e) => setCvData({ ...cvData, linkedin: e.target.value })}
                      className="h-12 rounded-xl border-0 bg-gray-50 shadow-none transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github" className="text-sm font-medium text-gray-700">{t("GitHub/Portfolio URL")}</Label>
                    <Input
                      id="github"
                      value={cvData.github}
                      onChange={(e) => setCvData({ ...cvData, github: e.target.value })}
                      className="h-12 rounded-xl border-0 bg-gray-50 shadow-none transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="summary" className="text-sm font-medium text-gray-700">{t("Professional Summary")}</Label>
                  <Textarea
                    id="summary"
                    value={cvData.summary}
                    onChange={(e) => setCvData({ ...cvData, summary: e.target.value })}
                    className="min-h-[130px] resize-none rounded-xl border-0 bg-gray-50 px-4 py-3 shadow-none transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <CardHeader className="p-0 pb-6">
                <CardTitle className="text-lg font-semibold tracking-tight text-gray-900">{t("Education")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 p-0">
                {cvData.education.map((edu, idx) => (
                  <div key={idx} className="space-y-5 rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">{t("Degree")}</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                        className="h-12 rounded-xl border-0 bg-white shadow-none transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                      />
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{t("School")}</Label>
                        <Input
                          value={edu.school}
                          onChange={(e) => updateEducation(idx, "school", e.target.value)}
                          className="h-12 rounded-xl border-0 bg-white shadow-none transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{t("GPA")}</Label>
                        <Input
                          value={edu.gpa}
                          onChange={(e) => updateEducation(idx, "gpa", e.target.value)}
                          className="h-12 rounded-xl border-0 bg-white shadow-none transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{t("Start Date")}</Label>
                        <Input
                          value={edu.startDate}
                          onChange={(e) => updateEducation(idx, "startDate", e.target.value)}
                          className="h-12 rounded-xl border-0 bg-white shadow-none transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{t("End Date")}</Label>
                        <Input
                          value={edu.endDate}
                          onChange={(e) => updateEducation(idx, "endDate", e.target.value)}
                          className="h-12 rounded-xl border-0 bg-white shadow-none transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <CardHeader className="p-0 pb-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold tracking-tight text-gray-900">{t("Experience")}</CardTitle>
                  <Button onClick={addExperience} size="sm" variant="ghost" className="gap-2 rounded-full px-4 text-gray-600 transition-all hover:-translate-y-0.5 hover:bg-gray-100 hover:text-black">
                    <Plus className="h-4 w-4" />
                    {t("Add")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 p-0">
                {cvData.experience.map((exp, idx) => (
                  <div key={idx} className="relative space-y-6 rounded-2xl border border-gray-100 bg-gray-50/60 p-5 transition-all hover:bg-gray-50">
                    {cvData.experience.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-4 top-4 h-9 w-9 rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        onClick={() => removeExperience(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{t("Role")}</Label>
                        <Input
                          value={exp.role}
                          placeholder={t("Software Engineer")}
                          onChange={(e) => updateExperience(idx, "role", e.target.value)}
                          className="h-12 rounded-xl border-0 bg-white shadow-none transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{t("Company")}</Label>
                        <Input
                          value={exp.company}
                          placeholder={t("Tech Company Inc.")}
                          onChange={(e) => updateExperience(idx, "company", e.target.value)}
                          className="h-12 rounded-xl border-0 bg-white shadow-none transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{t("Start Date")}</Label>
                        <Input
                          value={exp.startDate}
                          placeholder={t("Jan 2023")}
                          onChange={(e) => updateExperience(idx, "startDate", e.target.value)}
                          className="h-12 rounded-xl border-0 bg-white shadow-none transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{t("End Date")}</Label>
                        <Input
                          value={exp.endDate}
                          placeholder={t("Present")}
                          onChange={(e) => updateExperience(idx, "endDate", e.target.value)}
                          className="h-12 rounded-xl border-0 bg-white shadow-none transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-sm font-medium text-gray-700">{t("Responsibilities & Achievements")}</Label>
                      {exp.bullets.map((bullet, bulletIdx) => (
                        <div key={bulletIdx} className="flex gap-2 group/bullet">
                          <Textarea
                            value={bullet}
                            onChange={(e) => updateExperienceBullet(idx, bulletIdx, e.target.value)}
                            className="min-h-[84px] flex-1 resize-none rounded-xl border-0 bg-white px-4 py-3 shadow-none transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                            placeholder="• Developed features that improved..."
                          />
                          {exp.bullets.length > 1 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="mt-2 h-9 w-9 self-start rounded-full text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover/bullet:opacity-100"
                              onClick={() => removeBullet(idx, bulletIdx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button size="sm" variant="ghost" className="gap-2 rounded-full px-4 font-medium text-gray-600 transition-all hover:-translate-y-0.5 hover:bg-gray-100 hover:text-black" onClick={() => addBullet(idx)}>
                        <Plus className="h-3 w-3" />
                        {t("Add bullet point")}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <CardHeader className="p-0 pb-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold tracking-tight text-gray-900">{t("Projects")}</CardTitle>
                  <Button onClick={addProject} size="sm" variant="ghost" className="gap-2 rounded-full px-4 text-gray-600 transition-all hover:-translate-y-0.5 hover:bg-gray-100 hover:text-black">
                    <Plus className="h-4 w-4" />
                    {t("Add")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 p-0">
                {cvData.projects.map((project, idx) => (
                  <div key={idx} className="relative space-y-5 rounded-2xl border border-gray-100 bg-gray-50/60 p-5 transition-all hover:bg-gray-50">
                    {cvData.projects.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-4 top-4 h-9 w-9 rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        onClick={() => removeProject(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{t("Project Title")}</Label>
                        <Input
                          value={project.title}
                          placeholder={t("E-commerce Platform")}
                          onChange={(e) => updateProject(idx, "title", e.target.value)}
                          className="h-12 rounded-xl border-0 bg-white shadow-none transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{t("Project Date")}</Label>
                        <Input
                          value={project.date}
                          placeholder="2024"
                          onChange={(e) => updateProject(idx, "date", e.target.value)}
                          className="h-12 rounded-xl border-0 bg-white shadow-none transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-sm font-medium text-gray-700">{t("Tech Stack")}</Label>
                        <Input
                          value={project.techStack}
                          placeholder="React, Node.js, MongoDB"
                          onChange={(e) => updateProject(idx, "techStack", e.target.value)}
                          className="h-12 rounded-xl border-0 bg-white shadow-none transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">{t("Description")}</Label>
                      <Textarea
                        value={project.description}
                        onChange={(e) => updateProject(idx, "description", e.target.value)}
                        className="min-h-[130px] resize-none rounded-xl border-0 bg-white px-4 py-3 shadow-none transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                        placeholder={t("Built a full-stack application that...")}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <CardHeader className="p-0 pb-6">
                <CardTitle className="text-lg font-semibold tracking-tight text-gray-900">{t("Skills")}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-wrap gap-3">
                  {cvData.skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-2 rounded-full border border-gray-100 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-800 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-black hover:text-white">
                      {skill}
                      <Trash2
                        className="ml-1 h-3 w-3 cursor-pointer text-gray-400 transition-colors hover:text-red-500"
                        onClick={() => removeSkill(idx)}
                      />
                    </Badge>
                  ))}
                  <Button size="sm" variant="ghost" className="gap-2 rounded-full px-4 font-medium text-gray-600 transition-all hover:-translate-y-0.5 hover:bg-gray-100 hover:text-black" onClick={addSkill}>
                    <Plus className="h-4 w-4" />
                    {t("Add skill")}
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Analysis & Actions */}
          <div className="space-y-6 lg:sticky lg:top-8 lg:col-span-4">
            <Card className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <CardHeader className="p-0 pb-6">
                <CardTitle className="text-lg font-semibold tracking-tight text-gray-900">{t("Target Job Description")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-0">
                <div className="space-y-3">
                  <Textarea
                    value={cvData.targetJob}
                    onChange={(e) => setCvData({ ...cvData, targetJob: e.target.value })}
                    className="min-h-[260px] resize-none rounded-xl border-0 bg-gray-50 px-4 py-3 shadow-none transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                    placeholder={t("Paste the full job description here...")}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="special-instructions" className="text-sm font-medium text-gray-700">{t("Special Instructions (Optional)")}</Label>
                  <Textarea
                    id="special-instructions"
                    value={cvData.specialInstructions}
                    onChange={(e) => setCvData({ ...cvData, specialInstructions: e.target.value })}
                    className="min-h-[140px] resize-none rounded-xl border-0 bg-gray-50 px-4 py-3 shadow-none transition-all focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black"
                    placeholder={t("e.g., 'Make it more professional', 'Focus on my leadership skills', 'Keep it under one page'")}
                  />
                </div>
              </CardContent>
            </Card>

            {generationError && (
              <Card className="rounded-[8px] border-red-200 bg-red-50 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm font-medium">{generationError}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-3">
              <Button
                className="gap-3 rounded-full bg-black px-6 py-4 text-base font-bold text-white shadow-lg shadow-black/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-900 hover:shadow-xl hover:shadow-black/20 active:translate-y-0"
                onClick={generateCV}
                disabled={isGenerating || isGeneratingCoverLetter}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t("Generating CV...")}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    {t("Generate CV")}
                  </>
                )}
              </Button>
              <Button
                className="gap-3 rounded-full border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 hover:text-black hover:shadow-md active:translate-y-0"
                onClick={generateCoverLetter}
                disabled={isGenerating || isGeneratingCoverLetter}
                variant="outline"
              >
                {isGeneratingCoverLetter ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t("Generating Letter...")}
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    {t("Generate Cover Letter")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Generated Outputs */}
        <Card className="mt-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between p-0 pb-6">
                <CardTitle className="text-lg font-semibold tracking-tight text-gray-900">{t("Generated Documents")}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isGenerating || isGeneratingCoverLetter ? (
                  <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16">
                    <Loader2 className="h-7 w-7 animate-spin text-gray-700" />
                  </div>
                ) : (!isGenerated && !isCoverLetterGenerated) ? (
                  <div className="grid place-items-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16">
                    <FileText className="h-6 w-6 text-gray-300" />
                  </div>
                ) : (
                  <Tabs defaultValue={isGenerated ? "cv" : "cover-letter"} className="w-full">
                    {/* Main Tabs: CV vs Cover Letter */}
                    <TabsList className="mb-4 grid w-full grid-cols-2 rounded-xl bg-gray-100 p-1">
                      <TabsTrigger value="cv" disabled={!isGenerated}>{t("CV")}</TabsTrigger>
                      <TabsTrigger value="cover-letter" disabled={!isCoverLetterGenerated}>{t("Cover Letter")}</TabsTrigger>
                    </TabsList>

                    {/* CV TAB */}
                    {isGenerated && (
                      <TabsContent value="cv" className="space-y-4">
                        <Tabs defaultValue="pdf" className="w-full">
                          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-gray-100 p-1">
                            <TabsTrigger value="pdf">{t("PDF View")}</TabsTrigger>
                            <TabsTrigger value="latex">{t("LaTeX Source")}</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="pdf">
                            <div className="flex flex-col justify-center rounded-2xl border border-gray-100 bg-white shadow-inner">
                              {generatedPdfBase64 ? (
                                <iframe 
                                  src={`data:application/pdf;base64,${generatedPdfBase64}`} 
                                  className="min-h-[65vh] w-full rounded-2xl"
                                  title="CV PDF"
                                />
                              ) : isCompiling ? (
                                <div className="flex flex-col items-center justify-center space-y-4 py-20">
                                  <Loader2 className="h-8 w-8 animate-spin text-gray-700" />
                                  <p className="text-sm font-medium text-gray-600">{t("Compiling PDF...")}</p>
                                </div>
                              ) : (
                                <div className="p-6">
                                  <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>{t("Compilation Failed")}</AlertTitle>
                                    <AlertDescription>
                                      {t("The backend could not render the LaTeX into a PDF. Please check the LaTeX Source tab, correct any syntax errors, and re-compile.")}
                                    </AlertDescription>
                                  </Alert>
                                </div>
                              )}
                            </div>
                            <div className="mt-4 flex flex-col gap-2 xl:flex-row">
                              <Button className="flex-1 gap-2 rounded-full bg-black font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gray-900 hover:shadow-md" disabled={!generatedPdfBase64} onClick={() => downloadPDF(generatedPdfBase64, "CV")}>
                                <Download className="h-4 w-4" />
                                {t("Download CV PDF")}
                              </Button>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="latex">
                            <div className="rounded-2xl border border-gray-100 shadow-sm">
                              <Editor
                                height="65vh"
                                defaultLanguage="latex"
                                theme="vs-dark"
                                value={generatedLatex}
                                onChange={(val) => setGeneratedLatex(val || "")}
                                options={{
                                  minimap: { enabled: false },
                                  wordWrap: "on",
                                  padding: { top: 16 }
                                }}
                              />
                            </div>
                            <div className="mt-4 flex flex-col gap-2 xl:flex-row">
                              <Button variant="default" className="flex-1 gap-2 rounded-full bg-black font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gray-900 hover:shadow-md" disabled={isCompiling} onClick={() => compileLatexLocally(generatedLatex, false)}>
                                {isCompiling ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                                {t("Re-compile PDF")}
                              </Button>
                              <Button variant="outline" className="flex-1 gap-2 rounded-full border-gray-200 bg-white font-medium text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 hover:text-black" onClick={() => navigator.clipboard.writeText(generatedLatex)}>
                                <FileText className="h-4 w-4" />
                                {t("Copy LaTeX Code")}
                              </Button>
                              <Button variant="outline" className="flex-1 gap-2 rounded-full border-gray-200 bg-white font-medium text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 hover:text-black" onClick={() => downloadLatex(generatedLatex, "CV")}>
                                <Download className="h-4 w-4" />
                                {t("Download .tex")}
                              </Button>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </TabsContent>
                    )}

                    {/* COVER LETTER TAB */}
                    {isCoverLetterGenerated && (
                      <TabsContent value="cover-letter" className="space-y-4">
                        <Tabs defaultValue="pdf" className="w-full">
                          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-gray-100 p-1">
                            <TabsTrigger value="pdf">{t("PDF View")}</TabsTrigger>
                            <TabsTrigger value="latex">{t("LaTeX Source")}</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="pdf">
                            <div className="flex flex-col justify-center rounded-2xl border border-gray-100 bg-white shadow-inner">
                              {generatedCoverLetterPdfBase64 ? (
                                <iframe 
                                  src={`data:application/pdf;base64,${generatedCoverLetterPdfBase64}`} 
                                  className="min-h-[65vh] w-full rounded-2xl"
                                  title="Cover Letter PDF"
                                />
                              ) : isCompiling ? (
                                <div className="flex flex-col items-center justify-center space-y-4 py-20">
                                  <Loader2 className="h-8 w-8 animate-spin text-gray-700" />
                                  <p className="text-sm font-medium text-gray-600">{t("Compiling PDF...")}</p>
                                </div>
                              ) : (
                                <div className="p-6">
                                  <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>{t("Compilation Failed")}</AlertTitle>
                                    <AlertDescription>
                                      {t("The backend could not render the LaTeX into a PDF. Please check the LaTeX Source tab, correct any syntax errors, and re-compile.")}
                                    </AlertDescription>
                                  </Alert>
                                </div>
                              )}
                            </div>
                            <div className="mt-4 flex flex-col gap-2 xl:flex-row">
                              <Button className="flex-1 gap-2 rounded-full bg-black font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gray-900 hover:shadow-md" disabled={!generatedCoverLetterPdfBase64} onClick={() => downloadPDF(generatedCoverLetterPdfBase64, "CoverLetter")}>
                                <Download className="h-4 w-4" />
                                {t("Download Cover Letter PDF")}
                              </Button>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="latex">
                            <div className="rounded-2xl border border-gray-100 shadow-sm">
                              <Editor
                                height="65vh"
                                defaultLanguage="latex"
                                theme="vs-dark"
                                value={generatedCoverLetterLatex}
                                onChange={(val) => setGeneratedCoverLetterLatex(val || "")}
                                options={{
                                  minimap: { enabled: false },
                                  wordWrap: "on",
                                  padding: { top: 16 }
                                }}
                              />
                            </div>
                            <div className="mt-4 flex flex-col gap-2 xl:flex-row">
                              <Button variant="default" className="flex-1 gap-2 rounded-full bg-black font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gray-900 hover:shadow-md" disabled={isCompiling} onClick={() => compileLatexLocally(generatedCoverLetterLatex, true)}>
                                {isCompiling ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                                {t("Re-compile PDF")}
                              </Button>
                              <Button variant="outline" className="flex-1 gap-2 rounded-full border-gray-200 bg-white font-medium text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 hover:text-black" onClick={() => navigator.clipboard.writeText(generatedCoverLetterLatex)}>
                                <FileText className="h-4 w-4" />
                                {t("Copy LaTeX Code")}
                              </Button>
                              <Button variant="outline" className="flex-1 gap-2 rounded-full border-gray-200 bg-white font-medium text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 hover:text-black" onClick={() => downloadLatex(generatedCoverLetterLatex, "CoverLetter")}>
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
              </CardContent>
            </Card>
      </PageContainer>
    </>
  )
}
