'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { fetchProfile } from '@/lib/profile-client';

/**
 * First-run gate: authenticated users who never finished onboarding are sent
 * to /onboarding. Runs once per mount; tolerant of lookup failures so a
 * transient error can never lock someone out of the app.
 */
export function useOnboardingGuard(): boolean {
  const { status } = useSession();
  const router = useRouter();
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    if (status !== 'authenticated') return;

    let cancelled = false;
    fetchProfile()
      .then((profile) => {
        if (cancelled) return;
        if (!profile.onboardingCompleted) {
          router.replace('/onboarding');
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        // Fail open: availability issues must not trap signed-in users.
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, router]);

  return checking && status === 'authenticated';
}
