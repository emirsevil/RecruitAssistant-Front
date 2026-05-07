"use client"

import type { Ref } from "react"
import { Mic, Volume2, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { AvatarProvider } from "@/hooks/use-voice-interview"
import type { LiveAvatarRoomStatus } from "@/hooks/use-liveavatar-room"

interface TalkingInterviewerPanelProps {
  analyserNode: AnalyserNode | null
  isSpeaking: boolean
  activeAvatarProvider: AvatarProvider
  isAvatarInitializing: boolean
  liveAvatarStatus: LiveAvatarRoomStatus
  liveAvatarVideoRef: Ref<HTMLVideoElement>
  statusLabel: string
  statusColor: string
  statusPulse: boolean
  onInterrupt: () => void
  interviewerLabel: string
  showInterruptButton: boolean
  interruptLabel: string
}

export function TalkingInterviewerPanel({
  analyserNode,
  isSpeaking,
  activeAvatarProvider,
  isAvatarInitializing,
  liveAvatarStatus,
  liveAvatarVideoRef,
  statusLabel,
  statusColor,
  statusPulse,
  onInterrupt,
  interviewerLabel,
  showInterruptButton,
  interruptLabel,
}: TalkingInterviewerPanelProps) {
  const isLiveAvatar = activeAvatarProvider === "liveavatar_full"
  const isVoiceCall = activeAvatarProvider === "voice_call"

  if (isAvatarInitializing) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border-2 border-primary/10 bg-card shadow-sm">
          <div className="relative min-h-0 flex-1 bg-gradient-to-b from-slate-800 via-slate-850 to-slate-900 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-white text-center px-6">
              <div
                className="h-14 w-14 rounded-full border-4 border-white/15 border-t-white/70 animate-spin"
                style={{ animationDuration: "0.9s" }}
              />
              <div>
                <p className="text-sm font-medium">Connecting Avatar...</p>
                <p className="text-xs text-white/50 mt-1">This may take a few seconds</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isVoiceCall) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border-2 border-border bg-card shadow-sm">
          <div className="relative min-h-0 flex-1 flex flex-col items-center justify-center gap-5 bg-secondary px-6 py-8">
            {/* Pulsing avatar circle */}
            <div className={`relative flex items-center justify-center ${isSpeaking ? "animate-pulse" : ""}`}>
              <div className={`absolute h-28 w-28 rounded-full ${isSpeaking ? "bg-primary/20 animate-ping" : "bg-transparent"}`}
                style={{ animationDuration: "2s" }}
              />
              <div className={`absolute h-24 w-24 rounded-full ${isSpeaking ? "bg-primary/10" : "bg-transparent"}`} />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary shadow-lg shadow-primary/25">
                {isSpeaking ? (
                  <Volume2 className="h-8 w-8 text-primary-foreground animate-pulse" />
                ) : (
                  <Phone className="h-8 w-8 text-primary-foreground" />
                )}
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{interviewerLabel}</p>
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${statusColor} ${statusPulse ? "animate-pulse" : ""}`} />
                <span className="text-xs text-muted-foreground">{statusLabel}</span>
              </div>
            </div>

            {/* Audio wave bars (visual feedback when AI speaks) */}
            {isSpeaking && (
              <div className="flex h-8 items-center justify-center gap-[3px]">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-[3px] rounded-full bg-primary/80"
                    style={{
                      height: `${Math.max(12, Math.random() * 100)}%`,
                      animation: `wave-bar 0.6s ease-in-out ${i * 0.05}s infinite alternate`,
                    }}
                  />
                ))}
              </div>
            )}

            {showInterruptButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={onInterrupt}
                className="gap-1.5"
              >
                <Mic className="h-4 w-4" />
                {interruptLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border-2 border-primary/10 bg-card shadow-sm">
        <div className="relative min-h-0 flex-1 bg-gradient-to-b from-slate-800 via-slate-850 to-slate-900">
          {isLiveAvatar ? (
            <>
              <video
                ref={liveAvatarVideoRef}
                className="h-full w-full object-cover"
                autoPlay
                playsInline
              />
              {liveAvatarStatus !== "ready" && liveAvatarStatus !== "speaking" && liveAvatarStatus !== "listening" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/35 px-6 text-center text-sm text-white">
                  Connecting LiveAvatar...
                </div>
              )}
            </>
          ) : null}

          <div className="absolute top-3 left-3 flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm bg-black/40">
              <span className={`h-2 w-2 rounded-full ${statusColor} ${statusPulse ? "animate-pulse" : ""}`} />
              {statusLabel}
            </div>
          </div>

          {showInterruptButton && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              <Button
                variant="outline"
                size="sm"
                onClick={onInterrupt}
                className="gap-1.5 bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-black/70 hover:text-white"
              >
                <Mic className="h-4 w-4" />
                {interruptLabel}
              </Button>
            </div>
          )}
        </div>


      </div>
    </div>
  )
}
