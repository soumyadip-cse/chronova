'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedBackgroundProps {
  reducedMotion?: boolean;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}

export function AnimatedBackground({
  reducedMotion = false,
  timeOfDay = 'morning',
}: AnimatedBackgroundProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const shouldReduceMotion = reducedMotion || prefersReducedMotion;

  const horizonColors = {
    morning: 'from-cyan-500/20 via-transparent to-transparent',
    afternoon: 'from-yellow-500/15 via-transparent to-transparent',
    evening: 'from-orange-500/20 via-pink-500/10 to-transparent',
    night: 'from-blue-900/20 via-purple-900/10 to-transparent',
  };

  const starPositions = React.useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        speed: Math.random() * 0.5 + 0.1,
        delay: Math.random() * 5,
      })),
    []
  );

  const gridLines = React.useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        y: (i / 12) * 100,
        speed: 0.02 + (i % 3) * 0.01,
      })),
    []
  );

  if (shouldReduceMotion) {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--background))] via-[hsl(var(--background))] to-[hsl(var(--card))]" />
        <div
          className="absolute bottom-0 left-0 right-0 h-1/3"
          style={{
            background: `linear-gradient(to top, ${horizonColors[timeOfDay].replace('from-', '').replace(' via-transparent to-transparent', '')} 0%, transparent 100%)`,
          }}
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--background))] via-[hsl(var(--background))] to-[hsl(var(--card))]" />

      {/* Horizon glow */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1/2"
        style={{
          background: `linear-gradient(to top, ${horizonColors[timeOfDay].replace('from-', '').replace(' via-transparent to-transparent', '')} 0%, transparent 100%)`,
        }}
        animate={{ opacity: [0.6, 0.8, 0.6] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />

      {/* Grid lines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
        linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px)
      `,
          backgroundSize: '60px 60px',
        }}
      >
        {gridLines.map((line) => (
          <motion.div
            key={line.id}
            className="absolute left-0 right-0 h-[1px]"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.08), transparent)',
              top: `${line.y}%`,
            }}
            animate={{
              top: [`${line.y}%`, `${(line.y + 100) % 100}%`],
            }}
            transition={{
              duration: 60 / line.speed,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Stars/particles */}
      <div className="absolute inset-0">
        {starPositions.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              background: 'hsl(var(--primary))',
              opacity: star.opacity,
              boxShadow: `0 0 ${star.size * 2}px hsl(var(--primary))`,
            }}
            animate={{
              x: [0, (Math.random() - 0.5) * 20],
              y: [0, (Math.random() - 0.5) * 20],
              opacity: [star.opacity, star.opacity * 0.5, star.opacity],
            }}
            transition={{
              duration: 15 / star.speed,
              repeat: Infinity,
              ease: 'linear',
              delay: star.delay,
            }}
          />
        ))}
      </div>

      {/* Subtle atmospheric light */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full blur-[200px] opacity-10"
        style={{ background: 'hsl(var(--primary))' }}
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -20, 30, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-1/3 h-1/3 rounded-full blur-[150px] opacity-10"
        style={{ background: 'hsl(var(--accent))' }}
        animate={{
          x: [0, -25, 15, 0],
          y: [0, 15, -25, 0],
          scale: [1, 1.05, 0.95, 1],
        }}
        transition={{ duration: 35, repeat: Infinity, ease: 'linear', delay: 5 }}
      />
    </div>
  );
}
