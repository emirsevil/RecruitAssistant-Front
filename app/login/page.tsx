"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, AlertCircle, CheckCircle, Globe, Sparkles, MapPin } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { apiUrl } from "@/lib/api-config"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Logo } from "@/components/logo"
import { useSearchParams } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language, setLanguage, t } = useLanguage()
  const { login, user, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard")
    }
  }, [authLoading, user, router])
  const [showPassword, setShowPassword] = useState(false)
  const isRegistered = searchParams.get("registered") === "true"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await login(email, password)
      
      const res = await fetch(apiUrl("/workspaces/"), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      })
      
      if (res.ok) {
        const workspaces = await res.json()
        if (workspaces.length === 0) {
          window.location.href = "/onboarding"
          return
        }
      }
      
      window.location.href = "/dashboard"
    } catch (err: any) {
      setError(err.message || t("Login failed. Please check your credentials."))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 relative">
      <div className="absolute top-4 right-4">
        <Select value={language} onValueChange={(val) => setLanguage(val as 'en' | 'tr')}>
          <SelectTrigger className="w-[130px] bg-background/50 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-colors">
            <Globe className="w-4 h-4 mr-2" />
            <SelectValue placeholder={t("language")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tr">Türkçe</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-sm">
              <Logo size={32} variant="mark" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">{t("Welcome back")}</CardTitle>
          <CardDescription className="text-center">{t("Sign in to your RecruitAssistant account")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistered && (
              <Alert className="bg-primary/10 text-primary border-primary/20">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{t("Your account has been created successfully! You can now log in.")}</AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t("Email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("Password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                {t("Forgot password?")}
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("Signing in...") : t("Sign In")}
            </Button>

            <Separator />

            {/* CS Fair info box — pointing users to the on-site booth */}
            <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-background to-primary/[0.04] p-4">
              <div
                className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/15 blur-2xl"
                aria-hidden
              />
              <div className="relative flex items-start gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold leading-snug">
                    {language === "tr"
                      ? "Hesabın yok mu?"
                      : "Don't have an account?"}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                    {language === "tr"
                      ? "RecruitAssistant standımıza uğra, hesabını orada açalım."
                      : "Stop by the RecruitAssistant booth at the CS fair and we'll set you up."}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium text-primary">
                    <MapPin className="h-3 w-3" />
                    {language === "tr"
                      ? "RecruitAssistant Standı"
                      : "RecruitAssistant Booth"}
                  </p>
                </div>
              </div>
            </div>
          </form>
          </CardContent>
      </Card>
    </div>
  )
}

