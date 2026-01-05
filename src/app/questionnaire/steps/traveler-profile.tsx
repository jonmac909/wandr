'use client';

import { StepContainer } from '@/components/questionnaire/step-container';
import { SelectableCard, RankedSelectableCard } from '@/components/questionnaire/selectable-card';
import { useQuestionnaireStore } from '@/lib/questionnaire/store';
import { PartyType, TravelIdentity } from '@/types/trip-dna';
import { Users, User, Heart, UserPlus } from 'lucide-react';

const PARTY_OPTIONS: { value: PartyType; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'solo', label: 'Solo', description: 'Just me', icon: <User className="w-6 h-6" /> },
  { value: 'couple', label: 'Couple', description: 'Traveling with partner', icon: <Heart className="w-6 h-6" /> },
  { value: 'family', label: 'Family', description: 'With kids or extended family', icon: <Users className="w-6 h-6" /> },
  { value: 'friends', label: 'Friends', description: 'Group trip', icon: <UserPlus className="w-6 h-6" /> },
];

const TRAVEL_IDENTITIES: { value: TravelIdentity; label: string; emoji: string }[] = [
  { value: 'history', label: 'History & Culture', emoji: '🏛️' },
  { value: 'food', label: 'Food', emoji: '🍜' },
  { value: 'nature', label: 'Nature', emoji: '🌿' },
  { value: 'relaxation', label: 'Relaxation', emoji: '🧘' },
  { value: 'adventure', label: 'Adventure', emoji: '🏔️' },
  { value: 'theme-parks', label: 'Theme Parks', emoji: '🎢' },
  { value: 'workshops', label: 'Workshops & Learning', emoji: '🎨' },
  { value: 'music', label: 'Music & Nightlife', emoji: '🎵' },
  { value: 'photography', label: 'Photography', emoji: '📸' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { value: 'art', label: 'Art & Museums', emoji: '🖼️' },
  { value: 'architecture', label: 'Architecture', emoji: '🏗️' },
  { value: 'local-culture', label: 'Local Culture', emoji: '🎭' },
];

const MAX_IDENTITIES = 5;

export function TravelerProfileStep() {
  const { tripDna, updateTravelerProfile } = useQuestionnaireStore();
  const { partyType, travelIdentities } = tripDna.travelerProfile;

  const toggleIdentity = (identity: TravelIdentity) => {
    const current = travelIdentities || [];
    if (current.includes(identity)) {
      // Remove it
      updateTravelerProfile({
        travelIdentities: current.filter((i) => i !== identity),
      });
    } else if (current.length < MAX_IDENTITIES) {
      // Add it (appends to end, so rank = position in array)
      updateTravelerProfile({
        travelIdentities: [...current, identity],
      });
    }
  };

  const canProceed = partyType && travelIdentities.length >= 1;

  return (
    <StepContainer
      title="Who's traveling?"
      description="Tell us about your travel party and what you love to experience."
      canProceed={canProceed}
    >
      {/* Party Type Selection */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Travel Party</h2>
        <div className="grid grid-cols-2 gap-3">
          {PARTY_OPTIONS.map((option) => (
            <SelectableCard
              key={option.value}
              selected={partyType === option.value}
              onSelect={() => updateTravelerProfile({ partyType: option.value })}
              icon={option.icon}
              label={option.label}
              description={option.description}
            />
          ))}
        </div>
      </div>

      {/* Travel Identities */}
      <div className="space-y-3 mt-8">
        <div className="flex justify-between items-baseline">
          <h2 className="text-lg font-semibold">What do you love? (pick up to {MAX_IDENTITIES})</h2>
          <span className="text-sm text-muted-foreground">
            {travelIdentities.length}/{MAX_IDENTITIES} selected
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Select in order of priority. First pick = most important.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {TRAVEL_IDENTITIES.map((identity) => {
            const isSelected = travelIdentities.includes(identity.value);
            const rank = isSelected ? travelIdentities.indexOf(identity.value) + 1 : undefined;

            return (
              <RankedSelectableCard
                key={identity.value}
                selected={isSelected}
                rank={rank}
                onSelect={() => toggleIdentity(identity.value)}
                icon={<span>{identity.emoji}</span>}
                label={identity.label}
                maxSelections={MAX_IDENTITIES}
                currentSelections={travelIdentities.length}
              />
            );
          })}
        </div>
      </div>

      {/* Validation feedback */}
      {travelIdentities.length === 0 && (
        <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
          Please select at least one travel interest to continue.
        </p>
      )}
    </StepContainer>
  );
}
