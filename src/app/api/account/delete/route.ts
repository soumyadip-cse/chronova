export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withTransaction } from '@/db/tx';
import {
  users,
  userProfiles,
  tasks,
  calendarEvents,
  focusSessions,
  scheduleBlocks,
  subjects,
  topics,
  importantQuestions,
  assignments,
  exams,
  clients,
  projects,
  deliverables,
  founderGoals,
  aiConversations,
  aiActivities,
  integrationAccounts,
  auditLogs,
  exportJobs,
  recurringRules,
  timeJourneyEvents,
  soundscapePresets,
} from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { ApiError } from '@/lib/api-error';
import { errorHandler } from '@/lib/error-handler';

const deleteSchema = z.object({
  confirmation: z.string().min(1),
  email: z.string().email(),
});

async function handleDelete(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw ApiError.unauthorized();
  }

  const body = await request.json();
  const parsed = deleteSchema.safeParse(body);

  if (!parsed.success) {
    throw ApiError.badRequest('Invalid input', { issues: parsed.error.flatten() });
  }

  if (parsed.data.confirmation !== 'DELETE MY ACCOUNT') {
    throw ApiError.badRequest('Please type "DELETE MY ACCOUNT" to confirm');
  }

  if (parsed.data.email !== session.user.email) {
    throw ApiError.badRequest('Email does not match');
  }

  const userId = session.user.id;

  await withTransaction(async (tx) => {
    // Delete child tables first (those referencing userId directly or through parents)
    await tx.delete(tasks).where(eq(tasks.userId, userId));
    await tx.delete(calendarEvents).where(eq(calendarEvents.userId, userId));
    await tx.delete(focusSessions).where(eq(focusSessions.userId, userId));
    await tx.delete(scheduleBlocks).where(eq(scheduleBlocks.userId, userId));
    await tx.delete(assignments).where(eq(assignments.userId, userId));
    await tx.delete(exams).where(eq(exams.userId, userId));
    await tx.delete(clients).where(eq(clients.userId, userId));
    await tx.delete(projects).where(eq(projects.userId, userId));
    await tx.delete(founderGoals).where(eq(founderGoals.userId, userId));
    await tx.delete(aiConversations).where(eq(aiConversations.userId, userId));
    await tx.delete(aiActivities).where(eq(aiActivities.userId, userId));
    await tx.delete(integrationAccounts).where(eq(integrationAccounts.userId, userId));
    await tx.delete(auditLogs).where(eq(auditLogs.userId, userId));
    await tx.delete(exportJobs).where(eq(exportJobs.userId, userId));
    await tx.delete(recurringRules).where(eq(recurringRules.userId, userId));
    await tx.delete(timeJourneyEvents).where(eq(timeJourneyEvents.userId, userId));
    await tx.delete(soundscapePresets).where(eq(soundscapePresets.userId, userId));

    // Delete topics through subjects
    const userSubjects = await tx
      .select({ id: subjects.id })
      .from(subjects)
      .where(eq(subjects.userId, userId));
    const subjectIds = userSubjects.map((s) => s.id);
    if (subjectIds.length > 0) {
      await tx.delete(importantQuestions).where(
        inArray(
          importantQuestions.topicId,
          (
            await tx
              .select({ id: topics.id })
              .from(topics)
              .where(inArray(topics.subjectId, subjectIds))
          ).map((t) => t.id)
        )
      );
      await tx.delete(topics).where(inArray(topics.subjectId, subjectIds));
    }
    await tx.delete(subjects).where(eq(subjects.userId, userId));

    // Delete deliverables through projects
    const userProjects = await tx
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.userId, userId));
    const projectIds = userProjects.map((p) => p.id);
    if (projectIds.length > 0) {
      await tx.delete(deliverables).where(inArray(deliverables.projectId, projectIds));
    }

    await tx.delete(userProfiles).where(eq(userProfiles.userId, userId));
    await tx.delete(users).where(eq(users.id, userId));
  });

  return NextResponse.json({ success: true, message: 'Account permanently deleted' });
}

// Wrap with the shared error mapper so thrown ApiErrors (e.g. typed
// confirmation mismatches) surface as proper 4xx responses, not 500s.
export async function POST(request: NextRequest) {
  return errorHandler(request, () => handleDelete(request));
}
