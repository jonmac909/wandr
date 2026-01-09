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
    hobbies: ['photography', 'meditation'],
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
    endDate: '2026-04-04',
    totalDays: 53,
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
      { id: 'base-1', location: 'Tokyo Narita', accommodation: { name: 'Hotel Nikko Narita', type: 'hotel', priceRange: '$$' }, nights: 1, checkIn: '2026-02-12', checkOut: '2026-02-13', rationale: 'Layover in Tokyo Narita, Japan' },
      { id: 'base-2', location: 'Bangkok', accommodation: { name: 'The Park Nine', type: 'hotel', priceRange: '$$' }, nights: 1, checkIn: '2026-02-13', checkOut: '2026-02-14', rationale: 'Overnight in Bangkok, Thailand' },
      { id: 'base-3', location: 'Chiang Mai', accommodation: { name: 'North Hill City Resort', type: 'hotel', priceRange: '$$' }, nights: 4, checkIn: '2026-02-14', checkOut: '2026-02-18', rationale: 'Stay in Chiang Mai, Thailand' },
      { id: 'base-4', location: 'Chiang Rai', accommodation: { name: 'TBD Chiang Rai Hotel', type: 'hotel', priceRange: '$$' }, nights: 3, checkIn: '2026-02-18', checkOut: '2026-02-21', rationale: 'Stay in Chiang Rai, Thailand' },
      { id: 'base-5', location: 'Phuket', accommodation: { name: 'Wyndham Grand Nai Harn', type: 'hotel', priceRange: '$$' }, nights: 8, checkIn: '2026-02-21', checkOut: '2026-03-01', rationale: 'Stay in Phuket, Thailand' },
      { id: 'base-6', location: 'Da Nang', accommodation: { name: 'Shilla Monogram Danang', type: 'hotel', priceRange: '$$' }, nights: 4, checkIn: '2026-03-01', checkOut: '2026-03-05', rationale: 'Stay in Da Nang, Vietnam' },
      { id: 'base-7', location: 'Hoi An', accommodation: { name: 'Grand Sunrise Palace', type: 'hotel', priceRange: '$$' }, nights: 4, checkIn: '2026-03-05', checkOut: '2026-03-09', rationale: 'Stay in Hoi An, Vietnam' },
      { id: 'base-8', location: 'Osaka', accommodation: { name: 'TBD Osaka Hotel', type: 'hotel', priceRange: '$$' }, nights: 3, checkIn: '2026-03-09', checkOut: '2026-03-12', rationale: 'Stay in Osaka, Japan' },
      { id: 'base-9', location: 'Hakone', accommodation: { name: 'TBD Traditional Ryokan', type: 'ryokan', priceRange: '$$' }, nights: 2, checkIn: '2026-03-12', checkOut: '2026-03-14', rationale: 'Stay in Hakone, Japan' },
      { id: 'base-10', location: 'Tokyo', accommodation: { name: 'Grand Nikko Tokyo', type: 'hotel', priceRange: '$$' }, nights: 7, checkIn: '2026-03-14', checkOut: '2026-03-21', rationale: 'Stay in Tokyo, Japan' },
      { id: 'base-11', location: 'Honolulu', accommodation: { name: 'AirBnB Waikiki/North Shore', type: 'hotel', priceRange: '$$' }, nights: 14, checkIn: '2026-03-21', checkOut: '2026-04-04', rationale: 'Stay in Honolulu, USA' },
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
    // Day 1: Feb 11 - Travel from Canada
    { id: 'day-2026-02-11', date: '2026-02-11', dayNumber: 1, baseId: '', theme: 'Vancouver', blocks: [
      { id: 'block-2026-02-11-0', type: 'transit', startTime: '06:00', activity: { id: 'act-2026-02-11-0', name: 'Westjet YLW→YVR 6:00am-7:15am', category: 'flight', description: 'Connection flight', location: { name: 'Vancouver' }, duration: 75, cost: { amount: 136, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Canada'], scheduledTime: '06:00', reservationStatus: 'not-started' }, priority: 'must-see', isLocked: false, notes: 'Connection flight' },
      { id: 'block-2026-02-11-1', type: 'transit', startTime: '09:50', activity: { id: 'act-2026-02-11-1', name: 'Zipair YVR→NRT 9:50am-1:00pm+1', category: 'flight', description: '10hr flight, flat seats', location: { name: 'Tokyo' }, duration: 600, cost: { amount: 4225, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Transit'], scheduledTime: '09:50', tips: ['10hr 10min direct flight'] }, priority: 'must-see', isLocked: false, notes: '10hr flight, flat seats' },
    ]},
    // Day 2: Feb 12 - Tokyo Narita layover
    { id: 'day-2026-02-12', date: '2026-02-12', dayNumber: 2, baseId: 'base-1', theme: 'Tokyo Narita', blocks: [
      { id: 'block-2026-02-12-0', type: 'evening-vibe', activity: { id: 'act-2026-02-12-0', name: 'Hotel Nikko Narita', category: 'accommodation', description: 'Layover night, rest', location: { name: 'Tokyo Narita' }, duration: 60, cost: { amount: 74, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Japan'], reservationStatus: 'not-started' }, priority: 'must-see', isLocked: false, notes: 'Layover night, rest' },
    ]},
    // Day 3: Feb 13 - Bangkok
    { id: 'day-2026-02-13', date: '2026-02-13', dayNumber: 3, baseId: 'base-2', theme: 'Bangkok', blocks: [
      { id: 'block-2026-02-13-0', type: 'transit', startTime: '17:00', activity: { id: 'act-2026-02-13-0', name: 'Zipair NRT→BKK 5:00pm-10:15pm', category: 'flight', description: '7hr flight, flat seats', location: { name: 'Bangkok' }, duration: 420, cost: { amount: 1731, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Transit'], scheduledTime: '17:00', tips: ['7hr flight, flat seats'] }, priority: 'must-see', isLocked: false, notes: '7hr flight, flat seats' },
      { id: 'block-2026-02-13-1', type: 'evening-vibe', activity: { id: 'act-2026-02-13-1', name: 'The Park Nine', category: 'accommodation', description: 'Arrive late, light food, massage, early night', location: { name: 'Bangkok' }, duration: 60, cost: { amount: 36, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Thailand'] }, priority: 'must-see', isLocked: false, notes: 'Arrive late, light food, massage, early night' },
    ]},
    // Day 4: Feb 14 - Arrive Chiang Mai (night 1 of 4)
    { id: 'day-2026-02-14', date: '2026-02-14', dayNumber: 4, baseId: 'base-3', theme: 'Chiang Mai', blocks: [
      { id: 'block-2026-02-14-0', type: 'transit', startTime: '12:35', activity: { id: 'act-2026-02-14-0', name: 'AirAsia BKK→CNX 12:35pm-2:00pm', category: 'flight', description: '1.5hr flight, economy', location: { name: 'Chiang Mai' }, duration: 85, cost: { amount: 117, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Thailand'], scheduledTime: '12:35', tips: ['1.5hr flight'] }, priority: 'must-see', isLocked: false, notes: '1.5hr flight, economy' },
      { id: 'block-2026-02-14-1', type: 'evening-vibe', activity: { id: 'act-2026-02-14-1', name: 'North Hill City Resort (4 nights)', category: 'accommodation', description: 'Check-in, explore Old City, evening massage', location: { name: 'Chiang Mai' }, duration: 60, cost: { amount: 552, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Thailand'] }, priority: 'must-see', isLocked: false, notes: 'Check-in, explore Old City, evening massage' },
    ]},
    // Day 5: Feb 15 - Chiang Mai (night 2 of 4)
    { id: 'day-2026-02-15', date: '2026-02-15', dayNumber: 5, baseId: 'base-3', theme: 'Ethical Elephant Sanctuary', blocks: [
      { id: 'block-2026-02-15-0', type: 'morning-anchor', activity: { id: 'act-2026-02-15-0', name: 'Ethical Elephant Sanctuary', category: 'activity', description: 'Morning elephants, afternoon cafe hopping', location: { name: 'Chiang Mai' }, duration: 240, bookingRequired: true, tags: ['Thailand'] }, priority: 'must-see', isLocked: false, notes: 'Morning elephants, afternoon cafe hopping' },
    ]},
    // Day 6: Feb 16 - Chiang Mai (night 3 of 4)
    { id: 'day-2026-02-16', date: '2026-02-16', dayNumber: 6, baseId: 'base-3', theme: 'Temples & Culture', blocks: [
      { id: 'block-2026-02-16-0', type: 'morning-anchor', activity: { id: 'act-2026-02-16-0', name: 'Temples & Culture', category: 'activity', description: 'Monk chat, temple visits, Khantoke dinner', location: { name: 'Chiang Mai' }, duration: 240, bookingRequired: false, tags: ['Thailand'] }, priority: 'if-energy', isLocked: false, notes: 'Monk chat, temple visits, Khantoke dinner' },
    ]},
    // Day 7: Feb 17 - Chiang Mai (night 4 of 4)
    { id: 'day-2026-02-17', date: '2026-02-17', dayNumber: 7, baseId: 'base-3', theme: 'Easy Day', blocks: [
      { id: 'block-2026-02-17-0', type: 'midday-flex', activity: { id: 'act-2026-02-17-0', name: 'Easy Day', category: 'relaxation', description: 'Sleep in, massages, local markets, pack for Chiang Rai', location: { name: 'Chiang Mai' }, duration: 60, bookingRequired: false, tags: ['Thailand'] }, priority: 'if-energy', isLocked: false, notes: 'Sleep in, massages, local markets, pack for Chiang Rai' },
    ]},
    // Day 8: Feb 18 - Travel to Chiang Rai (night 1 of 3)
    { id: 'day-2026-02-18', date: '2026-02-18', dayNumber: 8, baseId: 'base-4', theme: 'Chiang Rai', blocks: [
      { id: 'block-2026-02-18-0', type: 'transit', activity: { id: 'act-2026-02-18-0', name: 'Bus/Van Chiang Mai to Chiang Rai', category: 'transit', description: '3hr bus/van ride', location: { name: 'Chiang Rai' }, duration: 180, cost: { amount: 20, currency: 'USD', isEstimate: true }, bookingRequired: false, tags: ['Thailand'], tips: ['~3hr journey via GreenBus or private transfer'] }, priority: 'must-see', isLocked: false, notes: '3hr bus/van ride' },
      { id: 'block-2026-02-18-1', type: 'evening-vibe', activity: { id: 'act-2026-02-18-1', name: 'TBD Chiang Rai Hotel (3 nights)', category: 'accommodation', description: 'Check-in, explore Night Bazaar', location: { name: 'Chiang Rai' }, duration: 60, cost: { amount: 300, currency: 'USD', isEstimate: true }, bookingRequired: true, tags: ['Thailand'] }, priority: 'must-see', isLocked: false, notes: 'Check-in, explore Night Bazaar' },
    ]},
    // Day 9: Feb 19 - Chiang Rai (night 2 of 3)
    { id: 'day-2026-02-19', date: '2026-02-19', dayNumber: 9, baseId: 'base-4', theme: 'White Temple & Blue Temple', blocks: [
      { id: 'block-2026-02-19-0', type: 'morning-anchor', activity: { id: 'act-2026-02-19-0', name: 'White Temple & Blue Temple', category: 'sightseeing', description: 'Visit Wat Rong Khun and Wat Rong Suea Ten', location: { name: 'Chiang Rai' }, duration: 240, bookingRequired: false, tags: ['Thailand'] }, priority: 'must-see', isLocked: false, notes: 'Visit Wat Rong Khun and Wat Rong Suea Ten' },
    ]},
    // Day 10: Feb 20 - Chiang Rai (night 3 of 3)
    { id: 'day-2026-02-20', date: '2026-02-20', dayNumber: 10, baseId: 'base-4', theme: 'Golden Triangle', blocks: [
      { id: 'block-2026-02-20-0', type: 'morning-anchor', activity: { id: 'act-2026-02-20-0', name: 'Golden Triangle Day Trip', category: 'activity', description: 'Visit Golden Triangle, boat ride, local markets', location: { name: 'Chiang Rai' }, duration: 360, bookingRequired: false, tags: ['Thailand'] }, priority: 'if-energy', isLocked: false, notes: 'Visit Golden Triangle, boat ride, local markets' },
    ]},
    // Day 11: Feb 21 - Travel to Phuket (night 1 of 8)
    { id: 'day-2026-02-21', date: '2026-02-21', dayNumber: 11, baseId: 'base-5', theme: 'Phuket', blocks: [
      { id: 'block-2026-02-21-0', type: 'transit', activity: { id: 'act-2026-02-21-0', name: 'Flight Chiang Rai to Phuket', category: 'flight', description: 'CEI→HKT via BKK', location: { name: 'Phuket' }, duration: 240, cost: { amount: 150, currency: 'USD', isEstimate: true }, bookingRequired: true, tags: ['Thailand'], tips: ['~4hr total with connection'] }, priority: 'must-see', isLocked: false, notes: 'CEI→HKT via BKK' },
      { id: 'block-2026-02-21-1', type: 'evening-vibe', activity: { id: 'act-2026-02-21-1', name: 'Wyndham Grand Nai Harn (8 nights)', category: 'accommodation', description: 'Check-in, Old Town dinner, evening stroll', location: { name: 'Phuket' }, duration: 60, cost: { amount: 1800, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Thailand'] }, priority: 'must-see', isLocked: false, notes: 'Check-in, Old Town dinner, evening stroll' },
    ]},
    // Day 12: Feb 22 - Phuket (night 2 of 8)
    { id: 'day-2026-02-22', date: '2026-02-22', dayNumber: 12, baseId: 'base-5', theme: 'Nature Day', blocks: [
      { id: 'block-2026-02-22-0', type: 'morning-anchor', activity: { id: 'act-2026-02-22-0', name: 'Nature Day', category: 'activity', description: 'Cloud Forest, Cape Panwa sunset - quiet, scenic, slow', location: { name: 'Phuket' }, duration: 360, bookingRequired: false, tags: ['Thailand'] }, priority: 'if-energy', isLocked: false, notes: 'Cloud Forest, Cape Panwa sunset - quiet, scenic, slow' },
    ]},
    // Day 13: Feb 23 - Phuket (night 3 of 8)
    { id: 'day-2026-02-23', date: '2026-02-23', dayNumber: 13, baseId: 'base-5', theme: 'Wildlife Day', blocks: [
      { id: 'block-2026-02-23-0', type: 'morning-anchor', activity: { id: 'act-2026-02-23-0', name: 'Wildlife Day', category: 'activity', description: 'Whale watching morning, beach recovery afternoon', location: { name: 'Phuket' }, duration: 300, bookingRequired: true, tags: ['Thailand'] }, priority: 'if-energy', isLocked: false, notes: 'Whale watching morning, beach recovery afternoon' },
    ]},
    // Day 14: Feb 24 - Phuket (night 4 of 8)
    { id: 'day-2026-02-24', date: '2026-02-24', dayNumber: 14, baseId: 'base-5', theme: 'Phang Nga Bay', blocks: [
      { id: 'block-2026-02-24-0', type: 'morning-anchor', activity: { id: 'act-2026-02-24-0', name: 'Phang Nga Bay', category: 'activity', description: 'Limestone cliffs, kayaking, no crowds', location: { name: 'Koh Yao Noi' }, duration: 480, bookingRequired: true, tags: ['Thailand'] }, priority: 'must-see', isLocked: false, notes: 'Limestone cliffs, kayaking, no crowds' },
    ]},
    // Day 15: Feb 25 - Phuket (night 5 of 8)
    { id: 'day-2026-02-25', date: '2026-02-25', dayNumber: 15, baseId: 'base-5', theme: 'Beach Day', blocks: [
      { id: 'block-2026-02-25-0', type: 'midday-flex', activity: { id: 'act-2026-02-25-0', name: 'Beach Day', category: 'relaxation', description: 'Nai Harn Beach, pool, spa', location: { name: 'Phuket' }, duration: 360, bookingRequired: false, tags: ['Thailand'] }, priority: 'if-energy', isLocked: false, notes: 'Nai Harn Beach, pool, spa' },
    ]},
    // Day 16: Feb 26 - Phuket (night 6 of 8)
    { id: 'day-2026-02-26', date: '2026-02-26', dayNumber: 16, baseId: 'base-5', theme: 'Old Town Exploration', blocks: [
      { id: 'block-2026-02-26-0', type: 'midday-flex', activity: { id: 'act-2026-02-26-0', name: 'Old Town Exploration', category: 'sightseeing', description: 'Phuket Old Town, Sino-Portuguese architecture, cafes', location: { name: 'Phuket' }, duration: 300, bookingRequired: false, tags: ['Thailand'] }, priority: 'if-energy', isLocked: false, notes: 'Phuket Old Town, Sino-Portuguese architecture, cafes' },
    ]},
    // Day 17: Feb 27 - Phuket (night 7 of 8)
    { id: 'day-2026-02-27', date: '2026-02-27', dayNumber: 17, baseId: 'base-5', theme: 'Island Hopping', blocks: [
      { id: 'block-2026-02-27-0', type: 'morning-anchor', activity: { id: 'act-2026-02-27-0', name: 'Island Hopping', category: 'activity', description: 'Day trip to nearby islands', location: { name: 'Phuket' }, duration: 480, bookingRequired: true, tags: ['Thailand'] }, priority: 'if-energy', isLocked: false, notes: 'Day trip to nearby islands' },
    ]},
    // Day 18: Feb 28 - Phuket (night 8 of 8)
    { id: 'day-2026-02-28', date: '2026-02-28', dayNumber: 18, baseId: 'base-5', theme: 'Wrap-Up Day', blocks: [
      { id: 'block-2026-02-28-0', type: 'midday-flex', activity: { id: 'act-2026-02-28-0', name: 'Wrap-Up Day', category: 'relaxation', description: 'Lana Kingdom spa, pack calmly for Vietnam', location: { name: 'Phuket' }, duration: 240, bookingRequired: false, tags: ['Thailand'] }, priority: 'if-energy', isLocked: false, notes: 'Lana Kingdom spa, pack calmly for Vietnam' },
    ]},
    // Day 19: Mar 1 - Travel to Da Nang (night 1 of 4)
    { id: 'day-2026-03-01', date: '2026-03-01', dayNumber: 19, baseId: 'base-6', theme: 'Da Nang', blocks: [
      { id: 'block-2026-03-01-0', type: 'transit', activity: { id: 'act-2026-03-01-0', name: 'AirAsia HKT→DAD (1 stop DMK)', category: 'flight', description: '5hr total, economy', location: { name: 'Da Nang' }, duration: 300, cost: { amount: 508, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Vietnam'], tips: ['5hr total with layover in Bangkok'] }, priority: 'must-see', isLocked: false, notes: '5hr total, economy' },
      { id: 'block-2026-03-01-1', type: 'evening-vibe', activity: { id: 'act-2026-03-01-1', name: 'Shilla Monogram Danang (4 nights)', category: 'accommodation', description: 'Arrive, beach or room service, rest', location: { name: 'Da Nang' }, duration: 60, cost: { amount: 660, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Vietnam'] }, priority: 'must-see', isLocked: false, notes: 'Arrive, beach or room service, rest' },
    ]},
    // Day 20: Mar 2 - Da Nang (night 2 of 4)
    { id: 'day-2026-03-02', date: '2026-03-02', dayNumber: 20, baseId: 'base-6', theme: 'Marble Mountains', blocks: [
      { id: 'block-2026-03-02-0', type: 'morning-anchor', activity: { id: 'act-2026-03-02-0', name: 'Marble Mountains', category: 'activity', description: 'Morning exploration, afternoon beach', location: { name: 'Da Nang' }, duration: 240, bookingRequired: false, tags: ['Vietnam'] }, priority: 'if-energy', isLocked: false, notes: 'Morning exploration, afternoon beach' },
    ]},
    // Day 21: Mar 3 - Da Nang (night 3 of 4)
    { id: 'day-2026-03-03', date: '2026-03-03', dayNumber: 21, baseId: 'base-6', theme: 'Hai Van Pass', blocks: [
      { id: 'block-2026-03-03-0', type: 'morning-anchor', activity: { id: 'act-2026-03-03-0', name: 'Hai Van Pass', category: 'activity', description: 'Scenic drive/ride, coastal views', location: { name: 'Da Nang' }, duration: 360, bookingRequired: false, tags: ['Vietnam'] }, priority: 'if-energy', isLocked: false, notes: 'Scenic drive/ride, coastal views' },
    ]},
    // Day 22: Mar 4 - Da Nang (night 4 of 4)
    { id: 'day-2026-03-04', date: '2026-03-04', dayNumber: 22, baseId: 'base-6', theme: 'Beach & Cafes', blocks: [
      { id: 'block-2026-03-04-0', type: 'midday-flex', activity: { id: 'act-2026-03-04-0', name: 'Beach & Cafes', category: 'relaxation', description: "Built-in 'do nothing' time, local cafes, prep for Hoi An", location: { name: 'Da Nang' }, duration: 240, bookingRequired: false, tags: ['Vietnam'] }, priority: 'if-energy', isLocked: false, notes: "Built-in 'do nothing' time, local cafes" },
    ]},
    // Day 23: Mar 5 - Travel to Hoi An (night 1 of 4)
    { id: 'day-2026-03-05', date: '2026-03-05', dayNumber: 23, baseId: 'base-7', theme: 'Hoi An', blocks: [
      { id: 'block-2026-03-05-0', type: 'transit', activity: { id: 'act-2026-03-05-0', name: 'Short drive (~45 min)', category: 'transit', description: 'Hotel move midday', location: { name: 'Hoi An' }, duration: 60, bookingRequired: false, tags: ['Vietnam'] }, priority: 'if-energy', isLocked: false, notes: 'Hotel move midday' },
      { id: 'block-2026-03-05-1', type: 'evening-vibe', activity: { id: 'act-2026-03-05-1', name: 'Grand Sunrise Palace (4 nights)', category: 'accommodation', description: 'Lantern Night in evening', location: { name: 'Hoi An' }, duration: 60, cost: { amount: 590, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Vietnam'] }, priority: 'must-see', isLocked: false, notes: 'Lantern Night in evening' },
    ]},
    // Day 24: Mar 6 - Hoi An (night 2 of 4)
    { id: 'day-2026-03-06', date: '2026-03-06', dayNumber: 24, baseId: 'base-7', theme: 'My Son Ruins', blocks: [
      { id: 'block-2026-03-06-0', type: 'morning-anchor', activity: { id: 'act-2026-03-06-0', name: 'My Son Ruins', category: 'activity', description: 'Ancient Cham temples, morning visit', location: { name: 'Hoi An' }, duration: 300, bookingRequired: false, tags: ['Vietnam'] }, priority: 'if-energy', isLocked: false, notes: 'Ancient Cham temples, morning visit' },
    ]},
    // Day 25: Mar 7 - Hoi An (night 3 of 4)
    { id: 'day-2026-03-07', date: '2026-03-07', dayNumber: 25, baseId: 'base-7', theme: 'An Bang Beach', blocks: [
      { id: 'block-2026-03-07-0', type: 'morning-anchor', activity: { id: 'act-2026-03-07-0', name: 'An Bang Beach', category: 'activity', description: 'Beach day, seafood lunch', location: { name: 'Hoi An' }, duration: 360, bookingRequired: false, tags: ['Vietnam'] }, priority: 'if-energy', isLocked: false, notes: 'Beach day, seafood lunch' },
    ]},
    // Day 26: Mar 8 - Hoi An (night 4 of 4)
    { id: 'day-2026-03-08', date: '2026-03-08', dayNumber: 26, baseId: 'base-7', theme: 'Tailoring & Slow Day', blocks: [
      { id: 'block-2026-03-08-0', type: 'midday-flex', activity: { id: 'act-2026-03-08-0', name: 'Tailoring & Slow Day', category: 'relaxation', description: 'Final fittings, cafe hopping, slow night', location: { name: 'Hoi An' }, duration: 240, bookingRequired: false, tags: ['Vietnam'] }, priority: 'if-energy', isLocked: false, notes: 'Final fittings, cafe hopping, slow night' },
    ]},
    // Day 27: Mar 9 - Travel to Osaka (night 1 of 3)
    { id: 'day-2026-03-09', date: '2026-03-09', dayNumber: 27, baseId: 'base-8', theme: 'Osaka', blocks: [
      { id: 'block-2026-03-09-0', type: 'transit', activity: { id: 'act-2026-03-09-0', name: 'VietJet DAD→KIX', category: 'flight', description: '~5hr flight', location: { name: 'Osaka' }, duration: 300, cost: { amount: 450, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Japan'], tips: ['~5hr flight'] }, priority: 'must-see', isLocked: false, notes: '~5hr flight' },
      { id: 'block-2026-03-09-1', type: 'evening-vibe', activity: { id: 'act-2026-03-09-1', name: 'TBD Osaka Hotel (3 nights)', category: 'accommodation', description: 'Check-in, casual food crawl Dotonbori', location: { name: 'Osaka' }, duration: 60, cost: { amount: 450, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Japan'] }, priority: 'must-see', isLocked: false, notes: 'Check-in, casual food crawl Dotonbori' },
    ]},
    // Day 28: Mar 10 - Osaka (night 2 of 3)
    { id: 'day-2026-03-10', date: '2026-03-10', dayNumber: 28, baseId: 'base-8', theme: 'Universal Studios Japan', blocks: [
      { id: 'block-2026-03-10-0', type: 'morning-anchor', activity: { id: 'act-2026-03-10-0', name: 'Universal Studios Japan', category: 'activity', description: 'FULL DAY - no other commitments', location: { name: 'Osaka' }, duration: 600, bookingRequired: true, tags: ['Japan'] }, priority: 'must-see', isLocked: false, notes: 'FULL DAY - no other commitments' },
    ]},
    // Day 29: Mar 11 - Osaka (night 3 of 3)
    { id: 'day-2026-03-11', date: '2026-03-11', dayNumber: 29, baseId: 'base-8', theme: 'Chill Day', blocks: [
      { id: 'block-2026-03-11-0', type: 'midday-flex', activity: { id: 'act-2026-03-11-0', name: 'Chill Day', category: 'relaxation', description: 'Dotonbori, local neighborhoods, zero pressure', location: { name: 'Osaka' }, duration: 360, bookingRequired: false, tags: ['Japan'] }, priority: 'if-energy', isLocked: false, notes: 'Dotonbori, local neighborhoods, zero pressure' },
    ]},
    // Day 30: Mar 12 - Travel to Hakone (night 1 of 2)
    { id: 'day-2026-03-12', date: '2026-03-12', dayNumber: 30, baseId: 'base-9', theme: 'Hakone', blocks: [
      { id: 'block-2026-03-12-0', type: 'transit', activity: { id: 'act-2026-03-12-0', name: 'Shinkansen Osaka to Hakone', category: 'transit', description: 'Train to Hakone via Tokyo/Odawara', location: { name: 'Hakone' }, duration: 240, cost: { amount: 200, currency: 'USD', isEstimate: true }, bookingRequired: false, tags: ['Japan'], tips: ['~4hr journey with transfers'] }, priority: 'must-see', isLocked: false, notes: 'Train to Hakone via Tokyo/Odawara' },
      { id: 'block-2026-03-12-1', type: 'evening-vibe', activity: { id: 'act-2026-03-12-1', name: 'TBD Traditional Ryokan (2 nights)', category: 'accommodation', description: 'Check-in, long soak, kaiseki dinner', location: { name: 'Hakone' }, duration: 60, cost: { amount: 600, currency: 'USD', isEstimate: true }, bookingRequired: true, tags: ['Japan'] }, priority: 'must-see', isLocked: false, notes: 'Check-in, long soak, kaiseki dinner' },
    ]},
    // Day 31: Mar 13 - Hakone (night 2 of 2)
    { id: 'day-2026-03-13', date: '2026-03-13', dayNumber: 31, baseId: 'base-9', theme: 'Onsen & Mt Fuji Views', blocks: [
      { id: 'block-2026-03-13-0', type: 'morning-anchor', activity: { id: 'act-2026-03-13-0', name: 'Onsen & Mt Fuji Views', category: 'relaxation', description: 'Hakone exploration, ropeway, lake cruise, onsen', location: { name: 'Hakone' }, duration: 480, bookingRequired: false, tags: ['Japan'] }, priority: 'must-see', isLocked: false, notes: 'Hakone exploration, ropeway, lake cruise, onsen' },
    ]},
    // Day 32: Mar 14 - Travel to Tokyo (night 1 of 7)
    { id: 'day-2026-03-14', date: '2026-03-14', dayNumber: 32, baseId: 'base-10', theme: 'Tokyo', blocks: [
      { id: 'block-2026-03-14-0', type: 'transit', activity: { id: 'act-2026-03-14-0', name: 'Late checkout, train to Tokyo', category: 'transit', description: 'Onsen morning, travel afternoon', location: { name: 'Tokyo' }, duration: 120, bookingRequired: false, tags: ['Japan'], tips: ['~1.5hr train from Hakone'] }, priority: 'if-energy', isLocked: false, notes: 'Onsen morning, travel afternoon' },
      { id: 'block-2026-03-14-1', type: 'evening-vibe', activity: { id: 'act-2026-03-14-1', name: 'Grand Nikko Tokyo (7 nights)', category: 'accommodation', description: 'Hotel settle-in only, light evening', location: { name: 'Tokyo' }, duration: 60, cost: { amount: 2000, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['Japan'] }, priority: 'must-see', isLocked: false, notes: 'Hotel settle-in only, light evening' },
    ]},
    // Day 33: Mar 15 - Tokyo (night 2 of 7) - DisneySea Day 1
    { id: 'day-2026-03-15', date: '2026-03-15', dayNumber: 33, baseId: 'base-10', theme: 'DisneySea Day 1', blocks: [
      { id: 'block-2026-03-15-0', type: 'morning-anchor', activity: { id: 'act-2026-03-15-0', name: 'DisneySea Day 1', category: 'activity', description: 'Full day at DisneySea', location: { name: 'Tokyo' }, duration: 720, bookingRequired: true, tags: ['Japan'] }, priority: 'must-see', isLocked: false, notes: 'Full day at DisneySea' },
    ]},
    // Day 34: Mar 16 - Tokyo (night 3 of 7) - DisneySea Day 2
    { id: 'day-2026-03-16', date: '2026-03-16', dayNumber: 34, baseId: 'base-10', theme: 'DisneySea Day 2', blocks: [
      { id: 'block-2026-03-16-0', type: 'morning-anchor', activity: { id: 'act-2026-03-16-0', name: 'DisneySea Day 2', category: 'activity', description: 'Full day at DisneySea', location: { name: 'Tokyo' }, duration: 720, bookingRequired: true, tags: ['Japan'] }, priority: 'must-see', isLocked: false, notes: 'Full day at DisneySea' },
    ]},
    // Day 35: Mar 17 - Tokyo (night 4 of 7) - DisneySea Day 3
    { id: 'day-2026-03-17', date: '2026-03-17', dayNumber: 35, baseId: 'base-10', theme: 'DisneySea Day 3', blocks: [
      { id: 'block-2026-03-17-0', type: 'morning-anchor', activity: { id: 'act-2026-03-17-0', name: 'DisneySea Day 3', category: 'activity', description: 'Full day at DisneySea - no stacking', location: { name: 'Tokyo' }, duration: 720, bookingRequired: true, tags: ['Japan'] }, priority: 'must-see', isLocked: false, notes: 'Full day at DisneySea - no stacking' },
    ]},
    // Day 36: Mar 18 - Tokyo (night 5 of 7) - Harry Potter
    { id: 'day-2026-03-18', date: '2026-03-18', dayNumber: 36, baseId: 'base-10', theme: 'Harry Potter Studio Tour', blocks: [
      { id: 'block-2026-03-18-0', type: 'morning-anchor', activity: { id: 'act-2026-03-18-0', name: 'Harry Potter Studio Tour', category: 'activity', description: 'Single major experience, relaxed evening', location: { name: 'Tokyo' }, duration: 360, bookingRequired: true, tags: ['Japan'] }, priority: 'must-see', isLocked: false, notes: 'Single major experience, relaxed evening' },
    ]},
    // Day 37: Mar 19 - Tokyo (night 6 of 7) - Sumo & Culture
    { id: 'day-2026-03-19', date: '2026-03-19', dayNumber: 37, baseId: 'base-10', theme: 'Sumo & Culture', blocks: [
      { id: 'block-2026-03-19-0', type: 'morning-anchor', activity: { id: 'act-2026-03-19-0', name: 'Sumo Experience', category: 'activity', description: 'Morning event, afternoon free', location: { name: 'Tokyo' }, duration: 240, bookingRequired: true, tags: ['Japan'] }, priority: 'if-energy', isLocked: false, notes: 'Morning event, afternoon free' },
      { id: 'block-2026-03-19-1', type: 'midday-flex', activity: { id: 'act-2026-03-19-1', name: 'Pottery & Sword Making', category: 'activity', description: 'Hands-on creative experience', location: { name: 'Tokyo' }, duration: 240, bookingRequired: true, tags: ['Japan'] }, priority: 'if-energy', isLocked: false, notes: 'Hands-on creative day, memorable' },
    ]},
    // Day 38: Mar 20 - Tokyo (night 7 of 7) - Buffer Day
    { id: 'day-2026-03-20', date: '2026-03-20', dayNumber: 38, baseId: 'base-10', theme: 'Buffer Day', blocks: [
      { id: 'block-2026-03-20-0', type: 'midday-flex', activity: { id: 'act-2026-03-20-0', name: 'Buffer Day', category: 'relaxation', description: 'Shopping, neighborhood wandering, pack for Hawaii', location: { name: 'Tokyo' }, duration: 480, bookingRequired: false, tags: ['Japan'] }, priority: 'if-energy', isLocked: false, notes: 'Shopping, neighborhood wandering, pack for Hawaii' },
    ]},
    // Day 39: Mar 21 - Travel to Hawaii (night 1 of 14)
    { id: 'day-2026-03-21', date: '2026-03-21', dayNumber: 39, baseId: 'base-11', theme: 'Honolulu', blocks: [
      { id: 'block-2026-03-21-0', type: 'transit', startTime: '21:00', activity: { id: 'act-2026-03-21-0', name: 'ANA NRT→HNL 9:00pm-9:10am', category: 'flight', description: '7hr, cross date line, premium economy', location: { name: 'Honolulu' }, duration: 420, cost: { amount: 2125, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['USA'], scheduledTime: '21:00', tips: ['7hr flight, cross date line'] }, priority: 'must-see', isLocked: false, notes: '7hr, cross date line, premium economy' },
      { id: 'block-2026-03-21-1', type: 'evening-vibe', activity: { id: 'act-2026-03-21-1', name: 'AirBnB Waikiki/North Shore (14 nights)', category: 'accommodation', description: 'Recovery day - treat as rest', location: { name: 'Honolulu' }, duration: 60, cost: { amount: 3024, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['USA'] }, priority: 'must-see', isLocked: false, notes: 'Recovery day - treat as rest' },
    ]},
    // Day 40: Mar 22 - Hawaii (night 2 of 14)
    { id: 'day-2026-03-22', date: '2026-03-22', dayNumber: 40, baseId: 'base-11', theme: 'Settle In', blocks: [
      { id: 'block-2026-03-22-0', type: 'midday-flex', activity: { id: 'act-2026-03-22-0', name: 'Settle In', category: 'relaxation', description: 'Beach, food, adjust to island time', location: { name: 'Oahu' }, duration: 360, bookingRequired: false, tags: ['USA'] }, priority: 'if-energy', isLocked: false, notes: 'Beach, food, adjust to island time' },
    ]},
    // Day 41: Mar 23 - Hawaii (night 3 of 14)
    { id: 'day-2026-03-23', date: '2026-03-23', dayNumber: 41, baseId: 'base-11', theme: 'Pearl Harbor', blocks: [
      { id: 'block-2026-03-23-0', type: 'morning-anchor', activity: { id: 'act-2026-03-23-0', name: 'Pearl Harbor', category: 'activity', description: 'Memorial visit, historical day', location: { name: 'Oahu' }, duration: 300, bookingRequired: true, tags: ['USA'] }, priority: 'must-see', isLocked: false, notes: 'Memorial visit, historical day' },
    ]},
    // Day 42: Mar 24 - Hawaii (night 4 of 14)
    { id: 'day-2026-03-24', date: '2026-03-24', dayNumber: 42, baseId: 'base-11', theme: 'Kaena Point', blocks: [
      { id: 'block-2026-03-24-0', type: 'morning-anchor', activity: { id: 'act-2026-03-24-0', name: 'Kaena Point', category: 'activity', description: 'Coastal hike, nature', location: { name: 'Oahu' }, duration: 360, bookingRequired: false, tags: ['USA'] }, priority: 'if-energy', isLocked: false, notes: 'Coastal hike, nature' },
    ]},
    // Day 43: Mar 25 - Hawaii (night 5 of 14)
    { id: 'day-2026-03-25', date: '2026-03-25', dayNumber: 43, baseId: 'base-11', theme: 'Whale Watching', blocks: [
      { id: 'block-2026-03-25-0', type: 'morning-anchor', activity: { id: 'act-2026-03-25-0', name: 'Whale Watching', category: 'activity', description: 'Seasonal whale watching tour', location: { name: 'Oahu' }, duration: 240, bookingRequired: true, tags: ['USA'] }, priority: 'if-energy', isLocked: false, notes: 'Seasonal whale watching tour' },
    ]},
    // Days 44-52: Mar 26 - Apr 3 - Hawaii buffer days (nights 6-14)
    { id: 'day-2026-03-26', date: '2026-03-26', dayNumber: 44, baseId: 'base-11', theme: 'North Shore', blocks: [
      { id: 'block-2026-03-26-0', type: 'morning-anchor', activity: { id: 'act-2026-03-26-0', name: 'North Shore Day', category: 'activity', description: 'Surf spots, food trucks, Haleiwa town', location: { name: 'Oahu' }, duration: 480, bookingRequired: false, tags: ['USA'] }, priority: 'if-energy', isLocked: false, notes: 'Surf spots, food trucks, Haleiwa town' },
    ]},
    { id: 'day-2026-03-27', date: '2026-03-27', dayNumber: 45, baseId: 'base-11', theme: 'Beach Day', blocks: [
      { id: 'block-2026-03-27-0', type: 'midday-flex', activity: { id: 'act-2026-03-27-0', name: 'Beach Day', category: 'relaxation', description: 'Waikiki or Lanikai Beach', location: { name: 'Oahu' }, duration: 360, bookingRequired: false, tags: ['USA'] }, priority: 'if-energy', isLocked: false, notes: 'Waikiki or Lanikai Beach' },
    ]},
    { id: 'day-2026-03-28', date: '2026-03-28', dayNumber: 46, baseId: 'base-11', theme: 'Diamond Head', blocks: [
      { id: 'block-2026-03-28-0', type: 'morning-anchor', activity: { id: 'act-2026-03-28-0', name: 'Diamond Head Hike', category: 'activity', description: 'Sunrise or early morning hike', location: { name: 'Oahu' }, duration: 180, bookingRequired: true, tags: ['USA'] }, priority: 'if-energy', isLocked: false, notes: 'Sunrise or early morning hike' },
    ]},
    { id: 'day-2026-03-29', date: '2026-03-29', dayNumber: 47, baseId: 'base-11', theme: 'Snorkeling', blocks: [
      { id: 'block-2026-03-29-0', type: 'morning-anchor', activity: { id: 'act-2026-03-29-0', name: 'Hanauma Bay Snorkeling', category: 'activity', description: 'Snorkeling at Hanauma Bay', location: { name: 'Oahu' }, duration: 300, bookingRequired: true, tags: ['USA'] }, priority: 'if-energy', isLocked: false, notes: 'Snorkeling at Hanauma Bay' },
    ]},
    { id: 'day-2026-03-30', date: '2026-03-30', dayNumber: 48, baseId: 'base-11', theme: 'Polynesian Culture', blocks: [
      { id: 'block-2026-03-30-0', type: 'morning-anchor', activity: { id: 'act-2026-03-30-0', name: 'Polynesian Cultural Center', category: 'activity', description: 'Full day cultural experience, luau dinner', location: { name: 'Oahu' }, duration: 600, bookingRequired: true, tags: ['USA'] }, priority: 'if-energy', isLocked: false, notes: 'Full day cultural experience, luau dinner' },
    ]},
    { id: 'day-2026-03-31', date: '2026-03-31', dayNumber: 49, baseId: 'base-11', theme: 'Relaxation', blocks: [
      { id: 'block-2026-03-31-0', type: 'midday-flex', activity: { id: 'act-2026-03-31-0', name: 'Relaxation Day', category: 'relaxation', description: 'Pool, beach, spa', location: { name: 'Oahu' }, duration: 480, bookingRequired: false, tags: ['USA'] }, priority: 'if-energy', isLocked: false, notes: 'Pool, beach, spa' },
    ]},
    { id: 'day-2026-04-01', date: '2026-04-01', dayNumber: 50, baseId: 'base-11', theme: 'East Side Exploration', blocks: [
      { id: 'block-2026-04-01-0', type: 'morning-anchor', activity: { id: 'act-2026-04-01-0', name: 'East Side Exploration', category: 'activity', description: 'Kailua, Lanikai, Windward Coast', location: { name: 'Oahu' }, duration: 360, bookingRequired: false, tags: ['USA'] }, priority: 'if-energy', isLocked: false, notes: 'Kailua, Lanikai, Windward Coast' },
    ]},
    { id: 'day-2026-04-02', date: '2026-04-02', dayNumber: 51, baseId: 'base-11', theme: 'Shopping & Food', blocks: [
      { id: 'block-2026-04-02-0', type: 'midday-flex', activity: { id: 'act-2026-04-02-0', name: 'Shopping & Food', category: 'activity', description: 'Ala Moana, International Market Place, local restaurants', location: { name: 'Honolulu' }, duration: 360, bookingRequired: false, tags: ['USA'] }, priority: 'if-energy', isLocked: false, notes: 'Ala Moana, International Market Place, local restaurants' },
    ]},
    { id: 'day-2026-04-03', date: '2026-04-03', dayNumber: 52, baseId: 'base-11', theme: 'Last Full Day', blocks: [
      { id: 'block-2026-04-03-0', type: 'midday-flex', activity: { id: 'act-2026-04-03-0', name: 'Last Full Day', category: 'relaxation', description: 'Final beach time, sunset, pack', location: { name: 'Oahu' }, duration: 360, bookingRequired: false, tags: ['USA'] }, priority: 'if-energy', isLocked: false, notes: 'Final beach time, sunset, pack' },
    ]},
    // Day 53: Apr 4 - Travel home
    { id: 'day-2026-04-04', date: '2026-04-04', dayNumber: 53, baseId: '', theme: 'Home', blocks: [
      { id: 'block-2026-04-04-0', type: 'transit', startTime: '13:00', activity: { id: 'act-2026-04-04-0', name: 'Air Canada HNL→YVR 1:00pm-9:56pm', category: 'flight', description: '6hr, premium economy', location: { name: 'Vancouver' }, duration: 360, cost: { amount: 2342, currency: 'USD', isEstimate: false }, bookingRequired: true, tags: ['USA'], scheduledTime: '13:00', tips: ['6hr flight'] }, priority: 'must-see', isLocked: false, notes: '6hr, premium economy' },
      { id: 'block-2026-04-04-1', type: 'transit', activity: { id: 'act-2026-04-04-1', name: 'Westjet YVR→YLW', category: 'flight', description: 'Connection home', location: { name: 'Kelowna' }, duration: 60, bookingRequired: true, tags: ['Canada'] }, priority: 'must-see', isLocked: false, notes: 'Connection home' },
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
