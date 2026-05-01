"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  RemoteAudioTrack,
  RemoteTrack,
  RemoteVideoTrack,
  Room,
  RoomEvent,
} from "livekit-client"

const AGENT_CONTROL_TOPIC = "agent-control"
const AGENT_RESPONSE_TOPIC = "agent-response"
const HEYGEN_PARTICIPANT_ID = "heygen"
const LIVEAVATAR_AGENT_PARTICIPANT_ID_PREFIX = "liveavatar-agent-"
const REQUIRED_PARTICIPANTS_TIMEOUT_MS = 30_000
const REQUIRED_MEDIA_TRACKS_TIMEOUT_MS = 30_000

export type LiveAvatarRoomStatus =
  | "idle"
  | "connecting"
  | "ready"
  | "speaking"
  | "listening"
  | "failed"

export interface LiveAvatarBootstrapData {
  liveavatarSessionId: string
  livekitUrl: string
  livekitClientToken: string
}

export interface LiveAvatarEventPayload {
  event_type?: string
  [key: string]: unknown
}

interface UseLiveAvatarRoomOptions {
  onAvatarEvent?: (event: LiveAvatarEventPayload) => void
  onFatalError?: (reason: string) => void
}

export function useLiveAvatarRoom(options: UseLiveAvatarRoomOptions = {}) {
  const { onAvatarEvent, onFatalError } = options

  const roomRef = useRef<Room | null>(null)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)
  const isIntentionalDisconnectRef = useRef(false)
  const sessionIdRef = useRef<string | null>(null)
  const hasInFlightSpeechRef = useRef(false)
  const onAvatarEventRef = useRef(onAvatarEvent)
  const onFatalErrorRef = useRef(onFatalError)
  const remoteAudioTrackRef = useRef<RemoteAudioTrack | null>(null)
  const remoteVideoTrackRef = useRef<RemoteVideoTrack | null>(null)

  const [status, setStatus] = useState<LiveAvatarRoomStatus>("idle")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    onAvatarEventRef.current = onAvatarEvent
  }, [onAvatarEvent])

  useEffect(() => {
    onFatalErrorRef.current = onFatalError
  }, [onFatalError])

  const detachMedia = useCallback(() => {
    const videoElement = videoElementRef.current
    if (videoElement) {
      if (remoteVideoTrackRef.current) {
        remoteVideoTrackRef.current.detach(videoElement)
      }
      if (remoteAudioTrackRef.current) {
        remoteAudioTrackRef.current.detach(videoElement)
      }
      videoElement.pause()
      videoElement.removeAttribute("src")
      videoElement.srcObject = null
    }
  }, [])

  const attachMedia = useCallback(() => {
    const videoElement = videoElementRef.current
    if (!videoElement) {
      return
    }

    if (remoteVideoTrackRef.current) {
      remoteVideoTrackRef.current.attach(videoElement)
    }
    if (remoteAudioTrackRef.current) {
      remoteAudioTrackRef.current.attach(videoElement)
    }

    videoElement.autoplay = true
    videoElement.playsInline = true
    videoElement.muted = false
    videoElement.volume = 1
    void videoElement.play().catch(() => {})
  }, [])

  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    if (videoElementRef.current && videoElementRef.current !== element) {
      detachMedia()
    }

    videoElementRef.current = element
    attachMedia()
  }, [attachMedia, detachMedia])

  const hasRequiredMediaTracks = useCallback(() => {
    return Boolean(remoteAudioTrackRef.current && remoteVideoTrackRef.current)
  }, [])

  const waitForRequiredParticipants = useCallback((room: Room, sessionId: string) => {
    const requiredParticipants = new Set<string>([
      HEYGEN_PARTICIPANT_ID,
      `${LIVEAVATAR_AGENT_PARTICIPANT_ID_PREFIX}${sessionId}`,
    ])

    for (const participant of room.remoteParticipants.values()) {
      requiredParticipants.delete(participant.identity)
    }

    if (requiredParticipants.size === 0) {
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      const handleParticipantConnected = (participant: { identity: string }) => {
        requiredParticipants.delete(participant.identity)
        if (requiredParticipants.size === 0) {
          cleanup()
          resolve()
        }
      }

      const timeout = window.setTimeout(() => {
        cleanup()
        reject(
          new Error(
            `Timed out waiting for LiveAvatar participants: ${Array.from(requiredParticipants).join(", ")}`
          )
        )
      }, REQUIRED_PARTICIPANTS_TIMEOUT_MS)

      const cleanup = () => {
        window.clearTimeout(timeout)
        room.off(RoomEvent.ParticipantConnected, handleParticipantConnected)
      }

      room.on(RoomEvent.ParticipantConnected, handleParticipantConnected)
    })
  }, [])

  const waitForMediaTracks = useCallback((room: Room) => {
    if (hasRequiredMediaTracks()) {
      attachMedia()
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      const handleTrackSubscribed = (
        track: RemoteTrack,
        _publication: unknown,
        participant: { identity: string }
      ) => {
        if (participant.identity !== HEYGEN_PARTICIPANT_ID) {
          return
        }

        if (track.kind === "audio") {
          remoteAudioTrackRef.current = track as RemoteAudioTrack
        } else if (track.kind === "video") {
          remoteVideoTrackRef.current = track as RemoteVideoTrack
        }

        if (hasRequiredMediaTracks()) {
          cleanup()
          attachMedia()
          resolve()
        }
      }

      const timeout = window.setTimeout(() => {
        cleanup()
        reject(new Error("Timed out waiting for LiveAvatar media tracks."))
      }, REQUIRED_MEDIA_TRACKS_TIMEOUT_MS)

      const cleanup = () => {
        window.clearTimeout(timeout)
        room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed)
      }

      room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
    })
  }, [attachMedia, hasRequiredMediaTracks])

  const publishCommand = useCallback(async (payload: Record<string, unknown>) => {
    const room = roomRef.current
    if (!room || !room.localParticipant) {
      throw new Error("LiveAvatar room is not ready.")
    }

    const message = {
      event_id: crypto.randomUUID(),
      ...payload,
    }

    const bytes = new TextEncoder().encode(JSON.stringify(message))
    await room.localParticipant.publishData(bytes, {
      reliable: true,
      topic: AGENT_CONTROL_TOPIC,
    })
  }, [])

  const disconnect = useCallback(async () => {
    isIntentionalDisconnectRef.current = true
    hasInFlightSpeechRef.current = false

    const room = roomRef.current
    roomRef.current = null
    sessionIdRef.current = null
    remoteAudioTrackRef.current = null
    remoteVideoTrackRef.current = null
    detachMedia()

    if (room) {
      room.disconnect()
    }

    setStatus("idle")
    setError(null)
  }, [detachMedia])

  const failRoom = useCallback(
    async (reason: string) => {
      setError(reason)
      setStatus("failed")
      onFatalErrorRef.current?.(reason)
      await disconnect()
    },
    [disconnect]
  )

  const connect = useCallback(
    async ({ liveavatarSessionId, livekitUrl, livekitClientToken }: LiveAvatarBootstrapData) => {
      await disconnect()
      isIntentionalDisconnectRef.current = false
      setStatus("connecting")
      setError(null)

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      })
      roomRef.current = room
      sessionIdRef.current = liveavatarSessionId

      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _publication, participant) => {
        if (participant.identity !== HEYGEN_PARTICIPANT_ID) {
          return
        }

        if (track.kind === "audio") {
          remoteAudioTrackRef.current = track as RemoteAudioTrack
        } else if (track.kind === "video") {
          remoteVideoTrackRef.current = track as RemoteVideoTrack
        }

        attachMedia()
      })

      room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, _publication, participant) => {
        if (participant.identity !== HEYGEN_PARTICIPANT_ID) {
          return
        }

        if (track.kind === "audio" && remoteAudioTrackRef.current === track) {
          remoteAudioTrackRef.current = null
        } else if (track.kind === "video" && remoteVideoTrackRef.current === track) {
          remoteVideoTrackRef.current = null
        }

        detachMedia()
        attachMedia()
      })

      room.on(
        RoomEvent.DataReceived,
        async (
          payload: Uint8Array,
          _participant: unknown,
          _kind: unknown,
          topic?: string
        ) => {
        if (topic !== AGENT_RESPONSE_TOPIC) {
          return
        }

        try {
          const parsed = JSON.parse(new TextDecoder().decode(payload)) as LiveAvatarEventPayload
          const eventType = parsed.event_type

          if (eventType === "avatar.speak_started") {
            setStatus("speaking")
          } else if (eventType === "avatar.speak_ended") {
            hasInFlightSpeechRef.current = false
            setStatus("ready")
          } else if (eventType === "avatar.start_listening") {
            setStatus("listening")
          } else if (eventType === "session.stopped") {
            hasInFlightSpeechRef.current = false
            await failRoom("LiveAvatar session stopped unexpectedly.")
            return
          }

          onAvatarEventRef.current?.(parsed)
        } catch (eventError) {
          console.error("Failed to parse LiveAvatar event:", eventError)
        }
        }
      )

      room.on(RoomEvent.Disconnected, () => {
        if (!isIntentionalDisconnectRef.current) {
          void failRoom("LiveAvatar room disconnected.")
        }
      })

      try {
        await room.connect(livekitUrl, livekitClientToken, {
          autoSubscribe: true,
        })
        await waitForRequiredParticipants(room, liveavatarSessionId)
        await waitForMediaTracks(room)
        setStatus("ready")
      } catch (connectError) {
        isIntentionalDisconnectRef.current = true
        roomRef.current = null
        sessionIdRef.current = null
        remoteAudioTrackRef.current = null
        remoteVideoTrackRef.current = null
        detachMedia()
        room.disconnect()
        throw connectError
      }
    },
    [attachMedia, detachMedia, disconnect, failRoom, waitForMediaTracks, waitForRequiredParticipants]
  )

  const speakText = useCallback(
    async (text: string) => {
      const cleanText = text.trim()
      if (!cleanText) {
        return
      }
      if (hasInFlightSpeechRef.current) {
        throw new Error("LiveAvatar already has an in-flight interviewer utterance.")
      }

      hasInFlightSpeechRef.current = true
      setStatus("speaking")
      try {
        await publishCommand({
          event_type: "avatar.speak_text",
          text: cleanText,
        })
      } catch (publishError) {
        hasInFlightSpeechRef.current = false
        throw publishError
      }
    },
    [publishCommand]
  )

  const interrupt = useCallback(async () => {
    hasInFlightSpeechRef.current = false
    await publishCommand({ event_type: "avatar.interrupt" })
  }, [publishCommand])

  const startListening = useCallback(async () => {
    setStatus("listening")
    await publishCommand({ event_type: "avatar.start_listening" })
  }, [publishCommand])

  const stopListening = useCallback(async () => {
    await publishCommand({ event_type: "avatar.stop_listening" })
  }, [publishCommand])

  useEffect(() => {
    return () => {
      void disconnect()
    }
  }, [disconnect])

  return {
    status,
    error,
    videoRef: setVideoRef,
    connect,
    disconnect,
    speakText,
    interrupt,
    startListening,
    stopListening,
  }
}
