'use client';

import * as React from 'react';
import { Layout } from '@/components/layout/Layout';
import { demoUser } from '@/data/demo';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

export default function OnboardingPage() {
  const handleComplete = (data: any) => {
    console.log('Onboarding complete:', data);
  };

  return (
    <Layout
      user={{
        name: demoUser.name,
        initials: demoUser.name
          .split(' ')
          .map((n) => n[0])
          .join(''),
      }}
    >
      <OnboardingFlow onComplete={handleComplete} />
    </Layout>
  );
}
