export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parseTaskWithAI, parseTaskInputSchema } from '@/lib/ai-task-parser';
import { withAIRateLimit } from '@/lib/with-rate-limit';

async function handleParseTask(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = parseTaskInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { input, userContext } = parsed.data;

  const context = {
    ...userContext,
    timezone: session.user.timezone,
    currentTimeUtc: new Date().toISOString(),
  };

  const parsedTask = await parseTaskWithAI(input, context);

  return NextResponse.json({ parsedTask });
}

export const POST = withAIRateLimit(handleParseTask);
