export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { withTransaction } from '@/db/tx';
import { integrationAccounts, assignments, subjects, topics, auditLogs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { google } from 'googleapis';
import { encrypt, decrypt } from '@/lib/crypto';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
);

async function getValidAccessToken(userId: string): Promise<string | null> {
  const account = await db
    .select()
    .from(integrationAccounts)
    .where(
      and(
        eq(integrationAccounts.userId, userId),
        eq(integrationAccounts.provider, 'google_classroom')
      )
    )
    .limit(1);

  if (!account[0]) return null;

  // Decrypt tokens
  let accessToken = account[0].accessToken;
  let refreshToken = account[0].refreshToken;

  if (accessToken && (await isEncryptedValue(accessToken))) {
    accessToken = await decrypt(accessToken);
  }
  if (refreshToken && (await isEncryptedValue(refreshToken))) {
    refreshToken = await decrypt(refreshToken);
  }

  if (account[0].expiresAtUtc && new Date(account[0].expiresAtUtc) < new Date()) {
    if (!refreshToken) return null;

    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();

    const encryptedAccessToken = await encrypt(credentials.access_token!);
    const encryptedRefreshToken = credentials.refresh_token
      ? await encrypt(credentials.refresh_token)
      : refreshToken;

    await db
      .update(integrationAccounts)
      .set({
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAtUtc: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
        updatedAt: new Date(),
      })
      .where(eq(integrationAccounts.id, account[0].id));

    return credentials.access_token!;
  }

  return accessToken;
}

async function isEncryptedValue(value: string): Promise<boolean> {
  try {
    const buffer = Buffer.from(value, 'base64');
    return buffer.length > 28; // IV(12) + TAG(16) + min data
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'sync') {
    return syncClassroomData(session.user.id);
  }

  if (action === 'status') {
    const account = await db
      .select()
      .from(integrationAccounts)
      .where(
        and(
          eq(integrationAccounts.userId, session.user.id),
          eq(integrationAccounts.provider, 'google_classroom')
        )
      )
      .limit(1);

    return NextResponse.json({
      connected: !!account[0],
      lastSync: account[0]?.lastSyncUtc,
      email: account[0]?.email,
    });
  }

  if (action === 'courses') {
    return listCourses(session.user.id);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

async function listCourses(userId: string) {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) {
    return NextResponse.json({ error: 'Not connected' }, { status: 401 });
  }

  oauth2Client.setCredentials({ access_token: accessToken });
  const classroom = google.classroom({ version: 'v1', auth: oauth2Client });

  try {
    const response = await classroom.courses.list({ courseStates: ['ACTIVE'] });
    return NextResponse.json({ courses: response.data.courses || [] });
  } catch (error) {
    console.error('Classroom courses error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

async function syncClassroomData(userId: string) {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) {
    return NextResponse.json({ error: 'Not connected or token expired' }, { status: 401 });
  }

  oauth2Client.setCredentials({ access_token: accessToken });
  const classroom = google.classroom({ version: 'v1', auth: oauth2Client });

  try {
    const coursesResponse = await classroom.courses.list({ courseStates: ['ACTIVE'] });
    const courses = coursesResponse.data.courses || [];

    let totalAssignments = 0;
    let created = 0;
    let updated = 0;

    await withTransaction(async (tx) => {
      for (const course of courses) {
        if (!course.id || !course.name) continue;

        let subject = await tx
          .select()
          .from(subjects)
          .where(and(eq(subjects.userId, userId), eq(subjects.code, course.courseState || '')))
          .limit(1);

        if (!subject[0]) {
          const [newSubject] = await tx
            .insert(subjects)
            .values({
              userId,
              name: course.name,
              code: course.id,
              color: '#3B82F6',
            })
            .returning();
          subject = [newSubject];
        }

        const courseworkResponse = await classroom.courses.courseWork.list({ courseId: course.id });
        const coursework = courseworkResponse.data.courseWork || [];

        for (const work of coursework) {
          if (!work.id || !work.title) continue;

          const dueDate =
            work.dueDate && work.dueTime
              ? new Date(
                  `${work.dueDate.year}-${String(work.dueDate.month).padStart(2, '0')}-${String(work.dueDate.day).padStart(2, '0')}T${String(work.dueTime.hours || 0).padStart(2, '0')}:${String(work.dueTime.minutes || 0).padStart(2, '0')}:00Z`
                )
              : work.dueDate
                ? new Date(
                    `${work.dueDate.year}-${String(work.dueDate.month).padStart(2, '0')}-${String(work.dueDate.day).padStart(2, '0')}T23:59:00Z`
                  )
                : null;

          const existing = await tx
            .select()
            .from(assignments)
            .where(
              and(eq(assignments.externalClassroomId, work.id), eq(assignments.userId, userId))
            )
            .limit(1);

          const assignmentData = {
            userId,
            subjectId: subject[0].id,
            externalClassroomId: work.id,
            title: work.title,
            description: work.description || null,
            dueUtc: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            effortHours: estimateEffort(work),
            status: work.state === 'PUBLISHED' ? ('pending' as const) : ('overdue' as const),
            maxPoints: work.maxPoints || null,
          };

          if (existing[0]) {
            await tx
              .update(assignments)
              .set({ ...assignmentData, updatedAt: new Date() })
              .where(eq(assignments.id, existing[0].id));
            updated++;
          } else {
            await tx.insert(assignments).values(assignmentData);
            created++;
          }
          totalAssignments++;
        }
      }

      await tx
        .update(integrationAccounts)
        .set({ lastSyncUtc: new Date() })
        .where(
          and(
            eq(integrationAccounts.userId, userId),
            eq(integrationAccounts.provider, 'google_classroom')
          )
        );

      await tx.insert(auditLogs).values({
        userId,
        action: 'oauth_connect' as any,
        metadataJson: { provider: 'google_classroom', totalAssignments, created, updated },
      });
    });

    return NextResponse.json({ success: true, totalAssignments, created, updated });
  } catch (error) {
    console.error('Classroom sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

function estimateEffort(work: any): number {
  if (work.maxPoints) {
    if (work.maxPoints >= 100) return 4;
    if (work.maxPoints >= 50) return 2.5;
    if (work.maxPoints >= 20) return 1.5;
    return 1;
  }
  return 2;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  if (action === 'disconnect') {
    await db
      .delete(integrationAccounts)
      .where(
        and(
          eq(integrationAccounts.userId, session.user.id),
          eq(integrationAccounts.provider, 'google_classroom')
        )
      );

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'oauth_disconnect' as any,
      metadataJson: { provider: 'google_classroom' },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
