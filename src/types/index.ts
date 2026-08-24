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
  type: 'meeting' | 'focus' | 'break' | 'flexible' | 'personal';
  color: string;
  taskId?: string;
  isAllDay?: boolean;
  location?: string;
  attendees?: string[];
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
