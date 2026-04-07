"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { PageContainer } from "@/components/page-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"
import {
  WorkspaceForm,
  emptyWorkspaceFormValues,
  type WorkspaceFormValues,
} from "@/components/workspace-form"
import { useWorkspace } from "@/lib/workspace-context"
import { useLanguage } from "@/lib/language-context"

export default function EditWorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === "string" ? params.id : ""
  const { workspaces, isHydrated, updateWorkspace } = useWorkspace()
  const { t } = useLanguage()
  const [values, setValues] = useState<WorkspaceFormValues>(emptyWorkspaceFormValues)

  const workspace = workspaces.find((w) => w.id === id)

  useEffect(() => {
    if (!isHydrated) return
    if (!workspace) return
    setValues({
      workspaceName: workspace.name,
      selectedEmoji: workspace.emoji,
      jobName: workspace.jobName ?? "",
      jobDescription: workspace.jobDescription ?? "",
    })
  }, [isHydrated, workspace])

  useEffect(() => {
    if (!isHydrated) return
    if (workspaces.length > 0 && !workspace) {
      router.replace("/dashboard")
    }
  }, [isHydrated, workspaces.length, workspace, router])

  const handleSave = () => {
    const name = values.workspaceName.trim()
    if (!name || !workspace) return
    updateWorkspace(id, {
      name,
      emoji: values.selectedEmoji || workspace.emoji,
      jobName: values.jobName.trim() || undefined,
      jobDescription: values.jobDescription.trim() || undefined,
    })
    router.push("/dashboard")
  }

  if (!isHydrated) {
    return (
      <PageContainer>
        <div className="py-12 text-center text-muted-foreground text-sm">{t("loading")}</div>
      </PageContainer>
    )
  }

  if (!workspace) {
    return null
  }

  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl py-8">
        <Button variant="ghost" className="mb-4 -ml-2 gap-1" asChild>
          <Link href="/dashboard">
            <ChevronLeft className="h-4 w-4" />
            {t("workspaceBack")}
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t("editWorkspaceTitle")}</CardTitle>
            <CardDescription>{t("editWorkspaceDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <WorkspaceForm idPrefix={`edit-${id}`} value={values} onChange={setValues} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard">{t("cancel")}</Link>
              </Button>
              <Button onClick={handleSave} disabled={!values.workspaceName.trim()}>
                {t("Save")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
