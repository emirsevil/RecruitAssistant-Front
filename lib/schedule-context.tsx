"use client"

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { addDays, startOfWeek } from "date-fns"
import { useAuth } from "./auth-context"
import { apiUrl } from "@/lib/api-config"

export type EventType = "interview" | "quiz" | "practice" | "other"

export interface CalendarEvent {
    id: string
    title: string
    date: Date
    type: EventType
    description?: string
    duration?: number // in minutes
    startTime: Date
    endTime: Date
}

interface ApiScheduleEvent {
    id: number
    user_id: number
    title: string
    event_type: EventType
    description?: string | null
    start_time: string
    end_time: string
    created_at: string
}

interface CreateCalendarEventInput {
    title: string
    type: EventType
    description?: string
    startTime: Date
    endTime: Date
}

interface ScheduleContextType {
    events: CalendarEvent[]
    isLoading: boolean
    error: string | null
    fetchEvents: (start: Date, end: Date) => Promise<CalendarEvent[]>
    getEventsForRange: (start: Date, end: Date) => Promise<CalendarEvent[]>
    addEvent: (event: CreateCalendarEventInput) => Promise<CalendarEvent>
    removeEvent: (id: string) => Promise<void>
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined)

function mapApiEvent(event: ApiScheduleEvent): CalendarEvent {
    const startTime = new Date(event.start_time)
    const endTime = new Date(event.end_time)

    return {
        id: event.id.toString(),
        title: event.title,
        date: startTime,
        type: event.event_type,
        description: event.description ?? undefined,
        duration: Math.max(0, Math.round((endTime.getTime() - startTime.getTime()) / 60000)),
        startTime,
        endTime,
    }
}

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { user, isLoading: isAuthLoading } = useAuth()
    /** Last range passed to fetchEvents — used to refresh after POST/DELETE without stale UI */
    const lastRangeRef = useRef<{ start: Date; end: Date } | null>(null)

    const getEventsForRange = useCallback(async (start: Date, end: Date) => {
        if (!user) return []

        const params = new URLSearchParams({
            start: start.toISOString(),
            end: end.toISOString(),
        })

        const response = await fetch(apiUrl(`/schedule/events?${params.toString()}`), {
            credentials: "include",
        })

        if (!response.ok) {
            throw new Error("Failed to fetch scheduled events")
        }

        const data: ApiScheduleEvent[] = await response.json()
        return data.map(mapApiEvent)
    }, [user])

    const fetchEvents = useCallback(async (start: Date, end: Date) => {
        lastRangeRef.current = { start, end }
        setIsLoading(true)
        setError(null)

        try {
            const data = await getEventsForRange(start, end)
            setEvents(data)
            return data
        } catch (e: any) {
            const message = e.message || "Failed to fetch scheduled events"
            setError(message)
            setEvents([])
            return []
        } finally {
            setIsLoading(false)
        }
    }, [getEventsForRange])

    useEffect(() => {
        if (isAuthLoading) return

        if (!user) {
            setEvents([])
            setError(null)
            return
        }

        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
        fetchEvents(weekStart, addDays(weekStart, 7))
    }, [fetchEvents, isAuthLoading, user])

    const addEvent = useCallback(async (event: CreateCalendarEventInput) => {
        if (!user) throw new Error("Authentication required")

        const response = await fetch(apiUrl("/schedule/events"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                title: event.title,
                event_type: event.type,
                description: event.description,
                start_time: event.startTime.toISOString(),
                end_time: event.endTime.toISOString(),
            }),
        })

        if (!response.ok) {
            const data = await response.json().catch(() => null)
            const detail = data?.detail
            throw new Error(
                typeof detail === "string"
                    ? detail
                    : Array.isArray(detail)
                      ? detail.map((x: { msg?: string }) => x.msg).filter(Boolean).join(", ") || "Failed to create scheduled event"
                      : "Failed to create scheduled event",
            )
        }

        const created = mapApiEvent(await response.json())
        if (lastRangeRef.current) {
            const refreshed = await getEventsForRange(lastRangeRef.current.start, lastRangeRef.current.end)
            setEvents(refreshed)
        } else {
            setEvents((prev) => [...prev, created].sort((a, b) => a.startTime.getTime() - b.startTime.getTime()))
        }
        return created
    }, [user, getEventsForRange])

    const removeEvent = useCallback(async (id: string) => {
        const response = await fetch(apiUrl(`/schedule/events/${id}`), {
            method: "DELETE",
            credentials: "include",
        })

        if (!response.ok) {
            const data = await response.json().catch(() => null)
            const detail = data?.detail
            throw new Error(
                typeof detail === "string"
                    ? detail
                    : `Failed to delete scheduled event (${response.status})`,
            )
        }

        if (lastRangeRef.current) {
            const refreshed = await getEventsForRange(lastRangeRef.current.start, lastRangeRef.current.end)
            setEvents(refreshed)
        } else {
            setEvents((prev) => prev.filter((e) => e.id !== id))
        }
    }, [getEventsForRange])

    return (
        <ScheduleContext.Provider value={{ events, isLoading, error, fetchEvents, getEventsForRange, addEvent, removeEvent }}>
            {children}
        </ScheduleContext.Provider>
    )
}

export function useSchedule() {
    const context = useContext(ScheduleContext)
    if (context === undefined) {
        throw new Error("useSchedule must be used within a ScheduleProvider")
    }
    return context
}
