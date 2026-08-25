import type { ProfilePatchInput, ProfileResponse } from '@/types';

export class ProfileApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ProfileApiError';
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    // Two shapes exist: { error: string } on most routes and the ApiError
    // envelope { error: { code, message, details } } on wrapped routes.
    if (data && typeof data.error === 'string') return data.error;
    if (data?.error?.message && typeof data.error.message === 'string') return data.error.message;
  } catch {
    // fall through
  }
  if (res.status === 401) return 'You must be signed in.';
  return `Request failed (${res.status}). Please try again.`;
}

/** The caller's own merged profile (users + userProfiles). */
export async function fetchProfile(): Promise<ProfileResponse['profile']> {
  const res = await fetch('/api/profile', { cache: 'no-store' });
  if (!res.ok) throw new ProfileApiError(res.status, await parseError(res));
  const data = (await res.json()) as ProfileResponse;
  return data.profile;
}

/**
 * Persist a profile patch. When the timezone changes, callers should follow up
 * with useSession().update() so the JWT picks up the fresh value immediately.
 */
export async function updateProfile(patch: ProfilePatchInput): Promise<ProfileResponse['profile']> {
  const res = await fetch('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new ProfileApiError(res.status, await parseError(res));
  const data = (await res.json()) as ProfileResponse;
  return data.profile;
}

/** The browser's IANA timezone, with a safe UTC fallback. */
export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Download a full account data export produced by /api/export. */
export async function downloadDataExport(format: 'json' | 'csv' = 'json'): Promise<void> {
  const res = await fetch('/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format }),
  });
  if (!res.ok) throw new ProfileApiError(res.status, await parseError(res));

  const blob = await res.blob();
  const disposition = res.headers.get('content-disposition') ?? '';
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  const filename = match?.[1] ?? `chronova-export.${format}`;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Permanently delete the account. Requires the account email plus the exact
 * typed confirmation the API demands. The session is dead afterwards —
 * callers must sign out.
 */
export async function deleteAccount(email: string, confirmation: string): Promise<void> {
  const res = await fetch('/api/account/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmation, email }),
  });
  if (!res.ok) throw new ProfileApiError(res.status, await parseError(res));
}
