'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Search, Bell, Sun, Moon, Monitor, User, LogOut, Command, Plus, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Popover, 
  PopoverTrigger, 
  PopoverContent 
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { formatTime } from '@/lib/utils'
import { EnergyLevel } from '@/types'

interface TopBarProps {
  userName: string
  energyLevel: EnergyLevel
  onEnergyChange: (level: EnergyLevel) => void
  onQuickAdd: () => void
  onSearch: () => void
  theme: 'dark' | 'light'
  onThemeChange: (theme: 'dark' | 'light') => void
  onRebalance: () => void
}

export function TopBar({ 
  userName, 
  energyLevel, 
  onEnergyChange, 
  onQuickAdd, 
  onSearch,
  theme,
  onThemeChange,
  onRebalance,
}: TopBarProps) {
  const [searchOpen, setSearchOpen] = React.useState(false)
  const now = new Date()

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onSearch}
                className="hidden sm:flex"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Search (⌘K)</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Search (⌘K)</TooltipContent>
          </Tooltip>

          <div className="hidden md:flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground">
            <span className="font-mono">{now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
            <span aria-hidden="true">·</span>
            <span>{now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onQuickAdd}
                aria-label="Quick add task"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Add Task (⌘N)</TooltipContent          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="premium" onClick={onRebalance} className="hidden sm:flex">
                <Zap className="h-4 w-4 mr-2" aria-hidden="true" />
                Rebalance
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Rebalance My Day</TooltipContent>
          </Tooltip>

          <div className="hidden lg:flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5">
            <Label htmlFor="energy-select" className="text-xs font-medium text-muted-foreground mr-1">
              Energy
            </Label>
            <Select value={energyLevel} onValueChange={onEnergyChange}>
              <SelectTrigger id="energy-select" className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Balanced" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-green-400" aria-hidden="true" />
                    <span>High</span>
                  </div>
                </SelectItem>
                <SelectItem value="balanced">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-cyan-400" aria-hidden="true" />
                    <span>Balanced</span>
                  </div>
                </SelectItem>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
                    <span>Low</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle Theme</TooltipContent>
          </Tooltip>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt={userName} />
                  <AvatarFallback className="text-xs font-medium">
                    {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56">
              <div className="flex items-center gap-3 p-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt={userName} />
                  <AvatarFallback>{userName.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">Freelancer</p>
                </div>
              </div>
              <Separator />
              <div className="p-2 space-y-1">
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors">
                  <User className="h-4 w-4" aria-hidden="true" />
                  Profile
                </button>
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors">
                  <Monitor className="h-4 w-4" aria-hidden="true" />
                  Appearance
                </button>
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors">
                  <Command className="h-4 w-4" aria-hidden="true" />
                  Keyboard Shortcuts
                </button>
              </div>
              <Separator />
              <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-accent transition-colors">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign Out
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  )
}