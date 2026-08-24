'use client';

import * as React from 'react';
import { Layout } from '@/components/layout/Layout';
import { demoUser, demoInsights } from '@/data/demo';
import { InsightsDashboard } from '@/components/insights/InsightsDashboard';

export default function InsightsPage() {
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
      <InsightsDashboard data={demoInsights} />
    </Layout>
  );
}
