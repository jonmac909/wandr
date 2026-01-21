'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Heart, Search, Star, X, Clock, ChevronLeft, ChevronRight, SlidersHorizontal, Loader2, MapPin, Info, Lightbulb, Calendar, Plus } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardHeader, TripDrawer, ProfileSettings } from '@/components/dashboard';
import { tripDb, savedPlacesDb, type StoredTrip } from '@/lib/db/indexed-db';
import { getCityItineraries, type CityItinerary, type CityItineraries } from '@/lib/explore/city-itineraries';

// Dynamic import for Leaflet map (no SSR)
const CityExploreMap = dynamic(() => import('@/components/explore/CityExploreMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#9BAEC2] flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-white/60" />
    </div>
  ),
});

const MiniLocatorMap = dynamic(
  () => import('@/components/explore/CityExploreMap').then(mod => ({ default: mod.MiniLocatorMap })),
  { ssr: false }
);

interface Place {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  description: string;
  type: string;
  mapsUrl: string;
  photoUrl?: string;
  isOpen?: boolean;
  openingHours?: string[];
  category: string;
  emoji: string;
  x: number;
  y: number;
  priceLevel?: number; // 1-4 scale from Google Places
  lat?: number;
  lng?: number;
}

// Convert Google's price level (0-4) to $ symbols
const getPriceSymbol = (priceLevel?: number): string => {
  if (priceLevel === undefined) return '';
  if (priceLevel === 0) return 'Free';
  return '$'.repeat(priceLevel);
};

// Categories that must always show price (use default if Google doesn't provide)
const MUST_SHOW_PRICE = ['Stay', 'Restaurants', 'Cafes', 'Nightlife', 'Markets'];

// Default price levels by category when Google doesn't provide one
const getDefaultPriceLevel = (category: string): number | null => {
  if (!MUST_SHOW_PRICE.includes(category)) return null; // Skip for Must See, Nature, etc
  const defaults: Record<string, number> = {
    'Stay': 2,          // Hotels mid-range default
    'Restaurants': 2,   // Mid-range default
    'Cafes': 1,         // Usually cheap
    'Markets': 1,       // Budget shopping
    'Nightlife': 2,     // Bars/clubs mid-range
  };
  return defaults[category] ?? 2;
};

interface KnownForItem {
  emoji: string;
  title: string;
  description: string;
}

interface CityInfo {
  description: string;
  history: string; // Detailed history with context
  famousFor: string[]; // Legacy - kept for backwards compatibility
  knownFor: KnownForItem[]; // New detailed known for items (10 items)
  location: string;
  tips: string[];
  bestTime: string;
  language: string;
  currency: string;
}

// City coordinates for mini map
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  // Thailand
  'Chiang Mai': { lat: 18.7883, lng: 98.9853 },
  'Bangkok': { lat: 13.7563, lng: 100.5018 },
  'Phuket': { lat: 7.8804, lng: 98.3923 },
  'Chiang Rai': { lat: 19.9105, lng: 99.8406 },
  'Pai': { lat: 19.3590, lng: 98.4409 },
  'Krabi': { lat: 8.0863, lng: 98.9063 },
  'Koh Samui': { lat: 9.5120, lng: 100.0136 },
  'Ayutthaya': { lat: 14.3532, lng: 100.5689 },
  'Sukhothai': { lat: 17.0078, lng: 99.8265 },
  'Kanchanaburi': { lat: 14.0227, lng: 99.5328 },
  'Hua Hin': { lat: 12.5684, lng: 99.9577 },
  'Koh Phi Phi': { lat: 7.7407, lng: 98.7784 },
  'Koh Lanta': { lat: 7.6500, lng: 99.0500 },
  'Koh Tao': { lat: 10.0956, lng: 99.8403 },
  'Koh Phangan': { lat: 9.7500, lng: 100.0333 },
  'Pattaya': { lat: 12.9236, lng: 100.8825 },
  // Japan
  'Tokyo': { lat: 35.6762, lng: 139.6503 },
  'Kyoto': { lat: 35.0116, lng: 135.7681 },
  'Osaka': { lat: 34.6937, lng: 135.5023 },
  // Vietnam
  'Hanoi': { lat: 21.0285, lng: 105.8542 },
  'Ho Chi Minh': { lat: 10.8231, lng: 106.6297 },
  'Bali': { lat: -8.3405, lng: 115.0920 },
  'Rome': { lat: 41.9028, lng: 12.4964 },
  'Paris': { lat: 48.8566, lng: 2.3522 },
};

// Map Google Places types to simple pin types (max 5)
const getPinType = (category: string, googleType?: string): 'site' | 'food' | 'nature' | 'activity' | 'stay' => {
  // Check by category first
  if (['Food', 'Restaurants', 'Cafes', 'Markets'].includes(category)) return 'food';
  if (['Nature', 'Scenic', 'Animals'].includes(category)) return 'nature';
  if (['Activities', 'Nightlife', 'Theme Parks'].includes(category)) return 'activity';
  if (['Stay', 'Hotels', 'Airbnb', 'Hostels'].includes(category)) return 'stay';
  // Default to site for attractions, culture, recommended, etc.
  return 'site';
};

const CATEGORY_CONFIG: Record<string, { type: string; emoji: string; keyword?: string }> = {
  // Overview sub-tabs (no API fetch)
  'Known For': { type: '', emoji: '⭐' },
  'History': { type: '', emoji: '📜' },
  'Geography': { type: '', emoji: '🗺️' },
  'Tips': { type: '', emoji: '💡' },
  // Recommended - all use same type, different filtering
  'Recommended': { type: 'tourist_attraction', emoji: '⭐' },
  'Top Picks': { type: 'tourist_attraction', emoji: '🏆' },
  'For You': { type: 'tourist_attraction', emoji: '💫' },
  'Top Sites': { type: 'tourist_attraction', emoji: '📍' },
  // Culture
  'Culture': { type: 'museum', emoji: '🎭' },
  'Museums': { type: 'museum', emoji: '🏛️' },
  'Galleries': { type: 'art_gallery', emoji: '🎨' },
  'Historic Sites': { type: 'tourist_attraction', emoji: '🏰', keyword: 'historic' },
  // Food
  'Food': { type: 'restaurant', emoji: '🍜' },
  'Restaurants': { type: 'restaurant', emoji: '🍜' },
  'Cafes': { type: 'cafe', emoji: '☕' },
  'Markets': { type: 'market', emoji: '🛍️' },
  // Activities
  'Activities': { type: 'night_club', emoji: '🎉' },
  'Nightlife': { type: 'night_club', emoji: '🍸' },
  'Theme Parks': { type: 'amusement_park', emoji: '🎢' },
  // Nature
  'Nature': { type: 'park', emoji: '🏞️' },
  'Scenic': { type: 'park', emoji: '🏞️' },
  'Animals': { type: 'zoo', emoji: '🦁' },
  // Stay
  'Stay': { type: 'lodging', emoji: '🏨' },
  'Hotels': { type: 'lodging', emoji: '🏨' },
  'Airbnb': { type: 'lodging', emoji: '🏠' },
  'Hostels': { type: 'hostel', emoji: '🛏️' },
};

// Sub-categories for each main category
const SUBCATEGORIES: Record<string, string[]> = {
  'Overview': ['Known For', 'History', 'Geography', 'Tips'],
  'Recommended': ['Top Picks', 'For You', 'Top Sites'],
  'Culture': ['Museums', 'Galleries', 'Historic Sites'],
  'Food': ['Restaurants', 'Cafes', 'Markets'],
  'Activities': ['Nightlife', 'Theme Parks'],
  'Nature': ['Scenic', 'Animals'],
  'Stay': ['Hotels', 'Hostels'],
};

// Place attributes for matching preferences
const PLACE_ATTRIBUTES: Record<string, { goodFor: string[]; notFor: string[] }> = {
  'tourist_attraction': { goodFor: ['Solo', 'Couple', 'Family', 'Friends', 'History', 'Photography'], notFor: [] },
  'museum': { goodFor: ['Solo', 'Couple', 'History', 'Art', 'Photography'], notFor: ['Adventure'] },
  'restaurant': { goodFor: ['Solo', 'Couple', 'Family', 'Friends', 'Food'], notFor: [] },
  'cafe': { goodFor: ['Solo', 'Couple', 'Food', 'Relaxation'], notFor: [] },
  'bar': { goodFor: ['Solo', 'Couple', 'Friends', 'Nightlife'], notFor: ['Family'] },
  'amusement_park': { goodFor: ['Family', 'Friends', 'Adventure'], notFor: ['Solo', 'Relaxation'] },
  'park': { goodFor: ['Solo', 'Couple', 'Family', 'Nature', 'Photography', 'Relaxation'], notFor: [] },
  'zoo': { goodFor: ['Family', 'Couple', 'Nature'], notFor: [] },
  'lodging': { goodFor: ['Solo', 'Couple', 'Family', 'Friends'], notFor: [] },
  'shopping_mall': { goodFor: ['Solo', 'Couple', 'Family', 'Shopping'], notFor: [] },
};

function formatCityName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatCountryName(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

function generateCityInfo(city: string, country: string): CityInfo {
  // Curated city-specific data
  const cityData: Record<string, CityInfo> = {
    'Chiang Mai': {
      description: 'The cultural capital of Northern Thailand and former seat of the Lanna Kingdom. Founded in 1296, Chiang Mai is surrounded by mountains and home to over 300 Buddhist temples.',
      history: 'Chiang Mai was founded in 1296 by King Mangrai as the capital of the Lanna Kingdom - an independent Thai kingdom that ruled Northern Thailand for over 600 years. "Lanna" means "Land of a Million Rice Fields," and the kingdom developed its own distinct culture, language, script, and Buddhist traditions separate from the rest of Thailand. The Lanna Kingdom remained independent until 1558 when it fell to Burma, and wasn\'t fully integrated into Siam (Thailand) until 1899. This long history of independence is why Northern Thai culture, food (like Khao Soi), architecture, and even dialect feel distinctly different from Bangkok. The Old City\'s moat and walls date back to this original founding, making Chiang Mai one of Southeast Asia\'s most historically significant cities.',
      famousFor: ['Elephant sanctuaries', 'Doi Suthep temple', 'Khao Soi', 'Yi Peng lantern festival', 'Thai massage', 'Night markets'],
      knownFor: [
        { emoji: '🐘', title: 'Ethical Elephant Sanctuaries', description: 'Home to Thailand\'s most respected elephant rescue centers like Elephant Nature Park. Visitors can feed, bathe, and walk with rescued elephants in ethical, no-riding sanctuaries.' },
        { emoji: '⛩️', title: 'Doi Suthep Temple', description: 'The sacred golden temple atop Doi Suthep mountain, built in 1383 to house a relic of Buddha. Climb 309 steps (or take the tram) for stunning views and spiritual significance.' },
        { emoji: '🍜', title: 'Khao Soi', description: 'The iconic Northern Thai curry noodle soup - egg noodles in rich coconut curry, topped with crispy noodles, pickled mustard greens, and lime. A must-try dish unique to this region.' },
        { emoji: '🏮', title: 'Yi Peng Lantern Festival', description: 'Every November, thousands of paper lanterns are released into the night sky, creating a magical floating constellation. One of Asia\'s most photogenic festivals.' },
        { emoji: '💆', title: 'Thai Massage Schools', description: 'The birthplace of Northern-style Thai massage. Many visitors take multi-day courses at schools like ITM or Loi Kroh to learn this ancient healing art.' },
        { emoji: '🛍️', title: 'Night Markets & Walking Streets', description: 'The Sunday Walking Street transforms the Old City into a mile-long market with crafts, food, and live music. Saturday Walking Street on Wua Lai is equally vibrant.' },
        { emoji: '🏛️', title: '300+ Buddhist Temples', description: 'From the ancient Wat Chedi Luang to the silver Wat Sri Suphan, Chiang Mai has more temples per square mile than almost anywhere in Thailand.' },
        { emoji: '☕', title: 'Cafe Culture & Digital Nomads', description: 'The Nimman neighborhood is famous for its hipster cafes, coworking spaces, and creative scene. One of Asia\'s top destinations for remote workers.' },
        { emoji: '🌿', title: 'Cooking Classes', description: 'Learn to make authentic Thai dishes at farm-to-table cooking schools where you pick ingredients from organic gardens before cooking.' },
        { emoji: '🏔️', title: 'Mountain Trekking & Hill Tribes', description: 'Gateway to Northern Thailand\'s mountains and traditional hill tribe villages. Multi-day treks visit Karen, Hmong, and Akha communities.' }
      ],
      location: 'Northern Thailand, 700km north of Bangkok. Near Chiang Rai (3hrs, often paired together), Pai (3hrs, famous Mae Hong Son Loop), and Lampang (1.5hrs). Gateway to the Golden Triangle region. 1 hour flight or 10 hour train from Bangkok.',
      tips: [
        'Visit temples before 9am to avoid crowds and heat',
        'Rent a scooter to explore - traffic is manageable here',
        'November is magical for Yi Peng lantern festival',
        'Avoid Feb-April (burning season) - air quality is poor',
        'Bargain at markets but not at 7-Eleven'
      ],
      bestTime: 'November to February (cool season, 20-25°C). Yi Peng lantern festival in November is unforgettable.',
      currency: 'Thai Baht (฿)',
      language: 'Thai (Northern dialect)'
    },
    'Bangkok': {
      description: 'Thailand\'s chaotic, vibrant capital where ancient temples sit beside futuristic malls and street food stalls serve Michelin-starred dishes.',
      history: 'Bangkok became Thailand\'s capital in 1782 when King Rama I moved the capital across the river from Thonburi after the fall of Ayutthaya to the Burmese. Its full ceremonial name is the longest city name in the world (168 letters!), meaning "City of Angels." The city rapidly modernized in the 20th century while preserving its royal and Buddhist heritage. The Grand Palace complex, built when the city was founded, remains the spiritual heart of Thailand. Today Bangkok is a megacity of 10+ million people, a major hub for Southeast Asian commerce, medical tourism, and one of the world\'s most visited cities.',
      famousFor: ['Grand Palace', 'Street food', 'Chatuchak Market', 'Rooftop bars', 'Temples', 'Nightlife'],
      knownFor: [
        { emoji: '👑', title: 'Grand Palace & Wat Phra Kaew', description: 'The dazzling royal palace complex houses the sacred Emerald Buddha, Thailand\'s most revered religious image. Over 200 years of Thai royal history in one spectacular compound.' },
        { emoji: '🍜', title: 'World-Class Street Food', description: 'From Michelin-starred Jay Fai\'s crab omelette to 50-cent pad thai, Bangkok\'s street food scene is legendary. Yaowarat (Chinatown) comes alive at night.' },
        { emoji: '🛍️', title: 'Chatuchak Weekend Market', description: 'One of the world\'s largest markets with 15,000+ stalls selling everything from vintage clothes to live animals. Go early to beat the heat.' },
        { emoji: '🌃', title: 'Rooftop Bars', description: 'Famous for glamorous sky bars like Lebua (from The Hangover II), Vertigo, and Octave. Dress smart and watch the sunset over the glittering skyline.' },
        { emoji: '⛩️', title: 'Ornate Temples', description: 'Wat Arun\'s riverside spires, Wat Pho\'s giant reclining Buddha, and dozens more temples blend Thai, Khmer, and Chinese influences.' },
        { emoji: '🚤', title: 'Canal & River Life', description: 'Explore the "Venice of the East" by longtail boat through historic canals (khlongs) or cruise the Chao Phraya River past temples and palaces.' },
        { emoji: '💆', title: 'Thai Massage', description: 'Wat Pho is the birthplace of traditional Thai massage. Get an authentic (intense!) massage at the temple school or countless spas citywide.' },
        { emoji: '🎭', title: 'Nightlife & Entertainment', description: 'From backpacker haven Khao San Road to upscale Thonglor clubs, Bangkok\'s nightlife caters to every taste and budget.' },
        { emoji: '🏥', title: 'Medical Tourism', description: 'World-renowned hospitals like Bumrungrad attract visitors for affordable, high-quality healthcare from dental work to major surgeries.' },
        { emoji: '🚇', title: 'Modern Transit', description: 'The BTS Skytrain and MRT make navigating the city easy, gliding above the notorious traffic jams.' }
      ],
      location: 'Central Thailand, on the Chao Phraya River. Thailand\'s main international gateway with two airports (BKK and DMK).',
      tips: [
        'Use BTS/MRT to avoid traffic - it\'s excellent',
        'Grand Palace requires covered shoulders and knees',
        'Street food is safe - look for busy stalls with high turnover',
        'Download Grab app for taxis - avoid scams',
        'Best rooftop bars require smart casual dress'
      ],
      bestTime: 'November to February (cool season). March-May is extremely hot and humid.',
      currency: 'Thai Baht (฿)',
      language: 'Thai'
    },
    'Tokyo': {
      description: 'A megacity where ultra-modern technology meets ancient tradition. Neon-lit Shibuya and serene Meiji Shrine coexist in fascinating harmony.',
      history: 'Tokyo began as a small fishing village called Edo until 1603, when shogun Tokugawa Ieyasu made it his seat of power, starting 250 years of Edo Period rule. The city grew into one of the world\'s largest, but was devastated twice - by the 1923 Great Kanto Earthquake and WWII firebombing that destroyed 50% of the city. Each time, Tokyo rebuilt and reinvented itself. In 1868, Emperor Meiji moved the imperial capital here from Kyoto, renaming it Tokyo ("Eastern Capital"). Today it\'s the world\'s largest metropolitan area with 37 million people, a global center of technology, fashion, cuisine, and pop culture.',
      famousFor: ['Shibuya Crossing', 'Sushi & Ramen', 'Cherry blossoms', 'Anime culture', 'Temples & shrines', 'Technology'],
      knownFor: [
        { emoji: '🚶', title: 'Shibuya Crossing', description: 'The world\'s busiest pedestrian intersection where up to 3,000 people cross at once. Best viewed from Starbucks above or Shibuya Sky observation deck.' },
        { emoji: '🍣', title: 'World\'s Best Sushi & Ramen', description: 'Tokyo has more Michelin stars than any city on Earth. From ¥800 conveyor belt sushi to $300 omakase, the food scene is unmatched.' },
        { emoji: '🌸', title: 'Cherry Blossom Season', description: 'Late March to early April transforms the city pink. Ueno Park, Meguro River, and Shinjuku Gyoen are prime hanami (flower viewing) spots.' },
        { emoji: '🎮', title: 'Anime, Manga & Gaming', description: 'Akihabara is geek paradise with multi-story arcades, anime shops, and maid cafes. Ikebukuro and Nakano Broadway cater to otaku culture.' },
        { emoji: '⛩️', title: 'Ancient Temples & Shrines', description: 'Senso-ji temple in Asakusa dates to 645 AD. Meiji Shrine sits in a peaceful forest. Traditional Japan thrives amid the skyscrapers.' },
        { emoji: '🏙️', title: 'Futuristic Architecture', description: 'From the Tokyo Skytree to teamLab digital art museums, Tokyo constantly pushes boundaries of design and technology.' },
        { emoji: '🛒', title: 'Unique Shopping', description: 'Harajuku\'s Takeshita Street for quirky fashion, Ginza for luxury, Tsukiji Outer Market for kitchen goods, and everything in between.' },
        { emoji: '🍜', title: 'Izakaya & Food Alleys', description: 'Tiny yakitori joints under train tracks in Yurakucho, ramen shops in Golden Gai, and izakaya pubs everywhere - the real Tokyo dining experience.' },
        { emoji: '🚄', title: 'Efficient Transit', description: 'The world\'s most punctual train system. Shinkansen bullet trains, JR lines, and metro make exploring effortless despite the city\'s size.' },
        { emoji: '🏨', title: 'Capsule Hotels & Ryokans', description: 'From futuristic pod hotels to traditional Japanese inns with tatami floors and onsen baths - accommodation is an experience itself.' }
      ],
      location: 'Honshu island, Japan\'s main island. On Tokyo Bay, eastern coast. Served by Narita (international) and Haneda (domestic/some international) airports.',
      tips: [
        'Get a Suica/Pasmo card for all transit',
        'Tipping is not customary and can be offensive',
        'Learn basic phrases - English is limited outside tourist areas',
        'Book popular restaurants weeks in advance',
        'Convenience store food is surprisingly excellent'
      ],
      bestTime: 'March-May (cherry blossoms) or October-November (autumn colors). Avoid Golden Week (late April/early May) and Obon (mid-August).',
      currency: 'Japanese Yen (¥)',
      language: 'Japanese'
    },
    'Kyoto': {
      description: 'Japan\'s cultural heart and former imperial capital for over 1,000 years. Home to 17 UNESCO World Heritage sites and 2,000 temples.',
      history: 'Kyoto served as Japan\'s capital for over a millennium, from 794 to 1868. Originally called Heian-kyo ("Capital of Peace"), it was modeled after the Chinese Tang dynasty capital. During the Heian period, Japanese culture flourished here - the world\'s first novel (Tale of Genji) was written by a Kyoto court lady. Unlike most Japanese cities, Kyoto was deliberately spared from WWII bombing due to its cultural significance (though it was on the original atomic bomb target list). This preservation means you can walk streets and visit temples that look much as they did centuries ago.',
      famousFor: ['Fushimi Inari', 'Bamboo grove', 'Geishas', 'Golden Pavilion', 'Kaiseki cuisine', 'Tea ceremonies'],
      knownFor: [
        { emoji: '⛩️', title: 'Fushimi Inari Shrine', description: 'Thousands of vermillion torii gates wind up Mount Inari. The most iconic image of Japan, especially magical at dawn or dusk when crowds thin.' },
        { emoji: '🎋', title: 'Arashiyama Bamboo Grove', description: 'Walk through towering bamboo stalks that creak and sway in the wind. Best experienced early morning before tour groups arrive.' },
        { emoji: '👘', title: 'Geisha Culture in Gion', description: 'The historic entertainment district where geiko and maiko still practice traditional arts. Spot them at dusk walking to appointments.' },
        { emoji: '🏯', title: 'Kinkaku-ji (Golden Pavilion)', description: 'The gold-leaf covered Zen temple reflecting in its mirror pond is Japan\'s most photographed building. Originally a shogun\'s retirement villa.' },
        { emoji: '🍵', title: 'Tea Ceremony Culture', description: 'Kyoto is the birthplace of the Japanese tea ceremony. Experience matcha and wagashi sweets in historic teahouses throughout the city.' },
        { emoji: '🍱', title: 'Kaiseki Cuisine', description: 'The pinnacle of Japanese haute cuisine - multi-course meals that are edible art. Kyoto kaiseki emphasizes seasonal, local ingredients.' },
        { emoji: '🏛️', title: '17 UNESCO World Heritage Sites', description: 'More than any other Japanese city, including Kiyomizu-dera, Nijo Castle, and Ryoan-ji\'s famous rock garden.' },
        { emoji: '🏠', title: 'Traditional Machiya Houses', description: 'Stay in a renovated wooden townhouse with tatami rooms, paper screens, and private gardens - authentic old Kyoto living.' },
        { emoji: '🌸', title: 'Cherry Blossom & Autumn Leaves', description: 'Philosopher\'s Path for spring cherry blossoms, Tofuku-ji for autumn maples - Kyoto\'s seasons are legendary.' },
        { emoji: '🛤️', title: 'Day Trip Gateway', description: 'Easy access to Nara\'s friendly deer, Osaka\'s food scene, and Hiroshima. Central location in the Kansai region.' }
      ],
      location: 'Kansai region, western Honshu. 2 hours from Tokyo by Shinkansen. 75 minutes from Osaka.',
      tips: [
        'Rent a bicycle - the city is very flat and bike-friendly',
        'Visit Fushimi Inari at dawn or dusk to avoid crowds',
        'Book Gion geisha district walking tours in advance',
        'Many temples close by 5pm - plan accordingly',
        'Stay in a traditional ryokan for the full experience'
      ],
      bestTime: 'March-May (cherry blossoms) or November (autumn foliage at temples). Summer is hot and humid.',
      currency: 'Japanese Yen (¥)',
      language: 'Japanese'
    },
  };

  // Return curated data if available
  if (cityData[city]) {
    return cityData[city];
  }

  // Fallback for unknown cities
  const countryInfo: Record<string, { currency: string; language: string }> = {
    'Thailand': { currency: 'Thai Baht (฿)', language: 'Thai' },
    'Japan': { currency: 'Japanese Yen (¥)', language: 'Japanese' },
    'Vietnam': { currency: 'Vietnamese Dong (₫)', language: 'Vietnamese' },
    'Indonesia': { currency: 'Indonesian Rupiah (Rp)', language: 'Indonesian' },
    'Italy': { currency: 'Euro (€)', language: 'Italian' },
    'France': { currency: 'Euro (€)', language: 'French' },
    'Spain': { currency: 'Euro (€)', language: 'Spanish' },
    'Mexico': { currency: 'Mexican Peso ($)', language: 'Spanish' },
    'Greece': { currency: 'Euro (€)', language: 'Greek' },
    'Portugal': { currency: 'Euro (€)', language: 'Portuguese' },
  };

  const info = countryInfo[country] || { currency: 'Local currency', language: 'Local language' };

  return {
    description: `${city} is a destination in ${country} waiting to be explored.`,
    history: `${city} has a rich history shaped by its location in ${country}. The city has evolved over centuries, blending traditional culture with modern influences. Explore the local landmarks to discover the stories that shaped this destination.`,
    famousFor: ['Local attractions', 'Regional cuisine', 'Cultural experiences'],
    knownFor: [
      { emoji: '🏛️', title: 'Local Landmarks', description: `Discover ${city}'s most iconic sights and historical monuments that define the city's character.` },
      { emoji: '🍽️', title: 'Regional Cuisine', description: `Taste authentic local dishes and street food that ${city} is known for.` },
      { emoji: '🎭', title: 'Cultural Experiences', description: `Immerse yourself in local traditions, festivals, and cultural activities.` },
      { emoji: '🛍️', title: 'Local Markets', description: 'Explore vibrant markets for local crafts, fresh produce, and souvenirs.' },
      { emoji: '🌳', title: 'Natural Beauty', description: `Experience the natural landscapes and outdoor activities around ${city}.` },
      { emoji: '🏨', title: 'Unique Stays', description: 'Find accommodation that reflects local architecture and hospitality.' },
      { emoji: '📸', title: 'Photo Spots', description: 'Capture memorable moments at scenic viewpoints and photogenic locations.' },
      { emoji: '🚶', title: 'Walking Tours', description: 'Explore neighborhoods on foot to discover hidden gems and local life.' },
      { emoji: '🎵', title: 'Nightlife & Entertainment', description: 'Experience the local music, bars, and entertainment scene.' },
      { emoji: '🧘', title: 'Relaxation', description: 'Find peace at spas, gardens, or quiet retreats away from the bustle.' }
    ],
    location: `Located in ${country}.`,
    tips: [
      'Research local customs before visiting',
      'Learn a few basic phrases in the local language',
      'Carry cash for local vendors'
    ],
    bestTime: 'Research the best season to visit based on weather and local events.',
    ...info
  };
}

export default function DynamicCityPage() {
  const router = useRouter();
  const params = useParams();
  const country = params.country as string;
  const city = params.city as string;
  
  const cityName = formatCityName(city);
  const countryName = formatCountryName(country);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [trips, setTrips] = useState<StoredTrip[]>([]);
  
  // Load trips for drawer
  const loadTrips = async () => {
    const allTrips = await tripDb.getAll();
    setTrips(allTrips);
  };
  
  useEffect(() => {
    loadTrips();
  }, []);
  const [activeFilter, setActiveFilter] = useState('Overview');
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [wikiCache, setWikiCache] = useState<Record<string, string>>({});
  const [reviewsCache, setReviewsCache] = useState<Record<string, Array<{ author_name: string; rating: number; text: string }>>>({});
  const [savedPlaces, setSavedPlaces] = useState<Set<string>>(new Set());
  const [savedPlaceNames, setSavedPlaceNames] = useState<Set<string>>(new Set());

  // Load saved places from IndexedDB on mount
  useEffect(() => {
    async function loadSaved() {
      const allSaved = await savedPlacesDb.getAll();
      // Filter to places in this city (case-insensitive)
      const cityPlaces = allSaved.filter(p => 
        p.city.toLowerCase() === cityName.toLowerCase()
      );
      // Store names for matching (Google Places IDs change)
      setSavedPlaceNames(new Set(cityPlaces.map(p => p.name.toLowerCase())));
    }
    loadSaved();
  }, [cityName]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  
  // Itinerary state
  const [cityItineraries, setCityItineraries] = useState<CityItineraries | null>(null);
  const [selectedItinerary, setSelectedItinerary] = useState<CityItinerary | null>(null);
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number>(0); // 0 = Overview, 1+ = Day number
  
  // Load itineraries for this city
  useEffect(() => {
    const itineraries = getCityItineraries(cityName);
    setCityItineraries(itineraries);
  }, [cityName]);
  
  // Reset day selection when itinerary changes
  useEffect(() => {
    setSelectedItineraryDay(0);
  }, [selectedItinerary]);
  
  // Fetch additional content when modal opens
  useEffect(() => {
    if (!selectedPlace) return;
    
    const category = selectedPlace.category;
    const isHistorical = ['Culture', 'Museums', 'Galleries', 'Historic Sites', 'Recommended', 'Top Picks', 'Top Sites'].includes(category) ||
      selectedPlace.name.toLowerCase().includes('wat') ||
      selectedPlace.name.toLowerCase().includes('temple') ||
      selectedPlace.name.toLowerCase().includes('palace') ||
      selectedPlace.name.toLowerCase().includes('monument');
    
    const isFoodOrActivity = ['Food', 'Restaurants', 'Cafes', 'Markets', 'Activities', 'Nightlife', 'Stay', 'Hotels', 'Hostels'].includes(category);
    
    // Fetch Wikipedia for historical places
    if (isHistorical && !wikiCache[selectedPlace.name]) {
      fetchWikipedia(selectedPlace.name);
    }
    
    // Fetch reviews for food/activities/hotels
    if (isFoodOrActivity && !reviewsCache[selectedPlace.name]) {
      fetchReviews(selectedPlace.name);
    }
  }, [selectedPlace]);

  const [activeQuickFilters, setActiveQuickFilters] = useState<Set<string>>(new Set());
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [customFilterInput, setCustomFilterInput] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedCategories, setLoadedCategories] = useState<Set<string>>(new Set());
  const [cityInfo, setCityInfo] = useState<CityInfo | null>(null);

  // Update savedPlaces IDs when places load (match by name)
  useEffect(() => {
    if (savedPlaceNames.size > 0 && places.length > 0) {
      const matchedIds = places
        .filter(p => savedPlaceNames.has(p.name.toLowerCase()))
        .map(p => p.id);
      setSavedPlaces(new Set(matchedIds));
    }
  }, [savedPlaceNames, places]);

  const categories = ['Overview', 'Recommended', 'Culture', 'Food', 'Activities', 'Nature', 'Stay', 'Itineraries'];
  
  // Sub-filter: 'all' or a specific sub-category name
  const [activeSubFilter, setActiveSubFilter] = useState<string>('all');
  
  // User preferences (stored in localStorage)
  const [userPreferences, setUserPreferences] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wandr-explore-preferences');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });

  // Save preferences to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wandr-explore-preferences', JSON.stringify(Array.from(userPreferences)));
    }
  }, [userPreferences]);

  const togglePreference = (pref: string) => {
    setUserPreferences(prev => {
      const next = new Set(prev);
      if (next.has(pref)) next.delete(pref);
      else next.add(pref);
      return next;
    });
  };

  const filterGroups = {
    'Who': ['Solo', 'Couple', 'Family', 'Friends'],
    'Interests': ['History', 'Food', 'Nature', 'Adventure', 'Nightlife', 'Art', 'Shopping', 'Photography', 'Relaxation'],
    'Pace': ['Relaxed', 'Balanced', 'Fast-paced'],
    'Budget': ['Free', 'Budget', 'Mid-range', 'Splurge'],
  };

  // Generate city info (in real app, this would come from an API or database)
  useEffect(() => {
    const info = generateCityInfo(cityName, countryName);
    setCityInfo(info);
  }, [cityName, countryName]);

  // Simple hash function for deterministic positioning
  const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };
  
  // Get emoji for a category
  const getEmojiForCategory = (category: string): string => {
    return CATEGORY_CONFIG[category]?.emoji || '📍';
  };

  // Fetch Google Places reviews for restaurants/hotels/activities
  const fetchReviews = async (placeName: string): Promise<void> => {
    if (reviewsCache[placeName]) return;
    
    try {
      const res = await fetch(`/api/places/details?query=${encodeURIComponent(placeName + ' ' + cityName)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.reviews && data.reviews.length > 0) {
          // Filter to reviews with actual text content
          const goodReviews = data.reviews
            .filter((r: { text: string }) => r.text && r.text.length > 20)
            .slice(0, 3);
          setReviewsCache(prev => ({ ...prev, [placeName]: goodReviews }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  // Fetch Wikipedia summary for a place (fallback for non-curated content)
  const fetchWikipedia = async (placeName: string): Promise<string | null> => {
    if (wikiCache[placeName]) return wikiCache[placeName];
    
    try {
      // Try exact name first, then simplified
      const searchTerms = [
        placeName,
        placeName.replace(/^Wat /, '').replace(/ Temple$/, ''),
        `${placeName} ${cityName}`,
        `${placeName} Thailand`
      ];
      
      for (const term of searchTerms) {
        const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term.replace(/ /g, '_'))}`;
        const res = await fetch(searchUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.extract && data.extract.length > 50) {
            setWikiCache(prev => ({ ...prev, [placeName]: data.extract }));
            return data.extract;
          }
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  // Fetch places for a category
  const fetchCategory = async (category: string) => {
    if (loadedCategories.has(category)) return;
    
    const config = CATEGORY_CONFIG[category];
    if (!config) return;

    try {
      const keywordParam = config.keyword ? `&keyword=${encodeURIComponent(config.keyword)}` : '';
      const res = await fetch(`/api/places/activities?city=${encodeURIComponent(cityName)}&type=${config.type}&limit=10&refresh=true${keywordParam}`);
      const data = await res.json();
      
      if (data.activities) {
        const newPlaces: Place[] = data.activities.map((p: Place) => ({
          ...p,
          category,
          emoji: getEmojiForCategory(category),
          // Use deterministic position based on place ID
          x: 20 + (hashCode(p.id) % 60),
          y: 20 + ((hashCode(p.id) * 7) % 60),
        }));
        
        // Add new places, skipping any that already exist (by ID)
        setPlaces(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const trulyNew = newPlaces.filter(p => !existingIds.has(p.id));
          return [...prev, ...trulyNew];
        });
      }
      
      setLoadedCategories(prev => new Set([...prev, category]));
    } catch (err) {
      console.error(`Error fetching ${category}:`, err);
    }
  };

  // Search for places
  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/places/activities?city=${encodeURIComponent(cityName + ' ' + query)}&type=tourist_attraction&limit=5`);
      const data = await res.json();
      
      if (data.activities) {
        const results: Place[] = data.activities.map((p: Place) => {
          // Determine emoji based on type
          let emoji = '📍';
          const type = p.type?.toLowerCase() || '';
          if (type.includes('temple') || type.includes('historical')) emoji = '🏛️';
          else if (type.includes('restaurant') || type.includes('food')) emoji = '🍜';
          else if (type.includes('cafe') || type.includes('coffee')) emoji = '☕';
          else if (type.includes('hotel') || type.includes('lodging')) emoji = '🏨';
          else if (type.includes('park') || type.includes('nature')) emoji = '🏞️';
          else if (type.includes('bar') || type.includes('night')) emoji = '🍸';
          else if (type.includes('shop') || type.includes('market')) emoji = '🛍️';
          else if (type.includes('museum') || type.includes('art')) emoji = '🎨';
          else if (type.includes('spa') || type.includes('massage')) emoji = '💆';
          
          return {
            ...p,
            category: 'Search',
            emoji,
            x: 20 + Math.random() * 60,
            y: 20 + Math.random() * 60,
          };
        });
        setSearchResults(results);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchPlaces(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, cityName]);

  // Add search result to saved places
  const addSearchResult = (place: Place) => {
    // Add to places if not already there
    if (!places.find(p => p.id === place.id)) {
      setPlaces(prev => [...prev, place]);
    }
    // Save it
    setSavedPlaces(prev => new Set([...prev, place.id]));
    // Select the pin to highlight it
    setSelectedPin(place.id);
    // Clear search
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
  };

  // Fetch places for a keyword search (for known-for items)
  const fetchKeyword = async (keyword: string) => {
    const cacheKey = `keyword_${keyword}`;
    if (loadedCategories.has(cacheKey)) return;
    
    try {
      const res = await fetch(`/api/places/activities?city=${encodeURIComponent(cityName)}&type=tourist_attraction&keyword=${encodeURIComponent(keyword)}&limit=5&refresh=true`);
      const data = await res.json();
      
      if (data.activities) {
        const newPlaces: Place[] = data.activities.map((p: Place) => ({
          ...p,
          category: 'Top Picks', // Add to Recommended
          emoji: '⭐',
          x: 20 + (hashCode(p.id) % 60),
          y: 20 + ((hashCode(p.id) * 7) % 60),
        }));
        
        setPlaces(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = newPlaces.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
      }
      setLoadedCategories(prev => new Set([...prev, cacheKey]));
    } catch (error) {
      console.error(`Error fetching keyword ${keyword}:`, error);
    }
  };

  // Fetch initial category on mount + known-for items
  useEffect(() => {
    const loadRecommended = async () => {
      setLoading(true);
      await fetchCategory('Top Picks');
      
      // Also fetch specific known-for items for curated cities
      const knownForKeywords: Record<string, string[]> = {
        'Chiang Mai': ['elephant sanctuary', 'doi suthep', 'night market', 'cooking class'],
        'Bangkok': ['grand palace', 'floating market', 'chatuchak', 'khao san'],
        'Tokyo': ['shibuya crossing', 'senso-ji', 'tsukiji', 'meiji shrine'],
        'Kyoto': ['fushimi inari', 'bamboo grove', 'golden pavilion', 'gion'],
      };
      
      const keywords = knownForKeywords[cityName] || [];
      await Promise.all(keywords.map(kw => fetchKeyword(kw)));
      
      setLoading(false);
    };
    loadRecommended();
  }, [cityName]);

  // Fetch category when tab changes
  useEffect(() => {
    const fetchForFilter = async () => {
      setLoading(true);
      const subs = SUBCATEGORIES[activeFilter];
      if (subs && subs.length > 0) {
        // Fetch all sub-categories
        await Promise.all(subs.map(sub => fetchCategory(sub)));
      } else if (!loadedCategories.has(activeFilter)) {
        await fetchCategory(activeFilter);
      }
      setLoading(false);
    };
    fetchForFilter();
  }, [activeFilter]);

  const toggleQuickFilter = (filter: string) => {
    setActiveQuickFilters(prev => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  };

  const addCustomFilter = () => {
    const trimmed = customFilterInput.trim();
    if (trimmed && !activeQuickFilters.has(trimmed)) {
      setActiveQuickFilters(prev => new Set([...prev, trimmed]));
      setCustomFilterInput('');
    }
  };

  const toggleSavePlace = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const place = places.find(p => p.id === id);
    const isCurrentlySaved = savedPlaces.has(id);
    
    // Update local state
    setSavedPlaces(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    
    // Sync with IndexedDB
    if (isCurrentlySaved && place) {
      // Remove from IndexedDB by name and city
      await savedPlacesDb.deleteByNameAndCity(place.name, cityName);
    } else if (place) {
      // Save to IndexedDB (save() generates id and savedAt)
      await savedPlacesDb.save({
        name: place.name,
        type: mapCategoryToType(place.category),
        city: cityName,
        address: place.address,
        coordinates: place.lat && place.lng ? { lat: place.lat, lng: place.lng } : undefined,
        rating: place.rating,
        priceRange: place.priceLevel ? '$'.repeat(place.priceLevel) : undefined,
        imageUrl: place.photoUrl,
        description: place.description,
        source: 'browse',
      });
    }
  };
  
  // Helper to map category to SavedPlace type
  type PlaceType = 'attraction' | 'restaurant' | 'cafe' | 'activity' | 'nightlife' | 'hotel';
  const mapCategoryToType = (category: string): PlaceType => {
    const map: Record<string, PlaceType> = {
      'Sites': 'attraction',
      'Food': 'restaurant',
      'Nature': 'attraction',
      'Activities': 'activity',
      'Stay': 'hotel',
    };
    return map[category] || 'attraction';
  };

  // Calculate match level for a place based on user preferences
  const getMatchLevel = (place: Place): 'great' | 'good' | 'neutral' | 'consider' => {
    if (userPreferences.size === 0) return 'neutral';
    const config = CATEGORY_CONFIG[place.category];
    if (!config) return 'neutral';
    const attrs = PLACE_ATTRIBUTES[config.type];
    if (!attrs) return 'neutral';
    
    const goodMatches = attrs.goodFor.filter(g => userPreferences.has(g)).length;
    const badMatches = attrs.notFor.filter(n => userPreferences.has(n)).length;
    
    if (badMatches > 0) return 'consider';
    if (goodMatches >= 2) return 'great';
    if (goodMatches >= 1) return 'good';
    return 'neutral';
  };

  const filteredPlaces = places.filter(p => {
    // Handle categories with sub-filters
    const subs = SUBCATEGORIES[activeFilter];
    let matchesCategory = false;
    
    // Special handling for Recommended tab - all sub-tabs show same places with different filtering
    if (activeFilter === 'Recommended') {
      // Show places from Recommended category (tourist attractions)
      matchesCategory = p.category === 'Recommended' || p.category === 'Top Picks' || p.category === 'For You' || p.category === 'Top Sites';
      
      // For "For You" sub-tab, only show places that match user preferences (great + good)
      if (activeSubFilter === 'For You' && matchesCategory && userPreferences.size > 0) {
        const matchLevel = getMatchLevel(p);
        if (matchLevel === 'neutral' || matchLevel === 'consider') return false;
      }
    } else if (subs && subs.length > 0) {
      // If 'all', show all sub-categories; otherwise filter to the selected one
      matchesCategory = activeSubFilter === 'all' 
        ? subs.includes(p.category)
        : p.category === activeSubFilter;
    } else {
      matchesCategory = p.category === activeFilter;
    }
    if (!matchesCategory) return false;
    
    
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !p.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeQuickFilters.has('Open now') && p.isOpen === false) return false;
    
    // Check custom text filters - place must match all active filters
    const predefinedFilters = new Set([
      'Solo', 'Couple', 'Family', 'Friends',
      'History', 'Food', 'Nature', 'Adventure', 'Nightlife', 'Art', 'Shopping', 'Photography', 'Relaxation',
      'Relaxed', 'Balanced', 'Fast-paced',
      'Free', 'Budget', 'Mid-range', 'Splurge'
    ]);
    const customFilters = Array.from(activeQuickFilters).filter(f => !predefinedFilters.has(f));
    for (const filter of customFilters) {
      const searchText = `${p.name} ${p.description || ''} ${p.type || ''}`.toLowerCase();
      if (!searchText.includes(filter.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <div className="h-screen flex flex-col bg-white">
      <DashboardHeader
        activeTab="explore"
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      {/* Fixed Map - collapses when panel expanded */}
      <div className={`flex-shrink-0 relative transition-all duration-300 ${panelExpanded ? 'h-[15vh]' : 'h-[45vh]'}`}>
        {/* Real Leaflet Map */}
        <CityExploreMap
          cityName={cityName}
          places={places.filter(p => savedPlaces.has(p.id)).map(p => ({
            id: p.id,
            name: p.name,
            emoji: p.emoji,
            pinType: getPinType(p.category),
            lat: p.lat,
            lng: p.lng,
          }))}
          selectedPin={selectedPin}
          onPinClick={setSelectedPin}
        />

        {/* Mini locator map - bottom right */}
        <div className={`absolute bottom-3 right-3 z-[30] w-32 h-32 rounded-lg overflow-hidden border-2 border-white shadow-lg transition-opacity ${
          selectedPlace || showFilterSheet ? 'opacity-30 pointer-events-none' : ''
        }`}>
          <MiniLocatorMap 
            lat={CITY_COORDS[cityName]?.lat || 13.7563} 
            lng={CITY_COORDS[cityName]?.lng || 100.5018}
            countryName={countryName}
          />
        </div>

        {/* Back button */}
        <button
          onClick={() => router.push(`/explore/${country}`)}
          className={`absolute top-4 left-4 z-[30] px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-sm font-medium text-gray-700 transition-all shadow-sm ${
            selectedPlace || showFilterSheet ? 'opacity-30 pointer-events-none' : ''
          }`}
        >
          ← {countryName}
        </button>

        {/* Selected pin info tooltip */}
        {selectedPin && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000] p-3 rounded-xl bg-white shadow-lg">
            {(() => {
              const place = places.find(p => p.id === selectedPin);
              if (!place) return null;
              return (
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    {place.photoUrl ? (
                      <img src={place.photoUrl} alt={place.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">{place.emoji}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{place.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-1">{place.description}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-amber-500 fill-current" />
                      <span className="text-xs text-gray-600">{place.rating}</span>
                      <span className="text-xs text-gray-400 ml-2">{place.category}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Bottom section - scrollable content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Drag handle to expand/collapse */}
        <button 
          onClick={() => setPanelExpanded(!panelExpanded)}
          className="flex-shrink-0 w-full py-1.5 flex items-center justify-center bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </button>
        
        {/* Sticky header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 pt-2 pb-2">
          {/* City name + search */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-xl font-bold">{cityName}</h1>
            </div>
            <div className="flex items-center gap-1">
              {showSearch ? (
                <>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 z-10" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Add a place..."
                      autoFocus
                      className="w-48 pl-8 pr-2 py-1.5 rounded-full border border-gray-200 text-xs outline-none focus:border-primary"
                    />
                    {/* Search Results Dropdown */}
                    {(searchResults.length > 0 || searchLoading) && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                        {searchLoading ? (
                          <div className="p-3 text-center">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400 mx-auto" />
                          </div>
                        ) : (
                          searchResults.map((result) => (
                            <button
                              key={result.id}
                              onClick={() => addSearchResult(result)}
                              className="w-full p-2 text-left hover:bg-gray-50 flex items-center gap-2 border-b border-gray-50 last:border-0"
                            >
                              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">
                                📍
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{result.name}</p>
                                <p className="text-[10px] text-gray-500 truncate">{result.description}</p>
                              </div>
                              <Heart className="w-4 h-4 text-primary" />
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}
                    className="p-1.5 rounded-full hover:bg-gray-100"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setShowSearch(true)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <Search className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <button 
                onClick={() => setShowFilterSheet(true)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <SlidersHorizontal className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveFilter(cat); setActiveSubFilter('all'); }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium flex-shrink-0 transition-colors ${
                  activeFilter === cat
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sub-category filter chips - always visible for consistent layout */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide items-center h-8">
            {(SUBCATEGORIES[activeFilter]?.length || 0) > 0 ? (
              <>
                <button
                  onClick={() => { setActiveSubFilter('all'); setActiveQuickFilters(new Set()); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 transition-colors ${
                    activeSubFilter === 'all' && activeQuickFilters.size === 0
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-500 border border-gray-200'
                  }`}
                >
                  All
                </button>
                {SUBCATEGORIES[activeFilter].map((sub) => (
                  <button
                    key={sub}
                    onClick={() => { setActiveSubFilter(sub); setActiveQuickFilters(new Set()); }}
                    className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 transition-colors border cursor-pointer ${
                      activeSubFilter === sub && activeQuickFilters.size === 0
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {CATEGORY_CONFIG[sub]?.emoji} {sub}
                  </button>
                ))}
                {/* Show active custom filters as chips */}
                {Array.from(activeQuickFilters).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveQuickFilters(prev => {
                      const next = new Set(prev);
                      next.delete(filter);
                      return next;
                    })}
                    className="px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 bg-gray-900 text-white flex items-center gap-1"
                  >
                    {filter}
                    <X className="w-3 h-3" />
                  </button>
                ))}
                <div className="flex-shrink-0 flex items-center gap-1 ml-1">
                  <input
                    type="text"
                    placeholder="+ Custom"
                    value={customFilterInput}
                    onChange={(e) => setCustomFilterInput(e.target.value)}
                    className="w-20 px-2 py-1 text-xs border border-dashed border-gray-300 rounded-full focus:outline-none focus:border-primary"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomFilter();
                      }
                    }}
                  />
                </div>
              </>
            ) : (
              <span className="text-xs text-gray-400 py-1">No sub-categories</span>
            )}
          </div>
        </div>

        {/* Scrollable places list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {activeFilter === 'Overview' && cityInfo ? (
            <div className="space-y-4">
              {/* Known For */}
              {(activeSubFilter === 'all' || activeSubFilter === 'Known For') && cityInfo.knownFor && (
                <div className="space-y-3">
                  {activeSubFilter === 'all' && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">⭐</span>
                      <h3 className="font-semibold text-sm">{cityName} is known for</h3>
                    </div>
                  )}
                  {(activeSubFilter === 'all' ? cityInfo.knownFor.slice(0, 3) : cityInfo.knownFor).map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                        <div>
                          <h4 className="font-semibold text-sm text-gray-900">{item.title}</h4>
                          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                </div>
              )}

              {/* History */}
              {(activeSubFilter === 'all' || activeSubFilter === 'History') && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📜</span>
                    <h3 className="font-semibold text-sm text-amber-900">History</h3>
                  </div>
                  {activeSubFilter === 'all' ? (
                    <p className="text-sm text-amber-800 leading-relaxed">{cityInfo.description}</p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-amber-800 leading-relaxed">{cityInfo.history}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Geography */}
              {(activeSubFilter === 'all' || activeSubFilter === 'Geography') && (
                <div className="p-4 rounded-2xl bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm">Geography</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{cityInfo.location}</p>
                  {activeSubFilter !== 'all' && (
                    <p className="text-sm text-gray-600 mb-3">
                      The landscape features diverse terrain that has influenced the development of local communities and transportation networks. The climate and natural surroundings play a significant role in the lifestyle and activities available to visitors throughout the year.
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Language</p>
                      <p className="text-sm font-medium">{cityInfo.language}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Currency</p>
                      <p className="text-sm font-medium">{cityInfo.currency}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Best time to visit</p>
                      <p className="text-sm font-medium">{cityInfo.bestTime}</p>
                    </div>
                    {activeSubFilter !== 'all' && (
                      <>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500">Climate</p>
                          <p className="text-sm font-medium">Tropical climate with distinct wet and dry seasons. Pack accordingly and stay hydrated.</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500">Getting around</p>
                          <p className="text-sm font-medium">Options include taxis, ride-sharing apps, public transport, and renting scooters or cars depending on the area.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Tips */}
              {(activeSubFilter === 'all' || activeSubFilter === 'Tips') && (
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm">Travel Tips</h3>
                  </div>
                  <ul className="space-y-2">
                    {(activeSubFilter === 'all' ? cityInfo.tips.slice(0, 3) : cityInfo.tips).map((tip, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        {tip}
                      </li>
                    ))}
                    {activeSubFilter !== 'all' && (
                      <>
                        <li className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          Download offline maps before your trip in case of spotty internet connection
                        </li>
                        <li className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          Keep small bills handy for street vendors and local markets
                        </li>
                        <li className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          Learn a few basic phrases in the local language - locals appreciate the effort
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ) : activeFilter === 'Itineraries' ? (
            <div className="space-y-4">
              {!cityItineraries ? (
                <div className="text-center py-12 px-6">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">No itineraries yet</h3>
                  <p className="text-sm text-gray-500">
                    Curated itineraries for {cityName} coming soon!
                  </p>
                </div>
              ) : !selectedItinerary ? (
                <>
                  <div className="text-center mb-4">
                    <h3 className="font-semibold text-gray-900">Pick an itinerary</h3>
                    <p className="text-xs text-gray-500 mt-1">Choose a starting point, customize as you like</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {cityItineraries.itineraries.map((itin) => (
                      <button
                        key={itin.id}
                        onClick={() => setSelectedItinerary(itin)}
                        className="p-3 rounded-xl border-2 border-gray-100 hover:border-primary/50 bg-white transition-all text-center"
                      >
                        <div className="text-2xl font-bold text-primary">{itin.duration}</div>
                        <div className="text-xs text-gray-500">Days</div>
                        <div className="text-xs font-medium text-gray-700 mt-1">{itin.subtitle}</div>
                      </button>
                    ))}
                  </div>
                  <div className="text-center pt-2">
                    <button className="text-xs text-gray-400 underline">
                      Or start from scratch
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  {/* Back button and Save Trip button */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedItinerary(null)}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
                      <Calendar className="w-4 h-4" />
                      Save Trip
                    </button>
                  </div>
                  
                  {/* Day tabs - Overview | Day 1 | Day 2 | Day 3 */}
                  <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4">
                    <button
                      onClick={() => setSelectedItineraryDay(0)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        selectedItineraryDay === 0
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Overview
                    </button>
                    {selectedItinerary.days.map((day) => (
                      <button
                        key={day.day}
                        onClick={() => setSelectedItineraryDay(day.day)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                          selectedItineraryDay === day.day
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Day {day.day}
                      </button>
                    ))}
                  </div>
                  
                  {/* Overview tab content */}
                  {selectedItineraryDay === 0 ? (
                    <div className="space-y-4">
                      <div className="text-center py-2">
                        <h3 className="font-bold text-lg text-gray-900">{selectedItinerary.duration} Days in {cityName}</h3>
                        <p className="text-sm text-gray-500">{selectedItinerary.subtitle}</p>
                      </div>
                      
                      {/* Day summaries */}
                      {selectedItinerary.days.map((day) => (
                        <button
                          key={day.day}
                          onClick={() => setSelectedItineraryDay(day.day)}
                          className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                              {day.day}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-gray-900">{day.title}</h4>
                              <p className="text-xs text-gray-500 truncate">
                                {day.activities.slice(0, 3).map(a => a.name).join(' → ')}
                                {day.activities.length > 3 && '...'}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          </div>
                        </button>
                      ))}
                      
                      {/* Tips */}
                      {selectedItinerary.tips.length > 0 && (
                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm">💡</span>
                            <span className="text-xs font-semibold text-blue-900">Tips</span>
                          </div>
                          <ul className="space-y-1">
                            {selectedItinerary.tips.map((tip, idx) => (
                              <li key={idx} className="text-xs text-blue-800 flex items-start gap-2">
                                <span className="text-blue-400">•</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Individual day content */
                    (() => {
                      const day = selectedItinerary.days.find(d => d.day === selectedItineraryDay);
                      if (!day) return null;
                      return (
                        <div className="space-y-1">
                          <h3 className="font-bold text-lg text-gray-900 mb-3">Day {day.day}</h3>
                          <p className="text-sm text-gray-500 -mt-2 mb-3">{day.title}</p>
                          
                          {day.activities.map((activity, idx) => (
                            <div key={idx}>
                              {/* Activity card */}
                              <div className="flex gap-3 p-3 bg-white rounded-xl border border-gray-100">
                                {/* Number badge */}
                                <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                                  {idx + 1}
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm text-gray-900">{activity.name}</h4>
                                  {activity.category && (
                                    <span className="inline-block text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mt-0.5">
                                      {activity.category}
                                    </span>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                                </div>
                              </div>
                              
                              {/* Walking/transit time to next activity */}
                              {activity.walkingMins && idx < day.activities.length - 1 && (
                                <div className="flex items-center gap-2 py-2 pl-4">
                                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                    {activity.transitMode === 'walk' && <span>🚶</span>}
                                    {activity.transitMode === 'drive' && <span>🚗</span>}
                                    {activity.transitMode === 'bus' && <span>🚌</span>}
                                    {activity.transitMode === 'train' && <span>🚃</span>}
                                    {activity.transitMode === 'scooter' && <span>🛵</span>}
                                    <span>{activity.walkingMins} min</span>
                                    <span>•</span>
                                    <span>{activity.walkingMeters}m</span>
                                    <span className="text-gray-300">{'>'}</span>
                                  </div>
                                  <button className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full font-medium hover:bg-primary/20">
                                    ◉ Directions
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : activeFilter === 'Recommended' && activeSubFilter === 'For You' && userPreferences.size === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                <SlidersHorizontal className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Personalize your recommendations</h3>
              <p className="text-sm text-gray-500 mb-4">
                Add your preferences to see places matched to your travel style.
              </p>
              <button
                onClick={() => setShowFilterSheet(true)}
                className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium"
              >
                Set preferences
              </button>
            </div>
          ) : filteredPlaces.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No places found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPlaces.map((place) => {
                const isSaved = savedPlaces.has(place.id);
                const matchLevel = getMatchLevel(place);
                return (
                  <div
                    key={place.id}
                    onClick={() => setSelectedPlace(place)}
                    className={`flex gap-3 p-2 rounded-xl cursor-pointer transition-colors ${
                      selectedPin === place.id
                        ? 'bg-primary/5 border-2 border-primary'
                        : 'bg-white border border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden relative">
                      {place.photoUrl ? (
                        <img src={place.photoUrl} alt={place.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-50">{place.emoji}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm leading-tight">{place.name}</h3>
                          {userPreferences.size > 0 && (matchLevel === 'great' || matchLevel === 'good') && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              matchLevel === 'great' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
                            }`}>
                              {matchLevel === 'great' ? 'Great' : 'Good'}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => toggleSavePlace(place.id, e)}
                          className="flex-shrink-0 p-1 -m-1"
                        >
                          <Heart
                            className={`w-4 h-4 transition-colors ${
                              isSaved ? 'text-primary fill-current' : 'text-gray-300 hover:text-gray-400'
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{place.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500 fill-current" />
                          <span className="text-xs text-gray-600">{place.rating}</span>
                          <span className="text-xs text-gray-400">({place.reviewCount})</span>
                        </div>
                        {(place.priceLevel !== undefined || MUST_SHOW_PRICE.includes(place.category)) && (
                          <span className="text-xs text-gray-500">
                            {getPriceSymbol(place.priceLevel ?? getDefaultPriceLevel(place.category) ?? undefined)}
                          </span>
                        )}
                        {place.isOpen !== undefined && (
                          <span className={`text-xs ${place.isOpen ? 'text-green-600' : 'text-red-500'}`}>
                            {place.isOpen ? 'Open' : 'Closed'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Overlays */}
      <TripDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        trips={trips}
        onRefresh={loadTrips}
      />
      <ProfileSettings
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />

      {/* Place Details Modal */}
      {selectedPlace && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
          onClick={() => setSelectedPlace(null)}
        >
          {/* Left Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const currentIndex = filteredPlaces.findIndex(p => p.id === selectedPlace.id);
              if (currentIndex > 0) {
                setSelectedPlace(filteredPlaces[currentIndex - 1]);
              } else {
                setSelectedPlace(filteredPlaces[filteredPlaces.length - 1]);
              }
            }}
            className="absolute left-1 sm:left-3 z-60 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const currentIndex = filteredPlaces.findIndex(p => p.id === selectedPlace.id);
              if (currentIndex < filteredPlaces.length - 1) {
                setSelectedPlace(filteredPlaces[currentIndex + 1]);
              } else {
                setSelectedPlace(filteredPlaces[0]);
              }
            }}
            className="absolute right-1 sm:right-3 z-60 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          </button>

          <div 
            className="bg-white w-[calc(100%-5rem)] max-w-md sm:max-w-lg rounded-2xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hero Image */}
            <div className="relative h-48 sm:h-56 flex-shrink-0">
              {selectedPlace.photoUrl ? (
                <img 
                  src={selectedPlace.photoUrl} 
                  alt={selectedPlace.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-6xl">
                  {selectedPlace.emoji}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Close button */}
              <button 
                onClick={() => setSelectedPlace(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Category badge */}
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 text-xs font-medium flex items-center gap-1">
                <span>{selectedPlace.emoji}</span>
                <span>{selectedPlace.category}</span>
              </div>

              {/* Title overlay */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h2 className="text-xl font-bold">{selectedPlace.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-current" />
                    <span className="text-sm font-medium">{selectedPlace.rating}</span>
                    <span className="text-sm text-white/80">({selectedPlace.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Enhanced Description with curated content */}
              {(() => {
                // Curated detailed info for famous places
                const placeDetails: Record<string, { description: string; history: string; tips: string[] }> = {
                  // CHIANG MAI - Temples
                  'Doi Suthep': {
                    description: 'The sacred Wat Phra That Doi Suthep sits atop this mountain, 15km from Chiang Mai city center. The temple\'s golden chedi is said to contain a relic of Buddha himself, and the site has been a pilgrimage destination since the 14th century. On clear days, you can see all of Chiang Mai from the viewing platform.',
                    history: 'According to legend, a white elephant carrying a relic of Buddha wandered up this mountain, trumpeted three times, and died on this spot in 1383. King Kuena of the Lanna Kingdom took this as a divine sign and built the original temple here. The 309-step Naga staircase was added in 1557, and the temple has been expanded and restored many times since.',
                    tips: ['Visit at sunrise to avoid crowds and see monks\' morning prayers', 'Dress modestly - shoulders and knees must be covered', 'Take the cable car if you don\'t want to climb 309 steps', 'Combine with Bhubing Palace nearby for a half-day trip']
                  },
                  'Wat Chedi Luang': {
                    description: 'This massive ruined temple in the heart of the Old City was once the tallest structure in ancient Lanna, reaching 82 meters before an earthquake in 1545 reduced it to its current 60 meters. The Emerald Buddha (now in Bangkok) was housed here for 84 years. Evening monk chats let you speak with novice monks practicing English.',
                    history: 'Construction began in 1391 under King Saen Muang Ma as a burial site for his father. The temple housed the Emerald Buddha from 1468 to 1551, making it the most important religious site in the Lanna Kingdom. The 1545 earthquake and a later cannon attack during the Burmese invasion left the chedi partially destroyed.',
                    tips: ['Attend the free Monk Chat sessions (Mon-Fri, 5-7pm)', 'Visit at night when the ruins are beautifully illuminated', 'The City Pillar shrine is on the grounds - locals come to pray here', 'Early morning is best for photos without crowds']
                  },
                  'Wat Phra Singh': {
                    description: 'Home to Chiang Mai\'s most revered Buddha image, the Phra Singh (Lion Buddha). This 14th-century temple complex showcases the finest examples of classic Lanna architecture, with its distinctive multi-tiered roofs and elaborate wood carvings. The ordination hall murals depict scenes from the Buddha\'s life and historic Lanna daily life.',
                    history: 'Built in 1345 by King Pha Yu to house his father\'s ashes. The Phra Singh Buddha was brought from Sri Lanka via Sukhothai, though its exact origins remain debated. During Songkran (Thai New Year), this Buddha is paraded through the city for the water blessing ceremony.',
                    tips: ['Visit during Songkran (April 13-15) to see the Buddha parade', 'The murals in Lai Kham chapel are the highlight', 'Free meditation classes are offered for visitors', 'Sunday Walking Street starts right at the temple gates']
                  },
                  'Wat Umong': {
                    description: 'A unique forest temple featuring ancient tunnels decorated with faded Buddhist images. Unlike other temples, Wat Umong sits in a peaceful wooded area with a lake, deer, and a "talking trees" garden with Buddhist wisdom signs. The tunnels were built to help a mentally troubled monk meditate without distraction.',
                    history: 'Founded in 1297 by King Mangrai, this is one of Chiang Mai\'s oldest temples. The tunnels were added in the 14th century. The temple fell into disrepair and was abandoned for centuries before being restored in 1948. Today it\'s a meditation center following the forest monk tradition.',
                    tips: ['Explore all the tunnels - each has different murals', 'Feed the fish and watch the deer roam freely', 'Read the "talking trees" Buddhist quotes throughout the grounds', 'Visit early morning for the most peaceful atmosphere']
                  },
                  'Wat Lok Moli': {
                    description: 'A tranquil 14th-century temple often overlooked by tourists, featuring a striking stepped chedi and beautifully preserved Lanna-style buildings. The temple grounds are peaceful and rarely crowded, offering an authentic glimpse into local Buddhist worship without the tourist crowds of more famous temples.',
                    history: 'Built during the reign of King Kuena in the 14th century, Wat Lok Moli served as the residence for monks from Burma. The temple\'s name means "Crown of the World." The large chedi contains relics of several Lanna kings and has been carefully restored to maintain its original Lanna architectural style.',
                    tips: ['One of the best temples for photography without crowds', 'The monks here are very friendly and welcoming', 'Beautiful at sunset when golden light hits the chedi', 'Combine with nearby Wat Jet Yot for a temple morning']
                  },
                  'Wat Sri Suphan': {
                    description: 'Known as the Silver Temple, this stunning ordination hall is covered entirely in hammered silver and aluminum, creating an otherworldly metallic appearance. Local silversmiths continue to add intricate designs depicting Buddhist stories, animals, and Lanna patterns. Note: Women cannot enter the main chapel due to religious beliefs.',
                    history: 'The original temple dates to 1500, but the silver ubosot was only completed in 2004. The silverwork is a living project - artisans from the surrounding silver-working community continue to add new panels. The Wualai area has been the center of Chiang Mai\'s silver trade for over 200 years.',
                    tips: ['Visit at night when the temple is dramatically lit', 'Watch silversmiths at work in adjacent workshops', 'Saturday Walking Street runs right past the temple', 'Women can view the exterior but cannot enter the silver chapel']
                  },
                  // CHIANG MAI - Nature & Animals
                  'Elephant Nature Park': {
                    description: 'Founded by Lek Chailert in 1995, this is Thailand\'s most respected elephant rescue sanctuary. Unlike tourist camps, elephants here roam freely, bathe when they choose, and are never ridden. You\'ll walk alongside elephants, prepare their food, and hear individual rescue stories of elephants saved from logging, tourism, and abuse.',
                    history: 'Lek Chailert grew up in a hill tribe village and witnessed elephant abuse from a young age. The park has saved over 200 elephants and become a model for ethical elephant tourism worldwide. Many elephants here are blind, injured, or traumatized from years of abuse - the sanctuary provides lifetime care.',
                    tips: ['Book at least 2-3 weeks in advance - it sells out', 'Full day visits are more meaningful than half days', 'Wear clothes you don\'t mind getting muddy', 'Don\'t use flash photography - it startles the elephants']
                  },
                  'Doi Inthanon': {
                    description: 'Thailand\'s highest peak at 2,565 meters, often called "the Roof of Thailand." The summit is cool year-round (bring a jacket!) and features twin chedis built for the King and Queen, stunning viewpoints, waterfalls, and diverse birdlife. The Hmong and Karen hill tribe villages add cultural depth to nature visits.',
                    history: 'Named after King Inthawichayanon, the last king of Chiang Mai who championed forest conservation. His remains are interred at the summit. The mountain has been a national park since 1972, protecting one of Thailand\'s most biodiverse regions with over 360 bird species.',
                    tips: ['Arrive at sunrise for the best views and fewer clouds', 'Bring warm layers - it can be 15°C colder than Chiang Mai', 'The twin chedis are most beautiful at dawn', 'Stop at Wachirathan waterfall on the way up']
                  },
                  'Royal Park Rajapruek': {
                    description: 'A vast botanical garden and former Royal Flora expo site featuring beautifully landscaped gardens representing different countries, a stunning Royal Pavilion, and seasonal flower displays. The 80-hectare park showcases over 2 million plants and trees, with tram rides connecting the different zones.',
                    history: 'Created for the 2006 Royal Flora Ratchaphruek Expo to celebrate King Bhumibol\'s 60th year on the throne. The Royal Pavilion was built using traditional Lanna construction techniques without nails. The park was permanently opened to the public and remains a living tribute to the late king.',
                    tips: ['Rent the golf cart or take the tram - it\'s huge!', 'The flower displays change seasonally - December-February is best', 'The Royal Pavilion at sunset is spectacular', 'Allow at least 3 hours to see everything']
                  },
                  // CHIANG MAI - Markets
                  'Night Bazaar': {
                    description: 'Chiang Mai\'s original night market stretches along Chang Khlan Road every evening. Unlike the walking streets that only happen on weekends, the Night Bazaar is open nightly with hundreds of stalls selling handicrafts, clothing, souvenirs, and street food. The surrounding area has developed into an entertainment district.',
                    history: 'The market emerged in the 1960s on the site of the original Yunnanese trading caravans that connected Chiang Mai to China via Burma. As tourism grew, the informal market became permanent. Today it\'s evolved from a local trading post to a tourist-focused shopping area.',
                    tips: ['Bargaining is expected - start at 40-50% of asking price', 'The food court on the 2nd floor of Kalare Night Bazaar has great local food', 'Quality varies widely - check items carefully', 'Best visited 7-10pm when all stalls are open']
                  },
                  'Sunday Walking Street': {
                    description: 'Every Sunday from 4pm to midnight, Ratchadamnoen Road transforms into a mile-long market showcasing local artisans, street food, and live music. Unlike the Night Bazaar, this market focuses on handmade crafts and has a more authentic local atmosphere. Food stalls offer Northern Thai specialties you won\'t find elsewhere.',
                    history: 'Started in 2001 as an initiative to revive traditional Lanna handicrafts and give local artisans a direct sales venue. It\'s grown from a small street fair to one of Southeast Asia\'s best markets. The route follows the historic center of old Chiang Mai.',
                    tips: ['Arrive by 5pm for best selection before crowds peak', 'Try the Sai Oua (Northern Thai sausage) and Khao Kha Moo (pork leg rice)', 'Temples along the route have their own markets with unique items', 'Bring cash - most vendors don\'t take cards']
                  },
                  'Saturday Walking Street': {
                    description: 'Wualai Road comes alive every Saturday evening with silver jewelry, handcrafts, and street food. Less crowded than Sunday Walking Street, this market runs through the traditional silversmiths\' district. You can watch artisans at work and buy directly from the craftspeople who make the items.',
                    history: 'The Wualai district has been home to Chiang Mai\'s silversmiths for over 200 years. The walking street was established to showcase this heritage and support local artisans. The adjacent Wat Sri Suphan (Silver Temple) reflects the neighborhood\'s metalworking tradition.',
                    tips: ['Better for silver jewelry than Sunday market', 'Less crowded and more relaxed atmosphere', 'Watch silversmiths work in the shops along the street', 'The Silver Temple is beautifully lit at night']
                  },
                  'Warorot Market': {
                    description: 'Chiang Mai\'s largest and oldest market, known locally as Kad Luang (Great Market). This is where locals shop for everything from northern Thai ingredients and dried goods to fabrics and gold jewelry. The surrounding streets bustle with vendors selling flowers, meats, and household items.',
                    history: 'Established in 1910 during the reign of King Rama V, the market was built to serve the growing city\'s trading needs. It\'s named after King Vajiravudh (Rama VI). The current building dates from 1986 after a fire destroyed the original structure. The market remains the commercial heart of Chiang Mai.',
                    tips: ['Best for authentic local food and ingredients', 'Try the miang kham (betel leaf wraps) vendors outside', 'Upstairs has cheaper clothes and fabrics than tourist markets', 'Go early morning for the best fresh food selection']
                  },
                  // CHIANG MAI - Museums & Culture
                  'Chiang Mai National Museum': {
                    description: 'The best introduction to Lanna history and culture, with excellent displays covering the ancient kingdom, Buddhist art, hill tribes, and regional traditions. The air-conditioned galleries provide a cool escape while offering deep insights into northern Thailand\'s unique cultural heritage.',
                    history: 'Opened in 1973 and renovated in 2013, the museum houses artifacts from archaeological sites throughout northern Thailand. Key pieces include Lanna Buddha images, ancient inscriptions, and ethnographic items from the region\'s diverse ethnic groups.',
                    tips: ['Start here to understand Lanna history before temple visits', 'The Buddha image collection is exceptional', 'Audio guides available in multiple languages', 'Combine with nearby Wat Jet Yot']
                  },
                  'Art in Paradise': {
                    description: 'A 3D art museum where you become part of the artwork. Over 130 interactive paintings create optical illusions that make for amazing photos - ride a magic carpet, escape a shark, or dangle from a cliff. It\'s pure fun and great for families or anyone who loves creative photography.',
                    history: 'Part of a Korean franchise that has expanded across Asia, the Chiang Mai branch opened in 2013. The museum employs a technique called trompe l\'oeil, French for "deceive the eye," which has been used in art since the Greek era but here is designed specifically for interactive photography.',
                    tips: ['Bring a fully charged phone - you\'ll take hundreds of photos', 'Visit on weekdays to avoid crowds in popular scenes', 'The app shows you the best angles for each artwork', 'Allow at least 2 hours to see everything']
                  },
                  // CHIANG MAI - More temples & landmarks
                  'Wat Suan Dok': {
                    description: 'The "Flower Garden Temple" features a striking white chedi surrounded by smaller whitewashed stupas containing ashes of Chiang Mai\'s royal family. The temple hosts popular monk chats and meditation retreats for foreigners. The sunset views with the mountains behind are spectacular.',
                    history: 'Built in 1370 as a royal flower garden, King Kuena converted it to a temple to house a Buddha relic that reportedly duplicated itself. One relic stayed here while the other was carried by elephant to Doi Suthep. The royal cemetery was added later to honor the Lanna royal lineage.',
                    tips: ['Monk Chat sessions Tuesday, Thursday, Saturday at 5pm', 'Best at sunset when the white chedis glow orange', 'The meditation retreat center offers multi-day courses', 'Less touristy than old city temples']
                  },
                  'Wat Jet Yot': {
                    description: 'This peaceful temple features a unique seven-spired chedi modeled after the Mahabodhi Temple in India where Buddha achieved enlightenment. The grounds are shaded and quiet, with beautiful stucco reliefs of celestial beings. It\'s a wonderful escape from more crowded temples.',
                    history: 'Built in 1455 by King Tilokarat to host the 8th World Buddhist Council, the only time this event has been held outside India or Sri Lanka. The seven spires represent the seven weeks Buddha spent at Bodh Gaya after his enlightenment. The stucco figures are among the finest Lanna art.',
                    tips: ['One of Chiang Mai\'s most underrated temples', 'The stucco celestial figures are exceptional', 'Very peaceful - few tourists visit', 'Combine with the nearby National Museum']
                  },
                  'Tha Phae Gate': {
                    description: 'The most famous of Chiang Mai\'s five original city gates, this brick archway marks the entrance to the old city and serves as the de facto center of tourist Chiang Mai. The plaza hosts events, markets, and is a popular spot for feeding pigeons (and getting swarmed by them).',
                    history: 'Part of the original city walls built in 1296 when King Mangrai founded Chiang Mai. The walls and moat formed a perfect square around the old city. Though most walls crumbled over centuries, this gate was restored in 1985 and has become the symbol of Chiang Mai.',
                    tips: ['Sunday Walking Street starts here', 'The pigeon feeding is fun but very chaotic', 'Nice spot to sit and people-watch in the evening', 'Good meeting point - everyone knows it']
                  },
                  'Three Kings Monument': {
                    description: 'This bronze statue depicts the three kings who founded Chiang Mai: King Mangrai of Lanna, King Ramkhamhaeng of Sukhothai, and King Ngam Muang of Phayao. It\'s a popular spot for locals to pay respects and for visitors to learn about Lanna history. The surrounding plaza hosts events and markets.',
                    history: 'Erected in 1983 to commemorate Chiang Mai\'s 700th anniversary, the monument honors the alliance of three kings who selected this location for the new Lanna capital in 1296. King Mangrai built the city; his friends advised on the auspicious location. Locals believe the spirits of the kings still protect the city.',
                    tips: ['See locals paying respects with offerings', 'The Chiang Mai City Arts & Cultural Centre is right behind it', 'Nice evening atmosphere when lit up', 'Good starting point for old city exploration']
                  },
                  'Huay Tung Tao': {
                    description: 'A peaceful lake surrounded by mountains, popular with locals for picnics and swimming. Rent a bamboo hut over the water, order food delivered to your spot, and spend a lazy afternoon. It\'s a refreshing escape from temple-hopping and a glimpse into local weekend life.',
                    history: 'Originally a reservoir built to supply water to Chiang Mai, Huay Tung Tao became a recreational area as the city developed. It remains relatively unknown to tourists despite being just 15 minutes from the old city. The surrounding area is being developed but retains its relaxed atmosphere.',
                    tips: ['Rent a lakeside sala (hut) for 50-100 baht', 'Food vendors will bring meals directly to your hut', 'Swimming is allowed and popular with locals', 'Best on weekdays when it\'s quieter']
                  },
                  'Chiang Mai Zoo': {
                    description: 'Set on the forested slopes of Doi Suthep, this zoo is home to over 400 species including pandas, koalas, and a vast aquarium. The hillside setting means lots of walking but also beautiful views. The panda enclosure (with real giant pandas on loan from China) is the star attraction.',
                    history: 'Established in 1977 from a private collection, the zoo has grown into one of Thailand\'s best. The giant pandas Lin Hui and Chuang Chuang arrived in 2003 as a symbol of Thai-Chinese friendship. Lin Ping, born in 2009, was the first giant panda born in Thailand.',
                    tips: ['Take the monorail or shuttle - the zoo is huge and hilly', 'Panda viewing has limited time slots - go first', 'The aquarium tunnel is impressive', 'Allow half a day minimum']
                  },
                  'Baan Tawai': {
                    description: 'Thailand\'s largest handicraft village specializes in woodcarving, from small souvenirs to massive furniture pieces. Watch artisans at work, browse hundreds of shops, and find unique pieces at wholesale prices. It\'s overwhelming in scale but a woodworking lover\'s paradise.',
                    history: 'The village\'s woodcarving tradition began over 200 years ago when craftsmen from Burma settled here. The skills have been passed down through generations. Today Baan Tawai supplies woodcrafts to shops across Thailand and exports worldwide.',
                    tips: ['Hiring a songthaew for the day makes browsing easier', 'Prices are negotiable, especially for multiple items', 'Shipping services available for large purchases', 'The teakwood furniture is exceptional value']
                  },
                  'Maya Lifestyle': {
                    description: 'Chiang Mai\'s trendiest shopping mall sits at the base of the Nimman area, combining international brands with local boutiques, excellent food courts, and a rooftop bar. It\'s a good place to escape the heat, catch a movie, or grab dinner before exploring Nimman\'s nightlife.',
                    history: 'Opened in 2014, Maya filled the gap for a modern mall serving the Nimman neighborhood\'s young, trendy demographic. The area has since exploded with development, but Maya remains the anchor. The rooftop Camp bar offers great mountain views.',
                    tips: ['The basement food court has excellent cheap eats', 'Camp rooftop bar has great views at sunset', 'Good air-conditioned escape from afternoon heat', 'Movie theaters show films in English']
                  },
                  'Nimman': {
                    description: 'Chiang Mai\'s hipster neighborhood is packed with trendy cafes, boutique hotels, art galleries, and excellent restaurants. The sois (side streets) each have their own character, from coffee shops to cocktail bars. It\'s walkable, Instagram-worthy, and the heart of modern Chiang Mai.',
                    history: 'Developed in the 1960s as a residential area for Chiang Mai University faculty, Nimman transformed in the 2000s when young entrepreneurs opened cafes and boutiques. It\'s named after the original landowner. The area represents Chiang Mai\'s creative, modern side.',
                    tips: ['Each numbered soi has its own vibe - explore several', 'Coffee culture is huge - try Ristr8to or Graph', 'Best explored on foot or bicycle', 'Nightlife picks up after 9pm']
                  },
                  'Cooking Class': {
                    description: 'Chiang Mai is Thailand\'s cooking class capital, with dozens of schools offering hands-on experiences. Most include a market tour to source ingredients, then you\'ll cook 4-6 dishes to eat for lunch. It\'s one of the most rewarding half-day activities in the city.',
                    history: 'Thai cooking classes emerged in the 1990s as Chiang Mai became a tourist hub. The format of market visit plus cooking was pioneered here and copied worldwide. Northern Thai cuisine differs from Bangkok - you\'ll learn dishes like khao soi and sai oua unique to this region.',
                    tips: ['Book in advance during high season', 'Morning classes include the more interesting market tours', 'Prices range from 800-1500 baht - mid-range is usually best', 'Ask about vegetarian/vegan options when booking']
                  },
                  'Thai Massage': {
                    description: 'Chiang Mai has massage shops on every corner, from basic 200-baht foot rubs to luxury spa experiences. Traditional Thai massage involves stretching and pressure points - it\'s therapeutic but can be intense. The old city prison massage program employs former inmates learning vocational skills.',
                    history: 'Thai massage evolved from Indian Ayurvedic traditions brought by Buddhist monks. The techniques were refined at Wat Pho in Bangkok, which remains the official school. Chiang Mai\'s abundance of massage training schools has made it a hub for learning and practicing the art.',
                    tips: ['The Women\'s Prison Massage offers excellent massages by rehabilitating inmates', 'Agree on pressure level before starting - speak up if too hard', 'Tip 50-100 baht for good service', 'Book spa treatments in advance during high season']
                  },
                  'Doi Kham': {
                    description: 'A beautiful hilltop temple with a giant golden sitting Buddha visible from across the valley. Less crowded than Doi Suthep but equally impressive, Wat Phra That Doi Kham offers panoramic views, ornate decorations, and a peaceful atmosphere. The temple is especially popular with Thai visitors.',
                    history: 'Built over 1,300 years ago, predating even Doi Suthep. According to legend, the temple was established by Queen Chamadevi of the ancient Haripunchai Kingdom. The 17-meter sitting Buddha was added in recent decades and has become iconic in Chiang Mai\'s skyline.',
                    tips: ['Much less crowded than Doi Suthep', 'The giant Buddha is visible from many parts of Chiang Mai', 'Best visited in the morning for clear views', 'Combine with the nearby Royal Park Rajapruek']
                  },
                  'Wat Pha Lat': {
                    description: 'A hidden jungle temple on the old pilgrim trail to Doi Suthep. Unlike tourist-heavy temples, Wat Pha Lat feels undiscovered - moss-covered statues, trickling streams, and dense forest create an almost mystical atmosphere. It\'s a favorite of photographers and those seeking tranquility.',
                    history: 'Built as a resting point for pilgrims walking up to Doi Suthep before the road was built. The name means "Slippery Cliff Temple." When the road opened in 1935, pilgrims stopped using the trail and the temple fell into peaceful obscurity, which adds to its charm today.',
                    tips: ['Reachable by the Monk\'s Trail hike from behind CMU', 'Visit early morning when mist hangs in the trees', 'Wear good shoes - the trail can be slippery', 'One of the most photogenic temples in Chiang Mai']
                  },
                  'Night Safari': {
                    description: 'A unique night zoo where you explore on open-air trams as animals roam freely in naturalistic habitats. The park includes predator and herbivore zones, a walking zone, and entertaining shows. It\'s especially popular with families and offers a different experience from daytime zoos.',
                    history: 'Opened in 2006, modeled after Singapore\'s famous Night Safari. The 819-acre park was developed to boost tourism and showcase nocturnal animals in their active hours. It\'s become one of Chiang Mai\'s most popular family attractions.',
                    tips: ['Book the tram tours in advance during holidays', 'The predator zone tram is more exciting than herbivore', 'Arrive by 6pm to see the daytime walking zone first', 'The fountain show at the lake is worth catching']
                  },
                  'Wat Chiang Man': {
                    description: 'Chiang Mai\'s oldest temple, founded by King Mangrai when he established the city in 1296. The temple houses two important Buddha images and features a distinctive chedi supported by 15 elephant sculptures. It\'s less visited than other major temples but historically significant.',
                    history: 'King Mangrai lived here while overseeing construction of his new capital. The temple contains the Crystal Buddha (Phra Setang Khamani) believed to have power over rain, and the marble Phra Sila Buddha from 8th century India. Both are paraded during Songkran.',
                    tips: ['Start your old city temple tour here - it\'s the oldest', 'The elephant-supported chedi is unique in Chiang Mai', 'Less crowded than Wat Phra Singh or Chedi Luang', 'The two ancient Buddha images are in a small building behind main hall']
                  },
                  'Wat Phantao': {
                    description: 'A stunning teak temple next to Wat Chedi Luang, often overlooked by tourists rushing to its famous neighbor. The intricate wooden building with gilded details and colorful mosaics represents classic Lanna architecture. During Loy Krathong, the reflection of lanterns in the pond is magical.',
                    history: 'Originally built in the 14th century as part of the royal palace complex. The current teak viharn dates from 1846 and is one of the few remaining all-wooden temple buildings in Chiang Mai. The name means "Temple of a Thousand Kilns" referring to nearby pottery workshops.',
                    tips: ['Don\'t skip this for Wat Chedi Luang next door', 'During Loy Krathong the candle-lit pond is spectacular', 'The teak carving details reward close inspection', 'Beautiful at any time but especially golden hour']
                  },
                  'Lanna Folklife': {
                    description: 'A small but excellent museum showcasing traditional Lanna culture, housed in a beautiful 1930s courthouse building. Exhibits cover textiles, crafts, daily life, and ceremonies of Northern Thailand. The building itself is worth visiting for its colonial architecture.',
                    history: 'The building served as the provincial court from 1935 until the museum opened in 2004. It\'s part of the Chiang Mai City Arts & Cultural Centre complex around the Three Kings Monument. The exhibits were developed with local communities to preserve fading traditions.',
                    tips: ['Combined ticket with City Arts & Cultural Centre is good value', 'The textile exhibits are particularly well done', 'Air conditioned - good midday escape from heat', 'Ask about occasional traditional craft demonstrations']
                  },
                  'Elephant Sanctuary': {
                    description: 'Ethical elephant experiences where you can observe, feed, and walk with rescued elephants without riding them. These sanctuaries prioritize elephant welfare over entertainment. Chiang Mai has several reputable options including Elephant Nature Park, Elephant Jungle Sanctuary, and others.',
                    history: 'The ethical elephant tourism movement began in Chiang Mai in the 1990s as awareness grew about the cruelty of traditional elephant camps. Elephant Nature Park pioneered the model of rescue and rehabilitation. Today dozens of sanctuaries offer no-riding experiences.',
                    tips: ['Book well in advance - ethical places fill up fast', 'Full day visits allow deeper connection than half days', 'Verify "no riding" policy before booking', 'Expect to get muddy during bathing time']
                  },
                  // BANGKOK
                  'Grand Palace': {
                    description: 'The spectacular former royal residence spanning 218,000 square meters is Bangkok\'s most famous landmark. The complex includes the sacred Temple of the Emerald Buddha (Wat Phra Kaew), ornate throne halls, and stunning examples of traditional Thai architecture. The intricate details and golden spires are overwhelming in their beauty.',
                    history: 'Built in 1782 when Bangkok became capital, the palace served as the royal residence until 1925. The Emerald Buddha, Thailand\'s most sacred Buddha image, has been housed here since 1784. The complex has been continuously expanded by successive kings, each adding their own buildings and renovations.',
                    tips: ['Dress code strictly enforced - long pants, covered shoulders required', 'Arrive at 8:30am opening to beat the crowds', 'Hire an official guide at the entrance for context', 'Allow 2-3 hours minimum; the detail is overwhelming']
                  },
                  'Wat Arun': {
                    description: 'The Temple of Dawn features a 70-meter central prang (tower) encrusted with colorful Chinese porcelain and seashells that sparkle at sunrise and sunset. You can climb steep steps partway up the main tower for views across the Chao Phraya River to the Grand Palace. It\'s one of Bangkok\'s most photographed landmarks.',
                    history: 'Originally called Wat Makok, the temple was renamed for Aruna, the Hindu god of dawn, after King Taksin arrived here at dawn to establish the Thonburi capital in 1768. The current prangs were built during the reign of Rama II and III in the early 19th century.',
                    tips: ['Visit at sunset when the temple glows golden', 'Take the 4-baht ferry from Tha Tien pier', 'The climb is steep - wear appropriate shoes', 'Beautiful when lit up at night from across the river']
                  },
                  'Wat Pho': {
                    description: 'Home to the massive 46-meter Reclining Buddha covered in gold leaf, this is Bangkok\'s oldest and largest temple complex. Beyond the famous statue, Wat Pho houses over 1,000 Buddha images and is considered the birthplace of Thai massage - you can still get a massage or take classes here.',
                    history: 'Dating from the 16th century, the temple was expanded by Rama I and became Thailand\'s first public university under Rama III, who installed inscriptions teaching medicine, history, and literature. The Reclining Buddha, depicting Buddha entering nirvana, was added in 1848.',
                    tips: ['Less crowded than the Grand Palace next door', 'The traditional massage school offers excellent, affordable massages', 'Don\'t miss the beautiful mother-of-pearl inlay on Buddha\'s feet', 'The temple grounds contain many smaller chedis worth exploring']
                  },
                  'Chatuchak Market': {
                    description: 'One of the world\'s largest weekend markets with over 15,000 stalls spread across 35 acres. You can find virtually anything here: vintage clothing, antiques, art, plants, pets, handicrafts, and endless food stalls. The sheer scale is overwhelming - plan to get lost and make unexpected discoveries.',
                    history: 'Started in 1942 as a small market in Sanam Luang, it moved to the current location in 1982. Named after the adjacent Chatuchak Park, the market has grown organically into a Bangkok institution. Over 200,000 visitors come each weekend.',
                    tips: ['Arrive before 10am to beat the heat and crowds', 'Download a map app - it\'s genuinely easy to get lost', 'The air-conditioned JJ Mall next door offers an escape from the heat', 'Sections 2-4 have the best vintage and antique finds']
                  },
                  'Khao San Road': {
                    description: 'Bangkok\'s legendary backpacker street is a sensory overload of cheap guesthouses, bars, street food, tattoo parlors, and vendors selling everything from fried insects to fake IDs. Love it or hate it, Khao San is a Bangkok rite of passage - loud, chaotic, and unforgettable.',
                    history: 'Originally a rice market (khao means rice), the street transformed in the 1980s when budget guesthouses opened to serve backpackers on the "banana pancake trail." The 1996 novel "The Beach" cemented its reputation. Today it\'s evolved into a party street for both tourists and young Thais.',
                    tips: ['Peak party time is 10pm-2am', 'Pad thai vendors at the east end are excellent', 'Negotiate everything - first prices are inflated', 'Stay nearby for convenience but sleep elsewhere for quiet']
                  },
                  'Floating Market': {
                    description: 'While touristy, the floating markets offer a glimpse into traditional Thai river commerce. Vendors in wooden boats sell tropical fruits, cooked food, and souvenirs along narrow canals. Damnoen Saduak is the most famous; Amphawa is more authentic and opens on weekends only.',
                    history: 'Before roads, Thailand\'s waterways were the main transport routes, and floating markets were essential to daily life. Most disappeared as roads developed, but some were preserved (or revived) for tourism. Damnoen Saduak dates to 1868 when the canal was dug by King Rama IV.',
                    tips: ['Go to Amphawa for a more authentic, less crowded experience', 'Arrive before 9am at Damnoen Saduak to beat tour buses', 'Bargain for boat rides - agree on price before boarding', 'The best food is at Amphawa\'s evening market']
                  },
                  // TOKYO
                  'Senso-ji': {
                    description: 'Tokyo\'s oldest and most significant temple draws 30 million visitors annually. The approach through Nakamise shopping street, the dramatic Kaminarimon (Thunder Gate), and the five-story pagoda create an unforgettable atmosphere. Despite the crowds, the temple maintains genuine spiritual significance.',
                    history: 'Founded in 645 AD, making it nearly 1,400 years old. Legend says two fishermen found a golden Kannon statue in the Sumida River; despite returning it to the water, it kept reappearing. The temple was built to house this sacred image, which remains hidden from public view.',
                    tips: ['Visit before 8am or after 6pm to avoid the worst crowds', 'Nakamise shops open around 10am', 'The temple is beautifully lit at night with few people', 'Draw an omikuji fortune - bad luck? Tie it to the designated rack to leave it behind']
                  },
                  'Shibuya Crossing': {
                    description: 'The world\'s busiest pedestrian crossing sees up to 3,000 people cross simultaneously when the lights change. It\'s a perfect symbol of Tokyo\'s organized chaos. The surrounding area offers excellent shopping, the famous Hachiko statue, and endless people-watching opportunities.',
                    history: 'The scramble crossing was implemented in 1973 as Shibuya grew into a commercial hub. The adjacent Hachiko statue commemorates the loyal dog who waited for his deceased owner at the station every day for nine years until his own death in 1935.',
                    tips: ['Best viewed from the Starbucks on the 2nd floor of the TSUTAYA building', 'Cross at night when the neon lights create the iconic Tokyo atmosphere', 'The Shibuya Sky observation deck offers amazing aerial views', 'Visit Hachiko statue early morning to avoid photo crowds']
                  },
                  'Meiji Shrine': {
                    description: 'A serene Shinto shrine set within 170 acres of forested parkland, creating a startling contrast with the surrounding Harajuku\'s fashion craziness. The towering torii gates, gravel paths, and cypress forest transport you to another world. Traditional Shinto weddings are often held here on weekends.',
                    history: 'Built in 1920 to honor Emperor Meiji and Empress Shoken, whose reign (1868-1912) transformed Japan from feudal isolation to modern nation. The forest was created by planting 100,000 trees donated from across Japan. The original shrine was destroyed in WWII and rebuilt in 1958.',
                    tips: ['Enter from Harajuku Station for the most dramatic approach', 'Weekends offer chances to see traditional weddings', 'Write a wish on an ema (wooden plaque) and hang it at the shrine', 'Combine with Yoyogi Park and Takeshita Street for a full Harajuku day']
                  },
                  'Tsukiji Outer Market': {
                    description: 'While the famous inner fish auction moved to Toyosu in 2018, the outer market remains a foodie paradise. Narrow lanes packed with vendors sell the freshest sushi, tamagoyaki (sweet omelet), wagyu beef, and specialty Japanese ingredients. It\'s the best place in Tokyo for a grazing breakfast.',
                    history: 'The original Tsukiji market was established in 1935 after the previous Nihonbashi fish market was destroyed in the 1923 earthquake. For decades it was the world\'s largest fish market. The outer market grew organically to serve workers and visitors.',
                    tips: ['Arrive between 7-9am for the best experience', 'Try the tamagoyaki from Yamacho - there\'s always a line', 'Cash is preferred at most stalls', 'The inner market at Toyosu is worth visiting separately for the tuna auction']
                  },
                  'Akihabara': {
                    description: 'Tokyo\'s "Electric Town" is the global capital of anime, manga, and gaming culture. Multi-story electronics shops, maid cafes, arcade halls, and specialty stores selling everything from rare figurines to vintage video games create an overwhelming sensory experience for geek culture enthusiasts.',
                    history: 'After WWII, the area became a black market for radio parts, evolving into an electronics district. From the 1990s, as otaku (geek) culture grew, shops shifted toward anime, manga, and gaming merchandise. Today it\'s a pilgrimage site for fans worldwide.',
                    tips: ['The main strip is on Chuo-dori, which is pedestrian-only on Sundays', 'Tax-free shopping is available with your passport at most stores', 'Maid cafe experience is fun once - expect to pay for "services" like photos and games', 'Retro game stores have amazing finds for collectors']
                  },
                  'TeamLab Borderless': {
                    description: 'A groundbreaking digital art museum where massive immersive installations blur the boundaries between artwork and viewer. Rooms of flowing digital waterfalls, floating flowers, and interactive light displays create an otherworldly experience. It\'s become one of Tokyo\'s most popular attractions.',
                    history: 'TeamLab is a collective of artists, programmers, and engineers founded in 2001. Borderless opened in 2018 in Odaiba before moving to Azabudai Hills in 2024. The "borderless" concept means artworks leave their rooms and interact with each other and visitors.',
                    tips: ['Book tickets online in advance - it sells out', 'Wear light-colored clothing to best reflect the projections', 'The tea house where tea blooms with digital flowers is a must', 'Allow at least 3 hours to fully experience it']
                  },
                  // KYOTO
                  'Fushimi Inari': {
                    description: 'Ten thousand vermillion torii gates snake up Mount Inari, creating one of Japan\'s most iconic images. The full hike to the summit takes 2-3 hours through atmospheric forest, passing smaller shrines and offering views over Kyoto. The gates are donated by businesses praying for prosperity.',
                    history: 'Founded in 711 AD, this is the head shrine of 30,000 Inari shrines across Japan. Inari is the Shinto god of rice (and by extension, business success). The tradition of donating torii gates began in the Edo period; prices range from ¥400,000 for small gates to millions for large ones.',
                    tips: ['Start hiking before 7am to have the gates almost to yourself', 'The first sections are most crowded - keep climbing for solitude', 'Multiple exit points allow you to shorten the hike', 'Magical at dusk when the lanterns are lit']
                  },
                  'Kinkaku-ji': {
                    description: 'The Golden Pavilion is exactly what its name promises - a three-story pavilion covered in gold leaf set against a perfectly manicured garden and reflecting pond. It\'s one of Japan\'s most photographed sites, stunning in any season but especially beautiful with autumn leaves or winter snow.',
                    history: 'Originally built in 1397 as a retirement villa for Shogun Ashikaga Yoshimitsu, it became a Zen temple after his death. The original burned down in 1950 when a mentally ill monk set it ablaze - an event fictionalized in Mishima\'s novel "The Temple of the Golden Pavilion." The current structure is a 1955 reconstruction.',
                    tips: ['Morning visits have better light for photos', 'The reflection in the pond is the classic shot', 'The circuit walk around the garden takes about 30 minutes', 'Combine with nearby Ryoan-ji for a half-day in northwest Kyoto']
                  },
                  'Arashiyama Bamboo Grove': {
                    description: 'Walking through this towering bamboo forest feels like entering another world. The stalks reach 30 meters high, swaying and creaking in the wind. The path is short but magical, especially when shafts of sunlight filter through the dense canopy. It\'s one of Kyoto\'s most recognizable scenes.',
                    history: 'Arashiyama has been a retreat for Japanese aristocracy since the Heian period (794-1185). The bamboo was originally planted to protect against erosion. The grove\'s preservation became a priority as Kyoto developed; it\'s now part of a larger park and temple complex.',
                    tips: ['Arrive at dawn (before 7am) for the empty forest photos you see online', 'By 9am it becomes a crowded corridor', 'Rent a bike to explore the wider Arashiyama area', 'Combine with Tenryu-ji temple and the monkey park']
                  },
                  'Gion District': {
                    description: 'Kyoto\'s famous geisha district features preserved wooden machiya townhouses, traditional tea houses, and if you\'re lucky, a glimpse of a geiko or maiko hurrying to an appointment. The main streets of Hanamikoji and Shirakawa offer perfect atmospheric evening strolls.',
                    history: 'Gion developed in the medieval period to serve pilgrims visiting Yasaka Shrine. The geisha culture flourished from the 18th century. Today about 250 geiko and maiko work in Gion\'s five traditional districts. The preservation districts protect the historic architecture from modern development.',
                    tips: ['Early evening (5-6pm) offers the best chance to spot geiko/maiko heading to appointments', 'Never block or chase them for photos - it\'s extremely rude', 'The Shirakawa canal area is most photogenic', 'Book a cultural experience at a tea house for a proper introduction']
                  },
                  'Nishiki Market': {
                    description: 'Kyoto\'s 400-year-old "Kitchen" stretches five blocks with over 100 vendors selling pickles, tofu, sweets, fresh seafood, and specialty Kyoto ingredients. It\'s a feast for the senses and the best place to sample local specialties like yuba (tofu skin) and matcha treats.',
                    history: 'The market dates to the 1300s when vendors gathered near a fresh water source ideal for storing fish. It became officially established in 1615 and has operated continuously since. Many shops are family businesses passed down for generations.',
                    tips: ['Go hungry and graze your way through the market', 'Try the tako tamago (baby octopus stuffed with quail egg)', 'Some vendors offer samples - look for the tasting trays', 'Less crowded in the morning before 10am']
                  },
                };

                // Find matching curated info
                const placeKey = Object.keys(placeDetails).find(key => 
                  selectedPlace.name.toLowerCase().includes(key.toLowerCase())
                );
                const info = placeKey ? placeDetails[placeKey] : null;
                
                // Get Wikipedia fallback from cache (fetched via useEffect)
                const wikiContent = wikiCache[selectedPlace.name];

                return (
                  <>
                    {/* Description - curated first, then Google */}
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {info?.description || selectedPlace.description || `A popular destination in ${cityName}.`}
                    </p>

                    {/* History Section - curated first, then Wikipedia fallback */}
                    {(info?.history || wikiContent) && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                        <p className="text-xs font-medium text-amber-800 mb-1">
                          📜 {info?.history ? 'History & Significance' : 'About'}
                        </p>
                        <p className="text-sm text-amber-900 leading-relaxed">
                          {info?.history || wikiContent}
                        </p>
                        {!info?.history && wikiContent && (
                          <p className="text-[10px] text-amber-600 mt-2 italic">Source: Wikipedia</p>
                        )}
                      </div>
                    )}

                    {/* Tips Section - only show if curated */}
                    {info?.tips && info.tips.length > 0 && (
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                        <p className="text-xs font-medium text-blue-800 mb-2">💡 Tips</p>
                        <ul className="space-y-1">
                          {info.tips.map((tip, idx) => (
                            <li key={idx} className="text-sm text-blue-900 flex items-start gap-2">
                              <span className="text-blue-400 mt-0.5">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Reviews Section - from Google Places for restaurants/activities */}
                    {reviewsCache[selectedPlace.name] && reviewsCache[selectedPlace.name].length > 0 && (
                      <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                        <p className="text-xs font-medium text-purple-800 mb-2">💬 What visitors say</p>
                        <div className="space-y-2">
                          {reviewsCache[selectedPlace.name].map((review, idx) => (
                            <div key={idx} className="text-sm">
                              <div className="flex items-center gap-1 mb-0.5">
                                <span className="text-amber-500">{'★'.repeat(review.rating)}</span>
                                <span className="text-gray-400 text-xs">- {review.author_name}</span>
                              </div>
                              <p className="text-purple-900 text-xs leading-relaxed line-clamp-2">{review.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Good for / Not ideal for - stacked */}
              {(() => {
                const config = CATEGORY_CONFIG[selectedPlace.category];
                const attrs = config ? PLACE_ATTRIBUTES[config.type] : null;
                return (
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-green-50 border border-green-100 flex items-start gap-3">
                      <p className="text-xs font-medium text-green-800 whitespace-nowrap">✓ Good for</p>
                      <p className="text-xs text-green-700">{(attrs?.goodFor || ['All travelers']).slice(0, 4).join(' • ')}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-3">
                      <p className="text-xs font-medium text-gray-600 whitespace-nowrap">✗ Not ideal</p>
                      <p className="text-xs text-gray-500">
                        {(attrs?.notFor && attrs.notFor.length > 0) 
                          ? attrs.notFor.slice(0, 3).join(' • ')
                          : 'No major concerns'
                        }
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Address */}
              {selectedPlace.address && (
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-xs font-medium text-gray-500 mb-1">Address</p>
                  <p className="text-sm text-gray-900">{selectedPlace.address}</p>
                </div>
              )}

              {/* Opening Hours - Collapsible */}
              {selectedPlace.openingHours && selectedPlace.openingHours.length > 0 && (
                <details className="p-3 rounded-xl bg-gray-50 group">
                  <summary className="flex items-center gap-2 text-gray-500 cursor-pointer list-none">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">Hours</span>
                    {selectedPlace.isOpen !== undefined && (
                      <span className={`text-xs ${selectedPlace.isOpen ? 'text-green-600' : 'text-red-500'}`}>
                        {selectedPlace.isOpen ? 'Open now' : 'Closed'}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 ml-auto transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="space-y-1 mt-2 pt-2 border-t border-gray-200">
                    {selectedPlace.openingHours.map((hours, idx) => (
                      <p key={idx} className="text-xs text-gray-600">{hours}</p>
                    ))}
                  </div>
                </details>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={(e) => {
                  toggleSavePlace(selectedPlace.id, e);
                }}
                className={`flex-1 py-3 rounded-full font-medium text-sm flex items-center justify-center gap-2 ${
                  savedPlaces.has(selectedPlace.id)
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Heart className={`w-4 h-4 ${savedPlaces.has(selectedPlace.id) ? 'fill-current' : ''}`} />
                {savedPlaces.has(selectedPlace.id) ? 'Saved' : 'Save'}
              </button>
              <a 
                href={selectedPlace.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-full bg-gray-900 text-white font-medium text-sm flex items-center justify-center gap-2"
              >
                Get Directions
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Filter Sheet */}
      {showFilterSheet && (
        <div 
          className="fixed inset-0 bg-black/60 z-[600] flex items-end justify-center"
          onClick={() => setShowFilterSheet(false)}
        >
          <div 
            className="bg-white w-full rounded-t-2xl max-h-[70vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold">Filters</h2>
              <button 
                onClick={() => setShowFilterSheet(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Filter Options */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* My Trip Preferences */}
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <span>✨</span> My Trip
                </h3>
                <p className="text-xs text-gray-500 mb-3">Set your preferences to see personalized matches</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase mb-1.5">Who</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['Solo', 'Couple', 'Family', 'Friends'].map((pref) => (
                        <button
                          key={pref}
                          onClick={() => togglePreference(pref)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            userPreferences.has(pref)
                              ? 'bg-primary text-white'
                              : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {pref}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase mb-1.5">Interests</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['History', 'Food', 'Nature', 'Adventure', 'Nightlife', 'Art', 'Shopping', 'Photography'].map((pref) => (
                        <button
                          key={pref}
                          onClick={() => togglePreference(pref)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            userPreferences.has(pref)
                              ? 'bg-primary text-white'
                              : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {pref}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom filter input */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Custom</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customFilterInput}
                    onChange={(e) => setCustomFilterInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomFilter()}
                    placeholder="Type your own filter..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={addCustomFilter}
                    disabled={!customFilterInput.trim()}
                    className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>

              {Object.entries(filterGroups).map(([groupName, filters]) => (
                <div key={groupName}>
                  <h3 className="text-sm font-semibold mb-2">{groupName}</h3>
                  <div className="flex flex-wrap gap-2">
                    {filters.map((filter) => (
                      <button
                        key={filter}
                        onClick={() => toggleQuickFilter(filter)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          activeQuickFilters.has(filter)
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setActiveQuickFilters(new Set())}
                className="flex-1 py-3 rounded-full bg-gray-100 text-gray-700 font-medium text-sm"
              >
                Clear all
              </button>
              <button 
                onClick={() => setShowFilterSheet(false)}
                className="flex-1 py-3 rounded-full bg-gray-900 text-white font-medium text-sm"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
