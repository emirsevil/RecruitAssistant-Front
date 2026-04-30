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
export type AvatarProvider = "rpm_cartesia" | "liveavatar_full"

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
    categories: string
    difficulty: string
    interviewType: string
    avatarProvider: AvatarProvider
  }) => Promise<void>
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
  const [selectedAvatarProvider, setSelectedAvatarProvider] = useState<AvatarProvider>("rpm_cartesia")
  const [activeAvatarProvider, setActiveAvatarProvider] = useState<AvatarProvider>("rpm_cartesia")

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
  const activeAvatarProviderRef = useRef<AvatarProvider>("rpm_cartesia")
  const currentUtteranceIdRef = useRef<string | null>(null)
  const liveAvatarFailurePendingRef = useRef(false)
  const sessionStartInFlightRef = useRef(false)
  const pendingLiveAvatarSessionIdRef = useRef<string | null>(null)
  const pendingLiveAvatarWorkspaceIdRef = useRef<number | null>(null)
  const liveAvatarSessionOwnedByBackendRef = useRef(false)

  useEffect(() => {
    sessionStateRef.current = sessionState
  }, [sessionState])

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
  }, [])

  const startMicCapture = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Mikrofon erişimi bu tarayıcı/bağlantıda desteklenmiyor. Lütfen localhost üzerinden erişin.")
        return
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
    } catch (captureError) {
      console.error("[Mic] Failed to start capture:", captureError)
      setError("Mikrofon erişimi reddedildi. Lütfen izin verin.")
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
        setActiveAvatarProvider("rpm_cartesia")
        activeAvatarProviderRef.current = "rpm_cartesia"
      }
    },
    [disconnectLiveAvatar, releaseBootstrapLiveAvatarSession, stopMicCapture, stopPlayback]
  )

  const processWsJsonMessage = useCallback(
    async (data: any) => {
      const msgType = data.type

      switch (msgType) {
        case "session_started": {
          const provider = (data.avatar_provider || activeAvatarProviderRef.current) as AvatarProvider
          setQuestions(data.questions || [])
          setInterviewId(data.interview_id || null)
          setCurrentQuestionIndex(0)
          setActiveAvatarProvider(provider)
          activeAvatarProviderRef.current = provider
          if (provider === "liveavatar_full") {
            liveAvatarSessionOwnedByBackendRef.current = true
            pendingLiveAvatarSessionIdRef.current = null
            pendingLiveAvatarWorkspaceIdRef.current = null
          }
          shouldPlayAudioRef.current = provider === "rpm_cartesia"
          setSessionState("ai_speaking")
          break
        }

        case "ai_speaking": {
          const provider = (data.avatar_provider || activeAvatarProviderRef.current) as AvatarProvider
          const transcript = data.transcript || ""
          currentUtteranceIdRef.current = data.utterance_id || null
          setSessionState("ai_speaking")
          setActiveAvatarProvider(provider)
          activeAvatarProviderRef.current = provider
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

          if (provider === "rpm_cartesia") {
            shouldPlayAudioRef.current = true
          } else {
            shouldPlayAudioRef.current = false
            stopPlayback()
            try {
              await stopLiveAvatarListening()
              await speakLiveAvatarText(transcript)
            } catch (liveAvatarError) {
              console.error("LiveAvatar speak error:", liveAvatarError)
              reportLiveAvatarFailure("LiveAvatar yanıtı oynatılamadı.")
            }
          }
          break
        }

        case "ai_done_speaking": {
          currentUtteranceIdRef.current = null
          if (activeAvatarProviderRef.current === "liveavatar_full") {
            setSessionState("listening")
            try {
              await startLiveAvatarListening()
            } catch (listenError) {
              console.error("LiveAvatar listening error:", listenError)
              reportLiveAvatarFailure("LiveAvatar dinleme durumuna geçemedi.")
            }
          } else if (!isPlayingRef.current && scheduledSourcesRef.current.length === 0) {
            setSessionState("listening")
            allChunksReceivedRef.current = false
          } else {
            allChunksReceivedRef.current = true
            onPlaybackFinishedRef.current = () => {
              setSessionState("listening")
            }
          }
          break
        }

        case "avatar_provider_switched": {
          liveAvatarFailurePendingRef.current = false
          const provider = (data.avatar_provider || "rpm_cartesia") as AvatarProvider
          setActiveAvatarProvider(provider)
          activeAvatarProviderRef.current = provider
          if (provider === "rpm_cartesia") {
            shouldPlayAudioRef.current = true
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
          setSessionState("listening")
          setMicActive(false)
          if (!liveAvatarSessionOwnedByBackendRef.current) {
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
    [closeRealtimeConnections, disconnectLiveAvatar, reportLiveAvatarFailure, speakLiveAvatarText, startLiveAvatarListening, stopLiveAvatarListening, stopPlayback]
  )

  const handleWsMessage = useCallback(
    (event: MessageEvent) => {
      if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
        if (!shouldPlayAudioRef.current || activeAvatarProviderRef.current !== "rpm_cartesia") return
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
      categories: string
      difficulty: string
      interviewType: string
      avatarProvider: AvatarProvider
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
      setPendingTranscript("")
      currentUtteranceIdRef.current = null
      liveAvatarFailurePendingRef.current = false
      stopPlayback()

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
            setError("LiveAvatar kullanılamadı. Klasik avatar moduna geri dönülüyor.")
            effectiveProvider = "rpm_cartesia"
            setActiveAvatarProvider("rpm_cartesia")
            activeAvatarProviderRef.current = "rpm_cartesia"
            await disconnectLiveAvatar()
            await releaseBootstrapLiveAvatarSession("BOOTSTRAP_FAILED")
          }
        } else {
          effectiveProvider = "rpm_cartesia"
          setActiveAvatarProvider("rpm_cartesia")
          activeAvatarProviderRef.current = "rpm_cartesia"
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
              avatar_provider: effectiveProvider,
              liveavatar_session_id: liveAvatarSessionId,
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

  const toggleMic = useCallback(() => {
    setMicActive((prev) => {
      const next = !prev
      if (mediaRecorderRef.current) {
        if (next) {
          if (mediaRecorderRef.current.state === "inactive") {
            audioChunksRef.current = []
            mediaRecorderRef.current.start()
          } else if (mediaRecorderRef.current.state === "paused") {
            mediaRecorderRef.current.resume()
          }
        } else if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.pause()
        }
      }
      return next
    })
  }, [])

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
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "end_session" }))
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
      if (playbackContextRef.current) {
        void playbackContextRef.current.close()
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
