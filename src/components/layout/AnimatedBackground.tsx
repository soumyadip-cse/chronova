'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AnimatedBackgroundProps {
  reducedMotion?: boolean
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
}

export function AnimatedBackground({ reducedMotion = false, timeOfDay = 'morning' }: AnimatedBackgroundProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  const shouldReduceMotion = reducedMotion || prefersReducedMotion

  const horizonColors = {
    morning: 'from-cyan-500/20 via-transparent to-transparent',
    afternoon: 'from-yellow-500/15 via-transparent to-transparent',
    evening: 'from-orange-500/20 via-pink-500/10 to-transparent',
    night: 'from-blue-900/20 via-purple-900/10 to-transparent',
  }

  const starCount = 60
  const gridLines = 20

  if (shouldReduceMotion) {
    return (
      <div className="fixed inset-0 -z-10 bg-background" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--accent)]/5" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(222,47%,4%)] via-[hsl(222,47%,6%)] to-[hsl(222,47%,8%)]" />

      <div className={cn(
        'absolute bottom-0 left-0 right-0 h-[300px] bg-gradient-to-t',
        horizonColors[timeOfDay],
        'animate-pulse-glow'
      )} />

      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        {[...Array(gridLines)].map((_, i) => (
          <motion.div
            key={`grid-${i}`}
            className="absolute left-0 right-0 h-px bg-primary/20"
            style={{ top: `${(i / gridLines) * 100}%` }}
            animate={{ x: [-50, 50, -50] }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear', delay: i * 0.5 }}
          />
        ))}
      </div>

      <div className="absolute inset-0" aria-hidden="true">
        {[...Array(starCount)].map((_, i) => {
          const size = Math.random() * 2 + 0.5
          const x = Math.random() * 100
          const y = Math.random() * 100
          const duration = 15 + Math.random() * 20
          const delay = Math.random() * 5

          return (
            <motion.div
              key={`star-${i}`}
              className="absolute rounded-full bg-primary/60"
              style={{
                width: size,
                height: size,
                left: `${x}%`,
                top: `${y}%`,
              }}
              animate={{
                x: [0, (Math.random() - 0.5) * 100, 0],
                y: [0, (Math.random() - 0.5) * 50, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay,
              }}
            />
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </AnimatePresence>
    </div>
  )
}