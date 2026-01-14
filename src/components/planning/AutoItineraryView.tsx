'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Hotel,
  MapPin,
  Clock,
  Star,
  Footprints,
  Sparkles,
  RefreshCw,
  Calendar,
  ChevronDown,
  ChevronUp,
  GripVertical,
  DollarSign,
  Trash2,
  X,
  Check,
  Map,
  Image,
  List,
  Plane,
  AlertCircle,
  Paperclip,
  Link2,
  Car,
  Bus,
  Train,
  Bed,
  Utensils,
  MoreHorizontal,
} from 'lucide-react';
import type { TripDNA } from '@/types/trip-dna';
import type { GeneratedActivity, GeneratedDay, CityAllocation } from '@/lib/planning/itinerary-generator';
import { allocateDays, RECOMMENDED_NIGHTS, DEFAULT_NIGHTS } from '@/lib/planning/itinerary-generator';
import dynamic from 'next/dynamic';

// Dynamically import HotelPicker, RouteMap, and ActivityMap
const HotelPicker = dynamic(() => import('./HotelPicker'), { ssr: false });
const RouteMap = dynamic(() => import('./RouteMap'), { ssr: false });
const ActivityMap = dynamic(() => import('./ActivityMap'), { ssr: false });

// Day colors for visual distinction
const DAY_COLORS = [
  { bg: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
  { bg: 'bg-amber-500', light: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600' },
  { bg: 'bg-cyan-500', light: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-600' },
  { bg: 'bg-pink-500', light: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600' },
  { bg: 'bg-violet-500', light: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-600' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' },
  { bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
];

// Day names for closure checking
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBREVS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Check if a place is closed on a given date and return any warnings
function getActivityWarnings(activity: GeneratedActivity, dateStr: string): string | null {
  if (!activity.openingHours) return null;

  const hours = activity.openingHours.toLowerCase();
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayOfWeek = date.getDay();
  const dayName = DAY_NAMES[dayOfWeek].toLowerCase();
  const dayAbbrev = DAY_ABBREVS[dayOfWeek].toLowerCase();
  const dayNameFull = DAY_NAMES[dayOfWeek];

  // Check for "Closed [Day]" patterns
  if (hours.includes(`closed ${dayName}`) ||
      hours.includes(`closed on ${dayName}`) ||
      hours.includes(`closed ${dayAbbrev}`)) {
    return `Closed on ${dayNameFull}`;
  }

  // Check for "Closed Mondays" plural pattern
  if (hours.includes(`closed ${dayName}s`)) {
    return `Closed on ${dayNameFull}s`;
  }

  // Check for specific day patterns like "Mon-Fri only" (closed on weekends)
  if (hours.includes('mon-fri') && (dayOfWeek === 0 || dayOfWeek === 6)) {
    return `Closed on ${dayNameFull} (weekdays only)`;
  }

  // Check for weekend-only places
  if ((hours.includes('sat-sun') || hours.includes('weekends')) && dayOfWeek >= 1 && dayOfWeek <= 5) {
    return `Closed on ${dayNameFull} (weekends only)`;
  }

  // Check for "Saturday Market" or similar - only open on specific days
  if (activity.name.toLowerCase().includes('saturday') && dayOfWeek !== 6) {
    return `Only open on Saturdays`;
  }
  if (activity.name.toLowerCase().includes('sunday') && dayOfWeek !== 0) {
    return `Only open on Sundays`;
  }

  return null;
}

interface AutoItineraryViewProps {
  cities: string[];
  tripDna: TripDNA;
  duration?: number; // Total trip days
  startDate?: string; // Explicit start date prop (avoids remount issues)
  endDate?: string; // Explicit end date prop (avoids remount issues)
  onBack: () => void;
  getCityCountry?: (city: string) => string | undefined;
  onDatesChange?: (startDate: string, totalDays: number) => void; // Callback to sync dates back to parent
  initialAllocations?: CityAllocation[]; // Persisted allocations from parent
  onAllocationsChange?: (allocations: CityAllocation[]) => void; // Callback to sync allocations to parent
  initialGeneratedDays?: GeneratedDay[]; // Persisted generated days from parent
  onGeneratedDaysChange?: (days: GeneratedDay[]) => void; // Callback to sync days to parent
  parentLoadComplete?: boolean; // Signal that parent has finished loading from IndexedDB
}

// Mock activities data for auto-fill
const MOCK_ACTIVITIES: Record<string, GeneratedActivity[]> = {
  'Bangkok': [
    {
      id: 'bkk-1',
      name: 'Grand Palace',
      type: 'attraction',
      description: 'Thailand\'s most famous landmark with stunning gold spires and intricate architecture',
      imageUrl: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&q=80',
      suggestedTime: '09:00',
      duration: 120,
      openingHours: '8:30AM-3:30PM',
      neighborhood: 'Rattanakosin',
      matchScore: 95,
      matchReasons: ['Top attraction', 'Historic site'],
      priceRange: '$$',
      tags: ['temple', 'history', 'photography'],
      walkingTimeToNext: 8,
    },
    {
      id: 'bkk-2',
      name: 'Wat Pho',
      type: 'attraction',
      description: 'Home to the massive reclining Buddha statue and traditional Thai massage school',
      imageUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
      suggestedTime: '11:30',
      duration: 90,
      openingHours: '8AM-6:30PM',
      neighborhood: 'Rattanakosin',
      matchScore: 92,
      matchReasons: ['Near Grand Palace', 'Must-see temple'],
      priceRange: '$',
      tags: ['temple', 'buddha', 'culture'],
      walkingTimeToNext: 5,
    },
    {
      id: 'bkk-3',
      name: 'Jay Fai',
      type: 'restaurant',
      description: 'Legendary street food stall with Michelin star - famous for crab omelette',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
      suggestedTime: '13:00',
      duration: 60,
      openingHours: '2PM-10PM',
      neighborhood: 'Old Town',
      matchScore: 88,
      matchReasons: ['Michelin star', 'Local favorite'],
      priceRange: '$$$',
      tags: ['street food', 'seafood', 'michelin'],
      walkingTimeToNext: 15,
    },
    {
      id: 'bkk-4',
      name: 'Chatuchak Weekend Market',
      type: 'activity',
      description: 'World\'s largest weekend market with 15,000+ stalls',
      imageUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80',
      suggestedTime: '16:00',
      duration: 180,
      openingHours: '6AM-6PM (Sat-Sun)',
      neighborhood: 'Chatuchak',
      matchScore: 85,
      matchReasons: ['Shopping paradise', 'Local culture'],
      priceRange: '$',
      tags: ['market', 'shopping', 'local'],
    },
  ],
  'Chiang Mai': [
    {
      id: 'cnx-1',
      name: 'Doi Suthep Temple',
      type: 'attraction',
      description: 'Sacred hilltop temple with 309 steps and panoramic city views',
      imageUrl: 'https://images.unsplash.com/photo-1512553424870-a2a2d9e5ed73?w=600&q=80',
      suggestedTime: '08:00',
      duration: 150,
      openingHours: '6AM-6PM',
      neighborhood: 'Doi Suthep',
      matchScore: 94,
      matchReasons: ['Most sacred temple', 'Amazing views'],
      priceRange: '$',
      tags: ['temple', 'mountain', 'viewpoint'],
      walkingTimeToNext: 45,
    },
    {
      id: 'cnx-2',
      name: 'Khao Soi Khun Yai',
      type: 'restaurant',
      description: 'Best khao soi in Chiang Mai - creamy coconut curry noodles',
      imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
      suggestedTime: '12:00',
      duration: 45,
      openingHours: '9AM-4PM',
      neighborhood: 'Old City',
      matchScore: 91,
      matchReasons: ['Local specialty', 'Authentic taste'],
      priceRange: '$',
      tags: ['noodles', 'curry', 'local'],
      walkingTimeToNext: 10,
    },
    {
      id: 'cnx-3',
      name: 'Sunday Walking Street',
      type: 'activity',
      description: 'Weekly night market along Ratchadamnoen Road with crafts and food',
      imageUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80',
      suggestedTime: '17:00',
      duration: 180,
      openingHours: '4PM-10PM (Sun)',
      neighborhood: 'Old City',
      matchScore: 87,
      matchReasons: ['Local culture', 'Great food stalls'],
      priceRange: '$',
      tags: ['market', 'crafts', 'street food'],
    },
  ],
  'Tokyo': [
    {
      id: 'tyo-1',
      name: 'Senso-ji Temple',
      type: 'attraction',
      description: 'Tokyo\'s oldest and most significant Buddhist temple in historic Asakusa',
      imageUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80',
      suggestedTime: '09:00',
      duration: 90,
      openingHours: '6AM-5PM',
      neighborhood: 'Asakusa',
      matchScore: 95,
      matchReasons: ['Historic temple', 'Must-see landmark'],
      priceRange: '$',
      tags: ['temple', 'history', 'culture'],
      walkingTimeToNext: 15,
    },
    {
      id: 'tyo-2',
      name: 'Tsukiji Outer Market',
      type: 'activity',
      description: 'Famous fish market area with fresh sushi, seafood, and Japanese street food',
      imageUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&q=80',
      suggestedTime: '11:00',
      duration: 120,
      openingHours: '5AM-2PM',
      neighborhood: 'Tsukiji',
      matchScore: 93,
      matchReasons: ['Fresh sushi', 'Authentic experience'],
      priceRange: '$$',
      tags: ['food', 'market', 'sushi'],
      walkingTimeToNext: 20,
    },
    {
      id: 'tyo-3',
      name: 'teamLab Borderless',
      type: 'attraction',
      description: 'Immersive digital art museum with interactive light installations',
      imageUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=600&q=80',
      suggestedTime: '14:00',
      duration: 180,
      openingHours: '10AM-7PM',
      neighborhood: 'Odaiba',
      matchScore: 91,
      matchReasons: ['Unique experience', 'Instagram-worthy'],
      priceRange: '$$',
      tags: ['art', 'digital', 'interactive'],
      walkingTimeToNext: 30,
    },
    {
      id: 'tyo-4',
      name: 'Shibuya Crossing',
      type: 'attraction',
      description: 'World\'s busiest pedestrian crossing - iconic Tokyo experience',
      imageUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
      suggestedTime: '18:00',
      duration: 60,
      openingHours: '24 hours',
      neighborhood: 'Shibuya',
      matchScore: 89,
      matchReasons: ['Iconic Tokyo', 'Great at night'],
      priceRange: '$',
      tags: ['landmark', 'nightlife', 'photography'],
      walkingTimeToNext: 10,
    },
    {
      id: 'tyo-5',
      name: 'Ichiran Ramen',
      type: 'restaurant',
      description: 'Famous tonkotsu ramen chain with private booth dining experience',
      imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
      suggestedTime: '19:30',
      duration: 45,
      openingHours: '24 hours',
      neighborhood: 'Shibuya',
      matchScore: 88,
      matchReasons: ['Iconic ramen', 'Unique dining'],
      priceRange: '$',
      tags: ['ramen', 'japanese', 'solo-friendly'],
    },
  ],
  'Kyoto': [
    {
      id: 'kyo-1',
      name: 'Fushimi Inari Shrine',
      type: 'attraction',
      description: 'Iconic shrine famous for thousands of vermillion torii gates',
      imageUrl: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=600&q=80',
      suggestedTime: '07:00',
      duration: 180,
      openingHours: '24 hours',
      neighborhood: 'Fushimi',
      matchScore: 96,
      matchReasons: ['Most iconic shrine', 'Best at sunrise'],
      priceRange: '$',
      tags: ['shrine', 'torii', 'hiking'],
      walkingTimeToNext: 30,
    },
    {
      id: 'kyo-2',
      name: 'Kinkaku-ji (Golden Pavilion)',
      type: 'attraction',
      description: 'Stunning Zen temple covered in gold leaf overlooking a reflective pond',
      imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
      suggestedTime: '11:00',
      duration: 60,
      openingHours: '9AM-5PM',
      neighborhood: 'Kita',
      matchScore: 94,
      matchReasons: ['UNESCO site', 'Stunning photography'],
      priceRange: '$',
      tags: ['temple', 'zen', 'photography'],
      walkingTimeToNext: 20,
    },
    {
      id: 'kyo-3',
      name: 'Arashiyama Bamboo Grove',
      type: 'attraction',
      description: 'Magical bamboo forest path in western Kyoto',
      imageUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80',
      suggestedTime: '14:00',
      duration: 90,
      openingHours: '24 hours',
      neighborhood: 'Arashiyama',
      matchScore: 93,
      matchReasons: ['Unique landscape', 'Peaceful walk'],
      priceRange: '$',
      tags: ['nature', 'bamboo', 'photography'],
      walkingTimeToNext: 15,
    },
    {
      id: 'kyo-4',
      name: 'Gion District',
      type: 'activity',
      description: 'Historic geisha district with traditional wooden machiya houses',
      imageUrl: 'https://images.unsplash.com/photo-1493780474015-ba834fd0ce2f?w=600&q=80',
      suggestedTime: '17:00',
      duration: 120,
      openingHours: '24 hours',
      neighborhood: 'Gion',
      matchScore: 90,
      matchReasons: ['Geisha spotting', 'Traditional atmosphere'],
      priceRange: '$',
      tags: ['culture', 'geisha', 'historic'],
    },
  ],
  'Osaka': [
    {
      id: 'osa-1',
      name: 'Osaka Castle',
      type: 'attraction',
      description: 'Iconic castle with museum and beautiful park grounds',
      imageUrl: 'https://images.unsplash.com/photo-1590253230532-a67f6bc61c9e?w=600&q=80',
      suggestedTime: '09:00',
      duration: 120,
      openingHours: '9AM-5PM',
      neighborhood: 'Chuo',
      matchScore: 92,
      matchReasons: ['Historic landmark', 'Great views'],
      priceRange: '$',
      tags: ['castle', 'history', 'park'],
      walkingTimeToNext: 30,
    },
    {
      id: 'osa-2',
      name: 'Dotonbori',
      type: 'activity',
      description: 'Vibrant entertainment district famous for neon lights and street food',
      imageUrl: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=600&q=80',
      suggestedTime: '18:00',
      duration: 180,
      openingHours: '24 hours',
      neighborhood: 'Namba',
      matchScore: 95,
      matchReasons: ['Iconic Osaka', 'Amazing food'],
      priceRange: '$$',
      tags: ['nightlife', 'food', 'entertainment'],
      walkingTimeToNext: 5,
    },
    {
      id: 'osa-3',
      name: 'Kuromon Market',
      type: 'activity',
      description: 'Osaka\'s kitchen - 170+ year old market with fresh seafood and street food',
      imageUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&q=80',
      suggestedTime: '11:00',
      duration: 90,
      openingHours: '9AM-5PM',
      neighborhood: 'Nippombashi',
      matchScore: 91,
      matchReasons: ['Fresh seafood', 'Local experience'],
      priceRange: '$$',
      tags: ['market', 'seafood', 'food'],
      walkingTimeToNext: 15,
    },
    {
      id: 'osa-4',
      name: 'Takoyaki at Wanaka',
      type: 'restaurant',
      description: 'Famous takoyaki (octopus balls) - Osaka\'s signature street food',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
      suggestedTime: '13:00',
      duration: 30,
      openingHours: '10AM-9PM',
      neighborhood: 'Namba',
      matchScore: 89,
      matchReasons: ['Must-try Osaka food', 'Local favorite'],
      priceRange: '$',
      tags: ['takoyaki', 'street food', 'local'],
    },
  ],
  'Hakone': [
    {
      id: 'hak-1',
      name: 'Hakone Open-Air Museum',
      type: 'attraction',
      description: 'Stunning outdoor sculpture museum with Picasso collection and mountain views',
      imageUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80',
      suggestedTime: '09:00',
      duration: 150,
      openingHours: '9AM-5PM',
      neighborhood: 'Ninotaira',
      matchScore: 94,
      matchReasons: ['World-class art', 'Beautiful setting'],
      priceRange: '$$',
      tags: ['art', 'museum', 'outdoor'],
      walkingTimeToNext: 20,
    },
    {
      id: 'hak-2',
      name: 'Lake Ashi Cruise',
      type: 'activity',
      description: 'Scenic boat ride with views of Mt. Fuji on clear days',
      imageUrl: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=600&q=80',
      suggestedTime: '12:00',
      duration: 60,
      openingHours: '9AM-5PM',
      neighborhood: 'Moto-Hakone',
      matchScore: 92,
      matchReasons: ['Mt. Fuji views', 'Relaxing cruise'],
      priceRange: '$$',
      tags: ['cruise', 'lake', 'scenic'],
      walkingTimeToNext: 15,
    },
    {
      id: 'hak-3',
      name: 'Owakudani Valley',
      type: 'attraction',
      description: 'Volcanic valley with hot springs and famous black eggs',
      imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
      suggestedTime: '14:00',
      duration: 90,
      openingHours: '9AM-5PM',
      neighborhood: 'Owakudani',
      matchScore: 90,
      matchReasons: ['Unique landscape', 'Try black eggs'],
      priceRange: '$',
      tags: ['volcanic', 'nature', 'hot springs'],
      walkingTimeToNext: 30,
    },
    {
      id: 'hak-4',
      name: 'Hakone Onsen',
      type: 'activity',
      description: 'Traditional Japanese hot spring bath experience',
      imageUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80',
      suggestedTime: '17:00',
      duration: 120,
      openingHours: '10AM-9PM',
      neighborhood: 'Hakone-Yumoto',
      matchScore: 95,
      matchReasons: ['Relaxing onsen', 'Japanese tradition'],
      priceRange: '$$',
      tags: ['onsen', 'relaxation', 'traditional'],
    },
  ],
  'Hoi An': [
    {
      id: 'hoi-1',
      name: 'Ancient Town Walking Tour',
      type: 'activity',
      description: 'UNESCO-listed old town with lantern-lit streets and historic architecture',
      imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80',
      suggestedTime: '08:00',
      duration: 180,
      openingHours: '24 hours',
      neighborhood: 'Ancient Town',
      matchScore: 96,
      matchReasons: ['UNESCO World Heritage', 'Beautiful at night'],
      priceRange: '$',
      tags: ['historic', 'walking', 'culture'],
      walkingTimeToNext: 5,
    },
    {
      id: 'hoi-2',
      name: 'Japanese Covered Bridge',
      type: 'attraction',
      description: 'Iconic 18th-century bridge and symbol of Hoi An',
      imageUrl: 'https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=600&q=80',
      suggestedTime: '11:00',
      duration: 30,
      openingHours: '7AM-9PM',
      neighborhood: 'Ancient Town',
      matchScore: 91,
      matchReasons: ['Iconic landmark', 'Historic site'],
      priceRange: '$',
      tags: ['bridge', 'historic', 'photography'],
      walkingTimeToNext: 10,
    },
    {
      id: 'hoi-3',
      name: 'Cao Lau at Morning Glory',
      type: 'restaurant',
      description: 'Famous noodle dish unique to Hoi An - must try local specialty',
      imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
      suggestedTime: '12:00',
      duration: 60,
      openingHours: '10AM-10PM',
      neighborhood: 'Ancient Town',
      matchScore: 93,
      matchReasons: ['Local specialty', 'Only in Hoi An'],
      priceRange: '$',
      tags: ['noodles', 'local food', 'vietnamese'],
      walkingTimeToNext: 15,
    },
    {
      id: 'hoi-4',
      name: 'Tailor Shopping',
      type: 'activity',
      description: 'Custom tailored clothing made in 24-48 hours at amazing prices',
      imageUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80',
      suggestedTime: '14:00',
      duration: 120,
      openingHours: '8AM-9PM',
      neighborhood: 'Ancient Town',
      matchScore: 88,
      matchReasons: ['World-famous tailors', 'Great value'],
      priceRange: '$$',
      tags: ['shopping', 'tailoring', 'fashion'],
      walkingTimeToNext: 10,
    },
    {
      id: 'hoi-5',
      name: 'Lantern Night Market',
      type: 'activity',
      description: 'Magical evening market with handmade lanterns and local crafts',
      imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80',
      suggestedTime: '18:00',
      duration: 120,
      openingHours: '5PM-10PM',
      neighborhood: 'An Hoi',
      matchScore: 94,
      matchReasons: ['Magical atmosphere', 'Great photos'],
      priceRange: '$',
      tags: ['market', 'lanterns', 'night'],
    },
  ],
  'Da Nang': [
    {
      id: 'dan-1',
      name: 'Ba Na Hills & Golden Bridge',
      type: 'attraction',
      description: 'Iconic bridge held by giant stone hands with stunning mountain views',
      imageUrl: 'https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=600&q=80',
      suggestedTime: '08:00',
      duration: 360,
      openingHours: '7AM-10PM',
      neighborhood: 'Ba Na Hills',
      matchScore: 96,
      matchReasons: ['World-famous bridge', 'Full-day adventure'],
      priceRange: '$$$',
      tags: ['bridge', 'mountain', 'theme park'],
      walkingTimeToNext: 60,
    },
    {
      id: 'dan-2',
      name: 'My Khe Beach',
      type: 'activity',
      description: 'One of the most beautiful beaches in Vietnam with soft white sand',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
      suggestedTime: '06:00',
      duration: 180,
      openingHours: '24 hours',
      neighborhood: 'My Khe',
      matchScore: 92,
      matchReasons: ['Beautiful beach', 'Great for swimming'],
      priceRange: '$',
      tags: ['beach', 'swimming', 'relaxation'],
      walkingTimeToNext: 20,
    },
    {
      id: 'dan-3',
      name: 'Marble Mountains',
      type: 'attraction',
      description: 'Cluster of five marble hills with caves, pagodas, and panoramic views',
      imageUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
      suggestedTime: '14:00',
      duration: 150,
      openingHours: '7AM-5:30PM',
      neighborhood: 'Ngu Hanh Son',
      matchScore: 91,
      matchReasons: ['Unique geology', 'Buddhist caves'],
      priceRange: '$',
      tags: ['mountain', 'caves', 'temples'],
      walkingTimeToNext: 25,
    },
    {
      id: 'dan-4',
      name: 'Dragon Bridge Fire Show',
      type: 'activity',
      description: 'Iconic dragon-shaped bridge that breathes fire on weekend nights',
      imageUrl: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=600&q=80',
      suggestedTime: '21:00',
      duration: 30,
      openingHours: '9PM (Sat-Sun)',
      neighborhood: 'Han River',
      matchScore: 89,
      matchReasons: ['Unique spectacle', 'Weekend only'],
      priceRange: '$',
      tags: ['bridge', 'fire show', 'nightlife'],
    },
  ],
  'Hanoi': [
    {
      id: 'han-1',
      name: 'Old Quarter Walking Tour',
      type: 'activity',
      description: 'Maze of 36 ancient streets each specializing in different trades',
      imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80',
      suggestedTime: '08:00',
      duration: 180,
      openingHours: '24 hours',
      neighborhood: 'Old Quarter',
      matchScore: 95,
      matchReasons: ['Historic heart of Hanoi', 'Amazing street food'],
      priceRange: '$',
      tags: ['historic', 'walking', 'street food'],
      walkingTimeToNext: 10,
    },
    {
      id: 'han-2',
      name: 'Hoan Kiem Lake',
      type: 'attraction',
      description: 'Sacred lake in heart of Hanoi with Turtle Tower and Ngoc Son Temple',
      imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&q=80',
      suggestedTime: '06:00',
      duration: 60,
      openingHours: '24 hours',
      neighborhood: 'Hoan Kiem',
      matchScore: 93,
      matchReasons: ['Iconic Hanoi', 'Beautiful at sunrise'],
      priceRange: '$',
      tags: ['lake', 'temple', 'scenic'],
      walkingTimeToNext: 15,
    },
    {
      id: 'han-3',
      name: 'Pho at Pho Gia Truyen',
      type: 'restaurant',
      description: 'Legendary pho shop serving Hanoi-style beef noodle soup since 1950s',
      imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
      suggestedTime: '07:00',
      duration: 45,
      openingHours: '6AM-10AM, 6PM-8PM',
      neighborhood: 'Old Quarter',
      matchScore: 94,
      matchReasons: ['Best pho in Hanoi', 'Local institution'],
      priceRange: '$',
      tags: ['pho', 'noodles', 'local'],
      walkingTimeToNext: 10,
    },
    {
      id: 'han-4',
      name: 'Temple of Literature',
      type: 'attraction',
      description: 'Vietnam\'s first university from 1070 with beautiful traditional architecture',
      imageUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
      suggestedTime: '14:00',
      duration: 90,
      openingHours: '8AM-5PM',
      neighborhood: 'Dong Da',
      matchScore: 91,
      matchReasons: ['Historic landmark', 'Beautiful architecture'],
      priceRange: '$',
      tags: ['temple', 'history', 'architecture'],
      walkingTimeToNext: 20,
    },
    {
      id: 'han-5',
      name: 'Water Puppet Show',
      type: 'activity',
      description: 'Traditional Vietnamese art form with puppets performing on water',
      imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&q=80',
      suggestedTime: '18:00',
      duration: 60,
      openingHours: 'Shows at 3PM, 4PM, 5PM, 6:30PM, 8PM',
      neighborhood: 'Hoan Kiem',
      matchScore: 88,
      matchReasons: ['Unique Vietnamese art', 'Cultural experience'],
      priceRange: '$',
      tags: ['culture', 'performance', 'traditional'],
    },
  ],
  'Ho Chi Minh City': [
    {
      id: 'hcm-1',
      name: 'War Remnants Museum',
      type: 'attraction',
      description: 'Powerful museum documenting Vietnam War with artifacts and photographs',
      imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&q=80',
      suggestedTime: '09:00',
      duration: 150,
      openingHours: '7:30AM-6PM',
      neighborhood: 'District 3',
      matchScore: 94,
      matchReasons: ['Important history', 'Eye-opening'],
      priceRange: '$',
      tags: ['museum', 'history', 'war'],
      walkingTimeToNext: 15,
    },
    {
      id: 'hcm-2',
      name: 'Ben Thanh Market',
      type: 'activity',
      description: 'Iconic central market with everything from food to souvenirs',
      imageUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80',
      suggestedTime: '08:00',
      duration: 120,
      openingHours: '6AM-6PM',
      neighborhood: 'District 1',
      matchScore: 90,
      matchReasons: ['Iconic HCMC', 'Great for shopping'],
      priceRange: '$',
      tags: ['market', 'shopping', 'local'],
      walkingTimeToNext: 10,
    },
    {
      id: 'hcm-3',
      name: 'Banh Mi at Banh Mi Huynh Hoa',
      type: 'restaurant',
      description: 'Best banh mi in the city - legendary Vietnamese sandwich shop',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
      suggestedTime: '12:00',
      duration: 30,
      openingHours: '2:30PM-11PM',
      neighborhood: 'District 1',
      matchScore: 95,
      matchReasons: ['Best banh mi ever', 'Worth the queue'],
      priceRange: '$',
      tags: ['banh mi', 'sandwich', 'street food'],
      walkingTimeToNext: 15,
    },
    {
      id: 'hcm-4',
      name: 'Cu Chi Tunnels',
      type: 'attraction',
      description: 'Underground tunnel network used during Vietnam War - day trip',
      imageUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
      suggestedTime: '08:00',
      duration: 300,
      openingHours: '7AM-5PM',
      neighborhood: 'Cu Chi District',
      matchScore: 92,
      matchReasons: ['Unique experience', 'Historical site'],
      priceRange: '$$',
      tags: ['history', 'tunnels', 'day trip'],
      walkingTimeToNext: 60,
    },
    {
      id: 'hcm-5',
      name: 'Rooftop Bar at Saigon Saigon',
      type: 'activity',
      description: 'Classic rooftop bar with views over the city at Caravelle Hotel',
      imageUrl: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=600&q=80',
      suggestedTime: '18:00',
      duration: 120,
      openingHours: '11AM-12AM',
      neighborhood: 'District 1',
      matchScore: 87,
      matchReasons: ['Great views', 'Classic HCMC'],
      priceRange: '$$',
      tags: ['rooftop', 'bar', 'views'],
    },
  ],
  'Chiang Rai': [
    {
      id: 'cri-1',
      name: 'White Temple (Wat Rong Khun)',
      type: 'attraction',
      description: 'Stunning contemporary Buddhist temple covered in white plaster and mirrors',
      imageUrl: 'https://images.unsplash.com/photo-1512553424870-a2a2d9e5ed73?w=600&q=80',
      suggestedTime: '08:00',
      duration: 120,
      openingHours: '8AM-5PM',
      neighborhood: 'Chiang Rai',
      matchScore: 96,
      matchReasons: ['Architectural wonder', 'Must-see Thailand'],
      priceRange: '$',
      tags: ['temple', 'architecture', 'art'],
      walkingTimeToNext: 30,
    },
    {
      id: 'cri-2',
      name: 'Blue Temple (Wat Rong Suea Ten)',
      type: 'attraction',
      description: 'Striking blue temple with intricate carvings and giant white Buddha',
      imageUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
      suggestedTime: '11:00',
      duration: 60,
      openingHours: '7AM-8PM',
      neighborhood: 'Chiang Rai',
      matchScore: 91,
      matchReasons: ['Unique blue color', 'Less crowded'],
      priceRange: '$',
      tags: ['temple', 'blue', 'buddha'],
      walkingTimeToNext: 20,
    },
    {
      id: 'cri-3',
      name: 'Black House (Baan Dam)',
      type: 'attraction',
      description: 'Dark, unconventional art museum by national artist Thawan Duchanee',
      imageUrl: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&q=80',
      suggestedTime: '14:00',
      duration: 90,
      openingHours: '9AM-5PM',
      neighborhood: 'Nang Lae',
      matchScore: 88,
      matchReasons: ['Unique art', 'Contrast to White Temple'],
      priceRange: '$',
      tags: ['art', 'museum', 'dark'],
      walkingTimeToNext: 25,
    },
    {
      id: 'cri-4',
      name: 'Night Bazaar',
      type: 'activity',
      description: 'Lively evening market with local food, crafts, and hill tribe goods',
      imageUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80',
      suggestedTime: '18:00',
      duration: 120,
      openingHours: '6PM-11PM',
      neighborhood: 'City Center',
      matchScore: 86,
      matchReasons: ['Local culture', 'Great food stalls'],
      priceRange: '$',
      tags: ['market', 'night', 'food'],
    },
  ],
  'Phuket': [
    {
      id: 'phu-1',
      name: 'Phi Phi Islands Day Trip',
      type: 'activity',
      description: 'Stunning islands with crystal-clear water, snorkeling, and Maya Bay',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
      suggestedTime: '07:00',
      duration: 480,
      openingHours: 'Boats depart 7AM-9AM',
      neighborhood: 'Phi Phi Islands',
      matchScore: 96,
      matchReasons: ['Stunning islands', 'The Beach filming location'],
      priceRange: '$$$',
      tags: ['islands', 'snorkeling', 'beach'],
      walkingTimeToNext: 0,
    },
    {
      id: 'phu-2',
      name: 'Patong Beach',
      type: 'activity',
      description: 'Most famous beach in Phuket with water sports and beachside dining',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
      suggestedTime: '09:00',
      duration: 240,
      openingHours: '24 hours',
      neighborhood: 'Patong',
      matchScore: 88,
      matchReasons: ['Famous beach', 'Water sports'],
      priceRange: '$',
      tags: ['beach', 'swimming', 'nightlife'],
      walkingTimeToNext: 15,
    },
    {
      id: 'phu-3',
      name: 'Big Buddha',
      type: 'attraction',
      description: '45-meter white marble Buddha statue with panoramic island views',
      imageUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
      suggestedTime: '16:00',
      duration: 90,
      openingHours: '6AM-7PM',
      neighborhood: 'Chalong',
      matchScore: 90,
      matchReasons: ['Iconic landmark', 'Sunset views'],
      priceRange: '$',
      tags: ['buddha', 'viewpoint', 'temple'],
      walkingTimeToNext: 30,
    },
    {
      id: 'phu-4',
      name: 'Old Phuket Town',
      type: 'activity',
      description: 'Charming Sino-Portuguese architecture, street art, and local cafes',
      imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80',
      suggestedTime: '10:00',
      duration: 150,
      openingHours: '24 hours',
      neighborhood: 'Old Town',
      matchScore: 85,
      matchReasons: ['Historic charm', 'Great for photos'],
      priceRange: '$',
      tags: ['historic', 'architecture', 'cafes'],
    },
  ],
  'Honolulu': [
    {
      id: 'hon-1',
      name: 'Waikiki Beach',
      type: 'activity',
      description: 'World-famous beach with Diamond Head backdrop and perfect waves',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
      suggestedTime: '07:00',
      duration: 240,
      openingHours: '24 hours',
      neighborhood: 'Waikiki',
      matchScore: 95,
      matchReasons: ['Iconic beach', 'Great for surfing'],
      priceRange: '$',
      tags: ['beach', 'surfing', 'swimming'],
      walkingTimeToNext: 15,
    },
    {
      id: 'hon-2',
      name: 'Diamond Head Hike',
      type: 'activity',
      description: 'Iconic volcanic crater hike with stunning views of Honolulu',
      imageUrl: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=600&q=80',
      suggestedTime: '06:00',
      duration: 120,
      openingHours: '6AM-6PM',
      neighborhood: 'Diamond Head',
      matchScore: 94,
      matchReasons: ['Must-do hike', 'Amazing views'],
      priceRange: '$',
      tags: ['hiking', 'volcano', 'views'],
      walkingTimeToNext: 30,
    },
    {
      id: 'hon-3',
      name: 'Pearl Harbor Memorial',
      type: 'attraction',
      description: 'Historic WWII memorial site including USS Arizona Memorial',
      imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&q=80',
      suggestedTime: '08:00',
      duration: 240,
      openingHours: '7AM-5PM',
      neighborhood: 'Pearl Harbor',
      matchScore: 92,
      matchReasons: ['Historic significance', 'Moving experience'],
      priceRange: '$',
      tags: ['history', 'memorial', 'wwii'],
      walkingTimeToNext: 45,
    },
    {
      id: 'hon-4',
      name: 'North Shore Beaches',
      type: 'activity',
      description: 'Famous surfing beaches including Pipeline and Sunset Beach',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
      suggestedTime: '10:00',
      duration: 300,
      openingHours: '24 hours',
      neighborhood: 'North Shore',
      matchScore: 91,
      matchReasons: ['World-class surf', 'Scenic drive'],
      priceRange: '$',
      tags: ['surfing', 'beach', 'scenic'],
      walkingTimeToNext: 60,
    },
    {
      id: 'hon-5',
      name: 'Poke at Ono Seafood',
      type: 'restaurant',
      description: 'Fresh Hawaiian poke bowls - the best in Honolulu',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
      suggestedTime: '12:00',
      duration: 45,
      openingHours: '9AM-6PM',
      neighborhood: 'Kapahulu',
      matchScore: 93,
      matchReasons: ['Best poke', 'Local favorite'],
      priceRange: '$',
      tags: ['poke', 'seafood', 'local'],
    },
  ],
  'Bali': [
    {
      id: 'bal-1',
      name: 'Tegallalang Rice Terraces',
      type: 'attraction',
      description: 'Stunning terraced rice paddies with traditional Balinese irrigation',
      imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
      suggestedTime: '07:00',
      duration: 120,
      openingHours: '8AM-6PM',
      neighborhood: 'Tegallalang',
      matchScore: 95,
      matchReasons: ['Iconic Bali', 'Instagram famous'],
      priceRange: '$',
      tags: ['rice terraces', 'nature', 'photography'],
      walkingTimeToNext: 30,
    },
    {
      id: 'bal-2',
      name: 'Ubud Monkey Forest',
      type: 'attraction',
      description: 'Sacred forest sanctuary with hundreds of long-tailed macaques',
      imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
      suggestedTime: '09:00',
      duration: 90,
      openingHours: '8:30AM-6PM',
      neighborhood: 'Ubud',
      matchScore: 91,
      matchReasons: ['Unique experience', 'Sacred site'],
      priceRange: '$',
      tags: ['monkeys', 'forest', 'temple'],
      walkingTimeToNext: 15,
    },
    {
      id: 'bal-3',
      name: 'Tirta Empul Temple',
      type: 'attraction',
      description: 'Sacred water temple where Balinese come for ritual purification',
      imageUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
      suggestedTime: '11:00',
      duration: 90,
      openingHours: '8AM-6PM',
      neighborhood: 'Tampaksiring',
      matchScore: 93,
      matchReasons: ['Spiritual experience', 'Holy spring'],
      priceRange: '$',
      tags: ['temple', 'spiritual', 'water'],
      walkingTimeToNext: 25,
    },
    {
      id: 'bal-4',
      name: 'Seminyak Beach Club',
      type: 'activity',
      description: 'Trendy beach clubs with pools, cocktails, and sunset views',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
      suggestedTime: '15:00',
      duration: 240,
      openingHours: '10AM-11PM',
      neighborhood: 'Seminyak',
      matchScore: 88,
      matchReasons: ['Great vibes', 'Sunset spot'],
      priceRange: '$$$',
      tags: ['beach club', 'pool', 'cocktails'],
      walkingTimeToNext: 10,
    },
    {
      id: 'bal-5',
      name: 'Nasi Goreng at Warung Babi Guling',
      type: 'restaurant',
      description: 'Traditional Balinese roast pork and fried rice',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
      suggestedTime: '12:00',
      duration: 60,
      openingHours: '10AM-6PM',
      neighborhood: 'Ubud',
      matchScore: 90,
      matchReasons: ['Local favorite', 'Authentic taste'],
      priceRange: '$',
      tags: ['balinese', 'pork', 'local'],
    },
  ],
  'Singapore': [
    {
      id: 'sin-1',
      name: 'Gardens by the Bay',
      type: 'attraction',
      description: 'Futuristic gardens with iconic Supertrees and climate-controlled domes',
      imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80',
      suggestedTime: '17:00',
      duration: 180,
      openingHours: '5AM-2AM (outdoor)',
      neighborhood: 'Marina Bay',
      matchScore: 96,
      matchReasons: ['Must-see Singapore', 'Light show at night'],
      priceRange: '$$',
      tags: ['gardens', 'supertrees', 'futuristic'],
      walkingTimeToNext: 15,
    },
    {
      id: 'sin-2',
      name: 'Marina Bay Sands',
      type: 'attraction',
      description: 'Iconic hotel with rooftop infinity pool and observation deck',
      imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80',
      suggestedTime: '20:00',
      duration: 120,
      openingHours: '9:30AM-10PM',
      neighborhood: 'Marina Bay',
      matchScore: 93,
      matchReasons: ['Iconic building', 'Amazing views'],
      priceRange: '$$$',
      tags: ['skyline', 'views', 'landmark'],
      walkingTimeToNext: 10,
    },
    {
      id: 'sin-3',
      name: 'Hawker Centre at Maxwell Food Centre',
      type: 'restaurant',
      description: 'Famous food court with Michelin-starred chicken rice',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
      suggestedTime: '11:00',
      duration: 60,
      openingHours: '8AM-10PM',
      neighborhood: 'Chinatown',
      matchScore: 94,
      matchReasons: ['Cheap Michelin star', 'Local experience'],
      priceRange: '$',
      tags: ['hawker', 'local food', 'chicken rice'],
      walkingTimeToNext: 10,
    },
    {
      id: 'sin-4',
      name: 'Chinatown',
      type: 'activity',
      description: 'Historic district with temples, street food, and traditional shops',
      imageUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80',
      suggestedTime: '14:00',
      duration: 150,
      openingHours: '24 hours',
      neighborhood: 'Chinatown',
      matchScore: 89,
      matchReasons: ['Cultural heritage', 'Great food'],
      priceRange: '$',
      tags: ['chinatown', 'culture', 'temples'],
      walkingTimeToNext: 15,
    },
    {
      id: 'sin-5',
      name: 'Singapore Sling at Raffles Hotel',
      type: 'activity',
      description: 'Birthplace of the Singapore Sling cocktail in historic Long Bar',
      imageUrl: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=600&q=80',
      suggestedTime: '18:00',
      duration: 90,
      openingHours: '11AM-12:30AM',
      neighborhood: 'City Hall',
      matchScore: 87,
      matchReasons: ['Historic cocktail', 'Colonial elegance'],
      priceRange: '$$$',
      tags: ['cocktails', 'historic', 'bar'],
    },
  ],
  'Seoul': [
    {
      id: 'seo-1',
      name: 'Gyeongbokgung Palace',
      type: 'attraction',
      description: 'Grand royal palace from Joseon dynasty with changing of the guard',
      imageUrl: 'https://images.unsplash.com/photo-1534274867514-d5b47ef89ed7?w=600&q=80',
      suggestedTime: '09:00',
      duration: 150,
      openingHours: '9AM-6PM',
      neighborhood: 'Jongno',
      matchScore: 96,
      matchReasons: ['Must-see Seoul', 'Wear hanbok free entry'],
      priceRange: '$',
      tags: ['palace', 'history', 'hanbok'],
      walkingTimeToNext: 15,
    },
    {
      id: 'seo-2',
      name: 'Bukchon Hanok Village',
      type: 'activity',
      description: 'Traditional Korean village with 600-year-old houses',
      imageUrl: 'https://images.unsplash.com/photo-1534274867514-d5b47ef89ed7?w=600&q=80',
      suggestedTime: '11:30',
      duration: 90,
      openingHours: '10AM-5PM',
      neighborhood: 'Bukchon',
      matchScore: 92,
      matchReasons: ['Traditional Korea', 'Great for photos'],
      priceRange: '$',
      tags: ['traditional', 'hanok', 'village'],
      walkingTimeToNext: 10,
    },
    {
      id: 'seo-3',
      name: 'Korean BBQ at Maple Tree House',
      type: 'restaurant',
      description: 'Premium Korean BBQ with wagyu beef in stylish setting',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
      suggestedTime: '18:00',
      duration: 90,
      openingHours: '11:30AM-10PM',
      neighborhood: 'Itaewon',
      matchScore: 94,
      matchReasons: ['Best Korean BBQ', 'Quality meat'],
      priceRange: '$$$',
      tags: ['korean bbq', 'meat', 'dinner'],
      walkingTimeToNext: 15,
    },
    {
      id: 'seo-4',
      name: 'Myeongdong Shopping',
      type: 'activity',
      description: 'Shopping mecca for K-beauty, fashion, and street food',
      imageUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80',
      suggestedTime: '14:00',
      duration: 180,
      openingHours: '10AM-10PM',
      neighborhood: 'Myeongdong',
      matchScore: 89,
      matchReasons: ['K-beauty paradise', 'Great street food'],
      priceRange: '$$',
      tags: ['shopping', 'beauty', 'street food'],
      walkingTimeToNext: 10,
    },
    {
      id: 'seo-5',
      name: 'N Seoul Tower',
      type: 'attraction',
      description: 'Iconic tower on Namsan Mountain with panoramic city views',
      imageUrl: 'https://images.unsplash.com/photo-1534274867514-d5b47ef89ed7?w=600&q=80',
      suggestedTime: '20:00',
      duration: 90,
      openingHours: '10AM-11PM',
      neighborhood: 'Namsan',
      matchScore: 90,
      matchReasons: ['Night views', 'Love locks'],
      priceRange: '$$',
      tags: ['tower', 'views', 'night'],
    },
  ],
  'Paris': [
    {
      id: 'par-1',
      name: 'Eiffel Tower',
      type: 'attraction',
      description: 'Iconic iron lattice tower and symbol of Paris',
      imageUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce65f4?w=600&q=80',
      suggestedTime: '09:00',
      duration: 180,
      openingHours: '9AM-12:45AM',
      neighborhood: 'Champ de Mars',
      matchScore: 98,
      matchReasons: ['Must-see Paris', 'Iconic landmark'],
      priceRange: '$$',
      tags: ['tower', 'landmark', 'views'],
      walkingTimeToNext: 30,
    },
    {
      id: 'par-2',
      name: 'Louvre Museum',
      type: 'attraction',
      description: 'World\'s largest art museum with Mona Lisa and Venus de Milo',
      imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80',
      suggestedTime: '10:00',
      duration: 240,
      openingHours: '9AM-6PM',
      neighborhood: 'Louvre',
      matchScore: 96,
      matchReasons: ['World-class art', 'Historic palace'],
      priceRange: '$$',
      tags: ['museum', 'art', 'mona lisa'],
      walkingTimeToNext: 20,
    },
    {
      id: 'par-3',
      name: 'Croissant at Du Pain et des Idées',
      type: 'restaurant',
      description: 'Award-winning bakery with best croissants in Paris',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
      suggestedTime: '08:00',
      duration: 30,
      openingHours: '6:45AM-8PM',
      neighborhood: 'Canal Saint-Martin',
      matchScore: 93,
      matchReasons: ['Best croissants', 'Historic bakery'],
      priceRange: '$',
      tags: ['bakery', 'croissants', 'breakfast'],
      walkingTimeToNext: 15,
    },
    {
      id: 'par-4',
      name: 'Montmartre & Sacré-Cœur',
      type: 'activity',
      description: 'Artistic hilltop neighborhood with stunning white basilica',
      imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80',
      suggestedTime: '15:00',
      duration: 180,
      openingHours: '6AM-10:30PM',
      neighborhood: 'Montmartre',
      matchScore: 94,
      matchReasons: ['Artistic quarter', 'Panoramic views'],
      priceRange: '$',
      tags: ['basilica', 'art', 'views'],
      walkingTimeToNext: 25,
    },
    {
      id: 'par-5',
      name: 'Seine River Cruise',
      type: 'activity',
      description: 'Evening cruise past illuminated monuments',
      imageUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce65f4?w=600&q=80',
      suggestedTime: '20:00',
      duration: 75,
      openingHours: 'Multiple departures',
      neighborhood: 'Seine River',
      matchScore: 91,
      matchReasons: ['Romantic', 'See all landmarks'],
      priceRange: '$$',
      tags: ['cruise', 'river', 'night'],
    },
  ],
  'London': [
    {
      id: 'lon-1',
      name: 'British Museum',
      type: 'attraction',
      description: 'World-famous museum with Rosetta Stone and Egyptian mummies',
      imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80',
      suggestedTime: '10:00',
      duration: 180,
      openingHours: '10AM-5PM',
      neighborhood: 'Bloomsbury',
      matchScore: 95,
      matchReasons: ['Free entry', 'World treasures'],
      priceRange: '$',
      tags: ['museum', 'history', 'free'],
      walkingTimeToNext: 20,
    },
    {
      id: 'lon-2',
      name: 'Tower of London',
      type: 'attraction',
      description: 'Historic castle with Crown Jewels and 1000 years of history',
      imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80',
      suggestedTime: '09:00',
      duration: 180,
      openingHours: '9AM-5:30PM',
      neighborhood: 'Tower Hill',
      matchScore: 94,
      matchReasons: ['Crown Jewels', 'Historic site'],
      priceRange: '$$',
      tags: ['castle', 'history', 'crown jewels'],
      walkingTimeToNext: 15,
    },
    {
      id: 'lon-3',
      name: 'Fish & Chips at Poppies',
      type: 'restaurant',
      description: 'Award-winning traditional fish and chips in retro setting',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
      suggestedTime: '12:30',
      duration: 60,
      openingHours: '11AM-11PM',
      neighborhood: 'Spitalfields',
      matchScore: 91,
      matchReasons: ['Best fish & chips', 'Classic British'],
      priceRange: '$$',
      tags: ['fish and chips', 'british', 'classic'],
      walkingTimeToNext: 15,
    },
    {
      id: 'lon-4',
      name: 'Westminster & Big Ben',
      type: 'activity',
      description: 'Iconic area with Parliament, Big Ben, and Westminster Abbey',
      imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80',
      suggestedTime: '14:00',
      duration: 150,
      openingHours: '24 hours (outdoor)',
      neighborhood: 'Westminster',
      matchScore: 96,
      matchReasons: ['Iconic London', 'Must-see landmarks'],
      priceRange: '$',
      tags: ['big ben', 'parliament', 'landmark'],
      walkingTimeToNext: 20,
    },
    {
      id: 'lon-5',
      name: 'Borough Market',
      type: 'activity',
      description: 'London\'s most famous food market with gourmet treats',
      imageUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80',
      suggestedTime: '11:00',
      duration: 120,
      openingHours: '10AM-5PM',
      neighborhood: 'Southwark',
      matchScore: 90,
      matchReasons: ['Foodie paradise', 'Local favorites'],
      priceRange: '$$',
      tags: ['market', 'food', 'gourmet'],
    },
  ],
  'New York': [
    {
      id: 'nyc-1',
      name: 'Central Park',
      type: 'activity',
      description: 'Iconic 843-acre urban park in the heart of Manhattan',
      imageUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80',
      suggestedTime: '09:00',
      duration: 180,
      openingHours: '6AM-1AM',
      neighborhood: 'Central Park',
      matchScore: 95,
      matchReasons: ['Iconic NYC', 'Beautiful any season'],
      priceRange: '$',
      tags: ['park', 'nature', 'walking'],
      walkingTimeToNext: 20,
    },
    {
      id: 'nyc-2',
      name: 'Statue of Liberty',
      type: 'attraction',
      description: 'Symbol of freedom and democracy - America\'s most famous landmark',
      imageUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80',
      suggestedTime: '08:00',
      duration: 240,
      openingHours: '8:30AM-4PM',
      neighborhood: 'Liberty Island',
      matchScore: 96,
      matchReasons: ['Must-see NYC', 'Historic symbol'],
      priceRange: '$$',
      tags: ['landmark', 'statue', 'history'],
      walkingTimeToNext: 60,
    },
    {
      id: 'nyc-3',
      name: 'Pizza at Joe\'s Pizza',
      type: 'restaurant',
      description: 'Legendary NYC slice shop - the quintessential New York pizza',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
      suggestedTime: '12:00',
      duration: 30,
      openingHours: '10AM-5AM',
      neighborhood: 'Greenwich Village',
      matchScore: 93,
      matchReasons: ['Best NYC pizza', 'Cash only classic'],
      priceRange: '$',
      tags: ['pizza', 'new york', 'classic'],
      walkingTimeToNext: 10,
    },
    {
      id: 'nyc-4',
      name: 'Times Square',
      type: 'activity',
      description: 'The crossroads of the world with dazzling billboards and Broadway',
      imageUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80',
      suggestedTime: '20:00',
      duration: 90,
      openingHours: '24 hours',
      neighborhood: 'Midtown',
      matchScore: 88,
      matchReasons: ['Iconic NYC', 'Best at night'],
      priceRange: '$',
      tags: ['times square', 'nightlife', 'broadway'],
      walkingTimeToNext: 10,
    },
    {
      id: 'nyc-5',
      name: 'Metropolitan Museum of Art',
      type: 'attraction',
      description: 'One of the world\'s greatest art museums with 2 million works',
      imageUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80',
      suggestedTime: '10:00',
      duration: 240,
      openingHours: '10AM-5PM',
      neighborhood: 'Upper East Side',
      matchScore: 94,
      matchReasons: ['World-class art', 'Huge collection'],
      priceRange: '$$',
      tags: ['museum', 'art', 'culture'],
    },
  ],
  'Barcelona': [
    {
      id: 'bcn-1',
      name: 'La Sagrada Familia',
      type: 'attraction',
      description: 'Gaudí\'s unfinished masterpiece - Barcelona\'s most famous landmark',
      imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
      suggestedTime: '09:00',
      duration: 150,
      openingHours: '9AM-8PM',
      neighborhood: 'Eixample',
      matchScore: 98,
      matchReasons: ['Must-see Barcelona', 'Architectural wonder'],
      priceRange: '$$',
      tags: ['church', 'gaudi', 'architecture'],
      walkingTimeToNext: 30,
    },
    {
      id: 'bcn-2',
      name: 'Park Güell',
      type: 'attraction',
      description: 'Whimsical Gaudí park with colorful mosaics and city views',
      imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
      suggestedTime: '08:00',
      duration: 120,
      openingHours: '9:30AM-7:30PM',
      neighborhood: 'Gràcia',
      matchScore: 94,
      matchReasons: ['Gaudí masterpiece', 'Beautiful views'],
      priceRange: '$',
      tags: ['park', 'gaudi', 'mosaics'],
      walkingTimeToNext: 25,
    },
    {
      id: 'bcn-3',
      name: 'Tapas at El Xampanyet',
      type: 'restaurant',
      description: 'Classic tapas bar serving cava and traditional dishes since 1929',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
      suggestedTime: '13:00',
      duration: 90,
      openingHours: '12PM-4PM, 7PM-11PM',
      neighborhood: 'El Born',
      matchScore: 92,
      matchReasons: ['Authentic tapas', 'Local institution'],
      priceRange: '$$',
      tags: ['tapas', 'cava', 'traditional'],
      walkingTimeToNext: 10,
    },
    {
      id: 'bcn-4',
      name: 'La Boqueria Market',
      type: 'activity',
      description: 'Vibrant food market with fresh produce, seafood, and tapas',
      imageUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80',
      suggestedTime: '10:00',
      duration: 90,
      openingHours: '8AM-8:30PM',
      neighborhood: 'Las Ramblas',
      matchScore: 91,
      matchReasons: ['Famous market', 'Fresh everything'],
      priceRange: '$$',
      tags: ['market', 'food', 'fresh'],
      walkingTimeToNext: 15,
    },
    {
      id: 'bcn-5',
      name: 'Barceloneta Beach',
      type: 'activity',
      description: 'Popular city beach with great seafood restaurants nearby',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
      suggestedTime: '16:00',
      duration: 180,
      openingHours: '24 hours',
      neighborhood: 'Barceloneta',
      matchScore: 88,
      matchReasons: ['Beach in the city', 'Great for sunset'],
      priceRange: '$',
      tags: ['beach', 'seafood', 'sunset'],
    },
  ],
  'Rome': [
    {
      id: 'rom-1',
      name: 'Colosseum',
      type: 'attraction',
      description: 'Ancient Roman amphitheater and one of the New Seven Wonders',
      imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
      suggestedTime: '08:00',
      duration: 180,
      openingHours: '8:30AM-7PM',
      neighborhood: 'Colosseo',
      matchScore: 98,
      matchReasons: ['Must-see Rome', 'Ancient wonder'],
      priceRange: '$$',
      tags: ['colosseum', 'ancient', 'history'],
      walkingTimeToNext: 20,
    },
    {
      id: 'rom-2',
      name: 'Vatican Museums & Sistine Chapel',
      type: 'attraction',
      description: 'World\'s greatest art collection including Michelangelo\'s masterpiece',
      imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
      suggestedTime: '09:00',
      duration: 240,
      openingHours: '8:30AM-6PM',
      neighborhood: 'Vatican City',
      matchScore: 97,
      matchReasons: ['Sistine Chapel', 'Art treasures'],
      priceRange: '$$',
      tags: ['vatican', 'art', 'sistine chapel'],
      walkingTimeToNext: 30,
    },
    {
      id: 'rom-3',
      name: 'Pasta at Roscioli',
      type: 'restaurant',
      description: 'Famous deli-restaurant with incredible cacio e pepe',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
      suggestedTime: '13:00',
      duration: 75,
      openingHours: '12:30PM-4PM, 7PM-12AM',
      neighborhood: 'Centro Storico',
      matchScore: 94,
      matchReasons: ['Best pasta', 'Local legend'],
      priceRange: '$$$',
      tags: ['pasta', 'italian', 'gourmet'],
      walkingTimeToNext: 15,
    },
    {
      id: 'rom-4',
      name: 'Trevi Fountain',
      type: 'attraction',
      description: 'Baroque masterpiece - toss a coin to ensure your return to Rome',
      imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
      suggestedTime: '07:00',
      duration: 30,
      openingHours: '24 hours',
      neighborhood: 'Trevi',
      matchScore: 93,
      matchReasons: ['Iconic Rome', 'Best at dawn'],
      priceRange: '$',
      tags: ['fountain', 'baroque', 'landmark'],
      walkingTimeToNext: 10,
    },
    {
      id: 'rom-5',
      name: 'Gelato at Giolitti',
      type: 'restaurant',
      description: 'Rome\'s most famous gelateria since 1900',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
      suggestedTime: '15:00',
      duration: 30,
      openingHours: '7AM-1AM',
      neighborhood: 'Pantheon',
      matchScore: 91,
      matchReasons: ['Best gelato', 'Roman institution'],
      priceRange: '$',
      tags: ['gelato', 'dessert', 'italian'],
    },
  ],
  'Dubai': [
    {
      id: 'dub-1',
      name: 'Burj Khalifa',
      type: 'attraction',
      description: 'World\'s tallest building with observation deck at 555m',
      imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80',
      suggestedTime: '17:00',
      duration: 120,
      openingHours: '8:30AM-11PM',
      neighborhood: 'Downtown Dubai',
      matchScore: 97,
      matchReasons: ['World\'s tallest', 'Sunset views'],
      priceRange: '$$$',
      tags: ['skyscraper', 'views', 'landmark'],
      walkingTimeToNext: 15,
    },
    {
      id: 'dub-2',
      name: 'Dubai Mall & Fountain Show',
      type: 'activity',
      description: 'World\'s largest mall with spectacular dancing fountain show',
      imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80',
      suggestedTime: '19:00',
      duration: 180,
      openingHours: '10AM-12AM',
      neighborhood: 'Downtown Dubai',
      matchScore: 92,
      matchReasons: ['Free fountain show', 'Shopping paradise'],
      priceRange: '$$',
      tags: ['mall', 'fountain', 'shopping'],
      walkingTimeToNext: 10,
    },
    {
      id: 'dub-3',
      name: 'Old Dubai & Gold Souk',
      type: 'activity',
      description: 'Historic creek area with traditional markets and abra rides',
      imageUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80',
      suggestedTime: '10:00',
      duration: 180,
      openingHours: '10AM-10PM',
      neighborhood: 'Deira',
      matchScore: 89,
      matchReasons: ['Traditional Dubai', 'Gold shopping'],
      priceRange: '$',
      tags: ['souk', 'traditional', 'gold'],
      walkingTimeToNext: 20,
    },
    {
      id: 'dub-4',
      name: 'Desert Safari',
      type: 'activity',
      description: 'Dune bashing, camel rides, and BBQ dinner under the stars',
      imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80',
      suggestedTime: '15:00',
      duration: 360,
      openingHours: 'Afternoon departures',
      neighborhood: 'Dubai Desert',
      matchScore: 94,
      matchReasons: ['Unique experience', 'Sunset in desert'],
      priceRange: '$$$',
      tags: ['desert', 'adventure', 'sunset'],
    },
  ],
  'Amsterdam': [
    {
      id: 'ams-1',
      name: 'Anne Frank House',
      type: 'attraction',
      description: 'Moving museum in the actual hiding place of Anne Frank',
      imageUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&q=80',
      suggestedTime: '09:00',
      duration: 90,
      openingHours: '9AM-10PM',
      neighborhood: 'Jordaan',
      matchScore: 96,
      matchReasons: ['Powerful history', 'Book in advance'],
      priceRange: '$$',
      tags: ['museum', 'history', 'wwii'],
      walkingTimeToNext: 15,
    },
    {
      id: 'ams-2',
      name: 'Van Gogh Museum',
      type: 'attraction',
      description: 'World\'s largest collection of Van Gogh\'s works',
      imageUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&q=80',
      suggestedTime: '11:00',
      duration: 150,
      openingHours: '9AM-6PM',
      neighborhood: 'Museumplein',
      matchScore: 95,
      matchReasons: ['Van Gogh masterpieces', 'Must-see Amsterdam'],
      priceRange: '$$',
      tags: ['museum', 'art', 'van gogh'],
      walkingTimeToNext: 10,
    },
    {
      id: 'ams-3',
      name: 'Canal Cruise',
      type: 'activity',
      description: 'Cruise through UNESCO World Heritage canals',
      imageUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&q=80',
      suggestedTime: '14:00',
      duration: 75,
      openingHours: 'Multiple departures',
      neighborhood: 'City Center',
      matchScore: 92,
      matchReasons: ['See Amsterdam from water', 'Relaxing'],
      priceRange: '$$',
      tags: ['cruise', 'canals', 'scenic'],
      walkingTimeToNext: 15,
    },
    {
      id: 'ams-4',
      name: 'Stroopwafel at Albert Cuyp Market',
      type: 'restaurant',
      description: 'Fresh stroopwafels at Amsterdam\'s famous street market',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
      suggestedTime: '10:00',
      duration: 90,
      openingHours: '9AM-5PM',
      neighborhood: 'De Pijp',
      matchScore: 89,
      matchReasons: ['Best stroopwafels', 'Local market'],
      priceRange: '$',
      tags: ['stroopwafel', 'market', 'dutch'],
    },
  ],
};

// Generate EMPTY days (no activities) - like Wanderlog
function generateEmptyDays(allocations: CityAllocation[]): GeneratedDay[] {
  const days: GeneratedDay[] = [];
  let dayNumber = 1;

  for (const allocation of allocations) {
    for (let i = 0; i < allocation.nights; i++) {
      days.push({
        dayNumber,
        date: allocation.startDate ? addDays(allocation.startDate, i) : '',
        city: allocation.city,
        activities: [], // Empty - user will auto-fill
      });
      dayNumber++;
    }
  }

  return days;
}

// Fill a single day with activities
function fillDayWithActivities(day: GeneratedDay, dayIndex: number): GeneratedDay {
  const cityActivities = MOCK_ACTIVITIES[day.city] || MOCK_ACTIVITIES['Bangkok'] || [];

  // Create unique IDs for this day's activities
  const dayActivities = cityActivities.map((act, idx) => ({
    ...act,
    id: `${day.city.toLowerCase().replace(/\s+/g, '-')}-day${day.dayNumber}-${idx}-${Date.now()}`,
  }));

  return {
    ...day,
    theme: dayIndex === 0 ? 'Highlights Day' : dayIndex === 1 ? 'Local Discovery' : 'Relaxed Exploration',
    activities: dayActivities.slice(0, 3 + (dayIndex % 2)),
  };
}

// Fill ALL days with activities
function fillAllDays(days: GeneratedDay[]): GeneratedDay[] {
  return days.map((day, idx) => fillDayWithActivities(day, idx));
}

// Parse date string without timezone issues (YYYY-MM-DD -> local date)
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(dateStr: string, days: number): string {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Full date format like "Wednesday, February 11th"
function formatFullDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseLocalDate(dateStr);
  const day = date.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st'
    : day === 2 || day === 22 ? 'nd'
    : day === 3 || day === 23 ? 'rd'
    : 'th';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).replace(/\d+/, `${day}${suffix}`);
}

export default function AutoItineraryView({
  cities,
  tripDna,
  duration: propDuration,
  startDate: propStartDate,
  endDate: propEndDate,
  onBack,
  getCityCountry,
  onDatesChange,
  initialAllocations,
  onAllocationsChange,
  initialGeneratedDays,
  onGeneratedDaysChange,
  parentLoadComplete = false,
}: AutoItineraryViewProps) {
  // Get initial total days and start date
  // Priority: explicit props > tripDna > fallback
  // Using explicit props fixes date persistence when navigating between sections
  const initialTotalDays =
    propDuration ||
    (tripDna?.constraints as unknown as { duration?: { days?: number } })?.duration?.days ||
    tripDna?.constraints?.dates?.totalDays ||
    14;
  const initialStartDate =
    propStartDate ||
    (tripDna?.constraints as unknown as { startDate?: string })?.startDate ||
    tripDna?.constraints?.dates?.startDate ||
    new Date().toISOString().split('T')[0];

  // Editable trip dates state - managed locally, NOT synced from props
  // This allows users to freely edit dates without props overriding their changes
  const [tripStartDate, setTripStartDate] = useState(initialStartDate);
  const [tripTotalDays, setTripTotalDays] = useState(initialTotalDays);
  const [isDateEditorOpen, setIsDateEditorOpen] = useState(false);

  // Computed end date
  const tripEndDate = addDays(tripStartDate, tripTotalDays - 1);

  // Day allocation state - SIMPLE APPROACH:
  // Use initialAllocations directly if available, otherwise generate defaults
  // The key insight: initialAllocations comes from parent's savedAllocations state
  // which is populated from IndexedDB BEFORE this component renders (because parent
  // only renders us after persistenceLoaded=true)
  const [allocations, setAllocations] = useState<CityAllocation[]>(() => {
    console.log('[AutoItinerary] useState init - initialAllocations:', initialAllocations?.length, 'parentLoadComplete:', parentLoadComplete);

    // If parent has loaded and has saved allocations, use them
    if (initialAllocations && initialAllocations.length > 0) {
      const savedRouteCities = initialAllocations.filter(a => !a.city.includes('Transit')).map(a => a.city);
      const citiesMatch = cities.length === savedRouteCities.length &&
        cities.every((c, i) => c === savedRouteCities[i]);
      if (citiesMatch) {
        console.log('[AutoItinerary] Using saved allocations from parent');
        return initialAllocations;
      }
    }

    // No saved allocations or cities don't match - generate defaults
    console.log('[AutoItinerary] Generating default allocations');
    return allocateDays(cities, initialTotalDays, tripDna, initialStartDate);
  });

  // Track if we loaded from saved data (to prevent regenerating on cities change)
  const [hasLoadedFromSaved, setHasLoadedFromSaved] = useState(
    () => initialAllocations && initialAllocations.length > 0
  );

  // Generated days - initialize from persisted data if available
  const [days, setDays] = useState<GeneratedDay[]>(() =>
    initialGeneratedDays && initialGeneratedDays.length > 0 ? initialGeneratedDays : []
  );
  const [isLoading, setIsLoading] = useState(() =>
    // If we have persisted days, don't show loading
    !(initialGeneratedDays && initialGeneratedDays.length > 0)
  );
  const [hasLoadedInitialDays] = useState(() =>
    initialGeneratedDays && initialGeneratedDays.length > 0
  );
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set(cities));
  const [isDurationExpanded, setIsDurationExpanded] = useState(false); // Collapsed by default

  // View mode: 'picture' | 'compact' | 'map'
  const [viewMode, setViewMode] = useState<'picture' | 'compact' | 'map'>('picture');

  // Hotels per city
  const [selectedHotels, setSelectedHotels] = useState<Record<string, { name: string; id: string }>>({});
  const [hotelPickerCity, setHotelPickerCity] = useState<string | null>(null);

  // Activity detail drawer
  const [selectedActivity, setSelectedActivity] = useState<{ activity: GeneratedActivity; index: number } | null>(null);

  // Undo deletion state
  const [deletedActivity, setDeletedActivity] = useState<{
    activity: GeneratedActivity;
    dayNumber: number;
    index: number;
  } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Full-screen map state
  const [mapSelectedIndex, setMapSelectedIndex] = useState(0);
  const [mapSelectedDay, setMapSelectedDay] = useState(1); // Which day to show in map view

  // Reservation modal state
  const [reservationModal, setReservationModal] = useState<{
    type: 'flight' | 'lodging' | 'rental-car' | 'restaurant' | 'attachment' | 'other';
    dayNumber: number;
  } | null>(null);

  // Sidebar calendar - track which day is in view
  const [activeDayNumber, setActiveDayNumber] = useState(1);
  const dayRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll to a specific day when clicking sidebar
  const scrollToDay = useCallback((dayNumber: number) => {
    const dayEl = dayRefs.current[dayNumber];
    if (dayEl) {
      dayEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveDayNumber(dayNumber);
    }
  }, []);

  // Flatten all activities for map navigation (with city/date info)
  const allActivitiesWithMeta = useMemo(() => {
    return days.flatMap(day => day.activities.map(activity => ({ ...activity, city: day.city, date: day.date, dayNumber: day.dayNumber })));
  }, [days]);

  // Activities for the selected day in map view
  const mapDayActivities = useMemo(() => {
    return allActivitiesWithMeta.filter(a => a.dayNumber === mapSelectedDay);
  }, [allActivitiesWithMeta, mapSelectedDay]);

  // Get all activities for drawer navigation
  const allActivities = days.flatMap(d => d.activities);
  const totalActivityCount = allActivities.length;

  // Handle activity tap
  const handleActivityTap = (activity: GeneratedActivity, index: number) => {
    setSelectedActivity({ activity, index });
  };

  // Handle activity delete with undo support
  const handleActivityDelete = (activityId: string) => {
    // Find the activity and its position before deleting
    let deletedInfo: { activity: GeneratedActivity; dayNumber: number; index: number } | null = null;

    days.forEach(day => {
      const idx = day.activities.findIndex(a => a.id === activityId);
      if (idx !== -1) {
        deletedInfo = {
          activity: day.activities[idx],
          dayNumber: day.dayNumber,
          index: idx,
        };
      }
    });

    if (deletedInfo) {
      // Clear any existing undo timeout
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }

      // Store for undo
      setDeletedActivity(deletedInfo);

      // Remove from days
      setDays(prev => prev.map(day => ({
        ...day,
        activities: day.activities.filter(a => a.id !== activityId),
      })));

      // Auto-clear undo option after 5 seconds
      undoTimeoutRef.current = setTimeout(() => {
        setDeletedActivity(null);
      }, 5000);
    }
  };

  // Undo activity deletion
  const handleUndoDelete = () => {
    if (!deletedActivity) return;

    // Clear timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    // Restore activity to its original position
    setDays(prev => prev.map(day => {
      if (day.dayNumber !== deletedActivity.dayNumber) return day;
      const newActivities = [...day.activities];
      newActivities.splice(deletedActivity.index, 0, deletedActivity.activity);
      return { ...day, activities: newActivities };
    }));

    setDeletedActivity(null);
  };

  // Handle activity time update
  const handleActivityTimeUpdate = (activityId: string, newTime: string) => {
    setDays(prev => prev.map(day => ({
      ...day,
      activities: day.activities.map(a =>
        a.id === activityId ? { ...a, suggestedTime: newTime } : a
      ),
    })));
  };

  // Handle activity cost update
  const handleActivityCostUpdate = (activityId: string, cost: number | undefined) => {
    setDays(prev => prev.map(day => ({
      ...day,
      activities: day.activities.map(a =>
        a.id === activityId ? { ...a, userCost: cost } : a
      ),
    })));
  };

  // Handle activity attachment add
  const handleActivityAttachmentAdd = (activityId: string, attachment: { type: 'ticket' | 'reservation' | 'link' | 'document'; name: string; url?: string }) => {
    setDays(prev => prev.map(day => ({
      ...day,
      activities: day.activities.map(a =>
        a.id === activityId ? { ...a, attachments: [...(a.attachments || []), attachment] } : a
      ),
    })));
  };

  // Handle opening reservation modal
  const handleAddReservation = (dayNumber: number, type: 'flight' | 'lodging' | 'rental-car' | 'restaurant' | 'attachment' | 'other') => {
    setReservationModal({ type, dayNumber });
  };

  // Handle adding a reservation/transport to a day
  const handleSaveReservation = (data: {
    name: string;
    type: 'flight' | 'train' | 'bus' | 'drive' | 'transit' | 'restaurant' | 'cafe' | 'activity' | 'attraction' | 'nightlife';
    description?: string;
    suggestedTime?: string;
    duration?: number;
    transportDetails?: {
      from: string;
      to: string;
      departureTime?: string;
      arrivalTime?: string;
      operator?: string;
      bookingRef?: string;
    };
    userCost?: number;
  }) => {
    if (!reservationModal) return;

    const newActivity: GeneratedActivity = {
      id: `res-${Date.now()}`,
      name: data.name,
      type: data.type,
      description: data.description,
      suggestedTime: data.suggestedTime,
      duration: data.duration,
      transportDetails: data.transportDetails,
      userCost: data.userCost,
    };

    setDays(prev => prev.map(day => {
      if (day.dayNumber !== reservationModal.dayNumber) return day;
      return {
        ...day,
        activities: [...day.activities, newActivity],
      };
    }));

    setReservationModal(null);
  };

  // Handle activity reorder within a day
  const handleActivityReorder = (dayNumber: number, fromIndex: number, toIndex: number) => {
    setDays(prev => prev.map(day => {
      if (day.dayNumber !== dayNumber) return day;
      const newActivities = [...day.activities];
      const [moved] = newActivities.splice(fromIndex, 1);
      newActivities.splice(toIndex, 0, moved);
      // Recalculate times based on new order
      const recalculatedActivities = newActivities.map((a, idx) => ({
        ...a,
        suggestedTime: `${9 + idx * 2}:00`, // Simple recalculation: 9am, 11am, 1pm, etc.
      }));
      return { ...day, activities: recalculatedActivities };
    }));
  };

  // Navigate drawer
  const navigateDrawer = (direction: 'prev' | 'next') => {
    if (!selectedActivity) return;
    const currentIdx = allActivities.findIndex(a => a.id === selectedActivity.activity.id);
    const newIdx = direction === 'prev' ? currentIdx - 1 : currentIdx + 1;
    if (newIdx >= 0 && newIdx < allActivities.length) {
      setSelectedActivity({ activity: allActivities[newIdx], index: newIdx + 1 });
    }
  };

  // Only recalculate allocations when CITIES actually change (not on mount)
  // Guard: If we started with saved allocations, don't regenerate unless cities change
  const [prevCities, setPrevCities] = useState(cities.join(','));
  useEffect(() => {
    const currentCitiesKey = cities.join(',');
    // Only regenerate if cities actually changed (not on initial mount)
    if (currentCitiesKey !== prevCities) {
      console.log('[AutoItinerary] Cities CHANGED, regenerating allocations');
      setPrevCities(currentCitiesKey);
      setAllocations(allocateDays(cities, tripTotalDays, tripDna, tripStartDate));
      setHasLoadedFromSaved(false); // User changed cities, no longer using saved
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities.join(',')]); // Only cities

  // When trip start date changes, recalculate dates within existing allocations (preserve night counts)
  useEffect(() => {
    setAllocations(prev => {
      let currentDay = 1;
      return prev.map(a => {
        const startDay = currentDay;
        const endDay = currentDay + a.nights - 1;
        currentDay = endDay + 1;

        const start = parseLocalDate(tripStartDate);
        start.setDate(start.getDate() + startDay - 1);
        const end = parseLocalDate(tripStartDate);
        end.setDate(end.getDate() + endDay - 1);

        const formatLocalDate = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        return {
          ...a,
          startDay,
          endDay,
          startDate: formatLocalDate(start),
          endDate: formatLocalDate(end),
        };
      });
    });
  }, [tripStartDate]); // Only when start date changes

  // Handle trip date changes
  const handleDateChange = (newStartDate: string, newEndDate: string) => {
    const start = parseLocalDate(newStartDate);
    const end = parseLocalDate(newEndDate);
    const newTotalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (newTotalDays > 0) {
      setTripStartDate(newStartDate);
      setTripTotalDays(newTotalDays);
      // Sync back to parent
      onDatesChange?.(newStartDate, newTotalDays);
      // Allocations will auto-update via useEffect
    }
    setIsDateEditorOpen(false);
  };

  // Generate EMPTY itinerary on mount or when allocations change
  // BUT don't overwrite if we already have loaded days with activities
  useEffect(() => {
    // If we already loaded persisted days, don't regenerate empty ones
    if (hasLoadedInitialDays) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    // Generate empty days immediately (no API call needed)
    const timer = setTimeout(() => {
      setDays(generateEmptyDays(allocations));
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [allocations, hasLoadedInitialDays]);

  // Sync allocations back to parent whenever they change
  // BUT only after parent has finished loading from IndexedDB (to prevent overwriting saved data with defaults)
  useEffect(() => {
    // CRITICAL: Don't sync until parent has finished loading from IndexedDB
    // Otherwise we'll overwrite saved allocations with freshly-generated defaults
    if (!parentLoadComplete) {
      console.log('[AutoItinerary] Parent not loaded yet, NOT syncing');
      return;
    }
    // Don't sync empty allocations - this would overwrite saved data
    if (allocations.length === 0) {
      console.log('[AutoItinerary] Allocations empty, NOT syncing');
      return;
    }
    console.log('[AutoItinerary] Syncing allocations to parent:', allocations.map(a => `${a.city}:${a.nights}`));
    onAllocationsChange?.(allocations);
  }, [allocations, onAllocationsChange, parentLoadComplete]);

  // Sync generated days to parent for persistence
  useEffect(() => {
    if (!parentLoadComplete) {
      return;
    }
    // Don't sync empty days - would overwrite saved data
    if (days.length === 0) {
      return;
    }
    // Only sync if we have activities (not just empty day shells)
    const hasActivities = days.some(d => d.activities.length > 0);
    if (!hasActivities) {
      return;
    }
    console.log('[AutoItinerary] Syncing days to parent:', days.length, 'days');
    onGeneratedDaysChange?.(days);
  }, [days, onGeneratedDaysChange, parentLoadComplete]);

  // AI-powered auto-fill for a single city's days (with fallback to mock data)
  const autoFillCityDays = async (city: string, nights: number) => {
    console.log(`[AutoFill API] Requesting ${nights} days for ${city}`);
    try {
      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city,
          nights,
          country: getCityCountry?.(city),
          tripStyle: tripDna?.vibeAndPace?.tripPace || 'balanced',
          interests: tripDna?.travelerProfile?.travelIdentities || [],
          budget: tripDna?.constraints?.budget?.dailySpend?.max
            ? (tripDna.constraints.budget.dailySpend.max < 100 ? 'budget' : tripDna.constraints.budget.dailySpend.max > 300 ? 'luxury' : 'moderate')
            : 'moderate',
        }),
      });

      if (!response.ok) {
        console.error(`[AutoFill API] Request failed with status ${response.status}`);
        throw new Error('Failed to generate itinerary');
      }

      const data = await response.json();
      console.log(`[AutoFill API] Got ${data.days?.length || 0} days for ${city}:`,
        data.days?.map((d: { dayNumber: number; theme?: string; activities: { name: string }[] }) =>
          `Day ${d.dayNumber}: ${d.theme || 'no theme'} (${d.activities.length} activities: ${d.activities.map(a => a.name).slice(0, 2).join(', ')}...)`
        )
      );

      if (data.days && data.days.length > 0) {
        // Verify we got different days - check if activities are actually different
        if (data.days.length > 1) {
          const day1Names = data.days[0].activities.map((a: { name: string }) => a.name).sort().join(',');
          const day2Names = data.days[1].activities.map((a: { name: string }) => a.name).sort().join(',');
          if (day1Names === day2Names) {
            console.warn(`[AutoFill API] WARNING: Day 1 and Day 2 have identical activities!`);
          }
        }
        return data.days;
      }
      throw new Error('No days returned');
    } catch (error) {
      console.error('[AutoFill API] AI itinerary failed, using mock data for', city, error);
      // Fallback to mock data
      return generateMockDaysForCity(city, nights);
    }
  };

  // Generate mock days as fallback when API fails
  // FIX: Distribute activities across days instead of giving same activities to each day
  const generateMockDaysForCity = (city: string, nights: number) => {
    const cityActivities = MOCK_ACTIVITIES[city] || MOCK_ACTIVITIES['Bangkok'] || [];
    const days = [];
    const activitiesPerDay = 3;

    console.log(`[Mock Data] Generating ${nights} days for ${city} with ${cityActivities.length} total activities`);

    for (let i = 0; i < nights; i++) {
      // Calculate which activities to use for this day
      // Rotate through activities so each day gets different ones
      const startIdx = (i * activitiesPerDay) % cityActivities.length;
      const dayActivities: GeneratedActivity[] = [];

      for (let j = 0; j < activitiesPerDay; j++) {
        const actIdx = (startIdx + j) % cityActivities.length;
        const act = cityActivities[actIdx];
        dayActivities.push({
          ...act,
          id: `${city.toLowerCase().replace(/\s+/g, '-')}-day${i + 1}-${j}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        });
      }

      days.push({
        dayNumber: i + 1,
        theme: i === 0 ? 'Highlights Day' : i === 1 ? 'Local Discovery' : 'Relaxed Exploration',
        activities: dayActivities,
      });

      console.log(`[Mock Data] Day ${i + 1}: ${dayActivities.map(a => a.name).join(', ')}`);
    }

    return days;
  };

  // Auto-fill a single day (uses cached city data or generates new)
  const [cityItineraryCache, setCityItineraryCache] = useState<Record<string, { dayNumber: number; theme?: string; activities: GeneratedActivity[] }[]>>({});
  const [loadingDayNumber, setLoadingDayNumber] = useState<number | null>(null); // Track which day is loading (don't use global isLoading)

  const autoFillDay = async (dayNumber: number) => {
    const targetDay = days.find(d => d.dayNumber === dayNumber);
    if (!targetDay || targetDay.city.includes('Transit')) return;

    // Use day-specific loading state instead of global isLoading
    // This prevents the page from scrolling to top
    setLoadingDayNumber(dayNumber);

    // Count how many days of this city ALREADY have activities (have been filled)
    // This ensures each auto-fill gets a DIFFERENT day's activities
    const filledDaysCount = days.filter(d =>
      d.city === targetDay.city &&
      d.activities.length > 0 &&
      d.dayNumber !== dayNumber // Don't count the day we're about to fill
    ).length;

    console.log(`[AutoFill] Day ${dayNumber} of ${targetDay.city}, filledDaysCount=${filledDaysCount}, cacheExists=${!!cityItineraryCache[targetDay.city]}`);

    // Check if we have cached data for this city
    if (cityItineraryCache[targetDay.city]) {
      const cityDays = cityItineraryCache[targetDay.city];
      console.log(`[AutoFill] Using cache: ${cityDays.length} days available, picking index ${filledDaysCount % cityDays.length}`);
      // Use filledDaysCount to pick the NEXT unused day from cache
      const aiDay = cityDays[filledDaysCount % cityDays.length];

      if (aiDay) {
        setDays(prev => prev.map(day => {
          if (day.dayNumber === dayNumber) {
            return {
              ...day,
              theme: aiDay.theme,
              activities: aiDay.activities.map((act, idx) => ({
                ...act,
                id: `${day.city.toLowerCase().replace(/\s+/g, '-')}-day${day.dayNumber}-${idx}-${Date.now()}`,
              })),
            };
          }
          return day;
        }));
      }
      setLoadingDayNumber(null);
      return;
    }

    // Generate new itinerary for this city
    const cityNights = allocations.find(a => a.city === targetDay.city)?.nights || 3;
    const aiDays = await autoFillCityDays(targetDay.city, cityNights);

    if (aiDays) {
      setCityItineraryCache(prev => ({ ...prev, [targetDay.city]: aiDays }));

      // Use filledDaysCount to pick the right day
      const aiDay = aiDays[filledDaysCount % aiDays.length];

      setDays(prev => prev.map(day => {
        if (day.dayNumber === dayNumber) {
          return {
            ...day,
            theme: aiDay?.theme,
            activities: (aiDay?.activities || []).map((act: GeneratedActivity, idx: number) => ({
              ...act,
              id: `${day.city.toLowerCase().replace(/\s+/g, '-')}-day${day.dayNumber}-${idx}-${Date.now()}`,
            })),
          };
        }
        return day;
      }));
    }
    setLoadingDayNumber(null);
  };

  // Auto-fill entire trip with AI-generated itineraries
  const autoFillEntireTrip = async () => {
    setIsLoading(true);

    // Group days by city to generate itineraries efficiently
    const cityNightsMap: Record<string, number> = {};
    allocations.forEach(alloc => {
      if (!alloc.city.includes('Transit')) {
        // Handle duplicate cities by summing nights
        cityNightsMap[alloc.city] = (cityNightsMap[alloc.city] || 0) + alloc.nights;
      }
    });

    // Generate itineraries for each unique city
    const cityItineraries: Record<string, { dayNumber: number; theme?: string; activities: GeneratedActivity[] }[]> = {};

    for (const [city, nights] of Object.entries(cityNightsMap)) {
      const aiDays = await autoFillCityDays(city, nights);
      if (aiDays) {
        cityItineraries[city] = aiDays;
      }
    }

    // Update cache
    setCityItineraryCache(prev => ({ ...prev, ...cityItineraries }));

    // Map AI-generated days to our trip days
    const cityDayCounters: Record<string, number> = {};

    setDays(prev => prev.map((day, dayIndex) => {
      // Handle transit days - auto-add flight activity
      if (day.city.includes('Transit')) {
        // Find previous and next non-transit cities
        let fromCity = '';
        let toCity = '';

        // Look backward for the origin city
        for (let i = dayIndex - 1; i >= 0; i--) {
          if (!prev[i].city.includes('Transit')) {
            fromCity = prev[i].city;
            break;
          }
        }

        // Look forward for the destination city
        for (let i = dayIndex + 1; i < prev.length; i++) {
          if (!prev[i].city.includes('Transit')) {
            toCity = prev[i].city;
            break;
          }
        }

        // If we couldn't find cities, use placeholders
        if (!fromCity) fromCity = 'Origin';
        if (!toCity) toCity = 'Destination';

        // Create flight activity for transit day
        const flightActivity: GeneratedActivity = {
          id: `flight-${day.dayNumber}-${Date.now()}`,
          name: `Flight: ${fromCity} → ${toCity}`,
          type: 'flight',
          description: `Travel from ${fromCity} to ${toCity}`,
          suggestedTime: '10:00',
          duration: 180,
          neighborhood: 'Airport',
          priceRange: '$$',
          tags: ['flight', 'transit'],
          transportDetails: {
            from: fromCity,
            to: toCity,
          },
        };

        return {
          ...day,
          theme: `Travel to ${toCity}`,
          activities: [flightActivity],
        };
      }

      // Track which day of the city this is
      cityDayCounters[day.city] = (cityDayCounters[day.city] || 0);
      const cityDayIndex = cityDayCounters[day.city];
      cityDayCounters[day.city]++;

      const cityDays = cityItineraries[day.city];
      if (!cityDays || cityDays.length === 0) {
        return day; // No AI data, keep empty
      }

      // Get the appropriate day from AI (cycle if more days than AI generated)
      const aiDay = cityDays[cityDayIndex % cityDays.length];

      return {
        ...day,
        theme: aiDay.theme,
        activities: aiDay.activities.map((act, idx) => ({
          ...act,
          id: `${day.city.toLowerCase().replace(/\s+/g, '-')}-day${day.dayNumber}-${idx}-${Date.now()}`,
        })),
      };
    }));

    setIsLoading(false);
  };

  // Adjust allocation for a city - NO auto-balancing, user controls each city independently
  // Set allocation to a specific number of nights (by index to support duplicate cities)
  const setAllocationNights = (allocIndex: number, nights: number) => {
    const newNights = Math.max(1, Math.min(99, nights)); // Clamp between 1 and 99
    const currentNights = allocations[allocIndex]?.nights || 0;
    adjustAllocation(allocIndex, newNights - currentNights);
  };

  const adjustAllocation = (allocIndex: number, delta: number) => {
    setAllocations(prev => {
      if (allocIndex < 0 || allocIndex >= prev.length) return prev;

      const currentCity = prev[allocIndex];
      const newNights = Math.max(1, currentCity.nights + delta);

      // If no actual change, return as-is
      if (newNights === currentCity.nights) return prev;

      // Just update this city's nights - no balancing with other cities
      const newAllocations = prev.map((a, idx) => {
        if (idx === allocIndex) {
          return { ...a, nights: newNights };
        }
        return a;
      });

      // Recalculate start/end dates for all cities (they cascade from first city)
      let currentDay = 1;
      return newAllocations.map(a => {
        const startDay = currentDay;
        const endDay = currentDay + a.nights - 1;
        currentDay = endDay + 1;

        // Use parseLocalDate to avoid timezone issues
        const start = parseLocalDate(tripStartDate);
        start.setDate(start.getDate() + startDay - 1);
        const end = parseLocalDate(tripStartDate);
        end.setDate(end.getDate() + endDay - 1);

        const formatLocalDate = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        return {
          ...a,
          startDay,
          endDay,
          startDate: formatLocalDate(start),
          endDate: formatLocalDate(end),
        };
      });
    });
  };

  // Calculate current total
  const currentTotal = allocations.reduce((sum, a) => sum + a.nights, 0);

  // Toggle city expansion
  const toggleCity = (city: string) => {
    setExpandedCities(prev => {
      const next = new Set(prev);
      if (next.has(city)) {
        next.delete(city);
      } else {
        next.add(city);
      }
      return next;
    });
  };

  // Get days for a city
  const getDaysForCity = (city: string) => days.filter(d => d.city === city);

  // Get color for city index
  const getCityColor = (index: number) => DAY_COLORS[index % DAY_COLORS.length];

  // Get recommended nights for a city
  const getRecommendedNights = (city: string) => RECOMMENDED_NIGHTS[city] || DEFAULT_NIGHTS;

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Itinerary</h2>
          </div>
          <button
            onClick={() => setIsDateEditorOpen(!isDateEditorOpen)}
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            {formatDate(tripStartDate)} - {formatDate(tripEndDate)}
            <ChevronDown className={`w-3 h-3 transition-transform ${isDateEditorOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

      {/* Date Editor */}
      {isDateEditorOpen && (
        <div className="bg-card border rounded-xl p-4 space-y-4">
          <h3 className="font-semibold text-sm">Edit Travel Dates</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
              <input
                type="date"
                value={tripStartDate}
                onChange={(e) => {
                  const newStart = e.target.value;
                  // Keep same duration, just shift dates
                  setTripStartDate(newStart);
                  onDatesChange?.(newStart, tripTotalDays);
                }}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
              <input
                type="date"
                value={tripEndDate}
                onChange={(e) => handleDateChange(tripStartDate, e.target.value)}
                min={tripStartDate}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">Total: {tripTotalDays} days</span>
            <Button size="sm" onClick={() => setIsDateEditorOpen(false)}>Done</Button>
          </div>
        </div>
      )}

      {/* Day Allocation Summary - Collapsible (moved to top under dates) */}
      <div className="bg-muted/30 rounded-xl overflow-hidden">
        <button
          onClick={() => setIsDurationExpanded(!isDurationExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Hotel className="w-4 h-4" />
            Nights per City
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant={currentTotal === tripTotalDays ? 'default' : currentTotal > tripTotalDays ? 'destructive' : 'secondary'}>
              {currentTotal} / {tripTotalDays} nights
            </Badge>
            {isDurationExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {/* Guidance message when nights don't match trip duration - fixed height to prevent layout bounce */}
        <div className={`mx-4 mb-3 px-3 py-2 rounded-lg text-sm min-h-[40px] flex items-center transition-all duration-200 ${
          currentTotal === tripTotalDays
            ? 'bg-green-50 text-green-700 border border-green-200'
            : currentTotal > tripTotalDays
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {currentTotal === tripTotalDays
            ? '✓ All nights allocated!'
            : currentTotal > tripTotalDays
              ? `⚠️ ${currentTotal - tripTotalDays} nights over — remove nights or extend trip dates`
              : `📝 ${tripTotalDays - currentTotal} nights remaining to allocate`
          }
        </div>

        {/* City allocations - only show when expanded */}
        {isDurationExpanded && (
          <div className="px-4 pb-4 space-y-2">
            {allocations.map((alloc, allocIndex) => {
              const recommended = getRecommendedNights(alloc.city);
              const isTransit = alloc.city.includes('Transit');
              return (
                <div key={`${alloc.city}-${allocIndex}`} className={`flex items-center gap-3 p-2 rounded-lg ${isTransit ? 'bg-blue-50 border border-blue-200' : 'bg-muted/50'}`}>
                  <div className={`w-2 h-8 rounded-full ${isTransit ? 'bg-blue-400' : 'bg-primary/60'}`} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {alloc.city}
                      {!isTransit && (
                        <span className="text-xs text-muted-foreground font-normal ml-1">
                          ({recommended} nights rec&apos;d)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(alloc.startDate || '')} - {formatDate(alloc.endDate || '')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isTransit ? (
                      /* Delete button for transit days */
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAllocations(prev => {
                            const newAllocations = prev.filter((_, idx) => idx !== allocIndex);
                            // Recalculate dates
                            let currentDay = 1;
                            return newAllocations.map(a => {
                              const startDay = currentDay;
                              const endDay = currentDay + a.nights - 1;
                              currentDay = endDay + 1;
                              const start = parseLocalDate(tripStartDate);
                              start.setDate(start.getDate() + startDay - 1);
                              const end = parseLocalDate(tripStartDate);
                              end.setDate(end.getDate() + endDay - 1);
                              const formatLocalDate = (d: Date) =>
                                `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                              return { ...a, startDay, endDay, startDate: formatLocalDate(start), endDate: formatLocalDate(end) };
                            });
                          });
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => { e.stopPropagation(); adjustAllocation(allocIndex, -1); }}
                          disabled={alloc.nights <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={alloc.nights}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) setAllocationNights(allocIndex, val);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-10 text-center font-semibold text-sm bg-transparent border border-transparent hover:border-muted-foreground/30 focus:border-primary focus:outline-none rounded px-1 py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => { e.stopPropagation(); adjustAllocation(allocIndex, 1); }}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add Transit Day button */}
            <button
              onClick={() => {
                // Add a transit day at the beginning
                const transitAllocation: CityAllocation = {
                  city: '✈️ In Transit',
                  nights: 1,
                  startDay: 1,
                  endDay: 1,
                  startDate: tripStartDate,
                  endDate: tripStartDate,
                };
                setAllocations(prev => {
                  const newAllocations = [transitAllocation, ...prev];
                  // Recalculate dates for all allocations
                  let currentDay = 1;
                  return newAllocations.map(a => {
                    const startDay = currentDay;
                    const endDay = currentDay + a.nights - 1;
                    currentDay = endDay + 1;
                    const start = parseLocalDate(tripStartDate);
                    start.setDate(start.getDate() + startDay - 1);
                    const end = parseLocalDate(tripStartDate);
                    end.setDate(end.getDate() + endDay - 1);
                    const formatLocalDate = (d: Date) =>
                      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    return { ...a, startDay, endDay, startDate: formatLocalDate(start), endDate: formatLocalDate(end) };
                  });
                });
              }}
              className="w-full py-2 px-3 border-2 border-dashed border-muted-foreground/30 rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
            >
              <Plane className="w-4 h-4" />
              Add Transit Day at Start
            </button>
          </div>
        )}
      </div>

      {/* Auto-fill entire trip button */}
      <Button
        variant="default"
        className="w-full bg-primary hover:bg-primary/90"
        onClick={autoFillEntireTrip}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Auto-fill entire trip
      </Button>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Researching the best activities with AI...</p>
          <p className="text-xs text-muted-foreground/70">Finding real places, restaurants, and experiences</p>
        </div>
      )}

      {/* Map View - Side Drawer (slides in from right like Wanderlog) */}
      {!isLoading && viewMode === 'map' && allActivitiesWithMeta.length > 0 && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setViewMode('picture')}
          />

          {/* Side Drawer */}
          <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[85vw] lg:w-[80vw] max-w-6xl bg-white flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
            {/* Header with Exit button */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-white">
              <button
                onClick={() => setViewMode('picture')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-100 rounded-full border shadow-sm transition-colors"
              >
                <X className="w-4 h-4" />
                <span className="text-sm font-medium">Exit map</span>
              </button>
              <div className="flex items-center gap-3">
                <Map className="w-5 h-5 text-primary" />
                {(() => {
                  const selectedDay = days.find(d => d.dayNumber === mapSelectedDay);
                  if (selectedDay) {
                    const [y, m, d] = selectedDay.date.split('-').map(Number);
                    const dateObj = new Date(y, m - 1, d);
                    const formatted = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    return <span className="font-semibold">{formatted} - {selectedDay.city}</span>;
                  }
                  return <span className="font-semibold">Map View</span>;
                })()}
              </div>
              <div className="w-24" /> {/* Spacer for centering */}
            </div>

            {/* Day tabs - scrollable horizontal */}
            <div className="flex-shrink-0 border-b px-3 py-2 bg-gray-50">
              <div className="overflow-x-auto">
                <div className="flex gap-1.5" style={{ minWidth: 'max-content' }}>
                  {days.map((day) => {
                    const cityIdx = allocations.findIndex(a => a.city === day.city);
                    const color = getCityColor(cityIdx >= 0 ? cityIdx : 0);
                    const isSelected = mapSelectedDay === day.dayNumber;
                    const activityCount = day.activities.length;

                    // Format date as "Mon 15"
                    const [y, m, d] = day.date.split('-').map(Number);
                    const dateObj = new Date(y, m - 1, d);
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                    const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    return (
                      <button
                        key={day.dayNumber}
                        onClick={() => {
                          setMapSelectedDay(day.dayNumber);
                          setMapSelectedIndex(0);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                          isSelected
                            ? `${color.bg} text-white shadow-sm`
                            : 'bg-white text-gray-600 hover:bg-gray-100 border'
                        }`}
                      >
                        {dayName} {monthDay.split(' ')[1]}
                        {activityCount > 0 && (
                          <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                            isSelected ? 'bg-white/20' : 'bg-gray-100'
                          }`}>
                            {activityCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Main content - map and activity list side by side on larger screens */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
              {/* Map */}
              <div className="flex-1 relative min-h-[200px] md:min-h-0">
                <ActivityMap
                  days={days.filter(d => d.dayNumber === mapSelectedDay)}
                  selectedActivityId={mapDayActivities[mapSelectedIndex]?.id}
                  onActivitySelect={(activity) => {
                    const idx = mapDayActivities.findIndex(a => a.id === activity.id);
                    if (idx >= 0) setMapSelectedIndex(idx);
                  }}
                />
              </div>

              {/* Activity sidebar - scrollable list of all activities */}
              <div className="md:w-80 lg:w-96 flex-shrink-0 border-t md:border-t-0 md:border-l bg-white flex flex-col">
                {mapDayActivities.length > 0 ? (
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-3 border-b bg-gray-50">
                      <span className="text-sm font-medium text-gray-600">
                        {mapDayActivities.length} {mapDayActivities.length === 1 ? 'place' : 'places'}
                      </span>
                    </div>
                    <div className="divide-y">
                      {mapDayActivities.map((activity, idx) => (
                        <button
                          key={activity.id}
                          onClick={() => setMapSelectedIndex(idx)}
                          className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                            mapSelectedIndex === idx ? 'bg-primary/5 border-l-2 border-primary' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                                mapSelectedIndex === idx ? 'bg-primary' : 'bg-gray-400'
                              }`}
                            >
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm truncate">{activity.name}</h4>
                              <p className="text-gray-500 text-xs truncate">
                                {activity.neighborhood || activity.type}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                {activity.openingHours && (
                                  <span className="flex items-center gap-0.5">
                                    <Clock className="w-3 h-3" />
                                    {activity.openingHours}
                                  </span>
                                )}
                                {activity.rating && (
                                  <span className="flex items-center gap-0.5">
                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                    {activity.rating.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {activity.imageUrl && (
                              <img
                                src={activity.imageUrl}
                                alt=""
                                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                              />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                    <MapPin className="w-10 h-10 text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">No activities for this day</p>
                    <p className="text-gray-400 text-xs mt-1">Add activities to see them on the map</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty state for map view - side drawer */}
      {!isLoading && viewMode === 'map' && allActivitiesWithMeta.length === 0 && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setViewMode('picture')}
          />

          {/* Side Drawer */}
          <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[85vw] lg:w-[80vw] max-w-6xl bg-white flex flex-col items-center justify-center animate-in slide-in-from-right duration-300 shadow-2xl">
            {/* Exit button */}
            <button
              onClick={() => setViewMode('picture')}
              className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-100 rounded-full border shadow-sm transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="text-sm font-medium">Exit map</span>
            </button>

            <Map className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg font-medium">No activities to show on map</p>
            <p className="text-gray-400 mt-1">Auto-fill your trip to see activities</p>
          </div>
        </>
      )}

      {/* Days - chronological like Wanderlog (Picture & Compact views) */}
      {!isLoading && viewMode !== 'map' && days.map((day) => {
        const cityIdx = allocations.findIndex(a => a.city === day.city);
        const color = getCityColor(cityIdx >= 0 ? cityIdx : 0);

        return (
          <DayCard
            key={day.dayNumber}
            day={day}
            color={color}
            viewMode={viewMode}
            onActivityTap={handleActivityTap}
            onActivityDelete={handleActivityDelete}
            onActivityTimeUpdate={handleActivityTimeUpdate}
            onActivityCostUpdate={handleActivityCostUpdate}
            onActivityAttachmentAdd={handleActivityAttachmentAdd}
            onActivityReorder={(fromIdx, toIdx) => handleActivityReorder(day.dayNumber, fromIdx, toIdx)}
            onAutoFill={() => autoFillDay(day.dayNumber)}
            onAddReservation={(type) => handleAddReservation(day.dayNumber, type)}
            isLoadingDay={loadingDayNumber === day.dayNumber}
          />
        );
      })}

      {/* Hotel Picker Modal */}
      {hotelPickerCity && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-background rounded-t-2xl w-full max-h-[80vh] overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Hotels in {hotelPickerCity}</h3>
              <Button variant="ghost" size="sm" onClick={() => setHotelPickerCity(null)}>
                Close
              </Button>
            </div>
            <HotelPicker
              city={hotelPickerCity}
              country={getCityCountry?.(hotelPickerCity)}
              onSelectHotel={(hotel) => {
                setSelectedHotels(prev => ({
                  ...prev,
                  [hotelPickerCity!]: { name: hotel.name, id: hotel.id },
                }));
                setHotelPickerCity(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Activity Detail Drawer */}
      <ActivityDetailDrawer
        activity={selectedActivity?.activity ?? null}
        index={selectedActivity?.index ?? 0}
        totalCount={totalActivityCount}
        onClose={() => setSelectedActivity(null)}
        onPrev={() => navigateDrawer('prev')}
        onNext={() => navigateDrawer('next')}
      />

      {/* Add Reservation Modal */}
      {reservationModal && (
        <AddReservationModal
          type={reservationModal.type}
          dayNumber={reservationModal.dayNumber}
          onClose={() => setReservationModal(null)}
          onSave={handleSaveReservation}
        />
      )}

      {/* Undo Delete Toast */}
      {deletedActivity && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center gap-3 bg-gray-900 text-white rounded-full px-4 py-2.5 shadow-lg">
            <Trash2 className="w-4 h-4 text-gray-400" />
            <span className="text-sm">
              &quot;{deletedActivity.activity.name}&quot; deleted
            </span>
            <button
              onClick={handleUndoDelete}
              className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
            >
              Undo
            </button>
            <button
              onClick={() => setDeletedActivity(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating View Mode Toggle - Wanderlog style (always visible so user can navigate back) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center gap-1 bg-gray-900 rounded-full px-1 py-1 shadow-lg">
          <button
            onClick={() => setViewMode('picture')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              viewMode === 'picture' ? 'bg-white text-gray-900' : 'text-white/80 hover:text-white'
            }`}
          >
            <Image className="w-4 h-4" />
            Picture
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              viewMode === 'compact' ? 'bg-white text-gray-900' : 'text-white/80 hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
            Compact
          </button>
          <button
            onClick={() => {
              setMapSelectedDay(activeDayNumber); // Open to current day being viewed
              setMapSelectedIndex(0);
              setViewMode('map');
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              viewMode === 'map' ? 'bg-white text-gray-900' : 'text-white/80 hover:text-white'
            }`}
          >
            <Map className="w-4 h-4" />
            Map
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ DAY CARD COMPONENT ============

type ReservationType = 'flight' | 'lodging' | 'rental-car' | 'restaurant' | 'attachment' | 'other';

interface DayCardProps {
  day: GeneratedDay;
  color: typeof DAY_COLORS[0];
  viewMode: 'picture' | 'compact';
  onActivityTap: (activity: GeneratedActivity, index: number) => void;
  onActivityDelete: (activityId: string) => void;
  onActivityTimeUpdate: (activityId: string, newTime: string) => void;
  onActivityCostUpdate: (activityId: string, cost: number | undefined) => void;
  onActivityAttachmentAdd: (activityId: string, attachment: { type: 'ticket' | 'reservation' | 'link' | 'document'; name: string; url?: string }) => void;
  onActivityReorder: (fromIndex: number, toIndex: number) => void;
  onAutoFill: () => void;
  onAddReservation: (type: ReservationType) => void;
  isLoadingDay?: boolean; // True when this specific day is being auto-filled
  dayRef?: (el: HTMLDivElement | null) => void; // Ref callback for scroll-to-day
}

function DayCard({ day, color, viewMode, onActivityTap, onActivityDelete, onActivityTimeUpdate, onActivityCostUpdate, onActivityAttachmentAdd, onActivityReorder, onAutoFill, onAddReservation, isLoadingDay, dayRef }: DayCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showHotelPrompt, setShowHotelPrompt] = useState(true);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [attachmentModalId, setAttachmentModalId] = useState<string | null>(null);
  const [newAttachment, setNewAttachment] = useState<{ type: 'ticket' | 'reservation' | 'link' | 'document'; name: string; url: string }>({ type: 'link', name: '', url: '' });
  const [directionsDropdownId, setDirectionsDropdownId] = useState<string | null>(null);
  const [transportMode, setTransportMode] = useState<'walk' | 'drive' | 'bus'>('walk');
  const activitySummary = day.activities.map(a => a.name).join(' • ');
  const isEmpty = day.activities.length === 0;

  // Calculate total time for day
  const totalMinutes = day.activities.reduce((sum, a) => sum + (a.duration || 60), 0);
  const totalMiles = day.activities.reduce((sum, a) => sum + (a.walkingTimeToNext || 0) * 0.05, 0);

  return (
    <div className="border-b pb-2">
      {/* Day header - clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left py-2"
      >
        <div className="flex items-start gap-3">
          <ChevronRight className={`w-5 h-5 flex-shrink-0 text-muted-foreground transition-transform mt-1 ${isExpanded ? 'rotate-90' : ''}`} />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{formatFullDate(day.date)}</h3>
                <p className="text-sm text-muted-foreground">{day.city}</p>
              </div>
              <button className="p-1 hover:bg-muted rounded" onClick={(e) => e.stopPropagation()}>
                <span className="text-muted-foreground text-lg">•••</span>
              </button>
            </div>
            {!isExpanded && activitySummary && (
              <p className="text-sm text-primary font-medium truncate mt-1">{activitySummary}</p>
            )}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Action buttons row */}
          <div className="flex items-center gap-4 text-sm ml-8">
            <button
              onClick={onAutoFill}
              disabled={isLoadingDay}
              className="flex items-center gap-1.5 text-primary font-medium hover:underline disabled:opacity-50"
            >
              {isLoadingDay ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Auto-fill day
                </>
              )}
            </button>
            {!isEmpty && (
              <>
                <span className="text-muted-foreground">•</span>
                <button className="flex items-center gap-1.5 text-primary font-medium hover:underline">
                  <MapPin className="w-4 h-4" />
                  Optimize route
                </button>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {Math.floor(totalMinutes / 60)}hr {totalMinutes % 60}min, {totalMiles.toFixed(1)} mi
                </span>
              </>
            )}
          </div>

          {/* Empty state - like Wanderlog */}
          {isEmpty && (
            <div className="ml-8 text-center py-8 text-muted-foreground">
              <p className="text-sm">No activities planned yet</p>
              <button
                onClick={onAutoFill}
                className="mt-2 text-primary font-medium text-sm hover:underline"
              >
                Auto-fill with recommendations
              </button>
            </div>
          )}

          {/* Hotel prompt - Wanderlog style */}
          {showHotelPrompt && !isEmpty && (
            <div className="ml-8 bg-secondary/50 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Hotel className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  Looks like you don&apos;t have lodging for {formatDate(day.date)} yet.
                </p>
              </div>
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Book hotels
              </Button>
              <button
                onClick={() => setShowHotelPrompt(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Activities - Picture View (Large photos like Wanderlog) */}
          {!isEmpty && viewMode === 'picture' && (
            <div className="ml-8 space-y-4">
              {day.activities.map((activity, idx) => {
                const walkingTime = activity.walkingTimeToNext || (idx < day.activities.length - 1 ? Math.floor(Math.random() * 15) + 5 : 0);
                const walkingMiles = (walkingTime * 0.05).toFixed(2);
                const warning = getActivityWarnings(activity, day.date);

                return (
                  <div key={activity.id}>
                    {/* Transport time from previous */}
                    {idx > 0 && (() => {
                      const baseWalkTime = day.activities[idx - 1]?.walkingTimeToNext || walkingTime;
                      const driveTime = Math.max(3, Math.round(baseWalkTime * 0.25));
                      const busTime = Math.round(baseWalkTime * 0.7);
                      const driveMiles = (driveTime * 0.5).toFixed(1);
                      const busMiles = (busTime * 0.3).toFixed(1);
                      const dropdownKey = `${activity.id}-directions`;

                      return (
                        <div className="flex items-center gap-2 py-2 text-sm text-gray-500 relative">
                          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                            {transportMode === 'walk' && <Footprints className="w-4 h-4" />}
                            {transportMode === 'drive' && <Car className="w-4 h-4" />}
                            {transportMode === 'bus' && <Bus className="w-4 h-4" />}
                            <span>
                              {transportMode === 'walk' && `${baseWalkTime} min · ${walkingMiles} mi`}
                              {transportMode === 'drive' && `${driveTime} min · ${driveMiles} mi`}
                              {transportMode === 'bus' && `${busTime} min · ${busMiles} mi`}
                            </span>
                            <button
                              onClick={() => setDirectionsDropdownId(directionsDropdownId === dropdownKey ? null : dropdownKey)}
                              className="text-gray-400 hover:text-gray-600 flex items-center gap-1"
                            >
                              <ChevronDown className={`w-3 h-3 transition-transform ${directionsDropdownId === dropdownKey ? 'rotate-180' : ''}`} />
                              Directions
                            </button>
                          </div>

                          {/* Dropdown */}
                          {directionsDropdownId === dropdownKey && (
                            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border z-20 py-1 min-w-[180px]">
                              <button
                                onClick={() => { setTransportMode('walk'); setDirectionsDropdownId(null); }}
                                className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 ${transportMode === 'walk' ? 'text-violet-600' : 'text-gray-700'}`}
                              >
                                <Footprints className="w-4 h-4" />
                                <span>{baseWalkTime} min · {walkingMiles} mi</span>
                              </button>
                              <button
                                onClick={() => { setTransportMode('drive'); setDirectionsDropdownId(null); }}
                                className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 ${transportMode === 'drive' ? 'text-violet-600' : 'text-gray-700'}`}
                              >
                                <Car className="w-4 h-4" />
                                <span>{driveTime} min · {driveMiles} mi</span>
                              </button>
                              <button
                                onClick={() => { setTransportMode('bus'); setDirectionsDropdownId(null); }}
                                className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 ${transportMode === 'bus' ? 'text-violet-600' : 'text-gray-700'}`}
                              >
                                <Bus className="w-4 h-4" />
                                <span>{busTime} min · {busMiles} mi</span>
                              </button>
                              <div className="border-t my-1" />
                              <button
                                onClick={() => setDirectionsDropdownId(null)}
                                className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 text-gray-500"
                              >
                                <X className="w-4 h-4" />
                                <span>Hide directions</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Activity card with big image */}
                    <button
                      onClick={() => onActivityTap(activity, idx + 1)}
                      className="w-full text-left"
                    >
                      {/* Large image */}
                      <div className="relative w-full h-48 rounded-xl overflow-hidden">
                        <img
                          src={activity.imageUrl || 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80'}
                          alt={activity.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Number badge */}
                        <div className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold shadow-lg">
                          {idx + 1}
                        </div>
                        {/* Delete button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); onActivityDelete(activity.id); }}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-500 hover:text-red-500 shadow"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Content below image */}
                      <div className="mt-2">
                        <h4 className="font-bold text-lg text-gray-900">{activity.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.openingHours && <span>{activity.openingHours} • </span>}
                          {activity.description}
                        </p>

                        {/* Closure/Warning badge */}
                        {warning && (
                          <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full text-sm">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{warning}</span>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="ml-1 text-amber-400 hover:text-amber-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Action buttons row - Wanderlog style */}
                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                          {/* Time button/input */}
                          {editingTimeId === activity.id ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Clock className="w-4 h-4" />
                              <input
                                type="time"
                                defaultValue={activity.suggestedTime || '09:00'}
                                autoFocus
                                className="px-1 py-0.5 text-sm border border-violet-300 rounded bg-violet-50"
                                onBlur={(e) => {
                                  onActivityTimeUpdate(activity.id, e.target.value);
                                  setEditingTimeId(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    onActivityTimeUpdate(activity.id, e.currentTarget.value);
                                    setEditingTimeId(null);
                                  }
                                  if (e.key === 'Escape') setEditingTimeId(null);
                                }}
                              />
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingTimeId(activity.id); }}
                              className="flex items-center gap-1.5 hover:text-violet-600 transition-colors"
                            >
                              <Clock className="w-4 h-4" />
                              {activity.suggestedTime || 'Add time'}
                            </button>
                          )}

                          {/* Attach button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); setAttachmentModalId(activity.id); }}
                            className="flex items-center gap-1.5 hover:text-violet-600 transition-colors"
                          >
                            <Paperclip className="w-4 h-4" />
                            Attach
                            {activity.attachments && activity.attachments.length > 0 && (
                              <span className="bg-violet-100 text-violet-700 px-1.5 rounded text-xs">{activity.attachments.length}</span>
                            )}
                          </button>

                          {/* Cost button/input */}
                          {editingCostId === activity.id ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <DollarSign className="w-4 h-4" />
                              <input
                                type="number"
                                placeholder="0"
                                defaultValue={activity.userCost || ''}
                                autoFocus
                                className="w-16 px-1 py-0.5 text-sm border border-violet-300 rounded bg-violet-50"
                                onBlur={(e) => {
                                  const val = e.target.value ? parseFloat(e.target.value) : undefined;
                                  onActivityCostUpdate(activity.id, val);
                                  setEditingCostId(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const val = e.currentTarget.value ? parseFloat(e.currentTarget.value) : undefined;
                                    onActivityCostUpdate(activity.id, val);
                                    setEditingCostId(null);
                                  }
                                  if (e.key === 'Escape') setEditingCostId(null);
                                }}
                              />
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingCostId(activity.id); }}
                              className="flex items-center gap-1.5 hover:text-violet-600 transition-colors"
                            >
                              <DollarSign className="w-4 h-4" />
                              {activity.userCost ? `$${activity.userCost}` : 'Add cost'}
                            </button>
                          )}
                        </div>

                        {/* Attachment Modal */}
                        {attachmentModalId === activity.id && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg border" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Add attachment</span>
                              <button onClick={() => setAttachmentModalId(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="space-y-2">
                              <select
                                value={newAttachment.type}
                                onChange={(e) => setNewAttachment(prev => ({ ...prev, type: e.target.value as 'link' | 'ticket' | 'reservation' | 'document' }))}
                                className="w-full px-2 py-1.5 text-sm border rounded"
                              >
                                <option value="link">Link</option>
                                <option value="ticket">Ticket</option>
                                <option value="reservation">Reservation</option>
                                <option value="document">Document</option>
                              </select>
                              <input
                                type="text"
                                placeholder="Name (e.g., Booking confirmation)"
                                value={newAttachment.name}
                                onChange={(e) => setNewAttachment(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-2 py-1.5 text-sm border rounded"
                              />
                              <input
                                type="url"
                                placeholder="URL (optional)"
                                value={newAttachment.url}
                                onChange={(e) => setNewAttachment(prev => ({ ...prev, url: e.target.value }))}
                                className="w-full px-2 py-1.5 text-sm border rounded"
                              />
                              <button
                                onClick={() => {
                                  if (newAttachment.name) {
                                    onActivityAttachmentAdd(activity.id, newAttachment);
                                    setNewAttachment({ type: 'link', name: '', url: '' });
                                    setAttachmentModalId(null);
                                  }
                                }}
                                disabled={!newAttachment.name}
                                className="w-full py-1.5 bg-violet-500 text-white rounded text-sm font-medium disabled:opacity-50"
                              >
                                Add
                              </button>
                            </div>
                            {/* Existing attachments */}
                            {activity.attachments && activity.attachments.length > 0 && (
                              <div className="mt-3 pt-3 border-t space-y-1">
                                <span className="text-xs text-gray-500">Attached:</span>
                                {activity.attachments.map((att, i) => (
                                  <div key={i} className="flex items-center gap-2 text-sm">
                                    <Paperclip className="w-3 h-3 text-gray-400" />
                                    {att.url ? (
                                      <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">
                                        {att.name}
                                      </a>
                                    ) : (
                                      <span>{att.name}</span>
                                    )}
                                    <span className="text-xs text-gray-400 capitalize">({att.type})</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Activities - Compact View (Timeline with small thumbnails) */}
          {!isEmpty && viewMode === 'compact' && (
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-[52px] top-4 bottom-4 w-0.5 bg-gray-200" />

              <div className="space-y-0">
                {day.activities.map((activity, idx) => {
                  const timeStr = activity.suggestedTime || `${9 + idx * 2}:00`;
                  const hour = parseInt(timeStr.split(':')[0]);
                  const formattedTime = hour >= 12
                    ? `${hour === 12 ? 12 : hour - 12}:${timeStr.split(':')[1] || '00'} PM`
                    : `${hour}:${timeStr.split(':')[1] || '00'} AM`;
                  const walkingTime = activity.walkingTimeToNext || (idx < day.activities.length - 1 ? Math.floor(Math.random() * 15) + 5 : 0);
                  const warning = getActivityWarnings(activity, day.date);

                  return (
                    <div key={activity.id}>
                      {/* Activity row */}
                      <div className="flex items-start gap-3">
                        {/* Time column - tappable to edit */}
                        <div className="w-[44px] text-right text-sm pt-3 flex-shrink-0">
                          {editingTimeId === activity.id ? (
                            <input
                              type="time"
                              defaultValue={timeStr}
                              autoFocus
                              onBlur={(e) => {
                                onActivityTimeUpdate(activity.id, e.target.value);
                                setEditingTimeId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  onActivityTimeUpdate(activity.id, e.currentTarget.value);
                                  setEditingTimeId(null);
                                }
                                if (e.key === 'Escape') setEditingTimeId(null);
                              }}
                              className="w-full text-xs bg-violet-50 border border-violet-300 rounded px-1 py-0.5 text-center"
                            />
                          ) : (
                            <button
                              onClick={() => setEditingTimeId(activity.id)}
                              className="text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded px-1 py-0.5 transition-colors"
                            >
                              {formattedTime}
                            </button>
                          )}
                        </div>

                        {/* Timeline dot + drag handle */}
                        <div className="relative z-10 flex-shrink-0 mt-3 group">
                          <div className="w-4 h-4 rounded-full bg-violet-500 border-2 border-white shadow-sm cursor-grab active:cursor-grabbing" />
                        </div>

                        {/* Activity card */}
                        <button
                          onClick={() => onActivityTap(activity, idx + 1)}
                          className="group flex-1 flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-violet-300 hover:shadow-sm transition-all text-left mb-1"
                        >
                          {/* Thumbnail */}
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={activity.imageUrl || 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=200&q=80'}
                              alt={activity.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-gray-900 line-clamp-1">{activity.name}</h4>
                              {/* Rating badge */}
                              <div className="flex items-center gap-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0">
                                <Star className="w-3 h-3 fill-current" />
                                {(4.2 + Math.random() * 0.7).toFixed(1)}
                              </div>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {(activity.tags || ['attraction']).slice(0, 2).map(tag => (
                                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                                  {tag}
                                </span>
                              ))}
                              {activity.priceRange && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                  {activity.priceRange}
                                </span>
                              )}
                            </div>

                            {/* Duration */}
                            <p className="text-xs text-gray-500 mt-1.5">
                              {activity.duration || 60} min · {activity.neighborhood || day.city}
                            </p>

                            {/* Closure warning */}
                            {warning && (
                              <div className="mt-1.5 inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-xs">
                                <MapPin className="w-3 h-3" />
                                <span>{warning}</span>
                              </div>
                            )}

                            {/* Quick action buttons */}
                            <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 hover:text-violet-600"
                              >
                                <Paperclip className="w-3 h-3" />
                                {activity.attachments?.length || 0}
                              </button>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 hover:text-violet-600"
                              >
                                <DollarSign className="w-3 h-3" />
                                {activity.userCost ? `$${activity.userCost}` : '-'}
                              </button>
                            </div>
                          </div>

                          {/* Reorder buttons */}
                          <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {idx > 0 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onActivityReorder(idx, idx - 1); }}
                                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                                title="Move up"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                            )}
                            {idx < day.activities.length - 1 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onActivityReorder(idx, idx + 1); }}
                                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                                title="Move down"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </button>
                      </div>

                      {/* Walking time connector */}
                      {idx < day.activities.length - 1 && walkingTime > 0 && (
                        <div className="flex items-center gap-3 py-2">
                          <div className="w-[44px]" /> {/* Spacer for time column */}
                          <div className="w-4 flex justify-center flex-shrink-0">
                            <div className="w-0.5 h-full" /> {/* Timeline continues */}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                            <Footprints className="w-3 h-3" />
                            <span>{walkingTime} min walk</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add place / Add transport tabs */}
          <div className="ml-8 mt-3 flex items-center gap-4">
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Plus className="w-4 h-4" />
              Add a place
            </button>
            <button
              onClick={() => onAddReservation('flight')}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Plane className="w-4 h-4" />
              Add transport
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ ACTIVITY CARD COMPONENT (Wanderlog-style) ============

interface ActivityCardProps {
  activity: GeneratedActivity;
  index: number;
  color: typeof DAY_COLORS[0];
  onTap: () => void;
  onDelete: () => void;
  showTravelTime?: boolean;
}

function ActivityCard({ activity, index, onTap, onDelete, showTravelTime = true }: ActivityCardProps) {
  return (
    <div className="relative">
      {/* Main card - Wanderlog style: number | content | small image */}
      <button onClick={onTap} className="w-full text-left">
        <div className="flex items-start gap-3 p-4 bg-card rounded-xl border hover:border-primary/30 transition-all">
          {/* Number badge */}
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {index}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-base">{activity.name}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {activity.openingHours && <span>Open {activity.openingHours} • </span>}
              <span className="line-clamp-2">{activity.description}</span>
            </p>
          </div>

          {/* Small image on right */}
          <div className="w-28 h-24 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={activity.imageUrl}
              alt={activity.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </button>

      {/* Travel time connector below card - only show if showTravelTime is true */}
      {showTravelTime && activity.walkingTimeToNext && (
        <div className="flex items-center gap-2 py-3 pl-4 ml-4 border-l-2 border-dashed border-muted">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Footprints className="w-4 h-4" />
            <span>{activity.walkingTimeToNext} min · {(activity.walkingTimeToNext * 0.05).toFixed(2)} mi</span>
            <button className="flex items-center gap-1 text-muted-foreground hover:text-primary">
              <ChevronDown className="w-3 h-3" />
              Directions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Travel time connector between activities
function TravelTimeConnector({ minutes, miles }: { minutes: number; miles: number }) {
  return (
    <div className="flex items-center gap-3 py-3 pl-8 ml-4 border-l-2 border-dashed border-muted">
      <div className="flex items-center gap-2 text-sm text-muted-foreground -ml-6 bg-background px-2">
        <div className="w-6 h-6 rounded bg-muted/80 flex items-center justify-center">
          <Footprints className="w-3.5 h-3.5" />
        </div>
        <span>{minutes} min · {miles.toFixed(1)} mi</span>
        <button className="flex items-center gap-1 text-primary hover:underline">
          Directions
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ============ ACTIVITY DETAIL DRAWER ============

interface ActivityDetailDrawerProps {
  activity: GeneratedActivity | null;
  index: number;
  totalCount: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

function ActivityDetailDrawer({ activity, index, totalCount, onClose, onPrev, onNext }: ActivityDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'reviews' | 'photos'>('about');
  const [fetchedHistory, setFetchedHistory] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch real history from AI if not available
  useEffect(() => {
    if (!activity || activity.history || fetchedHistory) return;

    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const response = await fetch('/api/place-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            placeName: activity.name,
            city: activity.neighborhood,
            type: activity.type,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setFetchedHistory(data.history);
        }
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [activity, fetchedHistory]);

  // Reset fetched history when activity changes
  useEffect(() => {
    setFetchedHistory(null);
  }, [activity?.id]);

  if (!activity) return null;

  // Use activity data or generate fallback mock data
  const googleRating = activity.rating || (4.3 + Math.random() * 0.6);
  const googleReviewCount = activity.reviewCount || Math.floor(1000 + Math.random() * 8000);
  const taRating = activity.tripadvisorRating || (4.0 + Math.random() * 0.8);
  const taReviewCount = activity.tripadvisorReviewCount || Math.floor(500 + Math.random() * 3000);

  // Use activity history, fetched history, or show loading
  const richDescription = activity.history || fetchedHistory || null;

  // Day-by-day availability
  const DAY_ABBREVS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const DAY_NAMES_FULL = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

  const getDayAvailability = (dayIdx: number): 'open' | 'closed' | 'unknown' => {
    if (!activity.hoursPerDay) return 'unknown';
    const dayName = DAY_NAMES_FULL[dayIdx];
    const hours = activity.hoursPerDay[dayName];
    if (!hours) return 'unknown';
    if (hours.toLowerCase().includes('closed')) return 'closed';
    return 'open';
  };

  // Star breakdown (mock distribution)
  const getStarBreakdown = (rating: number): number[] => {
    const r = rating;
    return [
      Math.round((r / 5) * 70),  // 5 stars
      Math.round((r / 5) * 20),  // 4 stars
      Math.round((r / 5) * 7),   // 3 stars
      Math.round((r / 5) * 2),   // 2 stars
      Math.round((r / 5) * 1),   // 1 star
    ];
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
    const starSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

    return (
      <div className="flex">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className={`${starSize} fill-amber-400 text-amber-400`} />
        ))}
        {hasHalf && (
          <div className="relative">
            <Star className={`${starSize} text-gray-200`} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className={`${starSize} fill-amber-400 text-amber-400`} />
            </div>
          </div>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className={`${starSize} text-gray-200`} />
        ))}
      </div>
    );
  };

  // Mock reviews if not provided
  const reviews = activity.reviews || [
    { source: 'google' as const, rating: 5, text: "Amazing experience! Highly recommend visiting.", author: "Sarah M.", date: "2 weeks ago" },
    { source: 'tripadvisor' as const, rating: 4, text: "Beautiful place with great atmosphere. Can get crowded.", author: "TravelLover", date: "Jan 2025" },
    { source: 'google' as const, rating: 5, text: "One of the highlights of our trip!", author: "Mike R.", date: "1 month ago" },
  ];

  const reviewSummary = activity.reviewSummary ||
    `Visitors consistently praise ${activity.name} for its unique atmosphere and authentic experience. Most recommend arriving early to avoid crowds.`;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-end" onClick={onClose}>
      <div className="bg-background w-full sm:w-[420px] h-[95vh] sm:h-full rounded-t-2xl sm:rounded-none overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header with navigation */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <button onClick={onPrev} disabled={index <= 1} className="p-1 hover:bg-muted rounded disabled:opacity-30">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium">{index} of {totalCount}</span>
            <button onClick={onNext} disabled={index >= totalCount} className="p-1 hover:bg-muted rounded disabled:opacity-30">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {(['about', 'reviews', 'photos'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-medium capitalize ${
                activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'about' && (
            <div className="p-4 space-y-3">
              {/* Header with image */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold">
                      {index}
                    </div>
                    <h3 className="font-bold">{activity.name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(activity.tags || []).slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px] capitalize py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <img src={activity.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover" />
              </div>

              {/* Rich description / history section */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                  <span className="text-sm font-medium text-amber-700">About this place</span>
                </div>
                {isLoadingHistory ? (
                  <div className="flex items-center gap-2 text-sm text-amber-700">
                    <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    Loading historical information...
                  </div>
                ) : richDescription ? (
                  <p className="text-sm text-amber-900 leading-relaxed">
                    {richDescription}
                  </p>
                ) : (
                  <p className="text-sm text-amber-700 italic">
                    Historical information unavailable
                  </p>
                )}
              </div>

              {/* Dual ratings section */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                {/* Google rating */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-white flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-blue-600">G</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{googleRating.toFixed(1)}</span>
                        {renderStars(googleRating)}
                      </div>
                      <span className="text-xs text-muted-foreground">{googleReviewCount.toLocaleString()} reviews</span>
                    </div>
                  </div>
                </div>

                {/* TripAdvisor rating with breakdown */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-white flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-green-600">TA</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{taRating.toFixed(1)}</span>
                        {renderStars(taRating)}
                      </div>
                      <span className="text-xs text-muted-foreground">{taReviewCount.toLocaleString()} reviews</span>
                    </div>
                  </div>
                  {/* Star breakdown */}
                  <div className="text-[10px] text-muted-foreground space-y-0.5">
                    {[5, 4, 3, 2, 1].map((stars, idx) => (
                      <div key={stars} className="flex items-center gap-1">
                        <span className="w-3">{stars}</span>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${getStarBreakdown(taRating)[idx]}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Full address */}
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">
                  {activity.address || `${activity.neighborhood}, Thailand`}
                </span>
              </div>

              {/* Day-by-day availability */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Hours</span>
                </div>
                <div className="flex gap-1">
                  {DAY_ABBREVS.map((day, idx) => {
                    const status = getDayAvailability(idx);
                    return (
                      <div
                        key={idx}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          status === 'open' ? 'bg-green-100 text-green-700' :
                          status === 'closed' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-500'
                        }`}
                        title={`${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][idx]}: ${
                          activity.hoursPerDay?.[DAY_NAMES_FULL[idx]] || 'Unknown'
                        }`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
                {activity.openingHours && (
                  <p className="text-xs text-muted-foreground">Today: {activity.openingHours}</p>
                )}
              </div>

              {/* Typical duration */}
              {(activity.typicalDuration || activity.duration) && (
                <div className="flex items-center gap-2 text-sm bg-blue-50 rounded-lg p-3">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700">
                    {activity.typicalDuration || `People typically spend ${activity.duration} min here`}
                  </span>
                </div>
              )}

              {/* Match reasons - prominent display */}
              {(activity.matchReasons || []).length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="font-bold text-green-700">{activity.matchScore || 0}% match</span>
                      <span className="text-green-600 text-sm ml-1">for you</span>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {(activity.matchReasons || []).map((reason, idx) => (
                      <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="p-4 space-y-4">
              {/* AI Summary */}
              <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span className="font-medium text-violet-700 text-sm">AI Summary</span>
                </div>
                <p className="text-sm text-violet-800">{reviewSummary}</p>
              </div>

              {/* Individual reviews */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Recent Reviews</h4>
                {reviews.map((review, idx) => (
                  <div key={idx} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                          review.source === 'google' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {review.source === 'google' ? 'G' : 'TA'}
                        </div>
                        <span className="font-medium text-sm">{review.author}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{review.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-sm text-muted-foreground">{review.text}</p>
                  </div>
                ))}
              </div>

              {/* View more link */}
              <Button variant="outline" size="sm" className="w-full">
                View all reviews on Google
              </Button>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2">
                <img src={activity.imageUrl} alt="" className="rounded-lg aspect-square object-cover col-span-2" />
                <img src={activity.imageUrl} alt="" className="rounded-lg aspect-square object-cover" />
                <img src={activity.imageUrl} alt="" className="rounded-lg aspect-square object-cover" />
                <img src={activity.imageUrl} alt="" className="rounded-lg aspect-square object-cover" />
                <img src={activity.imageUrl} alt="" className="rounded-lg aspect-square object-cover" />
              </div>
              <p className="text-xs text-center text-muted-foreground mt-3">
                Photos from Google Places
              </p>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="p-4 border-t flex gap-2">
          <Button variant="outline" className="flex-1">
            <RefreshCw className="w-4 h-4 mr-2" />
            Swap
          </Button>
          <Button variant="destructive" size="icon">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============ ADD RESERVATION MODAL ============

interface AddReservationModalProps {
  type: 'flight' | 'lodging' | 'rental-car' | 'restaurant' | 'attachment' | 'other';
  dayNumber: number;
  onClose: () => void;
  onSave: (data: {
    name: string;
    type: 'flight' | 'train' | 'bus' | 'drive' | 'transit' | 'restaurant' | 'cafe' | 'activity' | 'attraction' | 'nightlife';
    description?: string;
    suggestedTime?: string;
    duration?: number;
    transportDetails?: {
      from: string;
      to: string;
      departureTime?: string;
      arrivalTime?: string;
      operator?: string;
      bookingRef?: string;
    };
    userCost?: number;
  }) => void;
}

function AddReservationModal({ type, dayNumber, onClose, onSave }: AddReservationModalProps) {
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    airline: '',
    flightNumber: '',
    departureTime: '',
    arrivalTime: '',
    bookingRef: '',
    cost: '',
    name: '',
    notes: '',
  });

  const getTitle = () => {
    switch (type) {
      case 'flight': return 'Add Flight';
      case 'lodging': return 'Add Lodging';
      case 'rental-car': return 'Add Rental Car';
      case 'restaurant': return 'Add Restaurant';
      case 'attachment': return 'Add Attachment';
      case 'other': return 'Add Other';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'flight': return <Plane className="w-5 h-5" />;
      case 'lodging': return <Bed className="w-5 h-5" />;
      case 'rental-car': return <Car className="w-5 h-5" />;
      case 'restaurant': return <Utensils className="w-5 h-5" />;
      case 'attachment': return <Paperclip className="w-5 h-5" />;
      case 'other': return <MoreHorizontal className="w-5 h-5" />;
    }
  };

  const handleSave = () => {
    if (type === 'flight') {
      const flightName = formData.airline && formData.flightNumber
        ? `${formData.airline} ${formData.flightNumber}`
        : `${formData.from} → ${formData.to}`;

      onSave({
        name: flightName,
        type: 'flight',
        description: `${formData.from} to ${formData.to}${formData.notes ? ` • ${formData.notes}` : ''}`,
        suggestedTime: formData.departureTime || undefined,
        transportDetails: {
          from: formData.from,
          to: formData.to,
          departureTime: formData.departureTime || undefined,
          arrivalTime: formData.arrivalTime || undefined,
          operator: formData.airline || undefined,
          bookingRef: formData.bookingRef || undefined,
        },
        userCost: formData.cost ? parseFloat(formData.cost) : undefined,
      });
    } else if (type === 'rental-car') {
      onSave({
        name: formData.name || 'Rental Car',
        type: 'drive',
        description: formData.notes || undefined,
        transportDetails: {
          from: formData.from || 'Pickup',
          to: formData.to || 'Return',
          bookingRef: formData.bookingRef || undefined,
        },
        userCost: formData.cost ? parseFloat(formData.cost) : undefined,
      });
    } else if (type === 'restaurant') {
      onSave({
        name: formData.name || 'Restaurant',
        type: 'restaurant',
        description: formData.notes || undefined,
        suggestedTime: formData.departureTime || undefined,
        userCost: formData.cost ? parseFloat(formData.cost) : undefined,
      });
    } else if (type === 'lodging') {
      onSave({
        name: formData.name || 'Accommodation',
        type: 'activity',
        description: formData.notes || undefined,
        userCost: formData.cost ? parseFloat(formData.cost) : undefined,
      });
    } else {
      onSave({
        name: formData.name || 'Item',
        type: 'activity',
        description: formData.notes || undefined,
        userCost: formData.cost ? parseFloat(formData.cost) : undefined,
      });
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl max-w-md mx-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            {getIcon()}
            <h2 className="font-bold text-lg">{getTitle()}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {type === 'flight' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                  <input
                    type="text"
                    placeholder="e.g. LAX"
                    value={formData.from}
                    onChange={(e) => setFormData(prev => ({ ...prev, from: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                  <input
                    type="text"
                    placeholder="e.g. NRT"
                    value={formData.to}
                    onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Airline</label>
                  <input
                    type="text"
                    placeholder="e.g. United"
                    value={formData.airline}
                    onChange={(e) => setFormData(prev => ({ ...prev, airline: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Flight #</label>
                  <input
                    type="text"
                    placeholder="e.g. UA123"
                    value={formData.flightNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, flightNumber: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Departure</label>
                  <input
                    type="time"
                    value={formData.departureTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Arrival</label>
                  <input
                    type="time"
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, arrivalTime: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Confirmation #</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={formData.bookingRef}
                    onChange={(e) => setFormData(prev => ({ ...prev, bookingRef: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cost</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.cost}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                      className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {(type === 'restaurant' || type === 'lodging' || type === 'other') && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <input
                  type="text"
                  placeholder={type === 'restaurant' ? 'Restaurant name' : type === 'lodging' ? 'Hotel name' : 'Name'}
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {type === 'restaurant' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Reservation Time</label>
                  <input
                    type="time"
                    value={formData.departureTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Confirmation #</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={formData.bookingRef}
                    onChange={(e) => setFormData(prev => ({ ...prev, bookingRef: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cost</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.cost}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                      className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {type === 'rental-car' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Rental Company</label>
                <input
                  type="text"
                  placeholder="e.g. Hertz"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Pickup Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Airport"
                    value={formData.from}
                    onChange={(e) => setFormData(prev => ({ ...prev, from: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Return Location</label>
                  <input
                    type="text"
                    placeholder="Same as pickup"
                    value={formData.to}
                    onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Confirmation #</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={formData.bookingRef}
                    onChange={(e) => setFormData(prev => ({ ...prev, bookingRef: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cost</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.cost}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                      className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {type === 'attachment' && (
            <div className="text-center py-8">
              <Paperclip className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Attachment upload coming soon</p>
              <p className="text-gray-400 text-xs mt-1">You&apos;ll be able to attach tickets, confirmations, etc.</p>
            </div>
          )}

          {/* Notes (for all types except attachment) */}
          {type !== 'attachment' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
              <textarea
                placeholder="Add any notes..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t bg-gray-50 rounded-b-2xl">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={type === 'attachment'}>
            Add to Day {dayNumber}
          </Button>
        </div>
      </div>
    </>
  );
}
