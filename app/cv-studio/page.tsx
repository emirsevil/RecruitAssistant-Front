"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { PageContainer, PageHeader } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Download, Sparkles, RotateCcw, Save, Plus, Trash2, AlertCircle } from "lucide-react"

export default function CVStudioPage() {
  const [cvData, setCvData] = useState({
    name: "Deniz Yilmaz",
    email: "deniz@example.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    summary:
      "Recent Computer Science graduate with strong problem-solving skills and experience in full-stack development.",
    education: [
      {
        degree: "Bachelor of Science in Computer Science",
        school: "Stanford University",
        gpa: "3.8",
        startDate: "2020",
        endDate: "2024",
      },
    ],
    experience: [
      {
        role: "Software Engineering Intern",
        company: "TechCorp",
        bullets: [
          "Developed RESTful APIs using Node.js and Express, improving response time by 30%",
          "Collaborated with cross-functional team of 5 engineers on microservices architecture",
        ],
        startDate: "Jun 2023",
        endDate: "Aug 2023",
      },
    ],
    projects: [
      {
        title: "Task Management App",
        techStack: "React, Node.js, MongoDB",
        description:
          "Built a full-stack web application for team task management with real-time updates using WebSockets",
      },
    ],
    skills: ["JavaScript", "TypeScript", "React", "Node.js", "Python", "SQL", "Git", "AWS"],
    targetJob: "Software Engineer - Full Stack",
  })

  const [atsScore] = useState(78)
  const [roleMatch] = useState(85)
  const [missingSkills] = useState(["Docker", "Kubernetes", "GraphQL"])

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

  return (
    <>
      <Navigation />
      <PageContainer>
        <PageHeader title="CV Studio" description="Build and optimize your resume with AI assistance" />

        <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
          {/* Input Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={cvData.name}
                      onChange={(e) => setCvData({ ...cvData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={cvData.email}
                      onChange={(e) => setCvData({ ...cvData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={cvData.phone}
                      onChange={(e) => setCvData({ ...cvData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={cvData.location}
                      onChange={(e) => setCvData({ ...cvData, location: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="summary">Professional Summary</Label>
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
                <CardTitle>Education</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cvData.education.map((edu, idx) => (
                  <div key={idx} className="space-y-4 rounded-lg border border-border p-4">
                    <div className="space-y-2">
                      <Label>Degree</Label>
                      <Input value={edu.degree} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>School</Label>
                        <Input value={edu.school} />
                      </div>
                      <div className="space-y-2">
                        <Label>GPA</Label>
                        <Input value={edu.gpa} />
                      </div>
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input value={edu.startDate} />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input value={edu.endDate} />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Experience</CardTitle>
                  <Button onClick={addExperience} size="sm" variant="outline" className="gap-2 bg-transparent">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {cvData.experience.map((exp, idx) => (
                  <div key={idx} className="space-y-4 rounded-lg border border-border p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Input value={exp.role} placeholder="Software Engineer" />
                      </div>
                      <div className="space-y-2">
                        <Label>Company</Label>
                        <Input value={exp.company} placeholder="Tech Company Inc." />
                      </div>
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input value={exp.startDate} placeholder="Jan 2023" />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input value={exp.endDate} placeholder="Present" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Responsibilities & Achievements</Label>
                      {exp.bullets.map((bullet, bulletIdx) => (
                        <Textarea
                          key={bulletIdx}
                          value={bullet}
                          className="min-h-[60px]"
                          placeholder="• Developed features that improved..."
                        />
                      ))}
                      <Button size="sm" variant="ghost" className="gap-2">
                        <Plus className="h-3 w-3" />
                        Add bullet point
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Projects</CardTitle>
                  <Button onClick={addProject} size="sm" variant="outline" className="gap-2 bg-transparent">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {cvData.projects.map((project, idx) => (
                  <div key={idx} className="space-y-4 rounded-lg border border-border p-4">
                    <div className="space-y-2">
                      <Label>Project Title</Label>
                      <Input value={project.title} placeholder="E-commerce Platform" />
                    </div>
                    <div className="space-y-2">
                      <Label>Tech Stack</Label>
                      <Input value={project.techStack} placeholder="React, Node.js, MongoDB" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={project.description}
                        className="min-h-[80px]"
                        placeholder="Built a full-stack application that..."
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {cvData.skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1 px-3 py-1.5">
                      {skill}
                      <Trash2 className="h-3 w-3 cursor-pointer" />
                    </Badge>
                  ))}
                  <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                    <Plus className="h-3 w-3" />
                    Add skill
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Target Job Description</CardTitle>
                <CardDescription>Paste the job description to optimize your CV</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={cvData.targetJob}
                  onChange={(e) => setCvData({ ...cvData, targetJob: e.target.value })}
                  className="min-h-[120px]"
                  placeholder="Paste the full job description here..."
                />
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button className="flex-1 gap-2">
                <Sparkles className="h-4 w-4" />
                Generate CV Draft
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
          </div>

          {/* Preview & Analysis */}
          <div className="space-y-6">
            {/* CV Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">CV Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">ATS Score</span>
                    <span className="text-2xl font-bold text-primary">{atsScore}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-primary transition-all" style={{ width: `${atsScore}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">Good! Your CV is well-formatted for ATS systems</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Role Match</span>
                    <span className="text-2xl font-bold text-primary">{roleMatch}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-primary transition-all" style={{ width: `${roleMatch}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">Great alignment with the target role</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    Missing Skills
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
                <CardTitle className="text-lg">Live Preview</CardTitle>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" title="Regenerate">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" title="Download PDF">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
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
                      <h3 className="mb-2 text-sm font-bold uppercase">Summary</h3>
                      <p className="text-xs leading-relaxed text-gray-700 text-pretty">{cvData.summary}</p>
                    </div>

                    <div>
                      <h3 className="mb-2 text-sm font-bold uppercase">Experience</h3>
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
                      <h3 className="mb-2 text-sm font-bold uppercase">Projects</h3>
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
                      <h3 className="mb-2 text-sm font-bold uppercase">Education</h3>
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
                      <h3 className="mb-2 text-sm font-bold uppercase">Skills</h3>
                      <p className="text-xs text-gray-700">{cvData.skills.join(" • ")}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-secondary/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
                  <strong>Pro Tip:</strong> Use action verbs and quantify your achievements. For example: "Increased
                  user engagement by 40%" instead of "Improved user engagement."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </>
  )
}
