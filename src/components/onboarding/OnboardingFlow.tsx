'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Zap,
  User,
  Briefcase,
  Clock,
  Brain,
  Target,
  Calendar,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { OnboardingData, Role } from '@/types'

const steps = [
  { id: 'role', title: 'Your Role', icon: Briefcase, description: 'Helps us tailor prioritization to your work style' },
  { id: 'hours', title: 'Working Hours', icon: Clock, description: 'When are you typically available for deep work?' },
  { id: 'energy', title: 'Peak Energy', icon: Zap, description: 'When do you feel most focused and creative?' },
  { id: 'focus', title: 'Focus Length', icon: Brain, description: 'How long are your ideal deep work sessions?' },
  { id: 'challenge', title: 'Main Challenge', icon: Target, description: 'What is your biggest productivity struggle?' },
  { id: 'calendar', title: 'Calendar Sync', icon: Calendar, description: 'Connect your calendar for automatic scheduling' },
]

export function OnboardingFlow({ onComplete, initialData }: { onComplete: (data: OnboardingData) => void; initialData?: Partial<OnboardingData> }) {
  const [currentStep, setCurrentStep] = React.useState(0)
  const [formData, setFormData] = React.useState<OnboardingData>({
    role: 'freelancer',
    workingHours: { start: '09:00', end: '18:00' },
    peakEnergy: 'morning',
    focusSessionLength: 90,
    productivityChallenge: '',
    calendarConnected: false,
    ...initialData,
  })

  const currentStepData = steps[currentStep]

  const updateField = <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      onComplete(formData)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-card border border-border/50 shadow-2xl"
      >
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="icon" onClick={() => onComplete({ ...formData, role: 'freelancer' as Role })} aria-label="Skip onboarding">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-heading text-xl font-semibold">Welcome to Chronova</h1>
                <p className="text-sm text-muted-foreground">Let's set up your AI-powered schedule</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{currentStep + 1} of {steps.length}</span>
            </div>
          </div>

          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepData.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-6 pt-4"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <currentStepData.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold">{currentStepData.title}</h2>
                <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
              </div>
            </div>

            {renderStepContent(currentStepData.id, formData, updateField)}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between border-t border-border/50 p-6">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleNext} className="ml-auto">
            {currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

function renderStepContent(stepId: string, data: OnboardingData, updateField: (field: keyof OnboardingData, value: any) => void) {
  switch (stepId) {
    case 'role':
      return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(['student', 'freelancer', 'professional', 'founder'] as Role[]).map(role => (
            <button
              key={role}
              onClick={() => updateField('role', role)}
              className={cn(
                'relative flex flex-col items-start gap-2 rounded-xl border p-4 transition-all',
                data.role === role
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border/50 hover:border-border hover:bg-accent/50'
              )}
            >
              <p className="font-medium capitalize">{role}</p>
              <p className="text-sm text-muted-foreground">
                {role === 'student' && 'Classes, assignments, study sessions'}
                {role === 'freelancer' && 'Client projects, billing, multiple contexts'}
                {role === 'professional' && 'Meetings, deep work, career growth'}
                {role === 'founder' && 'Strategy, fundraising, team management'}
              </p>
              {data.role === role && (
                <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </button>
          ))}
        </div>
      )

    case 'hours':
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="start-time">Work Day Starts</Label>
            <Input
              id="start-time"
              type="time"
              value={data.workingHours.start}
              onChange={e => updateField('workingHours', { ...data.workingHours, start: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="end-time">Work Day Ends</Label>
            <Input
              id="end-time"
              type="time"
              value={data.workingHours.end}
              onChange={e => updateField('workingHours', { ...data.workingHours, end: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>
      )

    case 'energy':
      return (
        <div className="space-y-3">
          {['morning', 'afternoon', 'evening'].map(period => (
            <button
              key={period}
              onClick={() => updateField('peakEnergy', period as 'morning' | 'afternoon' | 'evening')}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg border p-4 transition-all text-left',
                data.peakEnergy === period
                  ? 'border-primary bg-primary/5'
                  : 'border-border/50 hover:border-border hover:bg-accent/50'
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                {period === 'morning' && <Sun className="h-5 w-5" />}
                {period === 'afternoon' && <Clock className="h-5 w-5" />}
                {period === 'evening' && <Moon className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <p className="font-medium capitalize">{period}</p>
                <p className="text-sm text-muted-foreground">
                  {period === 'morning' && 'Peak energy early in the day (6am-12pm)'}
                  {period === 'afternoon' && 'Peak energy mid-day (12pm-6pm)'}
                  {period === 'evening' && 'Peak energy late in the day (6pm-12am)'}
                </p>
              </div>
              {data.peakEnergy === period && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </button>
          ))}
        </div>
      )

    case 'focus':
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Recommended based on ultradian rhythms (90 min cycles)</p>
          <Select value={String(data.focusSessionLength)} onValueChange={v => updateField('focusSessionLength', Number(v))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select session length" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 minutes (Pomodoro)</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">60 minutes</SelectItem>
              <SelectItem value="90">90 minutes (Ultradian rhythm)</SelectItem>
              <SelectItem value="120">120 minutes (Deep work block)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )

    case 'challenge':
      return (
        <div>
          <Label htmlFor="challenge">What is your biggest productivity challenge?</Label>
          <Textarea
            id="challenge"
            value={data.productivityChallenge}
            onChange={e => updateField('productivityChallenge', e.target.value)}
            placeholder="e.g., Context switching between client projects, procrastination on big tasks, too many meetings..."
            className="mt-1 min-h-[100px]"
            rows={4}
          />
          <p className="text-sm text-muted-foreground mt-2">This helps AI understand your patterns and give better recommendations.</p>
        </div>
      )

    case 'calendar':
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Connect Google Calendar</p>
                <p className="text-sm text-muted-foreground">Automatically sync meetings and events</p>
              </div>
            </div>
            <Switch
              checked={data.calendarConnected}
              onCheckedChange={checked => updateField('calendarConnected', checked)}
            />
          </div>
          <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="font-medium mb-2">Privacy First</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>We only read event titles, times, and attendees</li>
              <li>No event descriptions or private details accessed</li>
              <li>Data encrypted in transit and at rest</li>
              <li>Disconnect anytime from Settings</li>
            </ul>
          </div>
        </div>
      )

    default:
      return null
  }
}

import { Sun, Moon, X } from 'lucide-react'

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {}
interface RadioGroupItemProps extends React.HTMLAttributes<HTMLButtonElement> {
  value: string
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('grid gap-2', className)} {...props} >
    {children}
  </div>
))
RadioGroup.displayName = 'RadioGroup'

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ className, value, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'relative flex items-center gap-2 rounded-lg border p-3 text-left transition-all hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      type="button"
      role="radio"
      aria-checked={false}
      {...props}
    >
      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background">
        <span className="h-2 w-2 rounded-full bg-primary opacity-0 peer-data-[state=checked]:opacity-100 transition-opacity" />
      </span>
      {children}
    </button>
  )
)
RadioGroupItem.displayName = 'RadioGroupItem'