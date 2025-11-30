"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { PageContainer } from "@/components/page-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { ChevronRight, ChevronLeft, Check } from "lucide-react"
import { useRouter } from "next/navigation"

const skills = [
  "Python",
  "Java",
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "SQL",
  "MongoDB",
  "AWS",
  "Docker",
  "Git",
  "Machine Learning",
  "Data Structures",
  "Algorithms",
  "System Design",
  "REST APIs",
]

const goals = [
  { id: "hr", label: "Ace HR interviews", description: "Practice behavioral questions and communication" },
  { id: "tech", label: "Improve technical interviews", description: "Master coding problems and system design" },
  { id: "cv", label: "Optimize my CV", description: "Create an ATS-friendly resume" },
  { id: "track", label: "Track my progress", description: "Monitor improvement over time" },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    university: "",
    graduationYear: new Date().getFullYear(),
    targetRole: "",
    selectedSkills: [] as string[],
    selectedGoals: [] as string[],
  })
  const router = useRouter()

  const totalSteps = 4
  const progress = (step / totalSteps) * 100

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skill)
        ? prev.selectedSkills.filter((s) => s !== skill)
        : [...prev.selectedSkills, skill],
    }))
  }

  const toggleGoal = (goalId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedGoals: prev.selectedGoals.includes(goalId)
        ? prev.selectedGoals.filter((g) => g !== goalId)
        : [...prev.selectedGoals, goalId],
    }))
  }

  const handleComplete = () => {
    // In a real app, save data to backend
    router.push("/dashboard")
  }

  return (
    <>
      <Navigation />
      <PageContainer>
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-8">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="mb-4">
                <Progress value={progress} className="h-2" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Step {step} of {totalSteps}
                </p>
              </div>
              <CardTitle className="text-2xl">
                {step === 1 && "Welcome to RecruitAssistant"}
                {step === 2 && "Tell us about your skills"}
                {step === 3 && "What are your goals?"}
                {step === 4 && "You're all set!"}
              </CardTitle>
              <CardDescription>
                {step === 1 && "Let's get to know you better"}
                {step === 2 && "Select all the skills you have"}
                {step === 3 && "Choose what you want to achieve"}
                {step === 4 && "Review your information"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="university">University</Label>
                    <Input
                      id="university"
                      placeholder="Massachusetts Institute of Technology"
                      value={formData.university}
                      onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="graduationYear">Graduation Year</Label>
                      <Input
                        id="graduationYear"
                        type="number"
                        placeholder="2024"
                        value={formData.graduationYear}
                        onChange={(e) => setFormData({ ...formData, graduationYear: Number.parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="targetRole">Target Role</Label>
                      <Input
                        id="targetRole"
                        placeholder="Software Engineer"
                        value={formData.targetRole}
                        onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Skills */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant={formData.selectedSkills.includes(skill) ? "default" : "outline"}
                        className="cursor-pointer px-3 py-1.5 text-sm transition-colors"
                        onClick={() => toggleSkill(skill)}
                      >
                        {formData.selectedSkills.includes(skill) && <Check className="mr-1 h-3 w-3" />}
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  {formData.selectedSkills.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {formData.selectedSkills.length} skill{formData.selectedSkills.length !== 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>
              )}

              {/* Step 3: Goals */}
              {step === 3 && (
                <div className="space-y-4">
                  {goals.map((goal) => (
                    <Card
                      key={goal.id}
                      className={`cursor-pointer transition-all ${
                        formData.selectedGoals.includes(goal.id)
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => toggleGoal(goal.id)}
                    >
                      <CardContent className="flex items-start gap-3 p-4">
                        <Checkbox checked={formData.selectedGoals.includes(goal.id)} className="mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium">{goal.label}</h4>
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Step 4: Summary */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <h3 className="mb-3 font-semibold">Your Profile</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Name:</dt>
                        <dd className="font-medium">{formData.name || "Not provided"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">University:</dt>
                        <dd className="font-medium">{formData.university || "Not provided"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Graduation:</dt>
                        <dd className="font-medium">{formData.graduationYear}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Target Role:</dt>
                        <dd className="font-medium">{formData.targetRole || "Not provided"}</dd>
                      </div>
                    </dl>
                  </div>

                  {formData.selectedSkills.length > 0 && (
                    <div>
                      <h3 className="mb-2 font-semibold">Selected Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {formData.selectedSkills.map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.selectedGoals.length > 0 && (
                    <div>
                      <h3 className="mb-2 font-semibold">Your Goals</h3>
                      <ul className="space-y-1 text-sm">
                        {formData.selectedGoals.map((goalId) => {
                          const goal = goals.find((g) => g.id === goalId)
                          return goal ? (
                            <li key={goalId} className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-primary" />
                              {goal.label}
                            </li>
                          ) : null
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-between gap-4">
                <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                {step < totalSteps ? (
                  <Button onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleComplete}>
                    Go to Dashboard
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  )
}
