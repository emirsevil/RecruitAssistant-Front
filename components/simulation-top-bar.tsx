"use client"

import React, { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSimulation } from "@/lib/simulation-context"
import { useLanguage } from "@/lib/language-context"
import { useWorkspace } from "@/lib/workspace-context"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Circle, MoreHorizontal, Plus, Briefcase, FileText } from "lucide-react"

export function SimulationTopBar() {
  const { status, updateTargetInterviewCount } = useSimulation()
  const { language } = useLanguage()
  const { activeWorkspace } = useWorkspace()
  const pathname = usePathname()
  const router = useRouter()

  if (!status || !activeWorkspace) return null

  // We only show this bar on certain pages if needed, or globally.
  // The user said "simülasyon akışı için yukarıya bir progress par tarzı bir bar ekleyebiliriz"
  // Let's render it if we are in the main app layout.

  const isCvStage = status.stage === "cv_preparation"
  const isInterviewCycle = status.stage === "interview_cycle" || status.stage === "completed"

  const completedCount = status.total_feedbacks || 0
  const targetCount = status.stage === "completed" ? Math.max(completedCount, 1) : (status.target_interview_count || 3)

  // Construct stages
  const stages = []

  // 1. CV Stage
  const cvIsActive = pathname === "/cv-studio"
  const cvIsDone = status.cv_completed
  stages.push(
    <button
      key="cv"
      onClick={() => {
        if (!cvIsDone) router.push("/cv-studio")
      }}
      disabled={cvIsDone}
      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors text-sm font-medium border ${
        cvIsActive
          ? "border-sage bg-sage-soft text-sage"
          : cvIsDone
          ? "border-emerald-500/30 bg-emerald-50 text-emerald-700 cursor-not-allowed opacity-80"
          : "border-border bg-background hover:bg-muted text-muted-foreground"
      }`}
    >
      {cvIsDone ? <CheckCircle2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
      {language === "tr" ? "CV & Niyet Mektubu" : "CV & Cover Letter"}
    </button>
  )

  // 2. Interview Stages
  for (let i = 1; i <= targetCount; i++) {
    const isDone = i <= completedCount || status.stage === "completed"
    const isNext = !isDone && i === completedCount + 1 && isInterviewCycle
    const isLocked = isDone || i > completedCount + 1 || isCvStage

    stages.push(
      <React.Fragment key={`conn-${i}`}>
        <div className={`w-6 h-px ${isDone || isNext ? "bg-sage/40" : "bg-border"}`} />
        <button
          onClick={() => {
            if (!isLocked) router.push("/mock-interview")
          }}
          disabled={isLocked}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors text-sm font-medium border ${
            isDone
              ? "border-emerald-500/30 bg-emerald-50 text-emerald-700 cursor-not-allowed opacity-80"
              : isNext
              ? "border-sage bg-sage text-white"
              : "border-border bg-background text-muted-foreground opacity-60 cursor-not-allowed"
          }`}
        >
          {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
          {language === "tr" ? `Mülakat ${i}` : `Interview ${i}`}
        </button>
      </React.Fragment>
    )
  }

  // 3. Offer / Completed Stage
  stages.push(
    <React.Fragment key="offer">
      <div className={`w-6 h-px ${status.stage === "completed" ? "bg-sage/40" : "bg-border"}`} />
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors text-sm font-medium border ${
          status.stage === "completed"
            ? "border-emerald-500/30 bg-emerald-50 text-emerald-700"
            : "border-border bg-background text-muted-foreground opacity-60"
        }`}
      >
        {status.stage === "completed" ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
        {language === "tr" ? "Teklif Süreci" : "Offer Stage"}
      </div>
    </React.Fragment>
  )

  return (
    <div className="w-full bg-card border-b border-border shadow-sm sticky top-0 z-40 px-4 sm:px-6 py-3 flex items-center overflow-x-auto hide-scrollbar">
      <div className="flex items-center gap-1 min-w-max mx-auto">
        <div className="flex items-center font-serif text-sage/80 mr-4">
          <Briefcase className="w-4 h-4 mr-2" />
          <span className="font-medium tracking-tight">
            {language === "tr" ? "İşe Alım Simülasyonu" : "Recruitment Simulation"}
          </span>
        </div>
        
        {stages}
      </div>
    </div>
  )
}
