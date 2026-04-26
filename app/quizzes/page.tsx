"use client"

import { useState, useEffect } from "react"
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
  RotateCcw,
  Search,
  Sparkles,
  Target,
  XCircle,
  Zap,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/language-context"
import { useWorkspace } from "@/lib/workspace-context"
import { useQuizzes, type QuizGroup, type SkillSelection } from "@/hooks/use-quizzes"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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

  const [selectedDifficulty, setSelectedDifficulty] = useState("All")
  const [quizState, setQuizState] = useState<"browse" | "taking" | "results">("browse")
  const [activeQuizGroup, setActiveQuizGroup] = useState<QuizGroup | null>(null)

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [currentAnswer, setCurrentAnswer] = useState<number | null>(null)

  const [discoveryOpen, setDiscoveryOpen] = useState(false)
  const [extractedSkills, setExtractedSkills] = useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [difficultiesBySkill, setDifficultiesBySkill] = useState<Record<string, string[]>>({})
  const [quizLanguage, setQuizLanguage] = useState("tr")

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceQuizzes(workspaceId)
      fetchUserScores()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  const difficulties = ["All", "Easy", "Medium", "Hard"] as const

  const getGroupScore = (quizId: number) => {
    const scores = userScores.filter((s) => s.quiz_id === quizId)
    if (scores.length === 0) return null
    return Math.max(...scores.map((s) => s.score))
  }

  const filteredQuizzes = quizGroups.filter(
    (g) => selectedDifficulty === "All" || g.difficulty === selectedDifficulty
  )

  const handleStartDiscovery = () => {
    if (!activeWorkspace) return
    setDiscoveryOpen(true)
    setExtractedSkills(activeWorkspace.categories || [])
  }

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill))
    } else {
      if (selectedSkills.length >= 5) {
        toast.error(t("You can select up to 5 skills"))
        return
      }
      setSelectedSkills([...selectedSkills, skill])
      if (!difficultiesBySkill[skill]) {
        setDifficultiesBySkill({ ...difficultiesBySkill, [skill]: ["Medium"] })
      }
    }
  }

  const toggleDifficultyForSkill = (skill: string, diff: string) => {
    const current = difficultiesBySkill[skill] || []
    if (current.includes(diff)) {
      setDifficultiesBySkill({
        ...difficultiesBySkill,
        [skill]: current.filter((d) => d !== diff),
      })
    } else {
      setDifficultiesBySkill({ ...difficultiesBySkill, [skill]: [...current, diff] })
    }
  }

  const handleGenerate = async () => {
    if (selectedSkills.length === 0 || !workspaceId) return
    const selections: SkillSelection[] = selectedSkills.map((skill) => ({
      title: skill,
      difficulties: difficultiesBySkill[skill] || ["Medium"],
    }))
    const result = await generateTargetedQuizzes(workspaceId, selections, quizLanguage)
    if (result) {
      setDiscoveryOpen(false)
      setSelectedSkills([])
      setDifficultiesBySkill({})
      toast.success(t("Quizzes generated successfully!"))
    }
  }

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
    // Simple decreasing display, no real timer (UX detail from design)
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
                <span className="text-subtle">
                  {" "}/ {activeQuizGroup.questions.length}
                </span>
              </h1>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-clay-soft px-3.5 py-2 text-[13px] font-semibold text-clay tabular-nums">
              <Clock className="h-3.5 w-3.5" />
              {timeLeft}
            </div>
          </div>

          {/* Progress dots */}
          <div className="mb-7 flex gap-1">
            {activeQuizGroup.questions.map((_, i) => (
              <div
                key={i}
                className={`h-[3px] flex-1 rounded-full ${
                  i < currentQuestion ? "bg-sage" : i === currentQuestion ? "bg-clay" : "bg-secondary"
                }`}
              />
            ))}
          </div>

          {/* Question card */}
          <div className="mb-5 rounded-2xl border border-border bg-card p-9">
            <p className="eyebrow mb-3.5">{language === "tr" ? "Cevabını seç" : "Pick your answer"}</p>
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

          {/* Footer actions */}
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
              {submitResult.score}
              <span className="text-3xl text-subtle">%</span>
            </p>
            <div className="flex items-center justify-center gap-7 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-sage" />
                <span>
                  {submitResult.correct_count} {t("correct")}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Target className="h-4 w-4 text-clay" />
                <span>
                  {submitResult.total_questions} {t("total")}
                </span>
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
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-clay">{t("quizzes")}</p>
          <h1 className="serif-headline mt-1 text-[32px] font-normal leading-tight tracking-tight">
            {language === "tr" ? "Bilgini sına" : "Test your knowledge"}
          </h1>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            {language === "tr"
              ? "İş tanımına göre hazırladığımız testlerle kendini değerlendir."
              : "Validate the skills the job description asks for, one focused quiz at a time."}
          </p>
        </div>
        <Button
          onClick={handleStartDiscovery}
          className="gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {t("Smart Quiz Discovery")}
        </Button>
      </div>

      {/* Filter chips */}
      <div className="mb-7 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <Search className="h-3.5 w-3.5" />
          {language === "tr" ? "Filtre" : "Filter"}
        </span>
        {difficulties.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setSelectedDifficulty(d)}
            className={cn(
              "whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
              selectedDifficulty === d
                ? "border-transparent bg-sage-soft text-sage"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {t(d)}
          </button>
        ))}
      </div>

      {(isLoading && quizGroups.length === 0) || isGenerating ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <Loader2 className="mb-4 h-7 w-7 animate-spin text-sage" />
          <h3 className="font-serif text-[19px] tracking-tight">
            {isGenerating
              ? language === "tr"
                ? "Testler hazırlanıyor..."
                : "Generating Smart Quizzes..."
              : language === "tr"
                ? "Yükleniyor..."
                : "Loading your quizzes..."}
          </h3>
          <p className="mt-1.5 max-w-xs text-[12px] text-muted-foreground">
            {isGenerating
              ? language === "tr"
                ? "İş tanımı analiz ediliyor ve sana özel sorular oluşturuluyor."
                : "Analyzing the JD, extracting skills, and creating questions just for you."
              : language === "tr"
                ? "Birazdan hazır."
                : "Sit tight, fetching your personalized quizzes."}
          </p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-strong bg-secondary/40 py-16 text-center">
          <Search className="mx-auto mb-3 h-7 w-7 text-subtle" />
          <h3 className="font-serif text-[19px] tracking-tight">
            {language === "tr" ? "Test bulunamadı" : "No quizzes found"}
          </h3>
          <p className="mt-1.5 text-[12px] text-muted-foreground">
            {language === "tr"
              ? "İş tanımına göre yeni testler oluşturalım."
              : "Try discovery to create new ones based on your Job Description."}
          </p>
          <Button
            variant="outline"
            onClick={handleStartDiscovery}
            className="mt-5 rounded-lg border-border"
          >
            {language === "tr" ? "Keşfi başlat" : "Start Discovery"}
          </Button>
        </div>
      ) : (
        <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
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

      {/* Discovery Dialog */}
      <Dialog open={discoveryOpen} onOpenChange={setDiscoveryOpen}>
        <DialogContent className="max-w-xl overflow-hidden rounded-2xl border-border p-0">
          <div className="border-b border-border bg-sage-soft px-7 py-5">
            <DialogHeader>
              <div className="mb-1.5 inline-flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-clay" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-clay">
                  {t("Smart Quiz Discovery")}
                </span>
              </div>
              <DialogTitle className="font-serif text-[24px] font-normal leading-tight tracking-tight text-foreground">
                {language === "tr"
                  ? "Hangi yetenekleri test etmek istiyorsun?"
                  : "Which skills do you want to test?"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t("We analyzed the Job Description. Pick the skills you want to test.")}
              </DialogDescription>
            </DialogHeader>
          </div>

          <ScrollArea className="max-h-[60vh] px-7 py-5">
            <div className="space-y-5">
              <div>
                <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {t("Quiz Language")}
                </Label>
                <Select value={quizLanguage} onValueChange={setQuizLanguage}>
                  <SelectTrigger className="mt-2 h-11 rounded-lg border-border bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tr">{t("Turkish")}</SelectItem>
                    <SelectItem value="en">{t("English")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {language === "tr" ? "Yetenekler (en fazla 5)" : "Select Skills (Max 5)"}
                  </Label>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {selectedSkills.length} / 5
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {extractedSkills.map((skill) => {
                    const sel = selectedSkills.includes(skill)
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={cn(
                          "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                          sel
                            ? "border-transparent bg-sage-soft text-sage"
                            : "border-border bg-card text-foreground hover:border-primary/40"
                        )}
                      >
                        {sel && <Check className="h-3 w-3" />}
                        {skill}
                      </button>
                    )
                  })}
                </div>
              </div>

              {selectedSkills.length > 0 && (
                <div>
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {language === "tr" ? "Zorluk seviyesi" : "Customize Difficulty"}
                  </Label>
                  <div className="mt-2 flex flex-col gap-2.5">
                    {selectedSkills.map((skill) => (
                      <div
                        key={`diff-${skill}`}
                        className="flex flex-col gap-2.5 rounded-lg border border-border bg-secondary/30 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="text-[13px] font-semibold">{skill}</span>
                        <div className="flex gap-1.5">
                          {(["Easy", "Medium", "Hard"] as const).map((level) => {
                            const sel = difficultiesBySkill[skill]?.includes(level)
                            return (
                              <button
                                key={level}
                                type="button"
                                onClick={() => toggleDifficultyForSkill(skill, level)}
                                className={cn(
                                  "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                                  sel
                                    ? "border-transparent bg-clay-soft text-clay"
                                    : "border-border bg-card text-muted-foreground hover:border-primary/40"
                                )}
                              >
                                {t(level)}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t border-border px-7 py-5">
            <Button
              className="w-full gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={selectedSkills.length === 0 || isLoading || isGenerating}
              onClick={handleGenerate}
            >
              {isGenerating ? (
                <>
                  <Zap className="h-4 w-4 animate-pulse" />
                  {language === "tr" ? "Hazırlanıyor..." : "Generating..."}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {language === "tr" ? "Testleri oluştur" : "Generate Quizzes"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
