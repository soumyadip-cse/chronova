'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Calendar, Clock, Zap, Moon, Sun, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react'
import { CalendarEvent, Task, EnergyForecast } from '@/types'

interface FocusOrbitProps {
  currentTask?: Task
  upcomingEvents: CalendarEvent[]
  energyForecast: EnergyForecast[]
  focusWindows: { start: Date; end: Date; type: 'deep' | 'shallow' }[]
  onTaskClick?: (task: Task) => void
  onEventClick?: (event: CalendarEvent) => void
  size?: number
  reducedMotion?: boolean
}

const ORBIT_RADIUS = 160
const INNER_RADIUS = 80

function getHourAngle(hour: number): number {
  return (hour / 24) * 360 - 90
}

function getPointOnCircle(radius: number, angle: number): { x: number; y: number } {
  const rad = (angle * Math.PI) / 180
  return {
    x: radius * Math.cos(rad),
    y: radius * Math.sin(rad),
  }
}

export function FocusOrbit({
  currentTask,
  upcomingEvents,
  energyForecast,
  focusWindows,
  onTaskClick,
  onEventClick,
  size = 320,
  reducedMotion = false,
}: FocusOrbitProps) {
  const radius = size / 2
  const now = new Date()
  const currentHour = now.getHours() + now.getMinutes() / 60
  const currentAngle = getHourAngle(currentHour)

  const energyColors = {
    high: 'text-green-400',
    balanced: 'text-cyan-400',
    low: 'text-amber-400',
  }

  const energyBg = {
    high: 'bg-green-400',
    balanced: 'bg-cyan-400',
    low: 'bg-amber-400',
  }

  if (reducedMotion) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }} role="img" aria-label="Focus Orbit - static view">
        <div className="absolute inset-0 border border-border/30 rounded-full" />
        <div className="absolute inset-0 border border-primary/20 rounded-full" style={{ clipPath: `polygon(50% 50%, 50% 0%, ${50 + Math.sin(currentAngle * Math.PI / 180) * 40}% ${50 - Math.cos(currentAngle * Math.PI / 180) * 40}%)` }} />
        {currentTask && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-xs text-muted-foreground mb-1">NOW</div>
            <div className="font-heading text-lg font-semibold truncate max-w-[140px]">{currentTask.title}</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }} role="img" aria-label="Focus Orbit - interactive timeline showing current task, upcoming events, and energy levels">
      <svg className="absolute inset-0" viewBox={`-${radius} -${radius} ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id="orbit-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.2" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx="0"
          cy="0"
          r={ORBIT_RADIUS}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          strokeDasharray="4,4"
        />

        <circle
          cx="0"
          cy="0"
          r={INNER_RADIUS}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="1"
          strokeDasharray="2,6"
          opacity="0.3"
        />

        {focusWindows.map((window, i) => {
          const startAngle = getHourAngle(window.start.getHours() + window.start.getMinutes() / 60)
          const endAngle = getHourAngle(window.end.getHours() + window.end.getMinutes() / 60)
          const sweep = endAngle > startAngle ? endAngle - startAngle : 360 - startAngle + endAngle

          return (
            <path
              key={`focus-${i}`}
              d={`M ${getPointOnCircle(INNER_RADIUS - 5, startAngle).x} ${getPointOnCircle(INNER_RADIUS - 5, startAngle).y} A ${INNER_RADIUS - 5} ${INNER_RADIUS - 5} 0 ${sweep > 180 ? 1 : 0} 1 ${getPointOnCircle(INNER_RADIUS - 5, endAngle).x} ${getPointOnCircle(INNER_RADIUS - 5, endAngle).y}`}
              fill="none"
              stroke={window.type === 'deep' ? 'hsl(var(--primary))' : 'hsl(var(--accent))'}
              strokeWidth="8"
              strokeLinecap="round"
              opacity={window.type === 'deep' ? 0.4 : 0.2}
              filter="url(#glow)"
            />
          )
        })}

        {energyForecast.map((forecast, i) => {
          const angle = getHourAngle(forecast.hour)
          const point = getPointOnCircle(ORBIT_RADIUS + 12, angle)
          const nextHour = (forecast.hour + 1) % 24
          const nextForecast = energyForecast.find(f => f.hour === nextHour)
          const nextAngle = getHourAngle(nextHour)
          const nextPoint = getPointOnCircle(ORBIT_RADIUS + 12, nextAngle)

          return (
            <line
              key={`energy-${i}`}
              x1={point.x}
              y1={point.y}
              x2={nextPoint.x}
              y2={nextPoint.y}
              stroke={`hsl(var(--${forecast.level === 'high' ? 'primary' : forecast.level === 'balanced' ? 'accent' : 'muted-foreground'}))`}
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.6"
            />
          )
        })}
      </svg>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="relative flex h-20 w-20 items-center justify-center rounded-full bg-card border border-border/50 shadow-xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          style={{ animationPlayState: 'running' }}
        >
          <div className="absolute inset-0 rounded-full bg-primary/10" />
          <div className="relative z-10 text-center">
            <div className="text-[10px] text-muted-foreground tracking-widest uppercase">NOW</div>
            <div className="text-xs font-mono text-foreground">{now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{ rotate: currentAngle }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.div
          className="absolute -top-2 left-1/2 -translate-x-1/2 flex h-6 w-6 -translate-y-full items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Zap className="h-3 w-3" aria-hidden="true" />
        </motion.div>
        <motion.line
          x1={0}
          y1={-INNER_RADIUS + 20}
          x2={0}
          y2={-ORBIT_RADIUS - 20}
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          strokeDasharray="4,4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />
      </motion.div>

      {upcomingEvents.slice(0, 6).map((event, i) => {
        const eventHour = event.start.getHours() + event.start.getMinutes() / 60
        const angle = getHourAngle(eventHour)
        const point = getPointOnCircle(ORBIT_RADIUS + 28, angle)

        const isMeeting = event.type === 'meeting'
        const isFocus = event.type === 'focus'

        return (
          <motion.div
            key={`event-${event.id}`}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ transform: `rotate(${angle}deg) translateY(-${ORBIT_RADIUS + 28}px) rotate(${-angle}deg)` }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * i, type: 'spring', stiffness: 300, damping: 25 }}
          >
            <button
              onClick={() => onEventClick?.(event)}
              className={cn(
                'relative flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-lg transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                isMeeting ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-green-500/20 border-green-500/50 text-green-400'
              )}
              aria-label={`${event.title} at ${event.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`}
            >
              {isMeeting ? <Calendar className="h-5 w-5" aria-hidden="true" /> : <Zap className="h-5 w-5" aria-hidden="true" />}
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-muted-foreground bg-background/90 backdrop-blur px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {event.title}
              </span>
            </button>
          </motion.div>
        )
      })}

      <AnimatePresence>
        {currentTask && (
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.3 }}
          >
            <div className="relative w-64 text-center">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/30" aria-hidden="true" />
              <div className="relative bg-card/90 backdrop-blur border border-border/50 rounded-xl p-4 shadow-xl">
                <div className="flex items-center justify-center gap-2 text-xs text-primary mb-2">
                  <Zap className="h-3 w-3" aria-hidden="true" />
                  <span className="font-medium tracking-wide">CURRENT FOCUS</span>
                </div>
                <h3 className="font-heading text-sm font-semibold text-foreground truncate pr-6">{currentTask.title}</h3>
                <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden="true" />{Math.round(currentTask.estimatedEffort / 60)}h</span>
                  <span className="flex items-center gap-1"><Zap className="h-3 w-3" aria-hidden="true" />{currentTask.energyRequired}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-[10px] text-muted-foreground" aria-hidden="true">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary/50" />
          <span>Focus Window</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary/30" />
          <span>Shallow Work</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full border border-border/50" />
          <span>Meeting</span>
        </div>
      </div>
    </div>
  )
}