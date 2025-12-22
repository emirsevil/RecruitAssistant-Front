"use client"

import { useState } from "react"

import { PageContainer, PageHeader } from "@/components/page-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Briefcase, Camera } from "lucide-react"

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: "Deniz",
    email: "deniz@example.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main Street, San Francisco, CA 94102",
    bio: "Aspiring software engineer passionate about building impactful products. Recent graduate looking for opportunities in tech.",
    title: "Software Engineer",
    education: "B.S. Computer Science, University of California",
    skills: "JavaScript, React, Node.js, Python, SQL",
  })

  const handleChange = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <>
      <PageContainer>
        <PageHeader title="Profile" description="Manage your personal information and professional details" />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Picture Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Update your profile photo</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src="/diverse-user-avatars.png" alt={profile.name} />
                <AvatarFallback className="text-3xl">DN</AvatarFallback>
              </Avatar>
              <Button variant="outline" className="w-full gap-2 bg-transparent">
                <Camera className="h-4 w-4" />
                Change Photo
              </Button>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Basic Information</CardTitle>
              </div>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={profile.name} onChange={(e) => handleChange("name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Professional Title</Label>
                  <Input id="title" value={profile.title} onChange={(e) => handleChange("title", e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={profile.address} onChange={(e) => handleChange("address", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  value={profile.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  placeholder="Tell us about yourself..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Details */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <CardTitle>Professional Details</CardTitle>
              </div>
              <CardDescription>Your education and skills</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="education">Education</Label>
                <Input
                  id="education"
                  value={profile.education}
                  onChange={(e) => handleChange("education", e.target.value)}
                  placeholder="e.g., B.S. Computer Science, Stanford University"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Skills</Label>
                <Textarea
                  id="skills"
                  rows={2}
                  value={profile.skills}
                  onChange={(e) => handleChange("skills", e.target.value)}
                  placeholder="List your key skills (comma separated)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="lg:col-span-3 flex justify-end gap-3">
            <Button variant="outline" size="lg">
              Cancel
            </Button>
            <Button size="lg">Save Changes</Button>
          </div>
        </div>
      </PageContainer>
    </>
  )
}
