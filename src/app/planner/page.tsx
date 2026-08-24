'use client';

import * as React from 'react';
import { Layout } from '@/components/layout/Layout';
import { demoUser, demoTasks, demoEvents, demoDaySchedule } from '@/data/demo';
import { AIPlanner } from '@/components/planner/AIPlanner';

export default function PlannerPage() {
  const handleApply = (recIds: string[]) => console.log('Apply recommendations:', recIds);
  const handleDismiss = (recIds: string[]) => console.log('Dismiss recommendations:', recIds);

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
      <AIPlanner
        tasks={demoTasks}
        events={demoEvents}
        energyForecast={demoDaySchedule.energyForecast}
        onApplyRecommendations={handleApply}
        onDismissRecommendations={handleDismiss}
      />
    </Layout>
  );
}
