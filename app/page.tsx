"use client"

import type React from "react"

import { useLanguage } from "@/lib/language-context"

import { PageContainer } from "@/components/page-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight, MessageSquare, FileText, Target, TrendingUp } from "lucide-react"

export default function LandingPage() {
  const { t } = useLanguage()

  return (
    <>
      <PageContainer>
        <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center">
          {/* Hero Section */}
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col justify-center">
              <h1 className="mb-4 text-4xl font-bold tracking-tight text-balance md:text-5xl lg:text-6xl">
                {t("Your AI-powered interview companion")}
              </h1>
              <p className="mb-8 text-lg text-muted-foreground text-pretty md:text-xl">
                {t("Practice HR and technical interviews, improve your CV, and track your progress with personalized AI feedback.")}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/onboarding">
                  <Button size="lg" className="gap-2">
                    {t("Start mock interview")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/cv-studio">
                  <Button size="lg" variant="outline" className="gap-2 bg-transparent">
                    <FileText className="h-4 w-4" />
                    {t("Build my CV")}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Illustration placeholder */}
            <div className="flex items-center justify-center">
              <Card className="w-full max-w-md overflow-hidden">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Mock chat bubbles */}
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-secondary px-4 py-3">
                        <p className="text-sm">{t("Tell me about yourself and your background.")}</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-primary-foreground">
                        <p className="text-sm">{t("I recently graduated with a degree in Computer Science...")}</p>
                      </div>
                    </div>

                    {/* Score card mock */}
                    <Card className="border-2 border-primary/20 bg-primary/5">
                      <CardContent className="p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium">{t("Live Feedback")}</span>
                          <span className="text-2xl font-bold text-primary">85%</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span>{t("Clarity")}</span>
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-secondary">
                              <div className="h-full w-[85%] bg-primary" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span>{t("Confidence")}</span>
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-secondary">
                              <div className="h-full w-[75%] bg-primary" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick features */}
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:mt-24 lg:grid-cols-4">
            <FeatureCard
              icon={<MessageSquare className="h-6 w-6" />}
              title={t("Mock Interviews")}
              description={t("Practice with AI-powered HR and technical interviews")}
            />
            <FeatureCard
              icon={<FileText className="h-6 w-6" />}
              title={t("CV Builder")}
              description={t("Create ATS-optimized resumes tailored to your role")}
            />
            <FeatureCard
              icon={<Target className="h-6 w-6" />}
              title={t("Skill Quizzes")}
              description={t("Test your knowledge with targeted quiz questions")}
            />
            <FeatureCard
              icon={<TrendingUp className="h-6 w-6" />}
              title={t("Progress Analytics")}
              description={t("Track your improvement over time with insights")}
            />
          </div>
        </div>
      </PageContainer>
    </>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Card className="transition-colors hover:border-primary/50">
      <CardContent className="p-6">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <h3 className="mb-2 font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground text-pretty">{description}</p>
      </CardContent>
    </Card>
  )
}
