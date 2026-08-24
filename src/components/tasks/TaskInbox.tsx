'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Search,
  Filter,
  ChevronDown,
  MoreVertical,
  CheckCircle,
  Clock,
  Zap,
  Flag,
  Calendar,
  Tag,
  Brain,
  GripVertical,
  Trash2,
  Edit,
  Copy,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskStatus, TaskPriority, EnergyLevel } from '@/types';
import { formatDateShort } from '@/lib/utils';

interface TaskInboxProps {
  tasks: Task[];
  onTaskUpdate: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskClick: (task: Task) => void;
  onBulkAction: (action: string, taskIds: string[]) => void;
}

const STATUS_OPTIONS: {
  value: TaskStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: 'inbox', label: 'Inbox', icon: Inbox },
  { value: 'today', label: 'Today', icon: CheckCircle },
  { value: 'upcoming', label: 'Upcoming', icon: Clock },
  { value: 'completed', label: 'Completed', icon: CheckCircle },
  { value: 'overdue', label: 'Overdue', icon: AlertTriangle },
];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const ENERGY_ICONS: Record<EnergyLevel, React.ComponentType<{ className?: string }>> = {
  high: Zap,
  balanced: Flag,
  low: Clock,
};

function Inbox({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path d="M4 8h16" />
    </svg>
  );
}

interface SortableTaskCardProps {
  task: Task;
  isSelected: boolean;
  onSelect: (taskId: string, selected: boolean) => void;
  onClick: (task: Task) => void;
}

function SortableTaskCard({ task, isSelected, onSelect, onClick }: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const PriorityIcon =
    task.priority === 'critical'
      ? AlertTriangle
      : task.priority === 'high'
        ? Flag
        : task.priority === 'medium'
          ? Zap
          : Clock;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative glass rounded-xl p-4 transition-all duration-200',
        'hover:border-primary/30 hover:shadow-lg',
        isSelected && 'border-primary/50 bg-primary/5 ring-1 ring-primary/20',
        isDragging && 'rotate-1 shadow-xl z-50'
      )}
      onClick={(e) => {
        if (!e.currentTarget.classList.contains('group')) return;
        onClick(task);
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 h-5 w-5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium truncate pr-2">{task.title}</h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Task Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onClick(task)}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="h-4 w-4 mr-2" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => {}}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Badge variant="outline" className={cn(PRIORITY_COLORS[task.priority])}>
              <PriorityIcon className="h-3 w-3 mr-1" />
              {task.priority}
            </Badge>

            {task.dueDate && (
              <Badge variant="secondary" className="gap-1">
                <Calendar className="h-3 w-3" />
                {formatDateShort(task.dueDate)}
                {new Date(task.dueDate) < new Date() && task.status !== 'completed' && (
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                )}
              </Badge>
            )}

            <Badge variant="secondary" className="gap-1">
              {((EnergyIcon) => <EnergyIcon className="h-3 w-3" />)(
                ENERGY_ICONS[task.energyRequired]
              )}
              {task.energyRequired}
            </Badge>

            <Badge variant="secondary" className="gap-1">
              <Brain className="h-3 w-3" />
              {task.aiPriorityScore}%
            </Badge>

            {task.projectColor && (
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: task.projectColor }}
                title={task.projectName}
              />
            )}

            {task.estimatedEffort > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {Math.round(task.estimatedEffort / 60)}h {task.estimatedEffort % 60}m
              </Badge>
            )}
          </div>

          {task.aiReasoning && (
            <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Brain className="h-3 w-3" />
                AI: {task.aiReasoning}
              </p>
            </div>
          )}
        </div>

        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(task.id, e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
          aria-label={`Select ${task.title}`}
        />
      </div>
    </motion.div>
  );
}

function TaskList({
  tasks,
  selectedIds,
  onSelect,
  onClick,
  filterStatus,
}: {
  tasks: Task[];
  selectedIds: string[];
  onSelect: (taskId: string, selected: boolean) => void;
  onClick: (task: Task) => void;
  filterStatus: FilterStatus;
}) {
  const filteredTasks = tasks.filter((t) =>
    filterStatus === 'inbox'
      ? t.status === 'inbox'
      : filterStatus === 'today'
        ? t.status === 'today'
        : filterStatus === 'upcoming'
          ? t.status === 'upcoming'
          : filterStatus === 'completed'
            ? t.status === 'completed'
            : filterStatus === 'overdue'
              ? t.status === 'overdue'
              : true
  );

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.status !== b.status) return a.status.localeCompare(b.status);
    if (a.aiPriorityScore !== b.aiPriorityScore) return b.aiPriorityScore - a.aiPriorityScore;
    return (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0);
  });

  return (
    <DndContext
      sensors={useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
      )}
      collisionDetection={closestCenter}
      onDragEnd={(event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
          const oldIndex = sortedTasks.findIndex((t) => t.id === active.id);
          const newIndex = sortedTasks.findIndex((t) => t.id === over.id);
          // Note: In real app, this would trigger a reorder action
        }
      }}
    >
      <SortableContext items={sortedTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <AnimatePresence mode="popLayout">
          <div className="space-y-3" role="list" aria-label={`${filterStatus} tasks`}>
            {sortedTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                role="listitem"
              >
                <SortableTaskCard
                  task={task}
                  isSelected={selectedIds.includes(task.id)}
                  onSelect={onSelect}
                  onClick={onClick}
                />
              </motion.div>
            ))}
            {sortedTasks.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Inbox className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No tasks in {filterStatus}</p>
                <p className="text-sm mt-1">Drag tasks here or use Quick Add</p>
              </div>
            )}
          </div>
        </AnimatePresence>
      </SortableContext>
    </DndContext>
  );
}

type FilterStatus = TaskStatus | 'all';

export function TaskInbox({
  tasks,
  onTaskUpdate,
  onTaskDelete,
  onTaskClick,
  onBulkAction,
}: TaskInboxProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<FilterStatus>('inbox');
  const [filterProject, setFilterProject] = React.useState<string>('all');
  const [filterEnergy, setFilterEnergy] = React.useState<EnergyLevel | 'all'>('all');
  const [filterPriority, setFilterPriority] = React.useState<TaskPriority | 'all'>('all');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [showFilters, setShowFilters] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<'priority' | 'dueDate' | 'effort' | 'created'>(
    'priority'
  );

  const filteredTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchesProject = filterProject === 'all' || task.projectId === filterProject;
      const matchesEnergy = filterEnergy === 'all' || task.energyRequired === filterEnergy;
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      return matchesSearch && matchesStatus && matchesProject && matchesEnergy && matchesPriority;
    });
  }, [tasks, searchQuery, filterStatus, filterProject, filterEnergy, filterPriority]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredTasks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTasks.map((t) => t.id));
    }
  };

  const handleSelect = (taskId: string, selected: boolean) => {
    setSelectedIds((prev) => (selected ? [...prev, taskId] : prev.filter((id) => id !== taskId)));
  };

  const projects = React.useMemo(
    () => [...new Set(tasks.map((t) => t.projectId).filter((id): id is string => Boolean(id)))],
    [tasks]
  );

  const projectNames = React.useMemo(() => {
    const map = new Map<string, string>();
    tasks.forEach((t) => {
      if (t.projectId && t.projectName && !map.has(t.projectId)) {
        map.set(t.projectId, t.projectName);
      }
    });
    return map;
  }, [tasks]);

  const projectNameLookup = React.useMemo(() => {
    const lookup: Record<string, string> = {};
    projectNames.forEach((name, id) => {
      lookup[id] = name;
    });
    return lookup;
  }, [projectNames]);

  const getProjectName = (projectId: string): string => {
    return projectNameLookup[projectId] ?? projectId;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Task Inbox</h1>
          <p className="text-muted-foreground">Manage and prioritize your work</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <ChevronDown className="h-4 w-4 mr-2" />
            Sort: {sortBy}
          </Button>
        </div>
      </div>

      {/* Search & Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks, tags, projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs
          value={filterStatus}
          onValueChange={(v: string) => setFilterStatus(v as FilterStatus)}
          className="flex-1"
        >
          <TabsList className="grid w-full grid-cols-5">
            {STATUS_OPTIONS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="h-4 w-4 mr-1" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="glass">
              <CardContent className="pt-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <Label>Project</Label>
                    <Select value={filterProject} onValueChange={setFilterProject}>
                      <SelectTrigger>
                        <SelectValue placeholder="All projects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {projects.map((p) => {
                          const displayName = getProjectName(p);
                          return (
                            <SelectItem key={p} value={p}>
                              {displayName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Energy</Label>
                    <Select
                      value={filterEnergy}
                      onValueChange={(v: string) => setFilterEnergy(v as EnergyLevel | 'all')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All energy levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={filterPriority}
                      onValueChange={(v: string) => setFilterPriority(v as TaskPriority | 'all')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Sort By</Label>
                    <Select
                      value={sortBy}
                      onValueChange={(v: string) =>
                        setSortBy(v as 'priority' | 'dueDate' | 'effort' | 'created')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="priority">AI Priority</SelectItem>
                        <SelectItem value="dueDate">Due Date</SelectItem>
                        <SelectItem value="effort">Effort</SelectItem>
                        <SelectItem value="created">Created</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-xl p-3 border border-primary/20"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{selectedIds.length} tasks selected</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkAction('scheduleToday', selectedIds)}
                >
                  Schedule Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkAction('scheduleUpcoming', selectedIds)}
                >
                  Schedule Later
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkAction('markComplete', selectedIds)}
                >
                  Complete
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onBulkAction('delete', selectedIds)}
                >
                  Delete
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setSelectedIds([])}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task List */}
      <Card className="glass">
        <CardContent className="pt-0">
          <ScrollArea className="h-[calc(100vh-400px)] min-h-[400px]">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === filteredTasks.length && filteredTasks.length > 0
                    }
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    aria-label="Select all"
                  />
                  <span className="text-sm font-medium">Title</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground hidden md:flex">
                  <span className="w-32">Priority</span>
                  <span className="w-24">Due</span>
                  <span className="w-20">Energy</span>
                  <span className="w-20">AI Score</span>
                  <span className="w-24">Project</span>
                </div>
              </div>
              <TaskList
                tasks={filteredTasks}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onClick={onTaskClick}
                filterStatus={filterStatus}
              />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
