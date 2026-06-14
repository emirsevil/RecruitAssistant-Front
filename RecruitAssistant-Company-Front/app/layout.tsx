import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { RecruiterAuthProvider } from "@/lib/auth-context"
import { AppShell } from "@/components/app-shell"
import { Toaster } from "sonner"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Talent Hunter — Company Portal",
  description: "Find and recruit the best candidates for your team",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="font-sans antialiased">
        <RecruiterAuthProvider>
          <AppShell>{children}</AppShell>
          <Toaster richColors closeButton />
        </RecruiterAuthProvider>
      </body>
    </html>
  )
}
