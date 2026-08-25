'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Layout } from '@/components/layout/Layout';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle, RotateCcw } from 'lucide-react';
import { browserTimezone, updateProfile, ProfileApiError } from '@/lib/profile-client';
import type { OnboardingData } from '@/types';

function initialsFor(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const handleComplete = async (data: OnboardingData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await updateProfile({
        timezone: browserTimezone(),
        workingHours: data.workingHours,
        peakEnergy: data.peakEnergy,
        focusSessionLength: data.focusSessionLength,
        productivityChallenge: data.productivityChallenge,
        completed: true,
      });

      // Refresh the JWT so the scheduler sees the real timezone immediately.
      await update();

      router.push('/dashboard');
    } catch (error) {
      setSubmitError(
        error instanceof ProfileApiError
          ? error.message
          : 'Unable to save your preferences. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  const sessionUser = session?.user as { name?: string | null; email?: string | null } | undefined;
  const displayName = sessionUser?.name || sessionUser?.email?.split('@')[0] || 'Welcome';

  return (
    <Layout user={{ name: displayName, initials: initialsFor(displayName) }}>
      {submitError && (
        <Card className="glass border-destructive/30 mb-4">
          <CardContent className="pt-5 pb-5 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              {submitError}
            </span>
            <Button variant="outline" size="sm" onClick={() => setSubmitError(null)}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}
      {isSubmitting ? (
        <Card className="glass">
          <CardContent className="pt-8 pb-8 text-center space-y-3" aria-busy="true">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Personalizing your Chronova…</p>
          </CardContent>
        </Card>
      ) : (
        <OnboardingFlow onComplete={handleComplete} />
      )}
      {/* Retry affordance when the flow itself errored out previously. */}
      {!isSubmitting && submitError && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Your answers are still here — press the final step again to retry (
          <RotateCcw className="inline h-3 w-3" aria-hidden="true" />
          ).
        </p>
      )}
    </Layout>
  );
}
