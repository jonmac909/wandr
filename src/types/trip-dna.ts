// Trip DNA - The core input model that captures traveler preferences

export type PartyType = 'solo' | 'couple' | 'family' | 'friends';

export type TravelIdentity =
  | 'history'
  | 'food'
  | 'nature'
  | 'relaxation'
  | 'adventure'
  | 'theme-parks'
  | 'workshops'
  | 'music'
  | 'photography'
  | 'shopping'
  | 'nightlife'
  | 'art'
  | 'architecture'
  | 'local-culture';

export type TripPace = 'relaxed' | 'balanced' | 'fast';

export type ScheduleTolerance = 'flexible' | 'some-structure' | 'fully-planned';

export type EnergyPattern = 'morning' | 'evening' | 'flexible';

export type DateFlexibility = 'fixed' | 'flexible' | 'fully-flexible';

export type AccommodationStyle = 'luxury' | 'boutique' | 'practical' | 'budget';

export type AccommodationPriority = 'location' | 'comfort' | 'value';

export type DepthPreference = 'highlights' | 'depth-fewer' | 'everything';

export type FoodImportance = 'fuel' | 'local-spots' | 'food-focused' | 'reservations-planned';

export type Hobby =
  | 'painting'
  | 'music'
  | 'fitness'
  | 'cooking'
  | 'photography'
  | 'hiking'
  | 'yoga'
  | 'diving'
  | 'wine-tasting'
  | 'crafts'
  | 'writing'
  | 'meditation';

export type MovementTolerance = 'minimal' | 'moderate' | 'flexible';

export type TransportType = 'train' | 'flight' | 'car' | 'scooter' | 'ferry' | 'bus' | 'walking';

export type AgeGroup = 'children' | 'teens' | 'adults' | 'seniors';

// Main Trip DNA interface
export interface TripDNA {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  // A. Traveler Profile (WHO)
  travelerProfile: {
    partyType: PartyType;
    partySize?: number;
    ageGroups?: AgeGroup[];
    travelIdentities: TravelIdentity[]; // Ranked - first is most important
  };

  // B. Vibe & Pace (HOW)
  vibeAndPace: {
    tripPace: TripPace;
    activitiesPerDay: {
      min: number;
      max: number;
    };
    scheduleTolerance: ScheduleTolerance;
    energyPattern: EnergyPattern;
  };

  // C. Constraints (REALITY)
  constraints: {
    dates: {
      type: DateFlexibility;
      startDate?: string; // ISO date
      endDate?: string;
      flexibility?: number; // days +/-
      preferredMonths?: number[]; // 1-12
      totalDays?: number;
    };
    budget: {
      currency: string;
      accommodationRange: {
        min: number;
        max: number;
        perNight: boolean;
      };
      dailySpend: {
        min: number;
        max: number;
      };
      splurgeMoments: number; // 0-5 scale
      splurgeCategories?: ('food' | 'experience' | 'accommodation')[];
    };
    accommodation: {
      style: AccommodationStyle;
      priority: AccommodationPriority;
    };
  };

  // D. Interests & Depth (WHAT)
  interests: {
    destination?: string; // Optional - user may want AI suggestions
    destinations?: string[]; // For multi-destination trips
    destinationType?: 'city' | 'nature' | 'beach' | 'mixed';
    depthPreference: DepthPreference;
    food: {
      importance: FoodImportance;
      dietaryRestrictions?: string[];
      cuisinePreferences?: string[];
    };
    hobbies: Hobby[];
  };

  // E. Logistics
  logistics: {
    movementTolerance: MovementTolerance;
    preferredBases: number; // 1-5
    transport: {
      comfortable: TransportType[];
      avoid: TransportType[];
    };
    mobilityConstraints?: string;
  };
}

// Default values for new Trip DNA
export const defaultTripDNA: Omit<TripDNA, 'id' | 'createdAt' | 'updatedAt'> = {
  travelerProfile: {
    partyType: 'couple',
    travelIdentities: [],
  },
  vibeAndPace: {
    tripPace: 'balanced',
    activitiesPerDay: { min: 2, max: 4 },
    scheduleTolerance: 'some-structure',
    energyPattern: 'flexible',
  },
  constraints: {
    dates: {
      type: 'flexible',
    },
    budget: {
      currency: 'USD',
      accommodationRange: { min: 100, max: 200, perNight: true },
      dailySpend: { min: 100, max: 200 },
      splurgeMoments: 2,
    },
    accommodation: {
      style: 'boutique',
      priority: 'location',
    },
  },
  interests: {
    depthPreference: 'depth-fewer',
    food: {
      importance: 'local-spots',
    },
    hobbies: [],
  },
  logistics: {
    movementTolerance: 'moderate',
    preferredBases: 3,
    transport: {
      comfortable: ['train', 'flight'],
      avoid: [],
    },
  },
};

// Helper to create new Trip DNA with ID
export function createTripDNA(
  partial?: Partial<Omit<TripDNA, 'id' | 'createdAt' | 'updatedAt'>>
): TripDNA {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    ...defaultTripDNA,
    ...partial,
  };
}
