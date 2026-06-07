"use client"

import React, { useState } from "react"
import { useSimulation } from "@/lib/simulation-context"
import { useLanguage } from "@/lib/language-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { HelpCircle, Briefcase, CheckCircle2, ArrowRight } from "lucide-react"

export function RealInterviewPrompt() {
  const { status, submitFeedback, advanceStage, updateTargetInterviewCount } = useSimulation()
  const { language } = useLanguage()
  const router = useRouter()

  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<"form" | "decision">("form")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [companyQuestions, setCompanyQuestions] = useState("")
  const [appHelpfulRating, setAppHelpfulRating] = useState("5")
  const [whatHelpedMost, setWhatHelpedMost] = useState("")
  const [whatToImprove, setWhatToImprove] = useState("")

  if (!status || status.stage !== "interview_cycle") return null

  const currentInterviewNum = (status.total_feedbacks || 0) + 1
  const promptText = language === "tr"
    ? `${currentInterviewNum}. mülakatınıza girdiniz mi?`
    : `Did you attend your ${currentInterviewNum}${currentInterviewNum === 1 ? "st" : currentInterviewNum === 2 ? "nd" : currentInterviewNum === 3 ? "rd" : "th"} interview?`

  const handleOpen = () => {
    setStep("form")
    setIsOpen(true)
  }

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await submitFeedback({
        company_questions: companyQuestions,
        app_helpful_rating: parseInt(appHelpfulRating),
        what_helped_most: whatHelpedMost,
        what_to_improve: whatToImprove,
        real_interview_date: new Date().toISOString(),
      })
      // Clear form
      setCompanyQuestions("")
      setAppHelpfulRating("5")
      setWhatHelpedMost("")
      setWhatToImprove("")
      // Move to decision step
      setStep("decision")
    } catch (err) {
      console.error("Failed to submit feedback", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNextInterview = async () => {
    // Check if we need to bump the target count
    if (status.total_feedbacks >= status.target_interview_count) {
      await updateTargetInterviewCount(status.total_feedbacks + 1)
    }
    setIsOpen(false)
  }

  const handleOfferStage = async () => {
    setIsSubmitting(true)
    try {
      await advanceStage("completed")
      setIsOpen(false)
      router.push("/dashboard")
    } catch (err) {
      console.error("Failed to advance stage", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 bg-card border border-border shadow-lg p-4 rounded-2xl animate-in slide-in-from-bottom-5">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-foreground">{promptText}</p>
          <p className="text-xs text-muted-foreground">
            {language === "tr" ? "Gerçek deneyiminizi paylaşarak simülasyonu ilerletin." : "Share your real experience to advance the simulation."}
          </p>
        </div>
        <Button onClick={handleOpen} className="bg-sage text-white hover:bg-sage/90 rounded-full px-5">
          {language === "tr" ? "Evet, katıldım" : "Yes, I attended"}
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {step === "form" ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-sage" />
                  {language === "tr" ? "Gerçek Mülakat Geri Bildirimi" : "Real Interview Feedback"}
                </DialogTitle>
                <DialogDescription>
                  {language === "tr"
                    ? "Mülakat deneyiminizi bizimle paylaşın. Bu bilgiler simülasyonu daha iyi hale getirmemize yardımcı olacak."
                    : "Share your interview experience with us. This will help improve the simulation."}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmitFeedback} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>{language === "tr" ? "Size neler soruldu?" : "What were you asked?"}</Label>
                  <Textarea
                    required
                    placeholder={language === "tr" ? "Teknik sorular, İK soruları..." : "Technical questions, HR questions..."}
                    value={companyQuestions}
                    onChange={(e) => setCompanyQuestions(e.target.value)}
                    className="h-24 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === "tr" ? "Uygulamamız ne kadar faydalı oldu? (1-5)" : "How helpful was our app? (1-5)"}</Label>
                  <Select value={appHelpfulRating} onValueChange={setAppHelpfulRating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - {language === "tr" ? "Hiç" : "Not at all"}</SelectItem>
                      <SelectItem value="2">2 - {language === "tr" ? "Biraz" : "Slightly"}</SelectItem>
                      <SelectItem value="3">3 - {language === "tr" ? "Orta" : "Moderately"}</SelectItem>
                      <SelectItem value="4">4 - {language === "tr" ? "Çok" : "Very"}</SelectItem>
                      <SelectItem value="5">5 - {language === "tr" ? "Mükemmel" : "Extremely"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{language === "tr" ? "En çok ne yardımcı oldu?" : "What helped the most?"}</Label>
                  <Input
                    value={whatHelpedMost}
                    onChange={(e) => setWhatHelpedMost(e.target.value)}
                    placeholder={language === "tr" ? "Örn: Mock mülakatlar..." : "E.g. Mock interviews..."}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === "tr" ? "Neyi geliştirebiliriz?" : "What could be improved?"}</Label>
                  <Input
                    value={whatToImprove}
                    onChange={(e) => setWhatToImprove(e.target.value)}
                    placeholder={language === "tr" ? "Örn: Daha zor sorular..." : "E.g. Harder questions..."}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSubmitting} className="bg-sage text-white hover:bg-sage/90">
                    {isSubmitting ? (language === "tr" ? "Kaydediliyor..." : "Saving...") : (language === "tr" ? "Gönder" : "Submit")}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  {language === "tr" ? "Geri Bildirim Alındı!" : "Feedback Received!"}
                </DialogTitle>
                <DialogDescription className="text-base pt-2 text-foreground">
                  {language === "tr"
                    ? "Harika! Geri bildiriminiz başarıyla kaydedildi. Peki şimdi ne olacak?"
                    : "Awesome! Your feedback was saved successfully. So what's next?"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-6 flex flex-col gap-4">
                <p className="font-medium text-center text-lg mb-2">
                  {language === "tr" ? "2. bir mülakat olacak mı yoksa teklif sürecine mi geçtiniz?" : "Is there another interview or did you move to the offer stage?"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col gap-2 items-center justify-center border-sage text-sage hover:bg-sage-soft whitespace-normal text-center"
                    onClick={handleNextInterview}
                    disabled={isSubmitting}
                  >
                    <ArrowRight className="h-5 w-5" />
                    <span>{language === "tr" ? "Başka bir mülakat daha olacak" : "I have another interview"}</span>
                  </Button>
                  <Button
                    className="h-auto py-4 flex flex-col gap-2 items-center justify-center bg-emerald-600 text-white hover:bg-emerald-700 whitespace-normal text-center"
                    onClick={handleOfferStage}
                    disabled={isSubmitting}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    <span>{language === "tr" ? "Teklif sürecine geçtim!" : "I moved to the offer stage!"}</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
