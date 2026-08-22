'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertTriangle, 
  Target, 
  Brain,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/tasks/SmartTaskInbox'
import { InsightData } from '@/types'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts'

export function InsightsView({ data }: { data: InsightData }) {
  const COLORS = ['#06b6d4', '#f59e0b', '#22c55e', '#8b5cf6', '#f43f5e']

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-heading text-3xl font-semibold">Insights</h1>
          <p className="text-muted-foreground">Your productivity patterns and AI-powered recommendations</p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Focus Time" 
          value={`${Math.round(data.plannedVsCompleted.reduce((sum, d) => sum + d.completed, 0) / 60)}h`} 
          subtitle={`${Math.round(data.plannedVsCompleted.reduce((sum, d) => sum + d.planned, 0) / 60)}h planned`}
          icon={<Target className="h-5 w-5" />}
          trend={{ value: 12, positive: true }}
        />
        <StatCard 
          title="Completion Rate" 
          value={`${Math.round(data.plannedVsCompleted.reduce((sum, d) => sum + d.completed, 0) / data.plannedVsCompleted.reduce((sum, d) => sum + d.planned, 0) * 100)}%`} 
          subtitle="This week"
          icon={<TrendingUp className="h-5 w-5" />}
          trend={{ value: 8, positive: true }}
        />
        <StatCard 
          title="Peak Hour" 
          value={`${data.productiveHours.reduce((max, h) => h.productivity > max.productivity ? h : max).hour}:00`} 
          subtitle="Most productive"
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard 
          title="Burnout Risk" 
          value={data.burnoutRisk.charAt(0).toUpperCase() + data.burnoutRisk.slice(1)} 
          subtitle="Based on workload patterns"
          icon={<AlertTriangle className="h-5 w-5" />}
          badge={data.burnoutRisk}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Planned vs Completed Focus Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.plannedVsCompleted} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis dataKey="date" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} width={80} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number, name: string) => [Math.round(value/60) + 'h', name === 'planned' ? 'Planned' : 'Completed']}
                  />
                  <Bar dataKey="planned" fill="#06b6d4" radius={[4, 0, 0, 4]} name="Planned" />
                  <Bar dataKey="completed" fill="#22c55e" radius={[0, 4, 4, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Productive Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.productiveHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} domain={[0, 1]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number) => [Math.round(value * 100) + '%', 'Productivity']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="productivity" 
                    stroke="#06b6d4" 
                    strokeWidth={3} 
                    dot={{ fill: '#06b6d4', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-primary" />
                Task Rollover Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.rolloverPattern} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis dataKey="date" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="rolledOver" fill="#f59e0b" radius={[4, 0, 0, 4]} name="Rolled Over">
                    {data.rolloverPattern.map((entry, index) => (
                      <Cell key={index} fill={entry.rolledOver > 2 ? '#f43f5e' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Workload Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.workloadBalance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis dataKey="category" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="hours" radius={[0, 4, 4, 0]} name="Hours">
                    {data.workloadBalance.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Weekly Reflection & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-muted-foreground">{data.weeklyReflection}</p>
              </div>
              <div className="space-y-2">
                {data.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <TrendingUp className="h-3 w-3 text-primary" />
                    </div>
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                Burnout Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Current Risk Level</p>
                  <p className="text-sm text-muted-foreground">Based on workload, rollover patterns, and energy alignment</p>
                </div>
                <Badge variant={data.burnoutRisk === 'high' ? 'destructive' : data.burnoutRisk === 'medium' ? 'outline' : 'default'}>
                  {data.burnoutRisk.toUpperCase()}
                </Badge>
              </div>
              <Progress value={data.burnoutRisk === 'high' ? 80 : data.burnoutRisk === 'medium' ? 50 : 20} className="h-3" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="font-heading text-2xl font-bold text-red-400">3</div>
                  <div className="text-xs text-muted-foreground">Days > 8h work</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="font-heading text-2xl font-bold text-amber-400">6</div>
                  <div className="text-xs text-muted-foreground">Tasks rolled over</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="font-heading text-2xl font-bold text-blue-400">2.5h</div>
                  <div className="text-xs text-muted-foreground">Avg daily focus</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  trend?: { value: number; positive: boolean }
  badge?: string
}

function StatCard({ title, value, subtitle, icon, trend, badge }: StatCardProps) {
  return (
    <Card className="glass">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="font-heading text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-2 text-xs">
                <TrendingUp className={cn('h-3 w-3', trend.positive ? 'text-green-400' : 'text-red-400')} />
                <span className={cn(trend.positive ? 'text-green-400' : 'text-red-400')}>
                  {trend.positive ? '+' : ''}{trend.value}% vs last week
                </span>
              </div>
            )}
            {badge && (
              <Badge variant={badge === 'high' ? 'destructive' : badge === 'medium' ? 'outline' : 'default'} className="mt-2">
                {badge.toUpperCase()}
              </Badge>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}