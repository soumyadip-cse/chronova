'use client';

import * as React from 'react';
import { Layout } from '@/components/layout/Layout';
import { TaskInbox } from '@/components/tasks/TaskInbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Loader2, Plus, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Task, TaskPriority, EnergyLevel } from '@/types';
import { fetchTasks, createTask, updateTask, deleteTask, TasksApiError } from '@/lib/tasks-client';

export default function InboxPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [newTitle, setNewTitle] = React.useState('');
  const [newPriority, setNewPriority] = React.useState<TaskPriority>('medium');
  const [newEnergy, setNewEnergy] = React.useState<EnergyLevel>('balanced');
  const [newMinutes, setNewMinutes] = React.useState('30');
  const [isCreating, setIsCreating] = React.useState(false);

  const [pendingTaskIds, setPendingTaskIds] = React.useState<string[]>([]);

  const loadTasks = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const loaded = await fetchTasks();
      setTasks(loaded);
    } catch (error) {
      setLoadError(
        error instanceof TasksApiError
          ? error.message
          : 'Unable to load your tasks. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const markPending = (taskId: string, pending: boolean) => {
    setPendingTaskIds((prev) => (pending ? [...prev, taskId] : prev.filter((id) => id !== taskId)));
  };

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || isCreating) return;

    const minutes = parseInt(newMinutes, 10);
    setIsCreating(true);
    try {
      const created = await createTask({
        title,
        priorityFlag: newPriority,
        energyRequired: newEnergy,
        estimatedMinutes: Number.isFinite(minutes) && minutes > 0 ? minutes : 30,
      });
      setTasks((prev) => [created, ...prev]);
      setNewTitle('');
      toast({ title: 'Task created', description: created.title });
    } catch (error) {
      toast({
        title: 'Could not create task',
        description:
          error instanceof TasksApiError ? error.message : 'Something went wrong. Try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  }

  const handleTaskUpdate = async (updated: Task) => {
    markPending(updated.id, true);
    try {
      const saved = await updateTask(updated.id, {
        title: updated.title,
        description: updated.description ?? null,
        priorityFlag: updated.priority,
        energyRequired: updated.energyRequired,
        estimatedMinutes: updated.estimatedEffort > 0 ? updated.estimatedEffort : 30,
        status: updated.status,
        deadlineUtc: updated.dueDate ? updated.dueDate.toISOString() : null,
      });
      setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
      toast({ title: 'Task updated' });
    } catch (error) {
      toast({
        title: 'Could not update task',
        description:
          error instanceof TasksApiError ? error.message : 'Something went wrong. Try again.',
        variant: 'destructive',
      });
    } finally {
      markPending(updated.id, false);
    }
  };

  const handleStatusChange = async (task: Task, status: Task['status']) => {
    if (task.status === status) return;
    markPending(task.id, true);
    // Optimistic update so the UI responds immediately.
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    try {
      const saved = await updateTask(task.id, { status });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? saved : t)));
    } catch (error) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      toast({
        title: 'Could not update task',
        description:
          error instanceof TasksApiError ? error.message : 'Something went wrong. Try again.',
        variant: 'destructive',
      });
    } finally {
      markPending(task.id, false);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    markPending(taskId, true);
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast({ title: 'Task deleted', description: target?.title });
    } catch (error) {
      toast({
        title: 'Could not delete task',
        description:
          error instanceof TasksApiError ? error.message : 'Something went wrong. Try again.',
        variant: 'destructive',
      });
    } finally {
      markPending(taskId, false);
    }
  };

  const handleBulkAction = async (action: string, taskIds: string[]) => {
    if (action === 'delete') {
      let failed = 0;
      for (const id of taskIds) {
        try {
          await deleteTask(id);
          setTasks((prev) => prev.filter((t) => t.id !== id));
        } catch {
          failed++;
        }
      }
      if (failed > 0) {
        toast({
          title: `Deleted ${taskIds.length - failed} of ${taskIds.length} tasks`,
          description: `${failed} could not be deleted. Try again.`,
          variant: 'destructive',
        });
      } else {
        toast({ title: `Deleted ${taskIds.length} tasks` });
      }
      return;
    }

    if (action === 'markComplete') {
      let failed = 0;
      for (const id of taskIds) {
        try {
          const saved = await updateTask(id, { status: 'completed' });
          setTasks((prev) => prev.map((t) => (t.id === id ? saved : t)));
        } catch {
          failed++;
        }
      }
      toast(
        failed > 0
          ? {
              title: `${failed} tasks could not be completed`,
              variant: 'destructive',
            }
          : { title: `Completed ${taskIds.length} tasks` }
      );
      return;
    }

    const status = action === 'scheduleToday' ? 'today' : 'upcoming';
    for (const id of taskIds) {
      try {
        const saved = await updateTask(id, { status });
        setTasks((prev) => prev.map((t) => (t.id === id ? saved : t)));
      } catch {
        // individual failures surface on next full load; keep silent here
      }
    }
    toast({ title: `Moved ${taskIds.length} tasks to ${status}` });
  };

  const handleTaskClick = (task: Task) => {
    // Cycle status as the lightweight inline "edit" interaction until a full
    // edit dialog exists: inbox -> today -> upcoming -> inbox.
    const next = task.status === 'inbox' ? 'today' : task.status === 'today' ? 'upcoming' : 'inbox';
    handleStatusChange(task, next);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Quick Add */}
        <Card className="glass">
          <CardContent className="pt-4">
            <form onSubmit={handleCreate} className="flex flex-col lg:flex-row gap-3 lg:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="quick-add-title">New task</Label>
                <Input
                  id="quick-add-title"
                  placeholder="e.g. Finish project proposal"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={500}
                  disabled={isCreating}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select
                    value={newPriority}
                    onValueChange={(v: string) => setNewPriority(v as TaskPriority)}
                  >
                    <SelectTrigger disabled={isCreating}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Energy</Label>
                  <Select
                    value={newEnergy}
                    onValueChange={(v: string) => setNewEnergy(v as EnergyLevel)}
                  >
                    <SelectTrigger disabled={isCreating}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Minutes</Label>
                  <Input
                    type="number"
                    min={5}
                    max={1440}
                    value={newMinutes}
                    onChange={(e) => setNewMinutes(e.target.value)}
                    disabled={isCreating}
                  />
                </div>
              </div>
              <Button type="submit" disabled={isCreating || !newTitle.trim()} className="lg:w-32">
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                    Adding…
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                    Add Task
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3" aria-busy="true" aria-label="Loading tasks">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        )}

        {/* Error state */}
        {!isLoading && loadError && (
          <Card className="glass border-destructive/30">
            <CardContent className="pt-6 pb-6 text-center space-y-3">
              <AlertTriangle className="h-10 w-10 mx-auto text-destructive" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">{loadError}</p>
              <Button variant="outline" size="sm" onClick={loadTasks}>
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Task list */}
        {!isLoading && !loadError && (
          <TaskInbox
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            onTaskClick={handleTaskClick}
            onBulkAction={handleBulkAction}
          />
        )}
      </div>
    </Layout>
  );
}
