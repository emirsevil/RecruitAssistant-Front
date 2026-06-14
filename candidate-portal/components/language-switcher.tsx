"use client"

import { useLanguage } from "@/lib/language-context"

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "tr", label: "TR" },
] as const

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/90 px-3 py-2 text-sm text-foreground shadow-sm shadow-black/5 backdrop-blur-md">
      <span className="font-medium text-muted-foreground whitespace-nowrap">
        {t("Language")}:
      </span>
      <div className="inline-flex items-center gap-2 rounded-full bg-slate-100/80 p-1 text-sm dark:bg-slate-900/80">
        {LANGUAGES.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => setLanguage(item.code)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              language === item.code
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
