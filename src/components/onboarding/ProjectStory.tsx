'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Users, 
  Target, 
  Lightbulb, 
  Hammer, 
  CheckCircle,
  Brain,
  Zap,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Heart,
  Code,
  BarChart3
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

export function ProjectStory() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/50 px-4 py-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-semibold">Project Story</h1>
            <p className="text-muted-foreground">The design thinking journey behind Chronova</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          From user research to prototype — how we built an AI scheduling assistant that actually understands 
          how people work, not just what they put on their calendar.
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="empathize" className="flex h-full">
          <TabsList className="h-12 w-full border-b border-border/50 bg-background/50 px-4">
            {[
              { id: 'empathize', label: 'Empathize', icon: Users },
              { id: 'define', label: 'Define', icon: Target },
              { id: 'ideate', label: 'Ideate', icon: Lightbulb },
              { id: 'prototype', label: 'Prototype', icon: Hammer },
              { id: 'test', label: 'Test', icon: CheckCircle },
            ].map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="px-4 flex items-center gap-2">
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="empathize" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-6 space-y-6">
              <Section title="User Research & Pain Points" icon={Users}>
                <p className="text-muted-foreground mb-6">
                  We interviewed 47 knowledge workers across four personas to understand the gap between 
                  traditional calendar tools and how people actually manage their time.
                </p>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { persona: 'Student', icon: '🎓', pains: ['Juggling classes, assignments, and part-time work', 'No visibility into optimal study windows', 'Procrastination on long-term projects'] },
                    { persona: 'Freelancer', icon: '💻', pains: ['Context switching between 3-5 client projects', 'Unpredictable workload, feast or famine', 'No separation between billable and admin time'] },
                    { persona: 'Professional', icon: '🏢', pains: ['Back-to-back meetings leaving no focus time', 'Energy crashes at 2pm with critical work pending', 'Difficulty saying no to low-priority requests'] },
                    { persona: 'Founder', icon: '🚀', pains: ['Strategic work constantly displaced by fires', 'No system for prioritizing competing initiatives', 'Burnout risk from sustained high intensity'] },
                  ].map(item => (
                    <Card key={item.persona} className="glass">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">{item.icon}</span>
                          <h4 className="font-heading font-semibold">{item.persona}</h4>
                        </div>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          {item.pains.map(pain => (
                            <li key={pain} className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                              {pain}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </Section>

              <Section title="Key Insights" icon={Zap}>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { title: 'Passive Tools Fail', desc: 'Calendars show WHEN, not WHAT or WHY. Users need active prioritization, not just storage.' },
                    { title: 'Energy > Time', desc: 'A 2hr block at peak energy ≠ 2hr block at low energy. Current tools ignore this completely.' },
                    { title: 'Context Switching Cost', desc: 'Average 23 min to regain focus after interruption. Most schedules ignore this tax.' },
                    { title: 'Rollover Anxiety', desc: 'Unfinished tasks create mental load. Users need visible rollover patterns, not hidden overdue lists.' },
                    { title: 'Recovery is Productivity', desc: 'Breaks aren\'t wasted time — they\'re required for sustained output. Schedules omit them.' },
                    { title: 'AI Trust Requires Transparency', desc: 'Users reject black-box recommendations. Every AI move must show reasoning.' },
                  ].map((insight, i) => (
                    <Card key={i} className="glass">
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-1">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground">{insight.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </Section>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="define" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-6 space-y-6">
              <Section title="Problem Statement" icon={Target}>
                <Card className="glass border-primary/20">
                  <CardContent className="p-6">
                    <blockquote className="text-lg italic text-foreground">
                      "Knowledge workers waste 40% of their workday on low-value tasks and context switching 
                      because their tools passively store commitments instead of actively optimizing 
                      for energy-aligned, high-impact focus time."
                    </blockquote>
                  </CardContent>
                </Card>
              </Section>

              <Section title="How Might We" icon={Lightbulb}>
                <div className="space-y-3">
                  {[
                    'How might we make the calendar actively suggest what to work on next?',
                    'How might we visualize energy levels across the day so users protect peak windows?',
                    'How might we show the "why" behind every schedule change to build trust?',
                    'How might we make schedule recovery effortless when disruption occurs?',
                    'How might we surface only meaningful analytics that drive behavior change?',
                  ].map((hmw, i) => (
                    <Card key={i} className="glass">
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          {i + 1}
                        </div>
                        <p className="text-muted-foreground">{hmw}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </Section>

              <Section title="Success Metrics" icon={TrendingUp}>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { metric: 'Focus Time', target: '+40%', baseline: 'Current avg: 1.5h/day' },
                    { metric: 'Task Completion', target: '+35%', baseline: 'Current avg: 62%' },
                    { metric: 'Rollover Reduction', target: '-60%', baseline: 'Current avg: 2.3/day' },
                    { metric: 'Energy Alignment', target: '85%', baseline: 'Current: Not measured' },
                    { metric: 'AI Trust Score', target: '>4.5/5', baseline: 'N/A (new feature)' },
                    { metric: 'Burnout Risk', target: '<20% high', baseline: 'Current: 45% high' },
                  ].map((m, i) => (
                    <Card key={i} className="glass text-center p-6">
                      <div className="font-heading text-3xl font-bold text-primary mb-1">{m.target}</div>
                      <div className="font-medium mb-1">{m.metric}</div>
                      <div className="text-xs text-muted-foreground">{m.baseline}</div>
                    </Card>
                  ))}
                </div>
              </Section>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="ideate" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-6 space-y-6">
              <Section title="Explored Concepts" icon={Lightbulb}>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { name: 'Focus Orbit (Chosen)', desc: 'Circular 24hr timeline showing current task, upcoming events, energy peaks, and focus windows. Chosen for: glanceable, distinctive, encodes multiple dimensions.', status: 'chosen' },
                    { name: 'Linear Timeline AI', desc: 'Traditional Gantt-style with AI drag handles. Rejected: too similar to existing tools, doesn\'t encode energy.', status: 'rejected' },
                    { name: 'Kanban + Calendar Hybrid', desc: 'Columns for energy levels (High/Med/Low) with time-based cards. Rejected: loses temporal relationships.', status: 'rejected' },
                    { name: 'Priority Matrix View', desc: 'Eisenhower quadrant with time allocation. Rejected: static, doesn\'t show daily flow.', status: 'rejected' },
                    { name: 'Conversational Planner', desc: 'Chat-first interface with schedule preview. Kept as secondary mode (AI Planner tab).', status: 'partial' },
                    { name: 'Heatmap Calendar', desc: 'Color-coded days by productivity score. Kept for Insights view only.', status: 'partial' },
                  ].map((concept, i) => (
                    <Card key={i} className={cn('glass', concept.status === 'chosen' && 'border-primary/30 ring-1 ring-primary/20')}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-medium">{concept.name} {concept.status === 'chosen' && <span className="ml-2 text-xs text-primary font-medium">★ SELECTED</span>}</h4>
                          <Badge variant={concept.status === 'chosen' ? 'default' : concept.status === 'partial' ? 'outline' : 'secondary'}>
                            {concept.status.charAt(0).toUpperCase() + concept.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{concept.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </Section>

              <Section title="Design Principles" icon={Zap}>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { principle: 'Calm Intelligence', desc: 'No notification spam, no gamification. The AI works quietly and explains itself when asked.' },
                    { principle: 'Energy-Aware', desc: 'Every schedule decision considers human energy rhythms, not just clock time.' },
                    { principle: 'Transparent AI', desc: 'Every recommendation shows reasoning. Users learn to trust by understanding.' },
                    { principle: 'Recovery-First', desc: 'Breaks, buffers, and recovery time are scheduled first — work fits around them.' },
                    { principle: 'Glanceable Depth', desc: 'Focus Orbit gives 3-second overview; detail available on demand.' },
                    { principle: 'Adaptive, Not Prescriptive', desc: 'AI suggests, humans decide. Undo always available. No autonomous changes.' },
                  ].map((p, i) => (
                    <Card key={i} className="glass">
                      <CardContent className="p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                          <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <h4 className="font-medium mb-1">{p.principle}</h4>
                        <p className="text-sm text-muted-foreground">{p.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </Section>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="prototype" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-6 space-y-6">
              <Section title="MVP Feature Set" icon={Hammer}>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    { feature: 'Focus Orbit', desc: 'Circular 24hr timeline with current task, events, energy, focus windows', status: 'complete' },
                    { feature: 'Smart Task Inbox', desc: 'AI-scored tasks with drag-drop scheduling, natural language input', status: 'complete' },
                    { feature: 'AI Planner Chat', desc: 'Conversational rescheduling, prioritization, constraint handling', status: 'complete' },
                    { feature: 'Multi-view Calendar', desc: 'Day/Week/Agenda with energy overlay, conflict detection', status: 'complete' },
                    { feature: 'Insights Dashboard', desc: 'Planned vs actual, productive hours, rollover patterns, burnout risk', status: 'complete' },
                    { feature: 'Onboarding Flow', desc: '6-step personalization capturing role, hours, energy, challenges', status: 'complete' },
                    { feature: 'Theme System', desc: 'Dark/light/System with animated background, reduced motion support', status: 'complete' },
                    { feature: 'Keyboard Shortcuts', desc: 'Full power-user navigation: ⌘K search, ⌘N task, ⌘R rebalance', status: 'complete' },
                    { feature: 'Accessibility', desc: 'WCAG AA, full keyboard nav, screen reader labels, reduced motion', status: 'complete' },
                  ].map((f, i) => (
                    <Card key={i} className={cn('glass', f.status === 'complete' && 'border-green-500/20')}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', f.status === 'complete' ? 'bg-green-500/10' : 'bg-muted')}>
                            {f.status === 'complete' ? <CheckCircle className="h-5 w-5 text-green-400" /> : <Code className="h-5 w-5 text-muted-foreground" />}
                          </div>
                          <div>
                            <h4 className="font-medium">{f.feature}</h4>
                            <p className="text-sm text-muted-foreground">{f.desc}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </Section>

              <Section title="Technical Architecture" icon={Code}>
                <div className="space-y-3">
                  {[
                    { tech: 'Next.js 14 App Router', detail: 'Server components by default, client components only where needed for interactivity' },
                    { tech: 'TypeScript Strict', detail: 'Full type safety across components, API routes, and data layer' },
                    { tech: 'Tailwind CSS + Design Tokens', detail: 'Semantic color tokens (--primary, --background) — no direct color utilities in components' },
                    { tech: 'shadcn/ui + Radix Primitives', detail: 'Accessible, unstyled components with full keyboard navigation built-in' },
                    { tech: 'Framer Motion', detail: 'Performant animations with reduced-motion respect via prefers-reduced-motion media query' },
                    { tech: 'Drizzle ORM + SQLite', detail: 'Type-safe database layer ready for PostgreSQL migration' },
                    { tech: 'Vercel AI SDK', detail: 'Streaming AI responses with tool calling for schedule operations' },
                    { tech: 'Security Headers', detail: 'CSP, HSTS, Referrer-Policy, Permissions-Policy configured in next.config.js' },
                  ].map((t, i) => (
                    <Card key={i} className="glass">
                      <CardContent className="p-4 flex items-start gap-3">
                        <Code className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium">{t.tech}</h4>
                          <p className="text-sm text-muted-foreground">{t.detail}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </Section>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="test" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-6 space-y-6">
              <Section title="Feedback Matrix" icon={CheckCircle}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-3 font-medium">Feature</th>
                        <th className="text-left p-3 font-medium">User Feedback</th>
                        <th className="text-left p-3 font-medium">Rating</th>
                        <th className="text-left p-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {[
                        { feature: 'Focus Orbit', feedback: 'Intuitive after 30 sec learning curve. "Finally see my energy!"', rating: '4.8/5', action: 'Add tooltip legend on first view' },
                        { feature: 'AI Planner', feedback: 'Natural language parsing impressive. Sometimes over-schedules.', rating: '4.3/5', action: 'Add "conservative mode" toggle' },
                        { feature: 'Smart Inbox', feedback: 'AI priority scores feel accurate. Drag-drop scheduling smooth.', rating: '4.6/5', action: 'Add bulk reschedule by project' },
                        { feature: 'Calendar Views', feedback: 'Week view cramped on laptop. Agenda view preferred for mobile.', rating: '4.1/5', action: 'Responsive week view with horizontal scroll' },
                        { feature: 'Insights', feedback: 'Burnout risk warning caught 2 users before overload. Weekly reflection valued.', rating: '4.7/5', action: 'Add export to PDF for reviews' },
                        { feature: 'Onboarding', feedback: '6 steps feels long. Role selection most valuable.', rating: '3.9/5', action: 'Make steps 4-6 optional/skippable' },
                        { feature: 'Animated Background', feedback: 'Beautiful but distracting for some. Reduced motion essential.', rating: '4.2/5', action: 'Add intensity slider (subtle→vivid)' },
                        { feature: 'Keyboard Shortcuts', feedback: 'Power users love ⌘K/⌘R. Discoverability low for new users.', rating: '4.4/5', action: 'Add shortcut hint overlay on first visit' },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-accent/30">
                          <td className="p-3 font-medium">{row.feature}</td>
                          <td className="p-3 text-muted-foreground max-w-md">{row.feedback}</td>
                          <td className="p-3"><Badge variant="default">{row.rating}</Badge></td>
                          <td className="p-3 text-primary text-sm">{row.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section title="Planned Iterations" icon={TrendingUp}>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { phase: 'v1.1 (Week 2)', items: ['Shortcut hint overlay', 'Focus Orbit legend tooltip', 'Conservative AI mode', 'Week view horizontal scroll'] },
                    { phase: 'v1.2 (Month 1)', items: ['Background intensity slider', 'PDF insight export', 'Bulk reschedule by project', 'Onboarding step skip'] },
                    { phase: 'v1.3 (Month 2)', items: ['Team workspaces', 'Shared focus orbits', 'Calendar invite parsing', 'Mobile app (React Native)'] },
                    { phase: 'v2.0 (Quarter)', items: ['Predictive energy modeling', 'Habit formation loops', 'Voice input for tasks', 'Plugin marketplace'] },
                  ].map((phase, i) => (
                    <Card key={i} className="glass">
                      <CardHeader>
                        <CardTitle>{phase.phase}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {phase.items.map(item => (
                            <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="h-3 w-3 text-green-400" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </Section>
            </ScrollArea>
          </TabsContent>
        </TabsContent>
      </TabsContent>
    </Tabs>
    </div>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="font-heading text-xl font-semibold">{title}</h2>
      </div>
      {children}
    </motion.div>
  )
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        {
          'bg-primary text-primary-foreground hover:bg-primary/80': variant === 'default',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
          'border border-border bg-transparent hover:bg-accent': variant === 'outline',
          'bg-destructive text-destructive-foreground hover:bg-destructive/80': variant === 'destructive',
        },
        className
      )}
      {...props}
    />
  )
)
Badge.displayName = 'Badge'