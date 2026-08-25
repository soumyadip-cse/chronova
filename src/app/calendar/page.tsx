'use client';

import * as React from 'react';
import { Layout } from '@/components/layout/Layout';
import { CalendarViewComponent } from '@/components/calendar/CalendarView';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import {
  fetchTasks,
  fetchCalendarWithBlocks,
  scheduleBlocksAsEvents,
  tasksAsDeadlineEvents,
  TasksApiError,
} from '@/lib/tasks-client';
import { useFocus } from '@/components/providers/focus-provider';
import type { CalendarEvent, EnergyForecast } from '@/types';

export default function CalendarPage() {
  const [view, setView] = React.useState<'day' | 'week' | 'agenda'>('day');
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const loadEvents = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      // Month window around the selected date so week/day views always have context.
      const windowStart = new Date(selectedDate);
      windowStart.setDate(windowStart.getDate() - 7);
      windowStart.setHours(0, 0, 0, 0);
      const windowEnd = new Date(selectedDate);
      windowEnd.setDate(windowEnd.getDate() + 21);
      windowEnd.setHours(23, 59, 59, 999);

      const [{ events: realEvents, blocks }, tasks] = await Promise.all([
        fetchCalendarWithBlocks(windowStart, windowEnd),
        fetchTasks(),
      ]);

      const deadlineEvents = tasksAsDeadlineEvents(tasks).filter(
        (e) => e.start >= windowStart && e.start <= windowEnd
      );

      // Persisted scheduler blocks render alongside real events so an applied
      // plan is visible without leaving the calendar.
      const blockEvents = scheduleBlocksAsEvents(blocks).filter(
        (e) => e.start >= windowStart && e.start <= windowEnd
      );

      setEvents([...realEvents, ...deadlineEvents, ...blockEvents]);
    } catch (error) {
      setLoadError(
        error instanceof TasksApiError ? error.message : 'Unable to load your calendar.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  React.useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Energy forecast requires real usage data that does not exist yet — render
  // an honest empty forecast rather than fabricated values.
  const energyForecast: EnergyForecast[] = [];

  const { openFocusMode } = useFocus();

  const handleEventClick = (event: CalendarEvent) => {
    // Persisted scheduler blocks start Focus Mode with their block attached so
    // completion flows through the real telemetry pipeline.
    if (event.type === 'schedule' && event.scheduleBlockId && event.taskId && !event.isCompleted) {
      openFocusMode(
        {
          id: event.taskId,
          title: event.title,
          estimatedMinutes: Math.max(
            1,
            Math.round((event.end.getTime() - event.start.getTime()) / 60000)
          ),
        },
        { scheduleBlockId: event.scheduleBlockId }
      );
      return;
    }
    if (event.taskId) {
      console.log('Open task:', event.taskId);
    }
  };

  return (
    <Layout>
      {isLoading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading calendar">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-[520px] w-full rounded-xl" />
        </div>
      ) : loadError ? (
        <Card className="glass border-destructive/30">
          <CardContent className="pt-6 pb-6 text-center space-y-3">
            <AlertTriangle className="h-10 w-10 mx-auto text-destructive" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <Button variant="outline" size="sm" onClick={loadEvents}>
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <CalendarViewComponent
          events={events}
          energyForecast={energyForecast}
          view={view}
          onViewChange={(v: string) => setView(v as 'day' | 'week' | 'agenda')}
          onDateChange={setSelectedDate}
          onEventClick={handleEventClick}
          onCreateEvent={() => {}}
          selectedDate={selectedDate}
        />
      )}
    </Layout>
  );
}
