'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  User,
  Clock,
  Zap,
  Target,
  Brain,
  Calendar,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { OnboardingData } from '@/types';

const STEPS = [
  { id: 'role', title: 'Your Role', icon: User, desc: 'Helps us tailor AI suggestions' },
  { id: 'hours', title: 'Work Hours', icon: Clock, desc: "When you're typically available" },
  { id: 'energy', title: 'Peak Energy', icon: Zap, desc: 'When you do your best deep work' },
  {
    id: 'focus',
    title: 'Focus Length',
    icon: Target,
    desc: 'Preferred deep work session duration',
  },
  {
    id: 'challenge',
    title: 'Main Challenge',
    icon: Brain,
    desc: 'Your biggest productivity struggle',
  },
  { id: 'calendar', title: 'Calendar Sync', icon: Calendar, desc: 'Connect for two-way sync' },
];

const ROLE_OPTIONS = [
  { value: 'student', label: 'Student', desc: 'Classes, assignments, study sessions' },
  { value: 'freelancer', label: 'Freelancer', desc: 'Client projects, flexible schedule' },
  { value: 'professional', label: 'Professional', desc: 'Corporate job, meetings, deep work' },
  { value: 'founder', label: 'Founder', desc: 'High autonomy, strategic planning' },
];

const ENERGY_OPTIONS = [
  { value: 'morning', label: 'Morning (6am-12pm)', desc: 'Early bird, best work before lunch' },
  {
    value: 'afternoon',
    label: 'Afternoon (12pm-6pm)',
    desc: 'Peak after lunch, evening wind-down',
  },
  { value: 'evening', label: 'Evening (6pm-12am)', desc: 'Night owl, best work after dark' },
];

const FOCUS_OPTIONS = [25, 45, 60, 90, 120];

const CHALLENGES = [
  'Context switching between projects',
  'Procrastination on important tasks',
  'Too many meetings',
  'Difficulty estimating task duration',
  'Energy crashes in afternoon',
  'Overcommitting to work',
  'Distractions and interruptions',
  'Unclear priorities',
];

export function OnboardingFlow({
  onComplete,
  initialData,
}: {
  onComplete: (data: OnboardingData) => void;
  initialData?: Partial<OnboardingData>;
}) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [formData, setFormData] = React.useState<OnboardingData>({
    role: 'freelancer',
    workingHours: { start: '09:00', end: '18:00' },
    peakEnergy: 'morning',
    focusSessionLength: 90,
    productivityChallenge: '',
    calendarConnected: true,
    ...initialData,
  });

  const currentStepData = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case 'role':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {ROLE_OPTIONS.map((role) => (
              <Button
                key={role.value}
                variant={formData.role === role.value ? 'default' : 'outline'}
                className="h-28 flex-col gap-3 p-6 text-left"
                onClick={() => updateField('role', role.value as OnboardingData['role'])}
              >
                <span className="font-medium text-lg">{role.label}</span>
                <p className="text-sm text-muted-foreground">{role.desc}</p>
              </Button>
            ))}
          </div>
        );

      case 'hours':
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label>Work Day Start</Label>
              <Input
                type="time"
                value={formData.workingHours.start}
                onChange={(e) =>
                  updateField('workingHours', { ...formData.workingHours, start: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Work Day End</Label>
              <Input
                type="time"
                value={formData.workingHours.end}
                onChange={(e) =>
                  updateField('workingHours', { ...formData.workingHours, end: e.target.value })
                }
              />
            </div>
          </div>
        );

      case 'energy':
        return (
          <div className="grid gap-4 md:grid-cols-3">
            {ENERGY_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={formData.peakEnergy === option.value ? 'default' : 'outline'}
                className="h-24 flex-col gap-2 p-4 text-left"
                onClick={() =>
                  updateField('peakEnergy', option.value as OnboardingData['peakEnergy'])
                }
              >
                <span className="font-medium">{option.label.split(' ')[0]}</span>
                <p className="text-sm text-muted-foreground">{option.desc}</p>
              </Button>
            ))}
          </div>
        );

      case 'focus':
        return (
          <div className="flex flex-wrap gap-3">
            {FOCUS_OPTIONS.map((length) => (
              <Button
                key={length}
                variant={formData.focusSessionLength === length ? 'default' : 'outline'}
                size="lg"
                onClick={() => updateField('focusSessionLength', length)}
              >
                {length} min
              </Button>
            ))}
          </div>
        );

      case 'challenge':
        return (
          <div className="space-y-3 max-w-2xl">
            {CHALLENGES.map((challenge, i) => (
              <Button
                key={i}
                variant={formData.productivityChallenge === challenge ? 'default' : 'outline'}
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => updateField('productivityChallenge', challenge)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0',
                      formData.productivityChallenge === challenge
                        ? 'border-primary bg-primary'
                        : 'border-border'
                    )}
                  >
                    {formData.productivityChallenge === challenge && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <span>{challenge}</span>
                </div>
              </Button>
            ))}
          </div>
        );

      case 'calendar':
        return (
          <div className="space-y-6">
            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Connect Google Calendar</h3>
                      <p className="text-sm text-muted-foreground">
                        Two-way sync with your primary calendar
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.calendarConnected}
                    onCheckedChange={(checked) => updateField('calendarConnected', checked)}
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-medium">What this enables</h4>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• Meetings appear automatically in your timeline</li>
                      <li>• AI avoids scheduling conflicts</li>
                      <li>• Focus blocks sync back to your calendar</li>
                      <li>• Changes in either place stay in sync</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center font-medium transition-all',
                    index < currentStep
                      ? 'bg-primary text-primary-foreground'
                      : index === currentStep
                        ? 'bg-primary/20 text-primary border-2 border-primary'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {index < currentStep ? <Check className="h-5 w-5" /> : <span>{index + 1}</span>}
                </div>
                <span className="text-xs text-center mt-1 max-w-[70px]">{step.title}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-2 rounded',
                    index < currentStep ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Step {currentStep + 1} of {STEPS.length}: {currentStepData.title}
        </p>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepData.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <Card className="glass">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <currentStepData.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{currentStepData.title}</CardTitle>
                  <CardDescription>{currentStepData.desc}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">{renderStepContent()}</CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleBack} disabled={isFirstStep}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              className="gap-2"
              disabled={currentStepData.id === 'challenge' && !formData.productivityChallenge}
            >
              {isLastStep ? 'Get Started' : 'Continue'}
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
