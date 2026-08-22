'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Navigation } from './Navigation'
import { TopBar } from './TopBar'
import { RightPanel } from './RightPanel'
import { AnimatedBackground } from './AnimatedBackground'
import { Toaster } from '@/components/ui/toaster'

interface AppLayoutProps {
  children: React.ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
  userName: string
  energyLevel: 'low' | 'balanced' | 'high'
  onEnergyChange: (level: 'low' | 'balanced' | 'high') => void
  onQuickAdd: () => void
  onSearch: () => void
  theme: 'dark' | 'light'
  onThemeChange: (theme: 'dark' | 'light') => void
  onRebalance: () => void
  reducedMotion?: boolean
  rightPanelOpen?: boolean
  onRightPanelToggle?: () => void
  rightPanelContent?: React.ReactNode
}

export function AppLayout({
  children,
  activeTab,
  onTabChange,
  userName,
  energyLevel,
  onEnergyChange,
  onQuickAdd,
  onSearch,
  theme,
  onThemeChange,
  onRebalance,
  reducedMotion = false,
  rightPanelOpen = false,
  onRightPanelToggle,
  rightPanelContent,
}: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)

  const timeOfDay = React.useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'morning'
    if (hour < 17) return 'afternoon'
    if (hour < 21) return 'evening'
    return 'night'
  }, [])

  return (
    <div className="relative min-h-screen bg-background">
      <AnimatedBackground reducedMotion={reducedMotion} timeOfDay={timeOfDay} />
      
      <Navigation
        activeTab={activeTab}
        onTabChange={onTabChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={cn(
        'transition-all duration-300 lg:ml-64',
        sidebarCollapsed ? 'lg:ml-16' : ''
      )}>
        <TopBar
          userName={userName}
          energyLevel={energyLevel}
          onEnergyChange={onEnergyChange}
          onQuickAdd={onQuickAdd}
          onSearch={onSearch}
          theme={theme}
          onThemeChange={onThemeChange}
          onRebalance={onRebalance}
        />

        <main className="mx-auto max-w-[1400px] px-4 py-6">
          {children}
        </main>

        <RightPanel
          isOpen={rightPanelOpen}
          onClose={onRightPanelToggle}
          content={rightPanelContent}
        />
      </div>

      <Toaster />
    </div>
  )
}