import { useState, useRef, useCallback, useEffect } from "react"

// ─── Types ──────────────────────────────────────────────────────────

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

// ─── Audio Worklet Processor (inline) ──────────────────────────────

const AUDIO_WORKLET_CODE = `
class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._bufferSize = 0;
    // Send ~100ms of audio at a time (16000 * 0.1 = 1600 samples)
    this._chunkSize = 1600;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0];

    // Convert float32 to int16
    for (let i = 0; i < channelData.length; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
      this._buffer.push(val);
      this._bufferSize++;
    }

    if (this._bufferSize >= this._chunkSize) {
      const chunk = new Int16Array(this._buffer.splice(0, this._chunkSize));
      this._bufferSize -= this._chunkSize;
      this.port.postMessage(chunk.buffer, [chunk.buffer]);
    }

    return true;
  }
}

registerProcessor('pcm-capture-processor', PcmCaptureProcessor);
`

// ─── Hook ───────────────────────────────────────────────────────────

interface UseVoiceInterviewReturn {
  // State
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

  // Actions
  startSession: (config: {
    workspaceId: number
    categories: string[]
    difficulty: string
    interviewType: string
  }) => void
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
  // ─── State ──────────────────────────────────────────────────────

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

  // ─── Refs ───────────────────────────────────────────────────────

  const wsRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const mediaStreamRef = useRef<MediaStream | null>(null)

  // TTS playback — gapless scheduled audio
  const playbackContextRef = useRef<AudioContext | null>(null)
  const playbackQueueRef = useRef<ArrayBuffer[]>([])
  const isPlayingRef = useRef(false)
  const shouldPlayAudioRef = useRef(false)
  // Tracks the exact AudioContext time at which the next chunk should start
  const nextPlayTimeRef = useRef(0)
  // All scheduled source nodes (so we can stop them on interrupt)
  const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([])
  // Signals that the backend has finished sending all TTS chunks for the current utterance
  const allChunksReceivedRef = useRef(false)
  // Callback to invoke when playback actually finishes (after all sources end)
  const onPlaybackFinishedRef = useRef<(() => void) | null>(null)
  // Number of chunks to buffer before starting playback (absorbs network jitter)
  const PRE_BUFFER_COUNT = 3
  const SAMPLE_RATE = 24000

  // Track state in refs for use in callbacks
  const sessionStateRef = useRef<SessionState>("idle")
  const micActiveRef = useRef(false)

  useEffect(() => {
    sessionStateRef.current = sessionState
  }, [sessionState])

  useEffect(() => {
    micActiveRef.current = micActive
  }, [micActive])

  // ─── Audio Playback (TTS) — Gapless Scheduled ───────────────────

  const initPlaybackContext = useCallback(() => {
    if (!playbackContextRef.current) {
      playbackContextRef.current = new AudioContext({ sampleRate: SAMPLE_RATE })
    }
    return playbackContextRef.current
  }, [])

  /**
   * Drain the queue: schedule as many queued chunks as possible, each at exact
   * sample-boundary times so there are zero gaps between them.
   */
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
      source.connect(ctx.destination)

      // If we've fallen behind real-time, snap forward to now + small offset
      const now = ctx.currentTime
      if (nextPlayTimeRef.current < now) {
        nextPlayTimeRef.current = now + 0.01 // 10ms safety margin
      }

      source.start(nextPlayTimeRef.current)
      // Advance the cursor by exactly this chunk's duration (sample-accurate)
      nextPlayTimeRef.current += float32Data.length / SAMPLE_RATE

      // Track for cleanup
      scheduledSourcesRef.current.push(source)

      // When this source finishes, remove it from the list and check if we're done
      source.onended = () => {
        scheduledSourcesRef.current = scheduledSourcesRef.current.filter((s) => s !== source)
        // If no more sources are scheduled and queue is empty, playback is complete
        if (scheduledSourcesRef.current.length === 0 && playbackQueueRef.current.length === 0) {
          isPlayingRef.current = false
          // If backend already signaled "all chunks sent", fire the finished callback
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
        // Wait for a few chunks to arrive before starting (pre-buffer)
        if (playbackQueueRef.current.length >= PRE_BUFFER_COUNT) {
          isPlayingRef.current = true
          nextPlayTimeRef.current = 0 // will snap to ctx.currentTime in drainQueue
          drainQueue()
        }
      } else {
        // Already playing — schedule this new chunk immediately
        drainQueue()
      }
    },
    [initPlaybackContext, drainQueue]
  )

  const stopPlayback = useCallback(() => {
    shouldPlayAudioRef.current = false
    allChunksReceivedRef.current = false
    onPlaybackFinishedRef.current = null
    // Stop all scheduled sources
    for (const source of scheduledSourcesRef.current) {
      try {
        source.stop()
      } catch {}
    }
    scheduledSourcesRef.current = []
    // Clear queue and reset state
    playbackQueueRef.current = []
    isPlayingRef.current = false
    nextPlayTimeRef.current = 0
  }, [])

  // ─── Audio Capture (Mic → STT) ─────────────────────────────────

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

      console.log("[Mic] Capture ready (MediaRecorder)")
    } catch (err) {
      console.error("[Mic] Failed to start capture:", err)
      setError("Mikrofon erişimi reddedildi. Lütfen izin verin.")
    }
  }, [])

  const stopMicCapture = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop())
      mediaStreamRef.current = null
    }
    mediaRecorderRef.current = null
  }, [])

  // ─── WebSocket Message Handler ──────────────────────────────────

  const handleWsMessage = useCallback(
    (event: MessageEvent) => {
      // Binary message = TTS audio
      if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
        if (!shouldPlayAudioRef.current) return;
        if (event.data instanceof Blob) {
          event.data.arrayBuffer().then(queueAudioChunk)
        } else {
          queueAudioChunk(event.data)
        }
        return
      }

      // JSON message
      try {
        const data = JSON.parse(event.data)
        const msgType = data.type

        switch (msgType) {
          case "session_started":
            setQuestions(data.questions || [])
            setInterviewId(data.interview_id || null)
            setCurrentQuestionIndex(0)
            shouldPlayAudioRef.current = true
            setSessionState("ai_speaking")
            break

          case "ai_speaking":
            shouldPlayAudioRef.current = true
            setSessionState("ai_speaking")
            setConversationLog((prev) => [
              ...prev,
              {
                role: "interviewer",
                text: data.transcript || "",
                timestamp: Date.now(),
              },
            ])
            if (data.question_index !== undefined) {
              setCurrentQuestionIndex(data.question_index)
            }
            break

          case "ai_done_speaking":
            // Don't transition immediately — audio may still be playing.
            // Mark that all chunks have been received.
            allChunksReceivedRef.current = true

            if (data.wrap_up) {
              // Goodbye speech — wait for playback to finish, then tell backend to evaluate
              const triggerEvaluation = () => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify({ type: "start_evaluation" }))
                }
              }
              if (!isPlayingRef.current && scheduledSourcesRef.current.length === 0) {
                triggerEvaluation()
                allChunksReceivedRef.current = false
              } else {
                onPlaybackFinishedRef.current = () => {
                  triggerEvaluation()
                }
              }
            } else {
              // Normal question — transition to listening after playback
              if (!isPlayingRef.current && scheduledSourcesRef.current.length === 0) {
                setSessionState("listening")
                allChunksReceivedRef.current = false
              } else {
                onPlaybackFinishedRef.current = () => {
                  setSessionState("listening")
                }
              }
            }
            break

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
            break

          case "error":
            setError(data.message || "Bilinmeyen hata")
            console.error("[WS] Server error:", data.message)
            // Always reset to listening so user isn't stuck on "processing"
            setSessionState("listening")
            setMicActive(false)
            break

          default:
            console.log("[WS] Unknown message type:", msgType, data)
        }
      } catch (err) {
        console.error("[WS] Failed to parse message:", err)
      }
    },
    [queueAudioChunk]
  )

  // ─── Public Actions ─────────────────────────────────────────────

  const startSession = useCallback(
    async (config: {
      workspaceId: number
      categories: string[]
      difficulty: string
      interviewType: string
    }) => {
      setError(null)
      setConnectionStatus("connecting")
      setSessionState("idle")
      setConversationLog([])
      setQuestions([])
      setCurrentQuestionIndex(0)
      setEvaluation(null)

      // Obtain a WebSocket ticket first
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
        console.log("[WS] Connected")

        // Start mic capture
        await startMicCapture()

        // Initialize playback context (needs user gesture)
        initPlaybackContext()

        // Send start_session
        ws.send(
          JSON.stringify({
            type: "start_session",
            workspace_id: config.workspaceId,
            categories: config.categories,
            difficulty: config.difficulty,
            interview_type: config.interviewType,
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
        console.log("[WS] Closed")
        setConnectionStatus("disconnected")
        stopMicCapture()
      }
    },
    [startMicCapture, stopMicCapture, handleWsMessage, initPlaybackContext]
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
        } else {
          if (mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.pause()
          }
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

          const response = await fetch("http://localhost:8000/voice-interview/transcribe", {
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
        } catch (err) {
          console.error("Failed to transcribe:", err)
          setError("Ses yüklenirken / işlenirken hata oluştu.")
          setIsTranscribing(false)
          resolve("")
        }
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.onstop = () => {
          processAudio()
          if (mediaRecorderRef.current) mediaRecorderRef.current.onstop = null
        }
        mediaRecorderRef.current.stop()
      } else {
        processAudio()
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

    // Append to local conversation log
    setConversationLog((log) => [
      ...log,
      {
        role: "candidate",
        text: trimmed,
        timestamp: Date.now(),
      },
    ])

    // Send via WebSocket
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

        const response = await fetch("http://localhost:8000/voice-interview/transcribe", {
          method: "POST",
          body: formData,
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Transcribe failed")
        }

        const data = await response.json()
        const transcriptText = data.transcript || ""

        // Append to local log
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
      } catch (err) {
        console.error("Failed to transcribe:", err)
        setError("Ses yüklenirken / işlenirken hata oluştu.")
        setSessionState("listening")
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = () => {
        processAudioAndSubmit()
        if (mediaRecorderRef.current) mediaRecorderRef.current.onstop = null
      }
      mediaRecorderRef.current.stop()
    } else {
      processAudioAndSubmit()
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
    // Stop audio playback immediately
    stopPlayback()

    // Send interrupt to backend
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "interrupt" }))
    }

    setSessionState("listening")
    setMicActive(false)
  }, [stopPlayback])

  const endSession = useCallback(() => {
    stopPlayback()

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "end_session" }))
    }
  }, [stopPlayback])

  const disconnect = useCallback(() => {
    stopPlayback()
    stopMicCapture()

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setConnectionStatus("disconnected")
    setSessionState("idle")
  }, [stopPlayback, stopMicCapture])

  // ─── Cleanup on unmount ─────────────────────────────────────────

  useEffect(() => {
    return () => {
      stopPlayback()
      stopMicCapture()
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (playbackContextRef.current && playbackContextRef.current.state !== "closed") {
        playbackContextRef.current.close().catch(() => {})
      }
    }
  }, [stopPlayback, stopMicCapture])

  // ─── Derived state ─────────────────────────────────────────────

  const isAiSpeaking = sessionState === "ai_speaking"
  const isListening = sessionState === "listening"

  return {
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
