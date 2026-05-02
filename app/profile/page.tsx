"use client"

import { useState, useEffect } from "react"
import { PageContainer, PageHeader } from "@/components/page-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User as UserIcon, Briefcase, Camera, Loader2, FileText, Upload, Trash2 } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function ProfilePage() {
  const { t } = useLanguage()
  const { user, checkUser } = useAuth()
  const { toast } = useToast()
  
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isUploadingCv, setIsUploadingCv] = useState(false)
  
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

  const handleBaseCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: t("Error"),
        description: t("Only PDF files are supported"),
      });
      return;
    }

    setIsUploadingCv(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/upload-base-cv`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (response.ok) {
        await checkUser();
        toast({
          title: t("Base CV Updated"),
          description: t("Your base CV has been extracted and saved successfully."),
        });
      } else {
        throw new Error("Upload failed");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: t("Error"),
        description: err.message || t("Failed to upload Base CV"),
      });
    } finally {
      setIsUploadingCv(false);
    }
  };

  const handleRemoveBaseCv = async () => {
    setIsUploadingCv(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/base-cv`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        await checkUser();
        toast({
          title: t("Base CV Removed"),
          description: t("Your base CV has been removed successfully."),
        });
      } else {
        throw new Error("Failed to remove Base CV");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: t("Error"),
        description: err.message || t("Failed to remove Base CV"),
      });
    } finally {
      setIsUploadingCv(false);
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
              <AvatarFallback className="text-3xl bg-secondary">{getInitials(profile.full_name || "User")}</AvatarFallback>
            </Avatar>
            <div className="w-full space-y-2">
              <Label htmlFor="profile_image">{t("Profile Image URL")}</Label>
              <Input 
                id="profile_image" 
                value={profile.profile_image} 
                onChange={(e) => handleChange("profile_image", e.target.value)} 
                placeholder="https://example.com/photo.jpg"
                disabled={isSaving || isUploadingPhoto}
              />
            </div>
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

        {/* Base CV Section */}
        <Card className="lg:col-span-3 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>{t("Base CV")}</CardTitle>
            </div>
            <CardDescription>{t("Upload a default CV PDF. We will extract the text to use as context for AI interviews when a workspace specific CV is not available.")}</CardDescription>
          </CardHeader>
          <CardContent>
            {user?.base_cv ? (
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{t("CV Extracted Successfully")}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1 max-w-[300px]">
                      {user.base_cv.substring(0, 100)}...
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Input
                      type="file"
                      accept=".pdf"
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                      onChange={handleBaseCvUpload}
                      disabled={isUploadingCv}
                      title={t("Update Base CV")}
                    />
                    <Button variant="outline" size="sm" className="pointer-events-none" disabled={isUploadingCv}>
                      {isUploadingCv ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      {t("Replace")}
                    </Button>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleRemoveBaseCv} disabled={isUploadingCv}>
                    {isUploadingCv ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    {t("Remove")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-1">{t("Upload your Base CV")}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("PDF files only. Maximum size 5MB.")}
                </p>
                <div className="relative max-w-xs mx-auto">
                  <Input
                    type="file"
                    accept=".pdf"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    onChange={handleBaseCvUpload}
                    disabled={isUploadingCv}
                    title={t("Click to upload")}
                  />
                  <Button className="w-full pointer-events-none" disabled={isUploadingCv}>
                    {isUploadingCv ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("Uploading...")}
                      </>
                    ) : (
                      t("Select File")
                    )}
                  </Button>
                </div>
              </div>
            )}
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

