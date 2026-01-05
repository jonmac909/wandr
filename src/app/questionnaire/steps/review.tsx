'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StepContainer } from '@/components/questionnaire/step-container';
import { useQuestionnaireStore } from '@/lib/questionnaire/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users, Zap, Calendar, DollarSign, Utensils, Map, Package,
  ChevronRight, Sparkles, Edit2, CheckCircle2
} from 'lucide-react';

export function ReviewStep() {
  const router = useRouter();
  const { tripDna, setStep, isGenerating, setGenerating } = useQuestionnaireStore();
  const [savedTripId, setSavedTripId] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);

    // Save to localStorage for now (IndexedDB later)
    const tripId = tripDna.id;
    localStorage.setItem(`trip-dna-${tripId}`, JSON.stringify(tripDna));
    setSavedTripId(tripId);

    // Simulate brief delay then redirect
    await new Promise((r) => setTimeout(r, 500));
    setGenerating(false);

    // Navigate to the trip page where Claude Code will generate the itinerary
    router.push(`/trip/${tripId}`);
  };

  const { travelerProfile, vibeAndPace, constraints, interests, logistics } = tripDna;

  return (
    <StepContainer
      title="Review your Trip DNA"
      description="Make sure everything looks right before we generate your itinerary."
      nextLabel="Generate Itinerary"
      onNext={handleGenerate}
      canProceed={!isGenerating}
    >
      {/* Summary Cards */}
      <div className="space-y-4">
        {/* Traveler Profile */}
        <SummaryCard
          icon={<Users className="w-5 h-5" />}
          title="Traveler Profile"
          onEdit={() => setStep(0)}
        >
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Party</span>
              <span className="font-medium capitalize">{travelerProfile.partyType}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Travel identities</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {travelerProfile.travelIdentities.map((id, i) => (
                  <span
                    key={id}
                    className="px-2 py-0.5 bg-primary/10 text-primary rounded text-sm"
                  >
                    #{i + 1} {id.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </SummaryCard>

        {/* Vibe & Pace */}
        <SummaryCard
          icon={<Zap className="w-5 h-5" />}
          title="Vibe & Pace"
          onEdit={() => setStep(1)}
        >
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block">Pace</span>
              <span className="font-medium capitalize">{vibeAndPace.tripPace}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Schedule</span>
              <span className="font-medium capitalize">
                {vibeAndPace.scheduleTolerance.replace('-', ' ')}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Energy</span>
              <span className="font-medium capitalize">{vibeAndPace.energyPattern}</span>
            </div>
          </div>
        </SummaryCard>

        {/* Constraints */}
        <SummaryCard
          icon={<Calendar className="w-5 h-5" />}
          title="Dates & Budget"
          onEdit={() => setStep(2)}
        >
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dates</span>
              <span className="font-medium">
                {constraints.dates.type === 'fixed' && constraints.dates.startDate
                  ? `${constraints.dates.startDate} to ${constraints.dates.endDate}`
                  : constraints.dates.type === 'flexible'
                    ? `~${constraints.dates.startDate} (±${constraints.dates.flexibility} days)`
                    : constraints.dates.totalDays
                      ? `${constraints.dates.totalDays} days, flexible`
                      : 'Fully flexible'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Accommodation</span>
              <span className="font-medium">
                ${constraints.budget.accommodationRange.min}-${constraints.budget.accommodationRange.max}/night
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Daily spend</span>
              <span className="font-medium">
                ${constraints.budget.dailySpend.min}-${constraints.budget.dailySpend.max}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Style</span>
              <span className="font-medium capitalize">
                {constraints.accommodation.style}, {constraints.accommodation.priority} first
              </span>
            </div>
          </div>
        </SummaryCard>

        {/* Interests */}
        <SummaryCard
          icon={<Utensils className="w-5 h-5" />}
          title="Interests"
          onEdit={() => setStep(3)}
        >
          <div className="space-y-2 text-sm">
            {interests.destination && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destination</span>
                <span className="font-medium">
                  {interests.destinations?.length
                    ? interests.destinations.join(' → ')
                    : interests.destination}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Depth</span>
              <span className="font-medium capitalize">
                {interests.depthPreference.replace('-', ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Food</span>
              <span className="font-medium capitalize">
                {interests.food.importance.replace('-', ' ')}
              </span>
            </div>
            {interests.hobbies.length > 0 && (
              <div>
                <span className="text-muted-foreground">Hobbies</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {interests.hobbies.map((hobby) => (
                    <span
                      key={hobby}
                      className="px-2 py-0.5 bg-muted rounded text-sm"
                    >
                      {hobby}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SummaryCard>

        {/* Logistics */}
        <SummaryCard
          icon={<Map className="w-5 h-5" />}
          title="Logistics"
          onEdit={() => setStep(4)}
        >
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Movement</span>
              <span className="font-medium capitalize">
                {logistics.movementTolerance} ({logistics.preferredBases} bases)
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Transport</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {logistics.transport.comfortable.map((t) => (
                  <span key={t} className="px-2 py-0.5 bg-muted rounded text-sm capitalize">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            {logistics.transport.avoid.length > 0 && (
              <div>
                <span className="text-muted-foreground">Avoiding</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {logistics.transport.avoid.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 bg-destructive/10 text-destructive rounded text-sm capitalize"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SummaryCard>
      </div>

      {/* Generate CTA */}
      <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Ready to generate?</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Claude will create your personalized itinerary with route optimization,
              daily time blocks, food recommendations, and packing list.
            </p>
          </div>
        </div>
      </div>

      {savedTripId && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-green-800">Trip DNA saved! Redirecting to generate itinerary...</span>
        </div>
      )}
    </StepContainer>
  );
}

function SummaryCard({
  icon,
  title,
  onEdit,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
