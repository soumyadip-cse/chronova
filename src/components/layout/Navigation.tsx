'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Home, 
  Inbox, 
  Calendar, 
  Brain, 
  BarChart3, 
  Settings, 
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  className?: string
}

const navItems = [
  { id: 'today', label: 'Today', icon: Home, shortcut: '1' },
  { id: 'inbox', label: 'Inbox', icon: Inbox, shortcut: '2', badge: 3 },
  { id: 'planner', label: 'AI Planner', icon: Brain, shortcut: '3' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, shortcut: '4' },
  { id: 'insights', label: 'Insights', icon: BarChart3, shortcut: '5' },
  { id: 'story', label: 'Project Story', icon: BookOpen, shortcut: '6' },
  { id: 'settings', label: 'Settings', icon: Settings, shortcut: '7' },
]

export function Navigation({ 
  activeTab, 
  onTabChange, 
  collapsed = false, 
  onToggleCollapse,
  className 
}: NavigationProps) {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed bottom-4 left-4 z-50 lg:hidden p-2 rounded-full bg-primary text-primary-foreground shadow-lg"
        aria-label="Open navigation"
      >
        <Menu className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden bg-background/80 backdrop-blur"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.aside
          initial={{ x: -300 }}
          animate={{ x: isMobileOpen || !collapsed ? 0 : -300 }}
          exit={{ x: -300 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={cn(
            'fixed left-0 top-0 z-50 h-screen bg-card/90 backdrop-blur-xl border-r border-border/50 transition-all duration-300 lg:relative lg:z-auto',
            collapsed ? 'w-16' : 'w-64',
            className
          )}
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <Zap className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="font-heading text-lg font-semibold text-foreground">Chronova</span>
                </motion.div>
              )}
              <button
                onClick={onToggleCollapse}
                className={cn(
                  'p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
                  collapsed && 'rotate-180'
                )}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-expanded={!collapsed}
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Primary navigation">
              {navItems.map((item) => (
                <Tooltip key={item.id} disabled={!collapsed}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        onTabChange(item.id)
                        setIsMobileOpen(false)
                      }}
                      className={cn(
                        'relative w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                        activeTab === item.id
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                        collapsed && 'justify-center px-2'
                      )}
                      aria-current={activeTab === item.id ? 'page' : undefined}
                      aria-label={collapsed ? item.label : undefined}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-medium">
                              {item.badge}
                            </span>
                          )}
                          <kbd className="hidden lg:inline-flex h-5 min-w-5 items-center justify-center rounded bg-muted px-1.5 text-[10px] font-mono text-muted-foreground/60">
                            {item.shortcut}
                          </kbd>
                        </>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" align="center">
                    <div className="flex items-center gap-2 px-3 py-2">
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                      <span>{item.label}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">{item.shortcut}</kbd>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </nav>

            {!collapsed && (
              <div className="border-t border-border/50 p-3">
                <div className="flex items-center gap-3 px-3 py-2 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">AI Assistant</p>
                    <p className="text-[11px] text-muted-foreground">Press ⌘K to ask</p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-3">
              <Button
                variant="premium"
                className="w-full justify-center gap-2"
                onClick={() => onTabChange('today')}
              >
                <Zap className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Rebalance My Day</span>
              </Button>
            </div>
          </div>
        </motion.aside>
      </AnimatePresence>
    </>
  )
}