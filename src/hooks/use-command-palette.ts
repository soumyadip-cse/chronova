'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export function useCommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const commands = React.useMemo(
    () => [
      {
        id: 'new-task',
        label: 'Add Task',
        description: 'Create a new task with natural language',
        icon: null as any,
        shortcut: '⌘N',
        action: () => router.push('/dashboard?modal=new-task'),
        category: 'tasks' as const,
        keywords: ['add', 'create', 'new', 'task', 'todo'],
      },
      {
        id: 'start-focus',
        label: 'Start Focus Session',
        description: 'Begin a distraction-free work session',
        icon: null as any,
        shortcut: '⌘⇧F',
        action: () => router.push('/focus'),
        category: 'focus' as const,
        keywords: ['focus', 'pomodoro', 'timer', 'work', 'session'],
      },
      {
        id: 'rebalance-day',
        label: 'Rebalance Day',
        description: 'AI-powered schedule optimization',
        icon: null as any,
        shortcut: '⌘R',
        action: () => {
          toast({ title: 'Rebalancing...', description: 'AI is optimizing your schedule' });
        },
        category: 'ai' as const,
        keywords: ['rebalance', 'optimize', 'schedule', 'ai', 'rearrange'],
      },
      {
        id: 'play-rain',
        label: 'Play Rain Sounds',
        description: 'Start gentle rainfall ambient sound',
        icon: null as any,
        shortcut: '⌘⇧R',
        action: () => router.push('/soundscape?sound=rain'),
        category: 'focus' as const,
        keywords: ['rain', 'sound', 'ambient', 'music', 'play'],
      },
      {
        id: 'today',
        label: 'Go to Today',
        description: "Navigate to today's dashboard",
        icon: null as any,
        shortcut: '⌘1',
        action: () => router.push('/dashboard'),
        category: 'navigation' as const,
        keywords: ['today', 'dashboard', 'home', 'overview'],
      },
      {
        id: 'calendar',
        label: 'Open Calendar',
        description: 'View calendar with day/week/agenda',
        icon: null as any,
        shortcut: '⌘2',
        action: () => router.push('/calendar'),
        category: 'navigation' as const,
        keywords: ['calendar', 'schedule', 'events', 'meetings'],
      },
      {
        id: 'ai-planner',
        label: 'AI Planner',
        description: 'Chat with AI to plan your day',
        icon: null as any,
        shortcut: '⌘3',
        action: () => router.push('/planner'),
        category: 'ai' as const,
        keywords: ['ai', 'planner', 'chat', 'plan', 'assistant'],
      },
      {
        id: 'insights',
        label: 'View Insights',
        description: 'Productivity analytics and time journey',
        icon: null as any,
        shortcut: '⌘4',
        action: () => router.push('/insights'),
        category: 'navigation' as const,
        keywords: ['insights', 'analytics', 'stats', 'productivity', 'journey'],
      },
      {
        id: 'settings',
        label: 'Open Settings',
        description: 'Account, integrations, preferences',
        icon: null as any,
        shortcut: '⌘,',
        action: () => router.push('/settings'),
        category: 'settings' as const,
        keywords: ['settings', 'preferences', 'account', 'integrations'],
      },
    ],
    [router, toast, pathname]
  );

  return { commands };
}
