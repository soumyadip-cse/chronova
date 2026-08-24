'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Play, Clock, CheckCircle, AlertTriangle, RefreshCw, Brain } from 'lucide-react';
import { useFocus } from '@/components/providers/focus-provider';
import { fetchTasks, TasksApiError } from '@/lib/tasks-client';
import type { Task } from '@/types';

export default function FocusPage() {
  const { openFocusMode } = useFocus();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const loadTasks = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const all = await fetchTasks();
      // Focus queue = open tasks only, highest priority first (API pre-sorts).
      setTasks(all.filter((t) => t.status !== 'completed'));
    } catch (error) {
      setLoadError(
        error instanceof TasksApiError ? error.message : 'Unable to load your focus queue.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleStartFocus = (task: { id: string; title: string; estimatedMinutes: number }) => {
    openFocusMode(task);
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Focus Mode</h1>
          <p className="text-muted-foreground mt-1">Distraction-free deep work sessions</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Clock className="h-4 w-4" aria-hidden="true" />
          Timer Only
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
                Today&apos;s Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {isLoading ? (
                <div className="space-y-3" aria-busy="true" aria-label="Loading tasks">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : loadError ? (
                <div className="py-8 text-center space-y-3">
                  <AlertTriangle
                    className="h-10 w-10 mx-auto text-destructive"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-muted-foreground">{loadError}</p>
                  <Button variant="outline" size="sm" onClick={loadTasks}>
                    <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                    Retry
                  </Button>
                </div>
              ) : tasks.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle
                    className="h-12 w-12 mx-auto text-green-400/50 mb-3"
                    aria-hidden="true"
                  />
                  <p className="font-medium mb-1">Nothing to focus on</p>
                  <p className="text-sm text-muted-foreground">
                    Add tasks in your Inbox to build a focus queue.
                  </p>
                </div>
              ) : (
                tasks.map((task) => (
                  <Button
                    key={task.id}
                    variant="outline"
                    className="w-full justify-between gap-4 p-4 text-left hover:bg-accent/50 transition-colors"
                    onClick={() =>
                      handleStartFocus({
                        id: task.id,
                        title: task.title,
                        estimatedMinutes: task.estimatedEffort,
                      })
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {task.estimatedEffort} min
                        </span>
                        <span className="flex items-center gap-1 capitalize">
                          <Zap className="h-3 w-3" aria-hidden="true" />
                          {task.energyRequired}
                        </span>
                        <span className="flex items-center gap-1">
                          <Brain className="h-3 w-3" aria-hidden="true" />
                          AI: {task.aiPriorityScore}%
                        </span>
                      </div>
                    </div>
                    <Zap className="h-5 w-5 text-primary opacity-50" aria-hidden="true" />
                  </Button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" aria-hidden="true" />
                Quick Start
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {[
                { label: '25 min', minutes: 25, name: 'Pomodoro' },
                { label: '50 min', minutes: 50, name: 'Deep Work' },
                { label: '90 min', minutes: 90, name: 'Flow State' },
              ].map(({ label, minutes, name }) => (
                <Button
                  key={minutes}
                  variant="outline"
                  className="w-full justify-between py-3"
                  onClick={() =>
                    handleStartFocus({
                      id: `timer-${minutes}`,
                      title: name,
                      estimatedMinutes: minutes,
                    })
                  }
                >
                  <span>{name}</span>
                  <span className="text-sm text-muted-foreground">{label}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
                Session Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="font-heading text-2xl font-bold text-primary">0</div>
                  <div className="text-xs text-muted-foreground">Sessions</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="font-heading text-2xl font-bold text-green-400">0m</div>
                  <div className="text-xs text-muted-foreground">Focus Time</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="font-heading text-2xl font-bold text-amber-400">0</div>
                  <div className="text-xs text-muted-foreground">Streak</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Session tracking appears here once you complete focus sessions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
