'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Inbox,
  Calendar,
  Target,
  Brain,
  Clock,
  Music,
  BarChart3,
  Settings,
  BookOpen,
  Users,
  Briefcase,
  Target as TargetIcon,
  Zap,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSession, signOut } from 'next-auth/react';
import { useCommandPaletteContext } from '@/components/providers/command-palette-provider';

const navigation = [
  { name: 'Today', href: '/dashboard', icon: Home, badge: null },
  { name: 'Inbox', href: '/inbox', icon: Inbox, badge: '3' },
  { name: 'Planner', href: '/planner', icon: Brain, badge: null },
  { name: 'Calendar', href: '/calendar', icon: Calendar, badge: null },
  { name: 'Focus', href: '/focus', icon: Target, badge: null },
  { name: 'Sounds', href: '/soundscape', icon: Music, badge: null },
  { name: 'Insights', href: '/insights', icon: BarChart3, badge: null },
];

const personaNavigation = {
  student: [
    { name: 'Subjects', href: '/student/subjects', icon: BookOpen },
    { name: 'Assignments', href: '/student/assignments', icon: Inbox },
    { name: 'Exams', href: '/student/exams', icon: Calendar },
    { name: 'Questions', href: '/student/questions', icon: Brain },
    { name: 'Notes', href: '/student/notes', icon: BookOpen },
  ],
  freelancer: [
    { name: 'Clients', href: '/freelancer/clients', icon: Users },
    { name: 'Projects', href: '/freelancer/projects', icon: Briefcase },
    { name: 'Deliverables', href: '/freelancer/deliverables', icon: TargetIcon },
  ],
  professional: [
    { name: 'Projects', href: '/professional/projects', icon: Briefcase },
    { name: 'Meetings', href: '/professional/meetings', icon: Calendar },
    { name: 'Tasks', href: '/professional/tasks', icon: Inbox },
  ],
  founder: [
    { name: 'Goals', href: '/founder/goals', icon: TargetIcon },
    { name: 'Projects', href: '/founder/projects', icon: Briefcase },
    { name: 'Team', href: '/founder/team', icon: Users },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { toggle: toggleCommandPalette } = useCommandPaletteContext();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const userRole = (session?.user as any)?.role || 'professional';
  const personaNav = personaNavigation[userRole as keyof typeof personaNavigation] || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2" aria-label="Nexora home">
            <Zap className="h-8 w-8 text-primary" />
            <span className="font-heading text-xl font-bold">Nexora</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6" aria-label="Main navigation">
          {/* Core Navigation */}
          <div>
            <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Core
            </p>
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto h-5 min-w-5 px-1.5 text-xs font-medium text-primary bg-primary/10 rounded-full text-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Persona Navigation */}
          {personaNav.length > 0 && (
            <div>
              <Button
                variant="ghost"
                className="w-full justify-between px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => toggleSection('persona')}
                aria-expanded={expandedSections.includes('persona')}
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">👤</span>
                  <span>{userRole.charAt(0).toUpperCase() + userRole.slice(1)} Hub</span>
                </span>
                {expandedSections.includes('persona') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              {expandedSections.includes('persona') && (
                <div className="space-y-1 mt-2 ml-2 border-l border-border/50 pl-3">
                  {personaNav.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                        isActive(item.href)
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings */}
          <div>
            <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              System
            </p>
            <Link
              href="/settings"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive('/settings')
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Settings className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span>Settings</span>
            </Link>
          </div>
        </nav>

        {/* User menu */}
        <div className="p-4 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 py-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || ''} />
                  <AvatarFallback className="text-xs">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left text-sm">
                  <p className="font-medium truncate">{session?.user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2 w-full">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-destructive focus:text-destructive"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:pl-64 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-4 lg:px-8 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCommandPalette}
              className="gap-2 px-3 py-1.5 rounded-lg hover:bg-accent"
              aria-label="Command palette (⌘K)"
            >
              <Zap className="h-4 w-4" />
              <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-xs bg-muted rounded font-mono">
                ⌘K
              </kbd>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted/50 text-xs text-muted-foreground font-mono">
              <span id="current-time"></span>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6">{children}</div>
      </main>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            function updateTime() {
              const el = document.getElementById('current-time');
              if (el) {
                el.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }
            }
            setInterval(updateTime, 1000);
            updateTime();
          `,
        }}
      />
    </div>
  );
}
