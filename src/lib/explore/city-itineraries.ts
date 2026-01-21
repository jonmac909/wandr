// Curated itineraries for city explore pages
// Each city can have multiple duration options

export interface ItineraryActivity {
  time: string;
  name: string;
  description: string;
  type: 'attraction' | 'food' | 'activity' | 'transport' | 'tip';
  duration?: string;
  category?: string; // e.g., "Attractions", "Food & Dining"
  // Travel info to NEXT activity
  walkingMins?: number;
  walkingMeters?: number;
  transitMode?: 'walk' | 'drive' | 'bus' | 'train' | 'scooter';
}

export interface ItineraryDay {
  day: number;
  title: string;
  activities: ItineraryActivity[];
}

export interface CityItinerary {
  id: string;
  duration: number; // days
  title: string;
  subtitle: string;
  days: ItineraryDay[];
  tips: string[];
}

export interface CityItineraries {
  city: string;
  country: string;
  itineraries: CityItinerary[];
}

// Chiang Mai itineraries
const CHIANG_MAI_ITINERARIES: CityItineraries = {
  city: 'Chiang Mai',
  country: 'Thailand',
  itineraries: [
    {
      id: 'chiang-mai-3-day',
      duration: 3,
      title: '3 Days',
      subtitle: 'Highlights',
      days: [
        {
          day: 1,
          title: 'Old City & Temples',
          activities: [
            { time: '08:00', name: 'Wat Chedi Luang', description: 'Ancient temple with massive ruined chedi', type: 'attraction', duration: '1 hr', category: 'Attractions', walkingMins: 8, walkingMeters: 650, transitMode: 'walk' },
            { time: '10:00', name: 'Wat Phra Singh', description: 'Most revered temple in Chiang Mai', type: 'attraction', duration: '1 hr', category: 'Attractions', walkingMins: 12, walkingMeters: 950, transitMode: 'walk' },
            { time: '12:00', name: 'Khao Soi Khun Yai', description: 'Legendary khao soi spot', type: 'food', duration: '1 hr', category: 'Food & Dining', walkingMins: 15, walkingMeters: 1200, transitMode: 'walk' },
            { time: '14:00', name: 'Wat Chiang Man', description: 'Oldest temple in the city', type: 'attraction', duration: '45 min', category: 'Attractions', walkingMins: 10, walkingMeters: 800, transitMode: 'walk' },
            { time: '16:00', name: 'Wander Old City streets', description: 'Explore cafes and galleries', type: 'activity', duration: '2 hr', category: 'Activities', walkingMins: 5, walkingMeters: 400, transitMode: 'scooter' },
            { time: '19:00', name: 'Night Bazaar or Nimmanhaemin', description: 'Evening food and shopping', type: 'activity', category: 'Activities' },
          ]
        },
        {
          day: 2,
          title: 'Doi Suthep & Culture',
          activities: [
            { time: '07:00', name: 'Wat Phra That Doi Suthep', description: 'Sacred hilltop temple - go early to beat crowds', type: 'attraction', duration: '2 hr' },
            { time: '10:00', name: 'Bhubing Palace Gardens', description: 'Royal winter palace with beautiful gardens', type: 'attraction', duration: '1 hr' },
            { time: '12:30', name: 'Lunch at Pun Pun', description: 'Organic vegetarian restaurant', type: 'food', duration: '1 hr' },
            { time: '14:00', name: 'Thai Cooking Class', description: 'Half-day class - many options available', type: 'activity', duration: '4 hr' },
            { time: '19:00', name: 'Dinner with your creations', description: 'Enjoy what you cooked!', type: 'food' },
          ]
        },
        {
          day: 3,
          title: 'Nature & Markets',
          activities: [
            { time: '07:00', name: 'Elephant Nature Park', description: 'Ethical elephant sanctuary - book ahead!', type: 'activity', duration: '6 hr' },
            { time: '15:00', name: 'Warorot Market', description: 'Local market for snacks and goods', type: 'activity', duration: '1.5 hr' },
            { time: '17:00', name: 'Traditional Thai Massage', description: 'Recover from your adventures', type: 'activity', duration: '1.5 hr' },
            { time: '19:00', name: 'Sunset drinks', description: 'Find a rooftop or riverside spot', type: 'food' },
          ]
        },
      ],
      tips: [
        'Rent a scooter if comfortable - easiest way around',
        'Temples require covered shoulders and knees',
        'Book Elephant Nature Park 2-3 weeks ahead',
      ]
    },
    {
      id: 'chiang-mai-4-day',
      duration: 4,
      title: '4 Days',
      subtitle: 'Classic',
      days: [
        {
          day: 1,
          title: 'Old City & Temples',
          activities: [
            { time: '08:00', name: 'Wat Chedi Luang', description: 'Ancient temple with massive ruined chedi', type: 'attraction', duration: '1 hr' },
            { time: '10:00', name: 'Wat Phra Singh', description: 'Most revered temple in Chiang Mai', type: 'attraction', duration: '1 hr' },
            { time: '12:00', name: 'Khao Soi Khun Yai', description: 'Legendary khao soi - a must try', type: 'food', duration: '1 hr' },
            { time: '14:00', name: 'Wat Chiang Man', description: 'Oldest temple in the city', type: 'attraction', duration: '45 min' },
            { time: '16:00', name: 'Sunday Walking Street', description: 'If timing works, or explore Nimmanhaemin Road', type: 'activity' },
          ]
        },
        {
          day: 2,
          title: 'Doi Suthep & Culture',
          activities: [
            { time: '07:00', name: 'Wat Phra That Doi Suthep', description: 'Morning trip up the mountain - 309 steps worth it', type: 'attraction', duration: '2 hr' },
            { time: '10:00', name: 'Bhubing Palace Gardens', description: 'Stop on the way back down', type: 'attraction', duration: '1 hr' },
            { time: '13:00', name: 'Thai Cooking Class', description: 'Half-day class with market tour', type: 'activity', duration: '4 hr' },
            { time: '18:00', name: 'Lanna Folklife Museum', description: 'If time permits, learn about local culture', type: 'attraction', duration: '1 hr' },
          ]
        },
        {
          day: 3,
          title: 'Nature Day',
          activities: [
            { time: '07:00', name: 'Doi Inthanon National Park', description: "Thailand's highest peak - waterfalls, twin pagodas, cool air", type: 'activity', duration: '6 hr' },
            { time: '07:00', name: 'OR: Elephant Nature Park', description: 'Alternative: ethical elephant sanctuary (book ahead)', type: 'activity', duration: '6 hr' },
            { time: '15:00', name: 'Return to city', description: 'About 1.5 hours drive', type: 'transport' },
            { time: '17:00', name: 'Massage', description: 'You earned it after the mountain', type: 'activity', duration: '1.5 hr' },
            { time: '19:00', name: 'Riverside dinner', description: 'Try The Riverside or Good View', type: 'food' },
          ]
        },
        {
          day: 4,
          title: 'Relaxed Exploration',
          activities: [
            { time: '09:00', name: 'Warorot Market', description: 'Morning market for local snacks and goods', type: 'activity', duration: '1.5 hr' },
            { time: '11:00', name: 'Wat Sri Suphan (Silver Temple)', description: 'Stunning silver temple - unique to Chiang Mai', type: 'attraction', duration: '45 min' },
            { time: '12:30', name: 'Lunch at local spot', description: 'Try northern Thai sausage (sai oua)', type: 'food', duration: '1 hr' },
            { time: '14:00', name: 'Explore Nimmanhaemin', description: 'Cafes, boutiques, art galleries', type: 'activity', duration: '3 hr' },
            { time: '17:00', name: 'Sunset drinks', description: 'Rooftop at MAYA mall area', type: 'food' },
          ]
        },
      ],
      tips: [
        'Rent a scooter if comfortable - easiest way around',
        'Khao soi is a must, multiple times',
        'Temples require covered shoulders and knees',
        'November has Yi Peng lantern festival - magical!',
      ]
    },
    {
      id: 'chiang-mai-7-day',
      duration: 7,
      title: '7 Days',
      subtitle: 'Complete',
      days: [
        {
          day: 1,
          title: 'Arrival & Old City',
          activities: [
            { time: '14:00', name: 'Check in & rest', description: 'Recover from travel', type: 'activity', duration: '2 hr' },
            { time: '16:00', name: 'Wat Phra Singh', description: 'Most revered temple - start your temple journey', type: 'attraction', duration: '1 hr' },
            { time: '18:00', name: 'Khao Soi dinner', description: 'Try the iconic northern curry noodles', type: 'food' },
            { time: '20:00', name: 'Night Bazaar stroll', description: 'Get oriented with the city', type: 'activity' },
          ]
        },
        {
          day: 2,
          title: 'Temple Day',
          activities: [
            { time: '08:00', name: 'Wat Chedi Luang', description: 'Ancient massive chedi ruins', type: 'attraction', duration: '1 hr' },
            { time: '09:30', name: 'Wat Chiang Man', description: 'Oldest temple in city', type: 'attraction', duration: '45 min' },
            { time: '11:00', name: 'Wat Sri Suphan', description: 'Silver temple - intricate metalwork', type: 'attraction', duration: '45 min' },
            { time: '12:30', name: 'Lunch at Huen Phen', description: 'Traditional northern Thai food', type: 'food', duration: '1 hr' },
            { time: '14:30', name: 'Wat Umong', description: 'Forest temple with tunnels', type: 'attraction', duration: '1.5 hr' },
            { time: '17:00', name: 'Yoga or massage', description: 'Restore after temple hopping', type: 'activity' },
          ]
        },
        {
          day: 3,
          title: 'Doi Suthep',
          activities: [
            { time: '06:30', name: 'Wat Phra That Doi Suthep', description: 'Go early - climb 309 steps for sacred temple', type: 'attraction', duration: '2 hr' },
            { time: '09:30', name: 'Bhubing Palace', description: 'Royal gardens on the mountain', type: 'attraction', duration: '1.5 hr' },
            { time: '11:30', name: 'Hmong Village', description: 'Hill tribe market near the palace', type: 'activity', duration: '1 hr' },
            { time: '13:00', name: 'Lunch at mountain restaurant', description: 'Great views', type: 'food' },
            { time: '15:00', name: 'Return to city', description: 'Rest or explore', type: 'transport' },
            { time: '18:00', name: 'Cooking class (evening)', description: 'Learn to make Thai dishes', type: 'activity', duration: '3 hr' },
          ]
        },
        {
          day: 4,
          title: 'Elephant Day',
          activities: [
            { time: '07:00', name: 'Elephant Nature Park', description: 'Full day at ethical sanctuary - feed, bathe, walk with elephants', type: 'activity', duration: '8 hr' },
            { time: '17:00', name: 'Return to city', description: 'Emotionally full day', type: 'transport' },
            { time: '19:00', name: 'Light dinner', description: 'Casual meal, early night', type: 'food' },
          ]
        },
        {
          day: 5,
          title: 'Doi Inthanon',
          activities: [
            { time: '06:00', name: 'Drive to Doi Inthanon', description: "Thailand's highest peak - 1.5 hr drive", type: 'transport' },
            { time: '08:00', name: 'Twin Pagodas', description: 'King & Queen pagodas with stunning views', type: 'attraction', duration: '1 hr' },
            { time: '09:30', name: 'Summit marker', description: 'Highest point in Thailand', type: 'attraction', duration: '30 min' },
            { time: '10:30', name: 'Wachirathan Waterfall', description: 'Powerful waterfall', type: 'attraction', duration: '45 min' },
            { time: '12:00', name: 'Mae Klang Luang village', description: 'Karen hill tribe village', type: 'activity', duration: '1 hr' },
            { time: '14:00', name: 'Return to city', description: 'Stop for coffee en route', type: 'transport' },
            { time: '17:00', name: 'Spa treatment', description: 'Full body recovery', type: 'activity', duration: '2 hr' },
          ]
        },
        {
          day: 6,
          title: 'Art & Local Life',
          activities: [
            { time: '08:00', name: 'Warorot Market', description: 'Bustling local market', type: 'activity', duration: '1.5 hr' },
            { time: '10:00', name: 'MAIIAM Contemporary Art', description: 'Modern art museum', type: 'attraction', duration: '1.5 hr' },
            { time: '12:00', name: 'Lunch in Sankampaeng', description: 'En route to Bo Sang', type: 'food' },
            { time: '13:30', name: 'Bo Sang Umbrella Village', description: 'Traditional paper umbrella crafts', type: 'activity', duration: '1.5 hr' },
            { time: '15:30', name: 'San Kamphaeng Hot Springs', description: 'Natural hot springs', type: 'activity', duration: '1.5 hr' },
            { time: '18:00', name: 'Return for sunset drinks', description: 'Rooftop bar', type: 'food' },
          ]
        },
        {
          day: 7,
          title: 'Slow Departure',
          activities: [
            { time: '09:00', name: 'Sleep in', description: 'You deserve it', type: 'activity' },
            { time: '10:00', name: 'Brunch at Graph Cafe', description: 'Hip cafe in Old City', type: 'food', duration: '1.5 hr' },
            { time: '12:00', name: 'Last souvenir shopping', description: 'Pick up any missed items', type: 'activity', duration: '2 hr' },
            { time: '14:00', name: 'Final temple visit', description: 'Revisit your favorite', type: 'attraction', duration: '1 hr' },
            { time: '16:00', name: 'Airport or onward travel', description: 'Goodbye Chiang Mai!', type: 'transport' },
          ]
        },
      ],
      tips: [
        'Rent a scooter if comfortable - essential for 7 days',
        'Book Elephant Nature Park 2-3 weeks ahead',
        'Doi Inthanon is cold at summit - bring a jacket',
        'November Yi Peng festival is unforgettable',
        'Try khao soi, sai oua (sausage), and kao niew (sticky rice)',
      ]
    },
  ]
};

// Bangkok itineraries
const BANGKOK_ITINERARIES: CityItineraries = {
  city: 'Bangkok',
  country: 'Thailand',
  itineraries: [
    {
      id: 'bangkok-3-day',
      duration: 3,
      title: '3 Days',
      subtitle: 'Highlights',
      days: [
        {
          day: 1,
          title: 'Grand Palace & Temples',
          activities: [
            { time: '08:00', name: 'Grand Palace', description: 'Arrive early to beat crowds - stunning royal complex', type: 'attraction', duration: '2 hr' },
            { time: '10:30', name: 'Wat Pho', description: 'Giant reclining Buddha, traditional massage school', type: 'attraction', duration: '1.5 hr' },
            { time: '12:30', name: 'Lunch near Tha Tien', description: 'Local Thai food', type: 'food', duration: '1 hr' },
            { time: '14:00', name: 'Ferry to Wat Arun', description: 'Cross the river for iconic temple', type: 'attraction', duration: '1.5 hr' },
            { time: '16:00', name: 'Khao San Road area', description: 'Backpacker vibe, cold drinks', type: 'activity' },
            { time: '19:00', name: 'Rooftop bar sunset', description: 'Many options along the river', type: 'food' },
          ]
        },
        {
          day: 2,
          title: 'Markets & Modern Bangkok',
          activities: [
            { time: '08:00', name: 'Chatuchak Weekend Market', description: 'Massive market - go early (weekends only)', type: 'activity', duration: '3 hr' },
            { time: '12:00', name: 'Lunch at market', description: 'Street food galore', type: 'food' },
            { time: '14:00', name: 'Jim Thompson House', description: 'Beautiful traditional Thai house museum', type: 'attraction', duration: '1.5 hr' },
            { time: '16:00', name: 'Siam area malls', description: 'AC break, shopping', type: 'activity', duration: '2 hr' },
            { time: '19:00', name: 'Street food dinner', description: 'Chinatown (Yaowarat) at night', type: 'food' },
          ]
        },
        {
          day: 3,
          title: 'Culture & Departure',
          activities: [
            { time: '09:00', name: 'Floating Market day trip', description: 'Damnoen Saduak or Amphawa', type: 'activity', duration: '4 hr' },
            { time: '14:00', name: 'Return to city', description: 'Final explorations', type: 'transport' },
            { time: '15:00', name: 'Thai massage', description: '2-hour traditional massage', type: 'activity', duration: '2 hr' },
            { time: '17:00', name: 'Final temple or departure', description: 'Depending on flight time', type: 'activity' },
          ]
        },
      ],
      tips: [
        'Grand Palace requires covered shoulders and knees',
        'Use BTS/MRT to avoid traffic',
        'Chatuchak is weekends only - plan accordingly',
      ]
    },
  ]
};

// All city itineraries
const CITY_ITINERARIES: Record<string, CityItineraries> = {
  'chiang mai': CHIANG_MAI_ITINERARIES,
  'bangkok': BANGKOK_ITINERARIES,
};

export function getCityItineraries(cityName: string): CityItineraries | null {
  return CITY_ITINERARIES[cityName.toLowerCase()] || null;
}

export function getItineraryByDuration(cityName: string, days: number): CityItinerary | null {
  const cityData = getCityItineraries(cityName);
  if (!cityData) return null;
  return cityData.itineraries.find(i => i.duration === days) || null;
}
