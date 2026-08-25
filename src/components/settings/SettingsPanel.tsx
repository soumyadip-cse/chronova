'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Palette,
  Clock,
  Bell,
  Calendar,
  Shield,
  Brain,
  Accessibility,
  Save,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  Zap,
  Coffee,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Tablet,
  User,
  Trash2,
  X,
  RotateCcw,
  Download,
  Target,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { UserProfile, Theme, EnergyLevel } from '@/types';
import { useTheme } from 'next-themes';

interface SettingsProps {
  user: UserProfile;
  onSave: (settings: Partial<UserProfile>) => Promise<void> | void;
  /** Streams a full account data export download. */
  onExportData?: () => Promise<void>;
  /** Deletes the account permanently; requires typed confirmation. */
  onDeleteAccount?: (confirmation: string) => Promise<void>;
  /** Called after successful deletion so the host can end the session. */
  onAccountDeleted?: () => void;
}

const DELETE_CONFIRMATION_PHRASE = 'DELETE MY ACCOUNT';

const ROLE_OPTIONS = [
  {
    value: 'student',
    label: 'Student',
    description: 'Optimized for classes, assignments, study sessions',
  },
  {
    value: 'freelancer',
    label: 'Freelancer',
    description: 'Client work, project juggling, flexible hours',
  },
  {
    value: 'professional',
    label: 'Professional',
    description: 'Corporate schedule, meetings, deep work blocks',
  },
  {
    value: 'founder',
    label: 'Founder',
    description: 'High autonomy, strategic planning, context switching',
  },
];

const ENERGY_PERIODS = [
  { value: 'morning', label: 'Morning (6am-12pm)', icon: Sun },
  { value: 'afternoon', label: 'Afternoon (12pm-6pm)', icon: Zap },
  { value: 'evening', label: 'Evening (6pm-12am)', icon: Moon },
];

const FOCUS_LENGTHS = [25, 45, 60, 90, 120];

const CHALLENGES = [
  'Context switching between projects',
  'Procrastination on important tasks',
  'Too many meetings',
  'Difficulty estimating task duration',
  'Energy crashes in afternoon',
  'Overcommitting to work',
  'Distractions and interruptions',
  'Unclear priorities',
];

export function SettingsPanel({
  user,
  onSave,
  onExportData,
  onDeleteAccount,
  onAccountDeleted,
}: SettingsProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = React.useState('appearance');

  // Data & privacy state
  const [exporting, setExporting] = React.useState(false);
  const [exportMessage, setExportMessage] = React.useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState('');
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setFormData({
      theme: user.theme,
      reducedMotion: user.reducedMotion,
      workingHours: user.workingHours,
      peakEnergy: user.peakEnergy,
      focusSessionLength: user.focusSessionLength,
      productivityChallenge: user.productivityChallenge,
      calendarConnected: user.calendarConnected,
    });
  }, [user]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Unable to save your settings. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!onExportData) return;
    setExporting(true);
    setExportMessage(null);
    try {
      await onExportData();
      setExportMessage('Export downloaded.');
      setTimeout(() => setExportMessage(null), 4000);
    } catch (error) {
      setExportMessage(error instanceof Error ? error.message : 'Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!onDeleteAccount || deleteConfirmText.trim() !== DELETE_CONFIRMATION_PHRASE) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteAccount(DELETE_CONFIRMATION_PHRASE);
      // Host ends the session; nothing else to do here.
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Deletion failed. Please try again.');
      setDeleting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      theme: user.theme,
      reducedMotion: user.reducedMotion,
      workingHours: user.workingHours,
      peakEnergy: user.peakEnergy,
      focusSessionLength: user.focusSessionLength,
      productivityChallenge: user.productivityChallenge,
      calendarConnected: user.calendarConnected,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground">Customize your Chronova experience</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg p-3"
        >
          <CheckCircle className="h-4 w-4" />
          Settings saved successfully
        </motion.div>
      )}

      {saveError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3"
          role="alert"
        >
          <AlertTriangle className="h-4 w-4" />
          {saveError}
        </motion.div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Clock className="h-4 w-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Calendar className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Shield className="h-4 w-4 mr-2" />
            Privacy & AI
          </TabsTrigger>
          <TabsTrigger value="accessibility">
            <Accessibility className="h-4 w-4 mr-2" />
            Accessibility
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Brain className="h-4 w-4 mr-2" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Appearance */}
        <TabsContent value="appearance">
          <ScrollArea className="h-[calc(100vh-350px)]">
            <div className="space-y-6 p-4">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    Theme
                  </CardTitle>
                  <CardDescription>Choose your preferred color scheme</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid gap-4 md:grid-cols-3">
                    {(['dark', 'light', 'system'] as Theme[]).map((t) => (
                      <Button
                        key={t}
                        variant={formData.theme === t ? 'default' : 'outline'}
                        className="h-24 flex-col gap-3 p-6"
                        onClick={() => handleChange('theme', t)}
                      >
                        {t === 'dark' && <Moon className="h-8 w-8" />}
                        {t === 'light' && <Sun className="h-8 w-8" />}
                        {t === 'system' && <Monitor className="h-8 w-8" />}
                        <span className="font-medium capitalize">{t}</span>
                        <span className="text-xs text-muted-foreground">
                          {t === 'dark'
                            ? 'Midnight background'
                            : t === 'light'
                              ? 'Cloud-like neutral'
                              : 'Follows system'}
                        </span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Animated Background
                  </CardTitle>
                  <CardDescription>Living wallpaper representing the flow of time</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable animations</p>
                      <p className="text-sm text-muted-foreground">
                        Moving stars, grid lines, and horizon glow
                      </p>
                    </div>
                    <Switch
                      checked={!formData.reducedMotion}
                      onCheckedChange={(checked) => handleChange('reducedMotion', !checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Reduced motion</p>
                      <p className="text-sm text-muted-foreground">
                        Respects system prefers-reduced-motion setting
                      </p>
                    </div>
                    <Badge variant={formData.reducedMotion ? 'default' : 'outline'}>
                      {formData.reducedMotion ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    Preview
                  </CardTitle>
                  <CardDescription>Live preview of your theme settings</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="rounded-lg border border-border/50 overflow-hidden">
                    <div className="grid grid-cols-3">
                      <div className="p-4 bg-background/50">
                        <p className="text-sm text-muted-foreground">Background</p>
                        <div className="h-16 rounded bg-background border border-border mt-2" />
                      </div>
                      <div className="p-4 bg-card/50">
                        <p className="text-sm text-muted-foreground">Surface</p>
                        <div className="h-16 rounded bg-card border border-border mt-2" />
                      </div>
                      <div className="p-4 bg-primary/10">
                        <p className="text-sm text-muted-foreground">Primary</p>
                        <div className="h-16 rounded bg-primary mt-2" />
                      </div>
                    </div>
                    <div className="p-4 border-t border-border/50">
                      <div className="flex items-center gap-4">
                        <Button variant="default" size="sm">
                          Primary Button
                        </Button>
                        <Button variant="outline" size="sm">
                          Outline Button
                        </Button>
                        <Button variant="ghost" size="sm">
                          Ghost Button
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Schedule */}
        <TabsContent value="schedule">
          <ScrollArea className="h-[calc(100vh-350px)]">
            <div className="space-y-6 p-4">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Working Hours
                  </CardTitle>
                  <CardDescription>Your typical work schedule for AI planning</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={formData.workingHours?.start || '09:00'}
                        onChange={(e) =>
                          handleChange('workingHours', {
                            ...formData.workingHours,
                            start: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={formData.workingHours?.end || '18:00'}
                        onChange={(e) =>
                          handleChange('workingHours', {
                            ...formData.workingHours,
                            end: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Peak Energy Period
                  </CardTitle>
                  <CardDescription>
                    When you have the most mental energy for deep work
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid gap-3 md:grid-cols-3">
                    {ENERGY_PERIODS.map((period) => (
                      <Button
                        key={period.value}
                        variant={formData.peakEnergy === period.value ? 'default' : 'outline'}
                        className="h-20 flex-col gap-2 p-4"
                        onClick={() =>
                          handleChange(
                            'peakEnergy',
                            period.value as 'morning' | 'afternoon' | 'evening'
                          )
                        }
                      >
                        <period.icon className="h-6 w-6" />
                        <span className="font-medium">{period.label.split(' ')[0]}</span>
                        <span className="text-xs text-muted-foreground">
                          {period.label.split('(')[1]?.replace(')', '')}
                        </span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Focus Session Length
                  </CardTitle>
                  <CardDescription>Default duration for deep work blocks</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-3">
                    {FOCUS_LENGTHS.map((length) => (
                      <Button
                        key={length}
                        variant={formData.focusSessionLength === length ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleChange('focusSessionLength', length)}
                      >
                        {length} min
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Productivity Challenge
                  </CardTitle>
                  <CardDescription>
                    Your main struggle - helps AI tailor recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Select
                    value={formData.productivityChallenge || ''}
                    onValueChange={(v) => handleChange('productivityChallenge', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your main challenge" />
                    </SelectTrigger>
                    <SelectContent>
                      {CHALLENGES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Role
                  </CardTitle>
                  <CardDescription>Optimizes AI suggestions for your work style</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {ROLE_OPTIONS.map((role) => (
                      <Button
                        key={role.value}
                        variant={user.role === role.value ? 'default' : 'outline'}
                        className="h-24 flex-col gap-2 p-4 text-left"
                        onClick={() => handleChange('role', role.value as UserProfile['role'])}
                      >
                        <span className="font-medium">{role.label}</span>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <ScrollArea className="h-[calc(100vh-350px)]">
            <div className="space-y-6 p-4">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notification Intensity
                  </CardTitle>
                  <CardDescription>How often Chronova interrupts you</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  {['minimal', 'balanced', 'verbose'].map((level) => (
                    <div
                      key={level}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                    >
                      <div>
                        <p className="font-medium capitalize">{level}</p>
                        <p className="text-sm text-muted-foreground">
                          {level === 'minimal' && 'Only critical alerts and daily summary'}
                          {level === 'balanced' &&
                            'Smart reminders, schedule changes, weekly insights'}
                          {level === 'verbose' &&
                            'All AI suggestions, every schedule change, hourly updates'}
                        </p>
                      </div>
                      <Button
                        variant={formData.notificationIntensity === level ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleChange('notificationIntensity', level)}
                      >
                        Select
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle>Notification Types</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {[
                    { id: 'dailySummary', label: 'Daily morning summary', default: true },
                    { id: 'scheduleChanges', label: 'AI schedule changes', default: true },
                    { id: 'breakReminders', label: 'Break reminders', default: true },
                    { id: 'deadlineWarnings', label: 'Upcoming deadlines', default: true },
                    { id: 'weeklyInsights', label: 'Weekly insights report', default: true },
                    { id: 'focusReminders', label: 'Focus session reminders', default: false },
                  ].map((n) => (
                    <div key={n.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{n.label}</p>
                      </div>
                      <Switch
                        checked={formData[n.id] ?? n.default}
                        onCheckedChange={(checked) => handleChange(n.id, checked)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations">
          <ScrollArea className="h-[calc(100vh-350px)]">
            <div className="space-y-6 p-4">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Calendar Integration
                  </CardTitle>
                  <CardDescription>Connect your calendar for two-way sync</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Google Calendar</p>
                      <p className="text-sm text-muted-foreground">
                        Two-way sync with your primary calendar
                      </p>
                    </div>
                    <Switch
                      checked={formData.calendarConnected ?? user.calendarConnected}
                      onCheckedChange={(checked) => handleChange('calendarConnected', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Outlook Calendar</p>
                      <p className="text-sm text-muted-foreground">Microsoft 365 / Exchange sync</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Connect
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Apple Calendar</p>
                      <p className="text-sm text-muted-foreground">iCloud calendar integration</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle>Connected Services</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {[
                      { name: 'Google Calendar', status: 'connected', lastSync: '2 min ago' },
                      { name: 'Notion', status: 'disconnected', lastSync: null },
                      { name: 'Todoist', status: 'disconnected', lastSync: null },
                      { name: 'Linear', status: 'disconnected', lastSync: null },
                    ].map((s) => (
                      <div
                        key={s.name}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{s.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {s.status === 'connected'
                                ? `Last sync: ${s.lastSync}`
                                : 'Not connected'}
                            </p>
                          </div>
                        </div>
                        <Badge variant={s.status === 'connected' ? 'success' : 'outline'}>
                          {s.status === 'connected' ? 'Connected' : 'Connect'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Privacy & AI */}
        <TabsContent value="privacy">
          <ScrollArea className="h-[calc(100vh-350px)]">
            <div className="space-y-6 p-4">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    AI Features
                  </CardTitle>
                  <CardDescription>Control how AI processes your data</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  {[
                    {
                      id: 'aiScheduling',
                      label: 'AI-powered scheduling',
                      desc: 'Automatically prioritize and schedule tasks',
                      default: true,
                    },
                    {
                      id: 'aiInsights',
                      label: 'AI-generated insights',
                      desc: 'Weekly productivity analysis and recommendations',
                      default: true,
                    },
                    {
                      id: 'aiReasoning',
                      label: 'Show AI reasoning',
                      desc: 'Explain why tasks were prioritized or moved',
                      default: true,
                    },
                    {
                      id: 'dataTraining',
                      label: 'Allow data for training',
                      desc: 'Help improve AI models (anonymous, aggregated)',
                      default: false,
                    },
                  ].map((f) => (
                    <div
                      key={f.id}
                      className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border/50"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{f.label}</p>
                        <p className="text-sm text-muted-foreground">{f.desc}</p>
                      </div>
                      <Switch
                        checked={formData[f.id] ?? f.default}
                        onCheckedChange={(checked) => handleChange(f.id, checked)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Data & Privacy
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleExport}
                    disabled={!onExportData || exporting}
                  >
                    {exporting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    {exporting ? 'Preparing export…' : 'Export all data'}
                  </Button>
                  {exportMessage && (
                    <p className="text-xs text-muted-foreground" role="status">
                      {exportMessage}
                    </p>
                  )}
                  <Button variant="outline" className="w-full justify-start text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete account and all data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Accessibility */}
        <TabsContent value="accessibility">
          <ScrollArea className="h-[calc(100vh-350px)]">
            <div className="space-y-6 p-4">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Accessibility className="h-5 w-5 text-primary" />
                    Accessibility
                  </CardTitle>
                  <CardDescription>Make Chronova work better for you</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="space-y-4">
                    {[
                      {
                        id: 'reducedMotion',
                        label: 'Reduce motion',
                        desc: 'Minimize animations and transitions',
                      },
                      {
                        id: 'highContrast',
                        label: 'High contrast',
                        desc: 'Increase color contrast for readability',
                      },
                      {
                        id: 'largeText',
                        label: 'Large text',
                        desc: 'Increase base font size by 20%',
                      },
                      {
                        id: 'screenReader',
                        label: 'Screen reader optimized',
                        desc: 'Enhanced ARIA labels and live regions',
                      },
                      {
                        id: 'keyboardNavigation',
                        label: 'Enhanced keyboard nav',
                        desc: 'Additional shortcuts and focus management',
                      },
                    ].map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                      >
                        <div>
                          <p className="font-medium">{f.label}</p>
                          <p className="text-sm text-muted-foreground">{f.desc}</p>
                        </div>
                        <Switch
                          checked={formData[f.id] ?? false}
                          onCheckedChange={(checked) => handleChange(f.id, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle>Keyboard Shortcuts</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      { key: 'N', desc: 'New task (Quick Add)' },
                      { key: '/', desc: 'Focus search' },
                      { key: 'P', desc: 'Open AI Planner' },
                      { key: 'R', desc: 'Rebalance day' },
                      { key: 'T', desc: 'Go to Today' },
                      { key: 'C', desc: 'Open Calendar' },
                      { key: 'I', desc: 'Open Inbox' },
                      { key: 'S', desc: 'Open Settings' },
                      { key: '←/→', desc: 'Navigate calendar' },
                      { key: 'Space', desc: 'Play/pause focus timer' },
                      { key: 'Esc', desc: 'Close modals/panels' },
                      { key: '?', desc: 'Show all shortcuts' },
                    ].map((s) => (
                      <div
                        key={s.key}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <kbd className="px-2 py-1 bg-background border border-border rounded text-sm font-mono">
                          {s.key}
                        </kbd>
                        <span className="text-sm text-muted-foreground">{s.desc}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Advanced */}
        <TabsContent value="advanced">
          <ScrollArea className="h-[calc(100vh-350px)]">
            <div className="space-y-6 p-4">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    AI Model Settings
                  </CardTitle>
                  <CardDescription>Advanced AI behavior configuration</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div>
                    <Label>Planning Horizon</Label>
                    <Select
                      value={formData.planningHorizon || 'week'}
                      onValueChange={(v) => handleChange('planningHorizon', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day only</SelectItem>
                        <SelectItem value="week">Week (default)</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Aggressiveness</Label>
                    <Select
                      value={formData.aiAggressiveness || 'balanced'}
                      onValueChange={(v) => handleChange('aiAggressiveness', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conservative">Conservative - Minimal changes</SelectItem>
                        <SelectItem value="balanced">Balanced (default)</SelectItem>
                        <SelectItem value="aggressive">
                          Aggressive - Maximum optimization
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Energy Weight</Label>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      value={formData.energyWeight || 50}
                      onChange={(e) => handleChange('energyWeight', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      How much to prioritize energy alignment vs deadlines:{' '}
                      {formData.energyWeight || 50}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle>Danger Zone</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    disabled
                    title="Not available yet"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear all tasks and history
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    disabled
                    title="Not available yet"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset AI learning
                  </Button>
                  {!showDeleteConfirm ? (
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        setDeleteError(null);
                      }}
                      disabled={!onDeleteAccount}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Delete account
                    </Button>
                  ) : (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-3">
                      <p className="text-xs text-muted-foreground">
                        This permanently deletes your account and every task, schedule block, and
                        focus session. Type{' '}
                        <span className="font-mono font-semibold text-destructive">
                          {DELETE_CONFIRMATION_PHRASE}
                        </span>{' '}
                        to confirm.
                      </p>
                      <Input
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder={DELETE_CONFIRMATION_PHRASE}
                        aria-label="Type DELETE MY ACCOUNT to confirm account deletion"
                        autoComplete="off"
                      />
                      {deleteError && (
                        <p className="text-xs text-destructive" role="alert">
                          {deleteError}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteAccount}
                          disabled={
                            deleting || deleteConfirmText.trim() !== DELETE_CONFIRMATION_PHRASE
                          }
                        >
                          {deleting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Permanently delete'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteConfirmText('');
                            setDeleteError(null);
                          }}
                          disabled={deleting}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
