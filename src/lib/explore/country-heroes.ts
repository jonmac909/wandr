// Curated hero images for country explore pages
// Use wide/landscape shots that fit 16:9 or 21:9 aspect ratios
// Choose iconic, instantly recognizable landmarks

export interface CountryHero {
  // Search query for Google Places API (use wide/panoramic landmarks)
  searchQuery: string;
  // City context for the search
  city: string;
  // Caption to display in bottom-right corner
  caption: string;
  // Country tagline
  tagline: string;
}

export const COUNTRY_HEROES: Record<string, CountryHero> = {
  thailand: {
    searchQuery: 'Maya Bay Phi Phi',
    city: 'Krabi',
    caption: 'Maya Bay, Phi Phi Islands',
    tagline: 'Land of Smiles',
  },
  japan: {
    searchQuery: 'Mount Fuji with cherry blossoms',
    city: 'Tokyo',
    caption: 'Mount Fuji, Japan',
    tagline: 'Land of the Rising Sun',
  },
  vietnam: {
    searchQuery: 'Ha Long Bay Vietnam',
    city: 'Ha Long',
    caption: 'Ha Long Bay',
    tagline: 'Hidden Charm',
  },
  indonesia: {
    searchQuery: 'Bali rice terraces Tegallalang',
    city: 'Ubud',
    caption: 'Tegallalang Rice Terraces, Bali',
    tagline: 'Wonderful Indonesia',
  },
  philippines: {
    searchQuery: 'El Nido Palawan lagoon',
    city: 'El Nido',
    caption: 'El Nido, Palawan',
    tagline: "It's More Fun in the Philippines",
  },
  malaysia: {
    searchQuery: 'Petronas Towers Kuala Lumpur skyline',
    city: 'Kuala Lumpur',
    caption: 'Petronas Towers, Kuala Lumpur',
    tagline: 'Truly Asia',
  },
  singapore: {
    searchQuery: 'Marina Bay Sands Singapore skyline',
    city: 'Singapore',
    caption: 'Marina Bay, Singapore',
    tagline: 'The Lion City',
  },
  cambodia: {
    searchQuery: 'Angkor Wat sunrise',
    city: 'Siem Reap',
    caption: 'Angkor Wat, Siem Reap',
    tagline: 'Kingdom of Wonder',
  },
  laos: {
    searchQuery: 'Kuang Si Falls Luang Prabang',
    city: 'Luang Prabang',
    caption: 'Kuang Si Falls, Luang Prabang',
    tagline: 'Simply Beautiful',
  },
  myanmar: {
    searchQuery: 'Bagan temples sunrise balloon',
    city: 'Bagan',
    caption: 'Temples of Bagan',
    tagline: 'Golden Land',
  },
  india: {
    searchQuery: 'Taj Mahal Agra',
    city: 'Agra',
    caption: 'Taj Mahal, Agra',
    tagline: 'Incredible India',
  },
  nepal: {
    searchQuery: 'Mount Everest Himalayas Nepal',
    city: 'Kathmandu',
    caption: 'Himalayas, Nepal',
    tagline: 'Naturally Nepal',
  },
  'sri-lanka': {
    searchQuery: 'Sigiriya Rock Fortress',
    city: 'Sigiriya',
    caption: 'Sigiriya Rock Fortress',
    tagline: 'Wonder of Asia',
  },
  maldives: {
    searchQuery: 'Maldives overwater bungalow aerial',
    city: 'Male',
    caption: 'Maldives',
    tagline: 'The Sunny Side of Life',
  },
  'south-korea': {
    searchQuery: 'Gyeongbokgung Palace Seoul',
    city: 'Seoul',
    caption: 'Gyeongbokgung Palace, Seoul',
    tagline: 'Imagine Your Korea',
  },
  china: {
    searchQuery: 'Great Wall of China Mutianyu',
    city: 'Beijing',
    caption: 'Great Wall of China',
    tagline: 'Beautiful China',
  },
  taiwan: {
    searchQuery: 'Jiufen Old Street Taiwan',
    city: 'Taipei',
    caption: 'Jiufen, Taiwan',
    tagline: 'Heart of Asia',
  },
  'hong-kong': {
    searchQuery: 'Hong Kong Victoria Harbour skyline night',
    city: 'Hong Kong',
    caption: 'Victoria Harbour, Hong Kong',
    tagline: "Asia's World City",
  },
  australia: {
    searchQuery: 'Sydney Opera House Harbour',
    city: 'Sydney',
    caption: 'Sydney Opera House',
    tagline: "There's Nothing Like Australia",
  },
  'new-zealand': {
    searchQuery: 'Milford Sound New Zealand',
    city: 'Queenstown',
    caption: 'Milford Sound',
    tagline: '100% Pure New Zealand',
  },
  italy: {
    searchQuery: 'Amalfi Coast Italy panorama',
    city: 'Amalfi',
    caption: 'Amalfi Coast',
    tagline: 'Made in Italy',
  },
  france: {
    searchQuery: 'Eiffel Tower Paris sunset',
    city: 'Paris',
    caption: 'Eiffel Tower, Paris',
    tagline: 'Rendez-vous en France',
  },
  spain: {
    searchQuery: 'Sagrada Familia Barcelona',
    city: 'Barcelona',
    caption: 'Sagrada Familia, Barcelona',
    tagline: 'Spain Mark',
  },
  portugal: {
    searchQuery: 'Lisbon tram Alfama',
    city: 'Lisbon',
    caption: 'Alfama, Lisbon',
    tagline: 'Can\'t Skip Portugal',
  },
  greece: {
    searchQuery: 'Santorini Oia blue domes',
    city: 'Santorini',
    caption: 'Oia, Santorini',
    tagline: 'All Time Classic',
  },
  croatia: {
    searchQuery: 'Dubrovnik Old Town aerial',
    city: 'Dubrovnik',
    caption: 'Dubrovnik Old Town',
    tagline: 'Full of Life',
  },
  turkey: {
    searchQuery: 'Cappadocia hot air balloons',
    city: 'Goreme',
    caption: 'Cappadocia',
    tagline: 'Home of Turkey',
  },
  morocco: {
    searchQuery: 'Chefchaouen blue city Morocco',
    city: 'Chefchaouen',
    caption: 'Chefchaouen, Morocco',
    tagline: 'Kingdom of Light',
  },
  egypt: {
    searchQuery: 'Pyramids of Giza Egypt',
    city: 'Cairo',
    caption: 'Pyramids of Giza',
    tagline: 'Where It All Begins',
  },
  mexico: {
    searchQuery: 'Chichen Itza Mexico pyramid',
    city: 'Cancun',
    caption: 'Chichen Itza',
    tagline: 'Live It to Believe It',
  },
  peru: {
    searchQuery: 'Machu Picchu Peru sunrise',
    city: 'Cusco',
    caption: 'Machu Picchu',
    tagline: 'Land of the Incas',
  },
  brazil: {
    searchQuery: 'Christ the Redeemer Rio de Janeiro',
    city: 'Rio de Janeiro',
    caption: 'Christ the Redeemer, Rio',
    tagline: 'Visit Brazil',
  },
  usa: {
    searchQuery: 'Grand Canyon Arizona panorama',
    city: 'Phoenix',
    caption: 'Grand Canyon, Arizona',
    tagline: 'United States of America',
  },
  canada: {
    searchQuery: 'Banff National Park Lake Louise',
    city: 'Banff',
    caption: 'Lake Louise, Banff',
    tagline: 'Keep Exploring',
  },
  iceland: {
    searchQuery: 'Northern Lights Iceland',
    city: 'Reykjavik',
    caption: 'Northern Lights, Iceland',
    tagline: 'Inspired by Iceland',
  },
  norway: {
    searchQuery: 'Norwegian Fjords Geirangerfjord',
    city: 'Geiranger',
    caption: 'Geirangerfjord',
    tagline: 'Powered by Nature',
  },
  switzerland: {
    searchQuery: 'Swiss Alps Matterhorn',
    city: 'Zermatt',
    caption: 'Matterhorn, Swiss Alps',
    tagline: 'Switzerland',
  },
  uk: {
    searchQuery: 'Tower Bridge London Thames',
    city: 'London',
    caption: 'Tower Bridge, London',
    tagline: 'Great Britain',
  },
  germany: {
    searchQuery: 'Neuschwanstein Castle Bavaria',
    city: 'Munich',
    caption: 'Neuschwanstein Castle',
    tagline: 'Simply Inspiring',
  },
  netherlands: {
    searchQuery: 'Amsterdam canal houses',
    city: 'Amsterdam',
    caption: 'Amsterdam Canals',
    tagline: 'The Netherlands',
  },
  austria: {
    searchQuery: 'Hallstatt Austria lake village',
    city: 'Hallstatt',
    caption: 'Hallstatt',
    tagline: 'Arrive and Revive',
  },
  'czech-republic': {
    searchQuery: 'Prague Charles Bridge Old Town',
    city: 'Prague',
    caption: 'Charles Bridge, Prague',
    tagline: 'Czechia',
  },
};

export function getCountryHero(countrySlug: string): CountryHero | null {
  return COUNTRY_HEROES[countrySlug.toLowerCase()] || null;
}
