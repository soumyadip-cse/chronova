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

const SYSTEM_PROMPT = `You are Chronova's task parser. Convert natural language into structured task data.

Rules:
1. Extract title, deadline, priority, duration, energy level
2. Infer subject/project/client from context if mentioned
3. Break down into subtasks if implied
4. Return ONLY valid JSON matching the schema
5. Use UTC for all timestamps
6. Default priority: medium, duration: 30min, energy: balanced
7. Priority keywords: "urgent"/"asap"/"critical"=critical, "important"/"high"=high, "low"/"whenever"=low
8. Energy keywords: "deep work"/"focus"/"hard"=high, "easy"/"light"/"admin"=low
9. Duration: parse "X hours", "X mins", "Xh", "Xm"`;

export async function parseTaskWithAI(
  input: string,
  context?: ParseTaskInput['userContext']
): Promise<ParsedTask> {
  const provider = process.env.AI_PROVIDER || 'gemini';

  // Check if the required API key is available for the selected provider
  if (provider === 'gemini' && !process.env.GEMINI_API_KEY) {
    return parseWithFallback(input, context);
  }
  if (provider === 'claude' && !process.env.ANTHROPIC_API_KEY) {
    return parseWithFallback(input, context);
  }

  if (provider === 'gemini') {
    return parseWithGemini(input, context);
  } else if (provider === 'claude') {
    return parseWithClaude(input, context);
  }

  return parseWithFallback(input, context);
}

async function parseWithGemini(
  input: string,
  context?: ParseTaskInput['userContext']
): Promise<ParsedTask> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `${SYSTEM_PROMPT}

User input: "${input}"

${context ? `Context: ${JSON.stringify(context)}` : ''}

Current time: ${context?.currentTimeUtc || new Date().toISOString()}

Return JSON only:`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const json = JSON.parse(text.replace(/```json|```/g, '').trim());
    return parsedTaskSchema.parse(json);
  } catch (e) {
    console.error('Gemini parse error:', e, 'Raw:', text);
    return parseWithFallback(input, context);
  }
}

async function parseWithClaude(
  input: string,
  context?: ParseTaskInput['userContext']
): Promise<ParsedTask> {
  const { Anthropic } = await import('@anthropic-ai/sdk');
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const prompt = `${SYSTEM_PROMPT}

User input: "${input}"

${context ? `Context: ${JSON.stringify(context)}` : ''}

Current time: ${context?.currentTimeUtc || new Date().toISOString()}

Return JSON only:`;

  const result = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = result.content[0].type === 'text' ? result.content[0].text : '';

  try {
    const json = JSON.parse(text.replace(/```json|```/g, '').trim());
    return parsedTaskSchema.parse(json);
  } catch (e) {
    console.error('Claude parse error:', e, 'Raw:', text);
    return parseWithFallback(input, context);
  }
}

export function parseWithFallback(
  input: string,
  context?: ParseTaskInput['userContext']
): ParsedTask {
  const lower = input.toLowerCase();
  const now = context?.currentTimeUtc ? new Date(context.currentTimeUtc) : new Date();

  let deadlineUtc: string | null = null;
  const deadlineMatch = input.match(/(by|due|before)\s+(.+?)(?:\s|$|,|\.)/i);
  if (deadlineMatch) {
    const dateStr = deadlineMatch[2].trim();
    const parsed = parseRelativeDate(dateStr, now);
    if (parsed) deadlineUtc = parsed.toISOString();
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
    confidence: 0.6,
  };
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

export function parseRelativeDate(str: string, base: Date): Date | null {
  const lower = str.toLowerCase().trim();
  const result = new Date(base);

  if (lower === 'today') return result;
  if (lower === 'tomorrow') {
    result.setDate(result.getDate() + 1);
    return result;
  }
  if (lower === 'next week') {
    result.setDate(result.getDate() + 7);
    return result;
  }

  const dayMatch = lower.match(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i);
  if (dayMatch) {
    const targetDay = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ].indexOf(dayMatch[1].toLowerCase());
    const currentDay = result.getDay();
    let diff = targetDay - currentDay;
    if (diff <= 0) diff += 7;
    result.setDate(result.getDate() + diff);
    return result;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;

  return null;
}
