'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Clock,
  Zap,
  Moon,
  Sun,
  Coffee,
  Briefcase,
  Dumbbell,
  BookOpen,
  Music,
  Palette,
  Code,
  Users,
  Target,
} from 'lucide-react';
import { Task, CalendarEvent, EnergyForecast } from '@/types';
import { formatTime } from '@/lib/utils';

interface FocusWindow {
  start: Date;
  end: Date;
  type: 'deep' | 'shallow';
}

interface FocusOrbitProps {
  currentTask: Task | null;
  upcomingEvents: CalendarEvent[];
  energyForecast: EnergyForecast[];
  focusWindows: FocusWindow[];
  onTaskClick: (task: Task) => void;
  onEventClick: (event: CalendarEvent) => void;
  size?: number;
  reducedMotion?: boolean;
}

const ENERGY_COLORS = {
  high: 'hsl(var(--primary))',
  balanced: 'hsl(var(--accent))',
  low: 'hsl(var(--muted-foreground))',
};

const ENERGY_ICONS = {
  high: Zap,
  balanced: Coffee,
  low: Moon,
};

const EVENT_TYPE_COLORS = {
  meeting: 'hsl(189 100% 42%)',
  focus: 'hsl(142 76% 36%)',
  break: 'hsl(43 100% 58%)',
  flexible: 'hsl(262 83% 58%)',
  personal: 'hsl(340 82% 52%)',
  schedule: 'hsl(239 84% 67%)',
};

const EVENT_ICONS = {
  meeting: Users,
  focus: Target,
  break: Coffee,
  flexible: BookOpen,
  personal: Dumbbell,
};

function getHourAngle(hour: number, minute: number = 0): number {
  const totalMinutes = hour * 60 + minute;
  return (totalMinutes / (24 * 60)) * 360 - 90;
}

function getEnergyLevelAtHour(forecast: EnergyForecast[], hour: number): EnergyForecast['level'] {
  const entry = forecast.find((f) => f.hour === hour);
  return entry?.level || 'low';
}

export function FocusOrbit({
  currentTask,
  upcomingEvents,
  energyForecast,
  focusWindows,
  onTaskClick,
  onEventClick,
  size = 300,
  reducedMotion = false,
}: FocusOrbitProps) {
  const radius = size / 2;
  const center = radius;
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentAngle = getHourAngle(currentHour, currentMinute);

  const [hoveredSegment, setHoveredSegment] = React.useState<string | null>(null);

  const orbitStyle = {
    width: size,
    height: size,
  } as React.CSSProperties;

  return (
    <div
      className="relative flex flex-col items-center"
      style={orbitStyle}
      role="img"
      aria-label="Focus Orbit - 24-hour circular timeline showing tasks, events, and energy levels"
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="relative z-10" aria-hidden="true">
        <defs>
          <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
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

        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius - 20}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="2"
          strokeDasharray="4 4"
        />

        {/* Energy forecast ring */}
        <g aria-hidden="true">
          {energyForecast.map((energy, index) => {
            const nextHour = energyForecast[(index + 1) % energyForecast.length];
            const startAngle = getHourAngle(energy.hour);
            const endAngle = getHourAngle(nextHour.hour);
            const sweepAngle =
              endAngle > startAngle ? endAngle - startAngle : 360 - startAngle + endAngle;

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            const r = radius - 35;

            const x1 = center + r * Math.cos(startRad);
            const y1 = center + r * Math.sin(startRad);
            const x2 = center + r * Math.cos(endRad);
            const y2 = center + r * Math.sin(endRad);

            const largeArcFlag = sweepAngle > 180 ? 1 : 0;

            return (
              <path
                key={energy.hour}
                d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`}
                fill="none"
                stroke={ENERGY_COLORS[energy.level]}
                strokeWidth="6"
                strokeLinecap="round"
                opacity={0.4}
                style={{
                  transition: reducedMotion ? 'none' : 'opacity 0.3s ease',
                }}
                onMouseEnter={() => setHoveredSegment(`energy-${energy.hour}`)}
                onMouseLeave={() => setHoveredSegment(null)}
              />
            );
          })}
        </g>

        {/* Focus windows */}
        <g aria-hidden="true">
          {focusWindows.map((window, index) => {
            const startAngle = getHourAngle(window.start.getHours(), window.start.getMinutes());
            const endAngle = getHourAngle(window.end.getHours(), window.end.getMinutes());
            const sweepAngle =
              endAngle > startAngle ? endAngle - startAngle : 360 - startAngle + endAngle;

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            const r = radius - 12;

            const x1 = center + r * Math.cos(startRad);
            const y1 = center + r * Math.sin(startRad);
            const x2 = center + r * Math.cos(endRad);
            const y2 = center + r * Math.sin(endRad);

            const largeArcFlag = sweepAngle > 180 ? 1 : 0;

            return (
              <path
                key={index}
                d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth={window.type === 'deep' ? 8 : 4}
                strokeLinecap="round"
                strokeDasharray={window.type === 'shallow' ? '6 4' : 'none'}
                opacity={window.type === 'deep' ? 0.6 : 0.3}
                filter="url(#glow)"
              />
            );
          })}
        </g>

        {/* Current time indicator */}
        <g aria-hidden="true">
          <line
            x1={center}
            y1={center}
            x2={center + (radius - 50) * Math.cos((currentAngle * Math.PI) / 180)}
            y2={center + (radius - 50) * Math.sin((currentAngle * Math.PI) / 180)}
            stroke="hsl(var(--destructive))"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#glow)"
            className={cn(!reducedMotion && 'animate-pulse')}
          />
          <circle
            cx={center + (radius - 50) * Math.cos((currentAngle * Math.PI) / 180)}
            cy={center + (radius - 50) * Math.sin((currentAngle * Math.PI) / 180)}
            r={6}
            fill="hsl(var(--destructive))"
            filter="url(#glow)"
          />
        </g>

        {/* Events on orbit */}
        <g aria-hidden="true">
          {upcomingEvents.slice(0, 8).map((event, index) => {
            const eventAngle = getHourAngle(event.start.getHours(), event.start.getMinutes());
            const eventRad = (eventAngle * Math.PI) / 180;
            const r = radius - 60;
            const x = center + r * Math.cos(eventRad);
            const y = center + r * Math.sin(eventRad);
            const isCurrent = hoveredSegment === `event-${event.id}`;

            return (
              <g
                key={event.id}
                onMouseEnter={() => setHoveredSegment(`event-${event.id}`)}
                onMouseLeave={() => setHoveredSegment(null)}
                onClick={() => onEventClick(event)}
                style={{ cursor: 'pointer' }}
                transform={`rotate(${eventAngle} ${center} ${center})`}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={isCurrent ? 10 : 8}
                  fill={EVENT_TYPE_COLORS[event.type]}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                  filter="url(#glow)"
                  className={cn(!reducedMotion && 'transition-all duration-200')}
                />
                {isCurrent && (
                  <circle
                    cx={x}
                    cy={y}
                    r={14}
                    fill="none"
                    stroke={EVENT_TYPE_COLORS[event.type]}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    className={cn(!reducedMotion && 'animate-spin')}
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* Center dot */}
        <circle
          cx={center}
          cy={center}
          r={12}
          fill="hsl(var(--background))"
          stroke="hsl(var(--border))"
          strokeWidth={2}
        />
        <Zap
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-primary"
          aria-hidden="true"
        />
      </svg>

      {/* Current task center display */}
      <AnimatePresence mode="wait">
        {currentTask && (
          <motion.div
            key={currentTask.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] text-center pointer-events-none"
            style={{ zIndex: 20 }}
          >
            <div className="glass-strong rounded-xl p-3 border-primary/20">
              <p className="text-xs text-primary font-medium uppercase tracking-wider mb-1">
                Current Focus
              </p>
              <p className="font-heading text-sm font-semibold truncate">{currentTask.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatTime(currentTask.scheduledAt || new Date())} •{' '}
                {Math.round(currentTask.estimatedEffort / 60)}h
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div
        className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground"
        role="legend"
        aria-label="Orbit legend"
      >
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: ENERGY_COLORS.high }} />
          <span>High Energy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: ENERGY_COLORS.balanced }} />
          <span>Balanced</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: ENERGY_COLORS.low }} />
          <span>Low Energy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full border-2"
            style={{ borderColor: 'hsl(var(--primary))', background: 'transparent' }}
          />
          <span>Deep Focus</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: 'hsl(var(--destructive))' }} />
          <span>Now</span>
        </div>
      </div>

      {/* Tooltip for hovered event */}
      <AnimatePresence>
        {hoveredSegment?.startsWith('event-') && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute bottom-[-60px] left-1/2 -translate-x-1/2 glass-strong rounded-lg px-3 py-2 text-xs whitespace-nowrap pointer-events-none z-20"
            style={{ transformOrigin: 'center top' }}
          >
            {(() => {
              const eventId = hoveredSegment.replace('event-', '');
              const event = upcomingEvents.find((e) => e.id === eventId);
              if (!event) return null;
              return (
                <>
                  <div className="font-medium">{event.title}</div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatTime(event.start)} – {formatTime(event.end)}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{event.type}</span>
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip for hovered energy */}
      <AnimatePresence>
        {hoveredSegment?.startsWith('energy-') && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute bottom-[-60px] left-1/2 -translate-x-1/2 glass-strong rounded-lg px-3 py-2 text-xs whitespace-nowrap pointer-events-none z-20"
          >
            {(() => {
              const hour = parseInt(hoveredSegment.replace('energy-', ''));
              const energy = energyForecast.find((f) => f.hour === hour);
              if (!energy) return null;
              const Icon = ENERGY_ICONS[energy.level];
              return (
                <div className="flex items-center gap-1">
                  <Icon className="h-3 w-3" style={{ color: ENERGY_COLORS[energy.level] }} />
                  <span>
                    {hour}:00 – {energy.level} energy ({(energy.confidence * 100).toFixed(0)}%)
                  </span>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
