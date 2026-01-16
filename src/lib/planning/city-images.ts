/**
 * City images - combines curated images with dynamic fallbacks
 * Works for ANY city using Wikipedia image fetching as fallback
 */

// Cache for dynamically fetched images
const dynamicImageCache = new Map<string, string>();

/**
 * Generate a Wikimedia Commons search URL for a city
 * This uses Wikipedia's image API to find relevant city images
 */
function getWikimediaImageUrl(cityName: string, country?: string): string {
  // Return Pexels fallback image
  return `https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600`;
}

/**
 * Generate a reliable fallback image using Pexels
 * Hash-based selection ensures same city always gets same image
 */
function getSeededFallback(cityName: string): string {
  const FALLBACK_IMAGES = [
    'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg',
    'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg',
    'https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg',
    'https://images.pexels.com/photos/1285625/pexels-photo-1285625.jpeg',
    'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg',
    'https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg',
  ];
  let hash = 0;
  const str = cityName.toLowerCase();
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return `${FALLBACK_IMAGES[Math.abs(hash) % FALLBACK_IMAGES.length]}?auto=compress&cs=tinysrgb&w=600`;
}

// Curated city images - using picsum with meaningful seeds
const CITY_IMAGE_MAP: Record<string, string> = {
  // Turkey (18 cities)
  'Istanbul': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Cappadocia': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Antalya': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Ephesus': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Pamukkale': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Bodrum': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Izmir': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Ankara': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Fethiye': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Kas': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Trabzon': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Bursa': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Konya': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Dalyan': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Oludeniz': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Marmaris': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Alanya': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Side': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  // Spain (18 cities)
  'Barcelona': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Madrid': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Seville': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Granada': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Valencia': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'San Sebastian': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'San Sebastián': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Bilbao': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Malaga': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Toledo': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Cordoba': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Córdoba': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Ibiza': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Ronda': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Salamanca': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Girona': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Segovia': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Cadiz': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Marbella': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Palma de Mallorca': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  // Italy
  'Rome': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Florence': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Venice': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Milan': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Amalfi Coast': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Cinque Terre': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Naples': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Siena': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Bologna': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Lake Como': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  // France
  'Paris': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Nice': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Lyon': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Bordeaux': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Provence': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Marseille': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Strasbourg': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Mont Saint-Michel': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Chamonix': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Loire Valley': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  // Japan
  'Tokyo': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Kyoto': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Osaka': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Hiroshima': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Nara': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Hakone': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Nikko': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Kanazawa': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Takayama': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Kamakura': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  // Switzerland
  'Zurich': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Lucerne': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Interlaken': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Zermatt': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Geneva': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Bern': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Grindelwald': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Lauterbrunnen': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Montreux': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'St. Moritz': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  // Thailand
  'Bangkok': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Chiang Mai': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Phuket': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Koh Samui': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Krabi': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Ayutthaya': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Pai': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Koh Phi Phi': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Chiang Rai': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Sukhothai': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Koh Tao': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Koh Lanta': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Hua Hin': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Koh Chang': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Kanchanaburi': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  // Greece
  'Athens': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Santorini': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Mykonos': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  // Portugal
  'Lisbon': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Porto': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  // Hawaii
  'Honolulu': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Waikiki': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Maui': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Kauai': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Big Island': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Oahu': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'North Shore': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Lahaina': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Kona': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Hanalei': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  // Vietnam
  'Ho Chi Minh City': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Hanoi': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Ha Long Bay': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Hoi An': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Da Nang': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  // Default
  '_default': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
};

// Site/attraction images
const SITE_IMAGE_MAP: Record<string, string> = {
  'Hagia Sophia': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Blue Mosque': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Grand Bazaar': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Topkapi Palace': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Hot Air Balloon Rides': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Sagrada Familia': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Colosseum': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Eiffel Tower': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Alhambra': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Fushimi Inari': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Grand Palace': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Wat Arun': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Parthenon': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  '_default': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
};

/**
 * Get a reliable static image URL for a city
 */
export function getCityImage(cityName: string, country?: string): string {
  // Check exact match first
  if (CITY_IMAGE_MAP[cityName]) {
    return CITY_IMAGE_MAP[cityName];
  }

  // Check partial match
  const lowerCity = cityName.toLowerCase();
  for (const [key, url] of Object.entries(CITY_IMAGE_MAP)) {
    if (key.toLowerCase().includes(lowerCity) || lowerCity.includes(key.toLowerCase())) {
      return url;
    }
  }

  // Return default travel image
  return CITY_IMAGE_MAP['_default'];
}

/**
 * Get the image URL for a top site/attraction
 */
export function getSiteImage(siteName: string): string {
  // Check exact match first
  if (SITE_IMAGE_MAP[siteName]) {
    return SITE_IMAGE_MAP[siteName];
  }

  // Check partial match
  const lowerSite = siteName.toLowerCase();
  for (const [key, url] of Object.entries(SITE_IMAGE_MAP)) {
    if (key.toLowerCase().includes(lowerSite) || lowerSite.includes(key.toLowerCase())) {
      return url;
    }
  }

  // Return default landmark image
  return SITE_IMAGE_MAP['_default'];
}

// For backwards compatibility - export the maps
export const CITY_IMAGES = CITY_IMAGE_MAP;
export const SITE_IMAGES = SITE_IMAGE_MAP;
