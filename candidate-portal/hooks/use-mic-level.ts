"use client"

import { useEffect, useState } from "react"

/**
 * Watches the microphone's instantaneous amplitude (RMS) while `active` is true
 * and returns a rolling history of normalized levels (0..1) sized `bars`.
 *
 * The newest sample is always at the end of the array; older samples shift left.
 * When `active` becomes false, the history is cleared back to zeros.
 *
 * Each level is RMS over the time-domain buffer, scaled by `sensitivity`,
 * then clamped to [0, 1]. A small noise floor is subtracted so silent rooms
 * read as 0 (the bars rest flat).
 */
export function useMicLevel(active: boolean, bars = 20, sensitivity = 4) {
  const [history, setHistory] = useState<number[]>(() => Array(bars).fill(0))

  useEffect(() => {
    if (!active) {
      setHistory(Array(bars).fill(0))
      return
    }

    let cancelled = false
    let stream: MediaStream | null = null
    let ctx: AudioContext | null = null
    let analyser: AnalyserNode | null = null
    let rafId: number | null = null

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        const Ctor =
          (window as any).AudioContext || (window as any).webkitAudioContext
        ctx = new Ctor()
        if (!ctx) return
        const src = ctx.createMediaStreamSource(stream)
        analyser = ctx.createAnalyser()
        analyser.fftSize = 1024
        analyser.smoothingTimeConstant = 0.65
        src.connect(analyser)

        const buf = new Uint8Array(analyser.fftSize)
        const NOISE_FLOOR = 0.02

        const tick = () => {
          if (!analyser || cancelled) return
          analyser.getByteTimeDomainData(buf)
          let sum = 0
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128
            sum += v * v
          }
          const rms = Math.sqrt(sum / buf.length)
          const adjusted = Math.max(0, rms - NOISE_FLOOR)
          const level = Math.min(1, adjusted * sensitivity)
          setHistory((prev) => {
            const next = prev.slice(1)
            next.push(level)
            return next
          })
          rafId = requestAnimationFrame(tick)
        }
        rafId = requestAnimationFrame(tick)
      } catch (err) {
        // Mic not available or permission denied — leave history at zeros.
        console.warn("[useMicLevel] cannot read mic level:", err)
      }
    }

    start()

    return () => {
      cancelled = true
      if (rafId) cancelAnimationFrame(rafId)
      if (stream) stream.getTracks().forEach((t) => t.stop())
      if (ctx) ctx.close().catch(() => {})
    }
  }, [active, bars, sensitivity])

  return history
}
