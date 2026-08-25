'use client';

import * as React from 'react';
import { FocusMode } from '@/components/focus/FocusMode';
import { completeFocusSession } from '@/lib/tasks-client';
import type { FocusSessionEndInfo } from '@/types';

interface FocusTaskRef {
  id: string;
  title: string;
  estimatedMinutes: number;
}

interface FocusContextType {
  isFocusModeOpen: boolean;
  focusTask: FocusTaskRef | null;
  openFocusMode: (task: FocusTaskRef, options?: { scheduleBlockId?: string }) => void;
  closeFocusMode: () => void;
}

const FocusContext = React.createContext<FocusContextType | null>(null);

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [isFocusModeOpen, setIsFocusModeOpen] = React.useState(false);
  const [focusTask, setFocusTask] = React.useState<FocusTaskRef | null>(null);
  // Kept in a ref so the session-end callback always sees the latest value
  // without re-mounting the timer mid-session.
  const scheduleBlockIdRef = React.useRef<string | null>(null);

  const openFocusMode = React.useCallback(
    (task: FocusTaskRef, options?: { scheduleBlockId?: string }) => {
      scheduleBlockIdRef.current = options?.scheduleBlockId ?? null;
      setFocusTask(task);
      setIsFocusModeOpen(true);
    },
    []
  );

  const closeFocusMode = React.useCallback(() => {
    setIsFocusModeOpen(false);
    setFocusTask(null);
    scheduleBlockIdRef.current = null;
  }, []);

  /**
   * Persistence seam: fires when a session ends (naturally completed or
   * interrupted). Sessions shorter than a minute are not recorded. Server-side
   * completion of the block/task is authoritative and user-scoped.
   */
  const handleSessionEnd = React.useCallback(
    (info: FocusSessionEndInfo) => {
      if (!focusTask || info.elapsedMinutes < 1) return;
      completeFocusSession({
        taskId: focusTask.id,
        scheduleBlockId: scheduleBlockIdRef.current,
        elapsedMinutes: info.elapsedMinutes,
        interrupted: info.interrupted,
      }).catch(() => {
        // Telemetry must never break closing the focus overlay; the user's work
        // state (task/block completion via other paths) remains intact.
      });
    },
    [focusTask]
  );

  return (
    <FocusContext.Provider value={{ isFocusModeOpen, focusTask, openFocusMode, closeFocusMode }}>
      {children}
      {isFocusModeOpen && focusTask && (
        <FocusMode
          taskId={focusTask.id}
          taskTitle={focusTask.title}
          estimatedMinutes={focusTask.estimatedMinutes}
          onSessionEnd={handleSessionEnd}
          onComplete={closeFocusMode}
          onExit={closeFocusMode}
        />
      )}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const context = React.useContext(FocusContext);
  if (!context) {
    throw new Error('useFocus must be used within a FocusProvider');
  }
  return context;
}
