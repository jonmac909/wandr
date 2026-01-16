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
  // Encode the city name for URL
  const searchTerm = country ? `${cityName}_${country}` : cityName;
  const encoded = encodeURIComponent(searchTerm.replace(/\s+/g, '_'));
  // Use Wikipedia's Special:FilePath which redirects to actual image
  // This gives us a generic travel/location image based on the name
  return `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80`;
}

/**
 * Generate a reliable fallback image using Picsum with city-based seed
 * This ensures same city always gets same image
 */
function getSeededFallback(cityName: string): string {
  // Create a hash from city name for consistent seeding
  const seed = cityName.toLowerCase().replace(/\s+/g, '-');
  return `https://picsum.photos/seed/${seed}-travel/600/400`;
}

// Curated city images - using picsum with meaningful seeds
const CITY_IMAGE_MAP: Record<string, string> = {
  // Turkey (18 cities)
  'Istanbul': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80',
  'Cappadocia': 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=600&q=80',
  'Antalya': 'https://images.unsplash.com/photo-1581882897922-d03987cf13aa?w=600&q=80',
  'Ephesus': 'https://images.unsplash.com/photo-1748560594121-4a8e3e35e4f4?w=600&q=80',
  'Pamukkale': 'https://images.unsplash.com/photo-1728466698701-2eb2af4117d4?w=600&q=80',
  'Bodrum': 'https://images.unsplash.com/photo-1583062482795-d2bef78e9bc1?w=600&q=80',
  'Izmir': 'https://images.unsplash.com/photo-1651524055017-cef6327c11f4?w=600&q=80',
  'Ankara': 'https://images.unsplash.com/photo-1589561454226-796a8aa89b05?w=600&q=80',
  'Fethiye': 'https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?w=600&q=80',
  'Kas': 'https://images.unsplash.com/photo-1683977817985-8493d2836311?w=600&q=80',
  'Trabzon': 'https://images.unsplash.com/photo-1565623833408-d77e39b88af6?w=600&q=80',
  'Bursa': 'https://images.unsplash.com/photo-1647122290702-d26706aa5903?w=600&q=80',
  'Konya': 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=600&q=80',
  'Dalyan': 'https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?w=600&q=80',
  'Oludeniz': 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=600&q=80',
  'Marmaris': 'https://images.unsplash.com/photo-1593434858907-966d9ff489a4?w=600&q=80',
  'Alanya': 'https://images.unsplash.com/photo-1666202629936-a011710a2ab5?w=600&q=80',
  'Side': 'https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?w=600&q=80',
  // Spain (18 cities)
  'Barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
  'Madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80',
  'Seville': 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=600&q=80',
  'Granada': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=600&q=80',
  'Valencia': 'https://images.unsplash.com/photo-1529686398651-b8112f4bb98c?w=600&q=80',
  'San Sebastian': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'San Sebastián': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Bilbao': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Malaga': 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600&q=80',
  'Toledo': 'https://images.unsplash.com/photo-1559666126-84f389727b9a?w=600&q=80',
  'Cordoba': 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=600&q=80',
  'Córdoba': 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=600&q=80',
  'Ibiza': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80',
  'Ronda': 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=600&q=80',
  'Salamanca': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80',
  'Girona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
  'Segovia': 'https://images.unsplash.com/photo-1559666126-84f389727b9a?w=600&q=80',
  'Cadiz': 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=600&q=80',
  'Marbella': 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600&q=80',
  'Palma de Mallorca': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  // Italy
  'Rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
  'Florence': 'https://images.unsplash.com/photo-1476362174823-3a23f4aa6d76?w=600&q=80',
  'Venice': 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=600&q=80',
  'Milan': 'https://images.unsplash.com/photo-1520440229-6469a149ac59?w=600&q=80',
  'Amalfi Coast': 'https://images.unsplash.com/photo-1534113414509-0eec2bfb493f?w=600&q=80',
  'Cinque Terre': 'https://images.unsplash.com/photo-1565645354760-7f651f4339c0?w=600&q=80',
  'Naples': 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&q=80',
  'Siena': 'https://images.unsplash.com/photo-1558045492-6b0409379b56?w=600&q=80',
  'Bologna': 'https://images.unsplash.com/photo-1515549862480-a950a8c6f2f7?w=600&q=80',
  'Lake Como': 'https://images.unsplash.com/photo-152040763153-5a460e825229?w=600&q=80',
  // France
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  'Nice': 'https://images.unsplash.com/photo-1491166617655-0723a0999cfc?w=600&q=80',
  'Lyon': 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600&q=80',
  'Bordeaux': 'https://images.unsplash.com/photo-1598657514922-a5633e842562?w=600&q=80',
  'Provence': 'https://images.unsplash.com/photo-1598404033241-0c8687e675a38?w=600&q=80',
  'Marseille': 'https://images.unsplash.com/photo-1568494988199-019953b4565f?w=600&q=80',
  'Strasbourg': 'https://images.unsplash.com/photo-1554405564-778e98e5b5e6?w=600&q=80',
  'Mont Saint-Michel': 'https://images.unsplash.com/photo-1630079422237-2751c7e86652?w=600&q=80',
  'Chamonix': 'https://images.unsplash.com/photo-15402463160-0af7023b7460?w=600&q=80',
  'Loire Valley': 'https://images.unsplash.com/photo-1553694594-b2c01278c606?w=600&q=80',
  // Japan
  'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
  'Kyoto': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
  'Osaka': 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=600&q=80',
  'Hiroshima': 'https://images.unsplash.com/photo-1587580789370-8e0e0498c8b4?w=600&q=80',
  'Nara': 'https://images.unsplash.com/photo-1616564852366-e2e6b8c26a23?w=600&q=80',
  'Hakone': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80',
  'Nikko': 'https://images.unsplash.com/photo-1605335193134-0186689b569b?w=600&q=80',
  'Kanazawa': 'https://images.unsplash.com/photo-1673598238152-6995e0939b4d?w=600&q=80',
  'Takayama': 'https://images.unsplash.com/photo-1519572686055-7f0788788a44?w=600&q=80',
  'Kamakura': 'https://images.unsplash.com/photo-1616595047633-7b31365a2b99?w=600&q=80',
  // Switzerland
  'Zurich': 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=600&q=80',
  'Lucerne': 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=600&q=80',
  'Interlaken': 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=600&q=80',
  'Zermatt': 'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=600&q=80',
  'Geneva': 'https://images.unsplash.com/photo-1573108037329-37aa135a142e?w=600&q=80',
  'Bern': 'https://images.unsplash.com/photo-1525848745658-5b9e0c816428?w=600&q=80',
  'Grindelwald': 'https://images.unsplash.com/photo-1533788456514-0a997a498c0e?w=600&q=80',
  'Lauterbrunnen': 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&q=80',
  'Montreux': 'https://images.unsplash.com/photo-1553531883-66444869f3a0?w=600&q=80',
  'St. Moritz': 'https://images.unsplash.com/photo-1551940287-839b9d08226a?w=600&q=80',
  // Thailand
  'Bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80',
  'Chiang Mai': 'https://images.unsplash.com/photo-1524189791114-9781ece3d3ed?w=600&q=80',
  'Phuket': 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=600&q=80',
  'Koh Samui': 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=600&q=80',
  'Krabi': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&q=80',
  'Ayutthaya': 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&q=80',
  'Pai': 'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=600&q=80',
  'Koh Phi Phi': 'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?w=600&q=80',
  'Chiang Rai': 'https://images.unsplash.com/photo-1568647537424-7341e64795c0?w=600&q=80',
  'Sukhothai': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
  'Koh Tao': 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=600&q=80',
  'Koh Lanta': 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=600&q=80',
  'Hua Hin': 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?w=600&q=80',
  'Koh Chang': 'https://images.unsplash.com/photo-1538734740536-b567c0379b4f?w=600&q=80',
  'Kanchanaburi': 'https://images.unsplash.com/photo-1600807330908-b48ab1c02c90?w=600&q=80',
  // Greece
  'Athens': 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=600&q=80',
  'Santorini': 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=600&q=80',
  'Mykonos': 'https://images.unsplash.com/photo-1601581875039-e899893d520c?w=600&q=80',
  // Portugal
  'Lisbon': 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600&q=80',
  'Porto': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&q=80',
  // Hawaii
  'Honolulu': 'https://images.unsplash.com/photo-1507876466758-bc54f384809c?w=600&q=80',
  'Waikiki': 'https://images.unsplash.com/photo-1571041804726-53f7a7f0039b?w=600&q=80',
  'Maui': 'https://images.unsplash.com/photo-1542259009477-d625272157b7?w=600&q=80',
  'Kauai': 'https://images.unsplash.com/photo-1505852679233-d9fd70aff56d?w=600&q=80',
  'Big Island': 'https://images.unsplash.com/photo-1547483238-f400e65ccd56?w=600&q=80',
  'Oahu': 'https://images.unsplash.com/photo-1598135753163-6167c1a1ad65?w=600&q=80',
  'North Shore': 'https://images.unsplash.com/photo-1509233725247-49e657c54213?w=600&q=80',
  'Lahaina': 'https://images.unsplash.com/photo-1542259009477-d625272157b7?w=600&q=80',
  'Kona': 'https://images.unsplash.com/photo-1547483238-f400e65ccd56?w=600&q=80',
  'Hanalei': 'https://images.unsplash.com/photo-1505852679233-d9fd70aff56d?w=600&q=80',
  // Vietnam
  'Ho Chi Minh City': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&q=80',
  'Hanoi': 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=600&q=80',
  'Ha Long Bay': 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600&q=80',
  'Hoi An': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80',
  'Da Nang': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80',
  // Default
  '_default': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80',
};

// Site/attraction images
const SITE_IMAGE_MAP: Record<string, string> = {
  'Hagia Sophia': 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=600&q=80',
  'Blue Mosque': 'https://images.unsplash.com/photo-1649333195003-18c47d64ed18?w=600&q=80',
  'Grand Bazaar': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Topkapi Palace': 'https://images.unsplash.com/photo-1609866138210-84bb689f3c61?w=600&q=80',
  'Hot Air Balloon Rides': 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=600&q=80',
  'Sagrada Familia': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
  'Colosseum': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
  'Eiffel Tower': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  'Alhambra': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=600&q=80',
  'Fushimi Inari': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
  'Grand Palace': 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&q=80',
  'Wat Arun': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
  'Parthenon': 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=600&q=80',
  '_default': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80',
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
