export type Role = 'student' | 'freelancer' | 'professional' | 'founder';
export type EnergyLevel = 'low' | 'balanced' | 'high';
export type TaskStatus = 'inbox' | 'today' | 'upcoming' | 'completed' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type CalendarView = 'day' | 'week' | 'agenda';
export type Theme = 'dark' | 'light' | 'system';

export interface UserProfile {
  id: string;
  name: string;
  role: Role;
  workingHours: { start: string; end: string };
  peakEnergy: 'morning' | 'afternoon' | 'evening';
  focusSessionLength: number;
  productivityChallenge: string;
  calendarConnected: boolean;
  theme: Theme;
  reducedMotion: boolean;
  notificationIntensity: 'minimal' | 'balanced' | 'verbose';
  planningHorizon: 'day' | 'week' | 'month';
  aiAggressiveness: 'conservative' | 'balanced' | 'aggressive';
  energyWeight: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  aiPriorityScore: number;
  dueDate?: Date;
  estimatedEffort: number;
  impact: number;
  energyRequired: EnergyLevel;
  projectId?: string;
  projectName?: string;
  projectColor?: string;
  scheduledAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  aiReasoning?: string;
  tags: string[];
  isRecurring?: boolean;
  recurrenceRule?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  type: 'meeting' | 'focus' | 'break' | 'flexible' | 'personal' | 'schedule';
  color: string;
  taskId?: string;
  isAllDay?: boolean;
  location?: string;
  attendees?: string[];
  scheduleBlockId?: string;
  isLocked?: boolean;
  isCompleted?: boolean;
}

/** A persisted scheduler block as returned by /api/calendar. */
export interface ScheduledBlock {
  id: string;
  taskId: string;
  title?: string;
  startUtc: string;
  endUtc: string;
  isLocked: boolean;
  isCompleted: boolean;
}

export interface AppliedBlock {
  taskId: string;
  blockId: string;
  startUtc: string;
  endUtc: string;
}

export type ApplyFailureReason =
  UnschedulableReason | 'already_completed' | 'not_schedulable' | 'not_found';

export interface ApplyFailure {
  taskId: string;
  reason: ApplyFailureReason;
}

export interface PlanApplyResponse {
  applied: AppliedBlock[];
  failed: ApplyFailure[];
}

/** Reported by Focus Mode when a session ends (completed or interrupted). */
export interface FocusSessionEndInfo {
  elapsedMinutes: number;
  interrupted: boolean;
}

export interface InsightsResponse {
  days: number;
  generatedAt: string;
  data: InsightData;
}

/** Merged users + userProfiles view returned by /api/profile. */
export interface ProfileResponse {
  profile: {
    id: string;
    email: string;
    role: Role;
    timezone: string;
    displayName: string | null;
    onboardingCompleted: boolean;
    energyProfile: { morning: number; afternoon: number; evening: number } | null;
    notificationPrefs: {
      email: boolean;
      push: boolean;
      dailySummary: boolean;
      weeklyReflection: boolean;
      burnoutAlerts: boolean;
    } | null;
    workingHours: { start: string; end: string };
    peakEnergy: 'morning' | 'afternoon' | 'evening';
    focusSessionLength: number | null;
    productivityChallenge: string | null;
    theme: Theme | null;
    reducedMotion: boolean | null;
    planningHorizon: 'day' | 'week' | 'month' | null;
    aiAggressiveness: 'conservative' | 'balanced' | 'aggressive' | null;
    createdAt: string | Date | null;
  };
}

export interface ProfilePatchInput {
  displayName?: string;
  timezone?: string;
  workingHours?: { start: string; end: string };
  peakEnergy?: 'morning' | 'afternoon' | 'evening';
  focusSessionLength?: number;
  productivityChallenge?: string;
  planningHorizon?: 'day' | 'week' | 'month';
  aiAggressiveness?: 'conservative' | 'balanced' | 'aggressive';
  reducedMotion?: boolean;
  /** One-way latch: marks onboarding complete. */
  completed?: true;
}

export interface EnergyForecast {
  hour: number;
  level: EnergyLevel;
  confidence: number;
}

export interface DaySchedule {
  date: Date;
  events: CalendarEvent[];
  tasks: Task[];
  energyForecast: EnergyForecast[];
  focusTimePlanned: number;
  focusTimeCompleted: number;
}

export interface InsightData {
  plannedVsCompleted: { date: string; planned: number; completed: number }[];
  productiveHours: { hour: number; productivity: number }[];
  rolloverPattern: { date: string; rolledOver: number }[];
  workloadBalance: { category: string; hours: number }[];
  burnoutRisk: 'low' | 'medium' | 'high';
  weeklyReflection: string;
  recommendations: string[];
}

export interface AIRecommendation {
  id: string;
  type: 'reschedule' | 'prioritize' | 'break' | 'focus' | 'delegate' | 'defer';
  title: string;
  description: string;
  reasoning: string;
  confidence: number;
  affectedTasks: string[];
  proposedChanges: ScheduleChange[];
  status: 'pending' | 'accepted' | 'rejected' | 'applied';
}

export interface ScheduleChange {
  taskId: string;
  type: 'move' | 'resize' | 'split' | 'merge' | 'cancel';
  from?: { start: Date; end: Date };
  to?: { start: Date; end: Date };
}

export interface OnboardingData {
  role: Role;
  workingHours: { start: string; end: string };
  peakEnergy: 'morning' | 'afternoon' | 'evening';
  focusSessionLength: number;
  productivityChallenge: string;
  calendarConnected: boolean;
}

export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
}

// ---------- Deterministic scheduling engine contracts ----------

export interface ScheduledProposal {
  taskId: string;
  startUtc: string;
  endUtc: string;
  priorityScore: number;
}

export type UnschedulableReason =
  'conflict_exhausted' | 'past_deadline' | 'exceeds_horizon' | 'no_working_window';

export interface UnschedulableTask {
  taskId: string;
  reason: UnschedulableReason;
  details?: Record<string, unknown>;
}

export interface PlanScheduleResponse {
  date: string;
  scheduled: ScheduledProposal[];
  unschedulable: UnschedulableTask[];
  skipped: Array<{ taskId: string; reason: string }>;
}
