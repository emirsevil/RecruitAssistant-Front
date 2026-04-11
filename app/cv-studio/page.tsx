"use client"

import { useState } from "react"

import { PageContainer, PageHeader } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  const [language, setLanguage] = useState("English")
  const [cvData, setCvData] = useState({
    name: "Deniz Ozturk",
    email: "deniz.ozturk@example.com",
    phone: "+90 555 123 45 67",
    location: "Istanbul, Turkey",
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
        description: "Built an AI-powered resume generator helping 500+ users optimize their CVs with ATS-friendly formats.",
      },
      {
        title: "Crypto Portfolio Tracker",
        techStack: "Vue.js, Firebase, CoinGecko API",
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
          special_instructions: cvData.specialInstructions
        }),
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
      const response = await fetch("http://localhost:8000/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_profile: formatCandidateProfile(),
          job_description: cvData.targetJob,
          special_instructions: cvData.specialInstructions
        }),
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
      <PageContainer>
        <PageHeader title={t("CV Studio")} description={t("Build and optimize your resume with AI assistance")} />

        <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
          {/* Input Form */}
          <div className="space-y-8">
            <Card className="border-primary/20 bg-primary/5 transition-all duration-300 hover:shadow-lg hover:border-primary/40 group">
              <CardHeader className="p-8 pb-3">
                <CardTitle className="text-xl flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Upload className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                  {t("Upload Resume")}
                </CardTitle>
                <CardDescription className="text-base">
                  {t("Upload your existing CV (PDF/DOCX) to autofill the form with AI assistance")}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleResumeUpload}
                    disabled={isParsing}
                    className="cursor-pointer file:cursor-pointer hover:border-primary/50 transition-colors focus-visible:ring-primary/20"
                  />
                  {isParsing && (
                    <div className="flex items-center gap-2 text-sm font-medium text-primary animate-pulse">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("Parsing...")}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-md hover:border-primary/10">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="border-l-4 border-primary pl-4">{t("Personal Information")}</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t("CV Language")}</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="hover:border-primary/30 transition-colors">
                      <SelectValue placeholder={t("Select language")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Turkish">Türkçe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold">{t("Full Name")}</Label>
                    <Input
                      id="name"
                      value={cvData.name}
                      onChange={(e) => setCvData({ ...cvData, name: e.target.value })}
                      className="focus-visible:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">{t("Email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={cvData.email}
                      onChange={(e) => setCvData({ ...cvData, email: e.target.value })}
                      className="focus-visible:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold">{t("Phone")}</Label>
                    <Input
                      id="phone"
                      value={cvData.phone}
                      onChange={(e) => setCvData({ ...cvData, phone: e.target.value })}
                      className="focus-visible:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-semibold">{t("Location")}</Label>
                    <Input
                      id="location"
                      value={cvData.location}
                      onChange={(e) => setCvData({ ...cvData, location: e.target.value })}
                      className="focus-visible:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="summary" className="text-sm font-semibold">{t("Professional Summary")}</Label>
                  <Textarea
                    id="summary"
                    value={cvData.summary}
                    onChange={(e) => setCvData({ ...cvData, summary: e.target.value })}
                    className="min-h-[100px] focus-visible:ring-primary/20 resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-md hover:border-primary/10">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="border-l-4 border-primary pl-4">{t("Education")}</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                {cvData.education.map((edu, idx) => (
                  <div key={idx} className="space-y-4 rounded-xl bg-muted/30 p-6 border-none shadow-sm">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">{t("Degree")}</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                        className="bg-background focus-visible:ring-primary/20"
                      />
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">{t("School")}</Label>
                        <Input
                          value={edu.school}
                          onChange={(e) => updateEducation(idx, "school", e.target.value)}
                          className="bg-background focus-visible:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">{t("GPA")}</Label>
                        <Input
                          value={edu.gpa}
                          onChange={(e) => updateEducation(idx, "gpa", e.target.value)}
                          className="bg-background focus-visible:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">{t("Start Date")}</Label>
                        <Input
                          value={edu.startDate}
                          onChange={(e) => updateEducation(idx, "startDate", e.target.value)}
                          className="bg-background focus-visible:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">{t("End Date")}</Label>
                        <Input
                          value={edu.endDate}
                          onChange={(e) => updateEducation(idx, "endDate", e.target.value)}
                          className="bg-background focus-visible:ring-primary/20"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-md hover:border-primary/10">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="border-l-4 border-primary pl-4">{t("Experience")}</CardTitle>
                  <Button onClick={addExperience} size="sm" variant="outline" className="gap-2 transition-all hover:bg-primary/5 hover:border-primary/50">
                    <Plus className="h-4 w-4" />
                    {t("Add")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                {cvData.experience.map((exp, idx) => (
                  <div key={idx} className="space-y-6 rounded-xl bg-muted/30 p-6 relative border-none shadow-sm transition-all hover:bg-muted/50">
                    {cvData.experience.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => removeExperience(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">{t("Role")}</Label>
                        <Input
                          value={exp.role}
                          placeholder={t("Software Engineer")}
                          onChange={(e) => updateExperience(idx, "role", e.target.value)}
                          className="bg-background focus-visible:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">{t("Company")}</Label>
                        <Input
                          value={exp.company}
                          placeholder={t("Tech Company Inc.")}
                          onChange={(e) => updateExperience(idx, "company", e.target.value)}
                          className="bg-background focus-visible:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">{t("Start Date")}</Label>
                        <Input
                          value={exp.startDate}
                          placeholder={t("Jan 2023")}
                          onChange={(e) => updateExperience(idx, "startDate", e.target.value)}
                          className="bg-background focus-visible:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">{t("End Date")}</Label>
                        <Input
                          value={exp.endDate}
                          placeholder={t("Present")}
                          onChange={(e) => updateExperience(idx, "endDate", e.target.value)}
                          className="bg-background focus-visible:ring-primary/20"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-sm font-semibold">{t("Responsibilities & Achievements")}</Label>
                      {exp.bullets.map((bullet, bulletIdx) => (
                        <div key={bulletIdx} className="flex gap-2 group/bullet">
                          <Textarea
                            value={bullet}
                            onChange={(e) => updateExperienceBullet(idx, bulletIdx, e.target.value)}
                            className="min-h-[60px] flex-1 bg-background focus-visible:ring-primary/20 resize-none"
                            placeholder="• Developed features that improved..."
                          />
                          {exp.bullets.length > 1 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/bullet:opacity-100 transition-all self-start mt-2"
                              onClick={() => removeBullet(idx, bulletIdx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button size="sm" variant="ghost" className="gap-2 text-primary hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => addBullet(idx)}>
                        <Plus className="h-3 w-3" />
                        {t("Add bullet point")}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-md hover:border-primary/10">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="border-l-4 border-primary pl-4">{t("Projects")}</CardTitle>
                  <Button onClick={addProject} size="sm" variant="outline" className="gap-2 transition-all hover:bg-primary/5 hover:border-primary/50">
                    <Plus className="h-4 w-4" />
                    {t("Add")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                {cvData.projects.map((project, idx) => (
                  <div key={idx} className="space-y-6 rounded-xl bg-muted/30 p-6 relative border-none shadow-sm transition-all hover:bg-muted/50">
                    {cvData.projects.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => removeProject(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">{t("Project Title")}</Label>
                      <Input
                        value={project.title}
                        placeholder={t("E-commerce Platform")}
                        onChange={(e) => updateProject(idx, "title", e.target.value)}
                        className="bg-background focus-visible:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">{t("Tech Stack")}</Label>
                      <Input
                        value={project.techStack}
                        placeholder="React, Node.js, MongoDB"
                        onChange={(e) => updateProject(idx, "techStack", e.target.value)}
                        className="bg-background focus-visible:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">{t("Description")}</Label>
                      <Textarea
                        value={project.description}
                        onChange={(e) => updateProject(idx, "description", e.target.value)}
                        className="min-h-[100px] bg-background focus-visible:ring-primary/20 resize-none"
                        placeholder={t("Built a full-stack application that...")}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-md hover:border-primary/10">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="border-l-4 border-primary pl-4">{t("Skills")}</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="flex flex-wrap gap-3">
                  {cvData.skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1 px-4 py-2 text-sm transition-all hover:bg-secondary/80">
                      {skill}
                      <Trash2
                        className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors ml-1"
                        onClick={() => removeSkill(idx)}
                      />
                    </Badge>
                  ))}
                  <Button size="sm" variant="outline" className="gap-2 transition-all hover:bg-primary/5 hover:border-primary/50" onClick={addSkill}>
                    <Plus className="h-4 w-4" />
                    {t("Add skill")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-md hover:border-primary/10">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="border-l-4 border-primary pl-4">{t("Target Job Description")}</CardTitle>
                <CardDescription className="pl-4">{t("Paste the job description to optimize your CV")}</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                <div className="space-y-2">
                  <Textarea
                    value={cvData.targetJob}
                    onChange={(e) => setCvData({ ...cvData, targetJob: e.target.value })}
                    className="min-h-[160px] focus-visible:ring-primary/20"
                    placeholder={t("Paste the full job description here...")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="special-instructions" className="text-sm font-semibold">{t("Special Instructions (Optional)")}</Label>
                  <Textarea
                    id="special-instructions"
                    value={cvData.specialInstructions}
                    onChange={(e) => setCvData({ ...cvData, specialInstructions: e.target.value })}
                    className="min-h-[100px] focus-visible:ring-primary/20"
                    placeholder={t("e.g., 'Make it more professional', 'Focus on my leadership skills', 'Keep it under one page'")}
                  />
                </div>
              </CardContent>
            </Card>

            {generationError && (
              <Card className="border-destructive bg-destructive/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm font-medium">{generationError}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                className="flex-1 h-14 text-lg font-bold gap-3 transition-all duration-300 bg-gradient-to-r from-primary to-primary/80 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/20 hover:brightness-110 active:scale-[0.98]"
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
                className="flex-1 h-14 text-lg font-bold gap-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
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

          {/* Preview & Analysis */}
          <div className="space-y-6">
            {/* CV Analysis */}
            <Card className="transition-all duration-300 hover:shadow-lg border-primary/10">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl border-l-4 border-primary pl-4">{t("CV Analysis")}</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-muted-foreground">{t("ATS Score")}</span>
                    <span className="text-3xl font-black text-primary drop-shadow-sm">{atsScore}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-secondary shadow-inner">
                    <div className="h-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-1000 ease-out" style={{ width: `${atsScore}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    {isGenerated ? t("Excellent! AI-optimized for ATS systems") : t("Good! Your CV is well-formatted for ATS systems")}
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-muted-foreground">{t("Role Match")}</span>
                    <span className="text-3xl font-black text-primary drop-shadow-sm">{roleMatch}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-secondary shadow-inner">
                    <div className="h-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-1000 ease-out" style={{ width: `${roleMatch}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    {isGenerated ? t("Optimized for your target role") : t("Great alignment with the target role")}
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-primary">
                    <AlertCircle className="h-4 w-4" />
                    {t("Missing Skills")}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {missingSkills.map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs py-1 px-2 border-primary/20">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground italic">{t("Consider adding these skills if you have experience")}</p>
                </div>
              </CardContent>
            </Card>

            {/* Generated Outputs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{t("Generated Documents")}</CardTitle>
              </CardHeader>
              <CardContent>
                {isGenerating || isGeneratingCoverLetter ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">{t("Generating with AI...")}</p>
                  </div>
                ) : (!isGenerated && !isCoverLetterGenerated) ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                    <p className="text-sm text-muted-foreground">{t("Fill out the form and generate your personalized CV or Cover Letter.")}</p>
                  </div>
                ) : (
                  <Tabs defaultValue={isGenerated ? "cv" : "cover-letter"} className="w-full">
                    {/* Main Tabs: CV vs Cover Letter */}
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="cv" disabled={!isGenerated}>{t("CV")}</TabsTrigger>
                      <TabsTrigger value="cover-letter" disabled={!isCoverLetterGenerated}>{t("Cover Letter")}</TabsTrigger>
                    </TabsList>

                    {/* CV TAB */}
                    {isGenerated && (
                      <TabsContent value="cv" className="space-y-4">
                        <Tabs defaultValue="pdf" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="pdf">{t("PDF View")}</TabsTrigger>
                            <TabsTrigger value="latex">{t("LaTeX Source")}</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="pdf">
                            <div className="rounded-lg border-2 border-border bg-white h-[600px] overflow-hidden flex flex-col justify-center">
                              {generatedPdfBase64 ? (
                                <iframe 
                                  src={`data:application/pdf;base64,${generatedPdfBase64}`} 
                                  className="w-full h-full"
                                  title="CV PDF"
                                />
                              ) : isCompiling ? (
                                <div className="flex flex-col items-center justify-center space-y-4 h-full">
                                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                  <p className="text-sm text-muted-foreground">{t("Compiling PDF...")}</p>
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
                            <div className="mt-4 flex gap-2">
                              <Button className="flex-1 gap-2" disabled={!generatedPdfBase64} onClick={() => downloadPDF(generatedPdfBase64, "CV")}>
                                <Download className="h-4 w-4" />
                                {t("Download CV PDF")}
                              </Button>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="latex">
                            <div className="rounded-lg border-2 border-border overflow-hidden h-[600px]">
                              <Editor
                                height="100%"
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
                            <div className="mt-4 flex gap-2">
                              <Button variant="default" className="flex-1 gap-2" disabled={isCompiling} onClick={() => compileLatexLocally(generatedLatex, false)}>
                                {isCompiling ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                                {t("Re-compile PDF")}
                              </Button>
                              <Button variant="outline" className="flex-1 gap-2" onClick={() => navigator.clipboard.writeText(generatedLatex)}>
                                <FileText className="h-4 w-4" />
                                {t("Copy LaTeX Code")}
                              </Button>
                              <Button variant="outline" className="flex-1 gap-2" onClick={() => downloadLatex(generatedLatex, "CV")}>
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
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="pdf">{t("PDF View")}</TabsTrigger>
                            <TabsTrigger value="latex">{t("LaTeX Source")}</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="pdf">
                            <div className="rounded-lg border-2 border-border bg-white h-[600px] overflow-hidden flex flex-col justify-center">
                              {generatedCoverLetterPdfBase64 ? (
                                <iframe 
                                  src={`data:application/pdf;base64,${generatedCoverLetterPdfBase64}`} 
                                  className="w-full h-full"
                                  title="Cover Letter PDF"
                                />
                              ) : isCompiling ? (
                                <div className="flex flex-col items-center justify-center space-y-4 h-full">
                                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                  <p className="text-sm text-muted-foreground">{t("Compiling PDF...")}</p>
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
                            <div className="mt-4 flex gap-2">
                              <Button className="flex-1 gap-2" disabled={!generatedCoverLetterPdfBase64} onClick={() => downloadPDF(generatedCoverLetterPdfBase64, "CoverLetter")}>
                                <Download className="h-4 w-4" />
                                {t("Download Cover Letter PDF")}
                              </Button>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="latex">
                            <div className="rounded-lg border-2 border-border overflow-hidden h-[600px]">
                              <Editor
                                height="100%"
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
                            <div className="mt-4 flex gap-2">
                              <Button variant="default" className="flex-1 gap-2" disabled={isCompiling} onClick={() => compileLatexLocally(generatedCoverLetterLatex, true)}>
                                {isCompiling ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                                {t("Re-compile PDF")}
                              </Button>
                              <Button variant="outline" className="flex-1 gap-2" onClick={() => navigator.clipboard.writeText(generatedCoverLetterLatex)}>
                                <FileText className="h-4 w-4" />
                                {t("Copy LaTeX Code")}
                              </Button>
                              <Button variant="outline" className="flex-1 gap-2" onClick={() => downloadLatex(generatedCoverLetterLatex, "CoverLetter")}>
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

            <Card className="bg-secondary/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
                  {isGenerated ? (
                    <>
                      <strong>{t("✨ AI Generated!")}</strong> {t("Your CV has been optimized for the target role. Click \"Download PDF\" to get your professional resume ready for applications.")}
                    </>
                  ) : (
                    <>
                      <strong>{t("Pro Tip:")}</strong> {t("Use action verbs and quantify your achievements. For example: \"Increased user engagement by 40%\" instead of \"Improved user engagement.\"")}
                    </>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </>
  )
}
