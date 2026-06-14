import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: number
  variant?: "full" | "mark"
}

export function Logo({ className, size = 28, variant = "full" }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        className="text-ink"
      >
        <rect x="2" y="2" width="60" height="60" rx="14" fill="#1C1A18" />
        <path
          d="M19 14 L19 50"
          stroke="#FAF7F2"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M19 14 L34 14 A10 10 0 0 1 34 32 L19 32"
          stroke="#FAF7F2"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M28 32 L34 40"
          stroke="#FAF7F2"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M34 40 L40 34 L46 42 L52 24"
          stroke="#6FA784"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="52" cy="24" r="2.6" fill="#6FA784" />
      </svg>

      {variant === "full" ? (
        <span className="font-serif text-[17px] tracking-tight text-foreground">
          Recruit<span className="italic">Assistant</span>
        </span>
      ) : null}
    </span>
  )
}
