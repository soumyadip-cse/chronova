'use client';

import * as React from 'react';
import { Navigation } from './Navigation';
import { AnimatedBackground } from './AnimatedBackground';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  user?: { name: string; initials: string };
}

export function Layout({ children, user = { name: 'Alex Chen', initials: 'AC' } }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AnimatedBackground reducedMotion={reducedMotion} timeOfDay="morning" />

      <Navigation
        user={user}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />

      <main
        className={cn('min-h-screen transition-all duration-300', 'md:ml-64', 'pb-16 md:pb-0')}
        role="main"
      >
        <div className="pt-16 md:pt-0 px-4 md:px-8 py-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>

      <Toaster position="bottom-right" />
    </div>
  );
}
