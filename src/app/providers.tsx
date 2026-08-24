'use client';

import * as React from 'react';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CommandPaletteProvider } from '@/components/providers/command-palette-provider';
import { FocusProvider } from '@/components/providers/focus-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <CommandPaletteProvider>
          <FocusProvider>{children}</FocusProvider>
        </CommandPaletteProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
