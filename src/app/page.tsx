'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Zap,
  ArrowRight,
  Users,
  Target,
  Brain,
  Clock,
  Calendar,
  BarChart3,
  Shield,
  CheckCircle,
  Sparkles,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';

export default function HomePage() {
  const [mounted, setMounted] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <>
      {mounted && <AnimatedBackground reducedMotion={reducedMotion} timeOfDay="morning" />}

      <main className="relative min-h-screen flex flex-col">
        {/* Navigation */}
        <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-2">
                <Link href="/" className="flex items-center gap-2" aria-label="Chronova home">
                  <Zap className="h-8 w-8 text-primary" aria-hidden="true" />
                  <span className="font-heading text-2xl font-bold">Chronova</span>
                </Link>
              </div>
              <div className="hidden md:flex items-center gap-8">
                <Link
                  href="#features"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </Link>
                <Link
                  href="#demo"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Demo
                </Link>
                <Link
                  href="#story"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Story
                </Link>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>
            </div>
          </nav>
        </header>

        {/* Hero */}
        <section className="relative flex-1 flex items-center justify-center pt-16 pb-20 px-4">
          <div className="max-w-5xl mx-auto w-full text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 glass rounded-full px-6 py-2"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Now with AI-Powered Scheduling</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight">
                Your AI Command Center
                <br />
                <span className="text-primary">for Time</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Unlike passive calendars, Chronova actively organizes your day. It prioritizes tasks
                based on urgency, impact, deadlines, energy levels, and available time. When plans
                change, it intelligently rearranges your schedule.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button size="lg" className="gap-2 w-full sm:w-auto" asChild>
                <Link href="/signup">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
                <Link href="#demo">Watch Demo</Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-8 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Cancel anytime</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 px-4 relative z-10">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className="font-heading text-3xl md:text-4xl font-bold">
                Built for How You Actually Work
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Every feature designed around real productivity challenges — not feature checklists.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: Target,
                  title: 'Focus Orbit',
                  desc: 'Circular 24h timeline showing current task, upcoming commitments, focus windows, and energy peaks at a glance.',
                  feature: 'Signature Visualization',
                },
                {
                  icon: Brain,
                  title: 'AI Planner',
                  desc: 'Chat naturally: "What should I work on next?" or "I\'m low energy today." Get explainable recommendations you can accept, reject, or adjust.',
                  feature: 'Conversational Planning',
                },
                {
                  icon: Zap,
                  title: 'Smart Rebalancing',
                  desc: 'When meetings run over or emergencies hit, one click regenerates your optimal schedule with minimal disruption.',
                  feature: 'One-Click Recovery',
                },
                {
                  icon: Clock,
                  title: 'Energy-Aware Scheduling',
                  desc: 'Learns your energy patterns. Schedules deep work at 9am, not 3pm. Adds recovery breaks automatically.',
                  feature: 'Chronobiology Integration',
                },
                {
                  icon: Calendar,
                  title: 'Multi-View Calendar',
                  desc: 'Day, Week, Agenda views with energy overlays. Drag-drop rescheduling. Conflict detection with recovery plans.',
                  feature: 'Visual Time Management',
                },
                {
                  icon: BarChart3,
                  title: 'Meaningful Insights',
                  desc: 'Planned vs completed focus time. Productive hours. Task rollover patterns. Burnout risk warnings. Weekly reflections.',
                  feature: 'Actionable Analytics',
                },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-xs text-primary font-medium uppercase tracking-wider">
                    {item.feature}
                  </span>
                  <h3 className="font-heading text-xl font-semibold mt-2 mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Demo Preview */}
        <section id="demo" className="py-20 px-4 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <h2 className="font-heading text-3xl md:text-4xl font-bold">See It in Action</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Real interface, real data. This is what your day looks like with Chronova.
              </p>
            </div>

            <div className="glass rounded-2xl overflow-hidden border border-border/50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <span className="text-sm text-muted-foreground font-mono">
                  chronova.app/dashboard
                </span>
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <Smartphone className="h-4 w-4" />
                </div>
              </div>
              <div className="p-8 md:p-12">
                <div className="grid gap-8 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-heading text-2xl font-semibold">Good morning, Alex</p>
                          <p className="text-muted-foreground">Thursday, January 25, 2024</p>
                        </div>
                        <Button variant="premium" size="lg" className="gap-2">
                          <Zap className="h-4 w-4" />
                          Rebalance Day
                        </Button>
                      </div>
                      <Card className="glass">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            Today's Focus
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                              <Zap className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-heading text-lg font-semibold">
                                Prepare marketing presentation
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Q3 marketing deck for board meeting - slides 1-15
                              </p>
                              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  2h 0m
                                </span>
                                <span className="flex items-center gap-1">
                                  <Zap className="h-3 w-3" />
                                  High energy
                                </span>
                                <span className="flex items-center gap-1">
                                  <Brain className="h-3 w-3" />
                                  AI: 94%
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="glass">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-primary" />
                          Focus Orbit
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="aspect-square max-w-xs mx-auto bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-2xl border border-border/50 flex items-center justify-center">
                          <div className="text-center p-4">
                            <div className="h-32 w-32 mx-auto mb-4 rounded-full border-4 border-primary/20 relative">
                              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-destructive rounded-full" />
                              <Zap className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <p className="text-sm text-muted-foreground">9:00-11:00 Deep Work</p>
                            <p className="text-xs text-muted-foreground">
                              Current: Marketing Presentation
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <Card className="glass">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="h-5 w-5 text-primary" />
                          AI Daily Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3 text-sm">
                          <div className="rounded-lg bg-primary/5 p-3 border border-primary/10">
                            <p className="text-muted-foreground">
                              You have 3 tasks scheduled (2 high priority) totaling 3h 45m of work.
                              1 meeting on calendar. Your peak energy window is 9-11am — protect
                              this time for "Prepare marketing presentation".
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="rounded-lg bg-muted/50 p-3">
                              <div className="font-heading text-2xl font-bold text-primary">3</div>
                              <div className="text-xs text-muted-foreground">Tasks Today</div>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-3">
                              <div className="font-heading text-2xl font-bold text-green-400">
                                65%
                              </div>
                              <div className="text-xs text-muted-foreground">Focus Progress</div>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-3">
                              <div className="font-heading text-2xl font-bold text-amber-400">
                                1
                              </div>
                              <div className="text-xs text-muted-foreground">Completed</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-primary" />
                          Smart Timeline
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {[
                            { time: '9:00-9:15', title: 'Daily Standup', type: 'meeting' },
                            {
                              time: '9:30-11:30',
                              title: 'Deep Work: Marketing Presentation',
                              type: 'focus',
                            },
                            { time: '11:30-11:45', title: 'Break / Walk', type: 'break' },
                            { time: '11:45-12:30', title: 'Code Review Session', type: 'focus' },
                            { time: '12:30-13:30', title: 'Lunch Break', type: 'break' },
                            {
                              time: '15:30-16:15',
                              title: 'Client Call - Beta Corp',
                              type: 'meeting',
                            },
                          ].map((event, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                            >
                              <div className="w-20 text-xs font-mono text-muted-foreground">
                                {event.time}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm truncate">{event.title}</p>
                                <Badge variant="outline" className="text-xs mt-0.5">
                                  {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platforms */}
        <section className="py-20 px-4 relative z-10">
          <div className="max-w-7xl mx-auto text-center space-y-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              Available Everywhere You Work
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {[
                { icon: Monitor, label: 'Desktop Web', desc: 'Full-featured dashboard' },
                { icon: Laptop, label: 'Tablet', desc: 'Adaptive two-panel layout' },
                { icon: Smartphone, label: 'Mobile', desc: 'Bottom nav, focused views' },
              ].map((platform, index) => (
                <motion.div
                  key={platform.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center gap-3 max-w-xs"
                >
                  <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <platform.icon className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold">{platform.label}</h3>
                  <p className="text-sm text-muted-foreground">{platform.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-8 md:p-12 border border-primary/20"
            >
              <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-4">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-sm font-medium">Free 14-day trial • No credit card</span>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold">
                Ready to reclaim your time?
              </h2>
              <p className="text-lg text-muted-foreground mt-4">
                Join thousands of professionals who let AI handle the scheduling so they can focus
                on the work that matters.
              </p>
              <Button size="xl" className="gap-2 w-full sm:w-auto mx-auto" asChild>
                <Link href="/onboarding">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 border-t border-border/50 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" />
                <span className="font-heading text-xl font-bold">Chronova</span>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                An AI command center for time — not a conventional calendar.
              </p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  Security
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
