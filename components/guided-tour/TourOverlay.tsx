"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { ChevronLeft, ArrowRight, X, Sparkles } from "lucide-react"
import type { TourStep } from "./tour-steps"

interface TourOverlayProps {
  step: TourStep
  stepIndex: number
  totalSteps: number
  targetRect: DOMRect | null
  language: string
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  onFinish: () => void
  onCtaClick: (href: string) => void
}

// ── Localized UI strings ───────────────────────────────────────────
const UI = {
  en: {
    stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
    skipTour: "Skip tour",
    back: "Back",
    next: "Next",
    finish: "Finish",
  },
  tr: {
    stepOf: (n: number, total: number) => `Adım ${n} / ${total}`,
    skipTour: "Turu atla",
    back: "Geri",
    next: "İleri",
    finish: "Bitir",
  },
} as const

// ── Tooltip position calculator ────────────────────────────────────
function calcTooltipPos(
  targetRect: DOMRect | null,
  placement: string | undefined,
  tooltipW: number,
  tooltipH: number
) {
  if (!targetRect) {
    // Centered fallback
    return {
      top: Math.max(40, (window.innerHeight - tooltipH) / 2),
      left: Math.max(16, (window.innerWidth - tooltipW) / 2),
      effectivePlacement: "center" as const,
    }
  }

  const pad = 16
  const arrowGap = 14
  const vw = window.innerWidth
  const vh = window.innerHeight

  const preferred = placement || "bottom"

  // Try preferred, then fallbacks
  const attempts: Array<"bottom" | "top" | "right" | "left"> =
    preferred === "bottom"
      ? ["bottom", "top", "right", "left"]
      : preferred === "top"
        ? ["top", "bottom", "right", "left"]
        : preferred === "right"
          ? ["right", "bottom", "top", "left"]
          : ["left", "bottom", "top", "right"]

  let bestDir = preferred
  let maxSpace = -1
  let bestTop = 0
  let bestLeft = 0

  for (const dir of attempts) {
    let top = 0
    let left = 0

    if (dir === "bottom") {
      top = targetRect.bottom + arrowGap
      left = targetRect.left + targetRect.width / 2 - tooltipW / 2
    } else if (dir === "top") {
      top = targetRect.top - tooltipH - arrowGap
      left = targetRect.left + targetRect.width / 2 - tooltipW / 2
    } else if (dir === "right") {
      top = targetRect.top + targetRect.height / 2 - tooltipH / 2
      left = targetRect.right + arrowGap
    } else {
      top = targetRect.top + targetRect.height / 2 - tooltipH / 2
      left = targetRect.left - tooltipW - arrowGap
    }

    // Clamp to viewport
    const cLeft = Math.max(pad, Math.min(left, vw - tooltipW - pad))
    const cTop = Math.max(pad, Math.min(top, vh - tooltipH - pad))

    // Check if the clamped tooltip overlaps the target
    // We add a tiny 2px buffer to consider it "overlapping" if it touches
    const overlaps = !(
      cLeft + tooltipW + 2 < targetRect.left ||
      cLeft > targetRect.right + 2 ||
      cTop + tooltipH + 2 < targetRect.top ||
      cTop > targetRect.bottom + 2
    )

    if (!overlaps) {
      // Perfect fit! It fits on screen and doesn't cover the target.
      return { top: cTop, left: cLeft, effectivePlacement: dir }
    }

    // If it overlaps, calculate available space to pick the "least bad" option
    let space = 0
    if (dir === "top") space = targetRect.top
    else if (dir === "bottom") space = vh - targetRect.bottom
    else if (dir === "left") space = targetRect.left
    else if (dir === "right") space = vw - targetRect.right

    if (space > maxSpace) {
      maxSpace = space
      bestDir = dir
      bestTop = cTop
      bestLeft = cLeft
    }
  }

  // Ultimate fallback: All directions overlap the target (screen is too small or target is huge)
  // Use the direction that had the most available physical space
  return {
    top: bestTop,
    left: bestLeft,
    effectivePlacement: bestDir as any,
  }
}

export function TourOverlay({
  step,
  stepIndex,
  totalSteps,
  targetRect,
  language,
  onNext,
  onBack,
  onSkip,
  onFinish,
  onCtaClick,
}: TourOverlayProps) {
  const [mounted, setMounted] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [tooltipSize, setTooltipSize] = useState({ w: 380, h: 300 })

  const isTr = language === "tr"
  const ui = isTr ? UI.tr : UI.en

  useEffect(() => {
    setMounted(true)
  }, [])

  // Measure tooltip after render
  useEffect(() => {
    if (tooltipRef.current) {
      // Use RAF to ensure layout is settled
      requestAnimationFrame(() => {
        if (tooltipRef.current) {
          const { offsetWidth, offsetHeight } = tooltipRef.current
          setTooltipSize({ w: offsetWidth, h: offsetHeight })
        }
      })
    }
  }, [stepIndex, step, language])

  // ── SVG mask for spotlight ─────────────────────────────────────
  const spotlightPath = useMemo(() => {
    if (!targetRect) return null

    const vw = window.innerWidth
    const vh = window.innerHeight
    const pad = 8
    const r = 12 // border radius

    const x = targetRect.left - pad
    const y = targetRect.top - pad
    const w = targetRect.width + pad * 2
    const h = targetRect.height + pad * 2

    // Full-screen rect with a rounded-rect hole
    return `M0,0 L${vw},0 L${vw},${vh} L0,${vh} Z M${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} L${x + r},${y + h} Q${x},${y + h} ${x},${y + h - r} L${x},${y + r} Q${x},${y} ${x + r},${y} Z`
  }, [targetRect])

  const { top, left, effectivePlacement } = useMemo(
    () =>
      calcTooltipPos(
        targetRect,
        step.placement,
        tooltipSize.w,
        tooltipSize.h
      ),
    [targetRect, step.placement, tooltipSize]
  )

  const isLastStep = stepIndex === totalSteps - 1
  const isFirstStep = stepIndex === 0
  const isCentered = !targetRect
  const hasCtas = step.ctas && step.ctas.length > 0

  // Pick localized content
  const title = isTr ? step.titleTr : step.title
  const description = isTr ? step.descriptionTr : step.description

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999]"
      style={{ pointerEvents: "none" }}
    >
      {/* Dark overlay with spotlight cutout */}
      <svg
        className="absolute inset-0 h-full w-full"
        style={{ pointerEvents: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <path
          d={
            spotlightPath ||
            `M0,0 L${window.innerWidth},0 L${window.innerWidth},${window.innerHeight} L0,${window.innerHeight} Z`
          }
          fill="rgba(0,0,0,0.55)"
          fillRule="evenodd"
        />
      </svg>

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className={cn(
          "absolute z-[10000] rounded-2xl border border-border bg-card shadow-2xl",
          "transition-all duration-200 ease-out",
          // Wider on the final CTA step to fit buttons comfortably
          hasCtas
            ? "w-[400px] max-w-[calc(100vw-32px)]"
            : "w-[360px] max-w-[calc(100vw-32px)]"
        )}
        style={{
          top,
          left,
          pointerEvents: "auto",
        }}
      >
        {/* Close / X button — acts like Skip */}
        <button
          type="button"
          onClick={onSkip}
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label={ui.skipTour}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-5 pt-5 pb-0 sm:px-6">
          {/* Step eyebrow */}
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {ui.stepOf(stepIndex + 1, totalSteps)}
          </p>

          {/* Icon badge for centered/final */}
          {isCentered && (
            <div className="mt-4 mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-sage-soft">
              <Sparkles className="h-5 w-5 text-sage" />
            </div>
          )}

          {/* Title */}
          <h2 className="mt-3 serif-headline text-[20px] font-normal leading-tight tracking-tight sm:text-[22px]">
            {title}
          </h2>

          {/* Description */}
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground sm:text-[14px]">
            {description}
          </p>

          {/* CTA grid (final step only) — responsive: 1 col on small, 2 on wider */}
          {hasCtas && (
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {step.ctas!.map((cta) => (
                <button
                  key={cta.href}
                  type="button"
                  onClick={() => onCtaClick(cta.href)}
                  className="flex min-w-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-[12px] font-semibold text-foreground transition-colors hover:bg-secondary sm:text-[13px]"
                >
                  <span className="truncate">
                    {isTr ? cta.labelTr : cta.label}
                  </span>
                  <ArrowRight className="h-3 w-3 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="mt-4 flex max-w-full flex-wrap items-center justify-between gap-2 overflow-hidden border-t border-border px-5 py-3 sm:flex-nowrap sm:px-6">
          {/* Skip */}
          <button
            type="button"
            onClick={onSkip}
            className="flex-shrink-0 whitespace-nowrap text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {ui.skipTour}
          </button>

          {/* Dot indicators — shrink instead of pushing buttons outside */}
          <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 overflow-hidden sm:flex">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-shrink-0 rounded-full transition-all duration-200",
                  i === stepIndex
                    ? "w-3.5 bg-primary"
                    : i < stepIndex
                      ? "w-1.5 bg-primary/40"
                      : "w-1.5 bg-border"
                )}
              />
            ))}
          </div>

          {/* Back + Next/Finish */}
          <div className="ml-auto flex flex-shrink-0 items-center gap-1.5">
            {!isFirstStep && (
              <button
                type="button"
                onClick={onBack}
                className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                <ChevronLeft className="h-3 w-3 flex-shrink-0" />
                {ui.back}
              </button>
            )}

            {isLastStep ? (
              <button
                type="button"
                onClick={onFinish}
                className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {ui.finish}
                <ArrowRight className="h-3 w-3 flex-shrink-0" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onNext}
                className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {ui.next}
                <ArrowRight className="h-3 w-3 flex-shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* Arrow pointer (only when targeting an element) */}
        {targetRect && effectivePlacement !== "center" && (
          <div
            className={cn(
              "absolute h-3 w-3 rotate-45 border bg-card",
              effectivePlacement === "bottom" &&
              "-top-1.5 left-1/2 -translate-x-1/2 border-l border-t border-border",
              effectivePlacement === "top" &&
              "-bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b border-border",
              effectivePlacement === "right" &&
              "-left-1.5 top-1/2 -translate-y-1/2 border-l border-b border-border",
              effectivePlacement === "left" &&
              "-right-1.5 top-1/2 -translate-y-1/2 border-r border-t border-border"
            )}
          />
        )}
      </div>
    </div>,
    document.body
  )
}