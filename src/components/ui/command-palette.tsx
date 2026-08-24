'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Zap,
  Plus,
  Play,
  Music,
  Target,
  Brain,
  Clock,
  Calendar,
  BarChart3,
  Settings,
  ArrowRight,
  Keyboard,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface Command {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: 'tasks' | 'focus' | 'navigation' | 'ai' | 'settings';
  keywords: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand: (command: Command) => void;
  customCommands?: Command[];
}

const DEFAULT_COMMANDS: Command[] = [
  {
    id: 'new-task',
    label: 'Add Task',
    description: 'Create a new task with natural language',
    icon: <Plus className="h-4 w-4" />,
    shortcut: '⌘N',
    action: () => {},
    category: 'tasks',
    keywords: ['add', 'create', 'new', 'task', 'todo'],
  },
  {
    id: 'start-focus',
    label: 'Start Focus Session',
    description: 'Begin a distraction-free work session',
    icon: <Play className="h-4 w-4" />,
    shortcut: '⌘⇧F',
    action: () => {},
    category: 'focus',
    keywords: ['focus', 'pomodoro', 'timer', 'work', 'session'],
  },
  {
    id: 'rebalance-day',
    label: 'Rebalance Day',
    description: 'AI-powered schedule optimization',
    icon: <Zap className="h-4 w-4" />,
    shortcut: '⌘R',
    action: () => {},
    category: 'ai',
    keywords: ['rebalance', 'optimize', 'schedule', 'ai', 'rearrange'],
  },
  {
    id: 'play-rain',
    label: 'Play Rain Sounds',
    description: 'Start gentle rainfall ambient sound',
    icon: <Music className="h-4 w-4" />,
    shortcut: '⌘⇧R',
    action: () => {},
    category: 'focus',
    keywords: ['rain', 'sound', 'ambient', 'music', 'play'],
  },
  {
    id: 'today',
    label: 'Go to Today',
    description: "Navigate to today's dashboard",
    icon: <Target className="h-4 w-4" />,
    shortcut: '⌘1',
    action: () => {},
    category: 'navigation',
    keywords: ['today', 'dashboard', 'home', 'overview'],
  },
  {
    id: 'calendar',
    label: 'Open Calendar',
    description: 'View calendar with day/week/agenda',
    icon: <Calendar className="h-4 w-4" />,
    shortcut: '⌘2',
    action: () => {},
    category: 'navigation',
    keywords: ['calendar', 'schedule', 'events', 'meetings'],
  },
  {
    id: 'ai-planner',
    label: 'AI Planner',
    description: 'Chat with AI to plan your day',
    icon: <Brain className="h-4 w-4" />,
    shortcut: '⌘3',
    action: () => {},
    category: 'ai',
    keywords: ['ai', 'planner', 'chat', 'plan', 'assistant'],
  },
  {
    id: 'insights',
    label: 'View Insights',
    description: 'Productivity analytics and time journey',
    icon: <BarChart3 className="h-4 w-4" />,
    shortcut: '⌘4',
    action: () => {},
    category: 'navigation',
    keywords: ['insights', 'analytics', 'stats', 'productivity', 'journey'],
  },
  {
    id: 'settings',
    label: 'Open Settings',
    description: 'Account, integrations, preferences',
    icon: <Settings className="h-4 w-4" />,
    shortcut: '⌘,',
    action: () => {},
    category: 'settings',
    keywords: ['settings', 'preferences', 'account', 'integrations'],
  },
  {
    id: 'focus-mode',
    label: 'Enter Focus Mode',
    description: 'Full-screen distraction-free mode',
    icon: <Target className="h-4 w-4" />,
    shortcut: 'F',
    action: () => {},
    category: 'focus',
    keywords: ['focus', 'mode', 'fullscreen', 'distraction'],
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  tasks: 'Tasks',
  focus: 'Focus',
  navigation: 'Navigation',
  ai: 'AI Assistant',
  settings: 'Settings',
};

export function CommandPalette({
  isOpen,
  onClose,
  onCommand,
  customCommands = [],
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [showShortcuts, setShowShortcuts] = React.useState(false);

  const allCommands = [...DEFAULT_COMMANDS, ...customCommands];

  const filteredCommands = React.useMemo(() => {
    if (!query) return allCommands;

    const lowerQuery = query.toLowerCase();
    return allCommands
      .map((cmd) => {
        const matchScore = calculateMatchScore(cmd, lowerQuery);
        return { cmd, matchScore };
      })
      .filter(({ matchScore }) => matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .map(({ cmd }) => cmd);
  }, [query, allCommands]);

  const selectedCommand = filteredCommands[selectedIndex];

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Enter' && selectedCommand) {
        e.preventDefault();
        onCommand(selectedCommand);
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedCommand, onClose, onCommand]);

  React.useEffect(() => {
    if (isOpen) {
      const input = document.getElementById('command-input') as HTMLInputElement;
      input?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-20"
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="w-full max-w-2xl mx-4"
        >
          <Card className="glass border-primary/20 shadow-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Search className="h-5 w-5" />
                </div>
                <Input
                  id="command-input"
                  placeholder="Type a command or search…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-12 py-4 text-lg border-none bg-transparent focus:ring-0 placeholder:text-muted-foreground/50"
                  autoFocus
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Keyboard className="h-4 w-4" />
                  <kbd className="px-2 py-1 bg-muted rounded">⌘K</kbd>
                  <span>to close</span>
                </div>
              </div>

              <Separator />

              <AnimatePresence mode="wait">
                {showShortcuts ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden p-4 border-b border-border"
                  >
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {DEFAULT_COMMANDS.map((cmd) => (
                        <Button
                          key={cmd.id}
                          variant="ghost"
                          className="w-full justify-between gap-2 p-2 hover:bg-accent"
                          onClick={() => {
                            onCommand(cmd);
                            onClose();
                          }}
                        >
                          <span className="text-sm">{cmd.label}</span>
                          <kbd className="px-2 py-0.5 text-xs bg-muted rounded font-mono">
                            {cmd.shortcut}
                          </kbd>
                        </Button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden max-h-96"
                  >
                    <div className="p-2">
                      {groupCommandsByCategory(filteredCommands).map(({ category, commands }) => (
                        <div key={category} className="space-y-1 mb-3">
                          <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {CATEGORY_LABELS[category] || category}
                          </div>
                          {commands.map((cmd, idx) => (
                            <Button
                              key={cmd.id}
                              variant={selectedIndex === getGlobalIndex(cmd) ? 'default' : 'ghost'}
                              className={cn(
                                'w-full justify-start gap-3 p-3 rounded-xl',
                                selectedIndex === getGlobalIndex(cmd) &&
                                  'bg-primary/10 border border-primary/20'
                              )}
                              onClick={() => {
                                onCommand(cmd);
                                onClose();
                              }}
                              onMouseEnter={() => setSelectedIndex(getGlobalIndex(cmd))}
                            >
                              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                                {cmd.icon}
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <div className="font-medium truncate">{cmd.label}</div>
                                <div className="text-sm text-muted-foreground truncate">
                                  {cmd.description}
                                </div>
                              </div>
                              {cmd.shortcut && (
                                <kbd className="px-2 py-1 text-xs bg-muted rounded font-mono text-muted-foreground">
                                  {cmd.shortcut}
                                </kbd>
                              )}
                            </Button>
                          ))}
                        </div>
                      ))}
                      {filteredCommands.length === 0 && (
                        <div className="px-4 py-8 text-center text-muted-foreground">
                          <X className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No commands found for "{query}"</p>
                          <p className="text-sm mt-1">
                            Try different keywords or press{' '}
                            <kbd className="px-1.5 py-0.5 bg-muted rounded">⌘/</kbd> for all
                            shortcuts
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs text-muted-foreground mt-3"
          >
            Press <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">⌘K</kbd> to close •{' '}
            <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">⌘/</kbd> for shortcuts
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function calculateMatchScore(cmd: Command, query: string): number {
  let score = 0;
  const label = cmd.label.toLowerCase();
  const desc = cmd.description.toLowerCase();
  const keywords = cmd.keywords.join(' ').toLowerCase();

  if (label.startsWith(query)) score += 100;
  else if (label.includes(query)) score += 50;

  if (desc.includes(query)) score += 20;

  cmd.keywords.forEach((kw) => {
    if (kw.startsWith(query)) score += 30;
    else if (kw.includes(query)) score += 10;
  });

  return score;
}

function groupCommandsByCategory(commands: Command[]) {
  const groups: Record<string, Command[]> = {};
  commands.forEach((cmd) => {
    if (!groups[cmd.category]) groups[cmd.category] = [];
    groups[cmd.category].push(cmd);
  });
  return Object.entries(groups).map(([category, commands]) => ({ category, commands }));
}

function getGlobalIndex(cmd: Command) {
  return DEFAULT_COMMANDS.findIndex((c) => c.id === cmd.id) >= 0
    ? DEFAULT_COMMANDS.findIndex((c) => c.id === cmd.id)
    : DEFAULT_COMMANDS.length + DEFAULT_COMMANDS.findIndex((c) => c.id === cmd.id);
}
