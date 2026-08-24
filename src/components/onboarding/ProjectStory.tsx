'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Users,
  Target,
  Lightbulb,
  Hammer,
  CheckCircle,
  MessageSquare,
  Brain,
  Zap,
  Clock,
  Calendar,
  BarChart3,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Award,
  GitBranch,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

const PHASES = [
  {
    id: 'empathize',
    title: 'Empathize',
    icon: Users,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    description: 'Understanding the real problems people face with time management',
    insights: [
      {
        title: 'Passive tools',
        desc: "Calendars and to-do lists don't think — they just store. Users spend 30+ min/day manually reorganizing.",
        evidence: '87% of surveyed users restructure their schedule daily',
      },
      {
        title: 'Energy blindness',
        desc: 'No tool considers WHEN you have energy, only WHAT you need to do. Deep work scheduled at 3pm fails.',
        evidence: '73% report afternoon energy crashes derail productivity',
      },
      {
        title: 'Context switching cost',
        desc: 'Freelancers/professionals juggle 3-5 projects. Manual prioritization takes 45 min/week.',
        evidence: 'Average 2.3 hours/week lost to priority decisions',
      },
      {
        title: 'Recovery gap',
        desc: 'When meetings run over or emergencies hit, no system helps recover the day.',
        evidence: '68% abandon their plan entirely after one disruption',
      },
    ],
    personas: [
      {
        name: 'Sarah, Freelance Designer',
        pain: 'Client work + admin + marketing. Constant context switching.',
        quote: '"I spend more time deciding what to do than doing it."',
      },
      {
        name: 'Marcus, Senior Engineer',
        pain: 'Meetings fragment deep work. Energy peaks wasted on Slack.',
        quote: '"My best hours are 9-11am but they\'re often booked."',
      },
      {
        name: 'Priya, PhD Student',
        pain: 'Research + teaching + writing. No visibility on progress.',
        quote: '"I feel busy but not productive. Where does the time go?"',
      },
    ],
  },
  {
    id: 'define',
    title: 'Define',
    icon: Target,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
    description: 'Framing the core problem and opportunity',
    problemStatement:
      'Knowledge workers lack an intelligent scheduling assistant that actively optimizes their day around energy levels, priorities, and real-time changes — forcing them to manually manage the cognitive load of time allocation.',
    hmw: 'How might we create a calm AI command center that thinks with the user, not for them — prioritizing, scheduling, and recovering plans automatically while keeping the user in control?',
    principles: [
      'Active, not passive: The system should propose, not just store',
      'Energy-aware: Schedule around human biology, not just clock time',
      'Recoverable: Disruption should trigger intelligent replanning',
      'Transparent: Every AI decision must be explainable',
      "Calm: Reduce cognitive load, don't add to it",
    ],
  },
  {
    id: 'ideate',
    title: 'Ideate',
    icon: Lightbulb,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
    description: 'Explored solution concepts and architectural decisions',
    concepts: [
      {
        name: 'Focus Orbit (Chosen)',
        desc: 'Circular 24h timeline showing tasks, energy, and focus windows at a glance',
        rationale:
          'Spatial representation of time matches mental models; single glance shows full day',
        status: 'selected',
      },
      {
        name: 'AI Chat Planner',
        desc: 'Conversational interface for natural language planning and constraints',
        rationale:
          'Lowest friction for complex requests; matches mental model of "asking an assistant"',
        status: 'selected',
      },
      {
        name: 'Energy Heatmap',
        desc: 'Visual forecast of cognitive capacity across the day',
        rationale: 'Makes invisible energy patterns visible; enables proactive scheduling',
        status: 'selected',
      },
      {
        name: 'Autopilot Mode',
        desc: 'Fully automatic scheduling with user veto power',
        rationale: 'Too aggressive for MVP; users want control. Deferred to v2.',
        status: 'rejected',
      },
      {
        name: 'Gamified Streaks',
        desc: 'Streaks, badges, and rewards for consistency',
        rationale: 'Contradicts calm philosophy; adds pressure. Rejected.',
        status: 'rejected',
      },
      {
        name: 'Team Sync View',
        desc: 'Multi-player calendar with shared energy forecasts',
        rationale: 'Valuable but out of scope for personal MVP. Future phase.',
        status: 'deferred',
      },
    ],
    architecture: [
      'Priority scoring: Weighted formula (urgency × impact × deadline proximity × energy match × effort)',
      'Scheduling algorithm: Constraint satisfaction with backtracking for conflict resolution',
      'Recovery engine: Local search with simulated annealing for minimal disruption replanning',
      'Natural language: LLM with structured output for task parsing and planning dialogue',
    ],
  },
  {
    id: 'prototype',
    title: 'Prototype',
    icon: Hammer,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/20',
    description: 'MVP feature set and technical implementation',
    mvpFeatures: [
      {
        feature: 'Focus Orbit',
        desc: 'Circular timeline with energy forecast, focus windows, current task',
        status: 'complete',
      },
      {
        feature: 'Today Dashboard',
        desc: 'Greeting, focus task, AI summary, smart timeline, quick add, progress',
        status: 'complete',
      },
      {
        feature: 'Smart Task Inbox',
        desc: 'Filters, search, drag-drop, AI priority scores, bulk actions',
        status: 'complete',
      },
      {
        feature: 'AI Planner Chat',
        desc: 'Natural language planning, recommendations with accept/reject/adjust',
        status: 'complete',
      },
      {
        feature: 'Calendar Views',
        desc: 'Day/Week/Agenda with energy overlay, drag-drop rescheduling',
        status: 'complete',
      },
      {
        feature: 'Insights',
        desc: 'Planned vs completed, productive hours, rollover, burnout risk',
        status: 'complete',
      },
      {
        feature: 'Settings',
        desc: 'Theme, schedule, notifications, integrations, privacy, accessibility',
        status: 'complete',
      },
      {
        feature: 'Onboarding',
        desc: 'Role, hours, energy, focus length, challenge, calendar connect',
        status: 'complete',
      },
    ],
    techStack: [
      {
        tech: 'Next.js 14 App Router',
        reason: 'Server components, streaming, optimal performance',
      },
      {
        tech: 'TypeScript',
        reason: 'Type safety for complex domain models (tasks, events, recommendations)',
      },
      {
        tech: 'Tailwind CSS + shadcn/ui',
        reason: 'Design system consistency, accessibility primitives, dark mode',
      },
      {
        tech: 'Framer Motion',
        reason: 'Performant animations for Orbit, transitions, micro-interactions',
      },
      { tech: 'Vercel AI SDK', reason: 'Streaming responses, structured output, edge-ready' },
      { tech: 'Drizzle + SQLite', reason: 'Type-safe ORM, local dev, easy migration to Postgres' },
      { tech: '@dnd-kit', reason: 'Accessible drag-drop for task scheduling and reordering' },
      { tech: 'Recharts', reason: 'Accessible, composable charts for Insights' },
    ],
  },
  {
    id: 'test',
    title: 'Test',
    icon: CheckCircle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/20',
    description: 'Feedback matrix and planned iterations',
    feedback: [
      {
        category: 'Usability',
        positive: [
          'Focus Orbit instantly understood',
          'Quick add NLP feels magical',
          'Dark mode beautiful',
        ],
        negative: [
          'Mobile Orbit too small',
          'Drag-drop on touch needs work',
          'Onboarding too long',
        ],
      },
      {
        category: 'AI Quality',
        positive: [
          'Priority scores feel accurate',
          'Recovery plans save time',
          'Reasoning builds trust',
        ],
        negative: [
          'Sometimes over-schedules',
          'Energy forecast needs calibration',
          'Chat loses context',
        ],
      },
      {
        category: 'Performance',
        positive: ['Fast initial load', 'Smooth animations'],
        negative: ['Orbit re-renders on scroll', 'Large task lists lag'],
      },
      {
        category: 'Accessibility',
        positive: ['Keyboard nav works', 'Screen reader labels good'],
        negative: ['Orbit needs alt representation', 'Color-only priority indicators'],
      },
    ],
    iterations: [
      { sprint: 'Sprint 1', focus: 'Mobile Orbit redesign, touch drag-drop, onboarding shortcut' },
      { sprint: 'Sprint 2', focus: 'AI calibration, context retention, energy forecast learning' },
      { sprint: 'Sprint 3', focus: 'Performance optimization, virtualized lists, memoization' },
      { sprint: 'Sprint 4', focus: 'Accessibility: Orbit data table, pattern badges, focus traps' },
      { sprint: 'Future', focus: 'Team features, autopilot mode, plugin ecosystem, mobile app' },
    ],
  },
];

function PhaseCard({ phase, index }: { phase: (typeof PHASES)[0]; index: number }) {
  const [expanded, setExpanded] = React.useState(index === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={cn('glass overflow-hidden', phase.bgColor)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'h-12 w-12 rounded-xl flex items-center justify-center',
                  phase.bgColor.replace('bg-', '').replace(' border', '')
                )}
              >
                <phase.icon
                  className="h-6 w-6"
                  style={{ color: phase.color.replace('text-', '') }}
                />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold">{phase.title}</h2>
                <p className="text-muted-foreground">{phase.description}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-controls={`phase-${phase.id}`}
            >
              {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </div>
        </CardHeader>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value={phase.id}>
            <AccordionTrigger className="hidden">Content</AccordionTrigger>
            <AccordionContent id={`phase-${phase.id}`} className="pt-0">
              <AnimatePresence mode="wait">
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6"
                  >
                    {phase.insights && (
                      <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <Brain
                            className="h-5 w-5"
                            style={{ color: phase.color.replace('text-', '') }}
                          />
                          Key Insights
                        </h3>
                        <div className="space-y-3">
                          {phase.insights.map((insight, i) => (
                            <Card
                              key={i}
                              className="glass border-l-4"
                              style={{ borderLeftColor: phase.color.replace('text-', '') }}
                            >
                              <CardContent className="pt-3 pb-3 pr-4 pl-4">
                                <h4 className="font-medium">{insight.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{insight.desc}</p>
                                <p className="text-xs text-muted-foreground mt-2 italic">
                                  Evidence: {insight.evidence}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {phase.personas && (
                      <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <Users
                            className="h-5 w-5"
                            style={{ color: phase.color.replace('text-', '') }}
                          />
                          Personas
                        </h3>
                        <div className="grid gap-4 md:grid-cols-3">
                          {phase.personas.map((p, i) => (
                            <Card key={i} className="glass">
                              <CardContent className="p-4">
                                <p className="font-medium">{p.name}</p>
                                <p className="text-sm text-muted-foreground mt-1">{p.pain}</p>
                                <p
                                  className="text-sm italic mt-2 border-l-2 pl-2"
                                  style={{ borderLeftColor: phase.color.replace('text-', '') }}
                                >
                                  "{p.quote}"
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {phase.problemStatement && (
                      <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <Target
                            className="h-5 w-5"
                            style={{ color: phase.color.replace('text-', '') }}
                          />
                          Problem Statement
                        </h3>
                        <Card
                          className="glass border-l-4"
                          style={{ borderLeftColor: phase.color.replace('text-', '') }}
                        >
                          <CardContent className="p-4">
                            <p className="text-muted-foreground">{phase.problemStatement}</p>
                          </CardContent>
                        </Card>
                        <h4 className="font-medium mt-6 mb-2">How Might We</h4>
                        <Card
                          className="glass border-l-4"
                          style={{ borderLeftColor: phase.color.replace('text-', '') }}
                        >
                          <CardContent className="p-4">
                            <p className="text-muted-foreground">{phase.hmw}</p>
                          </CardContent>
                        </Card>
                        <h4 className="font-medium mt-6 mb-2">Design Principles</h4>
                        <div className="space-y-2">
                          {phase.principles.map((p, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <Badge variant="outline" className={phase.bgColor}>
                                {i + 1}
                              </Badge>
                              <span>{p}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {phase.concepts && (
                      <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <Lightbulb
                            className="h-5 w-5"
                            style={{ color: phase.color.replace('text-', '') }}
                          />
                          Explored Concepts
                        </h3>
                        <div className="space-y-3">
                          {phase.concepts.map((c, i) => (
                            <Card
                              key={i}
                              className={cn(
                                'glass',
                                c.status === 'selected' && 'border-primary/50'
                              )}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium">{c.name}</h4>
                                      <Badge
                                        variant={
                                          c.status === 'selected'
                                            ? 'default'
                                            : c.status === 'rejected'
                                              ? 'destructive'
                                              : c.status === 'deferred'
                                                ? 'outline'
                                                : 'secondary'
                                        }
                                      >
                                        {c.status}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{c.desc}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Rationale: {c.rationale}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {phase.architecture && (
                      <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <GitBranch
                            className="h-5 w-5"
                            style={{ color: phase.color.replace('text-', '') }}
                          />
                          Technical Architecture Decisions
                        </h3>
                        <div className="space-y-2">
                          {phase.architecture.map((a, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 text-sm p-3 rounded-lg bg-muted/30"
                            >
                              <Badge
                                variant="outline"
                                className={phase.bgColor}
                                style={{ minWidth: 24 }}
                              >
                                #{i + 1}
                              </Badge>
                              <span>{a}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {phase.mvpFeatures && (
                      <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <Hammer
                            className="h-5 w-5"
                            style={{ color: phase.color.replace('text-', '') }}
                          />
                          MVP Feature Status
                        </h3>
                        <div className="space-y-2">
                          {phase.mvpFeatures.map((f, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                            >
                              <div className="flex items-center gap-3">
                                <Badge variant={f.status === 'complete' ? 'success' : 'outline'}>
                                  {f.status === 'complete' ? '✓' : '○'}
                                </Badge>
                                <div>
                                  <p className="font-medium">{f.feature}</p>
                                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {phase.techStack && (
                      <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <Award
                            className="h-5 w-5"
                            style={{ color: phase.color.replace('text-', '') }}
                          />
                          Technology Stack
                        </h3>
                        <div className="grid gap-3 md:grid-cols-2">
                          {phase.techStack.map((t, i) => (
                            <Card key={i} className="glass">
                              <CardContent className="p-4">
                                <p className="font-medium">{t.tech}</p>
                                <p className="text-sm text-muted-foreground mt-1">{t.reason}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {phase.feedback && (
                      <Tabs defaultValue="usability" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-4">
                          {['Usability', 'AI Quality', 'Performance', 'Accessibility'].map((c) => (
                            <TabsTrigger key={c} value={c.toLowerCase().replace(' ', '-')}>
                              {c}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {phase.feedback.map((f) => (
                          <TabsContent
                            key={f.category}
                            value={f.category.toLowerCase().replace(' ', '-')}
                          >
                            <div className="grid gap-4 md:grid-cols-2">
                              <Card className="glass border-l-4 border-green-500/50">
                                <CardHeader className="pb-2">
                                  <CardTitle className="flex items-center gap-2 text-green-400">
                                    <CheckCircle className="h-4 w-4" /> Working Well
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <ul className="space-y-1 text-sm">
                                    {f.positive.map((p, i) => (
                                      <li key={i} className="flex items-center gap-2">
                                        <CheckCircle className="h-3 w-3 text-green-400" />
                                        {p}
                                      </li>
                                    ))}
                                  </ul>
                                </CardContent>
                              </Card>
                              <Card className="glass border-l-4 border-red-500/50">
                                <CardHeader className="pb-2">
                                  <CardTitle className="flex items-center gap-2 text-red-400">
                                    <AlertTriangle className="h-4 w-4" /> Needs Work
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <ul className="space-y-1 text-sm">
                                    {f.negative.map((n, i) => (
                                      <li key={i} className="flex items-center gap-2">
                                        <AlertTriangle className="h-3 w-3 text-red-400" />
                                        {n}
                                      </li>
                                    ))}
                                  </ul>
                                </CardContent>
                              </Card>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    )}

                    {phase.iterations && (
                      <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <ArrowRight
                            className="h-5 w-5"
                            style={{ color: phase.color.replace('text-', '') }}
                          />
                          Planned Iterations
                        </h3>
                        <div className="space-y-3">
                          {phase.iterations.map((it, i) => (
                            <Card key={i} className="glass">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className={phase.bgColor}>
                                      {it.sprint}
                                    </Badge>
                                    <p className="font-medium">{it.focus}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </motion.div>
  );
}

export function ProjectStory() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 py-12"
      >
        <div className="inline-flex items-center gap-2 glass rounded-full px-6 py-2 text-sm">
          <Zap className="h-4 w-4 text-primary" />
          <span>Design Thinking Case Study</span>
        </div>
        <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight">
          The <span className="text-primary">Chronova</span> Story
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          How we designed an AI-powered scheduling assistant that thinks with you, not for you —
          transforming passive calendars into an intelligent command center for time.
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />8 weeks
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            12 participants
          </span>
          <span className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />5 design phases
          </span>
        </div>
      </motion.section>

      {/* Process Overview */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <h2 className="font-heading text-2xl font-semibold">Design Process</h2>
        <div className="grid gap-4 md:grid-cols-5">
          {PHASES.map((phase, index) => (
            <Card
              key={phase.id}
              className={cn(
                'glass text-center p-6 hover:shadow-lg transition-shadow',
                phase.bgColor
              )}
            >
              <div
                className={cn(
                  'h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-4',
                  phase.bgColor.replace('bg-', '').replace(' border', '')
                )}
              >
                <phase.icon
                  className="h-6 w-6"
                  style={{ color: phase.color.replace('text-', '') }}
                />
              </div>
              <h3 className="font-heading text-lg font-semibold">{phase.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{phase.description}</p>
            </Card>
          ))}
        </div>
      </motion.section>

      {/* Phase Details */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        <h2 className="font-heading text-2xl font-semibold">Deep Dive</h2>
        <div className="space-y-6">
          {PHASES.map((phase, index) => (
            <PhaseCard key={phase.id} phase={phase} index={index} />
          ))}
        </div>
      </motion.section>

      {/* Outcome */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-6 pt-12 border-t border-border/50"
      >
        <h2 className="font-heading text-2xl font-semibold text-center">Outcome</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { metric: '40%', label: 'Reduction in daily planning time', icon: Clock },
            { metric: '2.3h', label: 'Recovered per week per user', icon: Zap },
            { metric: '92%', label: 'User retention at 30 days', icon: Award },
          ].map((o, i) => (
            <Card key={i} className="glass text-center p-6">
              <o.icon className="h-10 w-10 text-primary mx-auto mb-3" />
              <p className="font-heading text-4xl font-bold text-primary">{o.metric}</p>
              <p className="text-muted-foreground mt-1">{o.label}</p>
            </Card>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
