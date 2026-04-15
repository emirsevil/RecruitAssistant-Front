"use client"

import { useState, useEffect } from "react"
import { PageContainer, PageHeader } from "@/components/page-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User as UserIcon, Briefcase, Camera, Loader2 } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function ProfilePage() {
  const { t } = useLanguage()
  const { user, checkUser } = useAuth()
  const { toast } = useToast()
  
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
    professional_title: "",
    education: "",
    skills: "",
    profile_image: "",
  })

  // Sync state with user data from AuthContext
  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        bio: user.bio || "",
        professional_title: user.professional_title || "",
        education: user.education || "",
        skills: user.skills || "",
        profile_image: user.profile_image || "",
      })
    }
  }, [user])

  const handleChange = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!user) return
    
    setIsSaving(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: profile.full_name,
          phone: profile.phone,
          address: profile.address,
          bio: profile.bio,
          professional_title: profile.professional_title,
          education: profile.education,
          skills: profile.skills,
          profile_image: profile.profile_image,
        }),
        credentials: "include", // Important for cookies
      })

      if (response.ok) {
        toast({
          title: t("Profile Updated"),
          description: t("Your profile information has been successfully saved."),
        })
        // Refresh global user state
        await checkUser()
      } else {
        const error = await response.json()
        throw new Error(error.detail || "Failed to update profile")
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: t("Error"),
        description: err.message || t("Something went wrong"),
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <PageContainer>
      <PageHeader title={t("Profile")} description={t("Manage your personal information and professional details")} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Picture Card */}
        <Card className="lg:col-span-1 border-primary/10 bg-primary/5">
          <CardHeader>
            <CardTitle>{t("Profile Picture")}</CardTitle>
            <CardDescription>{t("Update your profile photo")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32 border-2 border-primary/20">
              <AvatarImage src={profile.profile_image || "/diverse-user-avatars.png"} alt={profile.full_name} />
              <AvatarFallback className="text-3xl bg-secondary">{getInitials(profile.full_name || "User")}</AvatarFallback>
            </Avatar>
            <div className="w-full space-y-2">
              <Label htmlFor="profile_image">{t("Profile Image URL")}</Label>
              <Input 
                id="profile_image" 
                value={profile.profile_image} 
                onChange={(e) => handleChange("profile_image", e.target.value)} 
                placeholder="https://example.com/photo.jpg"
                disabled={isSaving}
              />
            </div>
            <Button variant="outline" className="w-full gap-2 bg-transparent">
              <Camera className="h-4 w-4" />
              {t("Change Photo")}
            </Button>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" />
              <CardTitle>{t("Basic Information")}</CardTitle>
            </div>
            <CardDescription>{t("Update your personal details")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t("Full Name")}</Label>
                <Input 
                  id="name" 
                  value={profile.full_name} 
                  onChange={(e) => handleChange("full_name", e.target.value)} 
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("Email Address")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled={true} // Email should usually be read-only for security
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">{t("Phone Number")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="professional_title">{t("Professional Title")}</Label>
                <Input 
                  id="professional_title" 
                  value={profile.professional_title} 
                  onChange={(e) => handleChange("professional_title", e.target.value)} 
                  disabled={isSaving}
                  placeholder="e.g., Software Engineer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t("Address")}</Label>
              <Input 
                id="address" 
                value={profile.address} 
                onChange={(e) => handleChange("address", e.target.value)} 
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">{t("Bio")}</Label>
              <Textarea
                id="bio"
                rows={3}
                value={profile.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                placeholder={t("Tell us about yourself...")}
                disabled={isSaving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Professional Details */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <CardTitle>{t("Professional Details")}</CardTitle>
            </div>
            <CardDescription>{t("Your education and skills")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="education">{t("Education")}</Label>
              <Input
                id="education"
                value={profile.education}
                onChange={(e) => handleChange("education", e.target.value)}
                placeholder="e.g., B.S. Computer Science, Stanford University"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">{t("Skills")}</Label>
              <Textarea
                id="skills"
                rows={2}
                value={profile.skills}
                onChange={(e) => handleChange("skills", e.target.value)}
                placeholder="List your key skills (comma separated)"
                disabled={isSaving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="lg:col-span-3 flex justify-end gap-3">
          <Button variant="outline" size="lg" disabled={isSaving}>
            {t("Cancel")}
          </Button>
          <Button size="lg" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Saving...")}
              </>
            ) : (
              t("Save Changes")
            )}
          </Button>
        </div>
      </div>
    </PageContainer>
  )
}

