'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Send, 
  Zap, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  Calendar,
  Brain,
  MessageSquare,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { AIRecommendation, Task } from '@/types'

interface AIPlannerProps {
  tasks: Task[]
  onRecommendationAccept: (rec: AIRecommendation) => void
  onRecommendationReject: (rec: AIRecommendation) => void
  onApplyRecommendations: (recs: AIRecommendation[]) => void
  recommendations: AIRecommendation[]
  isProcessing: boolean
}

const quickPrompts = [
  "What should I work on next?",
  "I'm feeling overwhelmed, help me prioritize",
  "Reschedule my afternoon - unexpected meeting at 2pm",
  "Plan tomorrow based on today's progress",
  "I have low energy today, adjust my schedule",
  "Help me batch similar tasks together",
]

export function AIPlanner({
  tasks,
  onRecommendationAccept,
  onRecommendationReject,
  onApplyRecommendations,
  recommendations,
  isProcessing,
}: AIPlannerProps) {
  const [input, setInput] = React.useState('')
  const [chatHistory, setChatHistory] = React.useState<Array<{role: 'user' | 'assistant'; content: string; recommendations?: AIRecommendation[]}>>([
    { role: 'assistant', content: "Hi! I'm your AI planner. I can help you prioritize tasks, reschedule your day, or answer questions about your schedule. What would you like to do?" }
  ])
  const [showRecommendations, setShowRecommendations] = React.useState(false)
  const pendingRecs = recommendations.filter(r => r.status === 'pending')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return

    const userMessage = input.trim()
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }])
    setInput('')

    setTimeout(() => {
      const response = generateAIResponse(userMessage, tasks)
      setChatHistory(prev => [...prev, { role: 'assistant', ...response }])
      if (response.recommendations) {
        setShowRecommendations(true)
      }
    }, 800)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold">AI Planner</h2>
            <p className="text-sm text-muted-foreground">Ask me anything about your schedule</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4 max-w-2xl mx-auto">
            {chatHistory.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}
              >
                <div className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}>
                  {msg.role === 'user' ? (
                    <Zap className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Brain className="h-4 w-4 text-primary" aria-hidden="true" />
                  )}
                </div>
                <div className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3',
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                    : 'bg-muted rounded-tl-sm'
                )}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.recommendations.map((rec) => (
                        <RecommendationCard
                          key={rec.id}
                          recommendation={rec}
                          onAccept={() => onRecommendationAccept(rec)}
                          onReject={() => onRecommendationReject(rec)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="border-t border-border/50 p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <Button
                key={prompt}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(prompt)
                  handleSubmit(new Event('submit') as unknown as React.FormEvent)
                }}
                className="h-8 text-xs"
              >
                {prompt}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <CustomTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me to reschedule, prioritize, or explain your day..."
              className="flex-1 min-h-[60px] max-h-[120px] resize-none"
              disabled={isProcessing}
              aria-label="Ask AI planner"
            />
            <Button
              type="submit"
              size="lg"
              disabled={!input.trim() || isProcessing}
              className="h-[60px]"
            >
              {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>

          {pendingRecs.length > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/10 p-3">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>{pendingRecs.length} pending recommendation{pendingRecs.length > 1 ? 's' : ''}</span>
              </div>
              <Button variant="premium" size="sm" onClick={() => onApplyRecommendations(pendingRecs)}>
                Apply All
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

function RecommendationCard({ recommendation, onAccept, onReject }: { recommendation: AIRecommendation; onAccept: () => void; onReject: () => void }) {
  const typeIcons = {
    reschedule: Clock,
    prioritize: Zap,
    break: Calendar,
    focus: Brain,
    delegate: AlertCircle,
    defer: RotateCcw,
  }
  const Icon = typeIcons[recommendation.type] || Zap

  return (
    <Card className="glass border-primary/20">
      <CardContent className="pt-3 pb-3 pr-3 pl-3">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{recommendation.title}</h4>
              <span className="text-xs text-muted-foreground">{Math.round(recommendation.confidence * 100)}% confidence</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{recommendation.description}</p>
            <p className="text-xs text-primary/80 mt-2">{recommendation.reasoning}</p>
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" variant="premium" onClick={onAccept}>
                <CheckCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={onReject}>
                <XCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                Reject
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface CustomTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const CustomTextarea = React.forwardRef<HTMLTextAreaElement, CustomTextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
)
CustomTextarea.displayName = 'CustomTextarea'

function generateAIResponse(input: string, tasks: Task[]) {
  const lower = input.toLowerCase()
  
  if (lower.includes('what should i work on') || lower.includes('next')) {
    const nextTask = tasks.filter(t => t.status === 'today' || t.status === 'inbox').sort((a, b) => b.aiPriorityScore - a.aiPriorityScore)[0]
    return {
      content: `Based on your priorities and energy, I recommend: **"${nextTask?.title || 'Review your inbox'}"** (AI Score: ${nextTask?.aiPriorityScore || 'N/A'}%). This aligns with your peak energy window and has the highest impact.`,
      recommendations: nextTask ? [{
        id: `rec-${Date.now()}`,
        type: 'prioritize',
        title: `Focus on "${nextTask.title}"`,
        description: 'Highest priority task for your current energy level',
        reasoning: 'Matches peak energy window, high impact score, and imminent deadline',
        confidence: 0.92,
        affectedTasks: [nextTask.id],
        proposedChanges: [],
        status: 'pending',
      }] : undefined
    }
  }

  if (lower.includes('overwhelmed') || lower.includes('prioritize')) {
    return {
      content: "I see you have several competing priorities. Let me help you focus on what matters most right now. Your top 3 tasks by AI priority score are:\n\n1. **Prepare marketing presentation** (94%) - Due Friday, high impact\n2. **Client call prep - Beta Corp** (98%) - Critical, before 4pm call\n3. **Code review for PR #247** (87%) - Blocking team deployment\n\nWould you like me to reschedule anything or create a focused 3-task day?",
      recommendations: [
        {
          id: `rec-${Date.now()}`,
          type: 'prioritize',
          title: 'Focus on top 3 only',
          description: 'Hide lower priority tasks until top 3 are done',
          reasoning: 'Reduces decision fatigue, increases completion rate by ~40%',
          confidence: 0.88,
          affectedTasks: ['task-1', 'task-2', 'task-5'],
          proposedChanges: [],
          status: 'pending',
        }
      ]
    }
  }

  if (lower.includes('reschedule') || lower.includes('meeting')) {
    return {
      content: "I can help reschedule your afternoon. With a 2pm meeting, I'd suggest:\n\n• Move **Code Review** to 11:45am (your balanced energy window)\n• Shift **Marketing Presentation** to 9:30-11:30am (deep work block)\n• Add 15min recovery break after 2pm meeting\n• Keep **Client Call Prep** at 3:30pm (needs high energy)\n\nThis preserves 3.5h of focused work time.",
      recommendations: [
        {
          id: `rec-${Date.now()}`,
          type: 'reschedule',
          title: 'Reschedule for 2pm meeting',
          description: 'Move code review earlier, protect deep work block',
          reasoning: 'Energy forecast shows 30% drop at 2pm. Code review needs sustained attention.',
          confidence: 0.87,
          affectedTasks: ['task-2'],
          proposedChanges: [{
            taskId: 'task-2',
            type: 'move',
            from: { start: new Date('2024-01-25T14:00:00'), end: new Date('2024-01-25T14:45:00') },
            to: { start: new Date('2024-01-25T11:45:00'), end: new Date('2024-01-25T12:30:00') }
          }],
          status: 'pending',
        }
      ]
    }
  }

  return {
    content: "I'm here to help with your schedule! You can ask me things like:\n• \"What should I work on next?\"\n• \"Reschedule my afternoon - meeting at 2pm\"\n• \"I have low energy today, adjust my schedule\"\n• \"Plan tomorrow based on today's progress\"\n\nWhat would you like to do?"
  }
}