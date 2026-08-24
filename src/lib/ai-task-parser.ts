import { z } from 'zod';

export const parseTaskInputSchema = z.object({
  input: z.string().min(1).max(2000),
  userContext: z
    .object({
      timezone: z.string(),
      subjects: z
        .array(z.object({ id: z.string().uuid(), name: z.string(), code: z.string().optional() }))
        .optional(),
      projects: z.array(z.object({ id: z.string().uuid(), title: z.string() })).optional(),
      clients: z.array(z.object({ id: z.string().uuid(), name: z.string() })).optional(),
      currentTimeUtc: z.string().datetime(),
    })
    .optional(),
});

export type ParseTaskInput = z.infer<typeof parseTaskInputSchema>;

export const parsedTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  deadlineUtc: z.string().datetime().optional().nullable(),
  priorityFlag: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  estimatedMinutes: z.number().int().positive().max(1440).default(30),
  energyRequired: z.enum(['low', 'balanced', 'high']).default('balanced'),
  subjectCode: z.string().optional(),
  projectTitle: z.string().optional(),
  clientName: z.string().optional(),
  subtasks: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.8),
});

export type ParsedTask = z.infer<typeof parsedTaskSchema>;

/** How precisely the source text established the deadline. */
export type DeadlinePrecision = 'none' | 'date' | 'datetime';

export interface ParseTaskResult {
  parsedTask: ParsedTask;
  /** Which path produced this result: a live provider or the offline heuristic. */
  source: 'ai' | 'fallback';
  /** Non-fatal notice for the UI (e.g. provider unavailable → heuristic used). */
  warning?: string;
}

const SYSTEM_PROMPT = `You are Chronova's task parser. Convert natural language into structured task data.

Rules:
1. Extract title, deadline, priority, duration, energy level
2. Infer subject/project/client from context if mentioned
3. Break down into subtasks only if explicitly implied
4. Return ONLY valid JSON matching this exact shape:
{"title":string,"description":string|null,"deadlineUtc":ISO-string|null,"priorityFlag":"low"|"medium"|"high"|"critical","estimatedMinutes":number,"energyRequired":"low"|"balanced"|"high","subtasks":string[],"tags":string[],"confidence":number}
5. DATE POLICY (critical):
   - "currentTimeUtc" and the user's IANA timezone are provided below.
   - Resolve relative days ("tomorrow", "this Friday", "next Monday") against the USER'S timezone calendar, then convert to the exact UTC instant.
   - If the text specifies a clock time ("at 6pm", "by 14:30"), use it in the user's timezone.
   - If NO clock time is specified, do NOT invent one: set deadlineUtc to 23:59 in the user's timezone for that date.
   - Vague timing like "soon", "eventually", "someday" means NO deadline: return null.
6. Priority keywords: "urgent"/"asap"/"critical"=critical, "important"/"high"=high, "low"/"whenever"=low. Default medium.
7. Energy keywords: "deep work"/"focus"/"hard"=high, "easy"/"light"/"admin"=low. Default balanced.
8. Duration: parse "X hours", "X mins", "Xh", "Xm". Default 30 minutes if unstated.
9. Set confidence between 0 and 1 based on how much was explicit vs inferred.`;

const PROVIDER_TIMEOUT_MS = 12_000;

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${PROVIDER_TIMEOUT_MS}ms`)),
          PROVIDER_TIMEOUT_MS
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function extractJsonBlock(text: string): unknown {
  const cleaned = text.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in model output');
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function parseTaskWithAI(
  input: string,
  context?: ParseTaskInput['userContext']
): Promise<ParseTaskResult> {
  const provider = process.env.AI_PROVIDER || 'gemini';

  // AI remains OPTIONAL: without keys Chronova falls back to deterministic parsing.
  if (provider === 'gemini' && !process.env.GEMINI_API_KEY) {
    return {
      parsedTask: parseWithFallback(input, context),
      source: 'fallback',
      warning: 'AI provider not configured — heuristic parsing used.',
    };
  }
  if (provider === 'claude' && !process.env.ANTHROPIC_API_KEY) {
    return {
      parsedTask: parseWithFallback(input, context),
      source: 'fallback',
      warning: 'AI provider not configured — heuristic parsing used.',
    };
  }

  try {
    if (provider === 'gemini') {
      return { parsedTask: await parseWithGemini(input, context), source: 'ai' };
    } else if (provider === 'claude') {
      return { parsedTask: await parseWithClaude(input, context), source: 'ai' };
    }
  } catch (error) {
    console.error('AI parse failure:', error instanceof Error ? error.message : error);
    return {
      parsedTask: parseWithFallback(input, context),
      source: 'fallback',
      warning: 'AI provider unavailable — heuristic parsing used.',
    };
  }

  return {
    parsedTask: parseWithFallback(input, context),
    source: 'fallback',
    warning: `Unknown AI provider "${provider}" — heuristic parsing used.`,
  };
}

function buildPrompt(input: string, context?: ParseTaskInput['userContext']): string {
  const tz = context?.timezone || 'UTC';
  return `${SYSTEM_PROMPT}

User timezone: ${tz}
Current time (UTC): ${context?.currentTimeUtc || new Date().toISOString()}

${context?.subjects?.length ? `Known subjects: ${JSON.stringify(context.subjects)}` : ''}
${context?.projects?.length ? `Known projects: ${JSON.stringify(context.projects)}` : ''}
${context?.clients?.length ? `Known clients: ${JSON.stringify(context.clients)}` : ''}

User input: "${input}"

Return JSON only:`;
}

async function parseWithGemini(
  input: string,
  context?: ParseTaskInput['userContext']
): Promise<ParsedTask> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    generationConfig: { temperature: 0.1 },
  });

  const result = await withTimeout(model.generateContent(buildPrompt(input, context)), 'Gemini');
  const text = result.response.text();
  const json = extractJsonBlock(text);
  return parsedTaskSchema.parse(json);
}

async function parseWithClaude(
  input: string,
  context?: ParseTaskInput['userContext']
): Promise<ParsedTask> {
  const { Anthropic } = await import('@anthropic-ai/sdk');
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const result = await withTimeout(
    anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest',
      max_tokens: 600,
      messages: [{ role: 'user', content: buildPrompt(input, context) }],
    }),
    'Anthropic'
  );

  const text = result.content[0].type === 'text' ? result.content[0].text : '';
  const json = extractJsonBlock(text);
  return parsedTaskSchema.parse(json);
}

// ---------- Deterministic offline fallback ----------

interface TzParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function getWallClock(date: Date, timeZone: string): TzParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: parseInt(parts.year, 10),
    month: parseInt(parts.month, 10),
    day: parseInt(parts.day, 10),
    hour: parseInt(parts.hour, 10),
    minute: parseInt(parts.minute, 10),
  };
}

/**
 * Convert wall-clock time in an IANA timezone to a UTC instant.
 * Deterministic: resolves the offset by testing which UTC instant produces
 * the requested wall clock in that zone (handles DST boundaries).
 */
function wallClockToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  let utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  for (let i = 0; i < 2; i++) {
    const asTz = getWallClock(new Date(utcGuess), timeZone);
    const asIfUtc = Date.UTC(asTz.year, asTz.month - 1, asTz.day, asTz.hour, asTz.minute);
    const diff = Date.UTC(year, month - 1, day, hour, minute) - asIfUtc;
    utcGuess += diff;
  }
  return new Date(utcGuess);
}

const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export function parseWithFallback(
  input: string,
  context?: ParseTaskInput['userContext']
): ParsedTask {
  const lower = input.toLowerCase();
  const timeZone = context?.timezone || 'UTC';
  const nowUtc = context?.currentTimeUtc ? new Date(context.currentTimeUtc) : new Date();
  const local = getWallClock(nowUtc, timeZone);

  let deadlineUtc: string | null = null;
  let deadlinePrecision: DeadlinePrecision = 'none';
  let explicitTime = false;

  // Explicit clock time anywhere in the text ("at 6pm", "@14:30").
  const timeMatch = input.match(/\b(?:at|@)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (timeMatch && timeMatch[1]) {
    explicitTime = true;
  }

  // Date fragments may appear with a preposition ("by Friday") or bare
  // ("submit tomorrow", "meeting monday").
  const prepMatch = input.match(/(by|due|before)\s+(.+?)(?:\s|$|,|\.)/i);
  const bareTemporalMatch = !prepMatch
    ? input.match(
        /\b(today|tonight|tomorrow)\b|\b(?:(?:this|next)\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|\b(?:jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|jun(e)?|jul(y)?|aug(ust)?|sep(tember)?|oct(ober)?|nov(ember)?|dec(ember)?)\.?\s+\d{1,2}\b/i
      )
    : null;
  const dateFragment = prepMatch ? prepMatch[2].trim() : bareTemporalMatch?.[0];

  if (dateFragment) {
    const cleaned = dateFragment.trim().replace(/[.,]$/, '');
    const resolved = resolveRelativeDateInZone(cleaned, local, timeZone);
    if (resolved) {
      let hour = 23;
      let minute = 59;
      if (explicitTime && timeMatch) {
        hour = normalizeHour(timeMatch[1], timeMatch[2], timeMatch[3]);
        // "at 6pm" means exactly 6:00 — only unspecified times land at day end.
        minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      } else if (/^tonight$/i.test(cleaned)) {
        // "tonight" carries implicit evening timing — deterministic 20:00.
        hour = 20;
        minute = 0;
      }
      deadlineUtc = wallClockToUtc(
        resolved.year,
        resolved.month,
        resolved.day,
        hour,
        minute,
        timeZone
      ).toISOString();
      deadlinePrecision = explicitTime || /^tonight$/i.test(cleaned) ? 'datetime' : 'date';
    }
  }

  let priorityFlag: ParsedTask['priorityFlag'] = 'medium';
  if (/\b(urgent|asap|critical|emergency)\b/i.test(lower)) priorityFlag = 'critical';
  else if (/\b(important|high priority|high)\b/i.test(lower)) priorityFlag = 'high';
  else if (/\b(low priority|low|whenever|someday)\b/i.test(lower)) priorityFlag = 'low';

  let estimatedMinutes = 30;
  const durationMatch = input.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)\b/i);
  if (durationMatch) {
    const value = parseFloat(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    if (unit.startsWith('h')) estimatedMinutes = Math.round(value * 60);
    else estimatedMinutes = Math.round(value);
  }

  let energyRequired: ParsedTask['energyRequired'] = 'balanced';
  if (/\b(deep work|focus|hard|complex|difficult|intense)\b/i.test(lower)) energyRequired = 'high';
  else if (/\b(easy|light|simple|admin|quick|routine)\b/i.test(lower)) energyRequired = 'low';

  const title = extractTitle(input);

  return {
    title,
    deadlineUtc,
    priorityFlag,
    estimatedMinutes: Math.min(1440, Math.max(5, estimatedMinutes)),
    energyRequired,
    subtasks: [],
    tags: [],
    // Lower confidence than live AI: deterministic heuristics are conservative.
    confidence: deadlinePrecision === 'datetime' ? 0.75 : 0.6,
  };
}

function normalizeHour(
  hourStr: string,
  minuteStr: string | undefined,
  meridiem: string | undefined
): number {
  let hour = parseInt(hourStr, 10);
  if (meridiem?.toLowerCase() === 'pm' && hour < 12) hour += 12;
  if (meridiem?.toLowerCase() === 'am' && hour === 12) hour = 0;
  return Math.min(23, hour);
}

/**
 * Resolve a natural-language date fragment against the user's calendar
 * (not UTC), returning the wall-clock Y/M/D of the target day.
 * Returns null when the text does not establish a usable date.
 */
export function resolveRelativeDateInZone(
  str: string,
  todayParts: TzParts,
  timeZone: string
): TzParts | null {
  const lower = str.toLowerCase().trim();

  // No date at all — ambiguity must be preserved, not invented.
  if (/^(soon|later|eventually|someday|asap)$/.test(lower)) return null;

  const noonUtcToday = wallClockToUtc(
    todayParts.year,
    todayParts.month,
    todayParts.day,
    12,
    0,
    timeZone
  );

  if (lower === 'today' || lower === 'tonight') return todayParts;
  if (lower === 'tomorrow') {
    const t = new Date(noonUtcToday.getTime());
    t.setUTCDate(t.getUTCDate() + 1);
    return getWallClock(t, timeZone);
  }
  if (lower === 'next week') {
    const t = new Date(noonUtcToday.getTime());
    t.setUTCDate(t.getUTCDate() + 7);
    return getWallClock(t, timeZone);
  }

  const dayMatch = lower.match(
    /^(?:this\s+|next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/
  );
  if (dayMatch) {
    const targetDay = WEEKDAYS.indexOf(dayMatch[1] as (typeof WEEKDAYS)[number]);
    // Day-of-week of "today" in the user's zone, computed via noon-UTC anchor.
    const weekdayOfToday = new Date(noonUtcToday).getUTCDay();
    let diff = targetDay - weekdayOfToday;
    if (lower.startsWith('next')) diff = diff <= 0 ? diff + 7 : diff;
    else if (diff < 0) diff += 7;
    const t = new Date(noonUtcToday.getTime());
    t.setUTCDate(t.getUTCDate() + diff);
    return getWallClock(t, timeZone);
  }

  // Bare calendar dates ("2024-01-20", "January 20, 2024") denote that calendar
  // day itself — never shift them through timezone conversion.
  const bareDate = lower.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (bareDate) {
    return {
      year: parseInt(bareDate[1], 10),
      month: parseInt(bareDate[2], 10),
      day: parseInt(bareDate[3], 10),
      hour: 12,
      minute: 0,
    };
  }

  // Month-name forms like "September 3" / "Sep 3" (optionally with year).
  const monthName = lower.match(
    /^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})(?:,?\s+(\d{4}))?$/
  );
  if (monthName) {
    const months: Record<string, number> = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
      jan: 1,
      feb: 2,
      mar: 3,
      apr: 4,
      jun: 6,
      jul: 7,
      aug: 8,
      sep: 9,
      oct: 10,
      nov: 11,
      dec: 12,
    };
    const m = months[monthName[1]];
    if (m) {
      const year = monthName[3] ? parseInt(monthName[3], 10) : todayParts.year;
      return { year, month: m, day: parseInt(monthName[2], 10), hour: 12, minute: 0 };
    }
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    // Full ISO datetimes carry their instant; convert to zone parts.
    if (/T\d{2}:\d{2}/.test(str)) return getWallClock(parsed, timeZone);
    // Anything else Date parsed is treated as a calendar date.
    return getWallClock(
      new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12)),
      'UTC'
    );
  }

  return null;
}

export function extractTitle(input: string): string {
  const cleaned = input
    .replace(/^(need to|have to|must|should|want to|going to)\s+/i, '')
    .replace(/\s+(by|due|before)\s+.+$/i, '')
    .replace(/\s+(high|low|critical|urgent)\s+priority/i, '')
    .replace(/\s+(for\s+)?(\d+(?:\.\d+)?\s*(hours?|hrs?|h|minutes?|mins?|m))\b/i, '')
    .trim();

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
