'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  ChevronLeft, 
  ChevronRight, 
  Today, 
  Plus,
  Calendar,
  Clock,
  Zap,
  Coffee,
  Sun,
  Moon,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CalendarEvent, EnergyForecast } from '@/types'
import { formatTime, formatDate, formatDateShort } from '@/lib/utils'

interface CalendarViewProps {
  events: CalendarEvent[]
  energyForecast: EnergyForecast[]
  view: 'day' | 'week' | 'agenda'
  onViewChange: (view: 'day' | 'week' | 'agenda') => void
  onEventClick: (event: CalendarEvent) => void
  onDateChange: (date: Date) => void
  selectedDate: Date
  onCreateEvent: (date: Date) => void
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6) // 6am - 11pm

export function CalendarView({
  events,
  energyForecast,
  view,
  onViewChange,
  onEventClick,
  onDateChange,
  selectedDate,
  onCreateEvent,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(selectedDate)

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (view === 'day') newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    if (view === 'week') newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentDate(newDate)
    onDateChange(newDate)
  }

  const dayEvents = React.useMemo(() => {
    return events.filter(e => 
      e.start.toDateString() === currentDate.toDateString()
    ).sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [events, currentDate])

  const weekEvents = React.useMemo(() => {
    const weekStart = new Date(currentDate)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    
    return events.filter(e => 
      e.start >= weekStart && e.start <= weekEnd
    )
  }, [events, currentDate])

  const getEventTop = (date: Date) => {
    const hour = date.getHours() + date.getMinutes() / 60
    return ((hour - 6) / 18) * 100
  }

  const getEventHeight = (start: Date, end: Date) => {
    const startHour = start.getHours() + start.getMinutes() / 60
    const endHour = end.getHours() + end.getMinutes() / 60
    return ((endHour - startHour) / 18) * 100
  }

  const eventColors: Record<CalendarEvent['type'], string> = {
    meeting: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
    focus: 'bg-green-500/20 border-green-500/50 text-green-400',
    break: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
    flexible: 'bg-purple-500/20 border-purple-500/50 text-purple-400',
    personal: 'bg-gray-500/20 border-gray-500/50 text-gray-400',
  }

  const eventIcons: Record<CalendarEvent['type'], React.ReactNode> = {
    meeting: <Calendar className="h-3 w-3" aria-hidden="true" />,
    focus: <Zap className="h-3 w-3" aria-hidden="true" />,
    break: <Coffee className="h-3 w-3" aria-hidden="true" />,
    flexible: <Sun className="h-3 w-3" aria-hidden="true" />,
    personal: <Moon className="h-3 w-3" aria-hidden="true" />,
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateDate('prev')} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={() => { setCurrentDate(new Date()); onDateChange(new Date()); }}>
            {view === 'day' ? formatDate(currentDate) : view === 'week' ? `Week of ${formatDateShort(currentDate)}` : 'Agenda View'}
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateDate('next')} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {(['day', 'week', 'agenda'] as const).map(v => (
            <Button
              key={v}
              variant={view === v ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange(v)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onCreateEvent(currentDate)}>
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {view === 'day' && (
          <DayView
            date={currentDate}
            events={dayEvents}
            energyForecast={energyForecast}
            onEventClick={onEventClick}
            getEventTop={getEventTop}
            getEventHeight={getEventHeight}
            eventColors={eventColors}
            eventIcons={eventIcons}
          />
        )}

        {view === 'week' && (
          <WeekView
            date={currentDate}
            events={weekEvents}
            onEventClick={onEventClick}
            eventColors={eventColors}
            eventIcons={eventIcons}
          />
        )}

        {view === 'agenda' && (
          <AgendaView
            events={events}
            onEventClick={onEventClick}
            eventColors={eventColors}
            eventIcons={eventIcons}
          />
        )}
      </div>
    </div>
  )
}

function DayView({ 
  date, 
  events, 
  energyForecast, 
  onEventClick, 
  getEventTop, 
  getEventHeight,
  eventColors,
  eventIcons,
}: {
  date: Date
  events: CalendarEvent[]
  energyForecast: EnergyForecast[]
  onEventClick: (event: CalendarEvent) => void
  getEventTop: (date: Date) => number
  getEventHeight: (start: Date, end: Date) => number
  eventColors: Record<CalendarEvent['type'], string>
  eventIcons: Record<CalendarEvent['type'], React.ReactNode>
}) {
  return (
    <div className="relative h-full">
      <div className="absolute inset-0 grid grid-cols-[60px_1fr]">
        <div className="border-r border-border/50">
          {HOURS.map(hour => (
            <div key={hour} className="relative h-[calc(100%/18)] border-b border-border/30 px-2 py-1 text-right text-xs text-muted-foreground">
              {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
            </div>
          ))}
        </div>
        <div className="relative overflow-y-auto h-full">
          <div className="absolute inset-0">
            {HOURS.map(hour => (
              <div key={hour} className="h-[calc(100%/18)] border-b border-border/30" />
            ))}
          </div>

          {energyForecast.map(forecast => {
            if (forecast.hour < 6 || forecast.hour > 23) return null
            const top = ((forecast.hour - 6) / 18) * 100
            const color = forecast.level === 'high' ? 'bg-green-400/10' : forecast.level === 'balanced' ? 'bg-cyan-400/10' : 'bg-amber-400/10'
            return (
              <div
                key={forecast.hour}
                className={cn('absolute left-0 right-0 h-[calc(100%/18)]', color)}
                style={{ top: `${top}%` }}
              />
            )
          })}

          {events.map(event => (
            <motion.button
              key={event.id}
              onClick={() => onEventClick(event)}
              className={cn(
                'absolute left-4 right-4 rounded-lg border px-3 py-2 text-sm font-medium transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                eventColors[event.type]
              )}
              style={{
                top: `${getEventTop(event.start)}%`,
                height: `${Math.max(getEventHeight(event.start, event.end), 3)}%`,
                zIndex: 10,
              }}
              aria-label={`${event.title}, ${formatTime(event.start)} to ${formatTime(event.end)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {eventIcons[event.type]}
                  <span className="truncate">{event.title}</span>
                </div>
                <span className="text-xs font-mono opacity-70">
                  {formatTime(event.start)}–{formatTime(event.end)}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

function WeekView({ 
  date, 
  events, 
  onEventClick, 
  eventColors,
  eventIcons,
}: {
  date: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  eventColors: Record<CalendarEvent['type'], string>
  eventIcons: Record<CalendarEvent['type'], React.ReactNode>
}) {
  const weekStart = React.useMemo(() => {
    const d = new Date(date)
    d.setDate(d.getDate() - d.getDay())
    return d
  }, [date])

  const days = React.useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [weekStart])

  return (
    <div className="h-full overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse">
        <thead>
          <tr className="border-b border-border/50">
            <th className="w-20 p-2 text-xs text-muted-foreground">Time</th>
            {days.map(day => (
              <th key={day.toISOString()} className="p-2 text-center border-l border-border/30">
                <div className="text-xs text-muted-foreground">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className={cn('font-heading font-semibold', day.toDateString() === new Date().toDateString() && 'text-primary')}>
                  {day.getDate()}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map(hour => (
            <tr key={hour} className="border-b border-border/30">
              <td className="w-20 p-1 text-right text-xs text-muted-foreground pr-2">
                {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </td>
              {days.map(day => {
                const dayEvents = events.filter(e => e.start.toDateString() === day.toDateString())
                const hourEvents = dayEvents.filter(e => {
                  const startHour = e.start.getHours() + e.start.getMinutes() / 60
                  const endHour = e.end.getHours() + e.end.getMinutes() / 60
                  return hour >= startHour && hour < endHour
                })
                return (
                  <td key={day.toISOString()} className="relative p-1 border-l border-border/30 min-h-[60px]">
                    {hourEvents.map(event => (
                      <button
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick(event) }}
                        className={cn(
                          'absolute left-1 right-1 rounded border px-1.5 py-1 text-[10px] font-medium truncate transition-all hover:shadow',
                          eventColors[event.type]
                        )}
                        style={{
                          top: `${((event.start.getMinutes() / 60) * 100)}%`,
                          height: `${((event.end.getHours() + event.end.getMinutes() / 60 - event.start.getHours() - event.start.getMinutes() / 60) * 100)}%`,
                        }}
                      >
                        <span className="flex items-center gap-1">
                          {eventIcons[event.type]}
                          {event.title}
                        </span>
                      </button>
                    ))}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AgendaView({ 
  events, 
  onEventClick, 
  eventColors,
  eventIcons,
}: {
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  eventColors: Record<CalendarEvent['type'], string>
  eventIcons: Record<CalendarEvent['type'], React.ReactNode>
}) {
  const sortedEvents = React.useMemo(() => 
    [...events].sort((a, b) => a.start.getTime() - b.start.getTime()), [events])

  const groupedEvents = React.useMemo(() => {
    const groups: Record<string, CalendarEvent[]> = {}
    sortedEvents.forEach(event => {
      const key = event.start.toDateString()
      if (!groups[key]) groups[key] = []
      groups[key].push(event)
    })
    return groups
  }, [sortedEvents])

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {Object.entries(groupedEvents).map(([dateStr, dayEvents]) => (
          <motion.div
            key={dateStr}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <span className="font-heading text-lg font-semibold">{new Date(dateStr).getDate()}</span>
              </div>
              <div>
                <p className="font-medium">{new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long' })}</p>
                <p className="text-sm text-muted-foreground">{dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="ml-14 space-y-2 border-l border-border/30 pl-4">
              {dayEvents.map(event => (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all hover:bg-accent/50',
                    eventColors[event.type]
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background/50">
                    {eventIcons[event.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(event.start)} – {formatTime(event.end)}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {formatTime(event.start)}–{formatTime(event.end)}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        ))}
        {Object.keys(groupedEvents).length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-30" aria-hidden="true" />
            <p>No upcoming events</p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}