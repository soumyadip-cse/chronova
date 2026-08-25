import { describe, it, expect } from 'vitest';
import {
  calculatePriorityScore,
  rankTasks,
  generateScheduleProposal,
  calculateUrgency,
  calculateEnergyMatch,
  calculateUserOverride,
  calculateDependencyBoost,
  calculateContextSwitchPenalty,
  calculateEffortDrag,
} from '@/lib/priority-engine';
import type { TaskAttributes, SchedulingContext } from '@/lib/priority-engine';

const mockContext: SchedulingContext = {
  currentTimeUtc: new Date('2024-01-15T12:00:00Z'),
  userTimezone: 'UTC',
  energyProfile: { morning: 0.8, afternoon: 0.5, evening: 0.3 },
  scheduledTasks: [],
  calendarEvents: [],
  workingHours: { start: '09:00', end: '17:00' },
};

const createMockTask = (overrides: Partial<TaskAttributes> = {}): TaskAttributes => ({
  id: 'test-id',
  deadlineUtc: null,
  priorityFlag: 'medium',
  estimatedMinutes: 30,
  energyRequired: 'balanced',
  impact: 50,
  tags: [],
  projectId: null,
  subjectId: null,
  clientId: null,
  deliverableId: null,
  founderGoalId: null,
  isRecurring: false,
  status: 'inbox',
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('Priority Engine', () => {
  describe('calculateUrgency', () => {
    it('returns 100 for overdue tasks', () => {
      const deadline = new Date('2024-01-15T10:00:00Z'); // 2 hours ago
      const urgency = calculateUrgency(deadline, mockContext.currentTimeUtc);
      expect(urgency).toBe(100);
    });

    it('returns 95 for tasks due within 1 hour', () => {
      const deadline = new Date('2024-01-15T12:30:00Z'); // 30 min from now
      const urgency = calculateUrgency(deadline, mockContext.currentTimeUtc);
      expect(urgency).toBe(95);
    });

    it('returns 5 for tasks with no deadline', () => {
      const urgency = calculateUrgency(null, mockContext.currentTimeUtc);
      expect(urgency).toBe(5);
    });

    it('returns 5 for tasks due in more than a week', () => {
      const deadline = new Date('2024-01-30T12:00:00Z'); // 15 days from now
      const urgency = calculateUrgency(deadline, mockContext.currentTimeUtc);
      expect(urgency).toBe(5);
    });
  });

  describe('calculateEnergyMatch', () => {
    it('returns high score when task energy matches user peak', () => {
      // Morning slot (10 AM) with high morning energy (0.8)
      const slotStart = new Date('2024-01-15T10:00:00Z');
      const match = calculateEnergyMatch('high', mockContext, slotStart);
      expect(match).toBeGreaterThan(70);
    });

    it('returns lower score when task energy mismatches user energy', () => {
      // Evening slot (8 PM) with low evening energy (0.3) for high energy task
      const slotStart = new Date('2024-01-15T20:00:00Z');
      const match = calculateEnergyMatch('high', mockContext, slotStart);
      expect(match).toBeLessThan(50);
    });
  });

  describe('calculateUserOverride', () => {
    it('returns positive for critical priority', () => {
      const override = calculateUserOverride('critical');
      expect(override).toBe(60); // (1.6 - 1) * 100
    });

    it('returns negative for low priority', () => {
      const override = calculateUserOverride('low');
      expect(override).toBe(-20); // (0.8 - 1) * 100
    });

    it('returns 0 for medium priority', () => {
      const override = calculateUserOverride('medium');
      expect(override).toBe(0);
    });
  });

  describe('calculateDependencyBoost', () => {
    it('returns boost for tasks with dependents', () => {
      const tasks = [
        createMockTask({ id: 'task-1', tags: ['depends:task-2'] }),
        createMockTask({ id: 'task-2', projectId: 'proj-1' }),
      ];
      const boost = calculateDependencyBoost('task-2', tasks);
      expect(boost).toBeGreaterThan(0);
    });

    it('returns 0 for tasks without dependents', () => {
      const tasks = [createMockTask({ id: 'task-1' })];
      const boost = calculateDependencyBoost('task-2', tasks);
      expect(boost).toBe(0);
    });
  });

  describe('calculateContextSwitchPenalty', () => {
    it('returns penalty when switching domains', () => {
      const task1 = createMockTask({ projectId: 'proj-1' });
      const task2 = createMockTask({ subjectId: 'subj-1' });
      const penalty = calculateContextSwitchPenalty(task2, task1);
      expect(penalty).toBe(25);
    });

    it('returns 0 when staying in same domain', () => {
      const task1 = createMockTask({ projectId: 'proj-1' });
      const task2 = createMockTask({ projectId: 'proj-1' });
      const penalty = calculateContextSwitchPenalty(task2, task1);
      expect(penalty).toBe(0);
    });

    it('returns 0 when no previous task', () => {
      const task = createMockTask({ projectId: 'proj-1' });
      const penalty = calculateContextSwitchPenalty(task, null);
      expect(penalty).toBe(0);
    });
  });

  describe('calculateEffortDrag', () => {
    it('returns high penalty for tasks exceeding 80% of window', () => {
      const drag = calculateEffortDrag(100, 120); // 100 min task in 120 min window = 83%
      expect(drag).toBe(20);
    });

    it('returns medium penalty for tasks exceeding 50% of window', () => {
      const drag = calculateEffortDrag(70, 120); // 70 min task in 120 min window = 58%
      expect(drag).toBe(10);
    });

    it('returns 0 for small tasks', () => {
      const drag = calculateEffortDrag(30, 120); // 30 min task in 120 min window = 25%
      expect(drag).toBe(0);
    });
  });

  describe('calculatePriorityScore', () => {
    it('calculates score correctly for high urgency task', () => {
      const task = createMockTask({
        deadlineUtc: new Date('2024-01-15T13:00:00Z').toISOString(), // 1 hour from now
        priorityFlag: 'critical',
        impact: 90,
        energyRequired: 'high',
      });
      const slotStart = new Date('2024-01-15T10:00:00Z'); // Morning peak
      const result = calculatePriorityScore(task, mockContext, [task], slotStart, null);
      expect(result.score).toBeGreaterThan(70);
      expect(result.explanation).toContain('High impact');
      expect(result.explanation).toContain('critical priority');
    });

    it('returns minimum score of 0', () => {
      const task = createMockTask({
        priorityFlag: 'low',
        impact: 0,
        energyRequired: 'high',
        estimatedMinutes: 120,
      });
      const slotStart = new Date('2024-01-15T20:00:00Z'); // Low energy time
      const result = calculatePriorityScore(task, mockContext, [task], slotStart, null);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('returns maximum score of 100', () => {
      const task = createMockTask({
        deadlineUtc: new Date('2024-01-15T12:30:00Z').toISOString(),
        priorityFlag: 'critical',
        impact: 100,
        energyRequired: 'balanced',
        estimatedMinutes: 30,
      });
      const slotStart = new Date('2024-01-15T10:00:00Z');
      const result = calculatePriorityScore(task, mockContext, [task], slotStart, null);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('rankTasks', () => {
    it('sorts tasks by priority score descending', () => {
      const tasks = [
        createMockTask({ id: 'low', priorityFlag: 'low', impact: 10 }),
        createMockTask({ id: 'high', priorityFlag: 'critical', impact: 90 }),
        createMockTask({ id: 'medium', priorityFlag: 'medium', impact: 50 }),
      ];
      const ranked = rankTasks(tasks, mockContext, new Date());
      expect(ranked[0].id).toBe('high');
      expect(ranked[1].id).toBe('medium');
      expect(ranked[2].id).toBe('low');
    });

    it('breaks ties by deadline', () => {
      const tasks = [
        createMockTask({
          id: 'later',
          deadlineUtc: new Date('2024-01-20T12:00:00Z').toISOString(),
        }),
        createMockTask({
          id: 'sooner',
          deadlineUtc: new Date('2024-01-16T12:00:00Z').toISOString(),
        }),
      ];
      const ranked = rankTasks(tasks, mockContext, new Date());
      expect(ranked[0].id).toBe('sooner');
    });
  });

  describe('generateScheduleProposal', () => {
    it('creates proposals for pending tasks', () => {
      const tasks = [
        createMockTask({ id: 'task-1', status: 'inbox', estimatedMinutes: 30 }),
        createMockTask({ id: 'task-2', status: 'today', estimatedMinutes: 45 }),
        createMockTask({ id: 'task-3', status: 'completed', estimatedMinutes: 60 }),
      ];
      const result = generateScheduleProposal(tasks, mockContext);
      expect(result.scheduled).toHaveLength(2); // Only inbox and today
      expect(result.scheduled[0].taskId).toBeDefined();
      expect(result.scheduled[0].startUtc).toBeInstanceOf(Date);
      expect(result.scheduled[0].endUtc).toBeInstanceOf(Date);
    });

    it('skips completed tasks', () => {
      const tasks = [createMockTask({ id: 'done', status: 'completed' })];
      const result = generateScheduleProposal(tasks, mockContext);
      expect(result.scheduled).toHaveLength(0);
      expect(result.skipped).toEqual([{ taskId: 'done', reason: 'completed' }]);
    });

    it('respects calendar conflicts', () => {
      const contextWithConflict: SchedulingContext = {
        ...mockContext,
        calendarEvents: [
          { startUtc: new Date('2024-01-15T10:00:00Z'), endUtc: new Date('2024-01-15T11:00:00Z') },
        ],
      };
      const tasks = [createMockTask({ id: 'task-1', estimatedMinutes: 60 })];
      const result = generateScheduleProposal(tasks, contextWithConflict);
      // Should find slot after the meeting
      expect(result.scheduled[0].startUtc.getTime()).toBeGreaterThanOrEqual(
        new Date('2024-01-15T11:00:00Z').getTime()
      );
    });
  });
});
