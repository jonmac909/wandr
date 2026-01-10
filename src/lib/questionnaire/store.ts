import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TripDNA, defaultTripDNA, createTripDNA } from '@/types/trip-dna';

// Steps in the questionnaire
export const QUESTIONNAIRE_STEPS = [
  { id: 'traveler', label: 'Who', description: 'Traveler Profile' },
  { id: 'vibe', label: 'How', description: 'Vibe & Pace' },
  { id: 'constraints', label: 'Reality', description: 'Constraints' },
  { id: 'interests', label: 'What', description: 'Interests' },
  { id: 'logistics', label: 'Move', description: 'Logistics' },
  { id: 'review', label: 'Review', description: 'Review & Generate' },
] as const;

export type StepId = (typeof QUESTIONNAIRE_STEPS)[number]['id'];

interface QuestionnaireState {
  // Current step
  currentStep: number;

  // Trip DNA being built
  tripDna: TripDNA;

  // Edit mode - existing trip ID
  editingTripId: string | null;

  // Validation errors by field
  errors: Record<string, string>;

  // Generation state
  isGenerating: boolean;
  generationProgress: number;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Set entire TripDNA (for edit mode)
  setTripDna: (tripDna: TripDNA) => void;
  setEditingTripId: (id: string | null) => void;

  // Trip DNA updates (partial updates merge with existing)
  updateTravelerProfile: (data: Partial<TripDNA['travelerProfile']>) => void;
  updateVibeAndPace: (data: Partial<TripDNA['vibeAndPace']>) => void;
  updateConstraints: (data: Partial<TripDNA['constraints']>) => void;
  updateInterests: (data: Partial<TripDNA['interests']>) => void;
  updateLogistics: (data: Partial<TripDNA['logistics']>) => void;

  // Validation
  setError: (field: string, message: string) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;

  // Generation
  setGenerating: (isGenerating: boolean) => void;
  setGenerationProgress: (progress: number) => void;

  // Reset
  reset: () => void;
}

export const useQuestionnaireStore = create<QuestionnaireState>()(
  persist(
    (set, get) => ({
      currentStep: 0,
      tripDna: createTripDNA(),
      editingTripId: null,
      errors: {},
      isGenerating: false,
      generationProgress: 0,

      setStep: (step) => set({ currentStep: step }),

      setTripDna: (tripDna) => set({ tripDna }),
      setEditingTripId: (editingTripId) => set({ editingTripId }),

      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < QUESTIONNAIRE_STEPS.length - 1) {
          set({ currentStep: currentStep + 1 });
        }
      },

      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 });
        }
      },

      updateTravelerProfile: (data) => set((state) => ({
        tripDna: {
          ...state.tripDna,
          travelerProfile: { ...state.tripDna.travelerProfile, ...data },
          updatedAt: new Date(),
        },
      })),

      updateVibeAndPace: (data) => set((state) => ({
        tripDna: {
          ...state.tripDna,
          vibeAndPace: { ...state.tripDna.vibeAndPace, ...data },
          updatedAt: new Date(),
        },
      })),

      updateConstraints: (data) => set((state) => ({
        tripDna: {
          ...state.tripDna,
          constraints: {
            ...state.tripDna.constraints,
            ...data,
            // Deep merge for nested objects
            dates: { ...state.tripDna.constraints.dates, ...data.dates },
            budget: { ...state.tripDna.constraints.budget, ...data.budget },
            accommodation: { ...state.tripDna.constraints.accommodation, ...data.accommodation },
          },
          updatedAt: new Date(),
        },
      })),

      updateInterests: (data) => set((state) => ({
        tripDna: {
          ...state.tripDna,
          interests: {
            ...state.tripDna.interests,
            ...data,
            food: { ...state.tripDna.interests.food, ...data.food },
          },
          updatedAt: new Date(),
        },
      })),

      updateLogistics: (data) => set((state) => ({
        tripDna: {
          ...state.tripDna,
          logistics: {
            ...state.tripDna.logistics,
            ...data,
            transport: { ...state.tripDna.logistics.transport, ...data.transport },
          },
          updatedAt: new Date(),
        },
      })),

      setError: (field, message) => set((state) => ({
        errors: { ...state.errors, [field]: message },
      })),

      clearError: (field) => set((state) => {
        const { [field]: _, ...rest } = state.errors;
        return { errors: rest };
      }),

      clearAllErrors: () => set({ errors: {} }),

      setGenerating: (isGenerating) => set({ isGenerating }),
      setGenerationProgress: (generationProgress) => set({ generationProgress }),

      reset: () => set({
        currentStep: 0,
        tripDna: createTripDNA(),
        editingTripId: null,
        errors: {},
        isGenerating: false,
        generationProgress: 0,
      }),
    }),
    {
      name: 'questionnaire-storage',
      partialize: (state) => ({
        currentStep: state.currentStep,
        tripDna: state.tripDna,
      }),
    }
  )
);

// Selectors for common patterns
export const useCurrentStep = () => useQuestionnaireStore((s) => s.currentStep);
export const useTripDna = () => useQuestionnaireStore((s) => s.tripDna);
export const useIsGenerating = () => useQuestionnaireStore((s) => s.isGenerating);
