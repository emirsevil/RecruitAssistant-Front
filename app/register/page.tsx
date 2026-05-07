"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Info } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { Logo } from "@/components/logo"

export default function RegisterPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const { user, isLoading: authLoading } = useAuth()
  const tr_ = language === "tr"

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard")
    }
  }, [authLoading, user, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-sm">
              <Logo size={32} variant="mark" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            {tr_ ? "Demo Modu" : "Demo Mode"}
          </CardTitle>
          <CardDescription className="text-center">
            {tr_
              ? "Şu anda demo aşamasındayız ve hesap oluşturulmasına izin verilmiyor."
              : "We are currently in demo and you are not allowed to create an account."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-primary/5 border border-primary/15 p-4 text-sm text-foreground/80">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
            <p className="leading-relaxed">
              {tr_
                ? "Etkinlik için size verilen e-posta ve şifreyle giriş yapabilirsiniz."
                : "Please log in with the email and password provided to you for the event."}
            </p>
          </div>

          <Link href="/login">
            <Button className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              {tr_ ? "Giriş sayfasına dön" : "Back to login"}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
