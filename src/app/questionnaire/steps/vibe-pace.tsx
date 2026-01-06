'use client';

import { useState } from 'react';
import { StepContainer } from '@/components/questionnaire/step-container';
import { SelectableCard } from '@/components/questionnaire/selectable-card';
import { useQuestionnaireStore } from '@/lib/questionnaire/store';
import { TripPace, ScheduleTolerance, EnergyPattern } from '@/types/trip-dna';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Turtle, Scale, Zap, Shuffle, Calendar, Clock, Sun, Moon, RotateCcw,
  Mountain, UtensilsCrossed, Camera, Music, ShoppingBag, Palette, Building2,
  Landmark, Sparkles, Heart, TreePine, PartyPopper, Waves, Theater, X, Plus
} from 'lucide-react';

// Vibe options - MULTI-SELECT
const VIBE_OPTIONS = [
  { id: 'adventure', label: 'Adventure', icon: Mountain, color: 'text-orange-500' },
  { id: 'foodie', label: 'Foodie', icon: UtensilsCrossed, color: 'text-red-500' },
  { id: 'culture', label: 'Culture', icon: Landmark, color: 'text-purple-500' },
  { id: 'relaxation', label: 'Relaxation', icon: Waves, color: 'text-blue-400' },
  { id: 'photography', label: 'Photography', icon: Camera, color: 'text-pink-500' },
  { id: 'nightlife', label: 'Nightlife', icon: PartyPopper, color: 'text-violet-500' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: 'text-emerald-500' },
  { id: 'art', label: 'Art', icon: Palette, color: 'text-rose-500' },
  { id: 'nature', label: 'Nature', icon: TreePine, color: 'text-green-600' },
  { id: 'music', label: 'Music', icon: Music, color: 'text-indigo-500' },
  { id: 'architecture', label: 'Architecture', icon: Building2, color: 'text-slate-600' },
  { id: 'romance', label: 'Romance', icon: Heart, color: 'text-pink-400' },
  { id: 'wellness', label: 'Wellness', icon: Sparkles, color: 'text-teal-500' },
  { id: 'theater', label: 'Theater', icon: Theater, color: 'text-amber-600' },
];

const PACE_OPTIONS: { value: TripPace; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'relaxed',
    label: 'Relaxed',
    description: '1-2 activities per day. Plenty of downtime.',
    icon: <Turtle className="w-6 h-6" />,
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: '2-4 activities per day. Mix of go and slow.',
    icon: <Scale className="w-6 h-6" />,
  },
  {
    value: 'fast',
    label: 'Fast',
    description: 'See it all. Pack in as much as possible.',
    icon: <Zap className="w-6 h-6" />,
  },
];

const SCHEDULE_OPTIONS: { value: ScheduleTolerance; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'flexible',
    label: 'Hate schedules',
    description: 'Just give me ideas. I\'ll figure it out.',
    icon: <Shuffle className="w-6 h-6" />,
  },
  {
    value: 'some-structure',
    label: 'Some structure',
    description: 'Anchors for each day, but room to wander.',
    icon: <Calendar className="w-6 h-6" />,
  },
  {
    value: 'fully-planned',
    label: 'Fully planned',
    description: 'Optimized days. Know exactly what\'s happening.',
    icon: <Clock className="w-6 h-6" />,
  },
];

const ENERGY_OPTIONS: { value: EnergyPattern; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'morning',
    label: 'Morning person',
    description: 'Up early, done by afternoon.',
    icon: <Sun className="w-6 h-6" />,
  },
  {
    value: 'evening',
    label: 'Night owl',
    description: 'Slow mornings, alive at night.',
    icon: <Moon className="w-6 h-6" />,
  },
  {
    value: 'flexible',
    label: 'Flexible',
    description: 'Depends on the day.',
    icon: <RotateCcw className="w-6 h-6" />,
  },
];

export function VibePaceStep() {
  const { tripDna, updateVibeAndPace } = useQuestionnaireStore();
  const { tripPace, scheduleTolerance, energyPattern } = tripDna.vibeAndPace;

  // Local state for vibes and custom interests
  const [selectedVibes, setSelectedVibes] = useState<string[]>(
    (tripDna.vibeAndPace as { vibes?: string[] }).vibes || []
  );
  const [customInterests, setCustomInterests] = useState<string[]>(
    (tripDna.vibeAndPace as { customInterests?: string[] }).customInterests || []
  );
  const [newInterest, setNewInterest] = useState('');

  const toggleVibe = (vibeId: string) => {
    const updated = selectedVibes.includes(vibeId)
      ? selectedVibes.filter(v => v !== vibeId)
      : [...selectedVibes, vibeId];
    setSelectedVibes(updated);
    updateVibeAndPace({ vibes: updated } as never);
  };

  const addCustomInterest = () => {
    if (newInterest.trim() && !customInterests.includes(newInterest.trim())) {
      const updated = [...customInterests, newInterest.trim()];
      setCustomInterests(updated);
      updateVibeAndPace({ customInterests: updated } as never);
      setNewInterest('');
    }
  };

  const removeCustomInterest = (interest: string) => {
    const updated = customInterests.filter(i => i !== interest);
    setCustomInterests(updated);
    updateVibeAndPace({ customInterests: updated } as never);
  };

  return (
    <StepContainer
      title="What's your travel vibe?"
      description="Select all that excite you. The more we know, the better your trip."
    >
      {/* Vibe Multi-Select */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pick your vibes</h2>
          <span className="text-sm text-muted-foreground">
            {selectedVibes.length} selected
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {VIBE_OPTIONS.map((vibe) => {
            const Icon = vibe.icon;
            const isSelected = selectedVibes.includes(vibe.id);
            return (
              <button
                key={vibe.id}
                onClick={() => toggleVibe(vibe.id)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-200
                  flex flex-col items-center gap-2 text-center
                  ${isSelected
                    ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                    : 'border-border hover:border-primary/30 hover:bg-muted/50'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <Icon className={`w-7 h-7 ${isSelected ? vibe.color : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {vibe.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Interests */}
      <div className="space-y-3 mt-8">
        <h2 className="text-lg font-semibold">Anything else?</h2>
        <p className="text-sm text-muted-foreground">
          Add specific interests that didn't fit above
        </p>

        {/* Custom interest tags */}
        {customInterests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customInterests.map((interest) => (
              <span
                key={interest}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
              >
                {interest}
                <button
                  onClick={() => removeCustomInterest(interest)}
                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add new interest */}
        <div className="flex gap-2">
          <Input
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomInterest()}
            placeholder="e.g., street art, local markets, live jazz..."
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addCustomInterest}
            disabled={!newInterest.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Trip Pace */}
      <div className="space-y-3 mt-8">
        <h2 className="text-lg font-semibold">Trip Pace</h2>
        <div className="space-y-3">
          {PACE_OPTIONS.map((option) => (
            <SelectableCard
              key={option.value}
              selected={tripPace === option.value}
              onSelect={() => updateVibeAndPace({ tripPace: option.value })}
              icon={option.icon}
              label={option.label}
              description={option.description}
            />
          ))}
        </div>
      </div>

      {/* Schedule Tolerance */}
      <div className="space-y-3 mt-8">
        <h2 className="text-lg font-semibold">Schedule Style</h2>
        <div className="space-y-3">
          {SCHEDULE_OPTIONS.map((option) => (
            <SelectableCard
              key={option.value}
              selected={scheduleTolerance === option.value}
              onSelect={() => updateVibeAndPace({ scheduleTolerance: option.value })}
              icon={option.icon}
              label={option.label}
              description={option.description}
            />
          ))}
        </div>
      </div>

      {/* Energy Pattern */}
      <div className="space-y-3 mt-8">
        <h2 className="text-lg font-semibold">Energy Pattern</h2>
        <div className="grid grid-cols-3 gap-3">
          {ENERGY_OPTIONS.map((option) => (
            <SelectableCard
              key={option.value}
              selected={energyPattern === option.value}
              onSelect={() => updateVibeAndPace({ energyPattern: option.value })}
              icon={option.icon}
              label={option.label}
            />
          ))}
        </div>
      </div>
    </StepContainer>
  );
}
