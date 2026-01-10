/**
 * City images using static Unsplash URLs for reliable loading
 * Uses curated photo IDs that work consistently
 */

// Curated city images from Unsplash (reliable static URLs)
const CITY_IMAGE_MAP: Record<string, string> = {
  // Turkey (18 cities)
  'Istanbul': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80',
  'Cappadocia': 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=600&q=80',
  'Antalya': 'https://images.unsplash.com/photo-1593238739364-18cfde865065?w=600&q=80',
  'Ephesus': 'https://images.unsplash.com/photo-1589491106922-a8e488c0a54d?w=600&q=80',
  'Pamukkale': 'https://images.unsplash.com/photo-1600208669687-f19af3638cb7?w=600&q=80',
  'Bodrum': 'https://images.unsplash.com/photo-1601929862217-f1ee5d3e5f26?w=600&q=80',
  'Izmir': 'https://images.unsplash.com/photo-1567606404132-28a58db7e445?w=600&q=80',
  'Ankara': 'https://images.unsplash.com/photo-1589561454226-796a8aa89b05?w=600&q=80',
  'Fethiye': 'https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?w=600&q=80',
  'Kas': 'https://images.unsplash.com/photo-1596397249129-c7b7f358e8c4?w=600&q=80',
  'Trabzon': 'https://images.unsplash.com/photo-1565623833408-d77e39b88af6?w=600&q=80',
  'Bursa': 'https://images.unsplash.com/photo-1558383738-d04790cfb651?w=600&q=80',
  'Konya': 'https://images.unsplash.com/photo-1590058138427-c1e5f4339f5c?w=600&q=80',
  'Dalyan': 'https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?w=600&q=80',
  'Oludeniz': 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=600&q=80',
  'Marmaris': 'https://images.unsplash.com/photo-1601929862217-f1ee5d3e5f26?w=600&q=80',
  'Alanya': 'https://images.unsplash.com/photo-1593238739364-18cfde865065?w=600&q=80',
  'Side': 'https://images.unsplash.com/photo-1589491106922-a8e488c0a54d?w=600&q=80',
  // Spain (18 cities)
  'Barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
  'Madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80',
  'Seville': 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=600&q=80',
  'Granada': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=600&q=80',
  'Valencia': 'https://images.unsplash.com/photo-1599749002879-c29f7f220a3e?w=600&q=80',
  'San Sebastian': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Bilbao': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Malaga': 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600&q=80',
  'Toledo': 'https://images.unsplash.com/photo-1559666126-84f389727b9a?w=600&q=80',
  'Cordoba': 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=600&q=80',
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
  'Florence': 'https://images.unsplash.com/photo-1543429258-c5ca3ed4f7cd?w=600&q=80',
  'Venice': 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=600&q=80',
  'Milan': 'https://images.unsplash.com/photo-1520440229-6469a149ac59?w=600&q=80',
  'Amalfi Coast': 'https://images.unsplash.com/photo-1534113414509-0eec2bfb493f?w=600&q=80',
  // France
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  'Nice': 'https://images.unsplash.com/photo-1491166617655-0723a0999cfc?w=600&q=80',
  'Lyon': 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600&q=80',
  // Japan
  'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
  'Kyoto': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
  'Osaka': 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=600&q=80',
  // Switzerland
  'Zurich': 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=600&q=80',
  'Lucerne': 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=600&q=80',
  'Interlaken': 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=600&q=80',
  'Zermatt': 'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=600&q=80',
  'Geneva': 'https://images.unsplash.com/photo-1573108037329-37aa135a142e?w=600&q=80',
  // Thailand
  'Bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80',
  'Chiang Mai': 'https://images.unsplash.com/photo-1512553424870-a2a2d9e5ed73?w=600&q=80',
  'Phuket': 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=600&q=80',
  'Koh Samui': 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=600&q=80',
  // Greece
  'Athens': 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=600&q=80',
  'Santorini': 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=600&q=80',
  'Mykonos': 'https://images.unsplash.com/photo-1601581875039-e899893d520c?w=600&q=80',
  // Portugal
  'Lisbon': 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600&q=80',
  'Porto': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&q=80',
  // Default
  '_default': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80',
};

// Site/attraction images
const SITE_IMAGE_MAP: Record<string, string> = {
  'Hagia Sophia': 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=600&q=80',
  'Blue Mosque': 'https://images.unsplash.com/photo-1603019061086-a2b4e11f1f9a?w=600&q=80',
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
