'use client';

import { StepContainer } from '@/components/questionnaire/step-container';
import { SelectableCard, RankedSelectableCard } from '@/components/questionnaire/selectable-card';
import { useQuestionnaireStore } from '@/lib/questionnaire/store';
import { DepthPreference, FoodImportance, Hobby } from '@/types/trip-dna';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Layers, Maximize, Coffee, Utensils, ChefHat, CalendarCheck } from 'lucide-react';

const DEPTH_OPTIONS: { value: DepthPreference; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'highlights',
    label: 'Highlights only',
    description: 'Hit the must-sees, move on. Cover more ground.',
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    value: 'depth-fewer',
    label: 'Depth over breadth',
    description: 'Fewer places, but really experience them.',
    icon: <Layers className="w-6 h-6" />,
  },
  {
    value: 'everything',
    label: 'Everything',
    description: 'I want it all. Will make the time.',
    icon: <Maximize className="w-6 h-6" />,
  },
];

const FOOD_OPTIONS: { value: FoodImportance; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'fuel',
    label: 'Just fuel',
    description: 'Food is sustenance. Get me back to exploring.',
    icon: <Coffee className="w-6 h-6" />,
  },
  {
    value: 'local-spots',
    label: 'Good local spots',
    description: 'Point me to what the locals eat.',
    icon: <Utensils className="w-6 h-6" />,
  },
  {
    value: 'food-focused',
    label: 'Food-focused',
    description: 'Food IS the trip. Build around meals.',
    icon: <ChefHat className="w-6 h-6" />,
  },
  {
    value: 'reservations-planned',
    label: 'Reservations planned',
    description: 'I book ahead. Help me find the best.',
    icon: <CalendarCheck className="w-6 h-6" />,
  },
];

const HOBBY_OPTIONS: { value: Hobby; label: string; emoji: string }[] = [
  { value: 'photography', label: 'Photography', emoji: '📸' },
  { value: 'hiking', label: 'Hiking', emoji: '🥾' },
  { value: 'cooking', label: 'Cooking classes', emoji: '👨‍🍳' },
  { value: 'yoga', label: 'Yoga / Wellness', emoji: '🧘' },
  { value: 'diving', label: 'Diving / Snorkeling', emoji: '🤿' },
  { value: 'painting', label: 'Art / Painting', emoji: '🎨' },
  { value: 'music', label: 'Live music', emoji: '🎵' },
  { value: 'fitness', label: 'Fitness / Running', emoji: '🏃' },
  { value: 'wine-tasting', label: 'Wine / Spirits', emoji: '🍷' },
  { value: 'crafts', label: 'Crafts / Workshops', emoji: '🪡' },
  { value: 'meditation', label: 'Meditation', emoji: '🧠' },
  { value: 'writing', label: 'Writing / Journaling', emoji: '✍️' },
];

const MAX_HOBBIES = 5;

export function InterestsStep() {
  const { tripDna, updateInterests } = useQuestionnaireStore();
  const { depthPreference, food, hobbies, destination, destinations } = tripDna.interests;

  const updateFood = (data: Partial<typeof food>) => {
    updateInterests({ food: { ...food, ...data } });
  };

  const toggleHobby = (hobby: Hobby) => {
    const current = hobbies || [];
    if (current.includes(hobby)) {
      updateInterests({ hobbies: current.filter((h) => h !== hobby) });
    } else if (current.length < MAX_HOBBIES) {
      updateInterests({ hobbies: [...current, hobby] });
    }
  };

  return (
    <StepContainer
      title="What matters to you?"
      description="Depth, food, and hobbies that should shape your trip."
    >
      {/* Destination (optional) */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Where are you going?</h2>
        <p className="text-sm text-muted-foreground">Leave blank if you want AI suggestions</p>
        <Input
          placeholder="e.g., Japan, Thailand, or leave blank"
          value={destination || ''}
          onChange={(e) => updateInterests({ destination: e.target.value || undefined })}
        />
        {destination && (
          <div className="mt-2">
            <Label className="text-sm">Multiple destinations? (comma-separated)</Label>
            <Input
              placeholder="e.g., Thailand, Vietnam, Japan"
              value={destinations?.join(', ') || destination}
              onChange={(e) => {
                const dests = e.target.value.split(',').map(d => d.trim()).filter(Boolean);
                updateInterests({
                  destinations: dests.length > 1 ? dests : undefined,
                  destination: dests[0] || undefined
                });
              }}
              className="mt-1"
            />
          </div>
        )}
      </div>

      {/* Depth Preference */}
      <div className="space-y-3 mt-8">
        <h2 className="text-lg font-semibold">How deep do you want to go?</h2>
        <div className="space-y-3">
          {DEPTH_OPTIONS.map((option) => (
            <SelectableCard
              key={option.value}
              selected={depthPreference === option.value}
              onSelect={() => updateInterests({ depthPreference: option.value })}
              icon={option.icon}
              label={option.label}
              description={option.description}
            />
          ))}
        </div>
      </div>

      {/* Food Importance */}
      <div className="space-y-3 mt-8">
        <h2 className="text-lg font-semibold">How important is food?</h2>
        <div className="grid grid-cols-2 gap-3">
          {FOOD_OPTIONS.map((option) => (
            <SelectableCard
              key={option.value}
              selected={food.importance === option.value}
              onSelect={() => updateFood({ importance: option.value })}
              icon={option.icon}
              label={option.label}
              description={option.description}
            />
          ))}
        </div>
      </div>

      {/* Dietary Restrictions */}
      {food.importance !== 'fuel' && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <Label>Any dietary restrictions?</Label>
          <Input
            placeholder="e.g., vegetarian, gluten-free, allergies"
            value={food.dietaryRestrictions?.join(', ') || ''}
            onChange={(e) => {
              const restrictions = e.target.value.split(',').map(r => r.trim()).filter(Boolean);
              updateFood({ dietaryRestrictions: restrictions.length ? restrictions : undefined });
            }}
            className="mt-1"
          />
        </div>
      )}

      {/* Hobbies */}
      <div className="space-y-3 mt-8">
        <div className="flex justify-between items-baseline">
          <h2 className="text-lg font-semibold">Hobbies to include?</h2>
          <span className="text-sm text-muted-foreground">
            {hobbies.length}/{MAX_HOBBIES} selected
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          We&apos;ll inject relevant activities and workshops into your trip.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {HOBBY_OPTIONS.map((hobby) => {
            const isSelected = hobbies.includes(hobby.value);
            return (
              <RankedSelectableCard
                key={hobby.value}
                selected={isSelected}
                rank={isSelected ? hobbies.indexOf(hobby.value) + 1 : undefined}
                onSelect={() => toggleHobby(hobby.value)}
                icon={<span>{hobby.emoji}</span>}
                label={hobby.label}
                maxSelections={MAX_HOBBIES}
                currentSelections={hobbies.length}
              />
            );
          })}
        </div>
      </div>
    </StepContainer>
  );
}
