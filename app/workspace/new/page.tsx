"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PageContainer } from "@/components/page-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ChevronLeft,
  Sparkles,
  X,
  Plus,
  Search,
  Check,
  Loader2,
  Brain,
  ArrowRight,
  Tag,
} from "lucide-react"
import {
  WorkspaceForm,
  emptyWorkspaceFormValues,
  type WorkspaceFormValues,
} from "@/components/workspace-form"
import { useWorkspace } from "@/lib/workspace-context"
import { useLanguage } from "@/lib/language-context"
import { toast } from "sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function NewWorkspacePage() {
  const router = useRouter()
  const { createWorkspace } = useWorkspace()
  const { t } = useLanguage()
  const [values, setValues] = useState<WorkspaceFormValues>(emptyWorkspaceFormValues)

  // 2-step flow state
  const [step, setStep] = useState<1 | 2>(1)
  const [isCreating, setIsCreating] = useState(false)
  const [createdWorkspaceId, setCreatedWorkspaceId] = useState<string | null>(null)

  // Category state (step 2)
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Step 1: Create workspace
  const handleCreateWorkspace = async () => {
    const name = values.workspaceName.trim()
    if (!name) return

    setIsCreating(true)
    try {
      const { workspace, suggestedCategories: cats } = await createWorkspace(
        name,
        values.selectedEmoji || undefined,
        {
          jobName: values.jobName.trim() || undefined,
          jobDescription: values.jobDescription.trim() || undefined,
        }
      )
      setCreatedWorkspaceId(workspace.id)
      setSuggestedCategories(cats)
      setSelectedCategories([...cats]) // Pre-select all suggested
      setStep(2)
    } catch (error) {
      console.error("Failed to create workspace:", error)
      toast.error(t("Failed to create workspace"))
    } finally {
      setIsCreating(false)
    }
  }

  // Search categories from DB
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(
          `${API_BASE_URL}/workspaces/categories/search?q=${encodeURIComponent(searchQuery)}`,
          { credentials: "include" }
        )
        if (res.ok) {
          const data = await res.json()
          // Filter out already selected
          setSearchResults(
            data.filter((c: string) => !selectedCategories.includes(c))
          )
        }
      } catch {
        // ignore
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [searchQuery, selectedCategories])

  const addCategory = (cat: string) => {
    const trimmed = cat.trim()
    if (!trimmed) return
    if (selectedCategories.includes(trimmed)) return
    if (selectedCategories.length >= 10) {
      toast.error(t("Maximum 10 categories allowed"))
      return
    }
    setSelectedCategories((prev) => [...prev, trimmed])
    setSearchQuery("")
    setSearchResults([])
  }

  const removeCategory = (cat: string) => {
    setSelectedCategories((prev) => prev.filter((c) => c !== cat))
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault()
      addCategory(searchQuery)
    }
  }

  // Step 2: Confirm categories
  const handleConfirmCategories = async () => {
    if (!createdWorkspaceId) return

    setIsSaving(true)
    try {
      const res = await fetch(
        `${API_BASE_URL}/workspaces/${createdWorkspaceId}/categories`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ categories: selectedCategories }),
        }
      )
      if (!res.ok) throw new Error("Failed to save categories")
      toast.success(t("Workspace created successfully!"))
      router.push("/dashboard")
    } catch (error) {
      console.error("Failed to save categories:", error)
      toast.error(t("Failed to save categories"))
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Step 1: Workspace Form ──────────────────────────────────────
  if (step === 1) {
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
                <Button
                  onClick={handleCreateWorkspace}
                  disabled={!values.workspaceName.trim() || isCreating}
                  className="min-w-[120px]"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("Analyzing...")}
                    </>
                  ) : (
                    t("create")
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    )
  }

  // ─── Step 2: Category Selection ──────────────────────────────────
  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl py-8">
        <Button variant="ghost" className="mb-4 -ml-2 gap-1" onClick={() => router.push("/dashboard")}>
          <ChevronLeft className="h-4 w-4" />
          {t("workspaceBack")}
        </Button>

        <Card className="overflow-hidden border-none shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary to-accent p-8 text-primary-foreground relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.8),transparent)]" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <Brain className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-black tracking-tight">
                  {t("Category Selection")}
                </h2>
              </div>
              <p className="text-primary-foreground/80 font-medium">
                {t("We analyzed your Job Description. Review and confirm the categories for your workspace.")}
              </p>
            </div>
          </div>

          <CardContent className="p-8 space-y-8">
            {/* Selected Categories */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">
                  {t("Selected Categories")}
                </Label>
                <Badge variant="outline" className="rounded-md font-bold text-xs">
                  {selectedCategories.length} / 10
                </Badge>
              </div>

              {selectedCategories.length === 0 ? (
                <div className="text-center py-8 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                  <Tag className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    {t("No categories selected. Add categories below.")}
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((cat) => (
                    <div
                      key={cat}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-primary/10 border-2 border-primary/20 text-primary font-bold text-sm transition-all hover:border-primary/40"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {cat}
                      <button
                        onClick={() => removeCategory(cat)}
                        className="ml-1 p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Suggested (show unselected ones) */}
            {suggestedCategories.filter((c) => !selectedCategories.includes(c)).length > 0 && (
              <div>
                <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-3 block">
                  <Sparkles className="h-3.5 w-3.5 inline mr-1.5" />
                  {t("AI Suggestions")}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {suggestedCategories
                    .filter((c) => !selectedCategories.includes(c))
                    .map((cat) => (
                      <button
                        key={cat}
                        onClick={() => addCategory(cat)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-muted/50 border-2 border-transparent text-foreground font-bold text-sm transition-all hover:border-primary/30 hover:bg-primary/5 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                        {cat}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Search & Add */}
            <div>
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-3 block">
                {t("Search or Add Categories")}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("Type to search or press Enter to add...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-10 h-12 rounded-2xl border-2 bg-muted/30"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Search Dropdown */}
              {searchResults.length > 0 && (
                <div className="mt-2 bg-background border-2 border-border rounded-xl shadow-lg overflow-hidden">
                  {searchResults.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => addCategory(cat)}
                      className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors text-left"
                    >
                      <Plus className="h-4 w-4 text-primary" />
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Button */}
            <div className="pt-4 border-t border-border/50">
              <Button
                onClick={handleConfirmCategories}
                disabled={isSaving}
                className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t("Saving...")}
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-5 w-5" />
                    {t("Confirm & Continue")}
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                {t("Categories cannot be changed after confirmation.")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
