'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Palette, 
  Clock, 
  Bell, 
  Calendar, 
  Shield, 
  Brain,
  Zap,
  Eye,
  Monitor,
  MousePointer,
  Keyboard,
  Languages,
  Save,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserProfile, Theme } from '@/types'

interface SettingsViewProps {
  user: UserProfile
  onUpdate: (updates: Partial<UserProfile>) => void
  reducedMotion: boolean
  onReducedMotionChange: (value: boolean) => void
}

const themes: { value: Theme; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'dark', label: 'Dark', description: 'Midnight theme with animated background', icon: <Moon className="h-4 w-4" /> },
  { value: 'light', label: 'Light', description: 'Clean cloud-like neutral theme', icon: <Sun className="h-4 w-4" /> },
  { value: 'system', label: 'System', description: 'Follow OS preference automatically', icon: <Monitor className="h-4 w-4" /> },
]

const roles = [
  { value: 'student', label: 'Student', description: 'Classes, assignments, study sessions' },
  { value: 'freelancer', label: 'Freelancer', description: 'Client projects, billing, multiple contexts' },
  { value: 'professional', label: 'Professional', description: 'Meetings, deep work, career growth' },
  { value: 'founder', label: 'Founder', description: 'Strategy, fundraising, team management' },
]

const energyPeriods = [
  { value: 'morning', label: 'Morning (6am-12pm)', description: 'Peak energy early in the day' },
  { value: 'afternoon', label: 'Afternoon (12pm-6pm)', description: 'Peak energy mid-day' },
  { value: 'evening', label: 'Evening (6pm-12am)', description: 'Peak energy late in the day' },
]

export function SettingsView({ user, onUpdate, reducedMotion, onReducedMotionChange }: SettingsViewProps) {
  const [saving, setSaving] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('appearance')

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    setSaving(false)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/50 px-4 py-4">
        <h1 className="font-heading text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Customize Chronova to match your workflow</p>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full">
          <TabsList className="h-12 w-full border-b border-border/50 bg-background/50 px-4">
            <TabsTrigger value="appearance" className="px-4">
              <Palette className="h-4 w-4 mr-2" /> Appearance
            </TabsTrigger>
            <TabsTrigger value="schedule" className="px-4">
              <Clock className="h-4 w-4 mr-2" /> Schedule
            </TabsTrigger>
            <TabsTrigger value="notifications" className="px-4">
              <Bell className="h-4 w-4 mr-2" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="integrations" className="px-4">
              <Calendar className="h-4 w-4 mr-2" /> Integrations
            </TabsTrigger>
            <TabsTrigger value="ai" className="px-4">
              <Brain className="h-4 w-4 mr-2" /> AI & Privacy
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="px-4">
              <Zap className="h-4 w-4 mr-2" /> Accessibility
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-6 space-y-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    Theme
                  </CardTitle>
                  <CardDescription>Choose your preferred color scheme</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {themes.map(theme => (
                      <button
                        key={theme.value}
                        onClick={() => onUpdate({ theme: theme.value })}
                        className={cn(
                          'relative flex flex-col items-start gap-2 rounded-xl border p-4 transition-all',
                          user.theme === theme.value
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border/50 hover:border-border hover:bg-accent/50'
                        )}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          {theme.icon}
                        </div>
                        <div>
                          <p className="font-medium">{theme.label}</p>
                          <p className="text-xs text-muted-foreground">{theme.description}</p>
                        </div>
                        {user.theme === theme.value && (
                          <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    Animated Background
                  </CardTitle>
                  <CardDescription>Control the live wallpaper animation</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable Animation</p>
                      <p className="text-sm text-muted-foreground">Subtle atmospheric lighting, drifting stars, and timeline grid</p>
                    </div>
                    <Switch checked={!reducedMotion} onCheckedChange={onReducedMotionChange} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Reduced Motion</p>
                      <p className="text-sm text-muted-foreground">Respects system preference, replaces animations with static background</p>
                    </div>
                    <Switch checked={reducedMotion} onCheckedChange={onReducedMotionChange} />
                  </div>
                </CardContent>
              </Card>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="schedule" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-6 space-y-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Working Hours
                  </CardTitle>
                  <CardDescription>Set your typical availability for scheduling</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="work-start">Start Time</Label>
                      <Input
                        id="work-start"
                        type="time"
                        value={user.workingHours.start}
                        onChange={(e) => onUpdate({ workingHours: { ...user.workingHours, start: e.target.value } })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="work-end">End Time</Label>
                      <Input
                        id="work-end"
                        type="time"
                        value={user.workingHours.end}
                        onChange={(e) => onUpdate({ workingHours: { ...user.workingHours, end: e.target.value } })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Energy Preferences
                  </CardTitle>
                  <CardDescription>When do you have the most energy for deep work?</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {energyPeriods.map(period => (
                      <button
                        key={period.value}
                        onClick={() => onUpdate({ peakEnergy: period.value as 'morning' | 'afternoon' | 'evening' })}
                        className={cn(
                          'w-full flex items-center gap-3 rounded-lg border p-4 transition-all text-left',
                          user.peakEnergy === period.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border/50 hover:border-border hover:bg-accent/50'
                        )}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          {period.value === 'morning' && <Sun className="h-5 w-5" />}
                          {period.value === 'afternoon' && <Clock className="h-5 w-5" />}
                          {period.value === 'evening' && <Moon className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{period.label}</p>
                          <p className="text-sm text-muted-foreground">{period.description}</p>
                        </div>
                        {user.peakEnergy === period.value && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Focus Session Length
                  </CardTitle>
                  <CardDescription>Default duration for deep work blocks</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Select value={String(user.focusSessionLength)} onValueChange={v => onUpdate({ focusSessionLength: Number(v) })}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 minutes (Pomodoro)</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes (Ultradian)</SelectItem>
                      <SelectItem value="120">120 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Role
                  </CardTitle>
                  <CardDescription>Helps AI tailor prioritization to your work style</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {roles.map(role => (
                      <button
                        key={role.value}
                        onClick={() => onUpdate({ role: role.value as any })}
                        className={cn(
                          'flex flex-col items-start gap-2 rounded-xl border p-4 transition-all',
                          user.role === role.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border/50 hover:border-border hover:bg-accent/50'
                        )}
                      >
                        <p className="font-medium">{role.label}</p>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                        {user.role === role.value && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent              </Card>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="notifications" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-6 space-y-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notification Intensity
                  </CardTitle>
                  <CardDescription>How often should we notify you?</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  {['minimal', 'balanced', 'detailed'].map(level => (
                    <label key={level} className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-accent/50">
                      <input type="radio" name="notifications" defaultChecked={level === 'balanced'} className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium capitalize">{level}</p>
                        <p className="text-sm text-muted-foreground">
                          {level === 'minimal' && 'Only critical alerts and daily summary'}
                          {level === 'balanced' && 'Important reminders, schedule changes, and insights'}
                          {level === 'detailed' && 'All AI recommendations, every schedule change, and hourly updates'}
                        </p>
                      </div>
                    </label>
                  ))}
                </CardContent>
              </Card>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="integrations" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-6 space-y-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Calendar Integration
                  </CardTitle>
                  <CardDescription>Connect your calendar for automatic event sync</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="space-y-3">
                    {['Google Calendar', 'Outlook', 'Apple Calendar', 'CalDAV'].map(cal => (
                      <div key={cal} className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{cal}</p>
                            <p className="text-sm text-muted-foreground">{cal === 'Google Calendar' ? 'Connected' : 'Not connected'}</p>
                          </div>
                        </div>
                        <Button variant={cal === 'Google Calendar' ? 'outline' : 'default'} size="sm">
                          {cal === 'Google Calendar' ? 'Disconnect' : 'Connect'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="ai" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-6 space-y-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    AI Controls
                  </CardTitle>
                  <CardDescription>Configure how AI assists your planning</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Auto-prioritize tasks</p>
                        <p className="text-sm text-muted-foreground">AI automatically scores and ranks tasks by urgency, impact, and energy fit</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Auto-schedule suggestions</p>
                        <p className="text-sm text-muted-foreground">AI proposes schedule changes when conflicts or energy mismatches detected</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Explain reasoning</p>
                        <p className="text-sm text-muted-foreground">Show why tasks were moved or prioritized in the activity feed</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Learn from behavior</p>
                        <p className="text-sm text-muted-foreground">AI adapts to your completion patterns and energy rhythms over time</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-destructive/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-destructive" />
                    Privacy & Data
                  </CardTitle>
                  <CardDescription>Control your data and AI processing</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start gap-3">
                      <Download className="h-4 w-4" />
                      Export All Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-3">
                      <Database className="h-4 w-4" />
                      View Stored Data
                    </Button>
                    <Button variant="destructive" className="w-full justify-start gap-3">
                      <Trash2 className="h-4 w-4" />
                      Delete Account & Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="accessibility" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-6 space-y-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MousePointer className="h-5 w-5 text-primary" />
                    Interaction
                  </CardTitle>
                  <CardDescription>Customize how you interact with Chronova</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Reduce Motion</p>
                        <p className="text-sm text-muted-foreground">Minimize animations and transitions (respects system setting)</p>
                      </div>
                      <Switch checked={reducedMotion} onCheckedChange={onReducedMotionChange} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">High Contrast</p>
                        <p className="text-sm text-muted-foreground">Increase contrast ratios for better visibility</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Keyboard Navigation</p>
                        <p className="text-sm text-muted-foreground">Enhanced focus indicators and shortcut hints</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Screen Reader Optimizations</p>
                        <p className="text-sm text-muted-foreground">Additional ARIA labels and live regions</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Keyboard className="h-5 w-5 text-primary" />
                    Keyboard Shortcuts
                  </CardTitle>
                  <CardDescription>Quick actions at your fingertips</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      ['⌘K', 'Open Search'],
                      ['⌘N', 'Quick Add Task'],
                      ['⌘P', 'AI Planner'],
                      ['⌘R', 'Rebalance Day'],
                      ['⌘1-7', 'Switch Tabs'],
                      ['⌘,', 'Settings'],
                      ['?', 'Show Shortcuts'],
                      ['Esc', 'Close Panels/Modals'],
                    ].map(([key, action]) => (
                      <div key={key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
                        <kbd className="flex items-center gap-1 rounded bg-background px-2 py-0.5 text-xs font-mono border border-border">
                          {key.split('+').map((k, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && <span className="text-muted-foreground px-1">+</span>}
                              {k}
                            </React.Fragment>
                          ))}
                        </kbd>
                        <span className="text-sm text-muted-foreground">{action}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </ScrollArea>
          </TabsContent>
        </TabsContent>
      </div>

      <div className="border-t border-border/50 p-4">
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}

import { Check, Download, Database, Trash2 } from 'lucide-react'