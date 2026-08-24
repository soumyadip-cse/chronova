'use client';

import * as React from 'react';
import { Layout } from '@/components/layout/Layout';
import { demoUser, demoTasks } from '@/data/demo';
import { TaskInbox } from '@/components/tasks/TaskInbox';

export default function InboxPage() {
  const handleTaskUpdate = (task: any) => console.log('Task updated:', task);
  const handleTaskDelete = (taskId: string) => console.log('Task deleted:', taskId);
  const handleTaskClick = (task: any) => console.log('Task clicked:', task);
  const handleBulkAction = (action: string, taskIds: string[]) =>
    console.log('Bulk action:', action, taskIds);

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
      <TaskInbox
        tasks={demoTasks}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={handleTaskDelete}
        onTaskClick={handleTaskClick}
        onBulkAction={handleBulkAction}
      />
    </Layout>
  );
}
