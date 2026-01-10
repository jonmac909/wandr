/**
 * Real city images using direct Unsplash URLs
 * Same format as the working dashboard images
 */

// City thumbnail images
export const CITY_IMAGES: Record<string, string> = {
  // Turkey
  'Istanbul': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80',
  'Cappadocia': 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=600&q=80',
  'Antalya': 'https://images.unsplash.com/photo-1593238739364-18cfde865759?w=600&q=80',
  'Bodrum': 'https://images.unsplash.com/photo-1568816673022-91c31a3f914d?w=600&q=80',
  'Ephesus': 'https://images.unsplash.com/photo-1589756432281-54f3e31e582e?w=600&q=80',
  'Pamukkale': 'https://images.unsplash.com/photo-1600460378689-c567e9d1d98a?w=600&q=80',
  'Izmir': 'https://images.unsplash.com/photo-1590930078498-ada7db66086d?w=600&q=80',
  'Ankara': 'https://images.unsplash.com/photo-1565965965693-eb22bb69a763?w=600&q=80',
  'Fethiye': 'https://images.unsplash.com/photo-1604156788856-2ce5f2171ee7?w=600&q=80',
  'Kas': 'https://images.unsplash.com/photo-1613391297614-e0e26c364f73?w=600&q=80',
  'Marmaris': 'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=600&q=80',
  'Konya': 'https://images.unsplash.com/photo-1609617871107-a6dd4abe1a9d?w=600&q=80',
  'Trabzon': 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=600&q=80',
  'Bursa': 'https://images.unsplash.com/photo-1585225117968-49c459d5e4dc?w=600&q=80',
  'Alanya': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',

  // Spain
  'Barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
  'Madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80',
  'Seville': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Granada': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=600&q=80',
  'Valencia': 'https://images.unsplash.com/photo-1599570026498-0ef24376d0d8?w=600&q=80',
  'San Sebastian': 'https://images.unsplash.com/photo-1558618047-f4b511ce7a11?w=600&q=80',
  'Malaga': 'https://images.unsplash.com/photo-1591720256525-1a225d77f6e7?w=600&q=80',
  'Cordoba': 'https://images.unsplash.com/photo-1559563458-527698bf5295?w=600&q=80',
  'Bilbao': 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=600&q=80',
  'Toledo': 'https://images.unsplash.com/photo-1569959220744-ff553533f492?w=600&q=80',

  // Switzerland
  'Zurich': 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=600&q=80',
  'Lucerne': 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=600&q=80',
  'Interlaken': 'https://images.unsplash.com/photo-1594739393338-ec4aadf77cb8?w=600&q=80',
  'Zermatt': 'https://images.unsplash.com/photo-1529921879218-f99546d03a9f?w=600&q=80',
  'Geneva': 'https://images.unsplash.com/photo-1573108724029-4c46571d6490?w=600&q=80',
  'Bern': 'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=600&q=80',
  'Basel': 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=600&q=80',
  'Lausanne': 'https://images.unsplash.com/photo-1573731541700-e3d228a65686?w=600&q=80',
  'Grindelwald': 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80',
  'St. Moritz': 'https://images.unsplash.com/photo-1610392249656-b88c7c4e6e3e?w=600&q=80',
  'Gstaad': 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=600&q=80',
  'Montreux': 'https://images.unsplash.com/photo-1594974037179-1d2f0a4c0fa1?w=600&q=80',

  // Italy
  'Rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
  'Florence': 'https://images.unsplash.com/photo-1543429258-c5ca3a1c0d9e?w=600&q=80',
  'Venice': 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=600&q=80',
  'Amalfi Coast': 'https://images.unsplash.com/photo-1534008897995-27a23e859048?w=600&q=80',
  'Milan': 'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?w=600&q=80',
  'Cinque Terre': 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&q=80',

  // France
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  'Nice': 'https://images.unsplash.com/photo-1491166617655-0723a0999cfc?w=600&q=80',
  'Lyon': 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600&q=80',

  // Japan
  'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
  'Kyoto': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80',
  'Osaka': 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=600&q=80',

  // UK
  'London': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80',
  'Edinburgh': 'https://images.unsplash.com/photo-1596975416312-37d15a9a6d94?w=600&q=80',

  // Others
  'Thailand': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=600&q=80',
  'Amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&q=80',
  'Dubrovnik': 'https://images.unsplash.com/photo-1555990793-da11153b2473?w=600&q=80',
  'Iceland': 'https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=600&q=80',
  'Queenstown': 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600&q=80',
  'Swiss Alps': 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=600&q=80',
};

// Top site images for city modals
export const SITE_IMAGES: Record<string, string> = {
  // Turkey - Istanbul
  'Hagia Sophia': 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=600&q=80',
  'Blue Mosque': 'https://images.unsplash.com/photo-1570838404277-29b9a5b9a7e7?w=600&q=80',
  'Grand Bazaar': 'https://images.unsplash.com/photo-1565204051057-6e750ee3a920?w=600&q=80',
  'Topkapi Palace': 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?w=600&q=80',

  // Turkey - Cappadocia
  'Hot Air Balloon Rides': 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=600&q=80',
  'Göreme Open Air Museum': 'https://images.unsplash.com/photo-1642586285689-2c9c8086fbdc?w=600&q=80',
  'Underground Cities': 'https://images.unsplash.com/photo-1568322503494-9a9bc2d66a10?w=600&q=80',
  'Fairy Chimneys': 'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?w=600&q=80',

  // Spain - Barcelona
  'Sagrada Familia': 'https://images.unsplash.com/photo-1583779457267-5a5b9b54c5a0?w=600&q=80',
  'Park Güell': 'https://images.unsplash.com/photo-1579282240050-352db0a14c21?w=600&q=80',
  'La Rambla': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
  'Gothic Quarter': 'https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=600&q=80',

  // Italy - Rome
  'Colosseum': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
  'Vatican Museums': 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=600&q=80',
  'Trevi Fountain': 'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=600&q=80',
  'Roman Forum': 'https://images.unsplash.com/photo-1555992828-5e0c8c6c9b8f?w=600&q=80',

  // Switzerland
  'Chapel Bridge': 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=600&q=80',
  'Matterhorn': 'https://images.unsplash.com/photo-1529921879218-f99546d03a9f?w=600&q=80',
  'Jungfraujoch': 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&q=80',
  'Lake Geneva': 'https://images.unsplash.com/photo-1573108724029-4c46571d6490?w=600&q=80',
  'Mt. Pilatus': 'https://images.unsplash.com/photo-1594739393338-ec4aadf77cb8?w=600&q=80',
  'Lake Lucerne': 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=600&q=80',
  'Old Town (Altstadt)': 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=600&q=80',
  'Lake Zurich': 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=600&q=80',
  'Kunsthaus': 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=600&q=80',
  'Bahnhofstrasse': 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=600&q=80',
  'Harder Kulm': 'https://images.unsplash.com/photo-1594739393338-ec4aadf77cb8?w=600&q=80',
  'Paragliding': 'https://images.unsplash.com/photo-1503220317266-8c467c1aa7ca?w=600&q=80',
  'Lake Thun': 'https://images.unsplash.com/photo-1594739393338-ec4aadf77cb8?w=600&q=80',
  'Gornergrat': 'https://images.unsplash.com/photo-1529921879218-f99546d03a9f?w=600&q=80',
  '5 Lakes Walk': 'https://images.unsplash.com/photo-1529921879218-f99546d03a9f?w=600&q=80',
  'Glacier Paradise': 'https://images.unsplash.com/photo-1529921879218-f99546d03a9f?w=600&q=80',
  'Jet d\'Eau': 'https://images.unsplash.com/photo-1573108724029-4c46571d6490?w=600&q=80',
  'Old Town': 'https://images.unsplash.com/photo-1573108724029-4c46571d6490?w=600&q=80',
  'CERN': 'https://images.unsplash.com/photo-1573108724029-4c46571d6490?w=600&q=80',

  // Turkey sites
  'Kaleiçi Old Town': 'https://images.unsplash.com/photo-1593238739364-18cfde865759?w=600&q=80',
  'Düden Waterfalls': 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&q=80',
  'Aspendos Theater': 'https://images.unsplash.com/photo-1564594985645-4427056e22e2?w=600&q=80',
  'Konyaaltı Beach': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'Library of Celsus': 'https://images.unsplash.com/photo-1589756432281-54f3e31e582e?w=600&q=80',
  'Temple of Artemis': 'https://images.unsplash.com/photo-1564594985645-4427056e22e2?w=600&q=80',
  'Terrace Houses': 'https://images.unsplash.com/photo-1589756432281-54f3e31e582e?w=600&q=80',
  'Great Theatre': 'https://images.unsplash.com/photo-1564594985645-4427056e22e2?w=600&q=80',
  'Travertine Terraces': 'https://images.unsplash.com/photo-1600460378689-c567e9d1d98a?w=600&q=80',
  'Hierapolis Ancient City': 'https://images.unsplash.com/photo-1600460378689-c567e9d1d98a?w=600&q=80',
  'Cleopatra Pool': 'https://images.unsplash.com/photo-1600460378689-c567e9d1d98a?w=600&q=80',
  'Necropolis': 'https://images.unsplash.com/photo-1600460378689-c567e9d1d98a?w=600&q=80',

  // Spain sites
  'Alcázar': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Cathedral & Giralda': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Plaza de España': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Triana': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Alhambra': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=600&q=80',
  'Albaicín': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=600&q=80',
  'Sacromonte': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=600&q=80',
  'Granada Cathedral': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=600&q=80',
  'Prado Museum': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80',
  'Royal Palace': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80',
  'Retiro Park': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80',
  'Plaza Mayor': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80',

  // Italy sites
  'Uffizi Gallery': 'https://images.unsplash.com/photo-1543429258-c5ca3a1c0d9e?w=600&q=80',
  'Duomo': 'https://images.unsplash.com/photo-1543429258-c5ca3a1c0d9e?w=600&q=80',
  'Ponte Vecchio': 'https://images.unsplash.com/photo-1543429258-c5ca3a1c0d9e?w=600&q=80',
  'Accademia': 'https://images.unsplash.com/photo-1543429258-c5ca3a1c0d9e?w=600&q=80',
  'St. Mark\'s Basilica': 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=600&q=80',
  'Grand Canal': 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=600&q=80',
  'Rialto Bridge': 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=600&q=80',
  'Doge\'s Palace': 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=600&q=80',
  'Positano': 'https://images.unsplash.com/photo-1534008897995-27a23e859048?w=600&q=80',
  'Ravello': 'https://images.unsplash.com/photo-1534008897995-27a23e859048?w=600&q=80',
  'Amalfi': 'https://images.unsplash.com/photo-1534008897995-27a23e859048?w=600&q=80',
  'Path of the Gods': 'https://images.unsplash.com/photo-1534008897995-27a23e859048?w=600&q=80',
};

/**
 * Get the image URL for a city
 */
export function getCityImage(cityName: string): string {
  return CITY_IMAGES[cityName] || `https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80`;
}

/**
 * Get the image URL for a top site/attraction
 */
export function getSiteImage(siteName: string): string {
  return SITE_IMAGES[siteName] || `https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80`;
}
