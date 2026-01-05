'use client';

import { useQuestionnaireStore, QUESTIONNAIRE_STEPS } from '@/lib/questionnaire/store';
import { TravelerProfileStep } from './steps/traveler-profile';
import { VibePaceStep } from './steps/vibe-pace';
import { ConstraintsStep } from './steps/constraints';
import { InterestsStep } from './steps/interests';
import { LogisticsStep } from './steps/logistics';
import { ReviewStep } from './steps/review';

export default function QuestionnairePage() {
  const currentStep = useQuestionnaireStore((s) => s.currentStep);
  const stepId = QUESTIONNAIRE_STEPS[currentStep]?.id;

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
