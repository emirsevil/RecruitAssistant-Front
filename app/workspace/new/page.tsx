"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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

export default function NewWorkspacePage() {
  const router = useRouter()
  const { createWorkspace } = useWorkspace()
  const { t } = useLanguage()
  const [values, setValues] = useState<WorkspaceFormValues>(emptyWorkspaceFormValues)

  const handleSubmit = async () => {
    const name = values.workspaceName.trim()
    if (!name) return
    try {
      await createWorkspace(name, values.selectedEmoji || undefined, {
        jobName: values.jobName.trim() || undefined,
        jobDescription: values.jobDescription.trim() || undefined,
      })
      router.push("/dashboard")
    } catch (error) {
      console.error("Failed to create workspace:", error)
      // Optional: Add toast notification here
    }
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
            <CardTitle className="text-2xl">{t("newWorkspacePageTitle")}</CardTitle>
            <CardDescription>{t("newWorkspacePageDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <WorkspaceForm idPrefix="new-ws" value={values} onChange={setValues} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard">{t("cancel")}</Link>
              </Button>
              <Button onClick={handleSubmit} disabled={!values.workspaceName.trim()}>
                {t("create")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
