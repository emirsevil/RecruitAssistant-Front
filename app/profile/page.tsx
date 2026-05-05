"use client"

import { useState, useEffect } from "react"
import { PageContainer, PageHeader } from "@/components/page-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User as UserIcon, Briefcase, Camera, Loader2, FileText, Trash2, Eye } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://recruitassistant-back-1.onrender.com"

export default function ProfilePage() {
  const { t } = useLanguage()
  const { user, checkUser } = useAuth()
  const { toast } = useToast()
  
  const [isSaving, setIsSaving] = useState(false)
  const [baseCv, setBaseCv] = useState<{ exists: boolean; hasPdf: boolean }>({
    exists: false,
    hasPdf: false,
  })
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [isDeletingCv, setIsDeletingCv] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

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

  const refreshBaseCvStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/cv/base`, { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      setBaseCv({ exists: !!data.parsed_data, hasPdf: !!data.has_pdf })
    } catch {
      // Treat as no base CV; UI will show the upload widget.
    }
  }

  useEffect(() => {
    refreshBaseCvStatus()
  }, [])

  const handleViewPdf = () => {
    window.open(`${API_BASE_URL}/api/cv/base/pdf`, "_blank")
  }

  const handleDeleteCv = async () => {
    setIsDeletingCv(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/cv/base`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete base CV")
      setBaseCv({ exists: false, hasPdf: false })
      toast({ title: t("Base CV Deleted"), description: t("Your base CV has been removed.") })
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: t("Error"),
        description: err.message || t("Something went wrong"),
      })
    } finally {
      setIsDeletingCv(false)
      setConfirmDeleteOpen(false)
    }
  }

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/upload-profile-image`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        handleChange("profile_image", data.url);
        await checkUser(); // Refresh global user to sync changes
        toast({
          title: t("Photo Updated"),
          description: t("Your profile photo has been successfully updated."),
        });
      } else {
        throw new Error("Upload failed");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: t("Error"),
        description: err.message || t("Failed to upload photo"),
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const getAvatarUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const baseUrl = API_BASE_URL;
    return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
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
              {getAvatarUrl(profile.profile_image) ? (
                <AvatarImage src={getAvatarUrl(profile.profile_image)!} alt={profile.full_name} />
              ) : null}
              <AvatarFallback className="text-3xl bg-clay-soft text-clay">{getInitials(profile.full_name || "User")}</AvatarFallback>
            </Avatar>
            <div className="relative w-full">
              <Input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
                onChange={handlePhotoUpload}
                disabled={isSaving || isUploadingPhoto}
                title={t("Click to upload")}
              />
              <Button variant="outline" className="w-full gap-2 bg-transparent pointer-events-none" disabled={isSaving || isUploadingPhoto}>
                {isUploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {isUploadingPhoto ? t("Uploading...") : t("Change Photo")}
              </Button>
            </div>
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

        {/* Base CV Upload */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" />
              <CardTitle>{t("Base CV")}</CardTitle>
            </div>
            <CardDescription>{t("Upload your main resume to use as a fallback for new workspaces")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {baseCv.exists && (
              <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{t("Base CV on file")}</p>
                    <p className="text-xs text-muted-foreground">
                      {baseCv.hasPdf ? t("PDF available") : t("No PDF preview (uploaded as DOCX)")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {baseCv.hasPdf && (
                    <Button variant="outline" size="sm" onClick={handleViewPdf} className="gap-1.5">
                      <Eye className="h-4 w-4" />
                      {t("View PDF")}
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmDeleteOpen(true)}
                    className="gap-1.5"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("Delete")}
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="base_cv">{baseCv.exists ? t("Replace Base CV") : t("Upload Base CV")}</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="base_cv"
                  type="file"
                  accept=".pdf,.docx"
                  disabled={isSaving}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setIsSaving(true)
                    try {
                      const fd = new FormData()
                      fd.append("file", file)
                      const parseRes = await fetch("/api/parse-resume", {
                        method: "POST",
                        body: fd,
                      })
                      if (!parseRes.ok) throw new Error("Failed to parse resume")
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

                      const saveRes = await fetch(`${API_BASE_URL}/api/cv/base`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ parsed_data: parsedData, pdf_base64 }),
                        credentials: "include"
                      })
                      if (!saveRes.ok) throw new Error("Failed to save Base CV")

                      await refreshBaseCvStatus()
                      toast({
                        title: t("Base CV Updated"),
                        description: t("Your Base CV has been successfully processed and saved."),
                      })
                    } catch (err: any) {
                      toast({
                        variant: "destructive",
                        title: t("Error"),
                        description: err.message || t("Something went wrong"),
                      })
                    } finally {
                      setIsSaving(false)
                      e.target.value = ""
                    }
                  }}
                />
              </div>
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

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Delete Base CV")}</DialogTitle>
            <DialogDescription>
              {t("This will permanently remove your base CV. Workspaces that don't have their own generated CV will lose this fallback. You can re-upload at any time.")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)} disabled={isDeletingCv}>
              {t("Cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteCv} disabled={isDeletingCv} className="gap-1.5">
              {isDeletingCv ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {t("Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}

