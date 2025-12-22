"use client"

import { useState } from "react"
import { format, addDays, startOfWeek, isSameDay, subWeeks, addWeeks } from "date-fns"
import { enUS, tr } from "date-fns/locale"
import { Navigation } from "@/components/navigation"
import { PageContainer, PageHeader } from "@/components/page-container"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CalendarEvent, useSchedule } from "@/lib/schedule-context"
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, History, Clock, FileText, MessageSquare, Brain } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export default function SchedulePage() {
    const { t, language } = useLanguage()
    const { events, addEvent, removeEvent } = useSchedule()
    const [currentDate, setCurrentDate] = useState(new Date())

    const dateLocale = language === "tr" ? tr : enUS

    // Weekly Navigation
    const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1, locale: dateLocale })
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i))
    const weekRange = `${format(startOfCurrentWeek, "MMM d", { locale: dateLocale })} - ${format(addDays(startOfCurrentWeek, 6), "MMM d, yyyy", { locale: dateLocale })}`

    const navigateWeek = (direction: "prev" | "next") => {
        setCurrentDate(prev => direction === "prev" ? subWeeks(prev, 1) : addWeeks(prev, 1))
    }

    // Add Event State
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [newEvent, setNewEvent] = useState({
        title: "",
        type: "practice" as const,
        time: "10:00"
    })

    const handleAddEvent = () => {
        if (!selectedDate) return

        // Combine date and time (rough approximation for demo)
        const [hours, minutes] = newEvent.time.split(":").map(Number)
        const eventDate = new Date(selectedDate)
        eventDate.setHours(hours, minutes)

        addEvent({
            title: newEvent.title,
            date: eventDate,
            type: newEvent.type,
            description: "Scheduled via Weekly Planner"
        })

        setIsAddDialogOpen(false)
        setNewEvent({ title: "", type: "practice", time: "10:00" })
    }

    const openAddDialog = (date: Date) => {
        setSelectedDate(date)
        setIsAddDialogOpen(true)
    }

    return (
        <>
            <Navigation />
            <PageContainer>
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <PageHeader title={t("Weekly Schedule")} description={t("Plan your tailored preparation journey")} />

                        {/* History Box Popover */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <History className="h-4 w-4" />
                                    {t("View History")}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="end">
                                <div className="space-y-4">
                                    <h4 className="font-medium leading-none">{t("Past Weeks Summary")}</h4>
                                    <ScrollArea className="h-[200px]">
                                        <div className="space-y-4 pr-4">
                                            <HistoryItem
                                                week="Dec 8 - 14"
                                                stats={{ quiz: 2, interview: 1, practice: "3h" }}
                                            />
                                            <HistoryItem
                                                week="Dec 1 - 7"
                                                stats={{ quiz: 1, interview: 2, practice: "5h" }}
                                            />
                                            <HistoryItem
                                                week="Nov 24 - 30"
                                                stats={{ quiz: 3, interview: 0, practice: "2h" }}
                                            />
                                        </div>
                                    </ScrollArea>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                                <CardTitle>{weekRange}</CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={() => navigateWeek("prev")}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="icon" onClick={() => navigateWeek("next")}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                                {weekDays.map((day, i) => (
                                    <div key={i} className="flex flex-col gap-2">
                                        <div className={`text-center p-2 rounded-t-lg border-b ${isSameDay(day, new Date()) ? "bg-primary/10 text-primary font-bold" : "bg-muted/50"
                                            }`}>
                                            <div className="text-xs uppercase opacity-70">{format(day, "EEE", { locale: dateLocale })}</div>
                                            <div className="text-lg">{format(day, "d", { locale: dateLocale })}</div>
                                        </div>

                                        <div
                                            className="min-h-[150px] rounded-b-lg border border-t-0 p-2 space-y-2 transition-colors hover:bg-secondary/20 cursor-pointer"
                                            onClick={() => openAddDialog(day)}
                                        >
                                            {events
                                                .filter(e => isSameDay(new Date(e.date), day))
                                                .map(event => (
                                                    <EventCard key={event.id} event={event} />
                                                ))
                                            }
                                            <Button variant="ghost" className="w-full h-8 px-2 text-xs text-muted-foreground opacity-0 hover:opacity-100">
                                                <Plus className="h-3 w-3 mr-1" /> {t("Add")}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Add Event Dialog */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t("Add Event")}</DialogTitle>
                            <DialogDescription>
                                {t("Schedule Event")} {selectedDate && format(selectedDate, "MMMM d", { locale: dateLocale })}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">{t("Activity Title")}</Label>
                                <Input
                                    id="title"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    placeholder="e.g., Python Data Structures"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">{t("Type")}</Label>
                                <Select
                                    value={newEvent.type}
                                    onValueChange={(val: any) => setNewEvent({ ...newEvent, type: val })}
                                >
                                    <SelectTrigger>
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
                                <Label htmlFor="time">{t("Time")}</Label>
                                <Input
                                    id="time"
                                    type="time"
                                    value={newEvent.time}
                                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddEvent}>{t("Schedule Event")}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </PageContainer>
        </>
    )
}

function EventCard({ event }: { event: CalendarEvent }) {
    const getIcon = (type: any) => {
        switch (type) {
            case "interview": return <MessageSquare className="h-3 w-3" />
            case "quiz": return <Brain className="h-3 w-3" />
            default: return <Clock className="h-3 w-3" />
        }
    }

    const getColor = (type: any) => {
        switch (type) {
            case "interview": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            case "quiz": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
            default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
        }
    }

    return (
        <div className={`p-2 rounded text-xs border ${getColor(event.type)}`}>
            <div className="flex items-center gap-1 font-semibold mb-0.5">
                {getIcon(event.type)}
                <span className="truncate">{format(new Date(event.date), "HH:mm")}</span>
            </div>
            <div className="truncate font-medium">{event.title}</div>
        </div>
    )
}

function HistoryItem({ week, stats }: { week: string, stats: { quiz: number, interview: number, practice: string } }) {
    return (
        <div className="border rounded-md p-3 text-sm">
            <div className="font-semibold mb-2">{week}</div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                <div className="flex flex-col items-center gap-1">
                    <Brain className="h-3 w-3" />
                    <span>{stats.quiz} Quizzes</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{stats.interview} Intrv.</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{stats.practice}</span>
                </div>
            </div>
        </div>
    )
}
