'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Check,
  Volume2,
  VolumeX,
  Settings,
  Clock,
  Zap,
  Music,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

const COMPLETION_MESSAGES = [
  'One less thing to carry.',
  'Momentum restored.',
  'Progress compounds.',
  'Well done.',
  'Space created.',
  'Forward motion.',
  'Clarity earned.',
  'Task complete. Mind clear.',
];

const SOUNDSCAPES = [
  { id: 'brown', name: 'Deep Brown Noise', type: 'noise', color: 'from-amber-900 to-orange-900' },
  { id: 'rain', name: 'Gentle Rainfall', type: 'nature', color: 'from-blue-900 to-cyan-900' },
  { id: 'white', name: 'Pure White Noise', type: 'noise', color: 'from-slate-700 to-slate-900' },
  { id: 'pink', name: 'Soft Pink Noise', type: 'noise', color: 'from-rose-900 to-pink-900' },
  { id: 'forest', name: 'Forest Nature', type: 'nature', color: 'from-green-900 to-emerald-900' },
  {
    id: 'midnight',
    name: 'Midnight Atmosphere',
    type: 'ambient',
    color: 'from-indigo-900 to-purple-900',
  },
  { id: 'library', name: 'Quiet Library', type: 'ambient', color: 'from-amber-800 to-yellow-800' },
  {
    id: 'alpha',
    name: 'Binaural Alpha Waves',
    type: 'binaural',
    color: 'from-cyan-900 to-teal-900',
  },
];

interface FocusModeProps {
  taskId?: string;
  taskTitle?: string;
  estimatedMinutes?: number;
  onComplete: () => void;
  onExit: () => void;
}

export function FocusMode({
  taskId,
  taskTitle = 'Focus Session',
  estimatedMinutes = 50,
  onComplete,
  onExit,
}: FocusModeProps) {
  const [isRunning, setIsRunning] = React.useState(false);
  const [timeRemaining, setTimeRemaining] = React.useState(estimatedMinutes * 60);
  const [initialDuration] = React.useState(estimatedMinutes * 60);
  const [selectedSound, setSelectedSound] = React.useState<string>('rain');
  const [volume, setVolume] = React.useState(0.5);
  const [isMuted, setIsMuted] = React.useState(false);
  const [showSoundPanel, setShowSoundPanel] = React.useState(false);
  const [showCompletion, setShowCompletion] = React.useState(false);
  const [completionMessage, setCompletionMessage] = React.useState('');
  const [progress, setProgress] = React.useState(0);
  const { toast } = useToast();

  const audioRefs = React.useRef<Map<string, HTMLAudioElement>>(new Map());
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const completionTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    SOUNDSCAPES.forEach((s) => {
      const audio = new Audio(`/sounds/${s.id}.mp3`);
      audio.loop = true;
      audio.volume = volume * (isMuted ? 0 : 1);
      audioRefs.current.set(s.id, audio);
    });

    return () => {
      audioRefs.current.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current.clear();
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (completionTimeoutRef.current) clearTimeout(completionTimeoutRef.current);
    };
  }, []);

  const playSound = React.useCallback(
    (soundId: string) => {
      audioRefs.current.forEach((audio, id) => {
        if (id === soundId) {
          audio.volume = volume * (isMuted ? 0 : 1);
          audio.play().catch(() => {});
        } else {
          audio.pause();
        }
      });
    },
    [volume, isMuted]
  );

  const stopAllSounds = React.useCallback(() => {
    audioRefs.current.forEach((audio) => audio.pause());
  }, []);

  const startTimer = React.useCallback(() => {
    if (intervalRef.current) return;

    setIsRunning(true);
    playSound(selectedSound);

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        const newTime = prev - 1;
        setProgress(((initialDuration - newTime) / initialDuration) * 100);
        return newTime;
      });
    }, 1000);
  }, [selectedSound, playSound, initialDuration]);

  const pauseTimer = React.useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    stopAllSounds();
  }, [stopAllSounds]);

  const handleComplete = React.useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    stopAllSounds();
    setIsRunning(false);
    setTimeRemaining(0);
    setProgress(100);

    const message = COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)];
    setCompletionMessage(message);
    setShowCompletion(true);

    completionTimeoutRef.current = setTimeout(() => {
      setShowCompletion(false);
      onComplete();
    }, 3000);
  }, [stopAllSounds, onComplete]);

  const resetTimer = React.useCallback(() => {
    pauseTimer();
    setTimeRemaining(initialDuration);
    setProgress(0);
  }, [pauseTimer, initialDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (isRunning) {
            pauseTimer();
          } else {
            startTimer();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onExit();
          break;
        case 'Enter':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            handleComplete();
          }
          break;
        case 'ArrowRight':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            setTimeRemaining((prev) => Math.min(initialDuration, prev + 60));
            setProgress(
              ((initialDuration - Math.min(initialDuration, timeRemaining + 60)) /
                initialDuration) *
                100
            );
          }
          break;
        case 'ArrowLeft':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            setTimeRemaining((prev) => Math.max(0, prev - 60));
            setProgress(
              ((initialDuration - Math.max(0, timeRemaining - 60)) / initialDuration) * 100
            );
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, startTimer, pauseTimer, handleComplete, onExit, initialDuration, timeRemaining]);

  React.useEffect(() => {
    if (isRunning) {
      playSound(selectedSound);
    } else {
      stopAllSounds();
    }
  }, [selectedSound, isRunning, playSound, stopAllSounds]);

  React.useEffect(() => {
    audioRefs.current.forEach((audio) => {
      audio.volume = volume * (isMuted ? 0 : 1);
    });
  }, [volume, isMuted]);

  const currentSound = SOUNDSCAPES.find((s) => s.id === selectedSound);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md"
        >
          <Card className="overflow-hidden border-primary/20 bg-card/90 backdrop-blur-xl">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Focus Mode</p>
                    <h3 className="font-heading text-lg font-semibold truncate max-w-[200px]">
                      {taskTitle}
                    </h3>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onExit}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Exit focus mode"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="relative aspect-square">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-muted-foreground/20"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#progress-gradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    style={{
                      strokeDasharray: 2 * Math.PI * 45,
                      strokeDashoffset: 2 * Math.PI * 45 * (1 - progress / 100),
                    }}
                    className="text-primary"
                    animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - progress / 100) }}
                    transition={{ duration: 1, ease: 'linear' }}
                  />
                  <defs>
                    <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00F0FF" />
                      <stop offset="100%" stopColor="#0EA5E9" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.div
                    key={timeRemaining}
                    className="font-mono font-bold tabular-nums"
                    style={{ fontSize: 'clamp(3rem, 12vw, 5rem)' }}
                    initial={false}
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1 }}
                  >
                    {formatTime(timeRemaining)}
                  </motion.div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isRunning ? 'Focus in progress' : 'Ready to focus'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setTimeRemaining((prev) => Math.max(0, prev - 60));
                    setProgress(
                      ((initialDuration - Math.max(0, timeRemaining - 60)) / initialDuration) * 100
                    );
                  }}
                  aria-label="Subtract 1 minute"
                >
                  <SkipBack className="h-5 w-5" />
                </Button>

                <Button
                  size="lg"
                  className="h-16 w-16 rounded-full"
                  onClick={isRunning ? pauseTimer : startTimer}
                  aria-label={isRunning ? 'Pause' : 'Start focus session'}
                >
                  {isRunning ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7" />}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setTimeRemaining((prev) => Math.min(initialDuration, prev + 60));
                    setProgress(
                      ((initialDuration - Math.min(initialDuration, timeRemaining + 60)) /
                        initialDuration) *
                        100
                    );
                  }}
                  aria-label="Add 1 minute"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center justify-center gap-4 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetTimer}
                  disabled={timeRemaining === initialDuration && !isRunning}
                  className="gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Reset
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={handleComplete}
                  disabled={!isRunning}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  <Check className="h-4 w-4" />
                  Complete
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {currentSound?.name || 'Select sound'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSoundPanel(!showSoundPanel)}
                  aria-label="Sound settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>

              <AnimatePresence>
                {showSoundPanel && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden space-y-4 pt-2 border-t border-border"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="volume">Master Volume</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsMuted(!isMuted)}
                          aria-label={isMuted ? 'Unmute' : 'Mute'}
                        >
                          {isMuted ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                        <Slider
                          id="volume"
                          value={[volume * 100]}
                          onValueChange={([v]) => setVolume(v / 100)}
                          max={100}
                          step={5}
                          disabled={isMuted}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground w-10 text-right">
                          {Math.round(volume * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {SOUNDSCAPES.map((sound) => (
                        <Button
                          key={sound.id}
                          variant={selectedSound === sound.id ? 'default' : 'outline'}
                          className={cn(
                            'h-20 flex-col gap-2 p-4 text-left',
                            `bg-gradient-to-br ${sound.color}`,
                            selectedSound === sound.id &&
                              'border-primary shadow-[0_0_20px_rgba(14,165,233,0.3)]'
                          )}
                          onClick={() => {
                            setSelectedSound(sound.id);
                            if (isRunning) playSound(sound.id);
                          }}
                        >
                          <div className="font-medium">{sound.name}</div>
                          <div className="text-xs opacity-75 capitalize">{sound.type}</div>
                        </Button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-3 gap-4 text-center pt-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="font-heading text-xl font-bold text-primary">
                    {Math.floor((initialDuration - timeRemaining) / 60)}
                  </div>
                  <div className="text-xs text-muted-foreground">Min Focused</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="font-heading text-xl font-bold text-green-400">
                    {Math.floor(progress)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Progress</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="font-heading text-xl font-bold text-amber-400">
                    {formatTime(initialDuration - timeRemaining)}
                  </div>
                  <div className="text-xs text-muted-foreground">Elapsed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <AnimatePresence>
            {showCompletion && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
              >
                <div className="pointer-events-auto">
                  <motion.div
                    className="glass rounded-2xl p-8 md:p-12 text-center border border-primary/30 bg-primary/5 max-w-sm mx-4"
                    animate={{
                      boxShadow: [
                        '0 0 0 0 rgba(14,165,233,0)',
                        '0 0 60px 20px rgba(14,165,233,0.3)',
                        '0 0 0 0 rgba(14,165,233,0)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: 1 }}
                  >
                    <motion.div
                      className="h-16 w-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5 }}
                    >
                      <Check className="h-8 w-8 text-primary" />
                    </motion.div>
                    <h3 className="font-heading text-2xl font-bold mb-2">Session Complete</h3>
                    <p className="text-muted-foreground text-lg italic">"{completionMessage}"</p>
                    <div className="mt-6 flex items-center justify-center gap-2 text-sm text-primary/70">
                      <Zap className="h-4 w-4 animate-pulse" />
                      <span>Energy pulse recorded</span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
