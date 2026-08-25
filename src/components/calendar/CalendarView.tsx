'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  LayoutGrid,
  List,
  Plus,
  RotateCcw,
  AlertTriangle,
  Zap,
  Coffee,
  Moon,
  Sun,
  Target,
  CalendarCheck,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { CalendarEvent, CalendarView, EnergyForecast } from '@/types';
import { formatTime, formatDate, formatDateShort } from '@/lib/utils';

interface CalendarViewProps {
  events: CalendarEvent[];
  energyForecast: EnergyForecast[];
  view: CalendarView;
  onViewChange: (view: string) => void;
  onDateChange: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onCreateEvent: (date: Date) => void;
  selectedDate: Date;
  reducedMotion?: boolean;
}

const EVENT_TYPE_CONFIG = {
  meeting: { label: 'Meeting', icon: Target, color: 'bg-blue-500' },
  focus: { label: 'Focus', icon: Zap, color: 'bg-green-500' },
  break: { label: 'Break', icon: Coffee, color: 'bg-amber-500' },
  flexible: { label: 'Flexible', icon: Moon, color: 'bg-purple-500' },
  personal: { label: 'Personal', icon: Sun, color: 'bg-pink-500' },
  schedule: { label: 'Scheduled', icon: CalendarCheck, color: 'bg-indigo-500' },
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function TimeGrid({
  events,
  energyForecast,
  date,
  onEventClick,
  reducedMotion,
}: {
  events: CalendarEvent[];
  energyForecast: EnergyForecast[];
  date: Date;
  onEventClick: (event: CalendarEvent) => void;
  reducedMotion?: boolean;
}) {
  const dayEvents = events
    .filter((e) => e.start.toDateString() === date.toDateString())
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const getEnergyForHour = (hour: number) => {
    return energyForecast.find((f) => f.hour === hour)?.level || 'low';
  };

  return (
    <div className="relative">
      {/* Time column */}
      <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col">
        {HOURS.map((hour) => (
          <div key={hour} className="flex-1 border-b border-border/30 relative">
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
              {hour.toString().padStart(2, '0')}:00
            </span>
            <div
              className="absolute right-0 top-0 bottom-0 w-2"
              style={{
                background:
                  getEnergyForHour(hour) === 'high'
                    ? 'hsl(var(--primary)/0.1)'
                    : getEnergyForHour(hour) === 'balanced'
                      ? 'hsl(var(--accent)/0.1)'
                      : 'transparent',
              }}
            />
          </div>
        ))}
      </div>

      {/* Events grid */}
      <div className="ml-16 relative h-full">
        {HOURS.map((hour) => (
          <div key={hour} className="relative border-b border-border/30 min-h-[60px]">
            {dayEvents
              .filter((e) => e.start.getHours() <= hour && e.end.getHours() > hour)
              .map((event, index) => {
                const startHour = event.start.getHours() + event.start.getMinutes() / 60;
                const endHour = event.end.getHours() + event.end.getMinutes() / 60;
                const top = (((startHour - hour) * 60) / (endHour - startHour)) * 60;
                const height = (endHour - startHour) * 60;

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => onEventClick(event)}
                    className="absolute left-2 right-2 cursor-pointer rounded-lg transition-all hover:shadow-lg hover:z-10"
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      backgroundColor: event.color,
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onEventClick(event)}
                    aria-label={`${event.title}, ${formatTime(event.start)} to ${formatTime(event.end)}`}
                  >
                    <div className="p-2 text-white text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{event.title}</span>
                        {((EventIcon) => <EventIcon className="h-3 w-3 opacity-80" />)(
                          EVENT_TYPE_CONFIG[event.type].icon
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="opacity-90">
                          {formatTime(event.start)}–{formatTime(event.end)}
                        </span>
                        <span className="flex items-center gap-1">
                          {(event.isLocked || event.isCompleted) && (
                            <>
                              {event.isCompleted && (
                                <CheckCircle2
                                  className="h-3 w-3 opacity-90"
                                  aria-label="completed"
                                />
                              )}
                              {event.isLocked && (
                                <Lock className="h-3 w-3 opacity-90" aria-label="locked" />
                              )}
                            </>
                          )}
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                            {EVENT_TYPE_CONFIG[event.type].label}
                          </Badge>
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        ))}

        {/* Current time indicator */}
        {date.toDateString() === new Date().toDateString() && (
          <motion.div
            className="absolute left-0 right-0 h-0.5 bg-destructive shadow-[0_0_8px_hsl(var(--destructive))]"
            style={{ top: `${(new Date().getMinutes() / 60) * 60}px` }}
            animate={{
              boxShadow: ['0 0 8px hsl(var(--destructive))', '0 0 16px hsl(var(--destructive))'],
            }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <div className="absolute left-16 -translate-y-1/2 flex items-center gap-1 bg-destructive text-destructive-foreground px-2 py-0.5 rounded text-xs font-mono">
              NOW
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function WeekView({
  events,
  energyForecast,
  date,
  onEventClick,
  onDateChange,
  reducedMotion,
}: {
  events: CalendarEvent[];
  energyForecast: EnergyForecast[];
  date: Date;
  onEventClick: (event: CalendarEvent) => void;
  onDateChange: (date: Date) => void;
  reducedMotion?: boolean;
}) {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]" role="grid">
        <thead>
          <tr>
            <th className="w-16 p-2 text-xs text-muted-foreground font-mono">Time</th>
            {days.map((day) => (
              <th key={day.toISOString()} className="p-2 text-center border-b border-border">
                <div className="font-medium">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div
                  className={cn(
                    'text-sm',
                    day.toDateString() === new Date().toDateString() && 'text-primary font-bold'
                  )}
                >
                  {day.getDate()}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((hour) => (
            <tr key={hour}>
              <td className="p-1 text-xs text-muted-foreground font-mono sticky left-0 bg-background/80 backdrop-blur">
                {hour.toString().padStart(2, '0')}:00
              </td>
              {days.map((day) => {
                const dayEvents = events.filter(
                  (e) =>
                    e.start.toDateString() === day.toDateString() &&
                    e.start.getHours() <= hour &&
                    e.end.getHours() > hour
                );
                return (
                  <td
                    key={day.toISOString()}
                    className="relative border-b border-border/30 min-h-[50px] p-1"
                  >
                    {dayEvents.map((event) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => onEventClick(event)}
                        className="absolute left-0.5 right-0.5 rounded text-white text-xs p-1 cursor-pointer hover:shadow"
                        style={{
                          top: `${(event.start.getMinutes() / 60) * 50}px`,
                          height: `${Math.max(20, ((event.end.getTime() - event.start.getTime()) / 60000 / 60) * 50)}px`,
                          backgroundColor: event.color,
                          zIndex: 10,
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && onEventClick(event)}
                      >
                        <div className="truncate font-medium">{event.title}</div>
                      </motion.div>
                    ))}
                    {day.toDateString() === new Date().toDateString() &&
                      hour === new Date().getHours() && (
                        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-destructive/50" />
                      )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AgendaView({
  events,
  date,
  onEventClick,
  onDateChange,
}: {
  events: CalendarEvent[];
  date: Date;
  onEventClick: (event: CalendarEvent) => void;
  onDateChange: (date: Date) => void;
}) {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  return (
    <div className="space-y-6">
      {days.map((day) => {
        const dayEvents = events
          .filter((e) => e.start.toDateString() === day.toDateString())
          .sort((a, b) => a.start.getTime() - b.start.getTime());

        if (dayEvents.length === 0) return null;

        return (
          <motion.div
            key={day.toISOString()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <div
                  className={cn(
                    'font-heading text-lg',
                    day.toDateString() === new Date().toDateString() && 'text-primary'
                  )}
                >
                  {day.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="text-sm text-muted-foreground">
                  {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                </div>
              </div>
              {day.toDateString() === new Date().toDateString() && (
                <Badge variant="default" className="text-xs">
                  Today
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              {dayEvents.map((event) => (
                <motion.button
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                  onClick={() => onEventClick(event)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-accent/50 transition-colors"
                  style={{ borderLeft: `3px solid ${event.color}` }}
                  role="button"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50 text-sm font-mono text-muted-foreground">
                    {formatTime(event.start)}–{formatTime(event.end)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {EVENT_TYPE_CONFIG[event.type].label}
                    </p>
                  </div>
                  {((EventIcon) => (
                    <EventIcon className="h-5 w-5" style={{ color: event.color }} />
                  ))(EVENT_TYPE_CONFIG[event.type].icon)}
                </motion.button>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function CalendarViewComponent({
  events,
  energyForecast,
  view,
  onViewChange,
  onDateChange,
  onEventClick,
  onCreateEvent,
  selectedDate,
  reducedMotion = false,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(selectedDate);

  React.useEffect(() => {
    setCurrentDate(selectedDate);
  }, [selectedDate]);

  const navigateDate = (delta: number) => {
    const newDate = new Date(currentDate);
    if (view === 'day') newDate.setDate(newDate.getDate() + delta);
    else if (view === 'week') newDate.setDate(newDate.getDate() + delta * 7);
    else newDate.setDate(newDate.getDate() + delta * 14);
    setCurrentDate(newDate);
    onDateChange(newDate);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate(-1)}
            aria-label="Previous period"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <h1 className="font-heading text-xl font-semibold">
              {view === 'day' && formatDate(currentDate)}
              {view === 'week' && `Week of ${formatDateShort(currentDate)}`}
              {view === 'agenda' && `Next 2 weeks from ${formatDateShort(currentDate)}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              {currentDate.toDateString() === new Date().toDateString() ? 'Today' : ''}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate(1)}
            aria-label="Next period"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={onViewChange} className="hidden sm:flex">
            <TabsList>
              <TabsTrigger value="day">
                <Calendar className="h-4 w-4 mr-2" /> Day
              </TabsTrigger>
              <TabsTrigger value="week">
                <LayoutGrid className="h-4 w-4 mr-2" /> Week
              </TabsTrigger>
              <TabsTrigger value="agenda">
                <List className="h-4 w-4 mr-2" /> Agenda
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={view} onValueChange={onViewChange}>
            <SelectTrigger className="sm:hidden w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="agenda">Agenda</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              setCurrentDate(new Date());
              onDateChange(new Date());
            }}
            size="sm"
          >
            <Calendar className="h-4 w-4 mr-2" /> Today
          </Button>
          <Button onClick={() => onCreateEvent(currentDate)} size="sm">
            <Plus className="h-4 w-4 mr-2" /> New Event
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Event types:</span>
        {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
          <Badge
            key={key}
            variant="outline"
            className={cn('gap-1', config.color.replace('bg-', 'text-') + '/80')}
          >
            <config.icon className="h-3 w-3" />
            {config.label}
          </Badge>
        ))}
        <div className="flex items-center gap-1 ml-4">
          <div className="w-3 h-3 rounded bg-primary/10" />
          <span>High energy</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500/10" />
          <span>Balanced</span>
        </div>
      </div>

      {/* Calendar Content */}
      <Card className="glass overflow-hidden">
        <CardContent className="p-0">
          {view === 'day' && (
            <div className="h-[calc(100vh-350px)] min-h-[500px] relative">
              <TimeGrid
                events={events}
                energyForecast={energyForecast}
                date={currentDate}
                onEventClick={onEventClick}
                reducedMotion={reducedMotion}
              />
            </div>
          )}
          {view === 'week' && (
            <div className="h-[calc(100vh-350px)] min-h-[500px] p-4">
              <WeekView
                events={events}
                energyForecast={energyForecast}
                date={currentDate}
                onEventClick={onEventClick}
                onDateChange={onDateChange}
                reducedMotion={reducedMotion}
              />
            </div>
          )}
          {view === 'agenda' && (
            <ScrollArea className="h-[calc(100vh-350px)] min-h-[500px] p-4">
              <AgendaView
                events={events}
                date={currentDate}
                onEventClick={onEventClick}
                onDateChange={onDateChange}
              />
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Recovery Plan Banner */}
      {events.some(
        (e) =>
          e.type === 'meeting' && e.start > new Date() && e.start < new Date(Date.now() + 3600000)
      ) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4 border border-amber-500/30 bg-amber-500/5"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-amber-400">Schedule Conflict Detected</h4>
              <p className="text-sm text-muted-foreground mt-1">
                You have overlapping meetings in the next hour. Would you like me to generate a
                recovery plan?
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                <RotateCcw className="h-4 w-4 mr-2" />
                Generate Recovery Plan
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
