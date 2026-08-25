'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { Layout } from '@/components/layout/Layout';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import {
  fetchProfile,
  updateProfile,
  downloadDataExport,
  deleteAccount,
  ProfileApiError,
} from '@/lib/profile-client';
import { useOnboardingGuard } from '@/hooks/use-onboarding-guard';
import type { UserProfile, Theme } from '@/types';

function initialsFor(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const guardChecking = useOnboardingGuard();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [profileEmail, setProfileEmail] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const loadProfile = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const p = await fetchProfile();
      setProfileEmail(p.email);
      setProfile({
        id: p.id,
        name: p.displayName || p.email.split('@')[0],
        role: p.role,
        workingHours: p.workingHours,
        peakEnergy: p.peakEnergy,
        focusSessionLength: p.focusSessionLength ?? 50,
        productivityChallenge: p.productivityChallenge ?? '',
        calendarConnected: false,
        theme: (p.theme ?? 'system') as Theme,
        reducedMotion: p.reducedMotion ?? false,
        notificationIntensity: 'balanced',
        planningHorizon: p.planningHorizon ?? 'week',
        aiAggressiveness: p.aiAggressiveness ?? 'balanced',
        energyWeight: 0.15,
      });
    } catch (error) {
      if (error instanceof ProfileApiError && error.status === 401) {
        router.replace('/login');
        return;
      }
      setLoadError(
        error instanceof ProfileApiError ? error.message : 'Unable to load your settings.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async (settings: Partial<UserProfile>) => {
    const patch: Record<string, unknown> = {};
    if (settings.workingHours) patch.workingHours = settings.workingHours;
    if (settings.peakEnergy) patch.peakEnergy = settings.peakEnergy;
    if (settings.focusSessionLength != null)
      patch.focusSessionLength = Number(settings.focusSessionLength);
    if (settings.productivityChallenge !== undefined)
      patch.productivityChallenge = settings.productivityChallenge;
    if (settings.reducedMotion !== undefined) patch.reducedMotion = settings.reducedMotion;
    if (settings.planningHorizon) patch.planningHorizon = settings.planningHorizon;
    if (settings.aiAggressiveness) patch.aiAggressiveness = settings.aiAggressiveness;

    await updateProfile(patch);
    // Keep the session JWT in sync (e.g. any server-side preference refresh).
    try {
      await update();
    } catch {
      // Non-fatal: token refreshes at next natural rotation anyway.
    }
  };

  const sessionUser = session?.user as { name?: string | null; email?: string | null } | undefined;
  const displayName =
    profile?.name || sessionUser?.name || sessionUser?.email?.split('@')[0] || 'You';

  return (
    <Layout user={{ name: displayName, initials: initialsFor(displayName) }}>
      {guardChecking || isLoading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading settings">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-[420px] w-full rounded-xl" />
        </div>
      ) : loadError ? (
        <Card className="glass border-destructive/30">
          <CardContent className="pt-6 pb-6 text-center space-y-3">
            <AlertTriangle className="h-10 w-10 mx-auto text-destructive" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <Button variant="outline" size="sm" onClick={loadProfile}>
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        profile && (
          <SettingsPanel
            user={profile}
            onSave={handleSave}
            onExportData={() => downloadDataExport('json')}
            onDeleteAccount={(confirmation) => deleteAccount(profileEmail, confirmation)}
            onAccountDeleted={() => signOut({ callbackUrl: '/login' })}
          />
        )
      )}
    </Layout>
  );
}
