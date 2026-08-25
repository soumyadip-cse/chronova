'use client';

import * as React from 'react';
import { Layout } from '@/components/layout/Layout';
import { InsightsDashboard } from '@/components/insights/InsightsDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { fetchInsights, TasksApiError, type InsightsRange } from '@/lib/tasks-client';
import { useSession } from 'next-auth/react';
import type { InsightData } from '@/types';

function initialsFor(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function InsightsPage() {
  const { data: session } = useSession();
  const [range, setRange] = React.useState<InsightsRange>(30);
  const [insights, setInsights] = React.useState<InsightData | null>(null);
  const [hasAnyData, setHasAnyData] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const loadInsights = React.useCallback(async (days: InsightsRange) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetchInsights(days);
      setInsights(res.data);

      // Honest-empty detection: no sessions, no tasks at all.
      const hasSessions = res.data.productiveHours.some((h) => h.productivity > 0);
      setHasAnyData(
        hasSessions ||
          res.data.workloadBalance.length > 0 ||
          res.data.plannedVsCompleted.some((d) => d.planned > 0)
      );
    } catch (error) {
      setLoadError(
        error instanceof TasksApiError ? error.message : 'Unable to load your insights.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadInsights(range);
  }, [range, loadInsights]);

  const sessionUser = session?.user as { name?: string | null; email?: string | null } | undefined;
  const displayName = sessionUser?.name || sessionUser?.email?.split('@')[0] || 'You';

  return (
    <Layout user={{ name: displayName, initials: initialsFor(displayName) }}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold">Insights</h1>
            <p className="text-muted-foreground text-sm">
              Real metrics from your focus sessions and tasks.
            </p>
          </div>
          <div className="flex gap-2" role="group" aria-label="Insights range">
            {([7, 30] as InsightsRange[]).map((d) => (
              <Button
                key={d}
                size="sm"
                variant={range === d ? 'default' : 'outline'}
                onClick={() => setRange(d)}
              >
                {d} days
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4" aria-busy="true" aria-label="Loading insights">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-[280px] w-full rounded-xl" />
            <Skeleton className="h-[280px] w-full rounded-xl" />
          </div>
        ) : loadError ? (
          <Card className="glass border-destructive/30">
            <CardContent className="pt-6 pb-6 text-center space-y-3">
              <AlertTriangle className="h-10 w-10 mx-auto text-destructive" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">{loadError}</p>
              <Button variant="outline" size="sm" onClick={() => loadInsights(range)}>
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : !hasAnyData ? (
          <Card className="glass">
            <CardContent className="pt-6 pb-6 text-center space-y-2">
              <p className="font-medium">No insight data yet</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Once you plan your day and complete focus sessions, your real productivity trends
                will appear here. Nothing is fabricated in the meantime.
              </p>
            </CardContent>
          </Card>
        ) : (
          insights && <InsightsDashboard data={insights} />
        )}
      </div>
    </Layout>
  );
}
