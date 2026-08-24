export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import {
  users,
  userProfiles,
  tasks,
  calendarEvents,
  focusSessions,
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
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { withExportRateLimit } from '@/lib/with-rate-limit';

const exportSchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
});

async function handleExport(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = exportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const userId = session.user.id;
  const format = parsed.data.format;

  const [exportJob] = await db
    .insert(exportJobs)
    .values({
      userId,
      format,
      status: 'processing',
    })
    .returning();

  try {
    const data = await gatherUserData(userId);

    let mimeType: string;
    let filename: string;

    if (format === 'json') {
      mimeType = 'application/json';
      filename = `nexora-export-${new Date().toISOString().split('T')[0]}.json`;
    } else {
      mimeType = 'text/csv';
      filename = `nexora-export-${new Date().toISOString().split('T')[0]}.csv`;
    }

    // Stream the response directly instead of creating a blob URL
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (format === 'json') {
            // Stream JSON in chunks to avoid memory issues
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode('{\n'));

            let firstSection = true;
            for (const [section, items] of Object.entries(data)) {
              if (!Array.isArray(items) || items.length === 0) continue;

              if (!firstSection) {
                controller.enqueue(encoder.encode(',\n'));
              }
              firstSection = false;

              controller.enqueue(encoder.encode(`  "${section}": `));
              controller.enqueue(encoder.encode('[\n'));

              for (let i = 0; i < items.length; i++) {
                const itemStr = JSON.stringify(items[i], null, 2)
                  .split('\n')
                  .map((line) => '    ' + line)
                  .join('\n');
                controller.enqueue(encoder.encode(itemStr));
                if (i < items.length - 1) {
                  controller.enqueue(encoder.encode(',\n'));
                } else {
                  controller.enqueue(encoder.encode('\n'));
                }
              }
              controller.enqueue(encoder.encode('  ]'));
            }

            controller.enqueue(encoder.encode('\n}'));
          } else {
            // Stream CSV
            const encoder = new TextEncoder();
            for (const [section, items] of Object.entries(data)) {
              if (!Array.isArray(items) || items.length === 0) continue;

              controller.enqueue(encoder.encode(`\n# ${section.toUpperCase()}\n`));
              const headers = Object.keys(items[0]);
              controller.enqueue(encoder.encode(headers.join(',') + '\n'));

              for (const item of items) {
                const row = headers.map((h) => {
                  const val = item[h];
                  if (val === null || val === undefined) return '';
                  if (typeof val === 'object') return JSON.stringify(val).replace(/"/g, '""');
                  return String(val).replace(/"/g, '""');
                });
                controller.enqueue(encoder.encode(row.map((v) => `"${v}"`).join(',') + '\n'));
              }
            }
          }

          await db
            .update(exportJobs)
            .set({
              status: 'completed',
              completedAtUtc: new Date(),
            })
            .where(eq(exportJobs.id, exportJob.id));
        } catch (error) {
          await db
            .update(exportJobs)
            .set({
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
            })
            .where(eq(exportJobs.id, exportJob.id));
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    await db
      .update(exportJobs)
      .set({
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
      .where(eq(exportJobs.id, exportJob.id));

    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

async function gatherUserData(userId: string) {
  const [
    user,
    profile,
    userTasks,
    calEvents,
    focusSessionsData,
    userSubjects,
    userTopics,
    userQuestions,
    userAssignments,
    userExams,
    userClients,
    userProjects,
    userDeliverables,
    userGoals,
    aiConvs,
    aiActs,
    integrations,
    audits,
  ] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)),
    db.select().from(userProfiles).where(eq(userProfiles.userId, userId)),
    db.select().from(tasks).where(eq(tasks.userId, userId)),
    db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId)),
    db.select().from(focusSessions).where(eq(focusSessions.userId, userId)),
    db.select().from(subjects).where(eq(subjects.userId, userId)),
    db
      .select()
      .from(topics)
      .innerJoin(subjects, eq(topics.subjectId, subjects.id))
      .where(eq(subjects.userId, userId))
      .then((r) => r.map((t) => t.topics)),
    db
      .select()
      .from(importantQuestions)
      .innerJoin(topics, eq(importantQuestions.topicId, topics.id))
      .innerJoin(subjects, eq(topics.subjectId, subjects.id))
      .where(eq(subjects.userId, userId))
      .then((r) => r.map((t) => t.important_questions)),
    db.select().from(assignments).where(eq(assignments.userId, userId)),
    db.select().from(exams).where(eq(exams.userId, userId)),
    db.select().from(clients).where(eq(clients.userId, userId)),
    db.select().from(projects).where(eq(projects.userId, userId)),
    db
      .select()
      .from(deliverables)
      .innerJoin(projects, eq(deliverables.projectId, projects.id))
      .where(eq(projects.userId, userId))
      .then((r) => r.map((t) => t.deliverables)),
    db.select().from(founderGoals).where(eq(founderGoals.userId, userId)),
    db.select().from(aiConversations).where(eq(aiConversations.userId, userId)),
    db.select().from(aiActivities).where(eq(aiActivities.userId, userId)),
    db.select().from(integrationAccounts).where(eq(integrationAccounts.userId, userId)),
    db.select().from(auditLogs).where(eq(auditLogs.userId, userId)),
  ]);

  return {
    exportDate: new Date().toISOString(),
    version: '2.5',
    user: sanitizeUser(user[0]),
    profile: profile[0] ? sanitizeProfile(profile[0]) : null,
    tasks: userTasks.map(sanitizeTask),
    calendarEvents: calEvents.map(sanitizeCalendarEvent),
    focusSessions: focusSessionsData.map(sanitizeFocusSession),
    subjects: userSubjects.map(sanitizeSubject),
    topics: userTopics.map(sanitizeTopic),
    importantQuestions: userQuestions.map(sanitizeQuestion),
    assignments: userAssignments.map(sanitizeAssignment),
    exams: userExams.map(sanitizeExam),
    clients: userClients.map(sanitizeClient),
    projects: userProjects.map(sanitizeProject),
    deliverables: userDeliverables.map(sanitizeDeliverable),
    founderGoals: userGoals.map(sanitizeGoal),
    aiConversations: aiConvs.map(sanitizeAIConversation),
    aiActivities: aiActs.map(sanitizeAIActivity),
    integrations: integrations.map(sanitizeIntegration),
    auditLogs: audits.map(sanitizeAuditLog),
  };
}

function sanitizeUser(u: any) {
  const { passwordHash, ...rest } = u;
  return rest;
}

function sanitizeProfile(p: any) {
  return p;
}

function sanitizeTask(t: any) {
  return t;
}

function sanitizeCalendarEvent(e: any) {
  return e;
}

function sanitizeFocusSession(f: any) {
  return f;
}

function sanitizeSubject(s: any) {
  return s;
}

function sanitizeTopic(t: any) {
  return t;
}

function sanitizeQuestion(q: any) {
  return q;
}

function sanitizeAssignment(a: any) {
  return a;
}

function sanitizeExam(e: any) {
  return e;
}

function sanitizeClient(c: any) {
  return c;
}

function sanitizeProject(p: any) {
  return p;
}

function sanitizeDeliverable(d: any) {
  return d;
}

function sanitizeGoal(g: any) {
  return g;
}

function sanitizeAIConversation(c: any) {
  return c;
}

function sanitizeAIActivity(a: any) {
  return a;
}

function sanitizeIntegration(i: any) {
  const { accessToken, refreshToken, ...rest } = i;
  return { ...rest, hasTokens: !!(accessToken || refreshToken) };
}

function sanitizeAuditLog(a: any) {
  return a;
}

export const POST = withExportRateLimit(handleExport);
