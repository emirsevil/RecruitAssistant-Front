"use client"

import dynamic from "next/dynamic"
import type { Ref } from "react"
import { Mic, Volume2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { AvatarProvider } from "@/hooks/use-voice-interview"
import type { LiveAvatarRoomStatus } from "@/hooks/use-liveavatar-room"

const Avatar3D = dynamic(() => import("@/components/Avatar3D"), { ssr: false })

interface TalkingInterviewerPanelProps {
  analyserNode: AnalyserNode | null
  isSpeaking: boolean
  activeAvatarProvider: AvatarProvider
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

  return (
    <div className="lg:col-span-5 lg:sticky lg:top-6">
      <div className="overflow-hidden border-2 border-primary/10 flex flex-col rounded-xl bg-card shadow-sm">
        <div className="relative w-full aspect-square bg-gradient-to-b from-slate-800 via-slate-850 to-slate-900">
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
          ) : (
            <Avatar3D analyserNode={analyserNode} isSpeaking={isSpeaking} />
          )}

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

        <div className="px-4 py-3 bg-card border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
              {isLiveAvatar ? "🎥" : "🤖"}
            </div>
            <div>
              <p className="text-sm font-medium">{interviewerLabel}</p>
              <p className="text-xs text-muted-foreground">{statusLabel}</p>
            </div>
          </div>
          {isSpeaking && <Volume2 className="h-4 w-4 text-green-500 animate-pulse" />}
        </div>
      </div>
    </div>
  )
}
