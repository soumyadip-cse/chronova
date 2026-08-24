import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
  varchar,
  real,
  serial,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const roleEnum = pgEnum('role', ['student', 'freelancer', 'professional', 'founder']);
export const energyLevelEnum = pgEnum('energy_level', ['low', 'balanced', 'high']);
export const taskStatusEnum = pgEnum('task_status', [
  'inbox',
  'today',
  'upcoming',
  'completed',
  'overdue',
]);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'critical']);
export const themeEnum = pgEnum('theme', ['dark', 'light', 'system']);
export const frequencyEnum = pgEnum('frequency', ['daily', 'weekly', 'monthly', 'yearly']);
export const masteryStatusEnum = pgEnum('mastery_status', [
  'unseen',
  'learning',
  'practicing',
  'mastered',
]);
export const difficultyEnum = pgEnum('difficulty', ['easy', 'medium', 'hard']);
export const assignmentStatusEnum = pgEnum('assignment_status', [
  'pending',
  'in_progress',
  'submitted',
  'graded',
  'overdue',
]);
export const examRiskEnum = pgEnum('exam_risk', ['low', 'moderate', 'critical']);
export const clientStatusEnum = pgEnum('client_status', ['active', 'inactive', 'prospect']);
export const projectStatusEnum = pgEnum('project_status', [
  'planning',
  'active',
  'on_hold',
  'completed',
  'cancelled',
]);
export const deliverableStatusEnum = pgEnum('deliverable_status', [
  'draft',
  'in_review',
  'approved',
  'delivered',
]);
export const integrationProviderEnum = pgEnum('integration_provider', [
  'google_calendar',
  'google_classroom',
  'spotify',
  'youtube_music',
]);
export const auditActionEnum = pgEnum('audit_action', [
  'login',
  'logout',
  'password_change',
  'oauth_connect',
  'oauth_disconnect',
  'data_export',
  'data_delete',
  'schedule_change',
  'task_create',
  'task_complete',
  'focus_start',
  'focus_complete',
]);
export const exportStatusEnum = pgEnum('export_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'expired',
]);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash'),
    role: roleEnum('role').notNull().default('professional'),
    timezone: varchar('timezone', { length: 50 }).notNull().default('UTC'),
    emailVerified: timestamp('email_verified', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
  })
);

export const userProfiles = pgTable(
  'user_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    displayName: varchar('display_name', { length: 100 }),
    energyProfile: jsonb('energy_profile').$type<{
      morning: number;
      afternoon: number;
      evening: number;
    }>(),
    onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
    notificationPrefs: jsonb('notification_prefs').$type<{
      email: boolean;
      push: boolean;
      dailySummary: boolean;
      weeklyReflection: boolean;
      burnoutAlerts: boolean;
    }>(),
    workingHours: jsonb('working_hours').$type<{ start: string; end: string }>(),
    peakEnergy: varchar('peak_energy', { length: 20 }),
    focusSessionLength: integer('focus_session_length').default(50),
    productivityChallenge: varchar('productivity_challenge', { length: 200 }),
    theme: themeEnum('theme').default('system'),
    reducedMotion: boolean('reduced_motion').default(false),
    notificationIntensity: varchar('notification_intensity', { length: 20 }).default('balanced'),
    planningHorizon: varchar('planning_horizon', { length: 10 }).default('day'),
    aiAggressiveness: varchar('ai_aggressiveness', { length: 20 }).default('balanced'),
    energyWeight: real('energy_weight').default(0.15),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: uniqueIndex('user_profiles_user_id_idx').on(table.userId),
  })
);

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    deadlineUtc: timestamp('deadline_utc', { withTimezone: true }),
    priorityFlag: taskPriorityEnum('priority_flag').notNull().default('medium'),
    estimatedMinutes: integer('estimated_minutes').notNull().default(30),
    energyRequired: energyLevelEnum('energy_required').notNull().default('balanced'),
    status: taskStatusEnum('status').notNull().default('inbox'),
    priorityScore: real('priority_score').notNull().default(0),
    scoreExplanation: text('score_explanation'),
    parentRecurringId: uuid('parent_recurring_id'),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
    topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'set null' }),
    clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
    deliverableId: uuid('deliverable_id').references(() => deliverables.id, {
      onDelete: 'set null',
    }),
    founderGoalId: uuid('founder_goal_id').references(() => founderGoals.id, {
      onDelete: 'set null',
    }),
    tags: text('tags').array().default([]),
    isRecurring: boolean('is_recurring').default(false),
    recurrenceRuleId: uuid('recurrence_rule_id').references(() => recurringRules.id, {
      onDelete: 'set null',
    }),
    aiReasoning: text('ai_reasoning'),
    completedAtUtc: timestamp('completed_at_utc', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('tasks_user_id_idx').on(table.userId),
    statusIdx: index('tasks_status_idx').on(table.status),
    deadlineIdx: index('tasks_deadline_idx').on(table.deadlineUtc),
    projectIdIdx: index('tasks_project_id_idx').on(table.projectId),
    subjectIdIdx: index('tasks_subject_id_idx').on(table.subjectId),
    clientIdIdx: index('tasks_client_id_idx').on(table.clientId),
    topicIdIdx: index('tasks_topic_id_idx').on(table.topicId),
    deliverableIdIdx: index('tasks_deliverable_id_idx').on(table.deliverableId),
    founderGoalIdIdx: index('tasks_founder_goal_id_idx').on(table.founderGoalId),
    recurrenceRuleIdIdx: index('tasks_recurrence_rule_id_idx').on(table.recurrenceRuleId),
  })
);

export const recurringRules = pgTable(
  'recurring_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    frequency: frequencyEnum('frequency').notNull(),
    interval: integer('interval').notNull().default(1),
    daysOfWeek: integer('days_of_week').array(),
    dayOfMonth: integer('day_of_month'),
    monthOfYear: integer('month_of_year'),
    untilUtc: timestamp('until_utc', { withTimezone: true }),
    count: integer('count'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('recurring_rules_user_id_idx').on(table.userId),
  })
);

export const calendarEvents = pgTable(
  'calendar_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    externalId: varchar('external_id', { length: 255 }),
    source: varchar('source', { length: 50 }).notNull().default('manual'),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    startUtc: timestamp('start_utc', { withTimezone: true }).notNull(),
    endUtc: timestamp('end_utc', { withTimezone: true }).notNull(),
    isAllDay: boolean('is_all_day').default(false),
    isReadOnly: boolean('is_read_only').default(false),
    color: varchar('color', { length: 20 }),
    location: varchar('location', { length: 500 }),
    attendees: text('attendees').array(),
    meetingUrl: varchar('meeting_url', { length: 500 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('calendar_events_user_id_idx').on(table.userId),
    startUtcIdx: index('calendar_events_start_utc_idx').on(table.startUtc),
    externalIdIdx: uniqueIndex('calendar_events_external_id_idx').on(
      table.externalId,
      table.userId
    ),
  })
);

export const scheduleBlocks = pgTable(
  'schedule_blocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
    startUtc: timestamp('start_utc', { withTimezone: true }).notNull(),
    endUtc: timestamp('end_utc', { withTimezone: true }).notNull(),
    isLocked: boolean('is_locked').default(false),
    isCompleted: boolean('is_completed').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('schedule_blocks_user_id_idx').on(table.userId),
    taskIdIdx: index('schedule_blocks_task_id_idx').on(table.taskId),
    startUtcIdx: index('schedule_blocks_start_utc_idx').on(table.startUtc),
  })
);

export const focusSessions = pgTable(
  'focus_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
    scheduleBlockId: uuid('schedule_block_id').references(() => scheduleBlocks.id, {
      onDelete: 'set null',
    }),
    durationMinutes: integer('duration_minutes').notNull(),
    completedAtUtc: timestamp('completed_at_utc', { withTimezone: true }).notNull().defaultNow(),
    soundscapeUsed: uuid('soundscape_used').references(() => soundscapePresets.id, {
      onDelete: 'set null',
    }),
    notes: text('notes'),
    energyLevel: energyLevelEnum('energy_level'),
    interrupted: boolean('interrupted').default(false),
    interruptionReason: varchar('interruption_reason', { length: 200 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('focus_sessions_user_id_idx').on(table.userId),
    taskIdIdx: index('focus_sessions_task_id_idx').on(table.taskId),
    completedAtIdx: index('focus_sessions_completed_at_idx').on(table.completedAtUtc),
  })
);

export const soundscapePresets = pgTable('soundscape_presets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  ambientTrackA: varchar('ambient_track_a', { length: 200 }),
  ambientTrackB: varchar('ambient_track_b', { length: 200 }),
  volumeA: real('volume_a').default(0.5),
  volumeB: real('volume_b').default(0.5),
  isBuiltIn: boolean('is_built_in').default(true),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const timeJourneyEvents = pgTable(
  'time_journey_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventType: varchar('event_type', { length: 50 }).notNull(),
    timestampUtc: timestamp('timestamp_utc', { withTimezone: true }).notNull().defaultNow(),
    metadataJson: jsonb('metadata_json').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('time_journey_events_user_id_idx').on(table.userId),
    timestampIdx: index('time_journey_events_timestamp_idx').on(table.timestampUtc),
  })
);

export const subjects = pgTable(
  'subjects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 200 }).notNull(),
    code: varchar('code', { length: 20 }),
    semester: varchar('semester', { length: 50 }),
    color: varchar('color', { length: 20 }),
    targetGrade: varchar('target_grade', { length: 10 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('subjects_user_id_idx').on(table.userId),
  })
);

export const topics = pgTable(
  'topics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjects.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 200 }).notNull(),
    masteryStatus: masteryStatusEnum('mastery_status').notNull().default('unseen'),
    examWeight: real('exam_weight').default(0),
    estimatedHours: real('estimated_hours').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    subjectIdIdx: index('topics_subject_id_idx').on(table.subjectId),
  })
);

export const importantQuestions = pgTable(
  'important_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    topicId: uuid('topic_id')
      .notNull()
      .references(() => topics.id, { onDelete: 'cascade' }),
    questionText: text('question_text').notNull(),
    referenceAnswer: text('reference_answer'),
    difficulty: difficultyEnum('difficulty').notNull().default('medium'),
    lastRevisedUtc: timestamp('last_revised_utc', { withTimezone: true }),
    timesReviewed: integer('times_reviewed').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    topicIdIdx: index('important_questions_topic_id_idx').on(table.topicId),
  })
);

export const assignments = pgTable(
  'assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
    topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'set null' }),
    externalClassroomId: varchar('external_classroom_id', { length: 255 }),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    dueUtc: timestamp('due_utc', { withTimezone: true }).notNull(),
    effortHours: real('effort_hours').default(0),
    status: assignmentStatusEnum('status').notNull().default('pending'),
    maxPoints: real('max_points'),
    earnedPoints: real('earned_points'),
    submittedAtUtc: timestamp('submitted_at_utc', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('assignments_user_id_idx').on(table.userId),
    dueUtcIdx: index('assignments_due_utc_idx').on(table.dueUtc),
    externalClassroomIdIdx: uniqueIndex('assignments_external_classroom_id_idx').on(
      table.externalClassroomId,
      table.userId
    ),
  })
);

export const exams = pgTable(
  'exams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjects.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 500 }).notNull(),
    examDateUtc: timestamp('exam_date_utc', { withTimezone: true }).notNull(),
    syllabusTopics: uuid('syllabus_topics').array().default([]),
    riskLevel: examRiskEnum('risk_level').notNull().default('low'),
    totalWeight: real('total_weight').default(100),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('exams_user_id_idx').on(table.userId),
    examDateIdx: index('exams_exam_date_idx').on(table.examDateUtc),
  })
);

export const clients = pgTable(
  'clients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 200 }).notNull(),
    rate: real('rate').default(0),
    currency: varchar('currency', { length: 10 }).default('USD'),
    status: clientStatusEnum('status').notNull().default('active'),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 50 }),
    company: varchar('company', { length: 200 }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('clients_user_id_idx').on(table.userId),
  })
);

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    targetDeadlineUtc: timestamp('target_deadline_utc', { withTimezone: true }),
    status: projectStatusEnum('status').notNull().default('planning'),
    color: varchar('color', { length: 20 }),
    budget: real('budget'),
    spent: real('spent').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('projects_user_id_idx').on(table.userId),
    clientIdIdx: index('projects_client_id_idx').on(table.clientId),
  })
);

export const deliverables = pgTable(
  'deliverables',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    targetDeadlineUtc: timestamp('target_deadline_utc', { withTimezone: true }),
    status: deliverableStatusEnum('status').notNull().default('draft'),
    estimatedHours: real('estimated_hours').default(0),
    actualHours: real('actual_hours').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    projectIdIdx: index('deliverables_project_id_idx').on(table.projectId),
  })
);

export const founderGoals = pgTable(
  'founder_goals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    quarter: varchar('quarter', { length: 20 }).notNull(),
    objective: varchar('objective', { length: 500 }).notNull(),
    keyResultsJson: jsonb('key_results_json')
      .$type<
        Array<{ id: string; description: string; target: number; current: number; unit: string }>
      >()
      .default([]),
    strategicImpactScore: integer('strategic_impact_score').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('founder_goals_user_id_idx').on(table.userId),
  })
);

export const aiConversations = pgTable(
  'ai_conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 200 }),
    model: varchar('model', { length: 50 }),
    messagesJson: jsonb('messages_json')
      .$type<Array<{ role: string; content: string; timestamp: string }>>()
      .default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('ai_conversations_user_id_idx').on(table.userId),
  })
);

export const aiActivities = pgTable(
  'ai_activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    activityType: varchar('activity_type', { length: 50 }).notNull(),
    inputJson: jsonb('input_json').$type<Record<string, unknown>>(),
    outputJson: jsonb('output_json').$type<Record<string, unknown>>(),
    modelUsed: varchar('model_used', { length: 50 }),
    tokensUsed: integer('tokens_used'),
    latencyMs: integer('latency_ms'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('ai_activities_user_id_idx').on(table.userId),
  })
);

export const integrationAccounts = pgTable(
  'integration_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: integrationProviderEnum('provider').notNull(),
    externalAccountId: varchar('external_account_id', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token'),
    expiresAtUtc: timestamp('expires_at_utc', { withTimezone: true }),
    scopes: text('scopes').array().default([]),
    isActive: boolean('is_active').default(true),
    lastSyncUtc: timestamp('last_sync_utc', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdProviderIdx: uniqueIndex('integration_accounts_user_provider_idx').on(
      table.userId,
      table.provider
    ),
  })
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: auditActionEnum('action').notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    metadataJson: jsonb('metadata_json').$type<Record<string, unknown>>(),
    timestampUtc: timestamp('timestamp_utc', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
    actionIdx: index('audit_logs_action_idx').on(table.action),
    timestampIdx: index('audit_logs_timestamp_idx').on(table.timestampUtc),
  })
);

export const exportJobs = pgTable(
  'export_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    format: varchar('format', { length: 10 }).notNull().default('json'),
    status: exportStatusEnum('status').notNull().default('pending'),
    downloadUrl: text('download_url'),
    expiresAtUtc: timestamp('expires_at_utc', { withTimezone: true }),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAtUtc: timestamp('completed_at_utc', { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index('export_jobs_user_id_idx').on(table.userId),
  })
);

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, { fields: [users.id], references: [userProfiles.userId] }),
  tasks: many(tasks),
  calendarEvents: many(calendarEvents),
  scheduleBlocks: many(scheduleBlocks),
  focusSessions: many(focusSessions),
  timeJourneyEvents: many(timeJourneyEvents),
  subjects: many(subjects),
  assignments: many(assignments),
  exams: many(exams),
  clients: many(clients),
  projects: many(projects),
  founderGoals: many(founderGoals),
  aiConversations: many(aiConversations),
  aiActivities: many(aiActivities),
  integrationAccounts: many(integrationAccounts),
  auditLogs: many(auditLogs),
  exportJobs: many(exportJobs),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, { fields: [userProfiles.userId], references: [users.id] }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  recurringRule: one(recurringRules, {
    fields: [tasks.recurrenceRuleId],
    references: [recurringRules.id],
  }),
  scheduleBlocks: many(scheduleBlocks),
  focusSessions: many(focusSessions),
}));

export const recurringRulesRelations = relations(recurringRules, ({ one, many }) => ({
  user: one(users, { fields: [recurringRules.userId], references: [users.id] }),
  tasks: many(tasks),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  user: one(users, { fields: [calendarEvents.userId], references: [users.id] }),
}));

export const scheduleBlocksRelations = relations(scheduleBlocks, ({ one }) => ({
  user: one(users, { fields: [scheduleBlocks.userId], references: [users.id] }),
  task: one(tasks, { fields: [scheduleBlocks.taskId], references: [tasks.id] }),
}));

export const focusSessionsRelations = relations(focusSessions, ({ one }) => ({
  user: one(users, { fields: [focusSessions.userId], references: [users.id] }),
  task: one(tasks, { fields: [focusSessions.taskId], references: [tasks.id] }),
  scheduleBlock: one(scheduleBlocks, {
    fields: [focusSessions.scheduleBlockId],
    references: [scheduleBlocks.id],
  }),
  soundscape: one(soundscapePresets, {
    fields: [focusSessions.soundscapeUsed],
    references: [soundscapePresets.id],
  }),
}));

export const soundscapePresetsRelations = relations(soundscapePresets, ({ one, many }) => ({
  user: one(users, { fields: [soundscapePresets.userId], references: [users.id] }),
  focusSessions: many(focusSessions),
}));

export const timeJourneyEventsRelations = relations(timeJourneyEvents, ({ one }) => ({
  user: one(users, { fields: [timeJourneyEvents.userId], references: [users.id] }),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  user: one(users, { fields: [subjects.userId], references: [users.id] }),
  topics: many(topics),
  assignments: many(assignments),
  exams: many(exams),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  subject: one(subjects, { fields: [topics.subjectId], references: [subjects.id] }),
  importantQuestions: many(importantQuestions),
  assignments: many(assignments),
}));

export const importantQuestionsRelations = relations(importantQuestions, ({ one }) => ({
  topic: one(topics, { fields: [importantQuestions.topicId], references: [topics.id] }),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  user: one(users, { fields: [assignments.userId], references: [users.id] }),
  subject: one(subjects, { fields: [assignments.subjectId], references: [subjects.id] }),
  topic: one(topics, { fields: [assignments.topicId], references: [topics.id] }),
}));

export const examsRelations = relations(exams, ({ one }) => ({
  user: one(users, { fields: [exams.userId], references: [users.id] }),
  subject: one(subjects, { fields: [exams.subjectId], references: [subjects.id] }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, { fields: [clients.userId], references: [users.id] }),
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  client: one(clients, { fields: [projects.clientId], references: [clients.id] }),
  deliverables: many(deliverables),
}));

export const deliverablesRelations = relations(deliverables, ({ one }) => ({
  project: one(projects, { fields: [deliverables.projectId], references: [projects.id] }),
}));

export const founderGoalsRelations = relations(founderGoals, ({ one }) => ({
  user: one(users, { fields: [founderGoals.userId], references: [users.id] }),
}));

export const aiConversationsRelations = relations(aiConversations, ({ one }) => ({
  user: one(users, { fields: [aiConversations.userId], references: [users.id] }),
}));

export const aiActivitiesRelations = relations(aiActivities, ({ one }) => ({
  user: one(users, { fields: [aiActivities.userId], references: [users.id] }),
}));

export const integrationAccountsRelations = relations(integrationAccounts, ({ one }) => ({
  user: one(users, { fields: [integrationAccounts.userId], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

export const exportJobsRelations = relations(exportJobs, ({ one }) => ({
  user: one(users, { fields: [exportJobs.userId], references: [users.id] }),
}));
