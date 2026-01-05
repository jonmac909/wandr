'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuestionnaireStore, QUESTIONNAIRE_STEPS } from '@/lib/questionnaire/store';

interface StepContainerProps {
  children: ReactNode;
  title: string;
  description?: string;
  canProceed?: boolean;
  onNext?: () => void;
  showBack?: boolean;
  nextLabel?: string;
}

export function StepContainer({
  children,
  title,
  description,
  canProceed = true,
  onNext,
  showBack = true,
  nextLabel = 'Continue',
}: StepContainerProps) {
  const { currentStep, nextStep, prevStep } = useQuestionnaireStore();
  const progress = ((currentStep + 1) / QUESTIONNAIRE_STEPS.length) * 100;

  const handleNext = () => {
    if (onNext) {
      onNext();
    }
    nextStep();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {QUESTIONNAIRE_STEPS.length}
            </span>
            <div className="flex gap-1">
              {QUESTIONNAIRE_STEPS.map((step, i) => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i <= currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-lg">{description}</p>
          )}
        </div>

        <div className="space-y-6">{children}</div>
      </main>

      {/* Navigation footer */}
      <footer className="sticky bottom-0 bg-background/95 backdrop-blur border-t">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between">
          {showBack && currentStep > 0 ? (
            <Button variant="ghost" onClick={prevStep}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          ) : (
            <div />
          )}

          <Button onClick={handleNext} disabled={!canProceed}>
            {nextLabel}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
