'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, 
  Calendar, 
  CheckCircle,
  X,
  Download,
  Database,
  Trash2,
  Code,
  Sun,
  Moon
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { TodayDashboard } from '@/components/dashboard/TodayDashboard'
import { SmartTaskInbox } from '@/components/tasks/SmartTaskInbox'
import { AIPlanner } from '@/components/planner/AIPlanner'
import { CalendarView } from '@/components/calendar/CalendarView'
import { InsightsView } from '@/components/insights/InsightsView'
import { SettingsView } from '@/components/settings/SettingsView'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'
import { ProjectStory } from '@/components/onboarding/ProjectStory'
import { demoUser, demoTasks, demoEvents, demoEnergyForecast, demoDaySchedule, demoInsights, demoRecommendations } from '@/data/demo'
import { UserProfile, Task, CalendarEvent, EnergyLevel, TaskStatus, AIRecommendation } from '@/types'
import { formatTime } from '@/lib/utils'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export default function HomePage() {
  const [activeTab, setActiveTab] = React.useState<'today' | 'inbox' | 'planner' | 'calendar' | 'insights' | 'settings' | 'story'>('today')
  const [user, setUser] = React.useState<UserProfile>(demoUser)
  const [tasks, setTasks] = React.useState<Task[]>(demoTasks)
  const [events, setEvents] = React.useState<CalendarEvent[]>(demoEvents)
  const [energyLevel, setEnergyLevel] = React.useState<EnergyLevel>('balanced')
  const [energyForecast] = React.useState<EnergyForecast[]>(demoEnergyForecast)
  const [daySchedule] = React.useState(demoDaySchedule)
  const [insights] = React.useState(demoInsights)
  const [recommendations, setRecommendations] = React.useState<AIRecommendation[]>(demoRecommendations)
  const [showOnboarding, setShowOnboarding] = React.useState(false)
  const [rightPanelOpen, setRightPanelOpen] = React.useState(false)
  const [rightPanelContent, setRightPanelContent] = React.useState<React.ReactNode>(null)
  const [reducedMotion, setReducedMotion] = React.useState(false)
  const [selectedTasks, setSelectedTasks] = React.useState<string[]>([])
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isRebalancing, setIsRebalancing] = React.useState(false)
  const [calendarView, setCalendarView] = React.useState<'day' | 'week' | 'agenda'>('day')
  const [selectedDate, setSelectedDate] = React.useState(new Date())

  const handleTaskClick = (task: Task) => {
    setRightPanelContent(
      <TaskDetailPanel task={task} onClose={() => setRightPanelOpen(false)} onUpdate={handleTaskUpdate} />
    )
    setRightPanelOpen(true)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setRightPanelContent(
      <EventDetailPanel event={event} onClose={() => setRightPanelOpen(false)} />
    )
    setRightPanelOpen(true)
  }

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
    toast.success('Task updated')
  }

  const handleTaskDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    toast.success('Task deleted')
  }

  const handleBulkAction = (action: string, ids: string[]) => {
    switch (action) {
      case 'schedule-today':
        setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, status: 'today' as TaskStatus, scheduledAt: new Date() } : t))
        toast.success(`${ids.length} tasks scheduled for today`)
        break
      case 'defer':
        setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, status: 'upcoming' as TaskStatus } : t))
        toast.success(`${ids.length} tasks deferred`)
        break
      case 'delete':
        setTasks(prev => prev.filter(t => !ids.includes(t.id)))
        toast.success(`${ids.length} tasks deleted`)
        break
    }
    setSelectedTasks([])
  }

  const handleQuickAdd = (input: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: input.split(',')[0] || input,
      description: input,
      status: 'inbox',
      priority: 'medium',
      aiPriorityScore: Math.floor(Math.random() * 30) + 50,
      estimatedEffort: 60,
      impact: 5,
      energyRequired: 'balanced',
      projectId: 'proj-1',
      projectName: 'Client Alpha',
      projectColor: '#06b6d4',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['quick-add'],
    }
    setTasks(prev => [newTask, ...prev])
    toast.success('Task added to inbox')
  }

  const handleSearch = () => {
    setActiveTab('inbox')
  }

  const handleRebalance = async () => {
    setIsRebalancing(true)
    await new Promise(r => setTimeout(r, 1500))
    
    const updatedRecs = recommendations.map(r => ({ ...r, status: 'applied' as const }))
    setRecommendations(updatedRecs)
    
    setTasks(prev => prev.map(t => {
      const rec = updatedRecs.find(r => r.affectedTasks.includes(t.id))
      if (rec && rec.proposedChanges[0]?.to) {
        return { ...t, scheduledAt: rec.proposedChanges[0].to?.start, updatedAt: new Date() }
      }
      return t
    }))
    
    setEvents(prev => [
      ...prev.filter(e => e.type !== 'focus'),
      { id: `evt-${Date.now()}`, title: 'Deep Work: Marketing Presentation', start: new Date('2024-01-25T09:30:00'), end: new Date('2024-01-25T11:30:00'), type: 'focus', color: '#22c55e', taskId: 'task-1' },
      { id: `evt-${Date.now()+1}`, title: 'Code Review Session', start: new Date('2024-01-25T11:45:00'), end: new Date('2024-01-25T12:30:00'), type: 'focus', color: '#22c55e', taskId: 'task-2' },
      { id: `evt-${Date.now()+2}`, title: 'Recovery Break', start: new Date('2024-01-25T16:15:00'), end: new Date('2024-01-25T16:30:00'), type: 'break', color: '#f59e0b' },
    ])
    
    setIsRebalancing(false)
    toast.success('Day rebalanced! 3 schedule changes applied.')
  }

  const handleRecommendationAccept = (rec: AIRecommendation) => {
    setRecommendations(prev => prev.map(r => r.id === rec.id ? { ...r, status: 'accepted' as const } : r))
    toast.success('Recommendation accepted')
  }

  const handleRecommendationReject = (rec: AIRecommendation) => {
    setRecommendations(prev => prev.map(r => r.id === rec.id ? { ...r, status: 'rejected' as const } : r))
    toast.success('Recommendation rejected')
  }

  const handleApplyRecommendations = (recs: AIRecommendation[]) => {
    recs.forEach(rec => {
      rec.proposedChanges.forEach(change => {
        if (change.to) {
          setTasks(prev => prev.map(t => t.id === change.taskId ? { ...t, scheduledAt: change.to?.start, updatedAt: new Date() } : t))
        }
      })
    })
    setRecommendations(prev => prev.map(r => recs.some(rec => rec.id === r.id) ? { ...r, status: 'applied' as const } : r))
    toast.success(`${recs.length} recommendations applied`)
  }

  const handleOnboardingComplete = (data: any) => {
    setUser(prev => ({ ...prev, ...data }))
    setShowOnboarding(false)
    toast.success('Welcome to Chronova! Your setup is complete.')
  }

  const handleThemeChange = (theme: 'dark' | 'light') => {
    setUser(prev => ({ ...prev, theme }))
    document.documentElement.classList.toggle('light', theme === 'light')
  }

  const handleReducedMotionChange = (value: boolean) => {
    setReducedMotion(value)
    setUser(prev => ({ ...prev, reducedMotion: value }))
  }

  const handleEnergyChange = (level: EnergyLevel) => {
    setEnergyLevel(level)
  }

  const handleUserUpdate = (updates: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updates }))
  }

  const tabComponents = {
    today: (
      <TodayDashboard
        tasks={tasks}
        events={events}
        energyForecast={energyForecast}
        focusTimePlanned={daySchedule.focusTimePlanned}
        focusTimeCompleted={daySchedule.focusTimeCompleted}
        energyLevel={energyLevel}
        onEnergyChange={handleEnergyChange}
        onQuickAdd={handleQuickAdd}
        onRebalance={handleRebalance}
        onTaskClick={handleTaskClick}
        onEventClick={handleEventClick}
        reducedMotion={reducedMotion}
        isRebalancing={isRebalancing}
      />
    ),
    inbox: (
      <SmartTaskInbox
        tasks={tasks}
        activeFilter={activeTab as TaskStatus}
        onFilterChange={setActiveTab as any}
        onTaskClick={handleTaskClick}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={handleTaskDelete}
        onBulkAction={handleBulkAction}
        selectedTasks={selectedTasks}
        onSelectionChange={setSelectedTasks}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
    ),
    planner: (
      <AIPlanner
        tasks={tasks}
        onRecommendationAccept={handleRecommendationAccept}
        onRecommendationReject={handleRecommendationReject}
        onApplyRecommendations={handleApplyRecommendations}
        recommendations={recommendations}
        isProcessing={false}
      />
    ),
    calendar: (
      <CalendarView
        events={events}
        energyForecast={energyForecast}
        view={calendarView}
        onViewChange={setCalendarView}
        onEventClick={handleEventClick}
        onDateChange={setSelectedDate}
        selectedDate={selectedDate}
        onCreateEvent={(date) => toast.info(`Create event for ${formatTime(date)}`)}
      />
    ),
    insights: <InsightsView data={insights} />,
    settings: (
      <SettingsView
        user={user}
        onUpdate={handleUserUpdate}
        reducedMotion={reducedMotion}
        onReducedMotionChange={handleReducedMotionChange}
      />
    ),
    story: <ProjectStory />,
  }

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  React.useEffect(() => {
    if (user.theme === 'light' || (user.theme === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches)) {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
  }, [user.theme])

  return (
    <>
      <AppLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userName={user.name}
        energyLevel={energyLevel}
        onEnergyChange={handleEnergyChange}
        onQuickAdd={handleQuickAdd}
        onSearch={handleSearch}
        theme={user.theme === 'light' ? 'light' : 'dark'}
        onThemeChange={handleThemeChange}
        onRebalance={handleRebalance}
        reducedMotion={reducedMotion}
        rightPanelOpen={rightPanelOpen}
        onRightPanelToggle={() => setRightPanelOpen(false)}
        rightPanelContent={rightPanelContent}
      >
        {tabComponents[activeTab]}
      </AppLayout>

      {showOnboarding && (
        <OnboardingFlow onComplete={handleOnboardingComplete} initialData={user} />
      )}
    </>
  )
}

function TaskDetailPanel({ task, onClose, onUpdate }: { task: Task; onClose: () => void; onUpdate: (task: Task) => void }) {
  const [localTask, setLocalTask] = React.useState(task)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-semibold">Task Details</h3>
          <p className="text-sm text-muted-foreground">{task.projectName}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Title</Label>
          <Input
            value={localTask.title}
            onChange={e => setLocalTask(prev => ({ ...prev, title: e.target.value }))}
            className="mt-1"
          />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea
            value={localTask.description || ''}
            onChange={e => setLocalTask(prev => ({ ...prev, description: e.target.value }))}
            className="mt-1"
            rows={3}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Priority</Label>
            <Select value={localTask.priority} onValueChange={v => setLocalTask(prev => ({ ...prev, priority: v as any }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Energy Required</Label>
            <Select value={localTask.energyRequired} onValueChange={v => setLocalTask(prev => ({ ...prev, energyRequired: v as any }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Estimated Effort (minutes)</Label>
            <Input
              type="number"
              value={localTask.estimatedEffort}
              onChange={e => setLocalTask(prev => ({ ...prev, estimatedEffort: Number(e.target.value) }))}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Impact (1-10)</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={localTask.impact}
              onChange={e => setLocalTask(prev => ({ ...prev, impact: Number(e.target.value) }))}
              className="mt-1"
            />
          </div>
        </div>

        {localTask.aiReasoning && (
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
            <h4 className="font-medium text-primary mb-2">AI Reasoning</h4>
            <p className="text-sm text-muted-foreground">{localTask.aiReasoning}</p>
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t border-border/50">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={() => { onUpdate({ ...localTask, updatedAt: new Date() }); onClose() }} className="flex-1">Save Changes</Button>
        </div>
      </div>
    </div>
  )
}

function EventDetailPanel({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-semibold">Event Details</h3>
          <p className="text-sm text-muted-foreground">{event.type.charAt(0).toUpperCase() + event.type.slice(1)}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Start</Label>
            <p className="mt-1 font-mono">{event.start.toLocaleString()}</p>
          </div>
          <div>
            <Label>End</Label>
            <p className="mt-1 font-mono">{event.end.toLocaleString()}</p>
          </div>
        </div>

        {event.description && (
          <div>
            <Label>Description</Label>
            <p className="mt-1 text-muted-foreground">{event.description}</p>
          </div>
        )}

        {event.location && (
          <div>
            <Label>Location</Label>
            <p className="mt-1">{event.location}</p>
          </div>
        )}

        {event.attendees && event.attendees.length > 0 && (
          <div>
            <Label>Attendees</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {event.attendees.map((attendee, i) => (
                <span key={i} className="px-2 py-1 rounded-full bg-muted text-sm">{attendee}</span>
              ))}
            </div>
          </div>
        )}

        <Button variant="outline" onClick={onClose} className="w-full mt-4">Close</Button>
      </div>
    </div>
  )
}