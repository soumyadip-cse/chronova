'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Target,
  Clock,
  Zap,
  Brain,
  Plus,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FocusOrbit } from './FocusOrbit';
import { Task, CalendarEvent, EnergyForecast } from '@/types';
import { formatTime, getGreeting } from '@/lib/utils';

interface TodayDashboardProps {
  tasks: Task[];
  events: CalendarEvent[];
  energyForecast: EnergyForecast[];
  focusTimePlanned: number;
  focusTimeCompleted: number;
  energyLevel: 'low' | 'balanced' | 'high';
  onEnergyChange: (level: 'low' | 'balanced' | 'high') => void;
  onQuickAdd: (input: string) => void;
  onRebalance: () => void;
  onTaskClick: (task: Task) => void;
  onEventClick: (event: CalendarEvent) => void;
  reducedMotion?: boolean;
  isRebalancing?: boolean;
}

const focusWindows = [
  {
    start: new Date(new Date().setHours(9, 0, 0, 0)),
    end: new Date(new Date().setHours(11, 30, 0, 0)),
    type: 'deep' as const,
  },
  {
    start: new Date(new Date().setHours(14, 0, 0, 0)),
    end: new Date(new Date().setHours(16, 0, 0, 0)),
    type: 'shallow' as const,
  },
];

export function TodayDashboard({
  tasks,
  events,
  energyForecast,
  focusTimePlanned,
  focusTimeCompleted,
  energyLevel,
  onEnergyChange,
  onQuickAdd,
  onRebalance,
  onTaskClick,
  onEventClick,
  reducedMotion = false,
  isRebalancing = false,
}: TodayDashboardProps) {
  const [quickAddInput, setQuickAddInput] = React.useState('');
  const todayTasks = tasks.filter((t) => t.status === 'today');
  const completedToday = tasks.filter(
    (t) =>
      t.status === 'completed' &&
      t.completedAt &&
      t.completedAt.toDateString() === new Date().toDateString()
  );
  const progress = focusTimePlanned > 0 ? (focusTimeCompleted / focusTimePlanned) * 100 : 0;

  const currentTask =
    todayTasks.find(
      (t) =>
        t.scheduledAt &&
        t.scheduledAt <= new Date() &&
        (!t.completedAt || t.completedAt > new Date())
    ) || todayTasks[0];

  const upcomingEvents = events
    .filter((e) => e.start > new Date())
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 5);

  const aiSummary = React.useMemo(() => {
    const highPriority = todayTasks.filter(
      (t) => t.priority === 'high' || t.priority === 'critical'
    ).length;
    const totalEffort = todayTasks.reduce((sum, t) => sum + t.estimatedEffort, 0);
    const meetings = events.filter((e) => e.type === 'meeting').length;

    return `You have ${todayTasks.length} tasks scheduled (${highPriority} high priority) totaling ${Math.round(totalEffort / 60)}h ${totalEffort % 60}m of work. ${meetings} meetings on calendar. Your peak energy window is 9-11am — protect this time for "${currentTask?.title || 'deep work'}".`;
  }, [todayTasks, events, currentTask]);

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickAddInput.trim()) {
      onQuickAdd(quickAddInput.trim());
      setQuickAddInput('');
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              {getGreeting()}, Alex
            </h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onRebalance} disabled={isRebalancing}>
              <Zap className="h-4 w-4 mr-2" aria-hidden="true" />
              {isRebalancing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rebalance Day'}
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" aria-hidden="true" />
                Today's Focus
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {currentTask ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Zap className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-lg font-semibold truncate">
                        {currentTask.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentTask.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.round(currentTask.estimatedEffort / 60)}h{' '}
                          {currentTask.estimatedEffort % 60}m
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {currentTask.energyRequired}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          AI: {currentTask.aiPriorityScore}%
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onTaskClick(currentTask)}>
                      Open
                    </Button>
                  </div>

                  <div className="rounded-lg bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">{aiSummary}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
                  <p>No focus task scheduled. Add a task to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
                Focus Orbit
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex justify-center">
                <FocusOrbit
                  currentTask={currentTask}
                  upcomingEvents={upcomingEvents}
                  energyForecast={energyForecast}
                  focusWindows={focusWindows}
                  onTaskClick={onTaskClick}
                  onEventClick={onEventClick}
                  size={300}
                  reducedMotion={reducedMotion}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <Brain className="h-5 w-5 text-primary" aria-hidden="true" />
                AI Daily Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 text-sm">
                <div className="rounded-lg bg-primary/5 p-3 border border-primary/10">
                  <p className="text-muted-foreground">{aiSummary}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="font-heading text-2xl font-bold text-primary">
                      {todayTasks.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Tasks Today</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="font-heading text-2xl font-bold text-green-400">
                      {Math.round(progress)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Focus Progress</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="font-heading text-2xl font-bold text-amber-400">
                      {completedToday.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
                Smart Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {events
                    .sort((a, b) => a.start.getTime() - b.start.getTime())
                    .map((event) => (
                      <button
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className={cn(
                          'w-full flex items-center gap-3 rounded-lg p-3 text-left transition-all hover:bg-accent/50',
                          event.type === 'meeting' && 'border-l-2 border-l-blue-500',
                          event.type === 'focus' && 'border-l-2 border-l-green-500',
                          event.type === 'break' && 'border-l-2 border-l-amber-500',
                          event.type === 'flexible' && 'border-l-2 border-l-purple-500'
                        )}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-mono text-muted-foreground bg-muted/50">
                          {formatTime(event.start)}–{formatTime(event.end)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{event.type}</p>
                        </div>
                        {event.type === 'focus' && (
                          <Zap className="h-4 w-4 text-green-400" aria-hidden="true" />
                        )}
                      </button>
                    ))}
                  {events.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
                      <p>No events scheduled</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <Plus className="h-5 w-5 text-primary" aria-hidden="true" />
                Quick Add Task
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleQuickAddSubmit} className="space-y-3">
                <div className="relative">
                  <Input
                    placeholder='e.g. "Prepare marketing presentation by Friday, high priority, needs 2 hours"'
                    value={quickAddInput}
                    onChange={(e) => setQuickAddInput(e.target.value)}
                    className="pr-10"
                    aria-label="Quick add task with natural language"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    aria-label="Add task"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Try: "Review PR #247 by tomorrow, high priority, 45 min" or "Write blog post by
                  next week, medium, 2 hours"
                </p>
              </form>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" aria-hidden="true" />
                Recent AI Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 text-sm">
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                  <p className="font-medium text-blue-400">Moved "Code Review" to 11:45am</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Aligned with your balanced energy window (forecast: 65% at 2pm → 85% at 11:45am)
                  </p>
                </div>
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                  <p className="font-medium text-green-400">
                    Added 15min recovery break after client call
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    High-stress meetings reduce subsequent focus quality by ~23%
                  </p>
                </div>
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                  <p className="font-medium text-amber-400">
                    Deferred "Tax documents" to Friday 2pm
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Low-energy compliance task, batched with other admin work
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Card className="glass">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <CheckCircle className="h-5 w-5 text-primary" aria-hidden="true" />
              Day Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Focus time completed</span>
                <span className="font-medium">
                  {Math.round(progress)}% ({focusTimeCompleted}min / {focusTimePlanned}min)
                </span>
              </div>
              <Progress value={Math.min(progress, 100)} className="h-3" />
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <div className="font-heading text-xl font-bold text-green-400">
                    {completedToday.length}
                  </div>
                  <div className="text-muted-foreground">Completed</div>
                </div>
                <div>
                  <div className="font-heading text-xl font-bold text-blue-400">
                    {todayTasks.filter((t) => !t.completedAt).length}
                  </div>
                  <div className="text-muted-foreground">Remaining</div>
                </div>
                <div>
                  <div className="font-heading text-xl font-bold text-primary">
                    {Math.round(focusTimePlanned / 60)}h
                  </div>
                  <div className="text-muted-foreground">Planned Focus</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
