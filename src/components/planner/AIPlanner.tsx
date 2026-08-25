'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Send,
  Mic,
  Sparkles,
  Loader2,
  Check,
  X,
  Edit,
  RefreshCw,
  Brain,
  Zap,
  Target,
  Coffee,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  AIRecommendation,
  ScheduleChange,
  Task,
  PlanScheduleResponse,
  UnschedulableTask,
} from '@/types';
import { formatTime, formatDateShort } from '@/lib/utils';

interface AIPlannerProps {
  tasks: Task[];
  events: any[];
  energyForecast: any[];
  onApplyRecommendations: (recIds: string[]) => void;
  onDismissRecommendations: (recIds: string[]) => void;
}

const QUICK_PROMPTS = [
  {
    label: 'What should I work on next?',
    prompt: 'What should I work on right now given my current energy and schedule?',
  },
  {
    label: 'Plan my day',
    prompt: 'Create an optimal schedule for today based on my tasks and energy levels',
  },
  {
    label: "I'm feeling low energy",
    prompt: 'My energy is low today. Adjust my schedule for low-energy work only.',
  },
  {
    label: 'Unexpected meeting',
    prompt: 'A 2-hour meeting just got added at 2pm. Rebalance my day.',
  },
  {
    label: 'Brain dump',
    prompt: 'I have these tasks: [list]. Help me prioritize and schedule them.',
  },
  {
    label: 'Weekly planning',
    prompt: 'Plan my week ahead based on current workload and deadlines.',
  },
];

const RECOMMENDATION_TYPE_ICONS: Record<
  AIRecommendation['type'],
  React.ComponentType<{ className?: string }>
> = {
  reschedule: Calendar,
  prioritize: Target,
  break: Coffee,
  focus: Zap,
  delegate: AlertTriangle,
  defer: ChevronDown,
};

const RECOMMENDATION_TYPE_COLORS: Record<AIRecommendation['type'], string> = {
  reschedule: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  prioritize: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  break: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  focus: 'bg-green-500/10 text-green-400 border-green-500/20',
  delegate: 'bg-red-500/10 text-red-400 border-red-500/20',
  defer: 'bg-muted text-muted-foreground',
};

const PLAN_INTENT = /\b(plan|schedule|rebalanc)/i;

function describeUnschedulable(task: UnschedulableTask): string {
  switch (task.reason) {
    case 'past_deadline':
      return task.details?.overdueAtScheduleTime
        ? 'deadline already passed before scheduling'
        : 'cannot finish before its deadline given your availability';
    case 'conflict_exhausted':
      return 'no conflict-free working time left before its deadline';
    case 'exceeds_horizon':
      return `no free slot within the next ${String(task.details?.horizonDays ?? 14)} days`;
    case 'no_working_window':
      return 'does not fit inside your working hours';
    default:
      return 'could not be placed';
  }
}

async function fetchPlanSchedule(): Promise<PlanScheduleResponse | null> {
  try {
    const response = await fetch('/api/ai/plan-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!response.ok) return null;
    return (await response.json()) as PlanScheduleResponse;
  } catch {
    return null;
  }
}

function buildPlanResponse(
  plan: PlanScheduleResponse,
  tasks: Task[]
): { role: 'assistant'; content: string; recommendations: AIRecommendation[] } {
  const titleFor = (taskId: string) => tasks.find((t) => t.id === taskId)?.title;
  const shortId = (taskId: string) => titleFor(taskId) ?? `task ${taskId.slice(0, 8)}…`;

  const recommendations: AIRecommendation[] = plan.scheduled.map((proposal) => ({
    id: `plan-${proposal.taskId}`,
    type: 'reschedule' as const,
    title: `Schedule "${shortId(proposal.taskId)}"`,
    description: `${formatTime(new Date(proposal.startUtc))} – ${formatTime(
      new Date(proposal.endUtc)
    )} · priority ${Math.round(proposal.priorityScore)}/100`,
    reasoning:
      'Placed by the deterministic scheduler: fits your working hours, avoids existing events and blocks.',
    confidence: 0.95,
    affectedTasks: [proposal.taskId],
    proposedChanges: [],
    status: 'pending' as const,
  }));

  let content =
    plan.scheduled.length > 0
      ? `Here's your optimized schedule — ${plan.scheduled.length} block${
          plan.scheduled.length === 1 ? '' : 's'
        } placed inside your availability:`
      : 'No tasks could be scheduled right now.';

  if (plan.unschedulable.length > 0) {
    content += `\n\nCould not schedule ${plan.unschedulable.length} task${
      plan.unschedulable.length === 1 ? '' : 's'
    }:`;
    for (const entry of plan.unschedulable) {
      content += `\n• ${shortId(entry.taskId)} — ${describeUnschedulable(entry)}`;
    }
  }

  return { role: 'assistant', content, recommendations };
}

function RecommendationCard({
  recommendation,
  onAccept,
  onReject,
  onAdjust,
  tasks,
}: {
  recommendation: AIRecommendation;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onAdjust: (id: string, changes: ScheduleChange[]) => void;
  tasks: Task[];
}) {
  const Icon = RECOMMENDATION_TYPE_ICONS[recommendation.type];
  const [expanded, setExpanded] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'glass rounded-xl p-4 border-l-4 transition-all',
        recommendation.status === 'accepted' && 'border-green-500 bg-green-500/5',
        recommendation.status === 'rejected' && 'border-red-500 bg-red-500/5 opacity-50',
        recommendation.status === 'applied' && 'border-primary bg-primary/5',
        recommendation.status === 'pending' && 'border-primary'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg shrink-0',
            RECOMMENDATION_TYPE_COLORS[recommendation.type]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold">{recommendation.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{recommendation.description}</p>
            </div>
            <div className="flex items-center gap-1">
              <Badge
                variant="outline"
                className={cn(RECOMMENDATION_TYPE_COLORS[recommendation.type])}
              >
                {(recommendation.confidence * 100).toFixed(0)}% confidence
              </Badge>
            </div>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            <Brain className="h-3 w-3 inline mr-1" />
            {recommendation.reasoning}
          </div>

          {recommendation.proposedChanges.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ChevronDown
                  className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')}
                />
                View proposed changes ({recommendation.proposedChanges.length})
              </button>
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-2"
                  >
                    {recommendation.proposedChanges.map((change, index) => {
                      const task = tasks.find((t) => t.id === change.taskId);
                      return (
                        <div
                          key={index}
                          className="text-xs text-muted-foreground font-mono bg-muted/50 rounded p-2"
                        >
                          {change.type}: {task?.title || change.taskId}
                          {change.from &&
                            ` → ${formatTime(change.from.start)}-${formatTime(change.from.end)}`}
                          {change.to &&
                            ` → ${formatTime(change.to.start)}-${formatTime(change.to.end)}`}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            {recommendation.status === 'pending' && (
              <>
                <Button size="sm" onClick={() => onAccept(recommendation.id)} className="gap-1">
                  <Check className="h-3 w-3" /> Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReject(recommendation.id)}
                  className="gap-1"
                >
                  <X className="h-3 w-3" /> Dismiss
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAdjust(recommendation.id, recommendation.proposedChanges)}
                  className="gap-1"
                >
                  <Edit className="h-3 w-3" /> Adjust
                </Button>
              </>
            )}
            {recommendation.status === 'accepted' && (
              <Badge variant="success">Accepted - Ready to apply</Badge>
            )}
            {recommendation.status === 'rejected' && <Badge variant="destructive">Dismissed</Badge>}
            {recommendation.status === 'applied' && <Badge variant="default">Applied</Badge>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ChatMessage({
  role,
  content,
  recommendations = [],
  onAccept,
  onReject,
  onAdjust,
  tasks,
}: {
  role: 'user' | 'assistant';
  content: string;
  recommendations?: AIRecommendation[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onAdjust: (id: string, changes: ScheduleChange[]) => void;
  tasks: Task[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3', role === 'user' && 'flex-row-reverse')}
    >
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full shrink-0',
          role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {role === 'user' ? <Zap className="h-4 w-4" /> : <Brain className="h-4 w-4 text-primary" />}
      </div>
      <div className={cn('flex-1 max-w-2xl', role === 'user' && 'text-right')}>
        <div
          className={cn(
            'rounded-2xl p-4',
            role === 'user'
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'glass rounded-tl-sm'
          )}
        >
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
        {recommendations.length > 0 && (
          <div className="mt-3 space-y-2" role="list" aria-label="AI recommendations">
            {recommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onAccept={onAccept}
                onReject={onReject}
                onAdjust={onAdjust}
                tasks={tasks}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function AIPlanner({
  tasks,
  events,
  energyForecast,
  onApplyRecommendations,
  onDismissRecommendations,
}: AIPlannerProps) {
  const [messages, setMessages] = React.useState<
    Array<{
      role: 'user' | 'assistant';
      content: string;
      recommendations?: AIRecommendation[];
    }>
  >([
    {
      role: 'assistant',
      content:
        "Hey! I'm your AI planner. I can help you prioritize tasks, rebalance your schedule, or plan your week. What would you like to do?",
    },
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = React.useState(true);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAccept = (id: string) => {
    setMessages((prev) =>
      prev.map((msg) => ({
        ...msg,
        recommendations: msg.recommendations?.map((rec) =>
          rec.id === id ? { ...rec, status: 'accepted' as const } : rec
        ),
      }))
    );
  };

  const handleReject = (id: string) => {
    setMessages((prev) =>
      prev.map((msg) => ({
        ...msg,
        recommendations: msg.recommendations?.map((rec) =>
          rec.id === id ? { ...rec, status: 'rejected' as const } : rec
        ),
      }))
    );
  };

  const handleAdjust = (id: string, changes: ScheduleChange[]) => {
    // In real app, this would open a modal to adjust changes
    console.log('Adjust recommendation', id, changes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setShowQuickPrompts(false);

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Planning intents hit the real deterministic scheduling engine; anything
    // else (and any unauthenticated/demo fallback) keeps the chat experience.
    if (PLAN_INTENT.test(userMessage)) {
      try {
        const plan = await fetchPlanSchedule();
        setMessages((prev) => [
          ...prev,
          plan ? buildPlanResponse(plan, tasks) : generateMockResponse(userMessage, tasks),
        ]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Simulate AI response
    setTimeout(() => {
      const mockResponse = generateMockResponse(userMessage, tasks);
      setMessages((prev) => [...prev, mockResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    handleSubmit(new Event('submit') as any);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Planner
          </h1>
          <p className="text-muted-foreground">Chat with your scheduling assistant</p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Quick Prompts */}
      <AnimatePresence>
        {showQuickPrompts && messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <Card className="glass">
              <CardContent className="pt-0">
                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-3">Quick actions</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_PROMPTS.map((qp) => (
                      <Button
                        key={qp.label}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickPrompt(qp.prompt)}
                        className="whitespace-nowrap"
                      >
                        {qp.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat History */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-2">
          <div className="space-y-6 pb-4">
            {messages.map((msg, index) => (
              <ChatMessage
                key={index}
                role={msg.role}
                content={msg.content}
                recommendations={msg.recommendations || []}
                onAccept={handleAccept}
                onReject={handleReject}
                onAdjust={handleAdjust}
                tasks={tasks}
              />
            ))}
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                  <Brain className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <div className="glass rounded-2xl p-4 rounded-tl-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border/50 pt-4">
        <div className="flex items-end gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to plan your day, prioritize tasks, or handle schedule changes..."
            className="flex-1 min-h-[50px] max-h-32 resize-none"
            rows={1}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="lg"
            disabled={!input.trim() || isLoading}
            className="h-12 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Try: "Rebalance my day for low energy" or "What's my highest priority task?"
        </p>
      </form>
    </div>
  );
}

function generateMockResponse(prompt: string, tasks: Task[]) {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('next') || lowerPrompt.includes('priority')) {
    const topTask = tasks
      .filter((t) => t.status === 'today' || t.status === 'inbox')
      .sort((a, b) => b.aiPriorityScore - a.aiPriorityScore)[0];
    return {
      role: 'assistant' as const,
      content: topTask
        ? `Based on your current schedule and energy, I recommend **"${topTask.title}"** (AI priority: ${topTask.aiPriorityScore}%). It's due ${topTask.dueDate ? formatDateShort(topTask.dueDate) : 'soon'} and needs ${Math.round(topTask.estimatedEffort / 60)}h.`
        : 'You have no pending tasks. Great job! Want to plan tomorrow?',
      recommendations: topTask
        ? [
            {
              id: `rec-${Date.now()}`,
              type: 'prioritize' as const,
              title: `Focus on "${topTask.title}"`,
              description: 'Highest AI priority score, fits your current energy window',
              reasoning:
                'This task has the highest impact-to-effort ratio and aligns with your peak energy hours.',
              confidence: 0.92,
              affectedTasks: [topTask.id],
              proposedChanges: [],
              status: 'pending' as const,
            },
          ]
        : [],
    };
  }

  if (lowerPrompt.includes('plan') || lowerPrompt.includes('schedule')) {
    return {
      role: 'assistant' as const,
      content:
        "I've analyzed your tasks and energy forecast. Here's my proposed schedule:\n\n• 9:00-11:00: Deep work on highest priority task\n• 11:00-11:15: Break\n• 11:15-12:30: Medium priority tasks\n• 12:30-13:30: Lunch\n• 13:30-15:00: Meetings/calls\n• 15:00-15:15: Recovery break\n• 15:15-17:00: Flexible/low energy work",
      recommendations: [
        {
          id: `rec-${Date.now()}`,
          type: 'reschedule' as const,
          title: "Optimize today's schedule",
          description: 'Move deep work to 9-11am peak energy window',
          reasoning: 'Your energy forecast shows 95% capacity at 9-11am vs 45% at 2pm.',
          confidence: 0.89,
          affectedTasks: tasks
            .filter((t) => t.status === 'today')
            .slice(0, 3)
            .map((t) => t.id),
          proposedChanges: [],
          status: 'pending' as const,
        },
        {
          id: `rec-${Date.now() + 1}`,
          type: 'break' as const,
          title: 'Add recovery breaks',
          description: '15-min breaks after each 90-min focus block',
          reasoning:
            'Research shows 90-min ultradian rhythms require recovery for sustained performance.',
          confidence: 0.94,
          affectedTasks: [],
          proposedChanges: [],
          status: 'pending' as const,
        },
      ],
    };
  }

  if (lowerPrompt.includes('low energy') || lowerPrompt.includes('tired')) {
    return {
      role: 'assistant' as const,
      content:
        "Low energy detected. I'll shift your schedule to low-effort, high-impact work only:\n\n• Move all deep work to tomorrow\n• Keep only: admin, email, review tasks\n• Add 20-min walk after lunch\n• Suggest 20-min power nap at 2pm",
      recommendations: [
        {
          id: `rec-${Date.now()}`,
          type: 'defer' as const,
          title: 'Defer high-energy tasks',
          description: 'Move deep work tasks to tomorrow morning',
          reasoning:
            "Your current energy level won't support quality deep work. Better to delay than produce subpar output.",
          confidence: 0.88,
          affectedTasks: tasks.filter((t) => t.energyRequired === 'high').map((t) => t.id),
          proposedChanges: [],
          status: 'pending' as const,
        },
      ],
    };
  }

  return {
    role: 'assistant' as const,
    content:
      'I understand. Let me analyze your situation and provide tailored recommendations. Could you share more details about your current tasks and constraints?',
    recommendations: [],
  };
}
