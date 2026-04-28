"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react"
import { format, addDays, startOfWeek, isSameDay, subWeeks, addWeeks } from "date-fns"
import { enUS, tr } from "date-fns/locale"

import { PageContainer, PageHeader } from "@/components/page-container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CalendarEvent, EventType, useSchedule } from "@/lib/schedule-context"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, History, Clock, MessageSquare, Brain, Trash2 } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"

type HistorySummary = {
    week: string
    stats: { quiz: number, interview: number, practice: string }
}

type DragSelection = {
    day: Date
    dayKey: string
    startMinutes: number
    endMinutes: number
}

const CALENDAR_START_HOUR = 0
const CALENDAR_END_HOUR = 24
const HOUR_HEIGHT = 56
const SLOT_MINUTES = 15
const MIN_EVENT_HEIGHT = 24
const INITIAL_SCROLL_HOUR = 7 + 45 / 60

function combineDateAndTime(date: Date, time: string) {
    const [hours, minutes] = time.split(":").map(Number)
    const eventDate = new Date(date)
    eventDate.setHours(hours, minutes, 0, 0)
    return eventDate
}

function formatPracticeDuration(minutes: number) {
    if (minutes <= 0) return "0h"
    if (minutes % 60 === 0) return `${minutes / 60}h`
    return `${(minutes / 60).toFixed(1)}h`
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function getMinutesFromDate(date: Date) {
    return date.getHours() * 60 + date.getMinutes()
}

function formatMinutesAsTime(minutes: number) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

function getDayKey(date: Date) {
    return format(date, "yyyy-MM-dd")
}

function getSlotMinutesFromPointer(element: HTMLDivElement, clientY: number) {
    const visibleStart = CALENDAR_START_HOUR * 60
    const maxSelectableStart = CALENDAR_END_HOUR * 60 - SLOT_MINUTES * 2
    const rect = element.getBoundingClientRect()
    const y = clamp(clientY - rect.top, 0, rect.height)
    const rawMinutes = visibleStart + (y / HOUR_HEIGHT) * 60

    return clamp(
        Math.floor(rawMinutes / SLOT_MINUTES) * SLOT_MINUTES,
        visibleStart,
        maxSelectableStart
    )
}

function buildDragSelection(day: Date, anchorMinutes: number, currentMinutes: number): DragSelection {
    const maxSelectableEnd = CALENDAR_END_HOUR * 60 - SLOT_MINUTES
    const startMinutes = Math.min(anchorMinutes, currentMinutes)
    const endMinutes = Math.min(Math.max(anchorMinutes, currentMinutes) + SLOT_MINUTES, maxSelectableEnd)

    return {
        day,
        dayKey: getDayKey(day),
        startMinutes,
        endMinutes,
    }
}

function getEventLayout(event: CalendarEvent): CSSProperties | null {
    const visibleStart = CALENDAR_START_HOUR * 60
    const visibleEnd = CALENDAR_END_HOUR * 60
    const startMinutes = getMinutesFromDate(event.startTime)
    const endMinutes = getMinutesFromDate(event.endTime)

    if (endMinutes <= visibleStart || startMinutes >= visibleEnd) return null

    const top = ((Math.max(startMinutes, visibleStart) - visibleStart) / 60) * HOUR_HEIGHT
    const height = ((Math.min(endMinutes, visibleEnd) - Math.max(startMinutes, visibleStart)) / 60) * HOUR_HEIGHT

    return {
        top,
        height: Math.max(MIN_EVENT_HEIGHT, height - 4),
    }
}

function getTimeRangeLayout(startMinutes: number, endMinutes: number): CSSProperties {
    const visibleStart = CALENDAR_START_HOUR * 60
    const top = ((startMinutes - visibleStart) / 60) * HOUR_HEIGHT
    const height = ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT

    return {
        top,
        height: Math.max(MIN_EVENT_HEIGHT, height - 4),
    }
}

export default function SchedulePage() {
    const { t, language } = useLanguage()
    const { events, addEvent, removeEvent, fetchEvents, getEventsForRange, isLoading, error } = useSchedule()
    const [currentDate, setCurrentDate] = useState(() => new Date())
    const [now, setNow] = useState(() => new Date())
    const gridScrollRef = useRef<HTMLDivElement | null>(null)

    const dateLocale = language === "tr" ? tr : enUS

    // Weekly Navigation
    const startOfCurrentWeek = useMemo(
        () => startOfWeek(currentDate, { weekStartsOn: 1, locale: dateLocale }),
        [currentDate, dateLocale]
    )
    const endOfCurrentWeek = useMemo(() => addDays(startOfCurrentWeek, 7), [startOfCurrentWeek])
    const weekStartMs = startOfCurrentWeek.getTime()
    const weekDays = useMemo(
        () => Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i)),
        [startOfCurrentWeek]
    )
    const calendarHours = useMemo(
        () => Array.from({ length: CALENDAR_END_HOUR - CALENDAR_START_HOUR }).map((_, i) => CALENDAR_START_HOUR + i),
        []
    )
    const gridHeight = calendarHours.length * HOUR_HEIGHT
    const weekRange = `${format(startOfCurrentWeek, "MMM d", { locale: dateLocale })} - ${format(addDays(startOfCurrentWeek, 6), "MMM d, yyyy", { locale: dateLocale })}`
    const [historySummaries, setHistorySummaries] = useState<HistorySummary[]>([])

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 60000)
        return () => window.clearInterval(timer)
    }, [])

    useLayoutEffect(() => {
        const scrollContainer = gridScrollRef.current
        if (!scrollContainer) return

        const scrollToInitialTime = () => {
            scrollContainer.scrollTop = HOUR_HEIGHT * (INITIAL_SCROLL_HOUR - CALENDAR_START_HOUR)
        }

        scrollToInitialTime()
        const timeoutId = window.setTimeout(scrollToInitialTime, 0)

        return () => window.clearTimeout(timeoutId)
    }, [])

    useEffect(() => {
        fetchEvents(startOfCurrentWeek, endOfCurrentWeek)
    }, [endOfCurrentWeek, fetchEvents, startOfCurrentWeek])

    useEffect(() => {
        let cancelled = false
        const historyWeekStarts = [1, 2, 3].map((weeksBack) => subWeeks(startOfCurrentWeek, weeksBack))
        const oldestHistoryWeek = historyWeekStarts[historyWeekStarts.length - 1]

        getEventsForRange(oldestHistoryWeek, startOfCurrentWeek)
            .then((historyEvents) => {
                if (cancelled) return

                const summaries = historyWeekStarts.map((weekStart) => {
                    const weekEnd = addDays(weekStart, 7)
                    const weekEvents = historyEvents.filter((event) => {
                        const eventTime = event.startTime.getTime()
                        return eventTime >= weekStart.getTime() && eventTime < weekEnd.getTime()
                    })
                    const practiceMinutes = weekEvents
                        .filter((event) => event.type === "practice")
                        .reduce((total, event) => total + (event.duration ?? 0), 0)

                    return {
                        week: `${format(weekStart, "MMM d", { locale: dateLocale })} - ${format(addDays(weekStart, 6), "d", { locale: dateLocale })}`,
                        stats: {
                            quiz: weekEvents.filter((event) => event.type === "quiz").length,
                            interview: weekEvents.filter((event) => event.type === "interview").length,
                            practice: formatPracticeDuration(practiceMinutes),
                        }
                    }
                })

                setHistorySummaries(summaries)
            })
            .catch(() => {
                if (!cancelled) setHistorySummaries([])
            })

        return () => {
            cancelled = true
        }
    }, [dateLocale, getEventsForRange, startOfCurrentWeek, weekStartMs])

    const navigateWeek = (direction: "prev" | "next") => {
        setCurrentDate(prev => direction === "prev" ? subWeeks(prev, 1) : addWeeks(prev, 1))
    }

    // Add Event State
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [newEvent, setNewEvent] = useState({
        title: "",
        type: "practice" as EventType,
        startTime: "10:00",
        endTime: "11:00"
    })
    const [dragSelection, setDragSelection] = useState<DragSelection | null>(null)
    const dragSelectionRef = useRef<DragSelection | null>(null)
    const dragAnchorMinutesRef = useRef<number | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const handleAddEvent = async () => {
        if (!selectedDate) return
        setFormError(null)

        const title = newEvent.title.trim()
        if (!title) {
            setFormError(t("Activity title is required"))
            return
        }

        const startTime = combineDateAndTime(selectedDate, newEvent.startTime)
        const endTime = combineDateAndTime(selectedDate, newEvent.endTime)
        if (endTime <= startTime) {
            setFormError(t("End time must be after start time"))
            return
        }

        setIsSubmitting(true)
        try {
            await addEvent({
                title,
                startTime,
                endTime,
                type: newEvent.type,
                description: "Scheduled via Weekly Planner"
            })

            setIsAddDialogOpen(false)
            setNewEvent({ title: "", type: "practice", startTime: "10:00", endTime: "11:00" })
        } catch (e: any) {
            setFormError(e.message || t("Failed to schedule event"))
        } finally {
            setIsSubmitting(false)
        }
    }

    const openAddDialog = (date: Date, startTime = newEvent.startTime, endTime = newEvent.endTime) => {
        setSelectedDate(date)
        setNewEvent((prev) => ({ ...prev, startTime, endTime }))
        setFormError(null)
        setIsAddDialogOpen(true)
    }

    const updateDragSelection = (selection: DragSelection | null) => {
        dragSelectionRef.current = selection
        setDragSelection(selection)
    }

    const finalizeDragSelection = () => {
        const selection = dragSelectionRef.current
        if (!selection) return

        openAddDialog(
            selection.day,
            formatMinutesAsTime(selection.startMinutes),
            formatMinutesAsTime(selection.endMinutes)
        )
        updateDragSelection(null)
        dragAnchorMinutesRef.current = null
    }

    const handleGridMouseDown = (day: Date, mouseEvent: MouseEvent<HTMLDivElement>) => {
        if (mouseEvent.button !== 0) return
        const target = mouseEvent.target as HTMLElement
        if (target.closest("[data-event-card='true']")) return

        mouseEvent.preventDefault()
        const startMinutes = getSlotMinutesFromPointer(mouseEvent.currentTarget, mouseEvent.clientY)
        dragAnchorMinutesRef.current = startMinutes
        updateDragSelection(buildDragSelection(day, startMinutes, startMinutes))
        window.addEventListener("mouseup", finalizeDragSelection, { once: true })
    }

    const handleGridMouseMove = (day: Date, mouseEvent: MouseEvent<HTMLDivElement>) => {
        const activeSelection = dragSelectionRef.current
        const anchorMinutes = dragAnchorMinutesRef.current
        if (!activeSelection || anchorMinutes === null || activeSelection.dayKey !== getDayKey(day)) return

        const currentMinutes = getSlotMinutesFromPointer(mouseEvent.currentTarget, mouseEvent.clientY)
        updateDragSelection(buildDragSelection(day, anchorMinutes, currentMinutes))
    }

    const currentTimeTop = useMemo(() => {
        const minutes = getMinutesFromDate(now)
        const visibleStart = CALENDAR_START_HOUR * 60
        const visibleEnd = CALENDAR_END_HOUR * 60

        if (minutes < visibleStart || minutes > visibleEnd) return null
        return ((minutes - visibleStart) / 60) * HOUR_HEIGHT
    }, [now])

    return (
        <>
            <PageContainer className="box-border h-[calc(100vh-56px)] overflow-hidden py-3 md:py-4">
                <div className="flex h-full min-h-0 flex-col gap-3">
                    <div className="shrink-0">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <PageHeader className="mb-0 md:mb-0" title={t("Weekly Schedule")} description={t("Plan your tailored preparation journey")} />

                            {/* History Box Popover */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="gap-2 rounded-lg border-border/70 bg-background/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                                        <History className="h-4 w-4" />
                                        {t("View History")}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 rounded-lg border-border/70 p-5 shadow-xl shadow-black/5" align="end">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold">{t("Past Weeks Summary")}</h4>
                                        <ScrollArea className="h-[200px]">
                                            <div className="space-y-4 pr-4">
                                                {historySummaries.length === 0 ? (
                                                    <p className="py-6 text-center text-sm text-muted-foreground">{t("No history yet.")}</p>
                                                ) : (
                                                    historySummaries.map((summary) => (
                                                        <HistoryItem
                                                            key={summary.week}
                                                            week={summary.week}
                                                            stats={summary.stats}
                                                        />
                                                    ))
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border-border/70 bg-card/95 shadow-xl shadow-black/[0.04]">
                        <CardHeader className="z-30 flex shrink-0 flex-col gap-4 border-b border-border/60 bg-card py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border/60 bg-background shadow-sm">
                                    <CalendarIcon className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium uppercase text-muted-foreground">{t("This Week")}</p>
                                    <CardTitle className="mt-1 text-xl font-semibold">{weekRange}</CardTitle>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/80 p-1 shadow-sm">
                                <Button variant="ghost" size="icon" className="rounded-md hover:bg-muted" onClick={() => navigateWeek("prev")}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="rounded-md hover:bg-muted" onClick={() => navigateWeek("next")}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
                            {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
                            {isLoading && <p className="mb-4 text-sm text-muted-foreground">{t("Loading")}...</p>}
                            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border/70 bg-background shadow-sm">
                                <div ref={gridScrollRef} className={cn("min-h-0 flex-1 overflow-x-auto overflow-y-auto overscroll-contain", dragSelection && "select-none")}>
                                    <div className="min-w-[1080px]">
                                        <div
                                            className="sticky top-0 z-40 grid border-b border-border/70 bg-background shadow-sm"
                                            style={{ gridTemplateColumns: "72px repeat(7, minmax(140px, 1fr))" }}
                                        >
                                            <div className="sticky left-0 z-50 border-r border-border/70 bg-background" />
                                            {weekDays.map((day) => {
                                                const isToday = isSameDay(day, now)

                                                return (
                                                    <div
                                                        key={day.toISOString()}
                                                        className={cn(
                                                            "border-r border-border/60 px-3 py-3 text-center last:border-r-0",
                                                            isToday && "bg-primary/[0.04]"
                                                        )}
                                                    >
                                                        <div className={cn("text-xs font-semibold uppercase text-muted-foreground", isToday && "text-primary")}>
                                                            {format(day, "EEE", { locale: dateLocale })}
                                                        </div>
                                                        <div className={cn("mt-1 inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-lg font-semibold text-foreground", isToday && "bg-primary text-primary-foreground shadow-sm")}>
                                                            {format(day, "d", { locale: dateLocale })}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <div
                                            className="grid"
                                            style={{ gridTemplateColumns: "72px repeat(7, minmax(140px, 1fr))" }}
                                        >
                                            <div
                                                className="sticky left-0 z-30 border-r border-border/70 bg-background"
                                                style={{ height: gridHeight }}
                                            >
                                                {calendarHours.map((hour, index) => (
                                                    <div
                                                        key={hour}
                                                        className="absolute right-3 text-xs font-medium text-muted-foreground"
                                                        style={{ top: index === 0 ? 8 : index * HOUR_HEIGHT - 8 }}
                                                    >
                                                        {formatMinutesAsTime(hour * 60)}
                                                    </div>
                                                ))}
                                            </div>

                                            {weekDays.map((day) => {
                                                const isToday = isSameDay(day, now)
                                                const dayEvents = events
                                                    .filter((event) => isSameDay(event.startTime, day))
                                                    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

                                                return (
                                                    <div
                                                        key={day.toISOString()}
                                                        className={cn(
                                                            "relative cursor-crosshair border-r border-border/60 bg-background transition-colors last:border-r-0 hover:bg-muted/20",
                                                            isToday && "bg-primary/[0.025]"
                                                        )}
                                                        style={{ height: gridHeight }}
                                                        onMouseDown={(mouseEvent) => handleGridMouseDown(day, mouseEvent)}
                                                        onMouseMove={(mouseEvent) => handleGridMouseMove(day, mouseEvent)}
                                                    >
                                                        {calendarHours.map((hour, index) => (
                                                            <div key={hour}>
                                                                <div
                                                                    className="pointer-events-none absolute left-0 right-0 border-t border-border/70"
                                                                    style={{ top: index * HOUR_HEIGHT }}
                                                                />
                                                                <div
                                                                    className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-border/40"
                                                                    style={{ top: index * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                                                                />
                                                            </div>
                                                        ))}

                                                        {isToday && currentTimeTop !== null && (
                                                            <div
                                                                className="pointer-events-none absolute left-0 right-0 z-30"
                                                                style={{ top: currentTimeTop }}
                                                            >
                                                                <div className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-red-500 shadow-sm ring-2 ring-background" />
                                                                <div className="h-px bg-red-500/90 shadow-[0_0_0_1px_rgba(239,68,68,0.08)]" />
                                                            </div>
                                                        )}

                                                        {dayEvents.map((event) => {
                                                            const layout = getEventLayout(event)
                                                            if (!layout) return null

                                                            return (
                                                                <EventCard
                                                                    key={event.id}
                                                                    event={event}
                                                                    style={layout}
                                                                    onDelete={() => removeEvent(event.id).catch(console.error)}
                                                                />
                                                            )
                                                        })}

                                                        {dragSelection?.dayKey === getDayKey(day) && (
                                                            <SelectionGhost selection={dragSelection} />
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Add Event Dialog */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogContent className="rounded-lg border-border/70 shadow-2xl shadow-black/10">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold">{t("Add Event")}</DialogTitle>
                            <DialogDescription className="text-sm">
                                {t("Schedule Event")} {selectedDate && format(selectedDate, "MMMM d", { locale: dateLocale })}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">{t("Activity Title")}</Label>
                                <Input
                                    id="title"
                                    className="rounded-lg"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    placeholder={t("e.g., Python Data Structures")}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">{t("Type")}</Label>
                                <Select
                                    value={newEvent.type}
                                    onValueChange={(val: any) => setNewEvent({ ...newEvent, type: val })}
                                >
                                    <SelectTrigger className="rounded-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="interview">{t("Mock Interview")}</SelectItem>
                                        <SelectItem value="quiz">{t("Quizzes")}</SelectItem>
                                        <SelectItem value="practice">{t("Practice Session")}</SelectItem>
                                        <SelectItem value="other">{t("Other")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="start-time">{t("Start Time")}</Label>
                                <Input
                                    id="start-time"
                                    type="time"
                                    className="rounded-lg"
                                    value={newEvent.startTime}
                                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="end-time">{t("End Time")}</Label>
                                <Input
                                    id="end-time"
                                    type="time"
                                    className="rounded-lg"
                                    value={newEvent.endTime}
                                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                                />
                            </div>
                            {formError && <p className="text-sm text-destructive">{formError}</p>}
                        </div>
                        <DialogFooter>
                            <Button className="rounded-lg shadow-sm" onClick={handleAddEvent} disabled={isSubmitting}>
                                {isSubmitting ? t("Scheduling") : t("Schedule Event")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </PageContainer>
        </>
    )
}

function SelectionGhost({ selection }: { selection: DragSelection }) {
    return (
        <div
            className="pointer-events-none absolute left-2 right-2 z-10 rounded-lg border border-primary/40 bg-primary/10 px-2 py-1.5 text-[11px] font-medium text-primary shadow-sm ring-1 ring-primary/10 backdrop-blur-[1px]"
            style={getTimeRangeLayout(selection.startMinutes, selection.endMinutes)}
        >
            <div className="truncate">
                {formatMinutesAsTime(selection.startMinutes)} - {formatMinutesAsTime(selection.endMinutes)}
            </div>
        </div>
    )
}

function EventCard({ event, onDelete, style }: { event: CalendarEvent, onDelete: () => void | Promise<void>, style?: CSSProperties }) {
    const getIcon = (type: EventType) => {
        switch (type) {
            case "interview": return <MessageSquare className="h-3.5 w-3.5" />
            case "quiz": return <Brain className="h-3.5 w-3.5" />
            default: return <Clock className="h-3.5 w-3.5" />
        }
    }

    const getColor = (type: EventType) => {
        switch (type) {
            case "interview": return "border-cyan-200/80 bg-cyan-50 text-cyan-950 shadow-cyan-950/[0.04] dark:border-cyan-800/60 dark:bg-cyan-950/30 dark:text-cyan-100"
            case "quiz": return "border-rose-200/80 bg-rose-50 text-rose-950 shadow-rose-950/[0.04] dark:border-rose-800/60 dark:bg-rose-950/30 dark:text-rose-100"
            case "practice": return "border-emerald-200/80 bg-emerald-50 text-emerald-950 shadow-emerald-950/[0.04] dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-100"
            default: return "border-zinc-200/80 bg-zinc-50 text-zinc-950 shadow-zinc-950/[0.04] dark:border-zinc-700/70 dark:bg-zinc-900/60 dark:text-zinc-100"
        }
    }

    return (
        <div
            data-event-card="true"
            className={cn("group absolute left-1.5 right-1.5 z-20 cursor-default overflow-hidden rounded-lg border px-2 py-1.5 pr-8 text-xs shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg", getColor(event.type))}
            style={style}
            onClick={(mouseEvent) => mouseEvent.stopPropagation()}
            onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
        >
            <div className="mb-0.5 flex items-center gap-1.5 font-semibold">
                <span className="flex h-4 w-4 items-center justify-center rounded-md bg-white/70 shadow-sm ring-1 ring-black/[0.03] dark:bg-white/10 [&_svg]:h-3 [&_svg]:w-3">
                    {getIcon(event.type)}
                </span>
                <span className="truncate text-[10px] uppercase opacity-75">
                    {format(event.startTime, "HH:mm")} - {format(event.endTime, "HH:mm")}
                </span>
            </div>
            <div className="truncate text-xs font-semibold leading-4">{event.title}</div>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-1 top-1 z-30 h-6 w-6 rounded-md bg-white/75 text-current opacity-100 shadow-sm transition-colors hover:bg-red-50 hover:text-red-600 dark:bg-black/30 dark:hover:bg-red-950/50 dark:hover:text-red-300"
                onClick={(mouseEvent) => {
                    mouseEvent.stopPropagation()
                    onDelete()
                }}
            >
                <Trash2 className="h-3 w-3" />
            </Button>
        </div>
    )
}

function HistoryItem({ week, stats }: { week: string, stats: { quiz: number, interview: number, practice: string } }) {
    const { t } = useLanguage()
    return (
        <div className="rounded-lg border border-border/70 bg-background p-3 text-sm shadow-sm">
            <div className="mb-3 font-semibold">{week}</div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                <div className="flex flex-col items-center gap-1 rounded-lg bg-rose-50 px-2 py-2 text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">
                    <Brain className="h-3.5 w-3.5" />
                    <span>{stats.quiz} {t("Quizzes")}</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-lg bg-cyan-50 px-2 py-2 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-200">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{stats.interview} {t("Intrv.")}</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-lg bg-emerald-50 px-2 py-2 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{stats.practice}</span>
                </div>
            </div>
        </div>
    )
}
