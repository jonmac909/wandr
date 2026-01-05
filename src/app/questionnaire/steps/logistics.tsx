'use client';

import { StepContainer } from '@/components/questionnaire/step-container';
import { SelectableCard, RankedSelectableCard } from '@/components/questionnaire/selectable-card';
import { useQuestionnaireStore } from '@/lib/questionnaire/store';
import { MovementTolerance, TransportType } from '@/types/trip-dna';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Anchor, ArrowLeftRight, Shuffle, Train, Plane, Car, Bike, Ship, Bus, Footprints } from 'lucide-react';

const MOVEMENT_OPTIONS: { value: MovementTolerance; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'minimal',
    label: 'Hate moving',
    description: 'One base, day trips. Unpack once.',
    icon: <Anchor className="w-6 h-6" />,
  },
  {
    value: 'moderate',
    label: '2-3 bases',
    description: 'A few moves is fine. Not every day.',
    icon: <ArrowLeftRight className="w-6 h-6" />,
  },
  {
    value: 'flexible',
    label: 'Flexible',
    description: 'Move as needed. I travel light.',
    icon: <Shuffle className="w-6 h-6" />,
  },
];

const TRANSPORT_OPTIONS: { value: TransportType; label: string; emoji: string; icon: React.ReactNode }[] = [
  { value: 'train', label: 'Train', emoji: '🚆', icon: <Train className="w-5 h-5" /> },
  { value: 'flight', label: 'Flight', emoji: '✈️', icon: <Plane className="w-5 h-5" /> },
  { value: 'car', label: 'Car / Taxi', emoji: '🚗', icon: <Car className="w-5 h-5" /> },
  { value: 'scooter', label: 'Scooter', emoji: '🛵', icon: <Bike className="w-5 h-5" /> },
  { value: 'ferry', label: 'Ferry / Boat', emoji: '⛴️', icon: <Ship className="w-5 h-5" /> },
  { value: 'bus', label: 'Bus', emoji: '🚌', icon: <Bus className="w-5 h-5" /> },
  { value: 'walking', label: 'Walking', emoji: '🚶', icon: <Footprints className="w-5 h-5" /> },
];

export function LogisticsStep() {
  const { tripDna, updateLogistics } = useQuestionnaireStore();
  const { movementTolerance, preferredBases, transport, mobilityConstraints } = tripDna.logistics;

  const toggleComfortableTransport = (type: TransportType) => {
    const current = transport.comfortable || [];
    if (current.includes(type)) {
      updateLogistics({
        transport: {
          ...transport,
          comfortable: current.filter((t) => t !== type),
        },
      });
    } else {
      updateLogistics({
        transport: {
          ...transport,
          comfortable: [...current, type],
        },
      });
    }
  };

  const toggleAvoidTransport = (type: TransportType) => {
    const current = transport.avoid || [];
    if (current.includes(type)) {
      updateLogistics({
        transport: {
          ...transport,
          avoid: current.filter((t) => t !== type),
        },
      });
    } else {
      // Remove from comfortable if adding to avoid
      updateLogistics({
        transport: {
          comfortable: transport.comfortable.filter((t) => t !== type),
          avoid: [...current, type],
        },
      });
    }
  };

  return (
    <StepContainer
      title="How do you move?"
      description="Movement tolerance and transport preferences."
    >
      {/* Movement Tolerance */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">How often do you want to move hotels?</h2>
        <div className="space-y-3">
          {MOVEMENT_OPTIONS.map((option) => (
            <SelectableCard
              key={option.value}
              selected={movementTolerance === option.value}
              onSelect={() => updateLogistics({ movementTolerance: option.value })}
              icon={option.icon}
              label={option.label}
              description={option.description}
            />
          ))}
        </div>
      </div>

      {/* Preferred Bases */}
      {movementTolerance !== 'minimal' && (
        <div className="space-y-3 mt-6 p-4 bg-muted/50 rounded-lg">
          <Label>Preferred number of bases: {preferredBases}</Label>
          <Slider
            value={[preferredBases]}
            onValueChange={([v]) => updateLogistics({ preferredBases: v })}
            min={1}
            max={movementTolerance === 'flexible' ? 7 : 4}
            step={1}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground">
            {preferredBases === 1 && 'Single base with day trips'}
            {preferredBases === 2 && 'Two main bases, split the trip'}
            {preferredBases === 3 && 'Three bases, good balance'}
            {preferredBases >= 4 && `${preferredBases} bases, more variety`}
          </p>
        </div>
      )}

      {/* Transport Preferences */}
      <div className="space-y-3 mt-8">
        <h2 className="text-lg font-semibold">Transport you&apos;re comfortable with</h2>
        <p className="text-sm text-muted-foreground">Select all that apply</p>
        <div className="grid grid-cols-2 gap-3">
          {TRANSPORT_OPTIONS.map((option) => {
            const isComfortable = transport.comfortable.includes(option.value);
            const isAvoided = transport.avoid.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleComfortableTransport(option.value)}
                className={`
                  w-full text-left p-3 rounded-lg border-2 transition-all
                  flex items-center gap-3
                  ${isComfortable
                    ? 'border-primary bg-primary/5'
                    : isAvoided
                      ? 'border-destructive/30 bg-destructive/5 opacity-50'
                      : 'border-muted bg-card hover:bg-accent/50'
                  }
                `}
              >
                <span className="text-xl">{option.emoji}</span>
                <span className={isComfortable ? 'text-primary font-medium' : ''}>
                  {option.label}
                </span>
                {isComfortable && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Transport to Avoid */}
      <div className="space-y-3 mt-6">
        <h2 className="text-lg font-semibold">Any transport to avoid?</h2>
        <p className="text-sm text-muted-foreground">Select any you want to skip</p>
        <div className="flex flex-wrap gap-2">
          {TRANSPORT_OPTIONS.map((option) => {
            const isAvoided = transport.avoid.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleAvoidTransport(option.value)}
                className={`
                  px-3 py-1.5 rounded-full text-sm transition-all
                  ${isAvoided
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-muted hover:bg-muted/80'
                  }
                `}
              >
                {option.emoji} {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobility Constraints */}
      <div className="space-y-3 mt-8">
        <h2 className="text-lg font-semibold">Any mobility considerations?</h2>
        <Input
          placeholder="e.g., need elevator access, limited stairs, wheelchair accessible"
          value={mobilityConstraints || ''}
          onChange={(e) => updateLogistics({ mobilityConstraints: e.target.value || undefined })}
        />
      </div>
    </StepContainer>
  );
}
