"use client"

import { useState, useEffect } from "react"
import { PageContainer, PageHeader } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  PlayCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  Brain,
  Search,
  Check,
  Zap,
  RotateCcw,
  Target,
  ArrowRight,
  LayoutGrid
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLanguage } from "@/lib/language-context"
import { useWorkspace } from "@/lib/workspace-context"
import { useQuizzes, type QuizGroup, type SkillSelection } from "@/hooks/use-quizzes"
import { toast } from "sonner"



export default function QuizzesPage() {
  const { t } = useLanguage()
  const { activeWorkspace } = useWorkspace()
  const workspaceId = activeWorkspace ? Number.parseInt(activeWorkspace.id) : null

  const {
    quizGroups,
    userScores,
    isLoading,
    isGenerating,
    error,
    submitResult,
    fetchWorkspaceQuizzes,
    fetchUserScores,
    submitQuiz,
    checkCanStart,
    generateTargetedQuizzes
  } = useQuizzes()

  // Page States
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedDifficulty, setSelectedDifficulty] = useState("All")
  const [quizState, setQuizState] = useState<"browse" | "taking" | "results">("browse")
  const [activeQuizGroup, setActiveQuizGroup] = useState<QuizGroup | null>(null)

  // Quiz Taking States
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [currentAnswer, setCurrentAnswer] = useState<number | null>(null)

  // Discovery States
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

  // -- Helpers --
  const categories = ["All", ...Array.from(new Set(quizGroups.map(g => g.title || "Technical")))]
  const difficulties = ["All", "Easy", "Medium", "Hard"]

  const getGroupScore = (quizId: number) => {
    const scores = userScores.filter(s => s.quiz_id === quizId)
    if (scores.length === 0) return null
    return Math.max(...scores.map(s => s.score))
  }

  const filteredQuizzes = quizGroups.filter((group) => {
    const categoryMatch = selectedCategory === "All" || group.title === selectedCategory
    const difficultyMatch = selectedDifficulty === "All" || group.difficulty === selectedDifficulty
    return categoryMatch && difficultyMatch
  })

  // -- Discovery Flow Handlers --
  const handleStartDiscovery = () => {
    if (!activeWorkspace) return
    setDiscoveryOpen(true)
    // Load categories directly from workspace — no LLM call needed
    const workspaceCategories = activeWorkspace.categories || []
    setExtractedSkills(workspaceCategories)
  }

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill))
    } else {
      if (selectedSkills.length >= 5) {
        toast.error(t("You can select up to 5 skills"))
        return
      }
      setSelectedSkills([...selectedSkills, skill])
      // Default difficulty
      if (!difficultiesBySkill[skill]) {
        setDifficultiesBySkill({ ...difficultiesBySkill, [skill]: ["Medium"] })
      }
    }
  }

  const toggleDifficultyForSkill = (skill: string, diff: string) => {
    const current = difficultiesBySkill[skill] || []
    if (current.includes(diff)) {
      setDifficultiesBySkill({ ...difficultiesBySkill, [skill]: current.filter(d => d !== diff) })
    } else {
      setDifficultiesBySkill({ ...difficultiesBySkill, [skill]: [...current, diff] })
    }
  }

  const handleGenerate = async () => {
    if (selectedSkills.length === 0 || !workspaceId) return

    const selections: SkillSelection[] = selectedSkills.map(skill => ({
      title: skill,
      difficulties: difficultiesBySkill[skill] || ["Medium"]
    }))

    const result = await generateTargetedQuizzes(workspaceId, selections, quizLanguage)
    if (result) {
      setDiscoveryOpen(false)
      setSelectedSkills([])
      setDifficultiesBySkill({})
      toast.success(t("Quizzes generated successfully!"))
    }
  }

  // -- Quiz Taking Handlers --
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
    if (activeQuizGroup && currentAnswer !== null) {
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
            selected_answer: q.options[newAnswers[idx] as number]
          }))
        }
        await submitQuiz(submission)
        setQuizState("results")
        fetchUserScores()
        if (workspaceId) fetchWorkspaceQuizzes(workspaceId)
      }
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0 && activeQuizGroup) {
      const prevIdx = currentQuestion - 1
      setCurrentQuestion(prevIdx)
      setCurrentAnswer(selectedAnswers[prevIdx] ?? null)
    }
  }

  // -- UI Renders --

  if (quizState === "taking" && activeQuizGroup) {
    const question = activeQuizGroup.questions[currentQuestion]
    const progress = ((currentQuestion + 1) / activeQuizGroup.questions.length) * 100

    return (
      <PageContainer>
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setQuizState("browse")}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t("Exit Quiz")}
            </Button>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Brain className="h-4 w-4 text-primary" />
              <span>{activeQuizGroup.title}</span>
            </div>
          </div>

          <Card className="border-t-4 border-t-primary shadow-lg">
            <CardHeader className="space-y-4">
              <div>
                <Progress value={progress} className="h-2" />
                <div className="mt-2 flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>{t("Question")} {currentQuestion + 1} / {activeQuizGroup.questions.length}</span>
                  <Badge variant="outline">{t(activeQuizGroup.difficulty)}</Badge>
                </div>
              </div>
              <CardTitle className="text-2xl leading-tight text-balance">{question.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={currentAnswer?.toString()}
                onValueChange={(v) => setCurrentAnswer(Number.parseInt(v))}
              >
                <div className="space-y-3">
                  {question.options.map((option, idx) => (
                    <div
                      key={idx}
                      className={`group flex items-start gap-3 rounded-xl border-2 p-4 transition-all cursor-pointer ${currentAnswer === idx
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "hover:border-primary/30 hover:bg-muted/50 border-transparent shadow-none"
                        }`}
                      onClick={() => setCurrentAnswer(idx)}
                    >
                      <RadioGroupItem value={idx.toString()} id={`option-${idx}`} className="mt-1" />
                      <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer text-base font-medium leading-normal group-hover:text-primary transition-colors">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
            <CardFooter className="flex justify-between pt-6">
              <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                {t("Previous")}
              </Button>
              <Button onClick={handleNext} disabled={currentAnswer === null || isLoading} className="min-w-[120px]">
                {isLoading && <Clock className="h-4 w-4 animate-spin mr-2" />}
                {currentQuestion < activeQuizGroup.questions.length - 1 ? t("Next") : t("Finish")}
                {!isLoading && <ChevronRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </PageContainer>
    )
  }

  if (quizState === "results" && submitResult) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-3xl space-y-6">
          <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-10 text-center">
              <div className="relative mx-auto mb-6 h-24 w-24">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                <div className="relative flex h-full w-full items-center justify-center rounded-full bg-primary shadow-lg">
                  <Award className="h-12 w-12 text-primary-foreground" />
                </div>
              </div>
              <div className="text-lg font-bold text-primary mb-1 uppercase tracking-widest">{t("Quiz Results")}</div>
              <div className="mb-4 text-7xl font-black tracking-tighter text-foreground">{submitResult.score}<span className="text-3xl text-primary">%</span></div>
              <div className="flex justify-center gap-8 text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>{submitResult.correct_count} {t("correct")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-primary" />
                  <span>{submitResult.total_questions} {t("total")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <h3 className="text-xl font-bold px-1">{t("Detailed Review")}</h3>
            {submitResult.results.map((result, idx) => (
              <Card key={idx} className={`border-l-4 transition-all hover:shadow-md ${result.is_correct ? "border-l-success" : "border-l-destructive"}`}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                       {result.is_correct ? <CheckCircle2 className="h-5 w-5 text-success" /> : <XCircle className="h-5 w-5 text-destructive" />}
                       <span className="text-sm font-bold text-muted-foreground uppercase">{t("Question")} {idx + 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-bold">{t("Attempt #")}{submitResult.attempt_number}</Badge>
                      {result.is_correct ? (
                        <Badge variant="secondary" className="bg-success/10 text-success border-success/20">+{Math.round(100/submitResult.total_questions)} {t("pts")}</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">0 {t("pts")}</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-lg font-semibold leading-snug">{result.question}</p>
                  
                  <div className="grid gap-3 rounded-xl bg-muted/30 p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-bold text-muted-foreground min-w-[100px]">{t("Your answer:")}</span>
                      <span className={result.is_correct ? "text-success font-bold" : "text-destructive font-bold"}>{result.selected_answer}</span>
                    </div>
                    {!result.is_correct && (
                      <div className="flex items-center gap-2 text-sm border-t border-border/50 pt-2">
                        <span className="font-bold text-muted-foreground min-w-[100px]">{t("Correct answer:")}</span>
                        <span className="text-success font-bold">{result.correct_answer}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-4 pt-4">
            <Button className="flex-1 h-12 text-base font-bold" onClick={() => setQuizState("browse")}>
              {t("Back to Quizzes")}
            </Button>
            {activeQuizGroup && (
              <Button 
                variant="outline" 
                className="flex-1 h-12 text-base font-bold bg-transparent" 
                onClick={() => startQuiz(activeQuizGroup)}
                disabled={activeQuizGroup.attempts_count >= 3}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {t("Retry Quiz")}
              </Button>
            )}
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <PageHeader 
          title={t("Quizzes")} 
          description={t("Test your technical knowledge and validate your skills")} 
          className="mb-0"
        />
        <Button 
          size="lg" 
          onClick={handleStartDiscovery} 
          className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20 h-14 px-8 rounded-2xl group transition-all"
        >
          <Sparkles className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
          <span className="text-base font-bold">{t("Smart Quiz Discovery")}</span>
          <ArrowRight className="ml-2 h-0 w-0 group-hover:h-5 group-hover:w-5 transition-all opacity-0 group-hover:opacity-100" />
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-10 flex flex-col sm:flex-row items-center gap-4 bg-muted/30 p-2 rounded-2xl border border-border/50">
        <div className="flex items-center gap-2 px-3 text-muted-foreground">
          <Search className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-widest">{t("Filter")}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className={`cursor-pointer px-4 py-2 rounded-xl transition-all border-none ${selectedCategory === category ? "shadow-md" : "bg-transparent hover:bg-muted"}`}
              onClick={() => setSelectedCategory(category)}
            >
              {t(category)}
            </Badge>
          ))}
        </div>
        <div className="h-6 w-px bg-border hidden sm:block mx-2" />
        <div className="flex flex-wrap gap-1.5">
          {difficulties.map((difficulty) => (
            <Badge
              key={difficulty}
              variant={selectedDifficulty === difficulty ? "default" : "outline"}
              className={`cursor-pointer px-4 py-2 rounded-xl transition-all border-none ${selectedDifficulty === difficulty ? "shadow-md" : "bg-transparent hover:bg-muted"}`}
              onClick={() => setSelectedDifficulty(difficulty)}
            >
              {t(difficulty)}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(isLoading && quizGroups.length === 0) || isGenerating ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
             <div className="relative mb-6">
                <div className="h-20 w-20 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                <Brain className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
             </div>
             <h3 className="text-xl font-bold mb-2">{isGenerating ? t("Generating Smart Quizzes...") : t("Loading your dashboard...")}</h3>
             <p className="text-muted-foreground max-w-xs">{isGenerating ? t("Analyze JD, extracting skills, and creating questions just for you.") : t("Sit tight, we're fetching your personalized quizzes.")}</p>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="col-span-full py-20 bg-muted/20 border-2 border-dashed border-border rounded-3xl text-center">
             <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
             <h3 className="text-xl font-bold text-muted-foreground">{t("No quizzes found")}</h3>
             <p className="text-muted-foreground mt-2">{t("Try discovery to create new ones based on your Job Description.")}</p>
             <Button variant="outline" onClick={handleStartDiscovery} className="mt-6 rounded-xl font-bold">
                {t("Start Discovery")}
             </Button>
          </div>
        ) : (
          filteredQuizzes.map((group) => {
            const score = getGroupScore(group.id)
            const completed = group.attempts_count > 0

            return (
              <Card key={group.id} className="group relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 border-border/50">
                <div className={`absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity ${group.difficulty === "Easy" ? "bg-success" : group.difficulty === "Medium" ? "bg-primary" : "bg-destructive"}`} />
                
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="bg-muted hover:bg-muted font-bold text-[10px] uppercase tracking-tighter">{t("Technical")}</Badge>
                    <Badge 
                      variant="outline"
                      className={`font-bold border-2 ${
                        group.difficulty === "Easy" ? "text-success border-success/20 bg-success/5" : 
                        group.difficulty === "Medium" ? "text-primary border-primary/20 bg-primary/5" : 
                        "text-destructive border-destructive/20 bg-destructive/5"
                      }`}
                    >
                       {t(group.difficulty)}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">{group.title}</CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center gap-4 text-sm font-semibold text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <LayoutGrid className="h-4 w-4" />
                      <span>{group.questions.length} {t("questions")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>{group.attempts_count} / 3 {t("Attempts")}</span>
                    </div>
                    {completed && (
                       <div className="flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-success" />
                        <span className="text-success">{t("Attempted")}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="pt-2">
                  {completed ? (
                    <div className="w-full space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-muted-foreground">{t("Best Score")}</span>
                        <span className="text-lg font-black text-primary">{score}%</span>
                      </div>
                      <Button onClick={() => startQuiz(group)} variant="outline" className="w-full h-11 rounded-xl bg-transparent font-bold border-2 hover:bg-secondary">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        {t("Retake Quiz")}
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => startQuiz(group)} className="w-full h-11 rounded-xl font-bold group shadow-md shadow-primary/10">
                      <PlayCircle className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                      {t("Start Quiz")}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>

      {/* Discovery Dialog */}
      <Dialog open={discoveryOpen} onOpenChange={setDiscoveryOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden sm:rounded-3xl border-none shadow-2xl">
          <div className="bg-gradient-to-br from-primary to-accent p-8 text-primary-foreground relative">
             <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.8),transparent)]" />
             <DialogHeader className="relative">
                <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                      <Sparkles className="h-6 w-6" />
                   </div>
                   <DialogTitle className="text-2xl font-black tracking-tight">{t("Smart Quiz Discovery")}</DialogTitle>
                </div>
                <DialogDescription className="text-primary-foreground/80 font-medium">
                  {t("We analyzed the Job Description. Pick the skills you want to test.")}
                </DialogDescription>
             </DialogHeader>
          </div>

          <ScrollArea className="max-h-[60vh] p-8">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                  <p className="font-bold text-muted-foreground animate-pulse">{t("Analyzing Job Description...")}</p>
               </div>
            ) : (
              <div className="space-y-8">
                <div className="space-y-3">
                  <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">{t("Quiz Language")}</Label>
                  <Select value={quizLanguage} onValueChange={setQuizLanguage}>
                    <SelectTrigger className="h-12 rounded-2xl border-2 bg-muted/30 focus:ring-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tr">{t("Turkish")}</SelectItem>
                      <SelectItem value="en">{t("English")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">{t("Select Skills (Max 5)")}</h4>
                    <Badge variant="outline" className="rounded-md font-bold text-xs">{selectedSkills.length} / 5</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {extractedSkills.map(skill => (
                      <div
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`cursor-pointer px-4 py-3 rounded-2xl border-2 transition-all flex items-center gap-2 font-bold ${
                          selectedSkills.includes(skill)
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-muted/50 border-transparent hover:border-muted-foreground/20"
                        }`}
                      >
                         {selectedSkills.includes(skill) && <Check className="h-4 w-4" />}
                         {skill}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedSkills.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">{t("Customize Difficulty")}</h4>
                    <div className="grid gap-4">
                       {selectedSkills.map(skill => (
                         <div key={`diff-${skill}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-muted/30 border border-border/50">
                            <div className="font-bold flex items-center gap-2">
                               <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                               {skill}
                            </div>
                            <div className="flex gap-2">
                               {["Easy", "Medium", "Hard"].map(level => (
                                 <Badge
                                    key={level}
                                    variant={difficultiesBySkill[skill]?.includes(level) ? "default" : "outline"}
                                    onClick={() => toggleDifficultyForSkill(skill, level)}
                                    className={`cursor-pointer px-3 py-1.5 rounded-lg border-none font-bold text-[10px] ${
                                      difficultiesBySkill[skill]?.includes(level) 
                                        ? "shadow-md scale-105" 
                                        : "bg-white dark:bg-zinc-900 border-border hover:bg-muted"
                                    }`}
                                 >
                                   {t(level)}
                                 </Badge>
                               ))}
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="p-8 border-t border-border/50 bg-muted/10">
            <Button 
                className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 disabled:grayscale" 
                disabled={selectedSkills.length === 0 || isLoading || isGenerating}
                onClick={handleGenerate}
              >
                {isGenerating ? (
                  <>
                     <Zap className="mr-2 h-5 w-5 animate-bounce" />
                     {t("Generating Your personalized Quizzes...")}
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-5 w-5" />
                    {t("Generate Quizzes for")} {selectedSkills.length} {t("Select Skills")}
                  </>
                )}
              </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
