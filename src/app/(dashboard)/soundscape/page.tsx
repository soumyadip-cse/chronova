'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Music, Volume2, VolumeX, Play, Pause, Check, Plus, Heart, HeartOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const SOUNDSCAPES = [
  {
    id: 'brown',
    name: 'Deep Brown Noise',
    type: 'Noise',
    description: 'Low-frequency rumble for deep focus',
    color: 'from-amber-900 to-orange-900',
    icon: '🔊',
  },
  {
    id: 'rain',
    name: 'Gentle Rainfall',
    type: 'Nature',
    description: 'Steady rain rhythm for calm',
    color: 'from-blue-900 to-cyan-900',
    icon: '🌧️',
  },
  {
    id: 'white',
    name: 'Pure White Noise',
    type: 'Noise',
    description: 'Flat spectrum for masking',
    color: 'from-slate-700 to-slate-900',
    icon: '📻',
  },
  {
    id: 'pink',
    name: 'Soft Pink Noise',
    type: 'Noise',
    description: 'Balanced frequencies for flow',
    color: 'from-rose-900 to-pink-900',
    icon: '🎵',
  },
  {
    id: 'forest',
    name: 'Forest Nature',
    type: 'Nature',
    description: 'Birds, wind, leaves for serenity',
    color: 'from-green-900 to-emerald-900',
    icon: '🌲',
  },
  {
    id: 'midnight',
    name: 'Midnight Atmosphere',
    type: 'Ambient',
    description: 'Cosmic drones for late nights',
    color: 'from-indigo-900 to-purple-900',
    icon: '🌌',
  },
  {
    id: 'library',
    name: 'Quiet Library',
    type: 'Ambient',
    description: 'Page turns, whispers, presence',
    color: 'from-amber-800 to-yellow-900',
    icon: '📚',
  },
  {
    id: 'alpha',
    name: 'Binaural Alpha Waves',
    type: 'Binaural',
    description: '10Hz for relaxed focus (headphones)',
    color: 'from-cyan-900 to-teal-900',
    icon: '🧠',
  },
];

export default function SoundscapePage() {
  const [volume, setVolume] = React.useState(0.5);
  const [isMuted, setIsMuted] = React.useState(false);
  const [selectedSound, setSelectedSound] = React.useState<string>('rain');
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [favorites, setFavorites] = React.useState<string[]>([]);
  const [customMixes, setCustomMixes] = React.useState<
    Array<{ id: string; name: string; sounds: string[] }>
  >([]);

  const currentSound = SOUNDSCAPES.find((s) => s.id === selectedSound);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-6 p-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Focus Sounds</h1>
        <p className="text-muted-foreground mt-1">
          Curated soundscapes for deep work and relaxation
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                Sound Library
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-4 sm:grid-cols-2">
                {SOUNDSCAPES.map((sound) => (
                  <Button
                    key={sound.id}
                    variant={selectedSound === sound.id ? 'default' : 'outline'}
                    className={cn(
                      'h-28 flex-col gap-3 p-5 text-left relative overflow-hidden',
                      `bg-gradient-to-br ${sound.color}`,
                      selectedSound === sound.id &&
                        'border-primary shadow-[0_0_20px_rgba(14,165,233,0.3)]'
                    )}
                    onClick={() => setSelectedSound(sound.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-lg">{sound.name}</div>
                        <div className="text-xs opacity-75 capitalize">{sound.type}</div>
                        <p className="text-xs opacity-60 mt-1">{sound.description}</p>
                      </div>
                      <span className="text-3xl">{sound.icon}</span>
                    </div>
                    <div className="absolute bottom-3 right-3 flex items-center gap-1">
                      {favorites.includes(sound.id) && (
                        <Heart className="h-4 w-4 text-red-400 fill-current" />
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                Dual-Channel Mixer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="volume">Master Volume</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMuted(!isMuted)}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 p-4 rounded-lg bg-muted/30">
                  <Label>Channel A</Label>
                  <div className="text-sm font-medium">
                    {currentSound?.name || 'Select a sound'}
                  </div>
                  <Slider
                    value={[volume * 100]}
                    onValueChange={([v]) => setVolume(v / 100)}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
                <div className="space-y-2 p-4 rounded-lg bg-muted/30">
                  <Label>Channel B</Label>
                  <div className="text-sm text-muted-foreground">Add secondary sound</div>
                  <Slider
                    value={[0]}
                    onValueChange={() => {}}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button onClick={togglePlay} className="gap-2 flex-1">
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isPlaying ? 'Playing' : 'Play'}
                </Button>
                <Button variant="outline" onClick={() => setSelectedSound('rain')}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-400" />
                Favorites
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {favorites.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Click the heart on any sound to favorite it
                  </p>
                ) : (
                  favorites.map((id) => {
                    const sound = SOUNDSCAPES.find((s) => s.id === id);
                    return sound ? (
                      <Button
                        key={id}
                        variant="outline"
                        className="w-full justify-start gap-3"
                        onClick={() => setSelectedSound(id)}
                      >
                        <span className="text-xl">{sound.icon}</span>
                        <div className="flex-1 text-left">
                          <div className="font-medium">{sound.name}</div>
                          <div className="text-xs text-muted-foreground">{sound.type}</div>
                        </div>
                        <Heart
                          className="h-4 w-4 text-red-400 fill-current"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(id);
                          }}
                        />
                      </Button>
                    ) : null;
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Custom Mixes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4">
                Save your favorite dual-channel combinations
              </p>
              <Button variant="outline" className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Save Current Mix
              </Button>
              {customMixes.length > 0 && (
                <div className="space-y-2 mt-4">
                  {customMixes.map((mix) => (
                    <Button key={mix.id} variant="outline" className="w-full justify-start">
                      {mix.name}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                Sleep Timer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {[
                { label: '15 min', minutes: 15 },
                { label: '30 min', minutes: 30 },
                { label: '45 min', minutes: 45 },
                { label: '60 min', minutes: 60 },
              ].map(({ label, minutes }) => (
                <Button key={minutes} variant="outline" className="w-full justify-between">
                  <span>Fade out in {label}</span>
                  <span className="text-xs text-muted-foreground">Timer</span>
                </Button>
              ))}
              <Button variant="outline" className="w-full justify-between text-destructive">
                <span>Cancel timer</span>
                <span className="text-xs text-muted-foreground">Clear</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
