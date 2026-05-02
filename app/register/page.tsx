"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Logo } from "@/components/logo"

export default function RegisterPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const { register } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError(t("Passwords do not match"))
      return
    }

    if (!formData.agreeToTerms) {
      setError(t("Please agree to the terms and conditions"))
      return
    }

    setIsLoading(true)

    try {
      await register(formData.email, formData.password, formData.name)
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      if (file) {
        // Login temporarily to get token for saving base CV
        const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
          credentials: "include"
        })

        if (loginRes.ok) {
          // Parse resume
          const fd = new FormData()
          fd.append("file", file)
          const parseRes = await fetch("/api/parse-resume", {
            method: "POST",
            body: fd,
          })
          
          if (parseRes.ok) {
            const parsedData = await parseRes.json()
            const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
            const pdf_base64 = isPdf
              ? await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader()
                  reader.onload = () => resolve((reader.result as string).split(",", 2)[1] || "")
                  reader.onerror = reject
                  reader.readAsDataURL(file)
                })
              : null
            // Save as base CV
            await fetch(`${API_BASE_URL}/api/cv/base`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ parsed_data: parsedData, pdf_base64 }),
              credentials: "include"
            })
          }
          
          // Log out so they can log in via the login page
          await fetch(`${API_BASE_URL}/auth/logout`, {
            method: "POST",
            credentials: "include"
          })
        }
      }
      
      router.push("/login?registered=true")
    } catch (err: any) {
      setError(err.message || "Kayıt işlemi başarısız oldu.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-sm">
              <Logo size={32} variant="mark" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">{t("Create an account")}</CardTitle>
          <CardDescription className="text-center">{t("Start your journey with RecruitAssistant")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">{t("Full Name")}</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("Email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("Password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("Confirm Password")}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvUpload">{t("Upload CV (Optional)")}</Label>
              <Input
                id="cvUpload"
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                {t("We will use this as your Base CV to pre-fill information.")}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => handleChange("agreeToTerms", checked as boolean)}
              />
              <Label
                htmlFor="terms"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("I agree to the")}{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  {t("terms and conditions")}
                </Link>
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("Creating account...") : t("Create Account")}
            </Button>

            <Separator />

            <div className="text-center text-sm text-muted-foreground">
              {t("Already have an account?")}{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                {t("Sign in")}
              </Link>
            </div>
          </form>
          </CardContent>
      </Card>
    </div>
  )
}

