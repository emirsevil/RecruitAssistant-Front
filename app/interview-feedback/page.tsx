"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language-context"
import { useSimulation } from "@/lib/simulation-context"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Send, ArrowLeft, Loader2 } from "lucide-react"

export default function InterviewFeedbackPage() {
  const { t, language } = useLanguage()
  const { submitFeedback, isLoading: simLoading } = useSimulation()
  const router = useRouter()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    real_interview_date: new Date().toISOString().split("T")[0],
    real_interview_type: "technical",
    company_questions: "",
    app_helpful_rating: 3,
    preparation_rating: 3,
    what_helped_most: "",
    what_to_improve: "",
    additional_notes: "",
    interview_result: "pending",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await submitFeedback({
        ...formData,
        real_interview_date: new Date(formData.real_interview_date).toISOString(),
      })
      toast.success(
        language === "tr" ? "Geri bildiriminiz kaydedildi!" : "Feedback saved!",
        { description: language === "tr" ? "Mülakat simülasyonunuza katkıda bulunduğunuz için teşekkürler." : "Thank you for contributing to your interview simulation." }
      )
      router.push("/dashboard")
    } catch (error) {
      toast.error(language === "tr" ? "Hata oluştu" : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-7 sm:py-10">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4 -ml-3 gap-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {language === "tr" ? "Geri" : "Back"}
        </Button>
        <h1 className="serif-headline text-[32px] tracking-tight">
          {language === "tr" ? "Gerçek Mülakat Geri Bildirimi" : "Real Interview Feedback"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {language === "tr"
            ? "Gerçek bir mülakata girdiniz mi? Deneyiminizi bizimle paylaşarak sonraki mock mülakatlarınızı daha iyi özelleştirmemize yardımcı olun."
            : "Did you have a real interview? Share your experience to help us customize your future mock interviews."}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">{language === "tr" ? "Mülakat Tarihi" : "Interview Date"}</Label>
              <Input
                type="date"
                required
                value={formData.real_interview_date}
                onChange={(e) => setFormData({ ...formData, real_interview_date: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">{language === "tr" ? "Mülakat Türü" : "Interview Type"}</Label>
              <Select
                value={formData.real_interview_type}
                onValueChange={(v) => setFormData({ ...formData, real_interview_type: v })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">{language === "tr" ? "Teknik (Technical)" : "Technical"}</SelectItem>
                  <SelectItem value="hr">{language === "tr" ? "İK (HR)" : "HR"}</SelectItem>
                  <SelectItem value="system_design">{language === "tr" ? "Sistem Tasarımı (System Design)" : "System Design"}</SelectItem>
                  <SelectItem value="behavioral">{language === "tr" ? "Davranışsal (Behavioral)" : "Behavioral"}</SelectItem>
                  <SelectItem value="other">{language === "tr" ? "Diğer" : "Other"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[13px] font-medium">
              {language === "tr" ? "Şirket Hangi Soruları Sordu?" : "What questions did the company ask?"}
            </Label>
            <Textarea
              placeholder={language === "tr" ? "Hatırladığınız soruları yazın..." : "Write down the questions you remember..."}
              className="min-h-[100px] rounded-xl resize-y"
              value={formData.company_questions}
              onChange={(e) => setFormData({ ...formData, company_questions: e.target.value })}
            />
          </div>

          <div className="space-y-6 pt-2">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-[13px] font-medium">
                  {language === "tr" ? "Uygulama Hazırlıkta Ne Kadar Yardımcı Oldu?" : "How helpful was the app in your preparation?"}
                </Label>
                <span className="text-[14px] font-semibold text-sage">{formData.app_helpful_rating} / 5</span>
              </div>
              <Slider
                value={[formData.app_helpful_rating]}
                min={1}
                max={5}
                step={1}
                onValueChange={([val]) => setFormData({ ...formData, app_helpful_rating: val })}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-[13px] font-medium">
                  {language === "tr" ? "Kendi Hazırlık Seviyenizi Nasıl Değerlendirirsiniz?" : "How would you rate your own preparation level?"}
                </Label>
                <span className="text-[14px] font-semibold text-sage">{formData.preparation_rating} / 5</span>
              </div>
              <Slider
                value={[formData.preparation_rating]}
                min={1}
                max={5}
                step={1}
                onValueChange={([val]) => setFormData({ ...formData, preparation_rating: val })}
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">
                {language === "tr" ? "Uygulamada En Çok Ne İşe Yaradı?" : "What helped most in the app?"}
              </Label>
              <Textarea
                className="min-h-[80px] rounded-xl resize-y"
                value={formData.what_helped_most}
                onChange={(e) => setFormData({ ...formData, what_helped_most: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">
                {language === "tr" ? "Uygulamada Ne Geliştirilmeli?" : "What should be improved in the app?"}
              </Label>
              <Textarea
                className="min-h-[80px] rounded-xl resize-y"
                value={formData.what_to_improve}
                onChange={(e) => setFormData({ ...formData, what_to_improve: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[13px] font-medium">{language === "tr" ? "Mülakat Sonucu" : "Interview Result"}</Label>
            <Select
              value={formData.interview_result}
              onValueChange={(v) => setFormData({ ...formData, interview_result: v })}
            >
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{language === "tr" ? "Henüz Belli Değil (Pending)" : "Pending"}</SelectItem>
                <SelectItem value="passed">{language === "tr" ? "Geçtim / Teklif Aldım (Passed)" : "Passed"}</SelectItem>
                <SelectItem value="failed">{language === "tr" ? "Olumsuz (Failed)" : "Failed"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || simLoading}
              className="gap-2 rounded-xl bg-sage px-6 h-12 text-white hover:bg-sage/90"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {language === "tr" ? "Geri Bildirimi Gönder" : "Submit Feedback"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
