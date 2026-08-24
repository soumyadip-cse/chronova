'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Edit,
  BookOpen,
  Brain,
  Target,
  Award,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';

const MASTERY_STAGES = [
  {
    id: 'unseen',
    label: 'Unseen',
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    desc: 'Not started yet',
  },
  {
    id: 'learning',
    label: 'Learning',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    desc: 'Actively studying',
  },
  {
    id: 'practicing',
    label: 'Practicing',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    desc: 'Doing practice problems',
  },
  {
    id: 'mastered',
    label: 'Mastered',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    desc: 'Confident for exam',
  },
];

interface Topic {
  id: string;
  name: string;
  masteryStatus: 'unseen' | 'learning' | 'practicing' | 'mastered';
  examWeight: number;
  estimatedHours: number;
  hoursSpent: number;
  lastStudied: string | null;
}

export default function SubjectDetailPage() {
  const params = useParams();
  const subjectId = params.subjectId as string;

  const [topics, setTopics] = React.useState<Topic[]>([
    {
      id: '1',
      name: 'Arrays & Linked Lists',
      masteryStatus: 'mastered',
      examWeight: 15,
      estimatedHours: 3,
      hoursSpent: 4,
      lastStudied: '2024-01-15',
    },
    {
      id: '2',
      name: 'Stacks & Queues',
      masteryStatus: 'mastered',
      examWeight: 10,
      estimatedHours: 2,
      hoursSpent: 2.5,
      lastStudied: '2024-01-16',
    },
    {
      id: '3',
      name: 'Trees & BST',
      masteryStatus: 'practicing',
      examWeight: 20,
      estimatedHours: 5,
      hoursSpent: 3,
      lastStudied: '2024-01-20',
    },
    {
      id: '4',
      name: 'Graphs & Traversal',
      masteryStatus: 'learning',
      examWeight: 20,
      estimatedHours: 6,
      hoursSpent: 2,
      lastStudied: '2024-01-22',
    },
    {
      id: '5',
      name: 'Dynamic Programming',
      masteryStatus: 'unseen',
      examWeight: 15,
      estimatedHours: 8,
      hoursSpent: 0,
      lastStudied: null,
    },
    {
      id: '6',
      name: 'Sorting Algorithms',
      masteryStatus: 'practicing',
      examWeight: 10,
      estimatedHours: 3,
      hoursSpent: 2,
      lastStudied: '2024-01-18',
    },
    {
      id: '7',
      name: 'Hash Tables',
      masteryStatus: 'learning',
      examWeight: 10,
      estimatedHours: 2,
      hoursSpent: 1,
      lastStudied: '2024-01-21',
    },
  ]);

  const [expandedTopics, setExpandedTopics] = React.useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newTopic, setNewTopic] = React.useState({ name: '', examWeight: 10, estimatedHours: 2 });

  const subject = { name: 'Data Structures & Algorithms', code: 'CS201', color: '#3B82F6' };

  const masteryCounts = topics.reduce(
    (acc, t) => {
      acc[t.masteryStatus] = (acc[t.masteryStatus] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalWeight = topics.reduce((sum, t) => sum + t.examWeight, 0);
  const masteredWeight = topics
    .filter((t) => t.masteryStatus === 'mastered')
    .reduce((sum, t) => sum + t.examWeight, 0);
  const overallMastery = totalWeight > 0 ? Math.round((masteredWeight / totalWeight) * 100) : 0;

  const toggleExpand = (id: string) => {
    setExpandedTopics((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const updateMastery = (id: string, status: Topic['masteryStatus']) => {
    setTopics((prev) => prev.map((t) => (t.id === id ? { ...t, masteryStatus: status } : t)));
  };

  const handleCreateTopic = () => {
    if (!newTopic.name.trim()) return;

    const topic: Topic = {
      id: crypto.randomUUID(),
      name: newTopic.name,
      masteryStatus: 'unseen',
      examWeight: newTopic.examWeight,
      estimatedHours: newTopic.estimatedHours,
      hoursSpent: 0,
      lastStudied: null,
    };

    setTopics((prev) => [...prev, topic]);
    setShowCreateModal(false);
    setNewTopic({ name: '', examWeight: 10, estimatedHours: 2 });
  };

  const getStageIcon = (status: Topic['masteryStatus']) => {
    switch (status) {
      case 'unseen':
        return <Clock className="h-4 w-4" />;
      case 'learning':
        return <Brain className="h-4 w-4" />;
      case 'practicing':
        return <Target className="h-4 w-4" />;
      case 'mastered':
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: subject.color + '20' }}
          >
            <BookOpen className="h-6 w-6" style={{ color: subject.color }} />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold">{subject.name}</h1>
            <p className="text-muted-foreground">
              {subject.code} • {topics.length} topics • {overallMastery}% mastered
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Topic
        </Button>
      </div>

      {/* Mastery Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {MASTERY_STAGES.map((stage) => (
          <Card key={stage.id} className="glass text-center">
            <CardContent className="py-4">
              <div
                className={cn(
                  stage.bg,
                  'rounded-lg mx-auto mb-2 h-10 w-10 flex items-center justify-center'
                )}
              >
                {getStageIcon(stage.id as any)}
              </div>
              <div
                className="font-heading text-2xl font-bold"
                style={{ color: stage.color.replace('text-', '') }}
              >
                {masteryCounts[stage.id] || 0}
              </div>
              <div className="text-xs text-muted-foreground">{stage.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Bar */}
      <Card className="glass">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Exam Readiness</span>
            <span className="font-bold text-lg" style={{ color: subject.color }}>
              {overallMastery}%
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${overallMastery}%`, backgroundColor: subject.color }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {masteredWeight} of {totalWeight}% exam weight mastered •{' '}
            {topics.reduce((sum, t) => sum + t.hoursSpent, 0).toFixed(1)}h studied
          </p>
        </CardContent>
      </Card>

      {/* Topics List */}
      <div className="space-y-3">
        <h2 className="font-heading text-xl font-bold">Topics & Mastery Tracker</h2>
        <div className="space-y-2">
          {topics.map((topic) => {
            const stage = MASTERY_STAGES.find((s) => s.id === topic.masteryStatus)!;
            const isExpanded = expandedTopics.includes(topic.id);

            return (
              <Card key={topic.id} className="glass overflow-hidden">
                <CardContent className="p-0">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 p-4 hover:bg-accent/50"
                    onClick={() => toggleExpand(topic.id)}
                  >
                    <div
                      className={cn(
                        'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        stage.bg
                      )}
                    >
                      {getStageIcon(topic.masteryStatus)}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{topic.name}</h3>
                        <span
                          className={cn('text-xs px-2 py-0.5 rounded-full', stage.bg, stage.color)}
                        >
                          {stage.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>Weight: {topic.examWeight}%</span>
                        <span>Est: {topic.estimatedHours}h</span>
                        <span>Spent: {topic.hoursSpent}h</span>
                        {topic.lastStudied && <span>Last: {topic.lastStudied}</span>}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-border bg-muted/30"
                      >
                        <div className="p-4 space-y-4">
                          <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                              <Label>Mastery Status</Label>
                              <div className="flex gap-2 flex-wrap">
                                {MASTERY_STAGES.map((s) => (
                                  <Button
                                    key={s.id}
                                    variant={topic.masteryStatus === s.id ? 'default' : 'outline'}
                                    size="sm"
                                    className={cn(s.bg, s.color)}
                                    onClick={() => updateMastery(topic.id, s.id as any)}
                                  >
                                    {s.label}
                                  </Button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`weight-${topic.id}`}>Exam Weight %</Label>
                              <Input
                                id={`weight-${topic.id}`}
                                type="number"
                                value={topic.examWeight}
                                onChange={(e) =>
                                  setTopics((prev) =>
                                    prev.map((t) =>
                                      t.id === topic.id
                                        ? { ...t, examWeight: parseInt(e.target.value) || 0 }
                                        : t
                                    )
                                  )
                                }
                                min={0}
                                max={100}
                                className="w-24"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`hours-${topic.id}`}>Est. Hours</Label>
                              <Input
                                id={`hours-${topic.id}`}
                                type="number"
                                value={topic.estimatedHours}
                                onChange={(e) =>
                                  setTopics((prev) =>
                                    prev.map((t) =>
                                      t.id === topic.id
                                        ? { ...t, estimatedHours: parseFloat(e.target.value) || 0 }
                                        : t
                                    )
                                  )
                                }
                                min={0}
                                step={0.5}
                                className="w-24"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateMastery(topic.id, 'learning')}
                            >
                              <Brain className="h-3 w-3 mr-1" /> Study Now
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateMastery(topic.id, 'practicing')}
                            >
                              <Target className="h-3 w-3 mr-1" /> Practice
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateMastery(topic.id, 'mastered')}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" /> Mark Mastered
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-auto text-destructive"
                              onClick={() =>
                                setTopics((prev) => prev.filter((t) => t.id !== topic.id))
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {topics.length === 0 && (
          <Card className="glass border-dashed border-border/50 text-center py-12">
            <CardContent>
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                No topics yet. Add your first topic to start tracking mastery.
              </p>
              <Button className="mt-4 gap-2" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4" />
                Add Topic
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Modal */}
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50',
          showCreateModal ? 'block' : 'hidden'
        )}
      >
        <div className="glass w-full max-w-md rounded-2xl p-6 border border-border">
          <h2 className="font-heading text-xl font-bold mb-4">Add New Topic</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic-name">Topic Name</Label>
              <Input
                id="topic-name"
                value={newTopic.name}
                onChange={(e) => setNewTopic((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Graph Traversal Algorithms"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="topic-weight">Exam Weight %</Label>
                <Input
                  id="topic-weight"
                  type="number"
                  value={newTopic.examWeight}
                  onChange={(e) =>
                    setNewTopic((prev) => ({ ...prev, examWeight: parseInt(e.target.value) || 0 }))
                  }
                  min={0}
                  max={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic-hours">Estimated Hours</Label>
                <Input
                  id="topic-hours"
                  type="number"
                  value={newTopic.estimatedHours}
                  onChange={(e) =>
                    setNewTopic((prev) => ({
                      ...prev,
                      estimatedHours: parseFloat(e.target.value) || 0,
                    }))
                  }
                  min={0}
                  step={0.5}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleCreateTopic}>
                Add Topic
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
