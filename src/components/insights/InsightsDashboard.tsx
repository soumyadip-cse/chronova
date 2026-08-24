'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Brain,
  Target,
  RefreshCw,
  Download,
  BarChart3,
  LineChart,
  PieChart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { InsightData } from '@/types';

const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--accent))',
  muted: 'hsl(var(--muted-foreground))',
  success: 'hsl(142 76% 36%)',
  warning: 'hsl(43 100% 58%)',
  danger: 'hsl(0 84% 60%)',
};

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg p-3 border border-border/50 shadow-lg">
        <p className="font-medium text-xs">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()}
            {entry.payload?.unit || ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function PlannedVsCompletedChart({ data }: { data: InsightData['plannedVsCompleted'] }) {
  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Planned vs Completed Focus Time
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
                }
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => `${Math.round(v / 60)}h`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="planned"
                name="Planned"
                fill="hsl(var(--primary)/0.3)"
                stroke="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="completed"
                name="Completed"
                fill="hsl(142 76% 36%/0.3)"
                stroke="hsl(142 76% 36%)"
                radius={[4, 4, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>
            Avg completion:{' '}
            {Math.round(
              (data.reduce((a, b) => a + b.completed / b.planned, 0) / data.length) * 100
            )}
            %
          </span>
          <span>7-day trend</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductiveHoursChart({ data }: { data: InsightData['productiveHours'] }) {
  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <LineChart className="h-5 w-5 text-primary" />
          Most Productive Hours
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="productivityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => `${v}:00`}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                domain={[0, 1]}
                tickFormatter={(v) => `${Math.round(v * 100)}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="productivity"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#productivityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            Peak: {data.reduce((a, b) => (a.productivity > b.productivity ? a : b)).hour}:00 (
            {Math.round(
              data.reduce((a, b) => (a.productivity > b.productivity ? a : b)).productivity * 100
            )}
            %)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function RolloverPatternChart({ data }: { data: InsightData['rolloverPattern'] }) {
  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-amber-400" />
            Task Rollover Pattern
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
                }
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => v}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="rolledOver"
                fill="hsl(43 100% 58%/0.3)"
                stroke="hsl(43 100% 58%)"
                radius={[4, 4, 0, 0]}
                name="Rolled Over"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span>Total rolled over: {data.reduce((a, b) => a + b.rolledOver, 0)} tasks</span>
          <span>
            Avg/day: {(data.reduce((a, b) => a + b.rolledOver, 0) / data.length).toFixed(1)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkloadBalanceChart({ data }: { data: InsightData['workloadBalance'] }) {
  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    'hsl(142 76% 36%)',
    'hsl(262 83% 58%)',
    'hsl(340 82% 52%)',
  ];

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          Workload Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-64 items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="hours"
                nameKey="category"
                label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function BurnoutRiskCard({
  risk,
  recommendations,
}: {
  risk: InsightData['burnoutRisk'];
  recommendations: string[];
}) {
  const riskConfig = {
    low: { color: 'hsl(142 76% 36%)', label: 'Low Risk', icon: TrendingUp },
    medium: { color: 'hsl(43 100% 58%)', label: 'Medium Risk', icon: AlertTriangle },
    high: { color: 'hsl(0 84% 60%)', label: 'High Risk', icon: AlertTriangle },
  };

  const config = riskConfig[risk];

  return (
    <Card
      className={cn(
        'glass border-l-4',
        `border-${risk === 'high' ? 'red' : risk === 'medium' ? 'amber' : 'green'}-500`
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <config.icon className="h-5 w-5" style={{ color: config.color }} />
          Burnout Risk: {config.label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${risk === 'low' ? 25 : risk === 'medium' ? 60 : 85}%` }}
              className="h-full rounded-full transition-all duration-1000"
              style={{ backgroundColor: config.color }}
            />
          </div>
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-2 text-sm"
              >
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                <span>{rec}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeeklyReflectionCard({ reflection }: { reflection: string }) {
  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Weekly Reflection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none text-muted-foreground">
          <p>{reflection}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function InsightsDashboard({ data }: { data: InsightData }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Insights</h1>
          <p className="text-muted-foreground">Your productivity analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Focus Completion</p>
                <p className="font-heading text-3xl font-bold text-primary">
                  {Math.round(
                    (data.plannedVsCompleted[data.plannedVsCompleted.length - 1]?.completed /
                      (data.plannedVsCompleted[data.plannedVsCompleted.length - 1]?.planned || 1)) *
                      100
                  )}
                  %
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Daily Focus</p>
                <p className="font-heading text-3xl font-bold">
                  {Math.round(
                    data.plannedVsCompleted.reduce((a, b) => a + b.completed, 0) /
                      data.plannedVsCompleted.length /
                      60
                  )}
                  h
                </p>
              </div>
              <Target className="h-12 w-12 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasks Rollover</p>
                <p className="font-heading text-3xl font-bold text-amber-400">
                  {data.rolloverPattern.reduce((a, b) => a + b.rolledOver, 0)}
                </p>
              </div>
              <TrendingDown className="h-12 w-12 text-amber-400/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Burnout Risk</p>
                <Badge
                  variant={
                    data.burnoutRisk === 'high'
                      ? 'destructive'
                      : data.burnoutRisk === 'medium'
                        ? 'warning'
                        : 'success'
                  }
                >
                  {data.burnoutRisk.charAt(0).toUpperCase() + data.burnoutRisk.slice(1)}
                </Badge>
              </div>
              <AlertTriangle className="h-12 w-12 text-amber-400/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="workload">Workload</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <PlannedVsCompletedChart data={data.plannedVsCompleted} />
            <RolloverPatternChart data={data.rolloverPattern} />
          </div>
          <BurnoutRiskCard risk={data.burnoutRisk} recommendations={data.recommendations} />
        </TabsContent>

        <TabsContent value="productivity">
          <div className="grid gap-6 md:grid-cols-2">
            <ProductiveHoursChart data={data.productiveHours} />
            <div className="space-y-6">
              <Card className="glass">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Energy Forecast Accuracy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                      <span>Morning (9-11am)</span>
                      <span className="font-semibold text-green-400">92% accurate</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10">
                      <span>Afternoon (1-4pm)</span>
                      <span className="font-semibold text-amber-400">78% accurate</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                      <span>Evening (5-8pm)</span>
                      <span className="font-semibold text-red-400">45% accurate</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Task Completion by Priority
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    {['critical', 'high', 'medium', 'low'].map((p) => (
                      <div key={p} className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            p === 'critical' && 'bg-red-500/10 text-red-400 border-red-500/20',
                            p === 'high' && 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                            p === 'medium' && 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                            p === 'low' && 'bg-muted text-muted-foreground'
                          )}
                          style={{ minWidth: 70 }}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </Badge>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${p === 'critical' ? 95 : p === 'high' ? 87 : p === 'medium' ? 72 : 55}%`,
                            }}
                            className="h-full rounded-full"
                            style={{
                              backgroundColor:
                                p === 'critical'
                                  ? 'hsl(0 84% 60%)'
                                  : p === 'high'
                                    ? 'hsl(43 100% 58%)'
                                    : p === 'medium'
                                      ? 'hsl(var(--primary))'
                                      : 'hsl(var(--muted-foreground))',
                            }}
                          />
                        </div>
                        <span className="text-muted-foreground w-12 text-right">
                          {p === 'critical' ? 95 : p === 'high' ? 87 : p === 'medium' ? 72 : 55}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="workload">
          <div className="grid gap-6 md:grid-cols-2">
            <WorkloadBalanceChart data={data.workloadBalance} />
            <WeeklyReflectionCard reflection={data.weeklyReflection} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { CheckCircle } from 'lucide-react';
