import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("page-shell w-full min-w-0 py-6 md:py-8", className)}>
      {children}
    </div>
  )
}

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:mb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">{title}</h1>
        {description && <p className="mt-2 text-muted-foreground text-pretty">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
