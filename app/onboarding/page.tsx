"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, ChevronLeft, Sparkles, Upload, GraduationCap } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useWorkspace } from "@/lib/workspace-context"
import { useLanguage } from "@/lib/language-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { SearchableSelect, type SelectOption } from "@/components/ui/searchable-select"
import { COMPANIES } from "@/lib/data/companies"

// Static at module load — the dataset doesn't change between renders.
const COMPANY_OPTIONS: SelectOption[] = COMPANIES.map((c) => ({
  value: c.name,
  label: c.name,
  group: c.category,
}))

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [isUpdating, setIsUpdating] = useState(false)
  const { user, updateProfile } = useAuth()
  const { createWorkspace, workspaces } = useWorkspace()
  const { t, language } = useLanguage()
  const router = useRouter()

  const [formData, setFormData] = useState({
    university: "",
    graduationYear: new Date().getFullYear().toString(),
    workspaceName: "",
    company: "",
    jobName: "",
    jobDescription: "",
  })

  useEffect(() => {
    if (workspaces.length > 0) router.push("/dashboard")
  }, [workspaces, router])

  const totalSteps = 3
  const stepLabel = (n: number) =>
    language === "tr" ? `Adım ${n} / ${totalSteps}` : `Step ${n} of ${totalSteps}`

  // Naive skill extraction from JD: take Capitalized tokens
  const extractedSkills = formData.jobDescription
    ? Array.from(
        new Set(
          formData.jobDescription
            .split(/[^A-Za-z+#.]+/)
            .filter((w) => w.length > 1 && /^[A-Z]/.test(w))
            .slice(0, 7)
        )
      )
    : []

  const goNext = async () => {
    if (step === 1) {
      if (!formData.university) {
        toast.error(t("Please fill in all education details"))
        return
      }
      setIsUpdating(true)
      try {
        await updateProfile({
          education: `${formData.university}, ${formData.graduationYear}`,
        })
        setStep(2)
      } catch {
        toast.error(t("Failed to update profile"))
      } finally {
        setIsUpdating(false)
      }
      return
    }
    if (step === 2) {
      if (!formData.company.trim() || !formData.jobName.trim()) {
        toast.error(t("Please fill in all education details"))
        return
      }
      setStep(3)
      return
    }
    if (step === 3) {
      setIsUpdating(true)
      try {
        const wsName = formData.workspaceName.trim() || formData.company.trim()
        await createWorkspace(wsName, "💼", {
          jobName: formData.jobName.trim() || undefined,
          jobDescription: formData.jobDescription.trim() || undefined,
        })
        router.push("/dashboard")
      } catch {
        toast.error(t("Failed to create workspace"))
      } finally {
        setIsUpdating(false)
      }
    }
  }

  const goBack = () => {
    if (step > 1) setStep((s) => s - 1)
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-[760px]">
        {/* Logo */}
        <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-serif text-sm font-semibold text-primary-foreground">
            R
          </span>
          <span className="font-serif text-[17px] tracking-tight">
            Recruit<span className="italic">Assistant</span>
          </span>
        </Link>

        {/* Eyebrow */}
        <p className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-clay">
          {stepLabel(step)}
        </p>

        {/* Headline */}
        <h1 className="serif-headline text-[44px] font-normal leading-[1.1] tracking-tight">
          {step === 1 && (
            <>
              {language === "tr" ? "Tanışalım" : "Let's get to know you"}
              {user?.full_name ? (
                <>, <em className="italic">{user.full_name.split(" ")[0]}</em></>
              ) : null}
              .
            </>
          )}
          {step === 2 && (language === "tr" ? "Hedef rolünü anlat." : "Tell us your target role.")}
          {step === 3 &&
            (language === "tr" ? "Son rötuşları yapalım." : "Let's add a few finishing touches.")}
        </h1>
        <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-muted-foreground">
          {language === "tr"
            ? "Şirket ve iş tanımına göre senin için kişiselleştirilmiş mülakatlar, testler ve CV önerileri hazırlıyoruz."
            : "We use this to personalize your mock interviews, quizzes, and CV suggestions for the job you're aiming at."}
        </p>

        {/* Progress bars */}
        <div className="mt-7 mb-7 flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-[3px] flex-1 rounded-full",
                i < step ? "bg-sage" : "bg-secondary"
              )}
            />
          ))}
        </div>

        {/* Step card */}
        <div className="rounded-2xl border border-border bg-card p-7">
          {step === 1 && (
            <div className="space-y-5">
              <div className="mb-1 flex items-center gap-2 whitespace-nowrap">
                <GraduationCap className="h-4 w-4 flex-shrink-0 text-sage" />
                <span className="text-[12px] font-semibold">
                  {language === "tr" ? "Eğitim bilgisi" : "Education"}
                </span>
              </div>
              <Field
                label={language === "tr" ? "Üniversite" : "University"}
                value={formData.university}
                onChange={(v) => setFormData({ ...formData, university: v })}
                placeholder={
                  language === "tr"
                    ? "ör. Bilkent Üniversitesi"
                    : "e.g. Bilkent University"
                }
              />
              <Field
                label={language === "tr" ? "Mezuniyet yılı" : "Graduation year"}
                value={formData.graduationYear}
                onChange={(v) => setFormData({ ...formData, graduationYear: v })}
                placeholder="2026"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-[12px] font-semibold">
                    {language === "tr" ? "Şirket" : "Company"}
                  </p>
                  <SearchableSelect
                    options={COMPANY_OPTIONS}
                    value={formData.company}
                    onChange={(v) => setFormData({ ...formData, company: v })}
                    onSelectOther={(typed) =>
                      setFormData({ ...formData, company: typed })
                    }
                    placeholder={
                      language === "tr" ? "Şirket seçin..." : "Select a company..."
                    }
                    searchPlaceholder={
                      language === "tr" ? "Şirket ara..." : "Search company..."
                    }
                    emptyText={
                      language === "tr" ? "Sonuç yok." : "No matches."
                    }
                    otherLabel={language === "tr" ? "Diğer" : "Other"}
                  />
                </div>
                <Field
                  label={language === "tr" ? "Pozisyon" : "Role"}
                  value={formData.jobName}
                  onChange={(v) => setFormData({ ...formData, jobName: v })}
                  placeholder={
                    language === "tr"
                      ? "ör. Junior Backend Engineer"
                      : "e.g. Junior Backend Engineer"
                  }
                />
              </div>

              <div>
                <p className="mb-2 text-[12px] font-semibold">
                  {language === "tr" ? "İş tanımı" : "Job description"}
                </p>
                <Textarea
                  value={formData.jobDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, jobDescription: e.target.value })
                  }
                  placeholder={
                    language === "tr"
                      ? "İş ilanını buraya yapıştırın. Anahtar yetenekleri çıkarıp ona göre hazırlık planı oluşturacağız."
                      : "Paste the job description here. We'll extract the key skills and prepare your plan accordingly."
                  }
                  className="min-h-[140px] resize-none rounded-lg border-border bg-background text-[13px] leading-relaxed"
                />
              </div>

              {extractedSkills.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2 whitespace-nowrap">
                    <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-clay" />
                    <span className="text-[12px] font-semibold">
                      {language === "tr" ? "Çıkarılan yetenekler" : "Extracted skills"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedSkills.map((s) => (
                      <span
                        key={s}
                        className="whitespace-nowrap rounded-full bg-sage-soft px-2.5 py-1 text-[12px] font-medium text-sage"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <Field
                label={language === "tr" ? "Çalışma alanı adı" : "Workspace name"}
                value={formData.workspaceName}
                onChange={(v) => setFormData({ ...formData, workspaceName: v })}
                placeholder={
                  formData.company
                    ? `${formData.company} · ${formData.jobName || ""}`
                    : language === "tr"
                      ? "ör. Trendyol — Backend"
                      : "e.g. Trendyol — Backend"
                }
              />

              <div className="rounded-xl border border-dashed border-strong bg-secondary/40 p-4">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-card text-clay">
                    <Upload className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold">
                      {language === "tr" ? "CV ekle (opsiyonel)" : "Add your CV (optional)"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {language === "tr"
                        ? "PDF veya DOCX yükleyin — geri bildirim ve CV stüdyosu için kullanılır."
                        : "Upload a PDF or DOCX — we'll use it for feedback and CV studio."}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="whitespace-nowrap rounded-lg border border-strong bg-card px-3.5 py-2 text-[12px] font-semibold transition-colors hover:bg-secondary"
                  >
                    {language === "tr" ? "CV yükle" : "Upload CV"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-7 flex items-center justify-between">
            {step > 1 ? (
              <Button
                variant="ghost"
                onClick={goBack}
                disabled={isUpdating}
                className="text-muted-foreground"
              >
                <ChevronLeft className="mr-1.5 h-4 w-4" />
                {t("Back")}
              </Button>
            ) : (
              <span />
            )}

            <Button
              onClick={goNext}
              disabled={isUpdating}
              className="rounded-lg bg-primary px-5 text-primary-foreground hover:bg-primary/90"
            >
              {isUpdating
                ? language === "tr"
                  ? "Kaydediliyor..."
                  : "Saving..."
                : step < 3
                  ? language === "tr"
                    ? "Devam"
                    : "Continue"
                  : language === "tr"
                    ? "Bitir ve Keşfet"
                    : "Finalize and Explore"}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-semibold">{label}</p>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-lg border-border bg-background text-[14px]"
      />
    </div>
  )
}
