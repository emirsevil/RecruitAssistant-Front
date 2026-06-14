"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"

export const WORKSPACE_EMOJIS = ["💼", "🚀", "🎯", "📊", "🔬", "🏗️", "💡", "🎨"]

export type WorkspaceFormValues = {
  workspaceName: string
  selectedEmoji: string
  jobName: string
  jobDescription: string
}

type WorkspaceFormProps = {
  value: WorkspaceFormValues
  onChange: (next: WorkspaceFormValues) => void
  idPrefix?: string
}

export function WorkspaceForm({ value, onChange, idPrefix = "ws" }: WorkspaceFormProps) {
  const { t } = useLanguage()
  const emoji = value.selectedEmoji || "💼"

  const patch = (partial: Partial<WorkspaceFormValues>) => {
    onChange({ ...value, ...partial })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-workspaceName`}>{t("workspaceName")}</Label>
        <Input
          id={`${idPrefix}-workspaceName`}
          placeholder={t("workspaceNamePlaceholder")}
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
    selectedEmoji: "💼",
    jobName: "",
    jobDescription: "",
  }
}
