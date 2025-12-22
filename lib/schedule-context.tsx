"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { addDays, format, startOfWeek } from "date-fns"

export type EventType = "interview" | "quiz" | "practice" | "other"

export interface CalendarEvent {
    id: string
    title: string
    date: Date
    type: EventType
    description?: string
    duration?: number // in minutes
}

interface ScheduleContextType {
    events: CalendarEvent[]
    addEvent: (event: Omit<CalendarEvent, "id">) => void
    removeEvent: (id: string) => void
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined)

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
    const [events, setEvents] = useState<CalendarEvent[]>([])

    // Initialize with some mock data
    useEffect(() => {
        const today = new Date()
        const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 })

        setEvents([
            {
                id: "1",
                title: "Mock Interview with HR",
                date: addDays(startOfCurrentWeek, 1), // Monday/Tuesday
                type: "interview",
                description: "Behavioral practice"
            },
            {
                id: "2",
                title: "React Quiz",
                date: addDays(startOfCurrentWeek, 3),
                type: "quiz",
                description: "Advanced hooks and patterns"
            }
        ])
    }, [])

    const addEvent = (event: Omit<CalendarEvent, "id">) => {
        const newEvent = {
            ...event,
            id: Math.random().toString(36).substr(2, 9),
        }
        setEvents((prev) => [...prev, newEvent])
    }

    const removeEvent = (id: string) => {
        setEvents((prev) => prev.filter((e) => e.id !== id))
    }

    return (
        <ScheduleContext.Provider value={{ events, addEvent, removeEvent }}>
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
