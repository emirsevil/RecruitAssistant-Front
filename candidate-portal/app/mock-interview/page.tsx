"use client"

import { Suspense } from "react"
import MockInterviewClient from "./MockInterviewClient"
import { useLanguage } from "@/lib/language-context"

function Loading() {
  const { t } = useLanguage()
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-muted-foreground">{t("Loading...")}</div>
    </div>
  )
}

export default function MockInterviewPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MockInterviewClient />
    </Suspense>
  )
}
