'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Heart,
  MapPin,
  Star,
  Hotel,
  Compass,
  Building2,
  Check,
  ChevronRight,
  Lock,
  Plus,
  X,
} from 'lucide-react';


interface Listing {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  rating?: number;
  priceLevel?: string;
  category: string;
  neighborhood?: string;
  tags?: string[];
}

interface SteppedCurationProps {
  destinations: string[];  // Changed to array for multi-destination support
  tripStyles: string[];
  onTripStylesChange: (styles: string[]) => void;
  selectedCities: string[];
  onCitiesChange: (cities: string[]) => void;
  selectedHotels: string[];
  onHotelsChange: (hotels: string[]) => void;
  selectedActivities: string[];
  onActivitiesChange: (activities: string[]) => void;
}

// Country flag emojis
const COUNTRY_FLAGS: Record<string, string> = {
  'japan': '🇯🇵',
  'italy': '🇮🇹',
  'france': '🇫🇷',
  'spain': '🇪🇸',
  'thailand': '🇹🇭',
  'switzerland': '🇨🇭',
  'vietnam': '🇻🇳',
  'hawaii': '🇺🇸',
  'usa': '🇺🇸',
};

// Available trip styles
const AVAILABLE_TRIP_STYLES = [
  'Culture',
  'Food',
  'Adventure',
  'Relaxation',
  'History',
  'Nature',
  'Nightlife',
  'Shopping',
  'Art',
  'Beach',
  'Photography',
  'Wellness',
];

// Destination-specific city data
const DESTINATION_CITIES: Record<string, { name: string; description: string; tags: string[] }[]> = {
  'japan': [
    { name: 'Tokyo', description: 'Japan\'s bustling capital with neon-lit skyscrapers, ancient temples, and world-class cuisine.', tags: ['Capital', 'Urban', 'Culture'] },
    { name: 'Kyoto', description: 'Historic city with over 2,000 temples and shrines, traditional geisha districts, and stunning gardens.', tags: ['Historic', 'Temples', 'Traditional'] },
    { name: 'Osaka', description: 'Known for street food, vibrant nightlife, and friendly locals. Japan\'s kitchen.', tags: ['Food', 'Nightlife', 'Urban'] },
    { name: 'Hiroshima', description: 'City of peace with moving memorials and nearby scenic Miyajima Island.', tags: ['History', 'Memorial', 'Day Trip'] },
    { name: 'Nara', description: 'Ancient capital with free-roaming deer and magnificent Todaiji Temple.', tags: ['Nature', 'Temples', 'Day Trip'] },
    { name: 'Hakone', description: 'Mountain resort town famous for hot springs, art museums, and Mt. Fuji views.', tags: ['Onsen', 'Nature', 'Relaxation'] },
    { name: 'Nikko', description: 'UNESCO World Heritage site with ornate shrines and beautiful national park.', tags: ['UNESCO', 'Nature', 'Temples'] },
    { name: 'Kanazawa', description: 'Well-preserved Edo-era districts, beautiful gardens, and fresh seafood.', tags: ['Historic', 'Gardens', 'Food'] },
    { name: 'Takayama', description: 'Charming mountain town with old wooden houses and morning markets.', tags: ['Traditional', 'Mountain', 'Markets'] },
    { name: 'Kamakura', description: 'Coastal town with the famous Great Buddha and many hiking trails.', tags: ['Temples', 'Beach', 'Day Trip'] },
  ],
  'italy': [
    { name: 'Rome', description: 'The Eternal City with ancient ruins, Vatican treasures, and world-famous cuisine.', tags: ['Capital', 'History', 'Culture'] },
    { name: 'Florence', description: 'Renaissance art capital with stunning architecture, museums, and Tuscan charm.', tags: ['Art', 'Museums', 'Architecture'] },
    { name: 'Venice', description: 'Romantic canal city with gondolas, historic palaces, and unique island atmosphere.', tags: ['Romantic', 'Unique', 'Historic'] },
    { name: 'Milan', description: 'Fashion and design capital with the Duomo, Last Supper, and upscale shopping.', tags: ['Fashion', 'Art', 'Urban'] },
    { name: 'Amalfi Coast', description: 'Dramatic coastline with colorful cliffside villages and stunning Mediterranean views.', tags: ['Scenic', 'Beach', 'Romantic'] },
    { name: 'Cinque Terre', description: 'Five picturesque fishing villages connected by hiking trails along the coast.', tags: ['Scenic', 'Hiking', 'Coastal'] },
    { name: 'Naples', description: 'Vibrant city with incredible pizza, Pompeii access, and authentic Italian spirit.', tags: ['Food', 'History', 'Authentic'] },
    { name: 'Siena', description: 'Medieval hill town with the famous Piazza del Campo and Tuscan wine country.', tags: ['Medieval', 'Wine', 'Historic'] },
    { name: 'Bologna', description: 'Italy\'s culinary capital with beautiful arcades and authentic pasta traditions.', tags: ['Food', 'University', 'Authentic'] },
    { name: 'Lake Como', description: 'Stunning Alpine lake surrounded by elegant villas and charming lakeside towns.', tags: ['Lake', 'Luxury', 'Scenic'] },
  ],
  'france': [
    { name: 'Paris', description: 'City of Light with iconic landmarks, world-class museums, and romantic ambiance.', tags: ['Capital', 'Culture', 'Romantic'] },
    { name: 'Nice', description: 'French Riviera gem with beautiful beaches, old town charm, and Mediterranean vibes.', tags: ['Beach', 'Coastal', 'Art'] },
    { name: 'Lyon', description: 'Gastronomic capital of France with historic old town and excellent cuisine.', tags: ['Food', 'History', 'Culture'] },
    { name: 'Bordeaux', description: 'Wine lover\'s paradise with elegant architecture and world-renowned vineyards.', tags: ['Wine', 'Architecture', 'Food'] },
    { name: 'Provence', description: 'Lavender fields, charming villages, and quintessential French countryside.', tags: ['Countryside', 'Nature', 'Relaxation'] },
    { name: 'Marseille', description: 'Port city with diverse culture, stunning calanques, and Mediterranean flair.', tags: ['Coastal', 'Diverse', 'Nature'] },
    { name: 'Strasbourg', description: 'Alsatian charm with half-timbered houses, Christmas markets, and Franco-German culture.', tags: ['Historic', 'Unique', 'Markets'] },
    { name: 'Mont Saint-Michel', description: 'Dramatic island abbey rising from the sea, a medieval marvel.', tags: ['UNESCO', 'Historic', 'Unique'] },
    { name: 'Chamonix', description: 'Alpine adventure hub at the base of Mont Blanc with world-class skiing and hiking.', tags: ['Mountain', 'Adventure', 'Nature'] },
    { name: 'Loire Valley', description: 'Fairy-tale châteaux, vineyards, and picturesque river landscapes.', tags: ['Castles', 'Wine', 'History'] },
  ],
  'spain': [
    { name: 'Barcelona', description: 'Gaudí\'s masterpieces, beautiful beaches, and vibrant Catalan culture.', tags: ['Architecture', 'Beach', 'Culture'] },
    { name: 'Madrid', description: 'Spain\'s capital with world-class art museums, tapas culture, and lively nightlife.', tags: ['Capital', 'Art', 'Nightlife'] },
    { name: 'Seville', description: 'Flamenco heartland with stunning Moorish architecture and passionate spirit.', tags: ['Flamenco', 'Historic', 'Culture'] },
    { name: 'Granada', description: 'The magnificent Alhambra palace and charming Albaicín neighborhood.', tags: ['Moorish', 'UNESCO', 'Historic'] },
    { name: 'San Sebastián', description: 'Culinary capital with pintxos culture, beautiful beach, and Basque charm.', tags: ['Food', 'Beach', 'Culture'] },
    { name: 'Valencia', description: 'City of Arts and Sciences, paella birthplace, and Mediterranean beaches.', tags: ['Modern', 'Food', 'Beach'] },
    { name: 'Mallorca', description: 'Balearic island with stunning beaches, mountains, and charming villages.', tags: ['Island', 'Beach', 'Nature'] },
    { name: 'Toledo', description: 'Medieval city of three cultures with stunning hilltop views.', tags: ['Medieval', 'History', 'Day Trip'] },
    { name: 'Córdoba', description: 'Historic Mezquita and beautiful patios in the heart of Andalusia.', tags: ['Moorish', 'Historic', 'Culture'] },
    { name: 'Bilbao', description: 'Guggenheim Museum and Basque culinary excellence in a transformed industrial city.', tags: ['Art', 'Food', 'Modern'] },
  ],
  'thailand': [
    { name: 'Bangkok', description: 'Vibrant capital with ornate temples, street food paradise, and modern malls.', tags: ['Capital', 'Food', 'Culture'] },
    { name: 'Chiang Mai', description: 'Northern cultural hub with ancient temples, night markets, and elephant sanctuaries.', tags: ['Temples', 'Culture', 'Nature'] },
    { name: 'Phuket', description: 'Thailand\'s largest island with beautiful beaches and vibrant nightlife.', tags: ['Beach', 'Island', 'Nightlife'] },
    { name: 'Krabi', description: 'Dramatic limestone cliffs, island-hopping, and rock climbing adventures.', tags: ['Beach', 'Adventure', 'Island'] },
    { name: 'Koh Samui', description: 'Tropical island with palm-fringed beaches and luxury resorts.', tags: ['Beach', 'Island', 'Luxury'] },
    { name: 'Ayutthaya', description: 'Ancient capital with impressive temple ruins, perfect day trip from Bangkok.', tags: ['History', 'UNESCO', 'Day Trip'] },
    { name: 'Pai', description: 'Laid-back mountain town with hot springs, waterfalls, and bohemian vibes.', tags: ['Mountain', 'Relaxation', 'Nature'] },
    { name: 'Koh Phi Phi', description: 'Stunning island famous for Maya Bay and crystal-clear waters.', tags: ['Island', 'Beach', 'Snorkeling'] },
    { name: 'Chiang Rai', description: 'Northern gem with the White Temple and Golden Triangle.', tags: ['Temples', 'Art', 'Culture'] },
    { name: 'Sukhothai', description: 'Historic park with ancient Buddhist temples from Thailand\'s first kingdom.', tags: ['History', 'UNESCO', 'Temples'] },
  ],
  'vietnam': [
    { name: 'Hanoi', description: 'Ancient capital with French colonial architecture, vibrant Old Quarter, and legendary street food.', tags: ['Capital', 'Culture', 'Food'] },
    { name: 'Ho Chi Minh City', description: 'Dynamic southern metropolis with war history museums, rooftop bars, and buzzing markets.', tags: ['Urban', 'History', 'Nightlife'] },
    { name: 'Hoi An', description: 'UNESCO ancient town with lantern-lit streets, tailor shops, and beautiful beaches nearby.', tags: ['UNESCO', 'Culture', 'Beach'] },
    { name: 'Da Nang', description: 'Modern coastal city with stunning beaches, Ba Na Hills, and the Golden Bridge.', tags: ['Beach', 'Modern', 'Adventure'] },
    { name: 'Ha Long Bay', description: 'UNESCO World Heritage site with thousands of limestone karsts rising from emerald waters.', tags: ['UNESCO', 'Nature', 'Cruise'] },
    { name: 'Sapa', description: 'Mountain town with terraced rice paddies, ethnic minority villages, and trekking.', tags: ['Mountain', 'Trekking', 'Culture'] },
    { name: 'Hue', description: 'Imperial city with ancient citadel, royal tombs, and traditional cuisine.', tags: ['History', 'UNESCO', 'Culture'] },
    { name: 'Nha Trang', description: 'Beach resort city with islands, diving, and vibrant nightlife.', tags: ['Beach', 'Diving', 'Nightlife'] },
    { name: 'Phu Quoc', description: 'Tropical island paradise with pristine beaches, seafood, and sunsets.', tags: ['Island', 'Beach', 'Relaxation'] },
    { name: 'Ninh Binh', description: 'Stunning karst landscape with boat rides through caves and ancient temples.', tags: ['Nature', 'UNESCO', 'Scenic'] },
  ],
  'hawaii': [
    { name: 'Honolulu', description: 'Capital city on Oahu with Waikiki Beach, Diamond Head, and Pearl Harbor.', tags: ['Capital', 'Beach', 'History'] },
    { name: 'Maui', description: 'The Valley Isle with Road to Hana, Haleakala sunrise, and world-class beaches.', tags: ['Beach', 'Nature', 'Adventure'] },
    { name: 'Kauai', description: 'The Garden Isle with Na Pali Coast, Waimea Canyon, and lush rainforests.', tags: ['Nature', 'Hiking', 'Scenic'] },
    { name: 'Big Island', description: 'Hawaii Island with active volcanoes, black sand beaches, and diverse landscapes.', tags: ['Volcano', 'Nature', 'Adventure'] },
    { name: 'North Shore Oahu', description: 'Legendary surfing destination with laid-back vibes and shrimp trucks.', tags: ['Surfing', 'Beach', 'Food'] },
    { name: 'Lahaina', description: 'Historic whaling town on Maui with art galleries and oceanfront dining.', tags: ['Historic', 'Art', 'Food'] },
    { name: 'Kona', description: 'Sunny west coast of Big Island with coffee farms, snorkeling, and manta rays.', tags: ['Coffee', 'Beach', 'Snorkeling'] },
    { name: 'Hanalei', description: 'Charming town on Kauai\'s north shore with stunning bay and mountains.', tags: ['Beach', 'Scenic', 'Relaxation'] },
  ],
  'switzerland': [
    { name: 'Zurich', description: 'Largest city with beautiful old town, lake views, and world-class shopping.', tags: ['Urban', 'Lake', 'Culture'] },
    { name: 'Lucerne', description: 'Picturesque city with covered bridges, mountain backdrops, and lake cruises.', tags: ['Scenic', 'Lake', 'Historic'] },
    { name: 'Interlaken', description: 'Adventure capital between two lakes, gateway to Jungfrau region.', tags: ['Adventure', 'Mountain', 'Nature'] },
    { name: 'Zermatt', description: 'Car-free village with iconic Matterhorn views and world-class skiing.', tags: ['Mountain', 'Skiing', 'Iconic'] },
    { name: 'Geneva', description: 'International city with lake promenade, UN headquarters, and French influence.', tags: ['International', 'Lake', 'Culture'] },
    { name: 'Bern', description: 'Medieval capital with arcaded streets and bear park along the river.', tags: ['Capital', 'Historic', 'UNESCO'] },
    { name: 'Grindelwald', description: 'Alpine village with stunning Eiger views and hiking paradise.', tags: ['Mountain', 'Hiking', 'Scenic'] },
    { name: 'Lauterbrunnen', description: 'Valley of 72 waterfalls, one of the most spectacular places in Switzerland.', tags: ['Waterfalls', 'Nature', 'Scenic'] },
    { name: 'Montreux', description: 'Lakeside town famous for jazz festival and Château de Chillon.', tags: ['Lake', 'Music', 'Castle'] },
    { name: 'St. Moritz', description: 'Glamorous Alpine resort with luxury skiing and sparkling lake.', tags: ['Luxury', 'Skiing', 'Resort'] },
  ],
};

// Generate cities for multiple destinations
function generateCitiesForDestinations(destinations: string[]): { destination: string; cities: Listing[] }[] {
  const results: { destination: string; cities: Listing[] }[] = [];

  for (const dest of destinations) {
    const destLower = dest.toLowerCase();
    let matchedKey = '';
    let cities: { name: string; description: string; tags: string[] }[] = [];

    for (const [key, value] of Object.entries(DESTINATION_CITIES)) {
      if (destLower.includes(key) || key.includes(destLower)) {
        matchedKey = key;
        cities = value;
        break;
      }
    }

    if (cities.length > 0) {
      results.push({
        destination: dest,
        cities: cities.map((city, index) => ({
          id: `${matchedKey}-city-${index + 1}`,
          name: city.name,
          description: city.description,
          imageUrl: `/api/placeholder/city/${encodeURIComponent(city.name)}`,
          category: 'cities',
          tags: city.tags,
        })),
      });
    }
  }

  return results;
}

// Generate hotels based on selected cities
function generateHotels(destination: string): Listing[] {
  return [
    {
      id: 'hotel-1',
      name: 'Boutique Hotel Central',
      description: 'Charming boutique hotel in the heart of the city. Rooftop bar and complimentary breakfast.',
      imageUrl: null,
      rating: 4.7,
      priceLevel: '$$$',
      category: 'hotels',
      neighborhood: 'City Center',
      tags: ['Boutique', 'Central', 'Breakfast included'],
    },
    {
      id: 'hotel-2',
      name: 'Grand Heritage Hotel',
      description: 'Luxurious historic property with modern amenities. Full-service spa and fine dining.',
      imageUrl: null,
      rating: 4.9,
      priceLevel: '$$$$',
      category: 'hotels',
      neighborhood: 'Old Town',
      tags: ['Luxury', 'Historic', 'Spa'],
    },
    {
      id: 'hotel-3',
      name: 'Urban Hostel & Suites',
      description: 'Budget-friendly with private rooms and social vibes. Rooftop terrace and bar.',
      imageUrl: null,
      rating: 4.4,
      priceLevel: '$',
      category: 'hotels',
      neighborhood: 'Arts District',
      tags: ['Budget', 'Social', 'Rooftop'],
    },
    {
      id: 'hotel-4',
      name: 'Seaside Resort',
      description: 'Beachfront property with pool and ocean views. Perfect for relaxation.',
      imageUrl: null,
      rating: 4.6,
      priceLevel: '$$$',
      category: 'hotels',
      neighborhood: 'Waterfront',
      tags: ['Beach', 'Pool', 'Views'],
    },
  ];
}

// City-specific attractions data
const CITY_ATTRACTIONS: Record<string, { name: string; description: string; rating: number; tags: string[]; image: string | null }[]> = {
  // Thailand
  'Koh Samui': [
    { name: 'Big Buddha Temple', description: 'Iconic 12-meter golden Buddha statue at Wat Phra Yai with panoramic views.', rating: 4.6, tags: ['Temple', 'Culture', 'Landmark'], image: null },
    { name: 'Ang Thong Marine Park', description: '42 stunning islands with emerald lagoons, caves, and pristine beaches.', rating: 4.8, tags: ['Nature', 'Beach', 'Adventure'], image: null },
    { name: 'Wat Plai Laem', description: 'Colorful temple complex featuring an 18-arm Guanyin statue on the water.', rating: 4.7, tags: ['Temple', 'Culture', 'Photography'], image: null },
    { name: 'Na Mueng Waterfall', description: 'Beautiful two-tiered waterfall in the jungle, great for swimming.', rating: 4.4, tags: ['Nature', 'Waterfall', 'Adventure'], image: null },
    { name: 'Lamai Night Market', description: 'Vibrant night market with street food, clothes, and local crafts.', rating: 4.5, tags: ['Food', 'Shopping', 'Nightlife'], image: null },
    { name: 'Pig Island (Koh Madsum)', description: 'Charming island famous for friendly pigs on the beach.', rating: 4.6, tags: ['Beach', 'Unique', 'Family'], image: null },
    { name: 'Grandfather & Grandmother Rocks', description: 'Unique rock formations on Lamai Beach with interesting shapes.', rating: 4.2, tags: ['Nature', 'Landmark', 'Beach'], image: null },
    { name: 'Fisherman\'s Village', description: 'Charming area in Bophut with boutiques, restaurants, and Friday night market.', rating: 4.6, tags: ['Shopping', 'Food', 'Nightlife'], image: null },
    { name: 'Secret Buddha Garden', description: 'Hidden hillside garden with Buddhist statues and jungle views.', rating: 4.5, tags: ['Culture', 'Nature', 'Adventure'], image: null },
    { name: 'Overlap Stone', description: 'Viewpoint with stunning panoramic views of Lamai Beach.', rating: 4.7, tags: ['Viewpoint', 'Photography', 'Nature'], image: null },
  ],
  'Chiang Mai': [
    { name: 'Wat Doi Suthep', description: 'Sacred temple on a mountain with 309 steps and city views.', rating: 4.7, tags: ['Temple', 'Culture', 'Viewpoint'], image: null },
    { name: 'Elephant Nature Park', description: 'Ethical elephant sanctuary where you can feed and bathe elephants.', rating: 4.9, tags: ['Nature', 'Animals', 'Experience'], image: null },
    { name: 'Night Bazaar', description: 'Famous night market with handicrafts, food, and entertainment.', rating: 4.5, tags: ['Shopping', 'Food', 'Nightlife'], image: null },
    { name: 'Old City Temples', description: 'Historic walled city with ancient temples including Wat Chedi Luang.', rating: 4.6, tags: ['Temple', 'History', 'Walking'], image: null },
    { name: 'Sticky Waterfalls', description: 'Unique limestone waterfall you can climb up - the rocks are not slippery!', rating: 4.7, tags: ['Nature', 'Adventure', 'Unique'], image: null },
    { name: 'Doi Inthanon', description: 'Thailand\'s highest peak with twin pagodas and cool mountain trails.', rating: 4.8, tags: ['Nature', 'Hiking', 'Viewpoint'], image: null },
    { name: 'Wua Lai Walking Street', description: 'Saturday night market famous for silver jewelry and local crafts.', rating: 4.6, tags: ['Shopping', 'Culture', 'Nightlife'], image: null },
    { name: 'Thai Cooking Class', description: 'Learn to cook authentic Thai dishes at a local cooking school.', rating: 4.9, tags: ['Food', 'Experience', 'Culture'], image: null },
    { name: 'Wat Phra Singh', description: 'Important temple housing the revered Phra Singh Buddha image.', rating: 4.6, tags: ['Temple', 'Culture', 'History'], image: null },
    { name: 'Grand Canyon Water Park', description: 'Former quarry turned into a fun water park with cliff jumping.', rating: 4.4, tags: ['Adventure', 'Swimming', 'Fun'], image: null },
  ],
  'Bangkok': [
    { name: 'Grand Palace', description: 'Stunning royal palace complex with the sacred Emerald Buddha.', rating: 4.7, tags: ['Palace', 'Culture', 'History'], image: null },
    { name: 'Wat Arun', description: 'Iconic Temple of Dawn with intricate porcelain-covered spires.', rating: 4.8, tags: ['Temple', 'Landmark', 'Photography'], image: null },
    { name: 'Chatuchak Weekend Market', description: 'One of the world\'s largest markets with 15,000+ stalls.', rating: 4.6, tags: ['Shopping', 'Food', 'Experience'], image: null },
    { name: 'Khao San Road', description: 'Famous backpacker street with bars, food, and lively nightlife.', rating: 4.3, tags: ['Nightlife', 'Food', 'Social'], image: null },
    { name: 'Floating Markets', description: 'Traditional markets on canals selling food and goods from boats.', rating: 4.5, tags: ['Culture', 'Food', 'Unique'], image: null },
    { name: 'Wat Pho', description: 'Temple of the Reclining Buddha - 46 meters of gold-plated Buddha.', rating: 4.7, tags: ['Temple', 'Culture', 'Landmark'], image: null },
    { name: 'Chinatown (Yaowarat)', description: 'Vibrant district with incredible street food and gold shops.', rating: 4.6, tags: ['Food', 'Culture', 'Nightlife'], image: null },
    { name: 'Jim Thompson House', description: 'Beautiful Thai house museum of the famous silk entrepreneur.', rating: 4.5, tags: ['Museum', 'Culture', 'History'], image: null },
    { name: 'Rooftop Bars', description: 'Sky-high bars with stunning city views and cocktails.', rating: 4.7, tags: ['Nightlife', 'Views', 'Romantic'], image: null },
    { name: 'Thai Massage', description: 'Traditional Thai massage at temples or luxury spas.', rating: 4.8, tags: ['Wellness', 'Relaxation', 'Experience'], image: null },
  ],
  'Phuket': [
    { name: 'Big Buddha', description: '45-meter marble Buddha statue with panoramic island views.', rating: 4.6, tags: ['Temple', 'Landmark', 'Viewpoint'], image: null },
    { name: 'Phi Phi Islands Day Trip', description: 'Visit Maya Bay and snorkel crystal-clear waters.', rating: 4.8, tags: ['Beach', 'Snorkeling', 'Day Trip'], image: null },
    { name: 'Patong Beach', description: 'Main tourist beach with water sports and nightlife.', rating: 4.3, tags: ['Beach', 'Nightlife', 'Water Sports'], image: null },
    { name: 'Old Phuket Town', description: 'Charming Sino-Portuguese architecture and local cafes.', rating: 4.6, tags: ['Culture', 'Photography', 'Food'], image: null },
    { name: 'Phang Nga Bay', description: 'Stunning limestone karsts including James Bond Island.', rating: 4.8, tags: ['Nature', 'Kayaking', 'Day Trip'], image: null },
    { name: 'Kata Beach', description: 'Beautiful family-friendly beach with good surfing.', rating: 4.5, tags: ['Beach', 'Family', 'Surfing'], image: null },
    { name: 'Bangla Road', description: 'Famous nightlife street in Patong with bars and shows.', rating: 4.2, tags: ['Nightlife', 'Entertainment', 'Social'], image: null },
    { name: 'Elephant Sanctuary', description: 'Ethical elephant experience in natural surroundings.', rating: 4.8, tags: ['Nature', 'Animals', 'Experience'], image: null },
  ],
  // Japan
  'Tokyo': [
    { name: 'Senso-ji Temple', description: 'Tokyo\'s oldest temple with iconic red gate and shopping street.', rating: 4.7, tags: ['Temple', 'Culture', 'Shopping'], image: null },
    { name: 'Shibuya Crossing', description: 'World\'s busiest pedestrian crossing - a must-see Tokyo experience.', rating: 4.6, tags: ['Landmark', 'Urban', 'Photography'], image: null },
    { name: 'Tsukiji Outer Market', description: 'Fresh sushi, seafood, and Japanese street food paradise.', rating: 4.8, tags: ['Food', 'Market', 'Experience'], image: null },
    { name: 'Meiji Shrine', description: 'Peaceful Shinto shrine in a forested oasis in Harajuku.', rating: 4.7, tags: ['Temple', 'Nature', 'Culture'], image: null },
    { name: 'TeamLab Borderless', description: 'Immersive digital art museum with stunning interactive exhibits.', rating: 4.9, tags: ['Art', 'Technology', 'Experience'], image: null },
    { name: 'Shinjuku Gyoen', description: 'Beautiful garden combining Japanese, French, and English styles.', rating: 4.6, tags: ['Nature', 'Garden', 'Relaxation'], image: null },
    { name: 'Akihabara', description: 'Electric Town - anime, manga, electronics, and gaming paradise.', rating: 4.5, tags: ['Shopping', 'Culture', 'Unique'], image: null },
    { name: 'Golden Gai', description: 'Narrow alleys with tiny bars in Shinjuku - unique nightlife.', rating: 4.6, tags: ['Nightlife', 'Culture', 'Experience'], image: null },
    { name: 'Tokyo Skytree', description: '634m tower with observation decks and city panoramas.', rating: 4.5, tags: ['Viewpoint', 'Landmark', 'Photography'], image: null },
    { name: 'Harajuku', description: 'Youth fashion capital with quirky shops and crepe stands.', rating: 4.5, tags: ['Shopping', 'Culture', 'Food'], image: null },
  ],
  'Kyoto': [
    { name: 'Fushimi Inari Shrine', description: 'Thousands of vermillion torii gates winding up a mountain.', rating: 4.9, tags: ['Temple', 'Photography', 'Hiking'], image: null },
    { name: 'Arashiyama Bamboo Grove', description: 'Magical bamboo forest - best visited at sunrise.', rating: 4.7, tags: ['Nature', 'Photography', 'Walking'], image: null },
    { name: 'Kinkaku-ji (Golden Pavilion)', description: 'Stunning Zen temple covered in gold leaf.', rating: 4.8, tags: ['Temple', 'Landmark', 'Photography'], image: null },
    { name: 'Gion District', description: 'Historic geisha district with traditional wooden machiya.', rating: 4.7, tags: ['Culture', 'History', 'Walking'], image: null },
    { name: 'Nishiki Market', description: 'Kyoto\'s kitchen - 400m of food stalls and local delicacies.', rating: 4.6, tags: ['Food', 'Market', 'Culture'], image: null },
    { name: 'Kiyomizu-dera', description: 'Iconic wooden temple with stunning views over the city.', rating: 4.8, tags: ['Temple', 'Viewpoint', 'History'], image: null },
    { name: 'Tea Ceremony Experience', description: 'Traditional Japanese tea ceremony in a historic tea house.', rating: 4.8, tags: ['Culture', 'Experience', 'Traditional'], image: null },
    { name: 'Philosopher\'s Path', description: 'Scenic canal-side walk lined with cherry trees.', rating: 4.6, tags: ['Walking', 'Nature', 'Relaxation'], image: null },
  ],
  'Osaka': [
    { name: 'Dotonbori', description: 'Neon-lit food street famous for takoyaki and the Glico sign.', rating: 4.7, tags: ['Food', 'Nightlife', 'Landmark'], image: null },
    { name: 'Osaka Castle', description: 'Historic castle with museum and beautiful park grounds.', rating: 4.6, tags: ['History', 'Landmark', 'Park'], image: null },
    { name: 'Kuromon Market', description: 'Osaka\'s kitchen with fresh seafood and street food.', rating: 4.7, tags: ['Food', 'Market', 'Experience'], image: null },
    { name: 'Universal Studios Japan', description: 'Theme park with Harry Potter and Nintendo worlds.', rating: 4.8, tags: ['Entertainment', 'Family', 'Fun'], image: null },
    { name: 'Shinsekai', description: 'Retro district with kushikatsu and Tsutenkaku Tower.', rating: 4.5, tags: ['Food', 'Culture', 'Nightlife'], image: null },
    { name: 'Takoyaki Experience', description: 'Learn to make Osaka\'s famous octopus balls.', rating: 4.6, tags: ['Food', 'Experience', 'Culture'], image: null },
  ],
};

// Generate activities based on selected cities
function generateActivities(selectedCities: string[], tripStyles: string[]): Listing[] {
  const activities: Listing[] = [];
  let idCounter = 1;

  // Get attractions for each selected city
  for (const cityName of selectedCities) {
    // Find attractions for this city (try exact match first, then partial)
    let cityAttractions = CITY_ATTRACTIONS[cityName];

    if (!cityAttractions) {
      // Try to find a partial match
      for (const [key, value] of Object.entries(CITY_ATTRACTIONS)) {
        if (cityName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(cityName.toLowerCase())) {
          cityAttractions = value;
          break;
        }
      }
    }

    if (cityAttractions) {
      for (const attraction of cityAttractions) {
        activities.push({
          id: `act-${idCounter++}`,
          name: attraction.name,
          description: attraction.description,
          imageUrl: attraction.image,
          rating: attraction.rating,
          category: 'activities',
          neighborhood: cityName,
          tags: attraction.tags,
        });
      }
    }
  }

  // If no cities selected or no attractions found, return empty
  if (activities.length === 0) {
    return [];
  }

  // Filter by trip styles if any are selected
  if (tripStyles.length > 0) {
    const lowerStyles = tripStyles.map(s => s.toLowerCase());
    return activities.filter(act =>
      act.tags?.some(tag => lowerStyles.includes(tag.toLowerCase()))
    );
  }

  return activities;
}

type Step = 'cities' | 'hotels' | 'activities';

const STEP_CONFIG: { key: Step; label: string; icon: typeof Building2 }[] = [
  { key: 'cities', label: 'Pick Cities', icon: Building2 },
  { key: 'hotels', label: 'Pick Hotels', icon: Hotel },
  { key: 'activities', label: 'Pick Activities', icon: Compass },
];

export function SteppedCuration({
  destinations,
  tripStyles,
  onTripStylesChange,
  selectedCities,
  onCitiesChange,
  selectedHotels,
  onHotelsChange,
  selectedActivities,
  onActivitiesChange,
}: SteppedCurationProps) {
  const [currentStep, setCurrentStep] = useState<Step>('cities');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Generate cities for all destinations
  const destinationCities = generateCitiesForDestinations(destinations);

  // Get all cities or filtered by country
  const allCities = destinationCities.flatMap(dc => dc.cities);
  const filteredCities = selectedCountry
    ? destinationCities.find(dc => dc.destination.toLowerCase().includes(selectedCountry.toLowerCase()))?.cities || []
    : allCities;

  const hotels = generateHotels(destinations[0] || '');

  // Get the actual city names from selected city IDs
  const selectedCityNames = selectedCities.map(cityId => {
    const city = allCities.find(c => c.id === cityId);
    return city?.name || '';
  }).filter(name => name !== '');

  const activities = generateActivities(selectedCityNames, tripStyles);

  const getStepStatus = (step: Step): 'completed' | 'current' | 'locked' => {
    const stepIndex = STEP_CONFIG.findIndex(s => s.key === step);
    const currentIndex = STEP_CONFIG.findIndex(s => s.key === currentStep);

    if (step === 'cities') {
      return currentStep === 'cities' ? 'current' : (selectedCities.length > 0 ? 'completed' : 'current');
    }
    if (step === 'hotels') {
      if (selectedCities.length === 0) return 'locked';
      return currentStep === 'hotels' ? 'current' : (selectedHotels.length > 0 ? 'completed' : 'current');
    }
    if (step === 'activities') {
      if (selectedCities.length === 0 || selectedHotels.length === 0) return 'locked';
      return currentStep === 'activities' ? 'current' : 'current';
    }
    return 'locked';
  };

  const canProceed = (step: Step): boolean => {
    if (step === 'cities') return true;
    if (step === 'hotels') return selectedCities.length > 0;
    if (step === 'activities') return selectedCities.length > 0 && selectedHotels.length > 0;
    return false;
  };

  const getListingsForStep = () => {
    switch (currentStep) {
      case 'cities':
        return filteredCities;
      case 'hotels':
        return hotels;
      case 'activities':
        return activities;
    }
  };

  const getSelectedForStep = () => {
    switch (currentStep) {
      case 'cities':
        return selectedCities;
      case 'hotels':
        return selectedHotels;
      case 'activities':
        return selectedActivities;
    }
  };

  const toggleSelection = (id: string) => {
    switch (currentStep) {
      case 'cities':
        onCitiesChange(
          selectedCities.includes(id)
            ? selectedCities.filter(c => c !== id)
            : [...selectedCities, id]
        );
        break;
      case 'hotels':
        onHotelsChange(
          selectedHotels.includes(id)
            ? selectedHotels.filter(h => h !== id)
            : [...selectedHotels, id]
        );
        break;
      case 'activities':
        onActivitiesChange(
          selectedActivities.includes(id)
            ? selectedActivities.filter(a => a !== id)
            : [...selectedActivities, id]
        );
        break;
    }
  };

  const toggleTripStyle = (style: string) => {
    onTripStylesChange(
      tripStyles.includes(style)
        ? tripStyles.filter(s => s !== style)
        : [...tripStyles, style]
    );
  };

  return (
    <div className="space-y-4">
      {/* Trip Styles (Editable) */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Trip Style</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => setShowStylePicker(true)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tripStyles.length > 0 ? (
              tripStyles.map((style) => (
                <Badge
                  key={style}
                  variant="default"
                  className="text-xs cursor-pointer hover:bg-primary/80"
                  onClick={() => toggleTripStyle(style)}
                >
                  {style}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">
                No styles selected. Tap Edit to add trip styles.
              </span>
            )}
          </div>
          {tripStyles.length > 0 && currentStep === 'activities' && (
            <p className="text-xs text-muted-foreground mt-2">
              Activities are filtered based on your trip styles
            </p>
          )}
        </CardContent>
      </Card>

      {/* Step Progress */}
      <div className="flex gap-2">
        {STEP_CONFIG.map(({ key, label, icon: Icon }, index) => {
          const status = getStepStatus(key);
          const isClickable = canProceed(key);

          return (
            <button
              key={key}
              onClick={() => isClickable && setCurrentStep(key)}
              disabled={!isClickable}
              className={`flex-1 p-3 rounded-xl border transition-all ${
                status === 'current'
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                  : status === 'completed'
                  ? 'border-green-200 bg-green-50'
                  : 'border-muted bg-muted/50 opacity-50'
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                {status === 'completed' ? (
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                ) : status === 'locked' ? (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Icon className="w-4 h-4 text-primary" />
                )}
              </div>
              <span className={`text-xs font-medium ${
                status === 'locked' ? 'text-muted-foreground' : ''
              }`}>
                {label}
              </span>
              {status === 'completed' && (
                <div className="text-[10px] text-green-600 mt-0.5">
                  {key === 'cities' && `${selectedCities.length} selected`}
                  {key === 'hotels' && `${selectedHotels.length} selected`}
                  {key === 'activities' && `${selectedActivities.length} selected`}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Country Filter Tabs (only for cities step with multiple destinations) */}
      {currentStep === 'cities' && destinationCities.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCountry(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCountry === null
                ? 'bg-primary text-white'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            All
          </button>
          {destinationCities.map(({ destination }) => {
            const destLower = destination.toLowerCase();
            const flag = Object.entries(COUNTRY_FLAGS).find(([key]) =>
              destLower.includes(key) || key.includes(destLower)
            )?.[1] || '🌍';

            return (
              <button
                key={destination}
                onClick={() => setSelectedCountry(destination)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCountry === destination
                    ? 'bg-primary text-white'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {flag} {destination}
              </button>
            );
          })}
        </div>
      )}

      {/* Current Step Content */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">
            {STEP_CONFIG.find(s => s.key === currentStep)?.label}
          </h3>
          <span className="text-xs text-muted-foreground">
            {getSelectedForStep().length} selected
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {getListingsForStep().map((listing) => (
            <SelectableCard
              key={listing.id}
              listing={listing}
              isSelected={getSelectedForStep().includes(listing.id)}
              onToggle={() => toggleSelection(listing.id)}
              onClick={() => setSelectedListing(listing)}
            />
          ))}
        </div>

        {/* Next Step Button */}
        {currentStep !== 'activities' && getSelectedForStep().length > 0 && (
          <Button
            className="w-full"
            onClick={() => {
              if (currentStep === 'cities') setCurrentStep('hotels');
              else if (currentStep === 'hotels') setCurrentStep('activities');
            }}
          >
            Continue to {currentStep === 'cities' ? 'Hotels' : 'Activities'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Detail Modal */}
      <ListingDetailModal
        listing={selectedListing}
        isOpen={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        isSelected={selectedListing ? getSelectedForStep().includes(selectedListing.id) : false}
        onToggleSelect={() => selectedListing && toggleSelection(selectedListing.id)}
      />

      {/* Trip Style Picker Modal */}
      <Dialog open={showStylePicker} onOpenChange={setShowStylePicker}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Trip Styles</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 pt-2">
            {AVAILABLE_TRIP_STYLES.map((style) => (
              <button
                key={style}
                onClick={() => toggleTripStyle(style)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  tripStyles.includes(style)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
          <Button onClick={() => setShowStylePicker(false)} className="mt-4">
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Selectable card for grid display
function SelectableCard({
  listing,
  isSelected,
  onToggle,
  onClick,
}: {
  listing: Listing;
  isSelected: boolean;
  onToggle: () => void;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative aspect-square rounded-xl overflow-hidden shadow-sm transition-all duration-300 text-left ${
        isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:shadow-lg'
      }`}
    >
      {/* Background Image */}
      <img
        src={listing.imageUrl || `/api/placeholder/city/${encodeURIComponent(listing.name)}`}
        alt={listing.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Selection Toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`absolute top-2 right-2 w-6 h-6 rounded-full transition-all z-10 flex items-center justify-center ${
          isSelected
            ? 'bg-primary text-white'
            : 'bg-white/80 text-gray-400 hover:bg-white'
        }`}
      >
        <Check className={`w-4 h-4 ${isSelected ? '' : 'opacity-0'}`} />
      </button>

      {/* Rating badge */}
      {listing.rating && (
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 rounded-full px-2 py-0.5">
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          <span className="text-xs font-medium">{listing.rating}</span>
        </div>
      )}

      {/* Content */}
      <div className="absolute inset-0 p-3 flex flex-col justify-end text-white">
        <h4 className="font-bold text-sm leading-tight drop-shadow-md line-clamp-2">
          {listing.name}
        </h4>
        {listing.neighborhood && (
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" />
            <span className="text-[10px] opacity-90">{listing.neighborhood}</span>
          </div>
        )}
        {listing.priceLevel && (
          <span className="text-[10px] mt-0.5 opacity-75">{listing.priceLevel}</span>
        )}
      </div>
    </button>
  );
}

// Detail modal
function ListingDetailModal({
  listing,
  isOpen,
  onClose,
  isSelected,
  onToggleSelect,
}: {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  if (!listing) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Hero Image */}
        <div className="relative h-48 w-full">
          <img
            src={listing.imageUrl || `/api/placeholder/city/${encodeURIComponent(listing.name)}`}
            alt={listing.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Rating badge */}
          {listing.rating && (
            <div className="absolute top-4 left-4 flex items-center gap-1 bg-white/90 rounded-full px-2 py-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-semibold">{listing.rating}</span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          <DialogHeader className="space-y-1">
            <div className="flex items-start justify-between">
              <DialogTitle className="text-lg font-bold">{listing.name}</DialogTitle>
              {listing.priceLevel && (
                <span className="text-sm text-muted-foreground">{listing.priceLevel}</span>
              )}
            </div>
            {listing.neighborhood && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{listing.neighborhood}</span>
              </div>
            )}
          </DialogHeader>

          <p className="text-sm text-muted-foreground">{listing.description}</p>

          {/* Tags */}
          {listing.tags && listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {listing.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Action Button */}
          <Button
            variant={isSelected ? 'default' : 'outline'}
            onClick={onToggleSelect}
            className="w-full"
          >
            <Check className={`w-4 h-4 mr-2 ${isSelected ? '' : 'opacity-50'}`} />
            {isSelected ? 'Selected' : 'Select'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { Listing };
