import { useState, useRef, useCallback, useEffect } from "react"

/**
 * Simple browser-native speech-to-text hook using the Web Speech API.
 * No backend or API key required — runs entirely in the browser.
 * 
 * Supports Turkish and English. Appends transcribed text to a callback.
 */

// Web Speech API type declarations (not fully standardized)
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface UseSpeechToTextOptions {
  language?: string
  onTranscript?: (text: string) => void
}

interface UseSpeechToTextReturn {
  isRecording: boolean
  isSupported: boolean
  transcript: string
  startRecording: () => void
  stopRecording: () => void
  toggleRecording: () => void
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
  const { language = "tr-TR", onTranscript } = options
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<any>(null)
  const onTranscriptRef = useRef(onTranscript)

  // Keep callback ref updated
  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  // Check browser support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)
  }, [])

  const startRecording = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.error("[STT] Web Speech API not supported")
      return
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    const recognition = new SpeechRecognition()
    recognition.lang = language
    recognition.interimResults = true
    recognition.continuous = true
    recognition.maxAlternatives = 1

    let finalTranscript = ""

    recognition.onresult = (event: any) => {
      let interim = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          const text = result[0].transcript.trim()
          finalTranscript += (finalTranscript ? " " : "") + text
          onTranscriptRef.current?.(text)
        } else {
          interim = result[0].transcript
        }
      }
      setTranscript(finalTranscript + (interim ? " " + interim : ""))
    }

    recognition.onerror = (event: any) => {
      console.error("[STT] Error:", event.error)
      if (event.error !== "no-speech") {
        setIsRecording(false)
      }
    }

    recognition.onend = () => {
      // Auto-restart if still recording (handles browser auto-stop)
      if (recognitionRef.current === recognition && isRecording) {
        try {
          recognition.start()
        } catch {
          setIsRecording(false)
        }
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
    setTranscript("")
  }, [language, isRecording])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null // Prevent auto-restart
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsRecording(false)
  }, [])

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null
        recognitionRef.current.stop()
      }
    }
  }, [])

  return {
    isRecording,
    isSupported,
    transcript,
    startRecording,
    stopRecording,
    toggleRecording,
  }
}
