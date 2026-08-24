import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseTaskWithAI,
  parseWithFallback,
  extractTitle,
  parseRelativeDate,
  parsedTaskSchema,
} from '@/lib/ai-task-parser';

// Mock environment
vi.mock('@google/generative-ai');
vi.mock('@anthropic-ai/sdk');

describe('AI Task Parser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AI_PROVIDER = 'gemini';
  });

  describe('parseWithFallback', () => {
    it('extracts title from simple input', () => {
      const result = parseWithFallback('Buy groceries', {
        timezone: 'UTC',
        currentTimeUtc: new Date('2024-01-15T12:00:00Z').toISOString(),
      });

      expect(result.title).toBe('Buy groceries');
      expect(result.priorityFlag).toBe('medium');
      expect(result.estimatedMinutes).toBe(30);
      expect(result.energyRequired).toBe('balanced');
      expect(result.confidence).toBe(0.6);
    });

    it('extracts deadline from "by tomorrow"', () => {
      const baseTime = new Date('2024-01-15T12:00:00Z');
      const result = parseWithFallback('Finish report by tomorrow', {
        timezone: 'UTC',
        currentTimeUtc: baseTime.toISOString(),
      });

      expect(result.deadlineUtc).toBeDefined();
      if (result.deadlineUtc) {
        const deadline = new Date(result.deadlineUtc);
        expect(deadline.getDate()).toBe(baseTime.getDate() + 1);
      }
    });

    it('extracts critical priority from "urgent"', () => {
      const result = parseWithFallback('Urgent: Fix critical bug', {
        timezone: 'UTC',
        currentTimeUtc: new Date('2024-01-15T12:00:00Z').toISOString(),
      });

      expect(result.priorityFlag).toBe('critical');
    });

    it('extracts high priority from "important"', () => {
      const result = parseWithFallback('Important: Review PR', {
        timezone: 'UTC',
        currentTimeUtc: new Date('2024-01-15T12:00:00Z').toISOString(),
      });

      expect(result.priorityFlag).toBe('high');
    });

    it('extracts low priority from "low priority"', () => {
      const result = parseWithFallback('Low priority: Clean desk', {
        timezone: 'UTC',
        currentTimeUtc: new Date('2024-01-15T12:00:00Z').toISOString(),
      });

      expect(result.priorityFlag).toBe('low');
    });

    it('extracts duration from "2 hours"', () => {
      const result = parseWithFallback('Write docs for 2 hours', {
        timezone: 'UTC',
        currentTimeUtc: new Date('2024-01-15T12:00:00Z').toISOString(),
      });

      expect(result.estimatedMinutes).toBe(120);
    });

    it('extracts duration from "30 mins"', () => {
      const result = parseWithFallback('Quick task 30 mins', {
        timezone: 'UTC',
        currentTimeUtc: new Date('2024-01-15T12:00:00Z').toISOString(),
      });

      expect(result.estimatedMinutes).toBe(30);
    });

    it('extracts high energy from "deep work"', () => {
      const result = parseWithFallback('Deep work session', {
        timezone: 'UTC',
        currentTimeUtc: new Date('2024-01-15T12:00:00Z').toISOString(),
      });

      expect(result.energyRequired).toBe('high');
    });

    it('extracts low energy from "easy admin"', () => {
      const result = parseWithFallback('Easy admin task', {
        timezone: 'UTC',
        currentTimeUtc: new Date('2024-01-15T12:00:00Z').toISOString(),
      });

      expect(result.energyRequired).toBe('low');
    });
  });

  describe('extractTitle', () => {
    it('removes "need to" prefix', () => {
      expect(extractTitle('need to buy groceries')).toBe('Buy groceries');
    });

    it('removes "have to" prefix', () => {
      expect(extractTitle('have to finish report')).toBe('Finish report');
    });

    it('removes deadline suffix', () => {
      expect(extractTitle('finish report by tomorrow')).toBe('Finish report');
    });

    it('removes priority suffix', () => {
      expect(extractTitle('task high priority')).toBe('Task');
    });

    it('removes duration suffix', () => {
      expect(extractTitle('work for 2 hours')).toBe('Work');
    });

    it('capitalizes first letter', () => {
      expect(extractTitle('buy milk')).toBe('Buy milk');
    });
  });

  describe('parseRelativeDate', () => {
    const base = new Date('2024-01-15T12:00:00Z'); // Monday

    it('parses "today"', () => {
      const result = parseRelativeDate('today', base);
      expect(result).toEqual(base);
    });

    it('parses "tomorrow"', () => {
      const result = parseRelativeDate('tomorrow', base);
      expect(result!.getDate()).toBe(base.getDate() + 1);
    });

    it('parses "next week"', () => {
      const result = parseRelativeDate('next week', base);
      expect(result!.getDate()).toBe(base.getDate() + 7);
    });

    it('parses day names', () => {
      const result = parseRelativeDate('friday', base); // Friday is 4 days from Monday
      expect(result!.getDate()).toBe(base.getDate() + 4);
    });

    it('parses ISO date strings', () => {
      const result = parseRelativeDate('2024-01-20', base);
      expect(result!.getDate()).toBe(20);
    });

    it('returns null for invalid input', () => {
      const result = parseRelativeDate('invalid date string', base);
      expect(result).toBeNull();
    });
  });

  describe('parsedTaskSchema validation', () => {
    it('validates correct task object', () => {
      const validTask = {
        title: 'Test task',
        description: 'Description',
        deadlineUtc: new Date().toISOString(),
        priorityFlag: 'high',
        estimatedMinutes: 60,
        energyRequired: 'balanced',
        subjectCode: 'CS101',
        projectTitle: 'Project Alpha',
        clientName: 'Client Beta',
        subtasks: ['Step 1', 'Step 2'],
        tags: ['work', 'urgent'],
        confidence: 0.9,
      };

      const result = parsedTaskSchema.safeParse(validTask);
      expect(result.success).toBe(true);
    });

    it('rejects invalid priority', () => {
      const invalidTask = {
        title: 'Test',
        priorityFlag: 'invalid',
        estimatedMinutes: 30,
        energyRequired: 'balanced',
      };

      const result = parsedTaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('rejects negative estimated minutes', () => {
      const invalidTask = {
        title: 'Test',
        priorityFlag: 'medium',
        estimatedMinutes: -10,
        energyRequired: 'balanced',
      };

      const result = parsedTaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('rejects confidence out of range', () => {
      const invalidTask = {
        title: 'Test',
        priorityFlag: 'medium',
        estimatedMinutes: 30,
        energyRequired: 'balanced',
        confidence: 1.5,
      };

      const result = parsedTaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('applies defaults correctly', () => {
      const minimalTask = {
        title: 'Test',
      };

      const result = parsedTaskSchema.parse(minimalTask);
      expect(result.priorityFlag).toBe('medium');
      expect(result.estimatedMinutes).toBe(30);
      expect(result.energyRequired).toBe('balanced');
      expect(result.subtasks).toEqual([]);
      expect(result.tags).toEqual([]);
      expect(result.confidence).toBe(0.8);
    });
  });

  describe('parseTaskWithAI', () => {
    it('falls back when no API key configured', async () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const result = await parseTaskWithAI('Buy groceries', {
        timezone: 'UTC',
        currentTimeUtc: new Date('2024-01-15T12:00:00Z').toISOString(),
      });

      expect(result.title).toBe('Buy groceries');
      expect(result.confidence).toBe(0.6);
    });
  });
});
