'use client';

import * as React from 'react';
import { FocusMode } from '@/components/focus/FocusMode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Play, Clock, CheckCircle, Target, Brain } from 'lucide-react';
import { useFocus } from '@/components/providers/focus-provider';

const mockTasks = [
  {
    id: '1',
    title: 'Prepare marketing presentation',
    estimatedMinutes: 120,
    priorityFlag: 'high' as const,
    energyRequired: 'high' as const,
    aiPriorityScore: 94,
  },
  {
    id: '2',
    title: 'Code review for PR #234',
    estimatedMinutes: 45,
    priorityFlag: 'medium' as const,
    energyRequired: 'balanced' as const,
    aiPriorityScore: 72,
  },
  {
    id: '3',
    title: 'Write weekly reflection',
    estimatedMinutes: 20,
    priorityFlag: 'low' as const,
    energyRequired: 'low' as const,
    aiPriorityScore: 45,
  },
  {
    id: '4',
    title: 'Plan Q2 roadmap',
    estimatedMinutes: 90,
    priorityFlag: 'high' as const,
    energyRequired: 'high' as const,
    aiPriorityScore: 88,
  },
  {
    id: '5',
    title: 'Reply to client emails',
    estimatedMinutes: 30,
    priorityFlag: 'medium' as const,
    energyRequired: 'low' as const,
    aiPriorityScore: 55,
  },
];

export default function FocusPage() {
  const { openFocusMode } = useFocus();

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
          <Clock className="h-4 w-4" />
          Timer Only
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Today's Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {mockTasks.map((task) => (
                <Button
                  key={task.id}
                  variant="outline"
                  className="w-full justify-between gap-4 p-4 text-left hover:bg-accent/50 transition-colors"
                  onClick={() =>
                    handleStartFocus({
                      id: task.id,
                      title: task.title,
                      estimatedMinutes: task.estimatedMinutes,
                    })
                  }
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.estimatedMinutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {task.energyRequired}
                      </span>
                      <span className="flex items-center gap-1">
                        <Brain className="h-3 w-3" />
                        AI: {task.aiPriorityScore}%
                      </span>
                    </div>
                  </div>
                  <Zap className="h-5 w-5 text-primary opacity-50" />
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
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
                <CheckCircle className="h-5 w-5 text-green-400" />
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
