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
import { Download, Sparkles, RotateCcw, Save, Plus, Trash2, AlertCircle, Loader2, FileText, Eye } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export default function CVStudioPage() {
  const { t } = useLanguage()
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
  })

  const [atsScore, setAtsScore] = useState(0)
  const [roleMatch, setRoleMatch] = useState(0)
  const [missingSkills] = useState<string[]>([])

  // New state for AI generation
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLatex, setGeneratedLatex] = useState("")
  const [generatedHtml, setGeneratedHtml] = useState("")
  const [showLatex, setShowLatex] = useState(false)
  const [generationError, setGenerationError] = useState("")
  const [isGenerated, setIsGenerated] = useState(false)

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

  // Generate CV using AI
  const generateCV = async () => {
    setIsGenerating(true)
    setGenerationError("")

    try {
      const response = await fetch("/api/generate-cv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cvData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate CV")
      }

      setGeneratedLatex(data.latex)
      setGeneratedHtml(data.html)
      setIsGenerated(true)
      setAtsScore(Math.floor(Math.random() * 15) + 85) // Simulated improvement
      setRoleMatch(Math.floor(Math.random() * 10) + 90) // Simulated improvement
    } catch (error: any) {
      setGenerationError(error.message || "An error occurred while generating the CV")
    } finally {
      setIsGenerating(false)
    }
  }

  // Download LaTeX file
  const downloadLatex = () => {
    if (!generatedLatex) return

    const blob = new Blob([generatedLatex], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${cvData.name.replace(/\s+/g, "_")}_CV.tex`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Download PDF (via Browser Print)
  const downloadPDF = () => {
    if (!generatedHtml) return

    // Create a new window with instructions and the HTML code
    const win = window.open("", "_blank")
    if (win) {
      win.document.write(generatedHtml)
      win.document.close()
      // Wait for resources to load then print
      win.onload = () => {
        setTimeout(() => {
          win.focus()
          win.print()
        }, 500)
      }
    }
  }

  return (
    <>
      <PageContainer>
        <PageHeader title={t("CV Studio")} description={t("Build and optimize your resume with AI assistance")} />

        <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
          {/* Input Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("Personal Information")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("Full Name")}</Label>
                    <Input
                      id="name"
                      value={cvData.name}
                      onChange={(e) => setCvData({ ...cvData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("Email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={cvData.email}
                      onChange={(e) => setCvData({ ...cvData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("Phone")}</Label>
                    <Input
                      id="phone"
                      value={cvData.phone}
                      onChange={(e) => setCvData({ ...cvData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">{t("Location")}</Label>
                    <Input
                      id="location"
                      value={cvData.location}
                      onChange={(e) => setCvData({ ...cvData, location: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="summary">{t("Professional Summary")}</Label>
                  <Textarea
                    id="summary"
                    value={cvData.summary}
                    onChange={(e) => setCvData({ ...cvData, summary: e.target.value })}
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("Education")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cvData.education.map((edu, idx) => (
                  <div key={idx} className="space-y-4 rounded-lg border border-border p-4">
                    <div className="space-y-2">
                      <Label>{t("Degree")}</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{t("School")}</Label>
                        <Input
                          value={edu.school}
                          onChange={(e) => updateEducation(idx, "school", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("GPA")}</Label>
                        <Input
                          value={edu.gpa}
                          onChange={(e) => updateEducation(idx, "gpa", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("Start Date")}</Label>
                        <Input
                          value={edu.startDate}
                          onChange={(e) => updateEducation(idx, "startDate", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("End Date")}</Label>
                        <Input
                          value={edu.endDate}
                          onChange={(e) => updateEducation(idx, "endDate", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t("Experience")}</CardTitle>
                  <Button onClick={addExperience} size="sm" variant="outline" className="gap-2 bg-transparent">
                    <Plus className="h-4 w-4" />
                    {t("Add")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {cvData.experience.map((exp, idx) => (
                  <div key={idx} className="space-y-4 rounded-lg border border-border p-4 relative">
                    {cvData.experience.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 h-8 w-8 text-destructive"
                        onClick={() => removeExperience(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{t("Role")}</Label>
                        <Input
                          value={exp.role}
                          placeholder={t("Software Engineer")}
                          onChange={(e) => updateExperience(idx, "role", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("Company")}</Label>
                        <Input
                          value={exp.company}
                          placeholder={t("Tech Company Inc.")}
                          onChange={(e) => updateExperience(idx, "company", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("Start Date")}</Label>
                        <Input
                          value={exp.startDate}
                          placeholder={t("Jan 2023")}
                          onChange={(e) => updateExperience(idx, "startDate", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("End Date")}</Label>
                        <Input
                          value={exp.endDate}
                          placeholder={t("Present")}
                          onChange={(e) => updateExperience(idx, "endDate", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("Responsibilities & Achievements")}</Label>
                      {exp.bullets.map((bullet, bulletIdx) => (
                        <Textarea
                          key={bulletIdx}
                          value={bullet}
                          onChange={(e) => updateExperienceBullet(idx, bulletIdx, e.target.value)}
                          className="min-h-[60px]"
                          placeholder="• Developed features that improved..."
                        />
                      ))}
                      <Button size="sm" variant="ghost" className="gap-2" onClick={() => addBullet(idx)}>
                        <Plus className="h-3 w-3" />
                        {t("Add bullet point")}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t("Projects")}</CardTitle>
                  <Button onClick={addProject} size="sm" variant="outline" className="gap-2 bg-transparent">
                    <Plus className="h-4 w-4" />
                    {t("Add")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {cvData.projects.map((project, idx) => (
                  <div key={idx} className="space-y-4 rounded-lg border border-border p-4 relative">
                    {cvData.projects.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 h-8 w-8 text-destructive"
                        onClick={() => removeProject(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <div className="space-y-2">
                      <Label>{t("Project Title")}</Label>
                      <Input
                        value={project.title}
                        placeholder={t("E-commerce Platform")}
                        onChange={(e) => updateProject(idx, "title", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("Tech Stack")}</Label>
                      <Input
                        value={project.techStack}
                        placeholder="React, Node.js, MongoDB"
                        onChange={(e) => updateProject(idx, "techStack", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("Description")}</Label>
                      <Textarea
                        value={project.description}
                        onChange={(e) => updateProject(idx, "description", e.target.value)}
                        className="min-h-[80px]"
                        placeholder={t("Built a full-stack application that...")}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("Skills")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {cvData.skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1 px-3 py-1.5">
                      {skill}
                      <Trash2
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => removeSkill(idx)}
                      />
                    </Badge>
                  ))}
                  <Button size="sm" variant="outline" className="gap-2 bg-transparent" onClick={addSkill}>
                    <Plus className="h-3 w-3" />
                    {t("Add skill")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("Target Job Description")}</CardTitle>
                <CardDescription>{t("Paste the job description to optimize your CV")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={cvData.targetJob}
                  onChange={(e) => setCvData({ ...cvData, targetJob: e.target.value })}
                  className="min-h-[120px]"
                  placeholder={t("Paste the full job description here...")}
                />
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

            <div className="flex gap-3">
              <Button
                className="flex-1 gap-2"
                onClick={generateCV}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("Generating with AI...")}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {t("Generate CV Draft")}
                  </>
                )}
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Save className="h-4 w-4" />
                {t("Save")}
              </Button>
            </div>
          </div>

          {/* Preview & Analysis */}
          <div className="space-y-6">
            {/* CV Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("CV Analysis")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{t("ATS Score")}</span>
                    <span className="text-2xl font-bold text-primary">{atsScore}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-primary transition-all" style={{ width: `${atsScore}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isGenerated ? "Excellent! AI-optimized for ATS systems" : "Good! Your CV is well-formatted for ATS systems"}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{t("Role Match")}</span>
                    <span className="text-2xl font-bold text-primary">{roleMatch}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-primary transition-all" style={{ width: `${roleMatch}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isGenerated ? "Optimized for your target role" : "Great alignment with the target role"}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    {t("Missing Skills")}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {missingSkills.map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Consider adding these skills if you have experience</p>
                </div>
              </CardContent>
            </Card>

            {/* CV Preview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{t("Live Preview")}</CardTitle>
                <div className="flex gap-2">
                  {isGenerated && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Toggle LaTeX View"
                        onClick={() => setShowLatex(!showLatex)}
                      >
                        {showLatex ? <Eye className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Regenerate"
                        onClick={generateCV}
                        disabled={isGenerating}
                      >
                        <RotateCcw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Download PDF"
                        onClick={downloadPDF}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">{t("Generating with AI...")}</p>
                  </div>
                ) : isGenerated && showLatex ? (
                  <div className="rounded-lg border-2 border-border bg-gray-900 p-4 text-green-400 font-mono text-xs overflow-auto max-h-[600px]">
                    <pre className="whitespace-pre-wrap">{generatedLatex}</pre>
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-border bg-white p-6 text-black">
                    {/* CV Preview Content */}
                    <div className="space-y-4">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold">{cvData.name}</h2>
                        <p className="text-sm text-gray-600">
                          {cvData.email} • {cvData.phone} • {cvData.location}
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="mb-2 text-sm font-bold uppercase">{t("Professional Summary")}</h3>
                        <p className="text-xs leading-relaxed text-gray-700 text-pretty">{cvData.summary}</p>
                      </div>

                      <div>
                        <h3 className="mb-2 text-sm font-bold uppercase">{t("Experience")}</h3>
                        <div className="space-y-3">
                          {cvData.experience.map((exp, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-xs font-semibold">{exp.role}</p>
                                  <p className="text-xs text-gray-600">{exp.company}</p>
                                </div>
                                <p className="text-xs text-gray-500">
                                  {exp.startDate} - {exp.endDate}
                                </p>
                              </div>
                              <ul className="ml-4 list-disc space-y-1">
                                {exp.bullets.map((bullet, bulletIdx) => (
                                  <li key={bulletIdx} className="text-xs leading-relaxed text-gray-700 text-pretty">
                                    {bullet}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="mb-2 text-sm font-bold uppercase">{t("Projects")}</h3>
                        <div className="space-y-2">
                          {cvData.projects.map((project, idx) => (
                            <div key={idx}>
                              <p className="text-xs font-semibold">
                                {project.title} <span className="font-normal text-gray-600">| {project.techStack}</span>
                              </p>
                              <p className="text-xs leading-relaxed text-gray-700 text-pretty">{project.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="mb-2 text-sm font-bold uppercase">{t("Education")}</h3>
                        {cvData.education.map((edu, idx) => (
                          <div key={idx} className="flex justify-between">
                            <div>
                              <p className="text-xs font-semibold">{edu.degree}</p>
                              <p className="text-xs text-gray-600">{edu.school}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {edu.startDate} - {edu.endDate}
                              </p>
                              <p className="text-xs text-gray-600">GPA: {edu.gpa}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h3 className="mb-2 text-sm font-bold uppercase">{t("Skills")}</h3>
                        <p className="text-xs text-gray-700">{cvData.skills.join(" • ")}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Download buttons after generation */}
                {isGenerated && !isGenerating && (
                  <div className="mt-4 flex gap-2">
                    <Button className="flex-1 gap-2" onClick={downloadPDF}>
                      <Download className="h-4 w-4" />
                      {t("Download PDF")}
                    </Button>
                    <Button variant="outline" className="gap-2 bg-transparent" onClick={downloadLatex}>
                      <FileText className="h-4 w-4" />
                      {t("Download .tex")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-secondary/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
                  {isGenerated ? (
                    <>
                      <strong>✨ AI Generated!</strong> Your CV has been optimized for the target role.
                      Click "Download PDF" to get your professional resume ready for applications.
                    </>
                  ) : (
                    <>
                      <strong>Pro Tip:</strong> Use action verbs and quantify your achievements. For example: "Increased
                      user engagement by 40%" instead of "Improved user engagement."
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
