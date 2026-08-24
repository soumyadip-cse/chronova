'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Zap,
  Target,
  Brain,
  Clock,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useFocus } from '@/components/providers/focus-provider';
import { cn } from '@/lib/utils';
import { fetchTasks, updateTask, TasksApiError } from '@/lib/tasks-client';
import type { Task } from '@/types';

export default function DashboardPage() {
  const { data: session } = useSession();
  const { openFocusMode } = useFocus();
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [view, setView] = React.useState<'orbit' | 'list'>('orbit');

  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [completingIds, setCompletingIds] = React.useState<string[]>([]);

  const loadTasks = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setTasks(await fetchTasks());
    } catch (error) {
      setLoadError(error instanceof TasksApiError ? error.message : 'Unable to load your tasks.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const openTasks = tasks.filter((t) => t.status !== 'completed');
  const topTask = openTasks[0] ?? null;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const highPriorityCount = tasks.filter(
    (t) => t.priority === 'high' || t.priority === 'critical'
  ).length;
  const totalMinutes = tasks.reduce((sum, t) => sum + t.estimatedEffort, 0);
  const plannedLabel = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;

  // Real deadlines only — tasks without due dates are never fabricated onto the timeline.
  const upcomingDeadlines = openTasks
    .filter((t) => t.dueDate instanceof Date && !Number.isNaN(t.dueDate.getTime()))
    .sort((a, b) => (a.dueDate as Date).getTime() - (b.dueDate as Date).getTime())
    .slice(0, 10);

  function formatDeadline(d: Date): string {
    const local = new Date(d.getTime());
    const now = new Date();
    const sameDay = local.toDateString() === now.toDateString();
    if (sameDay) {
      return `Today ${local.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return local.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const focusTimePlanned = totalMinutes;
  const focusTimeCompleted = Math.round((completedCount / (tasks.length || 1)) * 100);

  async function handleComplete(task: Task) {
    setCompletingIds((prev) => [...prev, task.id]);
    try {
      const saved = await updateTask(task.id, { status: 'completed' });
      setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
    } catch {
      // Leave the row unchanged on failure; inbox surfaces detailed errors.
      await loadTasks();
    } finally {
      setCompletingIds((prev) => prev.filter((id) => id !== task.id));
    }
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">
            Good morning, {(session?.user as any)?.name?.split(' ')[0] || 'Alex'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Target className="h-4 w-4" />
            Rebalance Day
          </Button>
          <Button
            className="gap-2"
            disabled={!topTask}
            onClick={() =>
              topTask &&
              openFocusMode({
                id: topTask.id,
                title: topTask.title,
                estimatedMinutes: topTask.estimatedEffort,
              })
            }
          >
            <Zap className="h-4 w-4" />
            Start Focus
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {view === 'orbit' ? (
            <Card className="glass">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Focus Orbit
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setView('list')}>
                    List View
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <div className="space-y-3 p-4" aria-busy="true">
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                  </div>
                ) : loadError ? (
                  <div className="p-8 text-center space-y-3">
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
                ) : openTasks.length === 0 ? (
                  <div className="glass rounded-xl p-8 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-400/50 mb-4" />
                    <h3 className="font-heading text-lg font-semibold mb-2">All clear!</h3>
                    <p className="text-muted-foreground text-sm">
                      No open tasks. Add tasks from your Inbox.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3" role="list" aria-label="Open tasks">
                    {openTasks.map((task) => (
                      <div
                        key={task.id}
                        role="listitem"
                        className="glass rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition-colors"
                      >
                        <Badge
                          variant="outline"
                          className={cn(
                            'shrink-0',
                            task.priority === 'critical' &&
                              'bg-red-500/10 text-red-400 border-red-500/20',
                            task.priority === 'high' &&
                              'bg-orange-500/10 text-orange-400 border-orange-500/20',
                            task.priority === 'medium' &&
                              'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          )}
                        >
                          {task.priority}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{task.title}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="capitalize">{task.status}</span>
                            <span>{task.estimatedEffort}m</span>
                            <span>Score {task.aiPriorityScore}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={completingIds.includes(task.id)}
                          onClick={() => handleComplete(task)}
                          aria-label={`Mark ${task.title} complete`}
                        >
                          {completingIds.includes(task.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                              Done
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {view === 'orbit' && (
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setView('list')}>
                      List View
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="glass">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Today&apos;s Focus
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setView('orbit')}>
                  Orbit View
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3" role="list" aria-label="Open tasks">
                  {openTasks.map((task) => (
                    <div
                      key={task.id}
                      role="listitem"
                      className="glass rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition-colors"
                    >
                      <Badge
                        variant="outline"
                        className={cn(
                          'shrink-0',
                          task.priority === 'critical' &&
                            'bg-red-500/10 text-red-400 border-red-500/20',
                          task.priority === 'high' &&
                            'bg-orange-500/10 text-orange-400 border-orange-500/20',
                          task.priority === 'medium' &&
                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        )}
                      >
                        {task.priority}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="capitalize">{task.status}</span>
                          <span>{task.estimatedEffort}m</span>
                          <span>Score {task.aiPriorityScore}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={completingIds.includes(task.id)}
                        onClick={() => handleComplete(task)}
                        aria-label={`Mark ${task.title} complete`}
                      >
                        {completingIds.includes(task.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                            Done
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Today&apos;s Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
                <p className="text-muted-foreground">
                  You have <strong>{openTasks.length} open tasks</strong> (
                  <strong>{highPriorityCount} high priority</strong>) totaling{' '}
                  <strong>{plannedLabel}</strong> of work.
                  {topTask && (
                    <>
                      {' '}
                      Start with <strong>&ldquo;{topTask.title}&rdquo;</strong>.
                    </>
                  )}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="font-heading text-2xl font-bold text-primary">{tasks.length}</div>
                  <div className="text-xs text-muted-foreground">Total Tasks</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="font-heading text-2xl font-bold text-green-400">
                    {focusTimeCompleted}%
                  </div>
                  <div className="text-xs text-muted-foreground">Progress</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="font-heading text-2xl font-bold text-amber-400">
                    {completedCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="space-y-2 py-2" aria-busy="true">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : upcomingDeadlines.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No upcoming deadlines. Tasks with due dates will appear here.
                </div>
              ) : (
                <div
                  className="space-y-2 max-h-96 overflow-y-auto"
                  role="list"
                  aria-label="Upcoming deadlines"
                >
                  {upcomingDeadlines.map((task) => {
                    const overdue =
                      task.dueDate && task.dueDate < new Date() && task.status !== 'completed';
                    return (
                      <div
                        key={task.id}
                        role="listitem"
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors group"
                      >
                        <div className="w-24 text-xs font-mono text-muted-foreground shrink-0">
                          {formatDeadline(task.dueDate as Date)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={cn(
                                'text-xs px-2 py-0.5 rounded-full capitalize',
                                task.priority === 'critical' && 'bg-red-500/10 text-red-400',
                                task.priority === 'high' && 'bg-orange-500/10 text-orange-400',
                                task.priority === 'medium' && 'bg-blue-500/10 text-blue-400',
                                task.priority === 'low' && 'bg-muted text-muted-foreground'
                              )}
                            >
                              {task.priority}
                            </span>
                            {overdue && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                                Overdue
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`Start focus on ${task.title}`}
                          onClick={() =>
                            openFocusMode({
                              id: task.id,
                              title: task.title,
                              estimatedMinutes: task.estimatedEffort,
                            })
                          }
                        >
                          <Zap className="h-3 w-3" aria-hidden="true" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="font-heading text-xl font-bold text-primary">
                    {focusTimePlanned}
                  </div>
                  <div className="text-xs text-muted-foreground">Min Planned</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="font-heading text-xl font-bold text-green-400">
                    {focusTimeCompleted}
                  </div>
                  <div className="text-xs text-muted-foreground">Min Completed</div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Peak energy: 9-11 AM</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Schedule deep work now for best results
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
