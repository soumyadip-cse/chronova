'use client';

import * as React from 'react';
import { Layout } from '@/components/layout/Layout';
import { demoUser } from '@/data/demo';
import { ProjectStory } from '@/components/onboarding/ProjectStory';

export default function StoryPage() {
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
      <ProjectStory />
    </Layout>
  );
}
