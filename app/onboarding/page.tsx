"use client"

import { useState, useEffect } from "react"
import { PageContainer } from "@/components/page-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ChevronRight, ChevronLeft, GraduationCap, Briefcase } from "lucide-react"
import { WorkspaceForm } from "@/components/workspace-form"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useWorkspace } from "@/lib/workspace-context"
import { useLanguage } from "@/lib/language-context"
import { toast } from "sonner"

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [isUpdating, setIsUpdating] = useState(false)
  const { user, updateProfile } = useAuth()
  const { createWorkspace, workspaces } = useWorkspace()
  const { t } = useLanguage()
  const router = useRouter()

  const [formData, setFormData] = useState({
    university: "",
    graduationYear: new Date().getFullYear().toString(),
    workspaceName: "",
    selectedEmoji: "💼",
    jobName: "",
    jobDescription: "",
  })

  // If user already has workspaces, redirect away
  useEffect(() => {
    if (workspaces.length > 0) {
      router.push("/dashboard")
    }
  }, [workspaces, router])

  const totalSteps = 2
  const progress = (step / totalSteps) * 100

  const handleNext = async () => {
    if (step === 1) {
      if (!formData.university || !formData.graduationYear) {
        toast.error(t("Please fill in all education details"))
        return
      }
      
      setIsUpdating(true)
      try {
        const educationString = `${formData.university}, ${formData.graduationYear}`
        await updateProfile({ education: educationString })
        setStep(2)
      } catch (error) {
        toast.error(t("Failed to update profile"))
      } finally {
        setIsUpdating(false)
      }
    }
  }

  const handleComplete = async () => {
    if (step === 2) {
      if (!formData.workspaceName.trim()) {
        toast.error(t("Please enter a workspace name"))
        return
      }

      setIsUpdating(true)
      try {
        await createWorkspace(
          formData.workspaceName.trim(),
          formData.selectedEmoji,
          {
            jobName: formData.jobName.trim() || undefined,
            jobDescription: formData.jobDescription.trim() || undefined,
          }
        )
        // Redirection will be handled by the guard or manually
        router.push("/dashboard")
      } catch (error) {
        toast.error(t("Failed to create workspace"))
      } finally {
        setIsUpdating(false)
      }
    }
  }

  return (
    <PageContainer>
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-8">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("Welcome to RecruitAssistant, {{name}}!").replace("{{name}}", user?.full_name || "")}
            </h1>
            <p className="text-muted-foreground">
              {t("Let's set up your profile and your first workspace.")}
            </p>
          </div>

          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="space-y-4">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span className={step === 1 ? "text-primary" : ""}>{t("1. Education")}</span>
                  <span className={step === 2 ? "text-primary" : ""}>{t("2. Workspace")}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{t("Where did you study?")}</CardTitle>
                      <CardDescription>{t("We use this to personalize your interview experience.")}</CardDescription>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="university">{t("University")}</Label>
                      <Input
                        id="university"
                        placeholder="e.g. Middle East Technical University"
                        className="h-12 rounded-xl"
                        value={formData.university}
                        onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="graduationYear">{t("Graduation Year")}</Label>
                      <Input
                        id="graduationYear"
                        type="number"
                        placeholder="2024"
                        className="h-12 rounded-xl"
                        value={formData.graduationYear}
                        onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{t("Configure your workspace")}</CardTitle>
                      <CardDescription>{t("What job are you preparing for right now?")}</CardDescription>
                    </div>
                  </div>

                  <WorkspaceForm
                    idPrefix="onboarding"
                    value={{
                      workspaceName: formData.workspaceName,
                      selectedEmoji: formData.selectedEmoji,
                      jobName: formData.jobName,
                      jobDescription: formData.jobDescription,
                    }}
                    onChange={(v) =>
                      setFormData({
                        ...formData,
                        workspaceName: v.workspaceName,
                        selectedEmoji: v.selectedEmoji,
                        jobName: v.jobName,
                        jobDescription: v.jobDescription,
                      })
                    }
                  />
                </div>
              )}

              <div className="mt-8 flex justify-between gap-4">
                {step === 2 && (
                  <Button 
                    variant="ghost" 
                    onClick={() => setStep(1)}
                    disabled={isUpdating}
                    className="rounded-xl h-12"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {t("Back")}
                  </Button>
                )}
                
                <div className="flex-1" />

                {step === 1 ? (
                  <Button 
                    className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/20"
                    onClick={handleNext}
                    disabled={isUpdating}
                  >
                    {isUpdating ? t("Saving...") : t("Next")}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/20"
                    onClick={handleComplete}
                    disabled={isUpdating || !formData.workspaceName.trim()}
                  >
                    {isUpdating ? t("Creating...") : t("Finalize and Explore")}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
