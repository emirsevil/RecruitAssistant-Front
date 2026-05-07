"use client"

import { useMemo } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SearchableSelect, type SelectOption } from "@/components/ui/searchable-select"
import { COMPANIES } from "@/lib/data/companies"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"

export const WORKSPACE_EMOJIS = ["💼", "🚀", "🎯", "📊", "🔬", "🏗️", "💡", "🎨"]

export type WorkspaceFormValues = {
  workspaceName: string
  company: string
  selectedEmoji: string
  jobName: string
  jobDescription: string
}

type WorkspaceFormProps = {
  value: WorkspaceFormValues
  onChange: (next: WorkspaceFormValues) => void
  idPrefix?: string
  showCompany?: boolean
}

const COMPANY_OPTIONS: SelectOption[] = COMPANIES.map((c) => ({
  value: c.name,
  label: c.name,
  group: c.category,
}))

export function WorkspaceForm({ value, onChange, idPrefix = "ws", showCompany = false }: WorkspaceFormProps) {
  const { t, language } = useLanguage()
  const emoji = value.selectedEmoji || "💼"

  const patch = (partial: Partial<WorkspaceFormValues>) => {
    onChange({ ...value, ...partial })
  }

  const workspaceNamePlaceholder = useMemo(() => {
    if (!showCompany) return t("workspaceNamePlaceholder")
    if (value.company) {
      return `${value.company}${value.jobName ? ` · ${value.jobName}` : ""}`
    }
    return language === "tr" ? "ör. Trendyol — Backend" : "e.g. Trendyol — Backend"
  }, [showCompany, value.company, value.jobName, language, t])

  return (
    <div className="space-y-4">
      {showCompany && (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-company`}>{t("Company")}</Label>
          <SearchableSelect
            options={COMPANY_OPTIONS}
            value={value.company}
            onChange={(v) => patch({ company: v })}
            onSelectOther={(typed) => patch({ company: typed })}
            placeholder={language === "tr" ? "Şirket seçin..." : "Select a company..."}
            searchPlaceholder={language === "tr" ? "Şirket ara..." : "Search company..."}
            emptyText={language === "tr" ? "Sonuç yok." : "No matches."}
            otherLabel={t("Other")}
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-workspaceName`}>{t("workspaceName")}</Label>
        <Input
          id={`${idPrefix}-workspaceName`}
          placeholder={workspaceNamePlaceholder}
          value={value.workspaceName}
          onChange={(e) => patch({ workspaceName: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-jobName`}>{t("jobName")}</Label>
        <Input
          id={`${idPrefix}-jobName`}
          placeholder={t("jobNamePlaceholder")}
          value={value.jobName}
          onChange={(e) => patch({ jobName: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-jobDescription`}>{t("jobDescription")}</Label>
        <Textarea
          id={`${idPrefix}-jobDescription`}
          placeholder={t("jobDescriptionPlaceholder")}
          value={value.jobDescription}
          onChange={(e) => patch({ jobDescription: e.target.value })}
          className="min-h-[100px] resize-none"
        />
      </div>
      <div className="space-y-2">
        <Label>{t("pickEmoji")}</Label>
        <div className="flex flex-wrap gap-2">
          {WORKSPACE_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => patch({ selectedEmoji: e })}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg border-2 text-lg transition-colors",
                emoji === e ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function emptyWorkspaceFormValues(): WorkspaceFormValues {
  return {
    workspaceName: "",
    company: "",
    selectedEmoji: "💼",
    jobName: "",
    jobDescription: "",
  }
}
