import { Suspense } from "react"
import { LoginContent } from "./login-content"

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="h-[28rem] w-full max-w-md animate-pulse rounded-xl border bg-card" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  )
}
