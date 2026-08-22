'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Search, 
  Filter, 
  ChevronDown, 
  Check, 
  MoreHorizontal,
  Calendar,
  Clock,
  Zap,
  Flag,
  Folder,
  Trash2,
  Edit,
  Copy,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Popover, 
  PopoverTrigger, 
  PopoverContent 
} from '@/components/ui/popover'
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { Task, TaskStatus, TaskPriority } from '@/types'
import { formatDateShort } from '@/lib/utils'

interface SmartTaskInboxProps {
  tasks: Task[]
  activeFilter: TaskStatus
  onFilterChange: (filter: TaskStatus) => void
  onTaskClick: (task: Task) => void
  onTaskUpdate: (task: Task) => void
  onTaskDelete: (id: string) => void
  onBulkAction: (action: string, ids: string[]) => void
  selectedTasks: string[]
  onSelectionChange: (ids: string[]) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

const statusOptions: { value: TaskStatus; label: string; count: number }[] = [
  { value: 'inbox', label: 'Inbox', count: 0 },
  { value: 'today', label: 'Today', count: 0 },
  { value: 'upcoming', label: 'Upcoming', count: 0 },
  { value: 'completed', label: 'Completed', count: 0 },
  { value: 'overdue', label: 'Overdue', count: 0 },
]

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-gray-500/20 text-gray-400',
  medium: 'bg-blue-500/20 text-blue-400',
  high: 'bg-orange-500/20 text-orange-400',
  critical: 'bg-red-500/20 text-red-400',
}

export function SmartTaskInbox({
  tasks,
  activeFilter,
  onFilterChange,
  onTaskClick,
  onTaskUpdate,
  onTaskDelete,
  onBulkAction,
  selectedTasks,
  onSelectionChange,
  searchQuery,
  onSearchChange,
}: SmartTaskInboxProps) {
  const [sortBy, setSortBy] = React.useState<'priority' | 'dueDate' | 'effort' | 'impact'>('priority')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')
  const [projectFilter, setProjectFilter] = React.useState<string>('all')
  const [energyFilter, setEnergyFilter] = React.useState<string>('all')

  const filteredTasks = React.useMemo(() => {
    let result = tasks.filter(t => t.status === activeFilter || activeFilter === 'all')

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.projectName?.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      )
    }

    if (projectFilter !== 'all') {
      result = result.filter(t => t.projectId === projectFilter)
    }

    if (energyFilter !== 'all') {
      result = result.filter(t => t.energyRequired === energyFilter)
    }

    result.sort((a, b) => {
      let aVal: number | string, bVal: number | string
      switch (sortBy) {
        case 'priority':
          aVal = a.aiPriorityScore
          bVal = b.aiPriorityScore
          break
        case 'dueDate':
          aVal = a.dueDate?.getTime() || Infinity
          bVal = b.dueDate?.getTime() || Infinity
          break
        case 'effort':
          aVal = a.estimatedEffort
          bVal = b.estimatedEffort
          break
        case 'impact':
          aVal = a.impact
          bVal = b.impact
          break
        default:
          return 0
      }
      if (sortOrder === 'asc') return aVal > bVal ? 1 : -1
      return aVal < bVal ? 1 : -1
    })

    return result
  }, [tasks, activeFilter, searchQuery, projectFilter, energyFilter, sortBy, sortOrder])

  const toggleSelection = (id: string) => {
    onSelectionChange(
      selectedTasks.includes(id)
        ? selectedTasks.filter(t => t !== id)
        : [...selectedTasks, id]
    )
  }

  const selectAll = () => {
    onSelectionChange(
      selectedTasks.length === filteredTasks.length
        ? []
        : filteredTasks.map(t => t.id)
    )
  }

  const statusCounts = React.useMemo(() => {
    const counts: Record<TaskStatus, number> = {
      inbox: 0,
      today: 0,
      upcoming: 0,
      completed: 0,
      overdue: 0,
    }
    tasks.forEach(t => counts[t.status]++)
    return statusOptions.map(opt => ({ ...opt, count: counts[opt.value] }))
  }, [tasks])

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b border-border/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
            aria-label="Search tasks"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority Score</SelectItem>
              <SelectItem value="dueDate">Due Date</SelectItem>
              <SelectItem value="effort">Effort</SelectItem>
              <SelectItem value="impact">Impact</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            aria-label={sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
          >
            <ChevronDown className={cn('h-4 w-4', sortOrder === 'desc' && 'rotate-180')} />
          </Button>

          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="proj-1">Client Alpha</SelectItem>
              <SelectItem value="proj-2">Platform Core</SelectItem>
              <SelectItem value="proj-3">Personal Brand</SelectItem>
              <SelectItem value="proj-4">Admin</SelectItem>
            </SelectContent>
          </Select>

          <Select value={energyFilter} onValueChange={setEnergyFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Energy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="balanced">Balanced</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex border-b border-border/50 overflow-x-auto px-4">
        {statusCounts.map((status) => (
          <button
            key={status.value}
            onClick={() => onFilterChange(status.value)}
            className={cn(
              'flex h-12 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors whitespace-nowrap',
              activeFilter === status.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
            aria-current={activeFilter === status.value ? 'page' : undefined}
          >
            {status.label}
            <span className={cn('flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-medium', activeFilter === status.value ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground')}>
              {status.count}
            </span>
          </button>
        ))}
      </div>

      {selectedTasks.length > 0 && (
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-2 bg-primary/5">
          <span className="text-sm font-medium">{selectedTasks.length} tasks selected</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onBulkAction('schedule-today', selectedTasks)}>
              Schedule Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => onBulkAction('defer', selectedTasks)}>
              Defer
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onBulkAction('delete', selectedTasks)}>
              Delete
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onSelectionChange([])}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Folder className="h-16 w-16 mx-auto mb-4 opacity-30" aria-hidden="true" />
              <p className="text-lg font-medium">{activeFilter === 'inbox' ? 'Inbox is empty' : `No ${activeFilter} tasks`}</p>
              <p className="text-sm mt-1">{activeFilter === 'inbox' ? 'Capture tasks here, then organize them' : 'Tasks will appear here when added'}</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    'relative flex items-start gap-3 rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-border/80 hover:shadow-lg',
                    selectedTasks.includes(task.id) && 'ring-2 ring-primary/50 bg-primary/5'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedTasks.includes(task.id)}
                    onChange={() => toggleSelection(task.id)}
                    className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    aria-label={`Select ${task.title}`}
                  />

                  <div className="flex-1 min-w-0" onClick={() => onTaskClick(task)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className={cn('text-xs', priorityColors[task.priority])}>
                          {priorityLabels[task.priority]}
                        </Badge>
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-mono font-bold">
                          {task.aiPriorityScore}%
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" aria-hidden="true" />
                          {formatDateShort(task.dueDate)}
                          {task.dueDate < new Date() && task.status !== 'completed' && (
                            <span className="text-red-400">(overdue)</span>
                          )}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {Math.round(task.estimatedEffort/60)}h {task.estimatedEffort%60}m
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" aria-hidden="true" />
                        {task.energyRequired}
                      </span>
                      <span className="flex items-center gap-1">
                        <Flag className="h-3 w-3" aria-hidden="true" />
                        Impact: {task.impact}/10
                      </span>
                      {task.projectName && (
                        <span className="flex items-center gap-1">
                          <Folder className="h-3 w-3" aria-hidden="true" />
                          <span className="font-medium" style={{ color: task.projectColor }}>{task.projectName}</span>
                        </span>
                      )}
                      {task.tags.length > 0 && (
                        <span className="flex flex-wrap gap-1">
                          {task.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-[10px] h-4 px-2">
                              {tag}
                            </Badge>
                          ))}
                          {task.tags.length > 3 && (
                            <Badge variant="secondary" className="text-[10px] h-4 px-2">
                              +{task.tags.length - 3}
                            </Badge>
                          )}
                        </span>
                      )}
                    </div>

                    {task.aiReasoning && (
                      <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs text-primary">
                        <span className="font-medium">AI: </span>
                        {task.aiReasoning}
                      </div>
                    )}
                  </div>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-full">Actions</button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Task Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onTaskClick(task)}>
                            <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onTaskUpdate({ ...task, status: 'today' })}>
                            <Calendar className="h-4 w-4 mr-2" aria-hidden="true" />
                            Schedule for Today
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onTaskUpdate({ ...task, status: 'upcoming' })}>
                            <Clock className="h-4 w-4 mr-2" aria-hidden="true" />
                            Move to Upcoming
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onTaskUpdate({ ...task, status: 'completed' })}>
                            <Check className="h-4 w-4 mr-2" aria-hidden="true" />
                            Mark Complete
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onTaskUpdate({ ...task, priority: 'high' })}>
                            <Flag className="h-4 w-4 mr-2" aria-hidden="true" />
                            Set High Priority
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onTaskUpdate({ ...task, priority: 'low' })}>
                            <Flag className="h-4 w-4 mr-2 opacity-50" aria-hidden="true" />
                            Set Low Priority
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => onTaskDelete(task.id)}>
                            <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </PopoverContent>
                  </Popover>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
          {
            'bg-primary text-primary-foreground hover:bg-primary/80': variant === 'default',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
            'border border-border bg-transparent hover:bg-accent': variant === 'outline',
            'bg-destructive text-destructive-foreground hover:bg-destructive/80': variant === 'destructive',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }