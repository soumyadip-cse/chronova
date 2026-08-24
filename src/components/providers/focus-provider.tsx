'use client';

import * as React from 'react';
import { FocusMode } from '@/components/focus/FocusMode';

interface FocusContextType {
  isFocusModeOpen: boolean;
  focusTask: { id: string; title: string; estimatedMinutes: number } | null;
  openFocusMode: (task: { id: string; title: string; estimatedMinutes: number }) => void;
  closeFocusMode: () => void;
}

const FocusContext = React.createContext<FocusContextType | null>(null);

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [isFocusModeOpen, setIsFocusModeOpen] = React.useState(false);
  const [focusTask, setFocusTask] = React.useState<FocusContextType['focusTask']>(null);

  const openFocusMode = React.useCallback(
    (task: { id: string; title: string; estimatedMinutes: number }) => {
      setFocusTask(task);
      setIsFocusModeOpen(true);
    },
    []
  );

  const closeFocusMode = React.useCallback(() => {
    setIsFocusModeOpen(false);
    setFocusTask(null);
  }, []);

  return (
    <FocusContext.Provider value={{ isFocusModeOpen, focusTask, openFocusMode, closeFocusMode }}>
      {children}
      {isFocusModeOpen && focusTask && (
        <FocusMode
          taskId={focusTask.id}
          taskTitle={focusTask.title}
          estimatedMinutes={focusTask.estimatedMinutes}
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
