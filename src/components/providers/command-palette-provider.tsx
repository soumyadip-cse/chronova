'use client';

import * as React from 'react';
import { CommandPalette } from '@/components/ui/command-palette';
import { useCommandPalette } from '@/hooks/use-command-palette';

interface CommandPaletteContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const CommandPaletteContext = React.createContext<CommandPaletteContextType | null>(null);

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { commands } = useCommandPalette();

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen((prev) => !prev), []);

  const handleCommand = React.useCallback(
    (command: any) => {
      command.action();
      close();
    },
    [close]
  );

  return (
    <CommandPaletteContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
      <CommandPalette
        isOpen={isOpen}
        onClose={close}
        onCommand={handleCommand}
        customCommands={commands}
      />
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPaletteContext() {
  const context = React.useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPaletteContext must be used within a CommandPaletteProvider');
  }
  return context;
}
