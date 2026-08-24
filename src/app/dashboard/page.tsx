'use client';

import * as React from 'react';
import { FocusOrbit } from '@/components/dashboard/FocusOrbit';
import { TodayDashboard } from '@/components/dashboard/TodayDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Target, Brain, Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useFocus } from '@/components/providers/focus-provider';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { data: session } = useSession();
  const { openFocusMode } = useFocus();
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [view, setView] = React.useState<'orbit' | 'list'>('orbit');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mockTasks = [
    {
      id: '1',
      title: 'Prepare marketing presentation',
      estimatedMinutes: 120,
      priorityFlag: 'high' as const,
      energyRequired: 'high' as const,
      deadlineUtc: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      aiPriorityScore: 94,
      scoreExplanation: 'Due in 5 hours • Matches high morning energy • Blocks 2 deliverables',
    },
    {
      id: '2',
      title: 'Code review for PR #234',
      estimatedMinutes: 45,
      priorityFlag: 'medium' as const,
      energyRequired: 'balanced' as const,
      deadlineUtc: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      aiPriorityScore: 72,
      scoreExplanation: 'Due tomorrow • Good afternoon energy match',
    },
    {
      id: '3',
      title: 'Write weekly reflection',
      estimatedMinutes: 20,
      priorityFlag: 'low' as const,
      energyRequired: 'low' as const,
      deadlineUtc: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      aiPriorityScore: 45,
      scoreExplanation: 'Low priority • Can do anytime',
    },
  ];

  const mockEvents = [
    {
      id: '1',
      title: 'Daily Standup',
      startUtc: new Date(today.getTime() + 9 * 60 * 60 * 1000).toISOString(),
      endUtc: new Date(today.getTime() + 9.25 * 60 * 60 * 1000).toISOString(),
      type: 'meeting' as const,
      color: '#3B82F6',
    },
    {
      id: '2',
      title: 'Client Call - Beta Corp',
      startUtc: new Date(today.getTime() + 15.5 * 60 * 60 * 1000).toISOString(),
      endUtc: new Date(today.getTime() + 16.25 * 60 * 60 * 1000).toISOString(),
      type: 'meeting' as const,
      color: '#EF4444',
    },
  ];

  const focusTimePlanned = mockTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const focusTimeCompleted = 0;

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
            onClick={() =>
              openFocusMode({
                id: '1',
                title: mockTasks[0].title,
                estimatedMinutes: mockTasks[0].estimatedMinutes,
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
                <div className="glass rounded-xl p-8 text-center">
                  <Target className="h-12 w-12 mx-auto text-primary/50 mb-4" />
                  <h3 className="font-heading text-lg font-semibold mb-2">Focus Orbit</h3>
                  <p className="text-muted-foreground text-sm">
                    Interactive orbital visualization coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Today's Focus
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="glass rounded-xl p-8 text-center">
                  <Target className="h-12 w-12 mx-auto text-primary/50 mb-4" />
                  <h3 className="font-heading text-lg font-semibold mb-2">List View</h3>
                  <p className="text-muted-foreground text-sm">Detailed task list coming soon</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Daily Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
                <p className="text-muted-foreground">
                  You have <strong>3 tasks</strong> scheduled (<strong>1 high priority</strong>)
                  totaling <strong>2h 45m</strong> of work.
                  <strong>2 meetings</strong> on calendar. Your peak energy window is{' '}
                  <strong>9-11am</strong> — protect this time for "Prepare marketing presentation".
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="font-heading text-2xl font-bold text-primary">3</div>
                  <div className="text-xs text-muted-foreground">Tasks Today</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="font-heading text-2xl font-bold text-green-400">0%</div>
                  <div className="text-xs text-muted-foreground">Focus Progress</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="font-heading text-2xl font-bold text-amber-400">0</div>
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
                Smart Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {[
                  { time: '9:00-9:15', title: 'Daily Standup', type: 'meeting', color: '#3B82F6' },
                  {
                    time: '9:30-11:30',
                    title: 'Deep Work: Marketing Presentation',
                    type: 'focus',
                    color: '#00F0FF',
                  },
                  { time: '11:30-11:45', title: 'Break / Walk', type: 'break', color: '#10B981' },
                  {
                    time: '11:45-12:30',
                    title: 'Code Review Session',
                    type: 'focus',
                    color: '#00F0FF',
                  },
                  { time: '12:30-13:30', title: 'Lunch Break', type: 'break', color: '#10B981' },
                  {
                    time: '15:30-16:15',
                    title: 'Client Call - Beta Corp',
                    type: 'meeting',
                    color: '#EF4444',
                  },
                ].map((event, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors group"
                  >
                    <div className="w-20 text-xs font-mono text-muted-foreground shrink-0">
                      {event.time}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            event.type === 'meeting' && 'bg-blue-500/10 text-blue-400',
                            event.type === 'focus' && 'bg-cyan-500/10 text-cyan-400',
                            event.type === 'break' && 'bg-green-500/10 text-green-400'
                          )}
                        >
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </span>
                        {event.type === 'focus' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() =>
                              openFocusMode({
                                id: `focus-${i}`,
                                title: event.title,
                                estimatedMinutes: 60,
                              })
                            }
                          >
                            <Zap className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: event.color }}
                    />
                  </div>
                ))}
              </div>
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
