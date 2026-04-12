import { Suspense } from "react"
import MockInterviewClient from "./MockInterviewClient"

function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  )
}

export default function MockInterviewPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MockInterviewClient />
    </Suspense>
  )
}
