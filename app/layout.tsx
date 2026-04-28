import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import { Inter, Fraunces } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ScheduleProvider } from "@/lib/schedule-context"
import { LanguageProvider } from "@/lib/language-context"
import { WorkspaceProvider } from "@/lib/workspace-context"
import { AuthProvider } from "@/lib/auth-context"
import { InterviewLockProvider } from "@/lib/interview-lock-context"
import { Navigation } from "@/components/navigation"

import { OnboardingGuard } from "@/components/onboarding-guard"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
})
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
})

export const metadata: Metadata = {
  // <CHANGE> Updated metadata for RecruitAssistant
  title: "RecruitAssistant - AI-Powered Career Assistant",
  description: "Practice interviews, improve your CV, and ace your job search with AI",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <LanguageProvider>
          <AuthProvider>
            <WorkspaceProvider>
              <Suspense fallback={null}>
                <OnboardingGuard>
                  <ScheduleProvider>
                    <InterviewLockProvider>
                      <div className="flex min-h-screen">
                        <Navigation />
                        <main className="min-w-0 flex-1">
                          <Suspense fallback={null}>{children}</Suspense>
                        </main>
                      </div>
                      <Analytics />
                    </InterviewLockProvider>
                  </ScheduleProvider>
                </OnboardingGuard>
              </Suspense>
            </WorkspaceProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
