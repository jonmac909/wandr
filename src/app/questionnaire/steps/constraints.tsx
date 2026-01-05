'use client';

import { StepContainer } from '@/components/questionnaire/step-container';
import { SelectableCard } from '@/components/questionnaire/selectable-card';
import { useQuestionnaireStore } from '@/lib/questionnaire/store';
import { DateFlexibility, AccommodationStyle, AccommodationPriority } from '@/types/trip-dna';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { CalendarDays, CalendarRange, Calendar, Crown, Building2, Home, Wallet, MapPin, Sofa, DollarSign } from 'lucide-react';

const DATE_OPTIONS: { value: DateFlexibility; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'fixed',
    label: 'Fixed dates',
    description: 'I know exactly when I\'m traveling.',
    icon: <CalendarDays className="w-6 h-6" />,
  },
  {
    value: 'flexible',
    label: 'Flexible',
    description: 'I have target dates but can shift a bit.',
    icon: <CalendarRange className="w-6 h-6" />,
  },
  {
    value: 'fully-flexible',
    label: 'Wide open',
    description: 'Help me find the best time to go.',
    icon: <Calendar className="w-6 h-6" />,
  },
];

const ACCOMMODATION_STYLE_OPTIONS: { value: AccommodationStyle; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'luxury',
    label: 'Luxury',
    description: 'Five-star experiences, resorts, exceptional service.',
    icon: <Crown className="w-6 h-6" />,
  },
  {
    value: 'boutique',
    label: 'Boutique',
    description: 'Unique, stylish, character properties.',
    icon: <Building2 className="w-6 h-6" />,
  },
  {
    value: 'practical',
    label: 'Practical',
    description: 'Clean, comfortable, good value mid-range.',
    icon: <Home className="w-6 h-6" />,
  },
  {
    value: 'budget',
    label: 'Budget',
    description: 'Hostels, basic stays, save for experiences.',
    icon: <Wallet className="w-6 h-6" />,
  },
];

const ACCOMMODATION_PRIORITY_OPTIONS: { value: AccommodationPriority; label: string; icon: React.ReactNode }[] = [
  { value: 'location', label: 'Location', icon: <MapPin className="w-5 h-5" /> },
  { value: 'comfort', label: 'Comfort', icon: <Sofa className="w-5 h-5" /> },
  { value: 'value', label: 'Value', icon: <DollarSign className="w-5 h-5" /> },
];

export function ConstraintsStep() {
  const { tripDna, updateConstraints } = useQuestionnaireStore();
  const { dates, budget, accommodation } = tripDna.constraints;

  const updateDates = (data: Partial<typeof dates>) => {
    updateConstraints({ dates: { ...dates, ...data } });
  };

  const updateBudget = (data: Partial<typeof budget>) => {
    updateConstraints({ budget: { ...budget, ...data } });
  };

  const updateAccommodation = (data: Partial<typeof accommodation>) => {
    updateConstraints({ accommodation: { ...accommodation, ...data } });
  };

  return (
    <StepContainer
      title="Reality check"
      description="Dates, budget, and where you'll sleep. The practical stuff."
    >
      {/* Date Flexibility */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">When are you traveling?</h2>
        <div className="space-y-3">
          {DATE_OPTIONS.map((option) => (
            <SelectableCard
              key={option.value}
              selected={dates.type === option.value}
              onSelect={() => updateDates({ type: option.value })}
              icon={option.icon}
              label={option.label}
              description={option.description}
            />
          ))}
        </div>

        {/* Date inputs for fixed/flexible */}
        {dates.type !== 'fully-flexible' && (
          <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                type="date"
                value={dates.startDate || ''}
                onChange={(e) => updateDates({ startDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="endDate">End date</Label>
              <Input
                id="endDate"
                type="date"
                value={dates.endDate || ''}
                onChange={(e) => updateDates({ endDate: e.target.value })}
                className="mt-1"
              />
            </div>
            {dates.type === 'flexible' && (
              <div className="col-span-2">
                <Label>Flexibility: ± {dates.flexibility || 3} days</Label>
                <Slider
                  value={[dates.flexibility || 3]}
                  onValueChange={([v]) => updateDates({ flexibility: v })}
                  min={1}
                  max={14}
                  step={1}
                  className="mt-2"
                />
              </div>
            )}
          </div>
        )}

        {dates.type === 'fully-flexible' && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <Label htmlFor="totalDays">Approximate trip length (days)</Label>
            <Input
              id="totalDays"
              type="number"
              min={1}
              max={365}
              value={dates.totalDays || ''}
              onChange={(e) => updateDates({ totalDays: parseInt(e.target.value) || undefined })}
              placeholder="e.g., 14"
              className="mt-1 w-32"
            />
          </div>
        )}
      </div>

      {/* Budget */}
      <div className="space-y-4 mt-8">
        <h2 className="text-lg font-semibold">Budget</h2>

        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
          <div>
            <Label>Accommodation per night: ${budget.accommodationRange.min} - ${budget.accommodationRange.max}</Label>
            <Slider
              value={[budget.accommodationRange.min, budget.accommodationRange.max]}
              onValueChange={([min, max]) => updateBudget({
                accommodationRange: { ...budget.accommodationRange, min, max }
              })}
              min={25}
              max={500}
              step={25}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Daily spend (food, activities): ${budget.dailySpend.min} - ${budget.dailySpend.max}</Label>
            <Slider
              value={[budget.dailySpend.min, budget.dailySpend.max]}
              onValueChange={([min, max]) => updateBudget({
                dailySpend: { min, max }
              })}
              min={25}
              max={500}
              step={25}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Splurge moments: {budget.splurgeMoments} (0 = never, 5 = often)</Label>
            <Slider
              value={[budget.splurgeMoments]}
              onValueChange={([v]) => updateBudget({ splurgeMoments: v })}
              min={0}
              max={5}
              step={1}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {budget.splurgeMoments === 0 && 'Sticking to budget strictly'}
              {budget.splurgeMoments === 1 && 'Maybe one special meal or experience'}
              {budget.splurgeMoments === 2 && 'A couple of treat-yourself moments'}
              {budget.splurgeMoments === 3 && 'Regular splurges when it\'s worth it'}
              {budget.splurgeMoments === 4 && 'Frequent upgrades and special experiences'}
              {budget.splurgeMoments === 5 && 'Go big when the opportunity is right'}
            </p>
          </div>
        </div>
      </div>

      {/* Accommodation Style */}
      <div className="space-y-3 mt-8">
        <h2 className="text-lg font-semibold">Accommodation style</h2>
        <div className="grid grid-cols-2 gap-3">
          {ACCOMMODATION_STYLE_OPTIONS.map((option) => (
            <SelectableCard
              key={option.value}
              selected={accommodation.style === option.value}
              onSelect={() => updateAccommodation({ style: option.value })}
              icon={option.icon}
              label={option.label}
              description={option.description}
            />
          ))}
        </div>
      </div>

      {/* Accommodation Priority */}
      <div className="space-y-3 mt-6">
        <h2 className="text-lg font-semibold">What matters most?</h2>
        <div className="grid grid-cols-3 gap-3">
          {ACCOMMODATION_PRIORITY_OPTIONS.map((option) => (
            <SelectableCard
              key={option.value}
              selected={accommodation.priority === option.value}
              onSelect={() => updateAccommodation({ priority: option.value })}
              icon={option.icon}
              label={option.label}
            />
          ))}
        </div>
      </div>
    </StepContainer>
  );
}
