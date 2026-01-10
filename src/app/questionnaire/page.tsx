'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuestionnaireStore, QUESTIONNAIRE_STEPS } from '@/lib/questionnaire/store';
import { TravelerProfileStep } from './steps/traveler-profile';
import { VibePaceStep } from './steps/vibe-pace';
import { ConstraintsStep } from './steps/constraints';
import { InterestsStep } from './steps/interests';
import { LogisticsStep } from './steps/logistics';
import { ReviewStep } from './steps/review';
import { tripDb } from '@/lib/db/indexed-db';

function QuestionnaireContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editTripId = searchParams.get('edit');
  const [isLoading, setIsLoading] = useState(!!editTripId);

  const currentStep = useQuestionnaireStore((s) => s.currentStep);
  const setTripDna = useQuestionnaireStore((s) => s.setTripDna);
  const setEditingTripId = useQuestionnaireStore((s) => s.setEditingTripId);
  const stepId = QUESTIONNAIRE_STEPS[currentStep]?.id;

  // Load existing trip data when editing
  useEffect(() => {
    async function loadTripForEdit() {
      if (!editTripId) return;

      try {
        const trip = await tripDb.get(editTripId);
        if (trip?.tripDna) {
          // Populate the store with existing trip data
          setTripDna(trip.tripDna);
          setEditingTripId(editTripId);
        }
      } catch (error) {
        console.error('Failed to load trip for editing:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadTripForEdit();
  }, [editTripId, setTripDna, setEditingTripId]);

  // Back/close handler for edit mode
  const handleClose = () => {
    if (editTripId) {
      router.push(`/trip/${editTripId}`);
    } else {
      router.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading trip...</p>
        </div>
      </div>
    );
  }

  // Route to correct step component
  switch (stepId) {
    case 'traveler':
      return <TravelerProfileStep />;
    case 'vibe':
      return <VibePaceStep />;
    case 'constraints':
      return <ConstraintsStep />;
    case 'interests':
      return <InterestsStep />;
    case 'logistics':
      return <LogisticsStep />;
    case 'review':
      return <ReviewStep />;
    default:
      return <TravelerProfileStep />;
  }
}

export default function QuestionnairePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <QuestionnaireContent />
    </Suspense>
  );
}
