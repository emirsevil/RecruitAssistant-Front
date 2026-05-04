import { useCallback, useEffect, useRef, useState } from "react"

import { LIVEAVATAR_ENABLED, apiUrl, wsUrl } from "@/lib/api-config"
import { type LiveAvatarEventPayload, useLiveAvatarRoom } from "@/hooks/use-liveavatar-room"

export interface MockQuestion {
  id: number
  question: string
  topic: string
  aiResponse?: boolean
}

export interface EvaluationResult {
  question: string
  topic: string
  score: number
  feedback: string
}

export interface FullEvaluation {
  results: EvaluationResult[]
  overall_score: number
  overall_feedback: string
}

export interface ConversationEntry {
  role: "interviewer" | "candidate"
  text: string
  timestamp: number
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected"
export type SessionState =
  | "idle"
  | "ai_speaking"
  | "listening"
  | "processing"
  | "evaluating"
  | "done"
export type AvatarProvider = "rpm_cartesia" | "liveavatar_full" | "voice_call"
type OutputMode = "cartesia_stream" | "liveavatar" | "browser_tts"

interface LiveAvatarBootstrapResponse {
  provider: AvatarProvider
  liveavatar_session_id: string
  livekit_url: string
  livekit_client_token: string
  max_session_duration: number
}

interface StopLiveAvatarSessionRequest {
  workspace_id: number
  liveavatar_session_id: string
  reason?: string
}

interface UseVoiceInterviewReturn {
  analyserNode: AnalyserNode | null
  connectionStatus: ConnectionStatus
  sessionState: SessionState
  isAiSpeaking: boolean
  isListening: boolean
  isWrappingUp: boolean
  micActive: boolean
  conversationLog: ConversationEntry[]
  questions: MockQuestion[]
  currentQuestionIndex: number
  interviewId: number | null
  evaluation: FullEvaluation | null
  error: string | null
  pendingTranscript: string
  isTranscribing: boolean
  selectedAvatarProvider: AvatarProvider
  activeAvatarProvider: AvatarProvider
  setSelectedAvatarProvider: (provider: AvatarProvider) => void
  isLiveAvatarEnabled: boolean
  liveAvatarStatus: ReturnType<typeof useLiveAvatarRoom>["status"]
  liveAvatarVideoRef: ReturnType<typeof useLiveAvatarRoom>["videoRef"]

  startSession: (config: {
    workspaceId: number
    categories: string[]
    difficulty: string
    interviewType: string
    avatarProvider: AvatarProvider
    durationLimit?: number
  }) => Promise<void>
  resumeSession: (config: { interviewId: number }) => Promise<void>
  toggleMic: () => void
  submitAnswer: () => void
  transcribeRecording: () => Promise<string>
  submitTextAnswer: (text: string) => void
  passQuestion: () => void
  interrupt: () => void
  endSession: () => void
  disconnect: () => void
  stopPlayback: () => void
}

export function useVoiceInterview(): UseVoiceInterviewReturn {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected")
  const [sessionState, setSessionState] = useState<SessionState>("idle")
  const [conversationLog, setConversationLog] = useState<ConversationEntry[]>([])
  const [questions, setQuestions] = useState<MockQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [interviewId, setInterviewId] = useState<number | null>(null)
  const [evaluation, setEvaluation] = useState<FullEvaluation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [micActive, setMicActive] = useState(false)
  const [pendingTranscript, setPendingTranscript] = useState("")
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [selectedAvatarProvider, setSelectedAvatarProvider] = useState<AvatarProvider>("voice_call")
  const [activeAvatarProvider, setActiveAvatarProvider] = useState<AvatarProvider>("voice_call")
  const [isWrappingUp, setIsWrappingUp] = useState(false)

  const isWrappingUpRef = useRef(false)
  const micActiveRef = useRef(false)
  const wsRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const mediaStreamRef = useRef<MediaStream | null>(null)

  const playbackContextRef = useRef<AudioContext | null>(null)
  const playbackQueueRef = useRef<ArrayBuffer[]>([])
  const isPlayingRef = useRef(false)
  const shouldPlayAudioRef = useRef(false)
  const nextPlayTimeRef = useRef(0)
  const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const allChunksReceivedRef = useRef(false)
  const onPlaybackFinishedRef = useRef<(() => void) | null>(null)
  const PRE_BUFFER_COUNT = 3
  const SAMPLE_RATE = 24000

  const sessionStateRef = useRef<SessionState>("idle")
  const activeAvatarProviderRef = useRef<AvatarProvider>("voice_call")
  const activeOutputModeRef = useRef<OutputMode>("cartesia_stream")
  const currentUtteranceIdRef = useRef<string | null>(null)
  const browserSpeechUtteranceIdRef = useRef<string | null>(null)
  const interviewIdRef = useRef<number | null>(null)
  const liveAvatarFailurePendingRef = useRef(false)
  const sessionStartInFlightRef = useRef(false)
  const pendingLiveAvatarSessionIdRef = useRef<string | null>(null)
  const pendingLiveAvatarWorkspaceIdRef = useRef<number | null>(null)
  const liveAvatarSessionOwnedByBackendRef = useRef(false)

  useEffect(() => {
    sessionStateRef.current = sessionState
  }, [sessionState])

  useEffect(() => {
    isWrappingUpRef.current = isWrappingUp
  }, [isWrappingUp])

  useEffect(() => {
    micActiveRef.current = micActive
  }, [micActive])

  useEffect(() => {
    interviewIdRef.current = interviewId
  }, [interviewId])

  const releaseBootstrapLiveAvatarSession = useCallback(
    async (reason = "CLIENT_ABORTED") => {
      if (liveAvatarSessionOwnedByBackendRef.current) {
        pendingLiveAvatarSessionIdRef.current = null
        pendingLiveAvatarWorkspaceIdRef.current = null
        return
      }

      const sessionId = pendingLiveAvatarSessionIdRef.current
      const workspaceId = pendingLiveAvatarWorkspaceIdRef.current
      pendingLiveAvatarSessionIdRef.current = null
      pendingLiveAvatarWorkspaceIdRef.current = null

      if (!sessionId || !workspaceId) {
        return
      }

      const payload: StopLiveAvatarSessionRequest = {
        workspace_id: workspaceId,
        liveavatar_session_id: sessionId,
        reason,
      }

      try {
        await fetch(apiUrl("/voice-interview/liveavatar/stop"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        })
      } catch (stopError) {
        console.error("Failed to stop bootstrap LiveAvatar session:", stopError)
      }
    },
    []
  )

  const sendSpeechFinished = useCallback((utteranceId: string | null) => {
    if (!utteranceId) {
      return
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "avatar_done_speaking",
          utterance_id: utteranceId,
        })
      )
    }
  }, [])

  const cancelBrowserSpeech = useCallback(() => {
    browserSpeechUtteranceIdRef.current = null
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
  }, [])

  const speakWithBrowserTts = useCallback(
    (text: string, utteranceId: string | null) => {
      if (!utteranceId) {
        return
      }

      if (
        typeof window === "undefined" ||
        !("speechSynthesis" in window) ||
        typeof SpeechSynthesisUtterance === "undefined"
      ) {
        setError("Tarayıcı seslendirmesi bu tarayıcıda desteklenmiyor.")
        sendSpeechFinished(utteranceId)
        return
      }

      cancelBrowserSpeech()

      const synth = window.speechSynthesis
      const utterance = new SpeechSynthesisUtterance(text)
      const voices = synth.getVoices()
      const turkishVoice = voices.find((voice) => voice.lang?.toLowerCase().startsWith("tr"))

      utterance.lang = turkishVoice?.lang || "tr-TR"
      utterance.rate = 1
      utterance.pitch = 1
      if (turkishVoice) {
        utterance.voice = turkishVoice
      }

      browserSpeechUtteranceIdRef.current = utteranceId

      utterance.onend = () => {
        if (browserSpeechUtteranceIdRef.current !== utteranceId) {
          return
        }
        browserSpeechUtteranceIdRef.current = null
        sendSpeechFinished(utteranceId)
      }

      utterance.onerror = () => {
        if (browserSpeechUtteranceIdRef.current !== utteranceId) {
          return
        }
        browserSpeechUtteranceIdRef.current = null
        setError("Tarayıcı seslendirmesi başarısız oldu.")
        sendSpeechFinished(utteranceId)
      }

      synth.speak(utterance)
    },
    [cancelBrowserSpeech, sendSpeechFinished]
  )

  const reportLiveAvatarFailure = useCallback((reason: string) => {
    if (activeAvatarProviderRef.current !== "liveavatar_full") {
      return
    }
    if (liveAvatarFailurePendingRef.current) {
      return
    }

    liveAvatarFailurePendingRef.current = true
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "avatar_output_error",
          utterance_id: currentUtteranceIdRef.current,
          reason,
        })
      )
    } else {
      setError(`${reason} Klasik avatar moduna geri dönülüyor.`)
      setActiveAvatarProvider("rpm_cartesia")
      activeAvatarProviderRef.current = "rpm_cartesia"
    }
  }, [])

  const handleLiveAvatarEvent = useCallback(
    (event: LiveAvatarEventPayload) => {
      if (event.event_type === "avatar.speak_ended") {
        if (
          activeAvatarProviderRef.current === "liveavatar_full" &&
          sessionStateRef.current === "ai_speaking" &&
          currentUtteranceIdRef.current &&
          wsRef.current &&
          wsRef.current.readyState === WebSocket.OPEN
        ) {
          wsRef.current.send(
            JSON.stringify({
              type: "avatar_done_speaking",
              utterance_id: currentUtteranceIdRef.current,
            })
          )
        }
      } else if (event.event_type === "session.stopped") {
        reportLiveAvatarFailure("LiveAvatar oturumu beklenmedik şekilde kapandı.")
      }
    },
    [reportLiveAvatarFailure]
  )

  const liveAvatar = useLiveAvatarRoom({
    onAvatarEvent: handleLiveAvatarEvent,
    onFatalError: reportLiveAvatarFailure,
  })
  const {
    status: liveAvatarStatus,
    videoRef: liveAvatarVideoRef,
    connect: connectLiveAvatar,
    disconnect: disconnectLiveAvatar,
    speakText: speakLiveAvatarText,
    interrupt: interruptLiveAvatar,
    startListening: startLiveAvatarListening,
    stopListening: stopLiveAvatarListening,
  } = liveAvatar

  const initPlaybackContext = useCallback(() => {
    if (!playbackContextRef.current) {
      playbackContextRef.current = new AudioContext({ sampleRate: SAMPLE_RATE })
      const analyser = playbackContextRef.current.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.6
      analyser.connect(playbackContextRef.current.destination)
      analyserRef.current = analyser
    }
    return playbackContextRef.current
  }, [])

  const drainQueue = useCallback(() => {
    const ctx = playbackContextRef.current
    if (!ctx || !shouldPlayAudioRef.current) {
      return
    }

    while (playbackQueueRef.current.length > 0 && shouldPlayAudioRef.current) {
      const chunk = playbackQueueRef.current.shift()!
      const float32Data = new Float32Array(chunk)
      if (float32Data.length === 0) continue

      const audioBuffer = ctx.createBuffer(1, float32Data.length, SAMPLE_RATE)
      audioBuffer.getChannelData(0).set(float32Data)

      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(analyserRef.current || ctx.destination)

      const now = ctx.currentTime
      if (nextPlayTimeRef.current < now) {
        nextPlayTimeRef.current = now + 0.01
      }

      source.start(nextPlayTimeRef.current)
      nextPlayTimeRef.current += float32Data.length / SAMPLE_RATE
      scheduledSourcesRef.current.push(source)

      source.onended = () => {
        scheduledSourcesRef.current = scheduledSourcesRef.current.filter((s) => s !== source)
        if (scheduledSourcesRef.current.length === 0 && playbackQueueRef.current.length === 0) {
          isPlayingRef.current = false
          if (allChunksReceivedRef.current && onPlaybackFinishedRef.current) {
            onPlaybackFinishedRef.current()
            onPlaybackFinishedRef.current = null
            allChunksReceivedRef.current = false
          }
        }
      }
    }
  }, [])

  const queueAudioChunk = useCallback(
    (data: ArrayBuffer) => {
      if (!shouldPlayAudioRef.current) return
      initPlaybackContext()
      playbackQueueRef.current.push(data)

      if (!isPlayingRef.current) {
        if (playbackQueueRef.current.length >= PRE_BUFFER_COUNT) {
          isPlayingRef.current = true
          nextPlayTimeRef.current = 0
          drainQueue()
        }
      } else {
        drainQueue()
      }
    },
    [drainQueue, initPlaybackContext]
  )

  const stopPlayback = useCallback(() => {
    cancelBrowserSpeech()
    shouldPlayAudioRef.current = false
    allChunksReceivedRef.current = false
    onPlaybackFinishedRef.current = null
    for (const source of scheduledSourcesRef.current) {
      try {
        source.stop()
      } catch {}
    }
    scheduledSourcesRef.current = []
    playbackQueueRef.current = []
    isPlayingRef.current = false
    nextPlayTimeRef.current = 0
  }, [cancelBrowserSpeech])

  const waitForCartesiaPlayback = useCallback((onFinished: () => void) => {
    if (!isPlayingRef.current && playbackQueueRef.current.length > 0) {
      isPlayingRef.current = true
      nextPlayTimeRef.current = 0
      drainQueue()
    }

    const hasPendingPlayback =
      isPlayingRef.current ||
      scheduledSourcesRef.current.length > 0 ||
      playbackQueueRef.current.length > 0

    if (!hasPendingPlayback) {
      allChunksReceivedRef.current = false
      onPlaybackFinishedRef.current = null
      onFinished()
      return
    }

    allChunksReceivedRef.current = true
    onPlaybackFinishedRef.current = onFinished
  }, [drainQueue])

  const startFinalEvaluation = useCallback(() => {
    if (sessionStateRef.current === "evaluating" || sessionStateRef.current === "done") {
      return
    }

    isWrappingUpRef.current = true
    setIsWrappingUp(true)
    setMicActive(false)
    allChunksReceivedRef.current = false
    onPlaybackFinishedRef.current = null
    setSessionState("evaluating")

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "start_evaluation" }))
    }
  }, [])

  // ─── Audio Capture (Mic → STT) ─────────────────────────────────

  const startMicCapture = useCallback(async (): Promise<boolean> => {
    // If we already have a live recorder, reuse it.
    if (mediaRecorderRef.current && mediaStreamRef.current) {
      const tracksAlive = mediaStreamRef.current.getTracks().some((t) => t.readyState === "live")
      if (tracksAlive) return true
      // Stale tracks — clean up before re-acquiring
      try {
        if (mediaRecorderRef.current.state !== "inactive") mediaRecorderRef.current.stop()
      } catch {}
      mediaStreamRef.current.getTracks().forEach((t) => t.stop())
      mediaStreamRef.current = null
      mediaRecorderRef.current = null
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Mikrofon erişimi bu tarayıcı/bağlantıda desteklenmiyor. Lütfen localhost üzerinden erişin.")
        return false
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      mediaStreamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      // Permission successfully (re)granted — clear any previous denial error
      setError(null)
      console.log("[Mic] Capture ready (MediaRecorder)")
      return true
    } catch (err) {
      console.error("[Mic] Failed to start capture:", err)
      setError("Mikrofon erişimi reddedildi. Tarayıcı ayarlarından izin verip tekrar deneyin.")
      return false
    }
  }, [])

  const stopMicCapture = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
    mediaRecorderRef.current = null
  }, [])

  const closeRealtimeConnections = useCallback(
    async ({ preserveSessionState = false, liveAvatarStopReason = "CLIENT_ABORTED" } = {}) => {
      stopPlayback()
      stopMicCapture()
      currentUtteranceIdRef.current = null

      const ws = wsRef.current
      wsRef.current = null
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close()
      }

      await disconnectLiveAvatar()
      await releaseBootstrapLiveAvatarSession(liveAvatarStopReason)

      setConnectionStatus("disconnected")
      if (!preserveSessionState) {
        setSessionState("idle")
        setInterviewId(null)
        interviewIdRef.current = null
        setActiveAvatarProvider("voice_call")
        activeAvatarProviderRef.current = "voice_call"
        activeOutputModeRef.current = "cartesia_stream"
      }
    },
    [disconnectLiveAvatar, releaseBootstrapLiveAvatarSession, stopMicCapture, stopPlayback]
  )

  const processWsJsonMessage = useCallback(
    async (data: any) => {
      const msgType = data.type

      switch (msgType) {
        case "session_started": {
          // Backend returns rpm_cartesia but we may be in voice_call mode.
          // Preserve the current UI provider if the backend provider matches the audio pipeline.
          const backendProvider = (data.avatar_provider || activeAvatarProviderRef.current) as AvatarProvider
          const uiProvider = backendProvider === "rpm_cartesia" && activeAvatarProviderRef.current === "voice_call"
            ? "voice_call"
            : backendProvider
          const outputMode = (data.output_mode ||
            (uiProvider === "liveavatar_full" ? "liveavatar" : "cartesia_stream")) as OutputMode
          setQuestions(data.questions || [])
          setInterviewId(data.interview_id || null)
          interviewIdRef.current = data.interview_id || null
          setCurrentQuestionIndex(0)
          setActiveAvatarProvider(uiProvider)
          activeAvatarProviderRef.current = uiProvider
          activeOutputModeRef.current = outputMode
          if (uiProvider === "liveavatar_full") {
            liveAvatarSessionOwnedByBackendRef.current = true
            pendingLiveAvatarSessionIdRef.current = null
            pendingLiveAvatarWorkspaceIdRef.current = null
          }
          shouldPlayAudioRef.current = outputMode === "cartesia_stream"
          if (outputMode !== "cartesia_stream") {
            stopPlayback()
          }
          setSessionState("ai_speaking")
          break
        }

        case "ai_speaking": {
          const backendProv = (data.avatar_provider || activeAvatarProviderRef.current) as AvatarProvider
          // Preserve voice_call UI mode when backend reports rpm_cartesia
          const provider = backendProv === "rpm_cartesia" && activeAvatarProviderRef.current === "voice_call"
            ? "voice_call"
            : backendProv
          const outputMode = (data.output_mode ||
            (provider === "liveavatar_full" ? "liveavatar" : activeOutputModeRef.current || "cartesia_stream")) as OutputMode
          const transcript = data.transcript || ""
          const isWrapUpTurn = Boolean(data.wrap_up)
          currentUtteranceIdRef.current = data.utterance_id || null
          setSessionState("ai_speaking")
          isWrappingUpRef.current = isWrapUpTurn
          setIsWrappingUp(isWrapUpTurn)
          setActiveAvatarProvider(provider)
          activeAvatarProviderRef.current = provider
          activeOutputModeRef.current = outputMode
          setConversationLog((prev) => [
            ...prev,
            {
              role: "interviewer",
              text: transcript,
              timestamp: Date.now(),
            },
          ])
          if (data.question_index !== undefined) {
            setCurrentQuestionIndex(data.question_index)
          }

          if (outputMode === "cartesia_stream") {
            shouldPlayAudioRef.current = true
          } else if (outputMode === "liveavatar") {
            shouldPlayAudioRef.current = false
            stopPlayback()
            try {
              await stopLiveAvatarListening()
              await speakLiveAvatarText(transcript)
            } catch (liveAvatarError) {
              console.error("LiveAvatar speak error:", liveAvatarError)
              reportLiveAvatarFailure("LiveAvatar yanıtı oynatılamadı.")
            }
          } else {
            shouldPlayAudioRef.current = false
            stopPlayback()
            speakWithBrowserTts(transcript, currentUtteranceIdRef.current)
          }
          break
        }

        case "ai_done_speaking": {
          currentUtteranceIdRef.current = null

          if (data.wrap_up) {
            if (activeOutputModeRef.current === "cartesia_stream") {
              waitForCartesiaPlayback(startFinalEvaluation)
            } else {
              startFinalEvaluation()
            }
          } else if (activeOutputModeRef.current === "liveavatar") {
            setSessionState("listening")
            try {
              await startLiveAvatarListening()
            } catch (listenError) {
              console.error("LiveAvatar listening error:", listenError)
              reportLiveAvatarFailure("LiveAvatar dinleme durumuna geçemedi.")
            }
          } else if (activeOutputModeRef.current === "browser_tts") {
            setSessionState("listening")
          } else {
            waitForCartesiaPlayback(() => {
              setSessionState("listening")
            })
          }
          break
        }

        case "avatar_provider_switched": {
          liveAvatarFailurePendingRef.current = false
          const backendProv2 = (data.avatar_provider || "rpm_cartesia") as AvatarProvider
          // When backend falls back to rpm_cartesia, use voice_call for the UI
          const switchedProvider = backendProv2 === "rpm_cartesia" ? "voice_call" : backendProv2
          setActiveAvatarProvider(switchedProvider)
          activeAvatarProviderRef.current = switchedProvider
          if (backendProv2 === "rpm_cartesia") {
            await disconnectLiveAvatar()
            liveAvatarSessionOwnedByBackendRef.current = false
            pendingLiveAvatarSessionIdRef.current = null
            pendingLiveAvatarWorkspaceIdRef.current = null
            if (data.reason) {
              setError(`LiveAvatar devre dışı kaldı: ${data.reason}`)
            }
          }
          break
        }

        case "output_mode_switched": {
          const outputMode = (data.output_mode || "cartesia_stream") as OutputMode
          activeOutputModeRef.current = outputMode

          if (outputMode === "browser_tts") {
            shouldPlayAudioRef.current = false
            stopPlayback()
            await disconnectLiveAvatar()
            if (data.reason) {
              setError(data.reason)
            }
            const transcript = data.transcript || ""
            const utteranceId = data.utterance_id || currentUtteranceIdRef.current
            if (transcript && utteranceId) {
              speakWithBrowserTts(transcript, utteranceId)
            }
          }
          break
        }

        case "next_question":
          if (data.question_index !== undefined) {
            setCurrentQuestionIndex(data.question_index)
          }
          break

        case "evaluating":
          setSessionState("evaluating")
          break

        case "evaluation":
          setEvaluation({
            results: data.results || [],
            overall_score: data.overall_score || 0,
            overall_feedback: data.overall_feedback || "",
          })
          break

        case "session_complete":
          setSessionState("done")
          sessionStartInFlightRef.current = false
          void closeRealtimeConnections({
            preserveSessionState: true,
            liveAvatarStopReason: "INTERVIEW_COMPLETED",
          })
          break

        case "error":
          setError(data.message || "Bilinmeyen hata")
          setMicActive(false)
          if (!data.recoverable) {
            setSessionState(interviewIdRef.current ? "listening" : "idle")
          }
          if (!data.recoverable && !liveAvatarSessionOwnedByBackendRef.current && !interviewIdRef.current) {
            void closeRealtimeConnections({
              preserveSessionState: true,
              liveAvatarStopReason: "CLIENT_START_FAILED",
            })
          }
          break

        default:
          console.log("[WS] Unknown message type:", msgType, data)
      }
    },
    [
      closeRealtimeConnections,
      disconnectLiveAvatar,
      reportLiveAvatarFailure,
      speakLiveAvatarText,
      speakWithBrowserTts,
      startLiveAvatarListening,
      stopLiveAvatarListening,
      stopPlayback,
    ]
  )

  const handleWsMessage = useCallback(
    (event: MessageEvent) => {
      if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
        if (!shouldPlayAudioRef.current || (activeAvatarProviderRef.current !== "rpm_cartesia" && activeAvatarProviderRef.current !== "voice_call")) return
        if (event.data instanceof Blob) {
          event.data.arrayBuffer().then(queueAudioChunk)
        } else {
          queueAudioChunk(event.data)
        }
        return
      }

      try {
        const data = JSON.parse(event.data)
        void processWsJsonMessage(data)
      } catch (parseError) {
        console.error("[WS] Failed to parse message:", parseError)
      }
    },
    [processWsJsonMessage, queueAudioChunk]
  )

  const startSession = useCallback(
    async (config: {
      workspaceId: number
      categories: string[]
      difficulty: string
      interviewType: string
      avatarProvider: AvatarProvider
      durationLimit?: number
    }) => {
      if (sessionStartInFlightRef.current || wsRef.current) {
        return
      }

      sessionStartInFlightRef.current = true
      liveAvatarSessionOwnedByBackendRef.current = false
      pendingLiveAvatarSessionIdRef.current = null
      pendingLiveAvatarWorkspaceIdRef.current = null
      setError(null)
      setConnectionStatus("connecting")
      setSessionState("idle")
      setConversationLog([])
      setQuestions([])
      setCurrentQuestionIndex(0)
      setEvaluation(null)
      setInterviewId(null)
      interviewIdRef.current = null
      setPendingTranscript("")
      currentUtteranceIdRef.current = null
      activeOutputModeRef.current = "cartesia_stream"
      liveAvatarFailurePendingRef.current = false
      stopPlayback()
      isWrappingUpRef.current = false
      setIsWrappingUp(false)

      let effectiveProvider = config.avatarProvider
      let liveAvatarSessionId: string | undefined

      try {
        if (effectiveProvider === "liveavatar_full" && LIVEAVATAR_ENABLED) {
          try {
            const bootstrapRes = await fetch(apiUrl("/voice-interview/liveavatar/bootstrap"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ workspace_id: config.workspaceId }),
            })

            if (!bootstrapRes.ok) {
              const bootstrapError = await bootstrapRes.json().catch(() => null)
              throw new Error(bootstrapError?.detail || "LiveAvatar başlatılamadı.")
            }

            const bootstrapData = (await bootstrapRes.json()) as LiveAvatarBootstrapResponse
            pendingLiveAvatarSessionIdRef.current = bootstrapData.liveavatar_session_id
            pendingLiveAvatarWorkspaceIdRef.current = config.workspaceId
            await connectLiveAvatar({
              liveavatarSessionId: bootstrapData.liveavatar_session_id,
              livekitUrl: bootstrapData.livekit_url,
              livekitClientToken: bootstrapData.livekit_client_token,
            })
            liveAvatarSessionId = bootstrapData.liveavatar_session_id
            setActiveAvatarProvider("liveavatar_full")
            activeAvatarProviderRef.current = "liveavatar_full"
          } catch (bootstrapError) {
            console.error("LiveAvatar bootstrap error:", bootstrapError)
            setError("LiveAvatar kullanılamadı. Sesli görüşme moduna geri dönülüyor.")
            effectiveProvider = "voice_call"
            setActiveAvatarProvider("voice_call")
            activeAvatarProviderRef.current = "voice_call"
            await disconnectLiveAvatar()
            await releaseBootstrapLiveAvatarSession("BOOTSTRAP_FAILED")
          }
        } else {
          // voice_call or rpm_cartesia → both use the cartesia_stream audio pipeline
          // but we keep voice_call as the provider for the UI rendering
          const uiProvider = config.avatarProvider === "voice_call" ? "voice_call" : "rpm_cartesia"
          effectiveProvider = uiProvider
          setActiveAvatarProvider(uiProvider)
          activeAvatarProviderRef.current = uiProvider
          await disconnectLiveAvatar()
        }

        let ticket = ""
        try {
          const ticketRes = await fetch(apiUrl("/auth/ws-ticket"), {
            method: "POST",
            credentials: "include",
          })
          if (ticketRes.ok) {
            const ticketData = await ticketRes.json()
            ticket = ticketData.ticket
          }
        } catch (ticketError) {
          console.error("Failed to fetch WS ticket:", ticketError)
        }

        const socketUrl = wsUrl(`/ws/voice-interview${ticket ? `?ticket=${ticket}` : ""}`)
        const ws = new WebSocket(socketUrl)
        wsRef.current = ws
        ws.binaryType = "arraybuffer"

        ws.onopen = async () => {
          setConnectionStatus("connected")
          await startMicCapture()
          initPlaybackContext()

          ws.send(
            JSON.stringify({
              type: "start_session",
              workspace_id: config.workspaceId,
              categories: config.categories,
              difficulty: config.difficulty,
              interview_type: config.interviewType,
              // Backend only knows rpm_cartesia and liveavatar_full;
              // voice_call is a UI-only concept that uses the same audio pipeline as rpm_cartesia
              avatar_provider: effectiveProvider === "voice_call" ? "rpm_cartesia" : effectiveProvider,
              liveavatar_session_id: liveAvatarSessionId,
              duration_limit: config.durationLimit,
            })
          )
        }

        ws.onmessage = handleWsMessage

        ws.onerror = (socketError) => {
          console.error("[WS] Error:", socketError)
          setError("WebSocket bağlantı hatası")
          setConnectionStatus("disconnected")
          sessionStartInFlightRef.current = false
          if (!liveAvatarSessionOwnedByBackendRef.current) {
            void releaseBootstrapLiveAvatarSession("WS_ERROR")
          }
        }

        ws.onclose = () => {
          sessionStartInFlightRef.current = false
          setConnectionStatus("disconnected")
          stopMicCapture()
          void disconnectLiveAvatar()
          if (!liveAvatarSessionOwnedByBackendRef.current) {
            void releaseBootstrapLiveAvatarSession("WS_CLOSED")
          }
        }
      } catch (sessionStartError) {
        console.error("Failed to start interview session:", sessionStartError)
        sessionStartInFlightRef.current = false
        setConnectionStatus("disconnected")
        setError("Mülakat oturumu başlatılamadı.")
        await disconnectLiveAvatar()
        await releaseBootstrapLiveAvatarSession("SESSION_START_FAILED")
      }
    },
    [connectLiveAvatar, disconnectLiveAvatar, handleWsMessage, initPlaybackContext, releaseBootstrapLiveAvatarSession, startMicCapture, stopMicCapture, stopPlayback]
  )

  const resumeSession = useCallback(
    async (config: { interviewId: number }) => {
      setError(null)
      setConnectionStatus("connecting")
      setSessionState("idle")
      setConversationLog([])
      setQuestions([])
      setCurrentQuestionIndex(0)
      setEvaluation(null)
      setInterviewId(null)
      interviewIdRef.current = null
      activeOutputModeRef.current = "cartesia_stream"
      isWrappingUpRef.current = false
      setIsWrappingUp(false)

      let ticket = ""
      try {
        const ticketRes = await fetch("http://localhost:8000/auth/ws-ticket", {
          method: "POST",
          credentials: "include",
        })
        if (ticketRes.ok) {
          const ticketData = await ticketRes.json()
          ticket = ticketData.ticket
        }
      } catch (err) {
        console.error("Failed to fetch WS ticket:", err)
      }

      const wsUrl = `ws://localhost:8000/ws/voice-interview${ticket ? `?ticket=${ticket}` : ""}`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      ws.binaryType = "arraybuffer"

      ws.onopen = async () => {
        setConnectionStatus("connected")
        await startMicCapture()
        initPlaybackContext()
        ws.send(
          JSON.stringify({
            type: "resume_session",
            interview_id: config.interviewId,
          })
        )
      }

      ws.onmessage = handleWsMessage

      ws.onerror = (err) => {
        console.error("[WS] Error:", err)
        setError("WebSocket bağlantı hatası")
        setConnectionStatus("disconnected")
      }

      ws.onclose = () => {
        setConnectionStatus("disconnected")
        stopMicCapture()
      }
    },
    [startMicCapture, stopMicCapture, handleWsMessage, initPlaybackContext]
  )

  const toggleMic = useCallback(async () => {
    if (isWrappingUpRef.current) return
    const isStarting = !micActiveRef.current

    if (isStarting) {
      // Lazily (re)acquire the microphone — handles the case where the user
      // initially denied permission and granted it later via browser settings.
      const ready = await startMicCapture()
      if (!ready) {
        // Acquisition failed — keep mic inactive and surface the error
        setMicActive(false)
        return
      }

      const recorder = mediaRecorderRef.current
      if (!recorder) {
        setMicActive(false)
        return
      }

      if (recorder.state === "inactive") {
        audioChunksRef.current = []
        recorder.start()
      } else if (recorder.state === "paused") {
        recorder.resume()
      }
      setMicActive(true)
    } else {
      const recorder = mediaRecorderRef.current
      if (recorder && recorder.state === "recording") {
        recorder.pause()
      }
      setMicActive(false)
    }
  }, [startMicCapture])

  const transcribeRecording = useCallback(async (): Promise<string> => {
    setMicActive(false)
    setIsTranscribing(true)

    return new Promise<string>((resolve) => {
      const processAudio = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
          audioChunksRef.current = []

          if (audioBlob.size === 0) {
            setError("Ses algılanamadı. Lütfen mikrofonu açık tutarak konuşun.")
            setIsTranscribing(false)
            resolve("")
            return
          }

          const formData = new FormData()
          formData.append("file", audioBlob, "recording.webm")

          const response = await fetch(apiUrl("/voice-interview/transcribe"), {
            method: "POST",
            body: formData,
            credentials: "include",
          })

          if (!response.ok) {
            throw new Error("Transcribe failed")
          }

          const data = await response.json()
          const transcriptText = data.transcript || ""
          setPendingTranscript(transcriptText)
          setIsTranscribing(false)
          resolve(transcriptText)
        } catch (transcribeError) {
          console.error("Failed to transcribe:", transcribeError)
          setError("Ses yüklenirken / işlenirken hata oluştu.")
          setIsTranscribing(false)
          resolve("")
        }
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.onstop = () => {
          void processAudio()
          if (mediaRecorderRef.current) mediaRecorderRef.current.onstop = null
        }
        mediaRecorderRef.current.stop()
      } else {
        void processAudio()
      }
    })
  }, [])

  const submitTextAnswer = useCallback((text: string) => {
    if (isWrappingUpRef.current) {
      // Interview is winding down — ignore further answers
      return
    }
    const trimmed = text.trim()
    if (!trimmed) {
      setError("Lütfen bir cevap yazın veya mikrofonu kullanarak konuşun.")
      return
    }

    setSessionState("processing")
    setPendingTranscript("")
    setConversationLog((log) => [
      ...log,
      {
        role: "candidate",
        text: trimmed,
        timestamp: Date.now(),
      },
    ])

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "submit_answer", transcript: trimmed }))
    }
  }, [])

  const submitAnswer = useCallback(() => {
    setMicActive(false)
    setSessionState("processing")

    const processAudioAndSubmit = async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        audioChunksRef.current = []

        if (audioBlob.size === 0) {
          setError("Ses algılanamadı. Lütfen mikrofonu açık tutarak konuşun.")
          setSessionState("listening")
          setMicActive(false)
          return
        }

        const formData = new FormData()
        formData.append("file", audioBlob, "recording.webm")

        const response = await fetch(apiUrl("/voice-interview/transcribe"), {
          method: "POST",
          body: formData,
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Transcribe failed")
        }

        const data = await response.json()
        const transcriptText = data.transcript || ""

        setConversationLog((log) => [
          ...log,
          {
            role: "candidate",
            text: transcriptText,
            timestamp: Date.now(),
          },
        ])

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "submit_answer", transcript: transcriptText }))
        }
      } catch (submitError) {
        console.error("Failed to transcribe:", submitError)
        setError("Ses yüklenirken / işlenirken hata oluştu.")
        setSessionState("listening")
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = () => {
        void processAudioAndSubmit()
        if (mediaRecorderRef.current) mediaRecorderRef.current.onstop = null
      }
      mediaRecorderRef.current.stop()
    } else {
      void processAudioAndSubmit()
    }
  }, [])

  const passQuestion = useCallback(() => {
    if (isWrappingUpRef.current) {
      // Interview already ending — don't repeat the wrap-up flow
      return
    }
    stopPlayback()
    setMicActive(false)
    setSessionState("processing")

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "pass_question" }))
    }
  }, [stopPlayback])

  const interrupt = useCallback(() => {
    stopPlayback()
    currentUtteranceIdRef.current = null

    if (activeAvatarProviderRef.current === "liveavatar_full") {
      void (async () => {
        try {
          await interruptLiveAvatar()
          await startLiveAvatarListening()
        } catch (interruptError) {
          console.error("LiveAvatar interrupt error:", interruptError)
          reportLiveAvatarFailure("LiveAvatar kesilemedi.")
        }
      })()
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "interrupt" }))
    }

    setSessionState("listening")
    setMicActive(false)
  }, [interruptLiveAvatar, reportLiveAvatarFailure, startLiveAvatarListening, stopPlayback])

  const endSession = useCallback(() => {
    stopPlayback()
    setMicActive(false)

    // Optimistically jump the UI into the evaluating state so the user sees
    // immediate feedback. The backend's "evaluation" / "session_complete"
    // events will move us into "done" once results are ready.
    setSessionState("evaluating")

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "end_session" }))
    } else {
      // WebSocket is gone — there's no way to evaluate. Fall through to "done"
      // so the UI doesn't hang on the evaluating spinner.
      setSessionState("done")
    }
  }, [stopPlayback])

  const disconnect = useCallback(() => {
    sessionStartInFlightRef.current = false
    liveAvatarSessionOwnedByBackendRef.current = false
    void closeRealtimeConnections()
  }, [closeRealtimeConnections])

  useEffect(() => {
    return () => {
      sessionStartInFlightRef.current = false
      liveAvatarSessionOwnedByBackendRef.current = false
      void closeRealtimeConnections()
      if (playbackContextRef.current && playbackContextRef.current.state !== "closed") {
        playbackContextRef.current.close().catch(() => {})
      }
    }
  }, [closeRealtimeConnections])

  const isAiSpeaking = sessionState === "ai_speaking"
  const isListening = sessionState === "listening"

  return {
    analyserNode: analyserRef.current,
    connectionStatus,
    sessionState,
    isAiSpeaking,
    isListening,
    isWrappingUp,
    micActive,
    conversationLog,
    questions,
    currentQuestionIndex,
    interviewId,
    evaluation,
    error,
    pendingTranscript,
    isTranscribing,
    selectedAvatarProvider,
    activeAvatarProvider,
    setSelectedAvatarProvider,
    isLiveAvatarEnabled: LIVEAVATAR_ENABLED,
    liveAvatarStatus,
    liveAvatarVideoRef,
    startSession,
    resumeSession,
    toggleMic,
    submitAnswer,
    transcribeRecording,
    submitTextAnswer,
    passQuestion,
    interrupt,
    endSession,
    disconnect,
    stopPlayback,
  }
}
