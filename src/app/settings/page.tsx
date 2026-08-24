'use client';

import * as React from 'react';
import { Layout } from '@/components/layout/Layout';
import { demoUser } from '@/data/demo';
import { SettingsPanel } from '@/components/settings/SettingsPanel';

export default function SettingsPage() {
  const handleSave = (settings: any) => {
    console.log('Settings saved:', settings);
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
      <SettingsPanel user={demoUser} onSave={handleSave} />
    </Layout>
  );
}
