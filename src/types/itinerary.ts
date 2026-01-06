// Itinerary - The core output model for AI-generated trip plans

export type TimeBlockType = 'morning-anchor' | 'midday-flex' | 'evening-vibe' | 'rest-block' | 'transit';

export type ActivityPriority = 'must-see' | 'if-energy' | 'skip-guilt-free';

export type ActivityCategory =
  | 'sightseeing'
  | 'food'
  | 'activity'
  | 'relaxation'
  | 'shopping'
  | 'nightlife'
  | 'workshop'
  | 'transit'
  | 'accommodation'
  | 'flight'
  | 'checkin';

export type ReservationStatus = 'not-started' | 'done' | 'pending' | 'cancelled';

export type TransportMode = 'flight' | 'train' | 'bus' | 'taxi' | 'walk' | 'car' | 'ferry' | 'other';

// Attachment/file reference
export interface Attachment {
  name: string;
  path: string;
  type: 'pdf' | 'image' | 'document' | 'other';
}

export type FoodType = 'local-classic' | 'splurge' | 'casual-backup';

export type PriceRange = '$' | '$$' | '$$$' | '$$$$';

export type BagSize = 'carry-on' | 'medium' | 'large';

// Cost estimate for activities
export interface CostEstimate {
  amount: number;
  currency: string;
  isEstimate: boolean;
}

// Location data
export interface Location {
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  placeId?: string; // For maps integration
}

// Single activity
export interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  description: string;
  location?: Location;
  duration: number; // minutes
  cost?: CostEstimate;
  bookingRequired: boolean;
  bookingUrl?: string;
  tips?: string[];
  tags: string[];
  // New fields from CSV import
  reservationStatus?: ReservationStatus;
  transport?: TransportMode;
  attachments?: Attachment[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  scheduledTime?: string; // "09:30" format
}

// Time block within a day
export interface TimeBlock {
  id: string;
  type: TimeBlockType;
  startTime?: string; // "09:00" format
  endTime?: string;
  activity?: Activity;
  alternatives?: Activity[];
  priority: ActivityPriority;
  isLocked: boolean; // User locked this block from AI changes
  notes?: string;
}

// Single day plan
export interface DayPlan {
  id: string;
  date: string; // ISO date
  dayNumber: number;
  baseId: string; // Reference to which base/hotel
  theme?: string; // "Temple Day", "Beach Recovery", etc.
  blocks: TimeBlock[];
  weather?: WeatherForecast;
  localEvents?: LocalEvent[];
  notes?: string;
}

// Weather forecast (optional enrichment)
export interface WeatherForecast {
  high: number;
  low: number;
  condition: string;
  precipitation: number; // percentage
}

// Local events (optional enrichment)
export interface LocalEvent {
  name: string;
  type: string;
  date: string;
  impact: 'positive' | 'negative' | 'neutral'; // crowds, closures, etc.
  notes?: string;
}

// Base/accommodation
export interface Base {
  id: string;
  location: string;
  region?: string; // "Chiang Mai", "Phuket Old Town"
  accommodation?: AccommodationSuggestion;
  nights: number;
  checkIn: string; // ISO date
  checkOut: string;
  rationale: string; // Why this base was chosen
}

// Accommodation suggestion
export interface AccommodationSuggestion {
  name?: string;
  type: 'hotel' | 'resort' | 'boutique' | 'airbnb' | 'hostel' | 'ryokan';
  priceRange: PriceRange;
  bookingUrl?: string;
  notes?: string;
}

// Movement between bases
export interface Movement {
  id: string;
  from: string; // Base ID
  to: string; // Base ID
  date: string;
  transportType: string;
  duration: number; // minutes
  cost?: CostEstimate;
  notes?: string;
}

// Food recommendation
export interface FoodRecommendation {
  id: string;
  dayId?: string; // Optional link to specific day
  type: FoodType;
  name: string;
  cuisine: string;
  location?: Location;
  priceRange: PriceRange;
  reservationRequired: boolean;
  skipTheHype: boolean; // Flag for overrated spots
  notes: string;
  mealTime?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

// Hobby-specific activity
export interface HobbyActivity {
  id: string;
  hobby: string; // Reference to TripDNA hobby
  activity: Activity;
  dayId?: string; // Suggested day
  rationale: string;
}

// Packing list
export interface PackingList {
  bagSize: BagSize;
  bagSizeRationale: string;
  capsuleWardrobe: WardrobeItem[];
  activitySpecific: PackingItem[];
  electronics: PackingItem[];
  toiletries: PackingItem[];
  documents: PackingItem[];
  doNotBring: DoNotBringItem[];
  climateNotes: string;
}

export interface WardrobeItem {
  item: string;
  quantity: number;
  notes?: string;
}

export interface PackingItem {
  item: string;
  quantity: number;
  essential: boolean;
  notes?: string;
}

export interface DoNotBringItem {
  item: string;
  reason: string;
}

// Budget breakdown
export interface BudgetBreakdown {
  currency: string;
  accommodation: number;
  food: number;
  activities: number;
  transport: number;
  misc: number;
  total: number;
  perDay: number;
}

// Date optimization result
export interface DateOptimizationResult {
  originalDates?: { start: string; end: string };
  suggestedDates?: { start: string; end: string };
  savings?: number;
  crowdAvoidance?: string[];
  weatherBenefits?: string[];
  rationale: string;
}

// Priority ranking item
export interface PriorityItem {
  activityId: string;
  activityName: string;
  priority: ActivityPriority;
  rationale: string;
}

// Main Itinerary interface
export interface Itinerary {
  id: string;
  tripDnaId: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;

  // Meta
  meta: {
    title: string;
    destination: string;
    destinations?: string[];
    startDate: string;
    endDate: string;
    totalDays: number;
    estimatedBudget: BudgetBreakdown;
    coverImage?: string; // Base64 encoded image or URL
  };

  // Route
  route: {
    bases: Base[];
    movements: Movement[];
  };

  // Daily Plans
  days: DayPlan[];

  // Experience Layers
  foodLayer: FoodRecommendation[];
  hobbyLayer: HobbyActivity[];
  packingLayer: PackingList;

  // AI Metadata
  aiMeta: {
    dateOptimization?: DateOptimizationResult;
    routeRationale: string;
    priorityRanking: PriorityItem[];
    generatedAt: Date;
    modelUsed: string;
  };

  // User customizations tracking
  userEdits: UserEdit[];
}

// Track user edits for AI refinement context
export interface UserEdit {
  id: string;
  timestamp: Date;
  type: 'add' | 'remove' | 'modify' | 'reorder';
  target: 'day' | 'activity' | 'base' | 'food' | 'packing';
  targetId: string;
  previousValue?: unknown;
  newValue?: unknown;
  reason?: string;
}

// Helper to create empty itinerary
export function createEmptyItinerary(tripDnaId: string): Itinerary {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    tripDnaId,
    version: 1,
    createdAt: now,
    updatedAt: now,
    meta: {
      title: 'New Trip',
      destination: '',
      startDate: '',
      endDate: '',
      totalDays: 0,
      estimatedBudget: {
        currency: 'USD',
        accommodation: 0,
        food: 0,
        activities: 0,
        transport: 0,
        misc: 0,
        total: 0,
        perDay: 0,
      },
    },
    route: {
      bases: [],
      movements: [],
    },
    days: [],
    foodLayer: [],
    hobbyLayer: [],
    packingLayer: {
      bagSize: 'medium',
      bagSizeRationale: '',
      capsuleWardrobe: [],
      activitySpecific: [],
      electronics: [],
      toiletries: [],
      documents: [],
      doNotBring: [],
      climateNotes: '',
    },
    aiMeta: {
      routeRationale: '',
      priorityRanking: [],
      generatedAt: now,
      modelUsed: '',
    },
    userEdits: [],
  };
}
