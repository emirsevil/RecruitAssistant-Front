import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("w-full px-7 py-7 md:px-9 md:py-7", className)}>
      {children}
    </div>
  )
}

interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  action?: ReactNode
  className?: string
}

export function PageHeader({ title, description, eyebrow, action, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-8", className)}>
      <div>
        {eyebrow && <p className="eyebrow mb-1.5 text-clay">{eyebrow}</p>}
        <h1 className="serif-headline text-3xl font-normal tracking-tight text-balance md:text-[2rem]">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted-foreground text-pretty">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
