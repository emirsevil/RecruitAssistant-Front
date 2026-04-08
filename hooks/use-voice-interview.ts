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
    categories: string
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

  // TTS playback
  const playbackContextRef = useRef<AudioContext | null>(null)
  const playbackQueueRef = useRef<ArrayBuffer[]>([])
  const isPlayingRef = useRef(false)
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const shouldPlayAudioRef = useRef(false)

  // Track state in refs for use in callbacks
  const sessionStateRef = useRef<SessionState>("idle")
  const micActiveRef = useRef(false)

  useEffect(() => {
    sessionStateRef.current = sessionState
  }, [sessionState])

  useEffect(() => {
    micActiveRef.current = micActive
  }, [micActive])

  // ─── Audio Playback (TTS) ───────────────────────────────────────

  const initPlaybackContext = useCallback(() => {
    if (!playbackContextRef.current) {
      playbackContextRef.current = new AudioContext({ sampleRate: 24000 })
    }
    return playbackContextRef.current
  }, [])

  const playNextChunk = useCallback(() => {
    const ctx = playbackContextRef.current
    if (!ctx || playbackQueueRef.current.length === 0 || !shouldPlayAudioRef.current) {
      isPlayingRef.current = false
      return
    }

    isPlayingRef.current = true
    const chunk = playbackQueueRef.current.shift()!

    // Convert raw PCM f32le bytes to Float32Array
    const float32Data = new Float32Array(chunk)
    const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000)
    audioBuffer.getChannelData(0).set(float32Data)

    const source = ctx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(ctx.destination)
    currentSourceRef.current = source

    source.onended = () => {
      currentSourceRef.current = null
      playNextChunk()
    }

    source.start()
  }, [])

  const queueAudioChunk = useCallback(
    (data: ArrayBuffer) => {
      if (!shouldPlayAudioRef.current) return;
      initPlaybackContext()
      playbackQueueRef.current.push(data)

      if (!isPlayingRef.current) {
        playNextChunk()
      }
    },
    [initPlaybackContext, playNextChunk]
  )

  const stopPlayback = useCallback(() => {
    shouldPlayAudioRef.current = false
    // Stop current audio source
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop()
      } catch {}
      currentSourceRef.current = null
    }
    // Clear queue
    playbackQueueRef.current = []
    isPlayingRef.current = false
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
            setSessionState("listening")
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
    (config: {
      workspaceId: number
      categories: string
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

      const ws = new WebSocket("ws://localhost:8000/ws/voice-interview")
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
      if (playbackContextRef.current) {
        playbackContextRef.current.close()
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
