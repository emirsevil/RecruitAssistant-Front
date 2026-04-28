"use client"

import { useState, useEffect, useMemo } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Brain,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Flag,
  Loader2,
  PlayCircle,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { useWorkspace } from "@/lib/workspace-context"
import { useQuizzes, type QuizGroup, type SkillSelection } from "@/hooks/use-quizzes"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { SearchableSelect, type SelectOption } from "@/components/ui/searchable-select"
import { SKILLS } from "@/lib/data/skills"

// Static at module load — the skills list doesn't change between renders.
const SKILL_OPTIONS: SelectOption[] = SKILLS.map((s) => ({
  value: s.name,
  label: s.name,
  group: s.category,
}))

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const
type Difficulty = (typeof DIFFICULTIES)[number]

export default function QuizzesPage() {
  const { t, language } = useLanguage()
  const { activeWorkspace } = useWorkspace()
  const workspaceId = activeWorkspace ? Number.parseInt(activeWorkspace.id) : null

  const {
    quizGroups,
    userScores,
    isLoading,
    isGenerating,
    submitResult,
    fetchWorkspaceQuizzes,
    fetchUserScores,
    submitQuiz,
    checkCanStart,
    generateTargetedQuizzes,
  } = useQuizzes()

  // Categories: prefer workspace categories; if empty but JD exists, extract on mount.
  const [categories, setCategories] = useState<string[]>([])
  const [isExtractingCategories, setIsExtractingCategories] = useState(false)

  // Per-category UI state
  const [diffByCategory, setDiffByCategory] = useState<Record<string, Difficulty>>({})
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [quizFilterDifficulty, setQuizFilterDifficulty] = useState<"All" | Difficulty>("All")

  // Custom-topic picker (lets the user generate a quiz for any skill from
  // our curated list, even if it wasn't extracted from the JD).
  const [customTopic, setCustomTopic] = useState<string>("")
  const [customDifficulty, setCustomDifficulty] = useState<Difficulty>("Medium")

  // Quiz-taking state
  const [quizState, setQuizState] = useState<"browse" | "taking" | "results">("browse")
  const [activeQuizGroup, setActiveQuizGroup] = useState<QuizGroup | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [currentAnswer, setCurrentAnswer] = useState<number | null>(null)

  useEffect(() => {
    if (!workspaceId) return
    fetchWorkspaceQuizzes(workspaceId)
    fetchUserScores()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  // Hydrate categories: workspace cats first, then auto-extract if JD-only.
  useEffect(() => {
    if (!activeWorkspace) {
      setCategories([])
      return
    }
    const wsCats = activeWorkspace.categories || []
    if (wsCats.length > 0) {
      setCategories(wsCats)
      return
    }
    // No persisted cats — extract from JD if available.
    if (!activeWorkspace.jobDescription?.trim()) {
      setCategories([])
      return
    }
    let cancelled = false
    setIsExtractingCategories(true)
    fetch(`${API_BASE}/workspaces/${activeWorkspace.id}/skills/extract`, {
      method: "POST",
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((skills: string[]) => {
        if (!cancelled) setCategories(Array.isArray(skills) ? skills : [])
      })
      .catch((err) => console.warn("Failed to extract categories", err))
      .finally(() => {
        if (!cancelled) setIsExtractingCategories(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeWorkspace?.id, activeWorkspace?.jobDescription])

  // Helpers
  const getGroupScore = (quizId: number) => {
    const scores = userScores.filter((s) => s.quiz_id === quizId)
    if (scores.length === 0) return null
    return Math.max(...scores.map((s) => s.score))
  }

  const filteredQuizzes = useMemo(() => {
    if (quizFilterDifficulty === "All") return quizGroups
    return quizGroups.filter((g) => g.difficulty === quizFilterDifficulty)
  }, [quizGroups, quizFilterDifficulty])

  const getDiff = (cat: string): Difficulty => diffByCategory[cat] || "Medium"
  const setDiff = (cat: string, d: Difficulty) =>
    setDiffByCategory((prev) => ({ ...prev, [cat]: d }))

  const handleGenerate = async (cat: string, override?: Difficulty) => {
    if (!workspaceId) return
    const difficulty = override ?? getDiff(cat)
    setGeneratingFor(cat)
    try {
      const selections: SkillSelection[] = [{ title: cat, difficulties: [difficulty] }]
      const result = await generateTargetedQuizzes(
        workspaceId,
        selections,
        language === "tr" ? "tr" : "en"
      )
      if (result) {
        toast.success(
          language === "tr"
            ? `${cat} için ${difficulty} test hazırlandı`
            : `${cat} ${difficulty} quiz ready`
        )
      }
    } finally {
      setGeneratingFor(null)
    }
  }

  // Quiz-taking handlers (unchanged)
  const startQuiz = async (group: QuizGroup) => {
    const status = await checkCanStart(group.id)
    if (!status.can_start) {
      toast.error(t("Maksimum deneme sayısına ulaştınız (3)."))
      return
    }
    setActiveQuizGroup(group)
    setQuizState("taking")
    setCurrentQuestion(0)
    setSelectedAnswers(new Array(group.questions.length).fill(null))
    setCurrentAnswer(null)
  }

  const handleNext = async () => {
    if (!activeQuizGroup || currentAnswer === null) return
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = currentAnswer
    setSelectedAnswers(newAnswers)
    if (currentQuestion < activeQuizGroup.questions.length - 1) {
      const nextIdx = currentQuestion + 1
      setCurrentQuestion(nextIdx)
      setCurrentAnswer(selectedAnswers[nextIdx] ?? null)
    } else {
      const submission = {
        quiz_id: activeQuizGroup.id,
        answers: activeQuizGroup.questions.map((q, idx) => ({
          question_id: q.id,
          selected_answer: q.options[newAnswers[idx] as number],
        })),
      }
      await submitQuiz(submission)
      setQuizState("results")
      fetchUserScores()
      if (workspaceId) fetchWorkspaceQuizzes(workspaceId)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0 && activeQuizGroup) {
      const prevIdx = currentQuestion - 1
      setCurrentQuestion(prevIdx)
      setCurrentAnswer(selectedAnswers[prevIdx] ?? null)
    }
  }

  // ─── Taking ─────────────────────────────────────────
  if (quizState === "taking" && activeQuizGroup) {
    const question = activeQuizGroup.questions[currentQuestion]
    const optionLetters = ["a", "b", "c", "d", "e"]
    const totalSeconds = activeQuizGroup.questions.length * 30
    const minLeft = Math.floor(totalSeconds / 60)
    const secLeft = totalSeconds % 60
    const timeLeft = `${minLeft.toString().padStart(2, "0")}:${secLeft.toString().padStart(2, "0")}`

    return (
      <div className="px-7 py-7 md:px-9">
        <div className="mx-auto max-w-[880px]">
          <div className="mb-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setQuizState("browse")}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("Exit Quiz")}
            </button>
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {activeQuizGroup.title}
            </span>
          </div>

          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="eyebrow">{activeQuizGroup.title}</p>
              <h1 className="serif-headline mt-1 text-[28px] font-normal leading-tight tracking-tight">
                {language === "tr" ? "Soru" : "Question"} {currentQuestion + 1}
                <span className="text-subtle"> / {activeQuizGroup.questions.length}</span>
              </h1>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-clay-soft px-3.5 py-2 text-[13px] font-semibold text-clay tabular-nums">
              <Clock className="h-3.5 w-3.5" />
              {timeLeft}
            </div>
          </div>

          <div className="mb-7 flex gap-1">
            {activeQuizGroup.questions.map((_, i) => (
              <div
                key={i}
                className={`h-[3px] flex-1 rounded-full ${
                  i < currentQuestion
                    ? "bg-sage"
                    : i === currentQuestion
                      ? "bg-clay"
                      : "bg-secondary"
                }`}
              />
            ))}
          </div>

          <div className="mb-5 rounded-2xl border border-border bg-card p-9">
            <p className="eyebrow mb-3.5">
              {language === "tr" ? "Cevabını seç" : "Pick your answer"}
            </p>
            <p className="mb-7 font-serif text-[26px] font-normal leading-snug tracking-tight text-balance">
              {question.question}
            </p>

            <div className="flex flex-col gap-2.5">
              {question.options.map((option, idx) => {
                const sel = currentAnswer === idx
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentAnswer(idx)}
                    className={cn(
                      "flex items-center gap-3.5 rounded-lg border bg-background px-4 py-3.5 text-left transition-colors",
                      sel
                        ? "border-sage bg-sage-soft"
                        : "border-border hover:border-primary/30 hover:bg-secondary/40"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border text-[11px] font-semibold uppercase",
                        sel
                          ? "border-sage bg-sage text-white"
                          : "border-strong bg-card text-foreground"
                      )}
                    >
                      {sel ? <Check className="h-3.5 w-3.5" /> : optionLetters[idx]}
                    </span>
                    <span className="text-[15px] leading-snug">{option}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="rounded-lg border-border text-muted-foreground"
            >
              <ChevronLeft className="mr-1.5 h-3.5 w-3.5" />
              {t("Previous")}
            </Button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 text-[12px] text-muted-foreground hover:text-foreground"
            >
              <Flag className="h-3.5 w-3.5" />
              {language === "tr" ? "İşaretle" : "Flag"}
            </button>
            <Button
              onClick={handleNext}
              disabled={currentAnswer === null || isLoading}
              className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {currentQuestion < activeQuizGroup.questions.length - 1 ? t("Next") : t("Finish")}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Results ───────────────────────────────────────
  if (quizState === "results" && submitResult) {
    return (
      <div className="px-7 py-7 md:px-9">
        <div className="mx-auto max-w-[880px] space-y-5">
          <div className="rounded-2xl border border-border bg-sage-soft p-10 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-sage text-white">
              <Award className="h-9 w-9" />
            </div>
            <p className="eyebrow text-clay">{t("Quiz Results")}</p>
            <p className="serif-headline mt-2 mb-4 text-6xl tabular-nums">
              {submitResult.score}<span className="text-3xl text-subtle">%</span>
            </p>
            <div className="flex items-center justify-center gap-7 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-sage" />
                <span>{submitResult.correct_count} {t("correct")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Target className="h-4 w-4 text-clay" />
                <span>{submitResult.total_questions} {t("total")}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 px-1 font-serif text-[19px] font-medium tracking-tight">
              {language === "tr" ? "Detaylı inceleme" : "Detailed Review"}
            </h3>
            <div className="flex flex-col gap-2.5">
              {submitResult.results.map((result, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "rounded-xl border bg-card p-5",
                    result.is_correct ? "border-sage/40" : "border-clay/40"
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.is_correct ? (
                        <CheckCircle2 className="h-4 w-4 text-sage" />
                      ) : (
                        <XCircle className="h-4 w-4 text-clay" />
                      )}
                      <span className="eyebrow">
                        {language === "tr" ? "Soru" : "Question"} {idx + 1}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        result.is_correct ? "bg-sage-soft text-sage" : "bg-clay-soft text-clay"
                      )}
                    >
                      {result.is_correct ? "+" : "0"}
                      {result.is_correct
                        ? Math.round(100 / submitResult.total_questions)
                        : 0}{" "}
                      {language === "tr" ? "puan" : "pts"}
                    </span>
                  </div>
                  <p className="mb-3 font-serif text-[17px] leading-snug tracking-tight">
                    {result.question}
                  </p>
                  <div className="rounded-lg bg-secondary/40 p-3 text-[13px]">
                    <div className="flex gap-2">
                      <span className="font-semibold text-muted-foreground">
                        {language === "tr" ? "Cevabın:" : "Your answer:"}
                      </span>
                      <span className={result.is_correct ? "font-semibold text-sage" : "font-semibold text-clay"}>
                        {result.selected_answer}
                      </span>
                    </div>
                    {!result.is_correct && (
                      <div className="mt-1.5 flex gap-2 border-t border-border pt-1.5">
                        <span className="font-semibold text-muted-foreground">
                          {language === "tr" ? "Doğru cevap:" : "Correct answer:"}
                        </span>
                        <span className="font-semibold text-sage">{result.correct_answer}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setQuizState("browse")}
            >
              {language === "tr" ? "Testlere dön" : "Back to Quizzes"}
            </Button>
            {activeQuizGroup && (
              <Button
                variant="outline"
                className="flex-1 rounded-lg border-border"
                onClick={() => startQuiz(activeQuizGroup)}
                disabled={activeQuizGroup.attempts_count >= 3}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {t("Retry Quiz")}
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Browse ─────────────────────────────────────────
  return (
    <div className="px-7 py-7 md:px-9">
      <div className="mb-7">
        <p className="eyebrow text-clay">{t("quizzes")}</p>
        <h1 className="serif-headline mt-1 text-[32px] font-normal leading-tight tracking-tight">
          {language === "tr" ? "Bilgini sına" : "Test your knowledge"}
        </h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          {language === "tr"
            ? "İş tanımına göre çıkardığımız konulardan dilediğin zorlukta test üret ve çöz."
            : "Generate a quiz at any difficulty for any topic we extracted from your job description."}
        </p>
      </div>

      {/* Categories — generation surface */}
      <section className="mb-8">
        <div className="mb-3.5 flex items-baseline justify-between">
          <h2 className="font-serif text-[19px] font-medium tracking-tight">
            {language === "tr" ? "Konuların" : "Your topics"}
          </h2>
          <span className="text-[11px] text-subtle">
            {language === "tr" ? "İş tanımından çıkarıldı" : "extracted from your JD"}
          </span>
        </div>

        {isExtractingCategories ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-secondary/30 py-10 text-[13px] text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-sage" />
            {language === "tr"
              ? "İş tanımı analiz ediliyor..."
              : "Analyzing your job description..."}
          </div>
        ) : (
          <>
            {categories.length === 0 && (
              <div className="mb-3 rounded-xl border border-dashed border-strong bg-secondary/40 px-5 py-4 text-[12px] text-muted-foreground">
                {language === "tr"
                  ? "İş tanımından çıkarılan konu yok. Aşağıdan istediğin konuyu seçebilirsin."
                  : "No topics extracted from your JD yet. Pick any topic below to generate a quiz."}
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => {
                const diff = getDiff(cat)
                const generating = generatingFor === cat
                const generatedCount = quizGroups.filter(
                  (g) => g.title.toLowerCase() === cat.toLowerCase()
                ).length
                return (
                  <div
                    key={cat}
                    className="rounded-2xl border border-border bg-card p-5"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h3 className="font-serif text-[18px] font-medium leading-tight tracking-tight">
                        {cat}
                      </h3>
                      {generatedCount > 0 && (
                        <span className="rounded-full bg-sage-soft px-2 py-0.5 text-[10px] font-semibold text-sage">
                          {generatedCount}
                        </span>
                      )}
                    </div>
                    <p className="eyebrow mb-2">
                      {language === "tr" ? "Zorluk" : "Difficulty"}
                    </p>
                    <div className="mb-4 flex gap-1.5">
                      {DIFFICULTIES.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDiff(cat, d)}
                          className={cn(
                            "flex-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                            diff === d
                              ? "border-transparent bg-clay-soft text-clay"
                              : "border-border bg-card text-muted-foreground hover:border-primary/40"
                          )}
                        >
                          {t(d)}
                        </button>
                      ))}
                    </div>
                    <Button
                      onClick={() => handleGenerate(cat)}
                      disabled={generating || isGenerating}
                      className="w-full gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          {language === "tr" ? "Hazırlanıyor..." : "Generating..."}
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          {language === "tr" ? "Test üret" : "Generate quiz"}
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}

              {/* Custom topic — pick any skill from the curated list */}
              <div className="rounded-2xl border border-dashed border-strong bg-secondary/30 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Plus className="h-4 w-4 flex-shrink-0 text-clay" />
                  <h3 className="font-serif text-[18px] font-medium leading-tight tracking-tight">
                    {language === "tr" ? "Başka bir konu" : "Custom topic"}
                  </h3>
                </div>
                <p className="eyebrow mb-2">
                  {language === "tr" ? "Konu" : "Topic"}
                </p>
                <div className="mb-3">
                  <SearchableSelect
                    options={SKILL_OPTIONS}
                    value={customTopic}
                    onChange={(v) => setCustomTopic(v)}
                    placeholder={
                      language === "tr" ? "Konu seç..." : "Select a topic..."
                    }
                    searchPlaceholder={
                      language === "tr" ? "Konu ara..." : "Search topics..."
                    }
                    emptyText={language === "tr" ? "Sonuç yok." : "No matches."}
                  />
                </div>
                <p className="eyebrow mb-2">
                  {language === "tr" ? "Zorluk" : "Difficulty"}
                </p>
                <div className="mb-4 flex gap-1.5">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setCustomDifficulty(d)}
                      className={cn(
                        "flex-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                        customDifficulty === d
                          ? "border-transparent bg-clay-soft text-clay"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {t(d)}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={() => {
                    if (!customTopic) return
                    handleGenerate(customTopic, customDifficulty)
                  }}
                  disabled={!customTopic || generatingFor !== null || isGenerating}
                  className="w-full gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {generatingFor === customTopic ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {language === "tr" ? "Hazırlanıyor..." : "Generating..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      {language === "tr" ? "Test üret" : "Generate quiz"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Generated quizzes */}
      <section>
        <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-serif text-[19px] font-medium tracking-tight">
            {language === "tr" ? "Hazır testlerin" : "Your quizzes"}
          </h2>
          <div className="flex items-center gap-1.5">
            {(["All", ...DIFFICULTIES] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setQuizFilterDifficulty(d)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  quizFilterDifficulty === d
                    ? "border-transparent bg-sage-soft text-sage"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40"
                )}
              >
                {t(d)}
              </button>
            ))}
          </div>
        </div>

        {isLoading && quizGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card py-10 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-sage" />
            <p className="text-[12px] text-muted-foreground">
              {language === "tr" ? "Yükleniyor..." : "Loading your quizzes..."}
            </p>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-strong bg-secondary/40 py-10 text-center">
            <Brain className="mx-auto mb-2 h-6 w-6 text-subtle" />
            <p className="font-serif text-[17px] tracking-tight">
              {language === "tr" ? "Henüz test yok" : "No quizzes yet"}
            </p>
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              {language === "tr"
                ? "Bir konu seç ve yukarıdan üretmeye başla."
                : "Pick a topic above and generate your first quiz."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredQuizzes.map((group) => {
              const score = getGroupScore(group.id)
              const completed = group.attempts_count > 0
              return (
                <div
                  key={group.id}
                  className="flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="eyebrow text-clay">{t(group.difficulty)}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle">
                      {group.attempts_count}/3
                    </span>
                  </div>
                  <h3 className="mb-3.5 font-serif text-[18px] font-medium leading-tight tracking-tight">
                    {group.title}
                  </h3>
                  <div className="mb-5 flex items-center gap-4 text-[12px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Brain className="h-3.5 w-3.5" />
                      {group.questions.length} {language === "tr" ? "soru" : "questions"}
                    </span>
                    {completed && (
                      <span className="inline-flex items-center gap-1 text-sage">
                        <Check className="h-3.5 w-3.5" />
                        {language === "tr" ? "Çözüldü" : "Attempted"}
                      </span>
                    )}
                  </div>
                  <div className="mt-auto">
                    {completed ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="text-muted-foreground">
                            {language === "tr" ? "En iyi skor" : "Best Score"}
                          </span>
                          <span className="serif-headline tabular-nums">{score}%</span>
                        </div>
                        <Button
                          onClick={() => startQuiz(group)}
                          variant="outline"
                          className="w-full rounded-lg border-border"
                        >
                          <RotateCcw className="mr-2 h-3.5 w-3.5" />
                          {t("Retake Quiz")}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => startQuiz(group)}
                        className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <PlayCircle className="mr-2 h-3.5 w-3.5" />
                        {t("Start Quiz")}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
