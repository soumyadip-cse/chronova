'use client';

import * as React from 'react';
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
import { Plus, BookOpen, Trash2, Edit, Target, Award, BarChart } from 'lucide-react';
import { cn } from '@/lib/utils';

const SUBJECT_COLORS = [
  { value: '#3B82F6', name: 'Blue' },
  { value: '#EF4444', name: 'Red' },
  { value: '#10B981', name: 'Green' },
  { value: '#F59E0B', name: 'Amber' },
  { value: '#8B5CF6', name: 'Purple' },
  { value: '#EC4899', name: 'Pink' },
  { value: '#06B6D4', name: 'Cyan' },
  { value: '#84CC16', name: 'Lime' },
];

interface Subject {
  id: string;
  name: string;
  code: string;
  semester: string;
  color: string;
  targetGrade: string;
  topicsCount: number;
  masteryProgress: number;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = React.useState<Subject[]>([
    {
      id: '1',
      name: 'Data Structures & Algorithms',
      code: 'CS201',
      semester: 'Fall 2024',
      color: '#3B82F6',
      targetGrade: 'A',
      topicsCount: 12,
      masteryProgress: 65,
    },
    {
      id: '2',
      name: 'Database Systems',
      code: 'CS301',
      semester: 'Fall 2024',
      color: '#10B981',
      targetGrade: 'A-',
      topicsCount: 10,
      masteryProgress: 40,
    },
    {
      id: '3',
      name: 'Computer Networks',
      code: 'CS350',
      semester: 'Fall 2024',
      color: '#F59E0B',
      targetGrade: 'B+',
      topicsCount: 8,
      masteryProgress: 25,
    },
    {
      id: '3',
      name: 'Operating Systems',
      code: 'CS401',
      semester: 'Fall 2024',
      color: '#8B5CF6',
      targetGrade: 'A',
      topicsCount: 14,
      masteryProgress: 10,
    },
  ]);

  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newSubject, setNewSubject] = React.useState({
    name: '',
    code: '',
    semester: 'Fall 2024',
    color: '#3B82F6',
    targetGrade: 'A',
  });

  const handleCreateSubject = () => {
    if (!newSubject.name.trim()) return;

    const subject: Subject = {
      id: crypto.randomUUID(),
      ...newSubject,
      topicsCount: 0,
      masteryProgress: 0,
    };

    setSubjects((prev) => [...prev, subject]);
    setShowCreateModal(false);
    setNewSubject({
      name: '',
      code: '',
      semester: 'Fall 2024',
      color: '#3B82F6',
      targetGrade: 'A',
    });
  };

  const handleDeleteSubject = (id: string) => {
    if (confirm('Delete this subject and all its topics?')) {
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Subject Vault</h1>
          <p className="text-muted-foreground mt-1">
            Organize your syllabi, track mastery, and ace your exams
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Subject
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {subjects.map((subject) => (
          <Card key={subject.id} className="glass relative overflow-hidden">
            <div
              className="absolute top-0 left-0 right-0 h-2"
              style={{ backgroundColor: subject.color }}
            />
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-lg font-semibold truncate">{subject.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {subject.code} • {subject.semester}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDeleteSubject(subject.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{subject.topicsCount} topics</span>
                <span className="font-medium">Target: {subject.targetGrade}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Mastery Progress</span>
                  <span className="font-medium">{subject.masteryProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${subject.masteryProgress}%`,
                      backgroundColor: subject.color,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1" asChild>
                  <a href={`/student/subjects/${subject.id}`}>
                    <Target className="h-3 w-3" />
                    View Topics
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1" asChild>
                  <a href={`/student/subjects/${subject.id}/exams`}>
                    <Award className="h-3 w-3" />
                    Exams
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card
          className="glass border-dashed border-border/50"
          onClick={() => setShowCreateModal(true)}
        >
          <CardContent className="p-5 flex flex-col items-center justify-center h-48 text-center">
            <Plus className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">Add Subject</p>
            <p className="text-xs text-muted-foreground/50 mt-1">Create a new subject vault</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Modal */}
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50',
          showCreateModal ? 'block' : 'hidden'
        )}
      >
        <div className="glass w-full max-w-md rounded-2xl p-6 border border-border">
          <h2 className="font-heading text-xl font-bold mb-4">Create New Subject</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Subject Name</Label>
              <Input
                id="name"
                value={newSubject.name}
                onChange={(e) => setNewSubject((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Data Structures & Algorithms"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Course Code</Label>
              <Input
                id="code"
                value={newSubject.code}
                onChange={(e) => setNewSubject((prev) => ({ ...prev, code: e.target.value }))}
                placeholder="e.g., CS201"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={newSubject.semester}
                  onValueChange={(v) => setNewSubject((prev) => ({ ...prev, semester: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fall 2024">Fall 2024</SelectItem>
                    <SelectItem value="Spring 2025">Spring 2025</SelectItem>
                    <SelectItem value="Summer 2025">Summer 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetGrade">Target Grade</Label>
                <Select
                  value={newSubject.targetGrade}
                  onValueChange={(v) => setNewSubject((prev) => ({ ...prev, targetGrade: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setNewSubject((prev) => ({ ...prev, color: c.value }))}
                    className={cn(
                      'h-8 w-8 rounded-lg border-2 transition-all',
                      newSubject.color === c.value
                        ? 'border-primary scale-110'
                        : 'border-transparent hover:border-border'
                    )}
                    style={{ backgroundColor: c.value }}
                    aria-label={c.name}
                  />
                ))}
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
              <Button className="flex-1" onClick={handleCreateSubject}>
                Create Subject
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
