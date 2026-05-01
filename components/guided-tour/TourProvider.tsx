"use client"

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react"
import { useRouter, usePathname } from "next/navigation"
import { TOUR_STEPS } from "./tour-steps"
import { useProductTour } from "@/hooks/use-product-tour"
import { TourOverlay } from "./TourOverlay"
import { useLanguage } from "@/lib/language-context"

// ── Session storage key for step persistence across navigation ─────
const STEP_KEY = "ra-tour-step"

function readStep(): number | null {
  if (typeof window === "undefined") return null
  try {
    const v = sessionStorage.getItem(STEP_KEY)
    return v !== null ? parseInt(v, 10) : null
  } catch {
    return null
  }
}

function writeStep(step: number): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(STEP_KEY, String(step))
  } catch {}
}

function clearStep(): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(STEP_KEY)
  } catch {}
}

// ── Context ────────────────────────────────────────────────────────
interface TourContextValue {
  isActive: boolean
  currentStep: number
  totalSteps: number
  next: () => void
  back: () => void
  skip: () => void
  finish: () => void
  startTour: () => void
}

const TourContext = createContext<TourContextValue | null>(null)

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error("useTour must be used within TourProvider")
  return ctx
}

// ── Provider ───────────────────────────────────────────────────────
export function TourProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { language } = useLanguage()
  const { shouldStart, markCompleted, resetTour } = useProductTour()

  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [targetFound, setTargetFound] = useState(false)

  // Track if we've already auto-started in this provider lifecycle
  const didAutoStart = useRef(false)

  const totalSteps = TOUR_STEPS.length
  const step = TOUR_STEPS[currentStep]

  // ── Auto-start on first visit OR after replay ────────────────────
  useEffect(() => {
    if (shouldStart && !isActive && !didAutoStart.current && pathname === "/dashboard") {
      didAutoStart.current = true
      setCurrentStep(0)
      setIsActive(true)
    }
  }, [shouldStart, pathname, isActive])

  // ── Resume after cross-page navigation ───────────────────────────
  useEffect(() => {
    if (!isActive) return
    const savedStep = readStep()
    if (savedStep !== null && savedStep !== currentStep) {
      const target = TOUR_STEPS[savedStep]
      if (target && target.route === pathname) {
        setCurrentStep(savedStep)
        clearStep()
      }
    }
  }, [pathname, isActive]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Find target element (poll with rAF, timeout 2.5s) ────────────
  useEffect(() => {
    if (!isActive || !step) return

    // If step has no target (centered), clear rect
    if (!step.target) {
      setTargetRect(null)
      setTargetFound(true)
      return
    }

    // If we're on the wrong route, navigate there
    if (step.route !== pathname) {
      writeStep(currentStep)
      router.push(step.route)
      return
    }

    let cancelled = false
    const startTime = Date.now()
    const TIMEOUT = 2500

    function poll() {
      if (cancelled) return
      const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        // Small delay to let scroll finish before reading rect
        setTimeout(() => {
          if (cancelled) return
          const rect = el.getBoundingClientRect()
          setTargetRect(rect)
          setTargetFound(true)
        }, 350)
        return
      }
      if (Date.now() - startTime > TIMEOUT) {
        // Target not found — show centered fallback (not auto-skip)
        setTargetRect(null)
        setTargetFound(true)
        return
      }
      requestAnimationFrame(poll)
    }

    setTargetFound(false)
    setTargetRect(null)
    requestAnimationFrame(poll)

    return () => {
      cancelled = true
    }
  }, [isActive, currentStep, step, pathname, router])

  // ── Recalculate rect on scroll/resize ────────────────────────────
  useEffect(() => {
    if (!isActive || !step?.target || !targetFound) return

    function recalc() {
      const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null
      if (el) {
        setTargetRect(el.getBoundingClientRect())
      }
    }

    window.addEventListener("scroll", recalc, true)
    window.addEventListener("resize", recalc)
    return () => {
      window.removeEventListener("scroll", recalc, true)
      window.removeEventListener("resize", recalc)
    }
  }, [isActive, step?.target, targetFound]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigation handlers ──────────────────────────────────────────
  const goToStep = useCallback(
    (stepIndex: number) => {
      const target = TOUR_STEPS[stepIndex]
      if (!target) return

      setTargetFound(false)
      setTargetRect(null)
      setCurrentStep(stepIndex)

      if (target.route !== pathname) {
        writeStep(stepIndex)
        router.push(target.route)
      }
    },
    [pathname, router]
  )

  const next = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      goToStep(currentStep + 1)
    }
  }, [currentStep, totalSteps, goToStep])

  const back = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1)
    }
  }, [currentStep, goToStep])

  const endTour = useCallback(() => {
    setIsActive(false)
    setCurrentStep(0)
    setTargetRect(null)
    setTargetFound(false)
    clearStep()
    markCompleted()
  }, [markCompleted])

  const skip = useCallback(() => {
    endTour()
  }, [endTour])

  const finish = useCallback(() => {
    endTour()
  }, [endTour])

  // ── Manual replay (called from Settings) ─────────────────────────
  const startTour = useCallback(() => {
    // Reset persistence + session state
    resetTour()
    // Reset provider state
    didAutoStart.current = true
    setCurrentStep(0)
    setTargetRect(null)
    setTargetFound(false)
    clearStep()
    setIsActive(true)
    // Navigate to dashboard if not already there
    if (pathname !== "/dashboard") {
      writeStep(0)
      router.push("/dashboard")
    }
  }, [pathname, router, resetTour])

  const ctxValue: TourContextValue = {
    isActive,
    currentStep,
    totalSteps,
    next,
    back,
    skip,
    finish,
    startTour,
  }

  return (
    <TourContext.Provider value={ctxValue}>
      {children}
      {isActive && targetFound && (
        <TourOverlay
          step={step}
          stepIndex={currentStep}
          totalSteps={totalSteps}
          targetRect={targetRect}
          language={language}
          onNext={next}
          onBack={back}
          onSkip={skip}
          onFinish={finish}
          onCtaClick={(href: string) => {
            endTour()
            router.push(href)
          }}
        />
      )}
    </TourContext.Provider>
  )
}
