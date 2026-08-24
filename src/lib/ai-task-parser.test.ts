import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseTaskWithAI,
  parseWithFallback,
  extractTitle,
  resolveRelativeDateInZone,
  extractJsonBlock,
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

    it('extracts deadline from "by tomorrow" (UTC user, no time → end of day)', () => {
      const baseTime = new Date('2024-01-15T12:00:00Z');
      const result = parseWithFallback('Finish report by tomorrow', {
        timezone: 'UTC',
        currentTimeUtc: baseTime.toISOString(),
      });

      // Deterministic UTC contract: date-only deadline lands at 23:59 in the
      // user's timezone (UTC here), on the next calendar day.
      expect(result.deadlineUtc).toBe('2024-01-16T23:59:00.000Z');
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

  describe('resolveRelativeDateInZone', () => {
    // Monday 2024-01-15, noon in America/New_York => 17:00Z
    const tz = 'America/New_York';
    const base = new Date('2024-01-15T17:00:00Z');
    const todayParts = { year: 2024, month: 1, day: 15, hour: 12, minute: 0 };

    it('parses "today" as the same local day', () => {
      const result = resolveRelativeDateInZone('today', todayParts, tz);
      expect(result).toEqual(todayParts);
    });

    it('parses "tomorrow" against the local calendar', () => {
      const result = resolveRelativeDateInZone('tomorrow', todayParts, tz);
      expect(result!.day).toBe(16);
    });

    it('parses "next week"', () => {
      const result = resolveRelativeDateInZone('next week', todayParts, tz);
      expect(result!.day).toBe(22);
    });

    it('parses "friday" forward within the week', () => {
      const result = resolveRelativeDateInZone('friday', todayParts, tz);
      expect(result!.day).toBe(19); // Friday is 4 days from Monday
    });

    it('rolls "friday" backward past Sunday to the next occurrence when already Saturday', () => {
      const saturday = { year: 2024, month: 1, day: 20, hour: 12, minute: 0 };
      const result = resolveRelativeDateInZone('friday', saturday, tz);
      expect(result!.day).toBe(26);
    });

    it('parses ISO date strings into zone parts', () => {
      const result = resolveRelativeDateInZone('2024-01-20', todayParts, tz);
      expect(result!.day).toBe(20);
    });

    it('returns null for ambiguous timing like "soon"', () => {
      const result = resolveRelativeDateInZone('soon', todayParts, tz);
      expect(result).toBeNull();
    });

    it('returns null for invalid input', () => {
      const result = resolveRelativeDateInZone('invalid date string', todayParts, tz);
      expect(result).toBeNull();
    });
  });

  describe('timezone-aware fallback parsing', () => {
    it('resolves "tomorrow" correctly near UTC midnight for a west-of-UTC user', () => {
      // 2024-06-10T01:00:00Z = 2024-06-09 evening in New York (UTC-4).
      // Local calendar says June 9, so "tomorrow" must be June 10 — not June 11.
      const ctx = {
        timezone: 'America/New_York',
        currentTimeUtc: '2024-06-10T01:00:00.000Z',
      };
      const result = parseWithFallback('Submit form by tomorrow', ctx);
      expect(result.deadlineUtc).toBeTruthy();
      const d = new Date(result.deadlineUtc!);
      const wall = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(d);
      const get = (t: string) => wall.find((p) => p.type === t)!.value;
      expect(`${get('month')}-${get('day')}`).toBe('06-10');
      expect(`${get('hour')}:${get('minute')}`).toBe('23:59'); // no time given → end of day
    });

    it('uses an explicit clock time when provided', () => {
      const ctx = { timezone: 'Asia/Kolkata', currentTimeUtc: '2024-06-10T04:00:00.000Z' };
      const result = parseWithFallback('Call client by tomorrow at 6pm', ctx);
      expect(result.deadlineUtc).toBeTruthy();
      // 6pm IST on Jun 11 == 12:30Z
      expect(new Date(result.deadlineUtc!).toISOString()).toBe('2024-06-11T12:30:00.000Z');
    });

    it('preserves ambiguity: "soon" produces no deadline', () => {
      const ctx = { timezone: 'UTC', currentTimeUtc: '2024-06-10T10:00:00.000Z' };
      const result = parseWithFallback('Work on physics soon', ctx);
      expect(result.deadlineUtc).toBeNull();
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

  describe('extractJsonBlock — malformed model output handling', () => {
    it('parses clean JSON', () => {
      expect(extractJsonBlock('{"title":"X"}')).toEqual({ title: 'X' });
    });

    it('parses JSON wrapped in markdown fences with prose around it', () => {
      const text = 'Sure! Here is the task:\n```json\n{"title":"Wrapped"}\n```\nDone.';
      expect(extractJsonBlock(text)).toEqual({ title: 'Wrapped' });
    });

    it('throws on free-form text with no JSON object', () => {
      expect(() => extractJsonBlock('I could not understand that request.')).toThrow();
    });

    it('throws on truncated JSON', () => {
      expect(() => extractJsonBlock('{"title":"Broken", "priorityFlag":')).toThrow();
    });
  });

  describe('parseTaskWithAI', () => {
    it('falls back when no API key configured, reporting source and warning', async () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const result = await parseTaskWithAI('Buy groceries', {
        timezone: 'UTC',
        currentTimeUtc: new Date('2024-01-15T12:00:00Z').toISOString(),
      });

      expect(result.source).toBe('fallback');
      expect(result.warning).toBeTruthy();
      expect(result.parsedTask.title).toBe('Buy groceries');
      expect(result.parsedTask.confidence).toBe(0.6);
    });
  });
});
