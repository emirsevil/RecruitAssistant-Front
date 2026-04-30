"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { PageContainer } from "@/components/page-container"
import { Logo } from "@/components/logo"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Monitor, Moon, Zap, Sun } from "lucide-react"

export default function LandingPage() {
  const { t } = useLanguage()
  const [theme, setTheme] = useState("light")

  useEffect(() => {
    if (typeof window === "undefined") return

    const savedTheme = localStorage.getItem("ra-theme")
    const nextTheme = savedTheme === "dark" ? "dark" : "light"
    setTheme(nextTheme)
    document.documentElement.classList.toggle("dark", nextTheme === "dark")
  }, [])

  const handleThemeChange = (value: string) => {
    setTheme(value)
    const darkMode = value === "dark"
    document.documentElement.classList.toggle("dark", darkMode)
    localStorage.setItem("ra-theme", darkMode ? "dark" : "light")
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-sage/20 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-clay-soft blur-3xl" />
        <div className="pointer-events-none absolute left-0 top-48 h-72 w-72 rounded-full bg-plum-soft blur-3xl" />

        <PageContainer className="relative">
          <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm shadow-black/5"
            >
              <Logo size={24} variant="mark" />
              <span>RecruitAssistant</span>
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <Select value={theme} onValueChange={handleThemeChange}>
                <SelectTrigger id="theme" className="w-32">
                  <SelectValue placeholder={t("Theme")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      {t("Light")}
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      {t("Dark")}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <LanguageSwitcher />
            </div>
          </header>

          <div className="grid gap-14 lg:grid-cols-[1.2fr_0.9fr] lg:items-center">
            <section className="space-y-8">
              <span className="inline-flex rounded-full bg-sage-bg px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-sage">
                {t("AI-Powered Career Coaching")}
              </span>
              <div className="space-y-6">
                <h1 className="serif-headline max-w-3xl text-5xl leading-tight tracking-tight text-ink-serif md:text-6xl">
                  {t("Interview confidence starts here")}
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                  {t("Practice AI-powered mock interviews, CV feedback, and progress tracking in one place.")}
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link href="/login">
                  <Button size="lg" className="h-14 rounded-full px-8 font-semibold bg-sage text-foreground hover:bg-sage/90 shadow-sm shadow-black/5">
                    {t("Login")}
                  </Button>
                </Link>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                  {t("New to RecruitAssistant?")} {" "}
                  <Link
                    href="/register"
                    className="font-semibold text-sage underline decoration-sage/30 underline-offset-4 hover:text-sage/90"
                  >
                    {t("Create account")}
                  </Link>
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[32px] border border-border bg-card p-5 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sage">{t("AI review")}</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {t("Stay sharp with guided practice, real-time feedback, and personalized progress.")}
                  </p>
                </div>
                <div className="rounded-[32px] border border-border bg-card p-5 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-clay">{t("CV feedback")}</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {t("Secure your next role with smarter preparation.")}
                  </p>
                </div>
                <div className="rounded-[32px] border border-border bg-card p-5 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-plum">{t("Progress insights")}</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {t("Practice AI-powered mock interviews, CV feedback, and progress tracking in one place.")}
                  </p>
                </div>
              </div>
            </section>

            <section className="relative mx-auto flex max-w-xl justify-center">
              <Card className="w-full border border-border bg-card shadow-lg shadow-black/5">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-4 rounded-3xl bg-sage-soft p-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-sage">{t("Technical Interview")}</p>
                        <p className="mt-2 text-lg font-semibold text-ink-serif">{t("Practice with real prompts")}</p>
                      </div>
                      <div className="rounded-2xl bg-sage p-3 text-white">
                        <Zap className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-border bg-background p-6">
                      <div className="mb-5 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">AI Interview</p>
                          <p className="text-lg font-semibold text-foreground">RecruitAssistant guide</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-3xl bg-sage-soft p-4">
                          <p className="font-semibold text-ink-serif">{t("HR Coach")}</p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {t("Describe a challenging interview experience and get AI feedback.")}
                          </p>
                        </div>
                        <div className="rounded-3xl bg-sage-soft p-4">
                          <p className="font-semibold text-ink-serif">{t("Technical review")}</p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {t("Practice answers, improve clarity, and track your strengths.")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 rounded-[1.75rem] border border-border bg-background p-5">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{t("System Design")}</span>
                        <span className="font-semibold text-ink-serif">87%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-sage-soft">
                        <div className="h-full w-[87%] rounded-full bg-sage" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </PageContainer>
      </div>
    </div>
  )
}

