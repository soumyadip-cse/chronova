'use client';

import * as React from 'react';
import { Layout } from '@/components/layout/Layout';
import { demoUser, demoEvents, demoDaySchedule } from '@/data/demo';
import { CalendarViewComponent } from '@/components/calendar/CalendarView';

export default function CalendarPage() {
  const [view, setView] = React.useState<'day' | 'week' | 'agenda'>('day');
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  const handleEventClick = (event: any) => console.log('Event clicked:', event);
  const handleCreateEvent = (date: Date) => console.log('Create event at:', date);

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
      <CalendarViewComponent
        events={demoEvents}
        energyForecast={demoDaySchedule.energyForecast}
        view={view}
        onViewChange={(v: string) => setView(v as 'day' | 'week' | 'agenda')}
        onDateChange={setSelectedDate}
        onEventClick={handleEventClick}
        onCreateEvent={handleCreateEvent}
        selectedDate={selectedDate}
      />
    </Layout>
  );
}
