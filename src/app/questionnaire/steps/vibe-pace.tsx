'use client';

import { StepContainer } from '@/components/questionnaire/step-container';
import { SelectableCard } from '@/components/questionnaire/selectable-card';
import { useQuestionnaireStore } from '@/lib/questionnaire/store';
import { TripPace, ScheduleTolerance, EnergyPattern } from '@/types/trip-dna';
import { Turtle, Scale, Zap, Shuffle, Calendar, Clock, Sun, Moon, RotateCcw } from 'lucide-react';

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

  return (
    <StepContainer
      title="How do you travel?"
      description="Your vibe shapes everything. No wrong answers."
    >
      {/* Trip Pace */}
      <div className="space-y-3">
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
