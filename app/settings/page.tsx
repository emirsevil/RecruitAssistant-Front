"use client"

import { useState } from "react"

import { PageContainer, PageHeader } from "@/components/page-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Moon, Sun, Monitor, Bell, Lock, Palette } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export default function SettingsPage() {
  const { t } = useLanguage()
  const [theme, setTheme] = useState("system")
  const [notifications, setNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [interviewReminders, setInterviewReminders] = useState(true)

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

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>{t("Notifications")}</CardTitle>
              </div>
              <CardDescription>{t("Configure how you receive notifications")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">{t("Push Notifications")}</Label>
                  <p className="text-sm text-muted-foreground">{t("Receive push notifications for important updates")}</p>
                </div>
                <Switch id="push-notifications" checked={notifications} onCheckedChange={setNotifications} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">{t("Email Notifications")}</Label>
                  <p className="text-sm text-muted-foreground">{t("Get notified via email for weekly progress reports")}</p>
                </div>
                <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="interview-reminders">{t("Interview Reminders")}</Label>
                  <p className="text-sm text-muted-foreground">{t("Remind me to practice mock interviews")}</p>
                </div>
                <Switch id="interview-reminders" checked={interviewReminders} onCheckedChange={setInterviewReminders} />
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
                  <Button variant="outline" size="sm">
                    {t("Download My Data")}
                  </Button>
                  <Button variant="outline" size="sm">
                    {t("Delete Account")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button size="lg">{t("Save Changes")}</Button>
          </div>
        </div>
      </PageContainer>
    </>
  )
}

