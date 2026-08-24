'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Home,
  Inbox,
  Calendar,
  BarChart3,
  Bot,
  Settings,
  BookOpen,
  Menu,
  X,
  Sun,
  Moon,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';

const navigation = [
  { name: 'Today', href: '/dashboard', icon: Home },
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'Planner', href: '/planner', icon: Bot },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Insights', href: '/insights', icon: BarChart3 },
  { name: 'Story', href: '/story', icon: BookOpen },
];

export function Navigation({
  user,
  onToggleSidebar,
  sidebarOpen,
}: {
  user: { name: string; initials: string };
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <>
      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass border-t border-border/50"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around h-16">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={onToggleSidebar}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 glass border-r border-border/50 transition-transform duration-300 ease-out',
          'md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
            <Link href="/dashboard" className="flex items-center gap-2" aria-label="Chronova home">
              <Zap className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="font-heading text-xl font-bold">Chronova</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onToggleSidebar}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>

          {/* Navigation */}
          <nav
            className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
            aria-label="Sidebar navigation"
          >
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{item.name}</span>
                  {isActive && (
                    <span
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom: Theme toggle + User */}
          <div className="border-t border-border/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Theme</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <Sun
                  className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0"
                  aria-hidden="true"
                />
                <Moon
                  className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100"
                  aria-hidden="true"
                />
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  aria-label="User menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-sm font-medium">{user.initials}</AvatarFallback>
                  </Avatar>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">Freelancer</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-heading">Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Keyboard Shortcuts</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Desktop top bar (hidden on mobile) */}
      <header className="hidden md:fixed md:top-0 md:left-64 md:right-0 md:z-40 md:h-16 glass border-b border-border/50">
        <div className="flex h-full items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
            <span className="font-heading text-xl font-bold">Chronova</span>
          </div>
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  <Sun
                    className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0"
                    aria-hidden="true"
                  />
                  <Moon
                    className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100"
                    aria-hidden="true"
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2" aria-label="User menu">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-sm font-medium">{user.initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block font-medium">{user.name}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-heading">Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Keyboard Shortcuts</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
}
