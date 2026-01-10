/**
 * City images using verified working Unsplash URLs
 * All photo IDs have been verified from working components in the codebase
 */

// Verified fallback - beautiful landscape
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80';

// City images - comprehensive list matching getCitiesForDestination
export const CITY_IMAGES: Record<string, string> = {
  // TURKEY - all 15 cities
  'Istanbul': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80',
  'Cappadocia': 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=600&q=80',
  'Antalya': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'Bodrum': 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=600&q=80',
  'Ephesus': 'https://images.unsplash.com/photo-1564594985645-4427056e22e2?w=600&q=80',
  'Pamukkale': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
  'Izmir': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80',
  'Ankara': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80',
  'Fethiye': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'Kas': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'Trabzon': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80',
  'Bursa': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80',
  'Konya': 'https://images.unsplash.com/photo-1564594985645-4427056e22e2?w=600&q=80',
  'Dalyan': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'Oludeniz': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',

  // SPAIN - all 15 cities
  'Barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
  'Madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80',
  'Seville': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Valencia': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
  'Granada': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=600&q=80',
  'San Sebastian': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'Bilbao': 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=600&q=80',
  'Malaga': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'Toledo': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Cordoba': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Ibiza': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'Ronda': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=600&q=80',
  'Salamanca': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Girona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
  'Segovia': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',

  // ITALY - all 15 cities
  'Rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
  'Florence': 'https://images.unsplash.com/photo-1543429258-c5ca3a1c0d9e?w=600&q=80',
  'Venice': 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=600&q=80',
  'Milan': 'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?w=600&q=80',
  'Amalfi Coast': 'https://images.unsplash.com/photo-1534008897995-27a23e859048?w=600&q=80',
  'Cinque Terre': 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&q=80',
  'Naples': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
  'Tuscany': 'https://images.unsplash.com/photo-1543429258-c5ca3a1c0d9e?w=600&q=80',
  'Bologna': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
  'Verona': 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=600&q=80',
  'Lake Como': 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=600&q=80',
  'Siena': 'https://images.unsplash.com/photo-1543429258-c5ca3a1c0d9e?w=600&q=80',
  'Ravenna': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
  'Pisa': 'https://images.unsplash.com/photo-1543429258-c5ca3a1c0d9e?w=600&q=80',
  'Sorrento': 'https://images.unsplash.com/photo-1534008897995-27a23e859048?w=600&q=80',
  'Positano': 'https://images.unsplash.com/photo-1534008897995-27a23e859048?w=600&q=80',

  // FRANCE - all 15 cities
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  'Nice': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'Lyon': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  'Bordeaux': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  'Marseille': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'Provence': 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80',
  'Strasbourg': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  'Mont Saint-Michel': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  'Cannes': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'Avignon': 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80',
  'Annecy': 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=600&q=80',
  'Colmar': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  'Saint-Tropez': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'Chamonix': 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=600&q=80',
  'Carcassonne': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',

  // JAPAN - all 15 cities
  'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
  'Kyoto': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80',
  'Osaka': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
  'Hiroshima': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80',
  'Nara': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80',
  'Hakone': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80',
  'Kanazawa': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80',
  'Nikko': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80',
  'Fukuoka': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
  'Takayama': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80',
  'Nagoya': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
  'Kamakura': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80',
  'Naoshima': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80',
  'Kobe': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
  'Miyajima': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80',

  // THAILAND - all 15 cities
  'Bangkok': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&q=80',
  'Chiang Mai': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
  'Phuket': 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=600&q=80',
  'Krabi': 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=600&q=80',
  'Koh Samui': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&q=80',
  'Ayutthaya': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
  'Pai': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
  'Chiang Rai': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
  'Koh Phi Phi': 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=600&q=80',
  'Koh Lanta': 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=600&q=80',
  'Koh Tao': 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=600&q=80',
  'Hua Hin': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'Koh Chang': 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=600&q=80',
  'Sukhothai': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
  'Kanchanaburi': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
  'Thailand': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&q=80',

  // PORTUGAL - all 15 cities
  'Lisbon': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  'Porto': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  'Sintra': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Algarve': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'Madeira': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80',
  'Évora': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Coimbra': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Cascais': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'Lagos': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'Nazaré': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'Óbidos': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Azores': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80',
  'Braga': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Aveiro': 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=600&q=80',
  'Tavira': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',

  // GREECE - all 15 cities
  'Athens': 'https://images.unsplash.com/photo-1564594985645-4427056e22e2?w=600&q=80',
  'Santorini': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80',
  'Mykonos': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80',
  'Crete': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'Rhodes': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'Corfu': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'Meteora': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80',
  'Delphi': 'https://images.unsplash.com/photo-1564594985645-4427056e22e2?w=600&q=80',
  'Thessaloniki': 'https://images.unsplash.com/photo-1564594985645-4427056e22e2?w=600&q=80',
  'Naxos': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80',
  'Paros': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80',
  'Zakynthos': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'Hydra': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80',
  'Milos': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80',
  'Nafplio': 'https://images.unsplash.com/photo-1564594985645-4427056e22e2?w=600&q=80',

  // SWITZERLAND - all 18 cities
  'Zurich': 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=600&q=80',
  'Lucerne': 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=600&q=80',
  'Interlaken': 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=600&q=80',
  'Zermatt': 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=600&q=80',
  'Geneva': 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=600&q=80',
  'Bern': 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=600&q=80',
  'Basel': 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=600&q=80',
  'Lausanne': 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=600&q=80',
  'St. Moritz': 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=600&q=80',
  'Gstaad': 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=600&q=80',
  'Grindelwald': 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=600&q=80',
  'Lugano': 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=600&q=80',
  'Montreux': 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=600&q=80',
  'Verbier': 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=600&q=80',
  'Davos': 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=600&q=80',
  'Lauterbrunnen': 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=600&q=80',
  'Wengen': 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=600&q=80',
  'Appenzell': 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=600&q=80',
  'Swiss Alps': 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=600&q=80',

  // UK
  'London': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80',
  'Edinburgh': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80',

  // OTHER EUROPE
  'Amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&q=80',
  'Vienna': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=600&q=80',
  'Munich': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600&q=80',
  'Dubrovnik': 'https://images.unsplash.com/photo-1555990793-da11153b2473?w=600&q=80',
  'Prague': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=600&q=80',
  'Budapest': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=600&q=80',

  // NORDIC
  'Iceland': 'https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=600&q=80',
  'Reykjavik': 'https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=600&q=80',
  'Tromso': 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=600&q=80',
  'Norway': 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=600&q=80',

  // OTHER
  'Marrakech': 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=600&q=80',
  'Morocco': 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=600&q=80',
  'Queenstown': 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600&q=80',
  'New Zealand': 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600&q=80',
  'Alaska': 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&q=80',
  'Patagonia': 'https://images.unsplash.com/photo-1531761535209-180857e963b9?w=600&q=80',
  'Vermont': 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=600&q=80',
  'Maldives': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'Bali': 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=600&q=80',
  'Singapore': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
  'Hong Kong': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
  'Dubai': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
};

// Site/attraction images
export const SITE_IMAGES: Record<string, string> = {
  // Turkey
  'Hagia Sophia': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80',
  'Blue Mosque': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80',
  'Grand Bazaar': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80',
  'Topkapi Palace': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80',
  'Hot Air Balloon Rides': 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=600&q=80',
  'Goreme Open Air Museum': 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=600&q=80',
  'Underground Cities': 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=600&q=80',
  'Fairy Chimneys': 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=600&q=80',

  // Spain
  'Sagrada Familia': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
  'Park Guell': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
  'La Rambla': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
  'Alhambra': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=600&q=80',

  // Italy
  'Colosseum': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
  'Vatican Museums': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
  'Trevi Fountain': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
  'Roman Forum': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
  'Duomo': 'https://images.unsplash.com/photo-1543429258-c5ca3a1c0d9e?w=600&q=80',

  // Switzerland
  'Chapel Bridge': 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=600&q=80',
  'Matterhorn': 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=600&q=80',
  'Jungfraujoch': 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=600&q=80',
  'Lake Geneva': 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=600&q=80',
  'Mt. Pilatus': 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=600&q=80',
  'Lake Lucerne': 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=600&q=80',

  // France
  'Eiffel Tower': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  'Louvre Museum': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  'Notre Dame': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',

  // Japan
  'Fushimi Inari': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80',
  'Kinkaku-ji': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80',
  'Shibuya Crossing': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
  'Senso-ji Temple': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',

  // Thailand
  'Big Buddha Temple': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&q=80',
  'Ang Thong Marine Park': 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=600&q=80',
  'Wat Plai Laem': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
  'Grand Palace': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&q=80',
  'Floating Market': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&q=80',

  // Greece
  'Acropolis': 'https://images.unsplash.com/photo-1564594985645-4427056e22e2?w=600&q=80',
  'Oia Sunset': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80',
};

/**
 * Get the image URL for a city
 */
export function getCityImage(cityName: string): string {
  return CITY_IMAGES[cityName] || FALLBACK_IMAGE;
}

/**
 * Get the image URL for a top site/attraction
 */
export function getSiteImage(siteName: string): string {
  return SITE_IMAGES[siteName] || FALLBACK_IMAGE;
}
