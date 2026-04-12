"use client"

import type React from "react"
import { useLanguage } from "@/lib/language-context"
import { PageContainer } from "@/components/page-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight, MessageSquare, FileText, Target, TrendingUp, ShieldCheck, Zap, Sparkles } from "lucide-react"

export default function LandingPage() {
  const { t } = useLanguage()

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -z-10 h-[1000px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      
      <PageContainer>
        <div className="flex flex-col items-center py-20 lg:py-32">
          {/* Hero Section */}
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col justify-center text-center lg:text-left">
              <div className="mb-6 inline-flex items-center self-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary lg:self-start">
                <Sparkles className="mr-2 h-4 w-4" />
                <span>{t("AI-Powered Career Coaching")}</span>
              </div>
              <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-balance md:text-6xl lg:text-7xl">
                {t("Ace Your Next")} <span className="text-primary">{t("Interview")}</span>
              </h1>
              <p className="mb-10 text-lg text-muted-foreground text-pretty md:text-xl lg:max-w-xl">
                {t("Master the art of interviewing with real-time AI feedback. Practice HR and technical scenarios tailored to your target roles.")}
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                <Link href="/login">
                  <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                    {t("Get Started for Free")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="h-12 border-2 px-8 text-base font-semibold backdrop-blur-sm transition-all hover:bg-primary/5">
                    {t("Create Account")}
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground lg:justify-start">
                <div className="flex items-center">
                  <ShieldCheck className="mr-2 h-4 w-4 text-emerald-500" />
                  <span>{t("Secure & Private")}</span>
                </div>
                <div className="flex items-center">
                  <Zap className="mr-2 h-4 w-4 text-amber-500" />
                  <span>{t("Instant Feedback")}</span>
                </div>
              </div>
            </div>

            {/* Visual Hero Element */}
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-primary/20 via-transparent to-primary/10 blur-2xl" />
              <Card className="relative w-full max-w-md overflow-hidden border-2 border-primary/10 bg-card/80 backdrop-blur-md">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {/* Mock chat interaction */}
                    <div className="space-y-4">
                      <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted/50 p-4 text-sm shadow-sm ring-1 ring-border">
                          <p className="font-medium text-primary mb-1 text-xs uppercase tracking-wider">{t("AI Interviewer")}</p>
                          <p>{t("Tell me about a difficult technical challenge you've faced and how you solved it.")}</p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary p-4 text-sm text-primary-foreground shadow-md ring-1 ring-primary-foreground/10">
                          <p className="font-medium mb-1 text-xs uppercase tracking-wider opacity-80">{t("Candidate (You)")}</p>
                          <p>{t("In my last project, I encountered a major memory leak in our data processing pipeline...")}</p>
                        </div>
                      </div>
                    </div>

                    {/* Analytics Preview */}
                    <div className="rounded-xl border border-border bg-background/50 p-4 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold">{t("Live Performance")}</span>
                        </div>
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600">88%</span>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-medium uppercase text-muted-foreground">
                            <span>{t("Technical Accuracy")}</span>
                            <span>92%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                            <div className="h-full w-[92%] bg-primary transition-all duration-1000" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-medium uppercase text-muted-foreground">
                            <span>{t("Communication confidence")}</span>
                            <span>84%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                            <div className="h-full w-[84%] bg-primary/70 transition-all duration-1000" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-24 grid w-full gap-8 sm:grid-cols-2 lg:mt-32 lg:grid-cols-4">
            <FeatureItem
              icon={<MessageSquare className="h-8 w-8" />}
              title={t("Voice Interviews")}
              description={t("Real-time voice dialogue with AI avatars specializing in HR and Tech.")}
            />
            <FeatureItem
              icon={<FileText className="h-8 w-8" />}
              title={t("Smart CV Analysis")}
              description={t("Get ATS-focused feedback and optimization tips for your resume.")}
            />
            <FeatureItem
              icon={<Target className="h-8 w-8" />}
              title={t("Targeted Quizzes")}
              description={t("Sharpen your knowledge with role-specific skill assessments.")}
            />
            <FeatureItem
              icon={<TrendingUp className="h-8 w-8" />}
              title={t("In-depth Analytics")}
              description={t("Visualize your progress with metrics on confidence and clarity.")}
            />
          </div>
        </div>
      </PageContainer>
    </div>
  )
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Card className="group relative overflow-hidden border-none bg-transparent transition-all hover:bg-muted/30">
      <CardContent className="p-8">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
          {icon}
        </div>
        <h3 className="mb-3 text-xl font-bold tracking-tight">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}
