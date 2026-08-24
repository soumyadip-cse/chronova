'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Wand2, AlertTriangle, Check, X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { TaskPriority, EnergyLevel, Task } from '@/types';
import { createTask, TasksApiError } from '@/lib/tasks-client';

interface SmartTaskInputProps {
  onCreated: (task: Task) => void;
}

interface ParsedDraft {
  title: string;
  description?: string;
  deadlineUtc?: string | null;
  priorityFlag: TaskPriority;
  estimatedMinutes: number;
  energyRequired: EnergyLevel;
  confidence: number;
}

function formatDeadlineForInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  // datetime-local expects local wall clock — the one place local form is correct.
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function SmartTaskInput({ onCreated }: SmartTaskInputProps) {
  const { toast } = useToast();
  const [nlInput, setNlInput] = React.useState('');
  const [isParsing, setIsParsing] = React.useState(false);
  const [parseNotice, setParseNotice] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<ParsedDraft | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);

  async function handleParse() {
    const text = nlInput.trim();
    if (!text || isParsing) return;
    setIsParsing(true);
    setParseNotice(null);
    setDraft(null);
    try {
      const res = await fetch('/api/ai/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text }),
      });
      if (!res.ok) {
        let msg = 'Parsing failed. Please try again.';
        try {
          const data = await res.json();
          if (typeof data?.error === 'string') msg = data.error;
        } catch {}
        throw new Error(msg);
      }
      const data = await res.json();
      const p = data.parsedTask;
      if (!p?.title) {
        throw new Error('Could not extract a task from that. Try rephrasing.');
      }
      setDraft({
        title: String(p.title).slice(0, 500),
        description: p.description || undefined,
        deadlineUtc: p.deadlineUtc || null,
        priorityFlag: p.priorityFlag ?? 'medium',
        estimatedMinutes:
          Number.isFinite(p.estimatedMinutes) && p.estimatedMinutes > 0
            ? Math.min(1440, Math.round(p.estimatedMinutes))
            : 30,
        energyRequired: p.energyRequired ?? 'balanced',
        confidence: typeof p.confidence === 'number' ? p.confidence : 0.6,
      });
      if (data.source === 'fallback' && data.warning) {
        setParseNotice(data.warning);
      }
    } catch (error) {
      toast({
        title: 'Could not parse task',
        description:
          error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsParsing(false);
    }
  }

  async function handleConfirm() {
    if (!draft || isCreating) return;
    setIsCreating(true);
    try {
      const created = await createTask({
        title: draft.title,
        description: draft.description,
        deadlineUtc: draft.deadlineUtc || null,
        priorityFlag: draft.priorityFlag,
        estimatedMinutes: draft.estimatedMinutes,
        energyRequired: draft.energyRequired,
      });
      onCreated(created);
      setNlInput('');
      setDraft(null);
      setParseNotice(null);
      toast({ title: 'Task created', description: created.title });
    } catch (error) {
      toast({
        title: 'Could not create task',
        description:
          error instanceof TasksApiError ? error.message : 'Something went wrong. Try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Card className="glass border-primary/20">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          <Label htmlFor="smart-input">Describe a task in plain language</Label>
        </div>
        <Textarea
          id="smart-input"
          placeholder='e.g. "Finish my physics assignment by Friday, probably 2 hours, high priority."'
          value={nlInput}
          onChange={(e) => setNlInput(e.target.value)}
          rows={2}
          maxLength={2000}
          disabled={isParsing}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              handleParse();
            }
          }}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Parsed locally when AI is unavailable. You confirm before anything is saved.
          </p>
          <Button
            type="button"
            onClick={handleParse}
            disabled={isParsing || !nlInput.trim()}
            className="gap-2"
          >
            {isParsing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Understanding…
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" aria-hidden="true" />
                Parse with AI
              </>
            )}
          </Button>
        </div>

        {parseNotice && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400"
          >
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{parseNotice}</span>
          </div>
        )}

        {draft && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            role="region"
            aria-label="Extracted task details for confirmation"
            className="rounded-xl border border-border bg-background/50 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="gap-1">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                {Math.round(draft.confidence * 100)}% confident
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDraft(null)}
                aria-label="Discard parsed draft"
              >
                <X className="h-4 w-4 mr-1" aria-hidden="true" />
                Discard
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="draft-title">Title</Label>
                <Input
                  id="draft-title"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  maxLength={500}
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="draft-deadline">
                  Deadline{' '}
                  {draft.deadlineUtc === null && (
                    <span className="text-muted-foreground">(none detected)</span>
                  )}
                </Label>
                <Input
                  id="draft-deadline"
                  type="datetime-local"
                  value={formatDeadlineForInput(draft.deadlineUtc)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraft({
                      ...draft,
                      deadlineUtc: v ? new Date(v).toISOString() : null,
                    });
                  }}
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="draft-minutes">Estimated minutes</Label>
                <Input
                  id="draft-minutes"
                  type="number"
                  min={5}
                  max={1440}
                  value={draft.estimatedMinutes}
                  onChange={(e) =>
                    setDraft({ ...draft, estimatedMinutes: parseInt(e.target.value, 10) || 30 })
                  }
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={draft.priorityFlag}
                  onValueChange={(v: string) =>
                    setDraft({ ...draft, priorityFlag: v as TaskPriority })
                  }
                  disabled={isCreating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Energy</Label>
                <Select
                  value={draft.energyRequired}
                  onValueChange={(v: string) =>
                    setDraft({ ...draft, energyRequired: v as EnergyLevel })
                  }
                  disabled={isCreating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    deadlineUtc: draft.deadlineUtc ? null : draft.deadlineUtc,
                  })
                }
                variant="ghost"
                size="sm"
                disabled={isCreating || !draft.deadlineUtc}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                Clear deadline
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isCreating || !draft.title.trim()}
                className="gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Confirm &amp; Create Task
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
