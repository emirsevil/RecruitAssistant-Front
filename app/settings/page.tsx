"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { PageContainer, PageHeader } from "@/components/page-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Moon, Sun, Monitor, Bell, Lock, Palette, RotateCcw, Loader2, AlertTriangle } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useTour } from "@/components/guided-tour/TourProvider"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function SettingsPage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const { startTour } = useTour()
  const { logout } = useAuth()
  const { toast } = useToast()
  
  const [theme, setTheme] = useState("system")
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleThemeChange = (value: string) => {
    setTheme(value)
    if (value === "dark") {
      document.documentElement.classList.add("dark")
    } else if (value === "light") {
      document.documentElement.classList.remove("dark")
    } else {
      // System preference
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://recruitassistant-back-1.onrender.com"
      const response = await fetch(`${baseUrl}/auth/account`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        toast({
          title: language === "tr" ? "Hesap Silindi" : "Account Deleted",
          description: language === "tr" 
            ? "Hesabınız ve tüm verileriniz başarıyla silindi." 
            : "Your account and all associated data have been successfully removed.",
        })
        logout() // Clear local state
        router.push("/register")
      } else {
        const error = await response.json()
        throw new Error(error.detail || "Failed to delete account")
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: language === "tr" ? "Hata" : "Error",
        description: err.message || (language === "tr" ? "Bir şeyler yanlış gitti" : "Something went wrong"),
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <>
      <PageContainer>
        <PageHeader title={t("Settings")} description={t("Manage your account settings and preferences")} />

        <div className="space-y-6">
          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <CardTitle>{t("Appearance")}</CardTitle>
              </div>
              <CardDescription>{t("Customize how the app looks on your device")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">{t("Theme")}</Label>
                <Select value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger id="theme" className="w-full sm:w-[200px]">
                    <SelectValue />
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
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        {t("System")}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">{t("Select the theme for the dashboard")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <CardTitle>{t("Privacy & Security")}</CardTitle>
              </div>
              <CardDescription>{t("Manage your privacy and security settings")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                {t("Change Password")}
              </Button>
              <p className="text-sm text-muted-foreground">{t("Update your password to keep your account secure")}</p>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t("Data Management")}</h4>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    {t("Delete Account")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Tour */}
          <Card data-tour="settings-tour-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-primary" />
                <CardTitle>{t("Product Tour")}</CardTitle>
              </div>
              <CardDescription>{t("Revisit the onboarding walkthrough to learn about all platform features")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full sm:w-auto bg-transparent"
                onClick={() => {
                  startTour()
                }}
              >
                {t("Replay onboarding tour")}
              </Button>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button size="lg">{t("Save Changes")}</Button>
          </div>
        </div>
      </PageContainer>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t("Delete Account")}
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2 text-foreground">
              <p className="font-semibold">
                {language === "tr" 
                  ? "Hesabınızı silmek istediğinizden emin misiniz?" 
                  : "Are you sure you want to delete your account?"}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === "tr"
                  ? "Bu işlem geri alınamaz. Hesabınız, oluşturduğunuz CV'ler, çalışma alanları, quiz sonuçları ve mülakat geçmişi dahil tüm verileriniz kalıcı olarak silinecektir."
                  : "This action cannot be undone. Your profile, generated CVs, workspaces, quiz results, and interview history will be permanently deleted."}
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)} 
              disabled={isDeleting}
            >
              {t("cancel")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount} 
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {language === "tr" ? "Hesabı Kalıcı Olarak Sil" : "Permanently Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

