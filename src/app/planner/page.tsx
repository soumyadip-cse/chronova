'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { Layout } from '@/components/layout/Layout';
import { AIPlanner } from '@/components/planner/AIPlanner';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import {
  fetchTasks,
  fetchCalendarWithBlocks,
  scheduleBlocksAsEvents,
  TasksApiError,
} from '@/lib/tasks-client';
import type { Task, CalendarEvent } from '@/types';

function initialsFor(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function PlannerPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const loadPlannerData = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      // A week-wide window gives the chat planner the same event context the
      // scheduler engine sees when it avoids conflicts.
      const windowStart = new Date();
      windowStart.setHours(0, 0, 0, 0);
      const windowEnd = new Date(windowStart);
      windowEnd.setDate(windowEnd.getDate() + 7);

      const [{ events: realEvents, blocks }, realTasks] = await Promise.all([
        fetchCalendarWithBlocks(windowStart, windowEnd),
        fetchTasks(),
      ]);

      setTasks(realTasks);
      setEvents([...realEvents, ...scheduleBlocksAsEvents(blocks)]);
    } catch (error) {
      setLoadError(
        error instanceof TasksApiError ? error.message : 'Unable to load your planner data.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPlannerData();
  }, [loadPlannerData]);

  const sessionUser = session?.user as { name?: string | null; email?: string | null } | undefined;
  const displayName = sessionUser?.name || sessionUser?.email?.split('@')[0] || 'You';

  return (
    <Layout user={{ name: displayName, initials: initialsFor(displayName) }}>
      {isLoading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading planner">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-[520px] w-full rounded-xl" />
        </div>
      ) : loadError ? (
        <Card className="glass border-destructive/30">
          <CardContent className="pt-6 pb-6 text-center space-y-3">
            <AlertTriangle className="h-10 w-10 mx-auto text-destructive" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <Button variant="outline" size="sm" onClick={loadPlannerData}>
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <AIPlanner
          tasks={tasks}
          events={events}
          energyForecast={[]}
          onScheduleApplied={loadPlannerData}
        />
      )}
    </Layout>
  );
}
