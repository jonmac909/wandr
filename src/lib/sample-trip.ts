// ASIA 2026 - 50 day trip: Canada → Japan → Thailand → Vietnam → Japan → USA
import { TripDNA, createTripDNA } from '@/types/trip-dna';
import { Itinerary } from '@/types/itinerary';

export const sampleTripDna: TripDNA = {
  ...createTripDNA(),
  id: 'asia-2026',
  travelerProfile: {
    partyType: 'couple',
    travelIdentities: ['food', 'relaxation', 'nature', 'history', 'photography'],
  },
  vibeAndPace: {
    tripPace: 'balanced',
    activitiesPerDay: { min: 1, max: 3 },
    scheduleTolerance: 'some-structure',
    energyPattern: 'morning',
  },
  constraints: {
    dates: {
      type: 'fixed',
      startDate: '2026-02-11',
      endDate: '2026-04-01',
      totalDays: 50,
    },
    budget: {
      currency: 'USD',
      accommodationRange: { min: 50, max: 300, perNight: true },
      dailySpend: { min: 100, max: 500 },
      splurgeMoments: 3,
    },
    accommodation: {
      style: 'boutique',
      priority: 'location',
    },
  },
  interests: {
    destination: 'Canada → Transit → Japan → Thailand → Vietnam → USA',
    depthPreference: 'depth-fewer',
    food: {
      importance: 'food-focused',
      dietaryRestrictions: [],
      cuisinePreferences: ['thai', 'vietnamese', 'japanese'],
    },
    hobbies: ['photography', 'relaxation'],
  },
  logistics: {
    movementTolerance: 'moderate',
    preferredBases: 10,
    transport: {
      comfortable: ['train', 'flight'],
      avoid: ['bus'],
    },
  },
};

export const sampleItinerary: Itinerary = {
  id: 'b2c308f7-01f6-4087-aaef-1350ebeab86b',
  tripDnaId: 'a51764d3-a14d-4d14-9afd-94a2b926be65',
  version: 1,
  createdAt: new Date('2026-01-02T20:35:14.492Z'),
  updatedAt: new Date('2026-01-04T00:23:21.251Z'),
  meta: {
    title: 'ASIA 2026',
    destination: 'Canada, Transit, Japan, Thailand, Vietnam, USA',
    destinations: ['Canada', 'Transit', 'Japan', 'Thailand', 'Vietnam', 'USA'],
    startDate: '2026-02-11',
    endDate: '2026-04-01',
    totalDays: 50,
    estimatedBudget: {
      currency: 'USD',
      accommodation: 0,
      food: 0,
      activities: 22042,
      transport: 0,
      misc: 0,
      total: 22042,
      perDay: 441,
    },
  },
  route: {
    bases: [
      { id: 'base-1', location: 'Tokyo Narita', accommodation: { name: 'Hotel Nikko Narita', type: 'hotel', priceRange: '$$' }, nights: 1, checkIn: '2026-02-12', checkOut: '2026-02-12', rationale: 'Stay in Tokyo Narita, Japan' },
      { id: 'base-2', location: 'Bangkok', accommodation: { name: 'The Park Nine', type: 'hotel', priceRange: '$$' }, nights: 1, checkIn: '2026-02-13', checkOut: '2026-02-13', rationale: 'Stay in Bangkok, Thailand' },
      { id: 'base-3', location: 'Chiang Mai', accommodation: { name: 'North Hill City Resort', type: 'hotel', priceRange: '$$' }, nights: 1, checkIn: '2026-02-14', checkOut: '2026-02-14', rationale: 'Stay in Chiang Mai, Thailand' },
      { id: 'base-4', location: 'Phuket', accommodation: { name: 'Wyndham Grand Nai Harn', type: 'hotel', priceRange: '$$' }, nights: 1, checkIn: '2026-02-18', checkOut: '2026-02-18', rationale: 'Stay in Phuket, Thailand' },
      { id: 'base-5', location: 'Da Nang', accommodation: { name: 'Shilla Monogram Danang', type: 'hotel', priceRange: '$$' }, nights: 1, checkIn: '2026-02-23', checkOut: '2026-02-23', rationale: 'Stay in Da Nang, Vietnam' },
      { id: 'base-6', location: 'Hoi An', accommodation: { name: 'Grand Sunrise Palace', type: 'hotel', priceRange: '$$' }, nights: 1, checkIn: '2026-02-28', checkOut: '2026-02-28', rationale: 'Stay in Hoi An, Vietnam' },
      { id: 'base-7', location: 'Osaka', accommodation: { name: 'TBD Osaka Hotel', type: 'hotel', priceRange: '$$' }, nights: 1, checkIn: '2026-03-05', checkOut: '2026-03-05', rationale: 'Stay in Osaka, Japan' },
      { id: 'base-8', location: 'Onsen Town', accommodation: { name: 'TBD Traditional Ryokan', type: 'ryokan', priceRange: '$$' }, nights: 1, checkIn: '2026-03-08', checkOut: '2026-03-08', rationale: 'Stay in Onsen Town, Japan' },
      { id: 'base-9', location: 'Tokyo', accommodation: { name: 'Grand Nikko Tokyo', type: 'hotel', priceRange: '$$' }, nights: 1, checkIn: '2026-03-09', checkOut: '2026-03-09', rationale: 'Stay in Tokyo, Japan' },
      { id: 'base-10', location: 'Honolulu', accommodation: { name: 'AirBnB Waikiki/North Shore', type: 'hotel', priceRange: '$$' }, nights: 1, checkIn: '2026-03-18', checkOut: '2026-03-18', rationale: 'Stay in Honolulu, USA' },
    ],
    movements: [
      { id: 'move-2026-02-11-block-2026-02-11-0', from: '', to: '', date: '2026-02-11', transportType: 'flight', duration: 60, cost: { amount: 136, currency: 'USD', isEstimate: false }, notes: 'Westjet YLW→YVR 6:00am-7:15am' },
      { id: 'move-2026-02-11-block-2026-02-11-1', from: '', to: '', date: '2026-02-11', transportType: 'flight', duration: 60, cost: { amount: 4225, currency: 'USD', isEstimate: false }, notes: 'Zipair YVR→NRT 9:50am-1:00pm+1' },
      { id: 'move-2026-02-13-block-2026-02-13-0', from: '', to: '', date: '2026-02-13', transportType: 'flight', duration: 60, cost: { amount: 1731, currency: 'USD', isEstimate: false }, notes: 'Zipair NRT→BKK 5:00pm-10:15pm' },
      { id: 'move-2026-02-14-block-2026-02-14-0', from: '', to: '', date: '2026-02-14', transportType: 'flight', duration: 60, cost: { amount: 117, currency: 'USD', isEstimate: false }, notes: 'AirAsia BKK→CNX 12:35pm-2:00pm' },
      { id: 'move-2026-02-18-block-2026-02-18-0', from: '', to: '', date: '2026-02-18', transportType: 'flight', duration: 60, cost: { amount: 479, currency: 'USD', isEstimate: false }, notes: 'AirAsia CNX→HKT' },
      { id: 'move-2026-02-23-block-2026-02-23-0', from: '', to: '', date: '2026-02-23', transportType: 'flight', duration: 60, cost: { amount: 508, currency: 'USD', isEstimate: false }, notes: 'AirAsia HKT→DAD (1 stop DMK)' },
      { id: 'move-2026-02-28-block-2026-02-28-0', from: '', to: '', date: '2026-02-28', transportType: 'other', duration: 60, notes: 'Short drive (~45 min)' },
      { id: 'move-2026-03-05-block-2026-03-05-0', from: '', to: '', date: '2026-03-05', transportType: 'flight', duration: 60, cost: { amount: 450, currency: 'USD', isEstimate: false }, notes: 'VietJet DAD→KIX' },
      { id: 'move-2026-03-08-block-2026-03-08-0', from: '', to: '', date: '2026-03-08', transportType: 'other', duration: 60, cost: { amount: 100, currency: 'USD', isEstimate: false }, notes: 'To ryokan/onsen town' },
      { id: 'move-2026-03-09-block-2026-03-09-0', from: '', to: '', date: '2026-03-09', transportType: 'other', duration: 60, notes: 'Late checkout, easy train' },
      { id: 'move-2026-03-18-block-2026-03-18-0', from: '', to: '', date: '2026-03-18', transportType: 'flight', duration: 60, cost: { amount: 2125, currency: 'USD', isEstimate: false }, notes: 'ANA NRT→HNL 9:00pm-9:10am' },
      { id: 'move-2026-04-01-block-2026-04-01-0', from: '', to: '', date: '2026-04-01', transportType: 'flight', duration: 60, cost: { amount: 2342, currency: 'USD', isEstimate: false }, notes: 'Air Canada HNL→YVR 1:00pm-9:56pm' },
      { id: 'move-2026-04-01-block-2026-04-01-1', from: '', to: '', date: '2026-04-01', transportType: 'flight', duration: 60, notes: 'Westjet YVR→YLW' },
    ],
  },
  days: [
    { id: 'day-2026-02-11', date: '2026-02-11', dayNumber: 1, baseId: '', theme: 'Vancouver', blocks: [
      { id: 'block-2026-02-11-0', type: 'transit', startTime: '06:00', activity: { id: 'act-2026-02-11-0', name: 'Westjet YLW→YVR 6:00am-7:15am', category: 'flight', description: 'Connection flight', location: { name: 'Vancouver' }, duration: 75, cost: { amount: 136, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Canada'], scheduledTime: '06:00', reservationStatus: 'not-started' }, priority: 'must-see', isLocked: false, notes: 'Connection flight' },
      { id: 'block-2026-02-11-1', type: 'transit', startTime: '09:50', activity: { id: 'act-2026-02-11-1', name: 'Zipair YVR→NRT 9:50am-1:00pm+1', category: 'flight', description: '10hr flight, flat seats', location: { name: 'Tokyo' }, duration: 600, cost: { amount: 4225, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Transit'], scheduledTime: '09:50' }, priority: 'must-see', isLocked: false, notes: '10hr flight, flat seats' },
    ]},
    { id: 'day-2026-02-12', date: '2026-02-12', dayNumber: 2, baseId: 'base-1', theme: 'Tokyo Narita', blocks: [
      { id: 'block-2026-02-12-0', type: 'evening-vibe', activity: { id: 'act-2026-02-12-0', name: 'Hotel Nikko Narita', category: 'accommodation', description: 'Layover night, rest', location: { name: 'Tokyo Narita' }, duration: 60, cost: { amount: 74, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Japan'], reservationStatus: 'not-started' }, priority: 'must-see', isLocked: false, notes: 'Layover night, rest' },
    ]},
    { id: 'day-2026-02-13', date: '2026-02-13', dayNumber: 3, baseId: 'base-2', theme: 'Bangkok', blocks: [
      { id: 'block-2026-02-13-0', type: 'transit', startTime: '17:00', activity: { id: 'act-2026-02-13-0', name: 'Zipair NRT→BKK 5:00pm-10:15pm', category: 'flight', description: '7hr flight, flat seats', location: { name: 'Bangkok' }, duration: 420, cost: { amount: 1731, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Transit'], scheduledTime: '17:00' }, priority: 'must-see', isLocked: false, notes: '7hr flight, flat seats' },
      { id: 'block-2026-02-13-1', type: 'evening-vibe', activity: { id: 'act-2026-02-13-1', name: 'The Park Nine', category: 'accommodation', description: 'Day 1: Arrive late, light food, massage, early night', location: { name: 'Bangkok' }, duration: 60, cost: { amount: 36, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Thailand'] }, priority: 'must-see', isLocked: false, notes: 'Day 1: Arrive late, light food, massage, early night' },
    ]},
    { id: 'day-2026-02-14', date: '2026-02-14', dayNumber: 4, baseId: 'base-3', theme: 'Chiang Mai', blocks: [
      { id: 'block-2026-02-14-0', type: 'transit', startTime: '12:35', activity: { id: 'act-2026-02-14-0', name: 'AirAsia BKK→CNX 12:35pm-2:00pm', category: 'flight', description: '1.5hr flight, economy', location: { name: 'Chiang Mai' }, duration: 85, cost: { amount: 117, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Thailand'], scheduledTime: '12:35' }, priority: 'must-see', isLocked: false, notes: '1.5hr flight, economy' },
      { id: 'block-2026-02-14-1', type: 'evening-vibe', activity: { id: 'act-2026-02-14-1', name: 'North Hill City Resort (4 nights)', category: 'accommodation', description: 'Day 2: Check-in, explore Old City, evening massage', location: { name: 'Chiang Mai' }, duration: 60, cost: { amount: 552, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Thailand'] }, priority: 'must-see', isLocked: false, notes: 'Day 2: Check-in, explore Old City, evening massage' },
    ]},
    { id: 'day-2026-02-15', date: '2026-02-15', dayNumber: 5, baseId: '', theme: 'Ethical Elephant Sanctuary', blocks: [
      { id: 'block-2026-02-15-0', type: 'morning-anchor', activity: { id: 'act-2026-02-15-0', name: 'Ethical Elephant Sanctuary', category: 'activity', description: 'Day 3: Morning elephants, afternoon cafe hopping', location: { name: 'Chiang Mai' }, duration: 60, bookingRequired: false, tags: ['Thailand'] }, priority: 'if-energy', isLocked: false, notes: 'Day 3: Morning elephants, afternoon cafe hopping' },
    ]},
    { id: 'day-2026-02-16', date: '2026-02-16', dayNumber: 6, baseId: '', theme: 'Temples & Culture', blocks: [
      { id: 'block-2026-02-16-0', type: 'morning-anchor', activity: { id: 'act-2026-02-16-0', name: 'Temples & Culture', category: 'activity', description: 'Day 4: Monk chat, temple visits, Khantoke dinner', location: { name: 'Chiang Mai' }, duration: 60, bookingRequired: false, tags: ['Thailand'] }, priority: 'if-energy', isLocked: false, notes: 'Day 4: Monk chat, temple visits, Khantoke dinner' },
    ]},
    { id: 'day-2026-02-17', date: '2026-02-17', dayNumber: 7, baseId: '', theme: 'Easy Day', blocks: [
      { id: 'block-2026-02-17-0', type: 'midday-flex', activity: { id: 'act-2026-02-17-0', name: 'Easy Day', category: 'relaxation', description: 'Day 5: Sleep in, massages, local markets, pack', location: { name: 'Chiang Mai' }, duration: 60, bookingRequired: false, tags: ['Thailand'] }, priority: 'if-energy', isLocked: false, notes: 'Day 5: Sleep in, massages, local markets, pack' },
    ]},
    { id: 'day-2026-02-18', date: '2026-02-18', dayNumber: 8, baseId: 'base-4', theme: 'Phuket', blocks: [
      { id: 'block-2026-02-18-0', type: 'transit', activity: { id: 'act-2026-02-18-0', name: 'AirAsia CNX→HKT', category: 'flight', description: 'Travel day', location: { name: 'Phuket' }, duration: 120, cost: { amount: 479, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Thailand'] }, priority: 'must-see', isLocked: false, notes: 'Travel day' },
      { id: 'block-2026-02-18-1', type: 'evening-vibe', activity: { id: 'act-2026-02-18-1', name: 'Wyndham Grand Nai Harn (5 nights)', category: 'accommodation', description: 'Day 6: Check-in, Old Town dinner, evening stroll', location: { name: 'Phuket' }, duration: 60, cost: { amount: 1135, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Thailand'] }, priority: 'must-see', isLocked: false, notes: 'Day 6: Check-in, Old Town dinner, evening stroll' },
    ]},
    { id: 'day-2026-02-19', date: '2026-02-19', dayNumber: 9, baseId: '', theme: 'Nature Day', blocks: [
      { id: 'block-2026-02-19-0', type: 'morning-anchor', activity: { id: 'act-2026-02-19-0', name: 'Nature Day', category: 'activity', description: 'Day 7: Cloud Forest, Cape Panwa sunset - quiet, scenic, slow', location: { name: 'Phuket' }, duration: 60, bookingRequired: false, tags: ['Thailand'] }, priority: 'if-energy', isLocked: false, notes: 'Day 7: Cloud Forest, Cape Panwa sunset - quiet, scenic, slow' },
    ]},
    { id: 'day-2026-02-20', date: '2026-02-20', dayNumber: 10, baseId: '', theme: 'Wildlife Day', blocks: [
      { id: 'block-2026-02-20-0', type: 'morning-anchor', activity: { id: 'act-2026-02-20-0', name: 'Wildlife Day', category: 'activity', description: 'Day 8: Whale watching morning, beach recovery afternoon', location: { name: 'Phuket' }, duration: 60, bookingRequired: false, tags: ['Thailand'] }, priority: 'if-energy', isLocked: false, notes: 'Day 8: Whale watching morning, beach recovery afternoon' },
    ]},
    { id: 'day-2026-02-21', date: '2026-02-21', dayNumber: 11, baseId: '', theme: 'Phang Nga Bay', blocks: [
      { id: 'block-2026-02-21-0', type: 'morning-anchor', activity: { id: 'act-2026-02-21-0', name: 'Phang Nga Bay', category: 'activity', description: 'Day 9: Limestone cliffs, kayaking, no crowds', location: { name: 'Koh Yao Noi' }, duration: 60, bookingRequired: false, tags: ['Thailand'] }, priority: 'if-energy', isLocked: false, notes: 'Day 9: Limestone cliffs, kayaking, no crowds' },
    ]},
    { id: 'day-2026-02-22', date: '2026-02-22', dayNumber: 12, baseId: '', theme: 'Wrap-Up Day', blocks: [
      { id: 'block-2026-02-22-0', type: 'midday-flex', activity: { id: 'act-2026-02-22-0', name: 'Wrap-Up Day', category: 'relaxation', description: 'Day 10: Lana Kingdom spa, pack calmly for Vietnam', location: { name: 'Phuket' }, duration: 60, bookingRequired: false, tags: ['Thailand'] }, priority: 'if-energy', isLocked: false, notes: 'Day 10: Lana Kingdom spa, pack calmly for Vietnam' },
    ]},
    { id: 'day-2026-02-23', date: '2026-02-23', dayNumber: 13, baseId: 'base-5', theme: 'Da Nang', blocks: [
      { id: 'block-2026-02-23-0', type: 'transit', activity: { id: 'act-2026-02-23-0', name: 'AirAsia HKT→DAD (1 stop DMK)', category: 'flight', description: '5hr total, economy', location: { name: 'Da Nang' }, duration: 300, cost: { amount: 508, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Vietnam'] }, priority: 'must-see', isLocked: false, notes: '5hr total, economy' },
      { id: 'block-2026-02-23-1', type: 'evening-vibe', activity: { id: 'act-2026-02-23-1', name: 'Shilla Monogram Danang (5 nights)', category: 'accommodation', description: 'Day 1: Arrive, beach or room service, rest', location: { name: 'Da Nang' }, duration: 60, cost: { amount: 823, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Vietnam'] }, priority: 'must-see', isLocked: false, notes: 'Day 1: Arrive, beach or room service, rest' },
    ]},
    { id: 'day-2026-02-24', date: '2026-02-24', dayNumber: 14, baseId: '', theme: 'Marble Mountains', blocks: [
      { id: 'block-2026-02-24-0', type: 'morning-anchor', activity: { id: 'act-2026-02-24-0', name: 'Marble Mountains', category: 'activity', description: 'Day 2: Morning exploration, afternoon beach', location: { name: 'Da Nang' }, duration: 60, bookingRequired: false, tags: ['Vietnam'] }, priority: 'if-energy', isLocked: false, notes: 'Day 2: Morning exploration, afternoon beach' },
    ]},
    { id: 'day-2026-02-25', date: '2026-02-25', dayNumber: 15, baseId: '', theme: 'Hai Van Pass', blocks: [
      { id: 'block-2026-02-25-0', type: 'morning-anchor', activity: { id: 'act-2026-02-25-0', name: 'Hai Van Pass', category: 'activity', description: 'Day 3: Scenic drive/ride, coastal views', location: { name: 'Da Nang' }, duration: 60, bookingRequired: false, tags: ['Vietnam'] }, priority: 'if-energy', isLocked: false, notes: 'Day 3: Scenic drive/ride, coastal views' },
    ]},
    { id: 'day-2026-02-26', date: '2026-02-26', dayNumber: 16, baseId: '', theme: 'Beach & Cafes', blocks: [
      { id: 'block-2026-02-26-0', type: 'midday-flex', activity: { id: 'act-2026-02-26-0', name: 'Beach & Cafes', category: 'relaxation', description: "Day 4: Built-in 'do nothing' time, local cafes", location: { name: 'Da Nang' }, duration: 60, bookingRequired: false, tags: ['Vietnam'] }, priority: 'if-energy', isLocked: false, notes: "Day 4: Built-in 'do nothing' time, local cafes" },
    ]},
    { id: 'day-2026-02-27', date: '2026-02-27', dayNumber: 17, baseId: '', theme: 'Downtime', blocks: [
      { id: 'block-2026-02-27-0', type: 'midday-flex', activity: { id: 'act-2026-02-27-0', name: 'Downtime', category: 'relaxation', description: 'Day 5: Beach, spa, prep for Hoi An', location: { name: 'Da Nang' }, duration: 60, bookingRequired: false, tags: ['Vietnam'] }, priority: 'if-energy', isLocked: false, notes: 'Day 5: Beach, spa, prep for Hoi An' },
    ]},
    { id: 'day-2026-02-28', date: '2026-02-28', dayNumber: 18, baseId: 'base-6', theme: 'Hoi An', blocks: [
      { id: 'block-2026-02-28-0', type: 'transit', activity: { id: 'act-2026-02-28-0', name: 'Short drive (~45 min)', category: 'transit', description: 'Day 6: Hotel move midday', location: { name: 'Hoi An' }, duration: 60, bookingRequired: false, tags: ['Vietnam'] }, priority: 'if-energy', isLocked: false, notes: 'Day 6: Hotel move midday' },
      { id: 'block-2026-02-28-1', type: 'evening-vibe', activity: { id: 'act-2026-02-28-1', name: 'Grand Sunrise Palace (5 nights)', category: 'accommodation', description: 'Day 6: Lantern Night in evening', location: { name: 'Hoi An' }, duration: 60, cost: { amount: 739, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Vietnam'] }, priority: 'must-see', isLocked: false, notes: 'Day 6: Lantern Night in evening' },
    ]},
    { id: 'day-2026-03-01', date: '2026-03-01', dayNumber: 19, baseId: '', theme: 'My Son Ruins', blocks: [
      { id: 'block-2026-03-01-0', type: 'morning-anchor', activity: { id: 'act-2026-03-01-0', name: 'My Son Ruins', category: 'activity', description: 'Day 7: Ancient Cham temples, morning visit', location: { name: 'Hoi An' }, duration: 60, bookingRequired: false, tags: ['Vietnam'] }, priority: 'if-energy', isLocked: false, notes: 'Day 7: Ancient Cham temples, morning visit' },
    ]},
    { id: 'day-2026-03-02', date: '2026-03-02', dayNumber: 20, baseId: '', theme: 'An Bang Beach', blocks: [
      { id: 'block-2026-03-02-0', type: 'morning-anchor', activity: { id: 'act-2026-03-02-0', name: 'An Bang Beach', category: 'activity', description: 'Day 8: Beach day, seafood lunch', location: { name: 'Hoi An' }, duration: 60, bookingRequired: false, tags: ['Vietnam'] }, priority: 'if-energy', isLocked: false, notes: 'Day 8: Beach day, seafood lunch' },
    ]},
    { id: 'day-2026-03-03', date: '2026-03-03', dayNumber: 21, baseId: '', theme: 'Water Buffalo Village', blocks: [
      { id: 'block-2026-03-03-0', type: 'morning-anchor', activity: { id: 'act-2026-03-03-0', name: 'Water Buffalo Village', category: 'activity', description: 'Day 9: Rural experience, Thu Bon River boat ride', location: { name: 'Hoi An' }, duration: 60, bookingRequired: false, tags: ['Vietnam'] }, priority: 'if-energy', isLocked: false, notes: 'Day 9: Rural experience, Thu Bon River boat ride' },
    ]},
    { id: 'day-2026-03-04', date: '2026-03-04', dayNumber: 22, baseId: '', theme: 'Tailoring & Slow Day', blocks: [
      { id: 'block-2026-03-04-0', type: 'midday-flex', activity: { id: 'act-2026-03-04-0', name: 'Tailoring & Slow Day', category: 'relaxation', description: 'Day 10: Final fittings, cafe hopping, slow night', location: { name: 'Hoi An' }, duration: 60, bookingRequired: false, tags: ['Vietnam'] }, priority: 'if-energy', isLocked: false, notes: 'Day 10: Final fittings, cafe hopping, slow night' },
    ]},
    { id: 'day-2026-03-05', date: '2026-03-05', dayNumber: 23, baseId: 'base-7', theme: 'Osaka', blocks: [
      { id: 'block-2026-03-05-0', type: 'transit', activity: { id: 'act-2026-03-05-0', name: 'VietJet DAD→KIX', category: 'flight', description: '~5hr flight', location: { name: 'Osaka' }, duration: 300, cost: { amount: 450, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Japan'] }, priority: 'must-see', isLocked: false, notes: '~5hr flight' },
      { id: 'block-2026-03-05-1', type: 'evening-vibe', activity: { id: 'act-2026-03-05-1', name: 'TBD Osaka Hotel (3 nights)', category: 'accommodation', description: 'Day 1: Check-in, casual food crawl Dotonbori', location: { name: 'Osaka' }, duration: 60, cost: { amount: 450, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Japan'] }, priority: 'must-see', isLocked: false, notes: 'Day 1: Check-in, casual food crawl Dotonbori' },
    ]},
    { id: 'day-2026-03-06', date: '2026-03-06', dayNumber: 24, baseId: '', theme: 'Universal Studios Japan', blocks: [
      { id: 'block-2026-03-06-0', type: 'morning-anchor', activity: { id: 'act-2026-03-06-0', name: 'Universal Studios Japan', category: 'activity', description: 'Day 2: FULL DAY - no other commitments', location: { name: 'Osaka' }, duration: 60, bookingRequired: false, tags: ['Japan'] }, priority: 'if-energy', isLocked: false, notes: 'Day 2: FULL DAY - no other commitments' },
    ]},
    { id: 'day-2026-03-07', date: '2026-03-07', dayNumber: 25, baseId: '', theme: 'Chill Day', blocks: [
      { id: 'block-2026-03-07-0', type: 'midday-flex', activity: { id: 'act-2026-03-07-0', name: 'Chill Day', category: 'relaxation', description: 'Day 3: Dotonbori, local neighborhoods, zero pressure', location: { name: 'Osaka' }, duration: 60, bookingRequired: false, tags: ['Japan'] }, priority: 'if-energy', isLocked: false, notes: 'Day 3: Dotonbori, local neighborhoods, zero pressure' },
    ]},
    { id: 'day-2026-03-08', date: '2026-03-08', dayNumber: 26, baseId: 'base-8', theme: 'Onsen', blocks: [
      { id: 'block-2026-03-08-0', type: 'transit', activity: { id: 'act-2026-03-08-0', name: 'To ryokan/onsen town', category: 'transit', description: 'Day 4: Early arrival, settle in', location: { name: 'Onsen' }, duration: 60, cost: { amount: 100, currency: 'USD', isEstimate: false }, bookingRequired: false, tags: ['Japan'] }, priority: 'if-energy', isLocked: false, notes: 'Day 4: Early arrival, settle in' },
      { id: 'block-2026-03-08-1', type: 'evening-vibe', activity: { id: 'act-2026-03-08-1', name: 'TBD Traditional Ryokan', category: 'accommodation', description: 'Day 4: Long soak, kaiseki dinner', location: { name: 'Onsen Town' }, duration: 60, cost: { amount: 400, currency: 'USD', isEstimate: false }, bookingRequired: false, tags: ['Japan'] }, priority: 'if-energy', isLocked: false, notes: 'Day 4: Long soak, kaiseki dinner' },
    ]},
    { id: 'day-2026-03-09', date: '2026-03-09', dayNumber: 27, baseId: 'base-9', theme: 'Tokyo', blocks: [
      { id: 'block-2026-03-09-0', type: 'transit', activity: { id: 'act-2026-03-09-0', name: 'Late checkout, easy train', category: 'transit', description: 'Day 5: Onsen morning, travel afternoon', location: { name: 'Tokyo' }, duration: 60, bookingRequired: false, tags: ['Japan'] }, priority: 'if-energy', isLocked: false, notes: 'Day 5: Onsen morning, travel afternoon' },
      { id: 'block-2026-03-09-1', type: 'evening-vibe', activity: { id: 'act-2026-03-09-1', name: 'Grand Nikko Tokyo (9 nights)', category: 'accommodation', description: 'Day 5: Hotel settle-in only, light evening', location: { name: 'Tokyo' }, duration: 60, cost: { amount: 2596, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Japan'] }, priority: 'must-see', isLocked: false, notes: 'Day 5: Hotel settle-in only, light evening' },
    ]},
    { id: 'day-2026-03-10', date: '2026-03-10', dayNumber: 28, baseId: '', theme: 'DisneySea Day 1', blocks: [
      { id: 'block-2026-03-10-0', type: 'morning-anchor', activity: { id: 'act-2026-03-10-0', name: 'DisneySea Day 1', category: 'activity', description: 'Day 6: Full day at DisneySea', location: { name: 'Tokyo' }, duration: 60, bookingRequired: false, tags: ['Japan'] }, priority: 'if-energy', isLocked: false, notes: 'Day 6: Full day at DisneySea' },
    ]},
    { id: 'day-2026-03-11', date: '2026-03-11', dayNumber: 29, baseId: '', theme: 'DisneySea Day 2', blocks: [
      { id: 'block-2026-03-11-0', type: 'morning-anchor', activity: { id: 'act-2026-03-11-0', name: 'DisneySea Day 2', category: 'activity', description: 'Day 7: Full day at DisneySea', location: { name: 'Tokyo' }, duration: 60, bookingRequired: false, tags: ['Japan'] }, priority: 'if-energy', isLocked: false, notes: 'Day 7: Full day at DisneySea' },
    ]},
    { id: 'day-2026-03-12', date: '2026-03-12', dayNumber: 30, baseId: '', theme: 'DisneySea Day 3', blocks: [
      { id: 'block-2026-03-12-0', type: 'morning-anchor', activity: { id: 'act-2026-03-12-0', name: 'DisneySea Day 3', category: 'activity', description: 'Day 8: Full day at DisneySea - no stacking', location: { name: 'Tokyo' }, duration: 60, bookingRequired: false, tags: ['Japan'] }, priority: 'if-energy', isLocked: false, notes: 'Day 8: Full day at DisneySea - no stacking' },
    ]},
    { id: 'day-2026-03-13', date: '2026-03-13', dayNumber: 31, baseId: '', theme: 'Harry Potter Studio Tour', blocks: [
      { id: 'block-2026-03-13-0', type: 'morning-anchor', activity: { id: 'act-2026-03-13-0', name: 'Harry Potter Studio Tour', category: 'activity', description: 'Day 9: Single major experience, relaxed evening', location: { name: 'Tokyo' }, duration: 60, bookingRequired: false, tags: ['Japan'] }, priority: 'if-energy', isLocked: false, notes: 'Day 9: Single major experience, relaxed evening' },
    ]},
    { id: 'day-2026-03-14', date: '2026-03-14', dayNumber: 32, baseId: '', theme: 'Sumo Experience', blocks: [
      { id: 'block-2026-03-14-0', type: 'morning-anchor', activity: { id: 'act-2026-03-14-0', name: 'Sumo Experience', category: 'activity', description: 'Day 10: Morning event, afternoon free', location: { name: 'Tokyo' }, duration: 60, bookingRequired: false, tags: ['Japan'] }, priority: 'if-energy', isLocked: false, notes: 'Day 10: Morning event, afternoon free' },
    ]},
    { id: 'day-2026-03-15', date: '2026-03-15', dayNumber: 33, baseId: '', theme: 'Pottery & Sword Making', blocks: [
      { id: 'block-2026-03-15-0', type: 'morning-anchor', activity: { id: 'act-2026-03-15-0', name: 'Pottery & Sword Making', category: 'activity', description: 'Day 11: Hands-on creative day, memorable', location: { name: 'Tokyo' }, duration: 60, bookingRequired: false, tags: ['Japan'] }, priority: 'if-energy', isLocked: false, notes: 'Day 11: Hands-on creative day, memorable' },
    ]},
    { id: 'day-2026-03-16', date: '2026-03-16', dayNumber: 34, baseId: '', theme: 'Buffer Day 1', blocks: [
      { id: 'block-2026-03-16-0', type: 'midday-flex', activity: { id: 'act-2026-03-16-0', name: 'Buffer Day 1', category: 'relaxation', description: 'Day 12: Shopping, neighborhood wandering', location: { name: 'Tokyo' }, duration: 60, bookingRequired: false, tags: ['Japan'] }, priority: 'if-energy', isLocked: false, notes: 'Day 12: Shopping, neighborhood wandering' },
    ]},
    { id: 'day-2026-03-17', date: '2026-03-17', dayNumber: 35, baseId: '', theme: 'Buffer Day 2', blocks: [
      { id: 'block-2026-03-17-0', type: 'midday-flex', activity: { id: 'act-2026-03-17-0', name: 'Buffer Day 2', category: 'relaxation', description: 'Day 13: Recovery, pack for long flight', location: { name: 'Tokyo' }, duration: 60, bookingRequired: false, tags: ['Japan'] }, priority: 'if-energy', isLocked: false, notes: 'Day 13: Recovery, pack for long flight' },
    ]},
    { id: 'day-2026-03-18', date: '2026-03-18', dayNumber: 36, baseId: 'base-10', theme: 'Honolulu', blocks: [
      { id: 'block-2026-03-18-0', type: 'transit', startTime: '21:00', activity: { id: 'act-2026-03-18-0', name: 'ANA NRT→HNL 9:00pm-9:10am', category: 'flight', description: '7hr, cross date line, premium economy', location: { name: 'Honolulu' }, duration: 420, cost: { amount: 2125, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['USA'], scheduledTime: '21:00' }, priority: 'must-see', isLocked: false, notes: '7hr, cross date line, premium economy' },
      { id: 'block-2026-03-18-1', type: 'evening-vibe', activity: { id: 'act-2026-03-18-1', name: 'AirBnB Waikiki/North Shore (14 nights)', category: 'accommodation', description: 'Day 1: Recovery day - treat as rest', location: { name: 'Honolulu' }, duration: 60, cost: { amount: 3024, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['USA'] }, priority: 'must-see', isLocked: false, notes: 'Day 1: Recovery day - treat as rest' },
    ]},
    { id: 'day-2026-03-19', date: '2026-03-19', dayNumber: 37, baseId: '', theme: 'Settle In', blocks: [
      { id: 'block-2026-03-19-0', type: 'midday-flex', activity: { id: 'act-2026-03-19-0', name: 'Settle In', category: 'relaxation', description: 'Day 2: Beach, food, adjust to island time', location: { name: 'Oahu' }, duration: 60, bookingRequired: false, tags: ['USA'] }, priority: 'if-energy', isLocked: false, notes: 'Day 2: Beach, food, adjust to island time' },
    ]},
    { id: 'day-2026-03-20', date: '2026-03-20', dayNumber: 38, baseId: '', theme: 'Pearl Harbor', blocks: [
      { id: 'block-2026-03-20-0', type: 'morning-anchor', activity: { id: 'act-2026-03-20-0', name: 'Pearl Harbor', category: 'activity', description: 'Day 3: Memorial visit, historical day', location: { name: 'Oahu' }, duration: 60, bookingRequired: false, tags: ['USA'] }, priority: 'if-energy', isLocked: false, notes: 'Day 3: Memorial visit, historical day' },
    ]},
    { id: 'day-2026-03-21', date: '2026-03-21', dayNumber: 39, baseId: '', theme: 'Kaena Point', blocks: [
      { id: 'block-2026-03-21-0', type: 'morning-anchor', activity: { id: 'act-2026-03-21-0', name: 'Kaena Point', category: 'activity', description: 'Day 4: Coastal hike, nature', location: { name: 'Oahu' }, duration: 60, bookingRequired: false, tags: ['USA'] }, priority: 'if-energy', isLocked: false, notes: 'Day 4: Coastal hike, nature' },
    ]},
    { id: 'day-2026-03-22', date: '2026-03-22', dayNumber: 40, baseId: '', theme: 'Whale Watching', blocks: [
      { id: 'block-2026-03-22-0', type: 'morning-anchor', activity: { id: 'act-2026-03-22-0', name: 'Whale Watching', category: 'activity', description: 'Day 5: Seasonal whale watching tour', location: { name: 'Oahu' }, duration: 60, bookingRequired: false, tags: ['USA'] }, priority: 'if-energy', isLocked: false, notes: 'Day 5: Seasonal whale watching tour' },
    ]},
    { id: 'day-2026-04-01', date: '2026-04-01', dayNumber: 50, baseId: '', theme: 'Vancouver', blocks: [
      { id: 'block-2026-04-01-0', type: 'transit', startTime: '13:00', activity: { id: 'act-2026-04-01-0', name: 'Air Canada HNL→YVR 1:00pm-9:56pm', category: 'flight', description: '6hr, premium economy', location: { name: 'Vancouver' }, duration: 360, cost: { amount: 2342, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['USA'], scheduledTime: '13:00' }, priority: 'must-see', isLocked: false, notes: '6hr, premium economy' },
      { id: 'block-2026-04-01-1', type: 'transit', activity: { id: 'act-2026-04-01-1', name: 'Westjet YVR→YLW', category: 'flight', description: 'Connection home', location: { name: 'Kelowna' }, duration: 120, bookingRequired: true, tags: ['Canada'] }, priority: 'must-see', isLocked: false, notes: 'Connection home' },
    ]},
  ],
  foodLayer: [],
  hobbyLayer: [],
  packingLayer: {
    bagSize: 'large',
    bagSizeRationale: 'Extended 50-day trip. A large bag (70L+) is recommended. Plan to do laundry every 5-7 days. For very long trips, consider shipping items home midway.',
    capsuleWardrobe: [
      { item: 'Underwear', quantity: 7, notes: 'Quick-dry preferred for easy washing' },
      { item: 'Socks', quantity: 5 },
      { item: 'T-shirts/tops', quantity: 7, notes: 'Light colors, breathable' },
      { item: 'Shorts', quantity: 4 },
      { item: 'Light pants/skirts', quantity: 2, notes: 'For temples, nicer restaurants' },
      { item: 'Light jacket/cardigan', quantity: 1, notes: 'For AC and evening' },
      { item: 'Sleepwear', quantity: 2 },
      { item: 'Walking shoes', quantity: 1, notes: 'Comfortable, broken-in' },
      { item: 'Sandals/flip flops', quantity: 1 },
    ],
    activitySpecific: [],
    electronics: [
      { item: 'Phone + charger', quantity: 1, essential: true },
      { item: 'Universal power adapter', quantity: 1, essential: true },
      { item: 'Portable battery pack', quantity: 1, essential: true, notes: '10,000+ mAh recommended' },
      { item: 'Laptop/tablet', quantity: 1, essential: false, notes: 'For longer trips' },
      { item: 'Earbuds/headphones', quantity: 1, essential: false },
      { item: 'E-reader', quantity: 1, essential: false, notes: 'Better than packing books' },
    ],
    toiletries: [
      { item: 'Toothbrush + toothpaste', quantity: 1, essential: true },
      { item: 'Deodorant', quantity: 1, essential: true },
      { item: 'Sunscreen', quantity: 1, essential: true },
      { item: 'Medications (personal)', quantity: 1, essential: true, notes: 'Keep in carry-on' },
      { item: 'Lip balm with SPF', quantity: 1, essential: false },
      { item: 'Anti-chafing product', quantity: 1, essential: false, notes: 'Essential for humid climates' },
      { item: 'Insect repellent', quantity: 1, essential: true },
      { item: 'Laundry detergent strips', quantity: 1, essential: false, notes: 'For sink washing' },
      { item: 'Basic first aid (bandaids, pain reliever)', quantity: 1, essential: true },
      { item: 'Hand sanitizer', quantity: 1, essential: true },
    ],
    documents: [
      { item: 'Passport', quantity: 1, essential: true, notes: 'Check validity (6+ months)' },
      { item: 'Passport copies (digital + paper)', quantity: 1, essential: true },
      { item: 'Travel insurance docs', quantity: 1, essential: true },
      { item: 'Credit cards (2+)', quantity: 1, essential: true, notes: 'Keep in separate places' },
      { item: 'Emergency cash (USD)', quantity: 1, essential: true },
      { item: 'Flight/hotel confirmations', quantity: 1, essential: true, notes: 'Digital or printed' },
      { item: 'Vaccination records', quantity: 1, essential: false, notes: 'If required' },
    ],
    doNotBring: [
      { item: 'Too many "just in case" items', reason: 'You can buy most things at your destination' },
      { item: 'Valuable jewelry', reason: 'Risk of loss or theft' },
      { item: 'Full-size toiletries', reason: 'Travel sizes are lighter, most hotels provide basics' },
      { item: 'Heavy books', reason: 'Use e-reader or buy/trade books locally' },
      { item: 'Heavy jeans', reason: 'Too hot and takes forever to dry' },
      { item: 'Dark colored clothes', reason: 'Absorb heat, show sweat stains' },
      { item: 'Cotton towels', reason: 'Take too long to dry in humidity' },
      { item: 'Coins for tipping', reason: 'Tipping is not customary in Japan' },
    ],
    climateNotes: 'Tropical climate - expect heat and humidity. Light, breathable fabrics recommended (cotton, linen, moisture-wicking). Rain is common - pack a compact umbrella or rain jacket. High humidity - quick-dry fabrics are your friend.',
  },
  aiMeta: {
    routeRationale: 'Imported from travel CSV',
    priorityRanking: [],
    generatedAt: new Date('2026-01-02T20:35:14.492Z'),
    modelUsed: 'csv-import',
  },
  userEdits: [],
};

// Function to load sample trip into storage
export async function loadSampleTrip() {
  const { tripDb } = await import('@/lib/db/indexed-db');

  localStorage.setItem(`trip-dna-${sampleTripDna.id}`, JSON.stringify(sampleTripDna));
  localStorage.setItem(`itinerary-${sampleTripDna.id}`, JSON.stringify(sampleItinerary));

  // Save to IndexedDB so it appears on homepage
  await tripDb.save({
    id: sampleTripDna.id,
    tripDna: sampleTripDna,
    itinerary: sampleItinerary,
    createdAt: new Date(),
    updatedAt: new Date(),
    syncedAt: null,
    status: 'generated',
  });

  return sampleTripDna.id;
}
