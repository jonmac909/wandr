import { Itinerary, PackingList, PackingItem, WardrobeItem, DoNotBringItem, BagSize } from '@/types/itinerary';
import { TripDNA, Hobby, TravelIdentity } from '@/types/trip-dna';

// Climate zones for destinations
type ClimateZone = 'tropical' | 'temperate' | 'cold' | 'desert' | 'mediterranean' | 'monsoon';

interface DestinationClimate {
  zone: ClimateZone;
  avgTemp: { min: number; max: number }; // Celsius
  rainy: boolean;
  humid: boolean;
}

// Known destination climate data (expandable)
const DESTINATION_CLIMATES: Record<string, DestinationClimate> = {
  // Southeast Asia
  'thailand': { zone: 'tropical', avgTemp: { min: 24, max: 35 }, rainy: true, humid: true },
  'vietnam': { zone: 'tropical', avgTemp: { min: 22, max: 33 }, rainy: true, humid: true },
  'bali': { zone: 'tropical', avgTemp: { min: 24, max: 32 }, rainy: true, humid: true },
  'singapore': { zone: 'tropical', avgTemp: { min: 25, max: 32 }, rainy: true, humid: true },
  'cambodia': { zone: 'tropical', avgTemp: { min: 24, max: 35 }, rainy: true, humid: true },
  // Japan
  'japan': { zone: 'temperate', avgTemp: { min: 5, max: 30 }, rainy: true, humid: false },
  'tokyo': { zone: 'temperate', avgTemp: { min: 5, max: 30 }, rainy: true, humid: false },
  'kyoto': { zone: 'temperate', avgTemp: { min: 4, max: 32 }, rainy: true, humid: false },
  'osaka': { zone: 'temperate', avgTemp: { min: 5, max: 32 }, rainy: true, humid: false },
  // USA
  'hawaii': { zone: 'tropical', avgTemp: { min: 21, max: 29 }, rainy: true, humid: true },
  'new york': { zone: 'temperate', avgTemp: { min: -3, max: 29 }, rainy: true, humid: false },
  'los angeles': { zone: 'mediterranean', avgTemp: { min: 10, max: 28 }, rainy: false, humid: false },
  'miami': { zone: 'tropical', avgTemp: { min: 18, max: 32 }, rainy: true, humid: true },
  // Europe
  'paris': { zone: 'temperate', avgTemp: { min: 3, max: 25 }, rainy: true, humid: false },
  'london': { zone: 'temperate', avgTemp: { min: 4, max: 22 }, rainy: true, humid: false },
  'rome': { zone: 'mediterranean', avgTemp: { min: 6, max: 30 }, rainy: false, humid: false },
  'barcelona': { zone: 'mediterranean', avgTemp: { min: 8, max: 28 }, rainy: false, humid: false },
  'amsterdam': { zone: 'temperate', avgTemp: { min: 2, max: 22 }, rainy: true, humid: false },
  // Default
  'default': { zone: 'temperate', avgTemp: { min: 10, max: 25 }, rainy: true, humid: false },
};

// Activity categories that require specific gear
const ACTIVITY_GEAR: Record<string, PackingItem[]> = {
  'hiking': [
    { item: 'Hiking shoes/boots', quantity: 1, essential: true, notes: 'Broken in before trip' },
    { item: 'Hiking socks (merino)', quantity: 3, essential: true },
    { item: 'Day pack (20-30L)', quantity: 1, essential: true },
    { item: 'Water bottle', quantity: 1, essential: true },
    { item: 'First aid kit (basic)', quantity: 1, essential: false },
  ],
  'beach': [
    { item: 'Swimsuit', quantity: 2, essential: true },
    { item: 'Beach towel (quick-dry)', quantity: 1, essential: false, notes: 'Most hotels provide' },
    { item: 'Reef-safe sunscreen', quantity: 1, essential: true },
    { item: 'Sunglasses', quantity: 1, essential: true },
    { item: 'Flip flops/sandals', quantity: 1, essential: true },
  ],
  'diving': [
    { item: 'Dive certification card', quantity: 1, essential: true },
    { item: 'Dive log', quantity: 1, essential: false },
    { item: 'Rashguard', quantity: 1, essential: true, notes: 'For sun protection' },
    { item: 'Underwater camera', quantity: 1, essential: false },
  ],
  'yoga': [
    { item: 'Yoga mat (travel)', quantity: 1, essential: false, notes: 'Studios usually provide' },
    { item: 'Yoga clothes', quantity: 2, essential: true },
  ],
  'photography': [
    { item: 'Camera', quantity: 1, essential: true },
    { item: 'Extra batteries/charger', quantity: 1, essential: true },
    { item: 'Memory cards', quantity: 2, essential: true },
    { item: 'Lens cleaning kit', quantity: 1, essential: false },
    { item: 'Camera bag', quantity: 1, essential: true },
  ],
  'fitness': [
    { item: 'Workout clothes', quantity: 2, essential: true },
    { item: 'Running shoes', quantity: 1, essential: true },
    { item: 'Resistance bands', quantity: 1, essential: false, notes: 'Lightweight workout option' },
  ],
  'cooking': [
    { item: 'Portable spice kit', quantity: 1, essential: false },
    { item: 'Recipe notes', quantity: 1, essential: false },
  ],
  'temple': [
    { item: 'Cover-up/sarong', quantity: 1, essential: true, notes: 'For temple visits - covers shoulders & knees' },
    { item: 'Slip-on shoes', quantity: 1, essential: true, notes: 'Easy to remove at temples' },
  ],
  'nightlife': [
    { item: 'Going-out outfit', quantity: 1, essential: false },
    { item: 'Comfortable dress shoes', quantity: 1, essential: false },
  ],
};

// Hobby to activity mapping
const HOBBY_TO_ACTIVITY: Record<Hobby, string[]> = {
  'hiking': ['hiking'],
  'diving': ['diving', 'beach'],
  'yoga': ['yoga'],
  'photography': ['photography'],
  'fitness': ['fitness'],
  'cooking': ['cooking'],
  'painting': [],
  'music': [],
  'wine-tasting': [],
  'crafts': [],
  'writing': [],
  'meditation': ['yoga'],
};

// Travel identity to activity mapping
const IDENTITY_TO_ACTIVITY: Record<TravelIdentity, string[]> = {
  'nature': ['hiking'],
  'adventure': ['hiking'],
  'relaxation': ['beach'],
  'food': [],
  'history': ['temple'],
  'local-culture': ['temple'],
  'nightlife': ['nightlife'],
  'photography': ['photography'],
  'art': [],
  'architecture': [],
  'theme-parks': [],
  'workshops': [],
  'music': [],
  'shopping': [],
};

function getClimateForDestination(destination: string): DestinationClimate {
  const normalized = destination.toLowerCase();

  // Check for exact matches
  for (const [key, climate] of Object.entries(DESTINATION_CLIMATES)) {
    if (normalized.includes(key)) {
      return climate;
    }
  }

  return DESTINATION_CLIMATES['default'];
}

function getClimateNotes(climate: DestinationClimate, destination: string): string {
  const notes: string[] = [];

  if (climate.zone === 'tropical') {
    notes.push('Tropical climate - expect heat and humidity.');
    notes.push('Light, breathable fabrics recommended (cotton, linen, moisture-wicking).');
    if (climate.rainy) {
      notes.push('Rain is common - pack a compact umbrella or rain jacket.');
    }
  } else if (climate.zone === 'temperate') {
    notes.push('Temperate climate - layering is key.');
    notes.push('Pack versatile pieces that work for varying temperatures.');
  } else if (climate.zone === 'mediterranean') {
    notes.push('Mediterranean climate - warm and dry.');
    notes.push('Sun protection is essential.');
  }

  if (climate.humid) {
    notes.push('High humidity - quick-dry fabrics are your friend.');
  }

  return notes.join(' ');
}

function calculateBagSize(tripDays: number, movements: number, activities: string[]): { size: BagSize; rationale: string } {
  // Base calculation on trip length and number of location changes
  const hasHeavyGear = activities.some(a => ['hiking', 'diving', 'photography'].includes(a));

  if (tripDays <= 5 && movements <= 1 && !hasHeavyGear) {
    return {
      size: 'carry-on',
      rationale: `Short ${tripDays}-day trip with minimal location changes. A carry-on (40L) keeps you mobile and avoids baggage fees.`,
    };
  } else if (tripDays <= 10 && movements <= 3) {
    return {
      size: 'medium',
      rationale: `${tripDays}-day trip with ${movements} location changes. A medium bag (50-65L) balances capacity with mobility.`,
    };
  } else {
    return {
      size: 'large',
      rationale: `Extended ${tripDays}-day trip. A large bag (70L+) is recommended. Plan to do laundry every 5-7 days. For very long trips, consider shipping items home midway.`,
    };
  }
}

function generateWardrobe(tripDays: number, climate: DestinationClimate, activities: string[]): WardrobeItem[] {
  const wardrobe: WardrobeItem[] = [];

  // Calculate quantities based on trip length (assume laundry every 5-7 days)
  const baseQuantity = Math.min(Math.ceil(tripDays / 5), 7);

  // Underwear & socks
  wardrobe.push({
    item: 'Underwear',
    quantity: Math.min(tripDays, 7),
    notes: 'Quick-dry preferred for easy washing',
  });
  wardrobe.push({
    item: 'Socks',
    quantity: Math.min(tripDays, 5),
  });

  // Climate-based clothing
  if (climate.zone === 'tropical' || climate.avgTemp.max > 28) {
    wardrobe.push({ item: 'T-shirts/tops', quantity: baseQuantity, notes: 'Light colors, breathable' });
    wardrobe.push({ item: 'Shorts', quantity: Math.ceil(baseQuantity / 2) });
    wardrobe.push({ item: 'Light pants/skirts', quantity: 2, notes: 'For temples, nicer restaurants' });
    wardrobe.push({ item: 'Light jacket/cardigan', quantity: 1, notes: 'For AC and evening' });
  } else if (climate.zone === 'temperate') {
    wardrobe.push({ item: 'T-shirts/tops', quantity: baseQuantity });
    wardrobe.push({ item: 'Long pants', quantity: 3 });
    wardrobe.push({ item: 'Light sweater/fleece', quantity: 2 });
    wardrobe.push({ item: 'Jacket', quantity: 1 });
  } else if (climate.zone === 'cold') {
    wardrobe.push({ item: 'Base layers', quantity: 2 });
    wardrobe.push({ item: 'Long pants', quantity: 3 });
    wardrobe.push({ item: 'Sweaters', quantity: 2 });
    wardrobe.push({ item: 'Warm jacket', quantity: 1 });
  }

  // Sleepwear
  wardrobe.push({ item: 'Sleepwear', quantity: 2 });

  // Footwear
  wardrobe.push({ item: 'Walking shoes', quantity: 1, notes: 'Comfortable, broken-in' });
  if (activities.includes('beach') || climate.zone === 'tropical') {
    wardrobe.push({ item: 'Sandals/flip flops', quantity: 1 });
  }

  return wardrobe;
}

function generateElectronics(tripDays: number, hobbies: Hobby[]): PackingItem[] {
  const electronics: PackingItem[] = [
    { item: 'Phone + charger', quantity: 1, essential: true },
    { item: 'Universal power adapter', quantity: 1, essential: true },
    { item: 'Portable battery pack', quantity: 1, essential: true, notes: '10,000+ mAh recommended' },
  ];

  if (tripDays > 7) {
    electronics.push({ item: 'Laptop/tablet', quantity: 1, essential: false, notes: 'For longer trips' });
  }

  // Earbuds for flights
  electronics.push({ item: 'Earbuds/headphones', quantity: 1, essential: false });

  // E-reader for long trips
  if (tripDays > 10) {
    electronics.push({ item: 'E-reader', quantity: 1, essential: false, notes: 'Better than packing books' });
  }

  return electronics;
}

function generateToiletries(tripDays: number, climate: DestinationClimate): PackingItem[] {
  const toiletries: PackingItem[] = [
    { item: 'Toothbrush + toothpaste', quantity: 1, essential: true },
    { item: 'Deodorant', quantity: 1, essential: true },
    { item: 'Sunscreen', quantity: 1, essential: true },
    { item: 'Medications (personal)', quantity: 1, essential: true, notes: 'Keep in carry-on' },
    { item: 'Lip balm with SPF', quantity: 1, essential: false },
  ];

  if (climate.humid || climate.zone === 'tropical') {
    toiletries.push({ item: 'Anti-chafing product', quantity: 1, essential: false, notes: 'Essential for humid climates' });
    toiletries.push({ item: 'Insect repellent', quantity: 1, essential: true });
  }

  if (tripDays > 5) {
    toiletries.push({ item: 'Laundry detergent strips', quantity: 1, essential: false, notes: 'For sink washing' });
  }

  // Basic first aid
  toiletries.push({ item: 'Basic first aid (bandaids, pain reliever)', quantity: 1, essential: true });
  toiletries.push({ item: 'Hand sanitizer', quantity: 1, essential: true });

  return toiletries;
}

function generateDocuments(): PackingItem[] {
  return [
    { item: 'Passport', quantity: 1, essential: true, notes: 'Check validity (6+ months)' },
    { item: 'Passport copies (digital + paper)', quantity: 1, essential: true },
    { item: 'Travel insurance docs', quantity: 1, essential: true },
    { item: 'Credit cards (2+)', quantity: 1, essential: true, notes: 'Keep in separate places' },
    { item: 'Emergency cash (USD)', quantity: 1, essential: true },
    { item: 'Flight/hotel confirmations', quantity: 1, essential: true, notes: 'Digital or printed' },
    { item: 'Vaccination records', quantity: 1, essential: false, notes: 'If required' },
  ];
}

function generateDoNotBring(climate: DestinationClimate, destination: string): DoNotBringItem[] {
  const doNotBring: DoNotBringItem[] = [
    { item: 'Too many "just in case" items', reason: 'You can buy most things at your destination' },
    { item: 'Valuable jewelry', reason: 'Risk of loss or theft' },
    { item: 'Full-size toiletries', reason: 'Travel sizes are lighter, most hotels provide basics' },
    { item: 'Heavy books', reason: 'Use e-reader or buy/trade books locally' },
  ];

  if (climate.zone === 'tropical') {
    doNotBring.push({ item: 'Heavy jeans', reason: 'Too hot and takes forever to dry' });
    doNotBring.push({ item: 'Dark colored clothes', reason: 'Absorb heat, show sweat stains' });
    doNotBring.push({ item: 'Cotton towels', reason: 'Take too long to dry in humidity' });
  }

  // Destination-specific
  if (destination.toLowerCase().includes('japan')) {
    doNotBring.push({ item: 'Coins for tipping', reason: 'Tipping is not customary in Japan' });
  }

  return doNotBring;
}

export function generatePackingList(itinerary: Itinerary, tripDna?: TripDNA | null): PackingList {
  const destination = itinerary.meta.destination || '';
  const tripDays = itinerary.meta.totalDays || itinerary.days.length;
  const movements = itinerary.route.movements?.length || 0;

  // Determine climate
  const climate = getClimateForDestination(destination);

  // Collect activities from multiple sources
  const activities = new Set<string>();

  // From itinerary days
  for (const day of itinerary.days) {
    for (const block of day.blocks) {
      const activity = block.activity;
      if (!activity) continue;

      // Check activity tags
      const tags = activity.tags || [];
      const activityName = activity.name?.toLowerCase() || '';

      if (tags.some(t => t.toLowerCase().includes('hik') || t.toLowerCase().includes('outdoor') || t.toLowerCase().includes('nature'))) {
        activities.add('hiking');
      }
      if (tags.some(t => t.toLowerCase().includes('beach') || t.toLowerCase().includes('swim') || t.toLowerCase().includes('snorkel'))) {
        activities.add('beach');
      }
      if (tags.some(t => t.toLowerCase().includes('temple') || t.toLowerCase().includes('shrine'))) {
        activities.add('temple');
      }
      if (tags.some(t => t.toLowerCase().includes('div'))) {
        activities.add('diving');
      }
      // Food activities might need nice clothes for upscale restaurants
      if (activity.category === 'food') {
        if (activityName.includes('fine') || activityName.includes('michelin')) {
          activities.add('nightlife');
        }
      }
    }
  }

  // From trip DNA hobbies
  if (tripDna?.interests.hobbies) {
    for (const hobby of tripDna.interests.hobbies) {
      const hobbyActivities = HOBBY_TO_ACTIVITY[hobby] || [];
      hobbyActivities.forEach(a => activities.add(a));
    }
  }

  // From travel identities
  if (tripDna?.travelerProfile.travelIdentities) {
    for (const identity of tripDna.travelerProfile.travelIdentities) {
      const identityActivities = IDENTITY_TO_ACTIVITY[identity] || [];
      identityActivities.forEach(a => activities.add(a));
    }
  }

  // Check destination type
  if (tripDna?.interests.destinationType === 'beach') {
    activities.add('beach');
  }
  if (tripDna?.interests.destinationType === 'nature') {
    activities.add('hiking');
  }

  // If destination is known beach destination
  if (destination.toLowerCase().includes('hawaii') ||
      destination.toLowerCase().includes('bali') ||
      destination.toLowerCase().includes('phuket')) {
    activities.add('beach');
  }

  const activityList = Array.from(activities);

  // Calculate bag size
  const { size: bagSize, rationale: bagSizeRationale } = calculateBagSize(tripDays, movements, activityList);

  // Generate wardrobe
  const capsuleWardrobe = generateWardrobe(tripDays, climate, activityList);

  // Generate activity-specific gear
  const activitySpecific: PackingItem[] = [];
  for (const activity of activityList) {
    const gear = ACTIVITY_GEAR[activity] || [];
    for (const item of gear) {
      // Avoid duplicates
      if (!activitySpecific.some(existing => existing.item === item.item)) {
        activitySpecific.push(item);
      }
    }
  }

  // Generate other categories
  const electronics = generateElectronics(tripDays, tripDna?.interests.hobbies || []);
  const toiletries = generateToiletries(tripDays, climate);
  const documents = generateDocuments();
  const doNotBring = generateDoNotBring(climate, destination);
  const climateNotes = getClimateNotes(climate, destination);

  return {
    bagSize,
    bagSizeRationale,
    capsuleWardrobe,
    activitySpecific,
    electronics,
    toiletries,
    documents,
    doNotBring,
    climateNotes,
  };
}

// Export helper to check if packing list is empty/default
export function isPackingListEmpty(packingList: PackingList): boolean {
  return (
    packingList.capsuleWardrobe.length === 0 &&
    packingList.activitySpecific.length === 0 &&
    packingList.electronics.length === 0 &&
    packingList.toiletries.length === 0 &&
    packingList.documents.length === 0
  );
}
