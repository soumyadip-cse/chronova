export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { integrationAccounts, calendarEvents, auditLogs } from '@/db/schema';
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
        eq(integrationAccounts.provider, 'google_calendar')
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
    return syncCalendarEvents(session.user.id);
  }

  if (action === 'status') {
    const account = await db
      .select()
      .from(integrationAccounts)
      .where(
        and(
          eq(integrationAccounts.userId, session.user.id),
          eq(integrationAccounts.provider, 'google_calendar')
        )
      )
      .limit(1);

    return NextResponse.json({
      connected: !!account[0],
      lastSync: account[0]?.lastSyncUtc,
      email: account[0]?.email,
    });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

async function syncCalendarEvents(userId: string) {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) {
    return NextResponse.json({ error: 'Not connected or token expired' }, { status: 401 });
  }

  oauth2Client.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: thirtyDaysAgo.toISOString(),
      timeMax: ninetyDaysLater.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 500,
    });

    const events = response.data.items || [];
    let synced = 0;
    let created = 0;
    let updated = 0;

    for (const event of events) {
      if (!event.id || !event.start?.dateTime || !event.end?.dateTime) continue;

      const existing = await db
        .select()
        .from(calendarEvents)
        .where(and(eq(calendarEvents.externalId, event.id), eq(calendarEvents.userId, userId)))
        .limit(1);

      const eventData = {
        userId,
        externalId: event.id,
        source: 'google_calendar' as const,
        title: event.summary || 'Untitled Event',
        description: event.description || null,
        startUtc: new Date(event.start.dateTime),
        endUtc: new Date(event.end.dateTime),
        isAllDay: !event.start.dateTime,
        isReadOnly: true,
        color: event.colorId ? getColorForId(event.colorId) : null,
        location: event.location || null,
        attendees: (event.attendees?.map((a) => a.email).filter(Boolean) || []) as string[],
        meetingUrl: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri || null,
      };

      if (existing[0]) {
        await db
          .update(calendarEvents)
          .set({ ...eventData, updatedAt: new Date() })
          .where(eq(calendarEvents.id, existing[0].id));
        updated++;
      } else {
        await db.insert(calendarEvents).values(eventData);
        created++;
      }
      synced++;
    }

    await db
      .update(integrationAccounts)
      .set({ lastSyncUtc: new Date() })
      .where(
        and(
          eq(integrationAccounts.userId, userId),
          eq(integrationAccounts.provider, 'google_calendar')
        )
      );

    await db.insert(auditLogs).values({
      userId,
      action: 'oauth_connect' as any,
      metadataJson: { provider: 'google_calendar', synced, created, updated },
    });

    return NextResponse.json({ success: true, synced, created, updated });
  } catch (error) {
    console.error('Calendar sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

function getColorForId(colorId: string): string {
  const colors: Record<string, string> = {
    '1': '#7986CB',
    '2': '#33B679',
    '3': '#8E24AA',
    '4': '#E67C73',
    '5': '#F6BF26',
    '6': '#F4511E',
    '7': '#039BE5',
    '8': '#616161',
    '9': '#3F51B5',
    '10': '#0B8043',
    '11': '#D50000',
  };
  return colors[colorId] || '#3B82F6';
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
          eq(integrationAccounts.provider, 'google_calendar')
        )
      );

    await db
      .delete(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, session.user.id),
          eq(calendarEvents.source, 'google_calendar')
        )
      );

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'oauth_disconnect' as any,
      metadataJson: { provider: 'google_calendar' },
    });

    return NextResponse.json({ success: true });
  }

  if (action === 'create-event') {
    const accessToken = await getValidAccessToken(session.user.id);
    if (!accessToken) {
      return NextResponse.json({ error: 'Not connected' }, { status: 401 });
    }

    oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const { title, description, startUtc, endUtc, attendees } = body;

    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: title,
        description,
        start: { dateTime: startUtc, timeZone: 'UTC' },
        end: { dateTime: endUtc, timeZone: 'UTC' },
        attendees: attendees?.map((email: string) => ({ email })),
      },
    });

    return NextResponse.json({ event: event.data });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
