'use client';

import { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import type { TripDNA } from '@/types/trip-dna';
import type { GeneratedActivity, GeneratedDay, CityAllocation } from '@/lib/planning/itinerary-generator';
import { allocateDays, RECOMMENDED_NIGHTS, DEFAULT_NIGHTS } from '@/lib/planning/itinerary-generator';
import dynamic from 'next/dynamic';

// Dynamically import HotelPicker and RouteMap
const HotelPicker = dynamic(() => import('./HotelPicker'), { ssr: false });
const RouteMap = dynamic(() => import('./RouteMap'), { ssr: false });

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

  // Day allocation state (can be adjusted by user)
  // Use initialAllocations if provided (persisted from parent), otherwise calculate fresh
  const [allocations, setAllocations] = useState<CityAllocation[]>(() => {
    if (initialAllocations && initialAllocations.length > 0) {
      // Check if saved allocations contain the same route cities (ignoring transit days)
      const savedRouteCities = initialAllocations.filter(a => !a.city.includes('Transit')).map(a => a.city);
      const citiesMatch = cities.length === savedRouteCities.length &&
        cities.every((c, i) => c === savedRouteCities[i]);

      // Use saved allocations if cities match (regardless of total nights - user may have customized)
      if (citiesMatch) {
        return initialAllocations;
      }
    }
    return allocateDays(cities, initialTotalDays, tripDna, initialStartDate);
  });

  // Handle when initialAllocations arrives AFTER first render (from IndexedDB)
  const [hasLoadedInitialAllocations, setHasLoadedInitialAllocations] = useState(false);
  useEffect(() => {
    console.log('[AutoItinerary] initialAllocations effect:', {
      hasLoaded: hasLoadedInitialAllocations,
      initialAllocations: initialAllocations?.map(a => `${a.city}:${a.nights}`),
      cities
    });
    if (!hasLoadedInitialAllocations && initialAllocations && initialAllocations.length > 0) {
      const savedRouteCities = initialAllocations.filter(a => !a.city.includes('Transit')).map(a => a.city);
      const citiesMatch = cities.length === savedRouteCities.length &&
        cities.every((c, i) => c === savedRouteCities[i]);
      console.log('[AutoItinerary] citiesMatch:', citiesMatch, 'savedRouteCities:', savedRouteCities);

      if (citiesMatch) {
        console.log('[AutoItinerary] LOADING saved allocations into state!');
        setAllocations(initialAllocations);
        setHasLoadedInitialAllocations(true);
      }
    }
  }, [initialAllocations, cities, hasLoadedInitialAllocations]);

  // Generated days (mock for now)
  const [days, setDays] = useState<GeneratedDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set(cities));
  const [isDurationExpanded, setIsDurationExpanded] = useState(false); // Collapsed by default

  // View mode: 'picture' | 'compact' | 'map'
  const [viewMode, setViewMode] = useState<'picture' | 'compact' | 'map'>('picture');

  // Hotels per city
  const [selectedHotels, setSelectedHotels] = useState<Record<string, { name: string; id: string }>>({});
  const [hotelPickerCity, setHotelPickerCity] = useState<string | null>(null);

  // Activity detail drawer
  const [selectedActivity, setSelectedActivity] = useState<{ activity: GeneratedActivity; index: number } | null>(null);

  // Full-screen map state
  const [mapSelectedIndex, setMapSelectedIndex] = useState(0);

  // Flatten all activities for map navigation (with city/date info)
  const allActivitiesWithMeta = useMemo(() => {
    return days.flatMap(day => day.activities.map(activity => ({ ...activity, city: day.city, date: day.date })));
  }, [days]);

  // Get all activities for drawer navigation
  const allActivities = days.flatMap(d => d.activities);
  const totalActivityCount = allActivities.length;

  // Handle activity tap
  const handleActivityTap = (activity: GeneratedActivity, index: number) => {
    setSelectedActivity({ activity, index });
  };

  // Handle activity delete
  const handleActivityDelete = (activityId: string) => {
    setDays(prev => prev.map(day => ({
      ...day,
      activities: day.activities.filter(a => a.id !== activityId),
    })));
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

  // Only recalculate allocations from scratch when CITIES change
  // When dates change, we just update the dates within existing allocations (preserving night counts)
  // Guard: Don't overwrite if we've loaded saved allocations from IndexedDB
  useEffect(() => {
    if (!hasLoadedInitialAllocations) {
      setAllocations(allocateDays(cities, tripTotalDays, tripDna, tripStartDate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities.join(','), hasLoadedInitialAllocations]); // Only cities - NOT dates or tripDna

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
  useEffect(() => {
    setIsLoading(true);
    // Generate empty days immediately (no API call needed)
    const timer = setTimeout(() => {
      setDays(generateEmptyDays(allocations));
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [allocations]);

  // Sync allocations back to parent whenever they change
  // BUT only after we've had a chance to load saved allocations (to prevent overwriting)
  const [isReadyToSync, setIsReadyToSync] = useState(false);

  // Wait a tick before allowing sync - gives time for initialAllocations to arrive
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReadyToSync(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReadyToSync) {
      console.log('[AutoItinerary] Not ready to sync yet');
      return;
    }
    console.log('[AutoItinerary] Syncing allocations to parent:', allocations.map(a => `${a.city}:${a.nights}`));
    onAllocationsChange?.(allocations);
  }, [allocations, onAllocationsChange, isReadyToSync]);

  // AI-powered auto-fill for a single city's days (with fallback to mock data)
  const autoFillCityDays = async (city: string, nights: number) => {
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
        }),
      });

      if (!response.ok) throw new Error('Failed to generate itinerary');

      const data = await response.json();
      if (data.days && data.days.length > 0) {
        return data.days;
      }
      throw new Error('No days returned');
    } catch (error) {
      console.error('AI itinerary failed, using mock data for', city, error);
      // Fallback to mock data
      return generateMockDaysForCity(city, nights);
    }
  };

  // Generate mock days as fallback when API fails
  const generateMockDaysForCity = (city: string, nights: number) => {
    const cityActivities = MOCK_ACTIVITIES[city] || MOCK_ACTIVITIES['Bangkok'] || [];
    const days = [];

    for (let i = 0; i < nights; i++) {
      const dayActivities = cityActivities.map((act, idx) => ({
        ...act,
        id: `${city.toLowerCase().replace(/\s+/g, '-')}-day${i + 1}-${idx}-${Date.now()}`,
      }));

      days.push({
        dayNumber: i + 1,
        theme: i === 0 ? 'Highlights Day' : i === 1 ? 'Local Discovery' : 'Relaxed Exploration',
        activities: dayActivities.slice(0, 3 + (i % 2)),
      });
    }

    return days;
  };

  // Auto-fill a single day (uses cached city data or generates new)
  const [cityItineraryCache, setCityItineraryCache] = useState<Record<string, { dayNumber: number; theme?: string; activities: GeneratedActivity[] }[]>>({});

  const autoFillDay = async (dayNumber: number) => {
    const targetDay = days.find(d => d.dayNumber === dayNumber);
    if (!targetDay || targetDay.city.includes('Transit')) return;

    setIsLoading(true);

    // Check if we have cached data for this city
    if (cityItineraryCache[targetDay.city]) {
      const cityDays = cityItineraryCache[targetDay.city];
      const cityDayIndex = days.filter(d => d.city === targetDay.city && d.dayNumber < dayNumber).length;
      const aiDay = cityDays[cityDayIndex % cityDays.length];

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
      setIsLoading(false);
      return;
    }

    // Generate new itinerary for this city
    const cityNights = allocations.find(a => a.city === targetDay.city)?.nights || 3;
    const aiDays = await autoFillCityDays(targetDay.city, cityNights);

    if (aiDays) {
      setCityItineraryCache(prev => ({ ...prev, [targetDay.city]: aiDays }));

      const cityDayIndex = days.filter(d => d.city === targetDay.city && d.dayNumber < dayNumber).length;
      const aiDay = aiDays[cityDayIndex % aiDays.length];

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
    setIsLoading(false);
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

    setDays(prev => prev.map(day => {
      if (day.city.includes('Transit')) {
        return day; // Skip transit days
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

      {/* View Mode Toggle */}
      <div className="flex items-center justify-center gap-1 bg-muted/50 rounded-lg p-1">
        <button
          onClick={() => setViewMode('picture')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'picture' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Image className="w-4 h-4" />
          Picture
        </button>
        <button
          onClick={() => setViewMode('compact')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'compact' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <List className="w-4 h-4" />
          Compact
        </button>
        <button
          onClick={() => setViewMode('map')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'map' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Map className="w-4 h-4" />
          Map
        </button>
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

      {/* Full-screen Map View */}
      {!isLoading && viewMode === 'map' && allActivitiesWithMeta.length > 0 && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Exit button */}
          <button
            onClick={() => setViewMode('picture')}
            className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 bg-white rounded-full shadow-lg text-sm font-medium"
          >
            <X className="w-4 h-4" />
            Exit map
          </button>

          {/* Map area */}
          <div className="flex-1 relative">
            {getCityCountry && (
              <RouteMap
                cities={cities}
                getCityCountry={getCityCountry}
                calculateDistance={() => null}
              />
            )}
            {/* Numbered markers overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="flex flex-wrap gap-1 max-w-xs">
                {allActivitiesWithMeta.slice(0, 9).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMapSelectedIndex(idx)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg pointer-events-auto cursor-pointer ${
                      idx === mapSelectedIndex ? 'bg-violet-600 ring-4 ring-violet-200' : 'bg-violet-500'
                    }`}
                    style={{ transform: `translate(${(idx % 5 - 2) * 30}px, ${Math.floor(idx / 5) * 25}px)` }}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom navigation bar */}
          <div className="absolute bottom-[45%] left-0 right-0 flex items-center justify-center gap-2 px-4 py-2">
            <button
              onClick={() => setMapSelectedIndex(Math.max(0, mapSelectedIndex - 1))}
              disabled={mapSelectedIndex === 0}
              className="p-2 bg-white rounded-full shadow-lg disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-3 py-1.5 bg-white rounded-full shadow-lg text-sm font-medium">
              {mapSelectedIndex + 1} of {allActivitiesWithMeta.length}
            </span>
            <button
              onClick={() => setMapSelectedIndex(Math.min(allActivitiesWithMeta.length - 1, mapSelectedIndex + 1))}
              disabled={mapSelectedIndex === allActivitiesWithMeta.length - 1}
              className="p-2 bg-white rounded-full shadow-lg disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button className="p-2 bg-white rounded-full shadow-lg">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
                <path d="M11 8v6M8 11h6"/>
              </svg>
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-lg text-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18"/>
              </svg>
              Optimize route
              <Badge className="bg-violet-100 text-violet-700 text-xs">PRO</Badge>
            </button>
            <button
              onClick={() => setViewMode('picture')}
              className="p-2 bg-white rounded-full shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom sheet with activity details */}
          <div className="bg-white border-t rounded-t-2xl shadow-2xl" style={{ height: '45%' }}>
            {/* Tabs */}
            <div className="flex border-b px-4">
              {['About', 'Reviews', 'Photos', 'Mentions'].map((tab, idx) => (
                <button
                  key={tab}
                  className={`px-4 py-3 text-sm font-medium ${idx === 0 ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Activity content */}
            {allActivitiesWithMeta[mapSelectedIndex] && (
              <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(45% - 50px)' }}>
                {/* Header with image */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {mapSelectedIndex + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{allActivitiesWithMeta[mapSelectedIndex].name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{allActivitiesWithMeta[mapSelectedIndex].description}</p>
                  </div>
                  {allActivitiesWithMeta[mapSelectedIndex].imageUrl && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={allActivitiesWithMeta[mapSelectedIndex].imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Added button */}
                <div className="mb-4">
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
                    <span>🔖</span>
                    Added
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {allActivitiesWithMeta[mapSelectedIndex].tags?.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span className="font-semibold text-amber-600">4.3</span>
                  <span className="text-gray-500">(25688)</span>
                  <span className="text-blue-500 font-bold">G</span>
                  <span className="text-gray-400 mx-2">•</span>
                  <span className="text-gray-500 text-sm">Mentioned by</span>
                  <span className="text-violet-600 text-sm">+118 other lists</span>
                </div>

                {/* Address */}
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <span className="text-sm text-gray-600">
                    {allActivitiesWithMeta[mapSelectedIndex].neighborhood}, {allActivitiesWithMeta[mapSelectedIndex].city}
                  </span>
                </div>

                {/* Hours */}
                {allActivitiesWithMeta[mapSelectedIndex].openingHours && (
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long' })}: {allActivitiesWithMeta[mapSelectedIndex].openingHours}
                    </span>
                  </div>
                )}

                {/* Day pills */}
                <div className="flex items-center gap-1 mb-3">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <span key={d} className="w-7 h-7 flex items-center justify-center text-xs font-medium bg-violet-100 text-violet-700 rounded">
                      {d}
                    </span>
                  ))}
                  <button className="ml-2 text-sm text-violet-600">Show times</button>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-gray-400">⏱</span>
                  <span className="text-sm text-gray-600">
                    People typically spend {allActivitiesWithMeta[mapSelectedIndex].duration || 30} min here
                  </span>
                </div>

                {/* Open in */}
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-500 mb-2">Open in:</p>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm">Google Maps</button>
                    <button className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm">Apple Maps</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state for map view */}
      {!isLoading && viewMode === 'map' && allActivitiesWithMeta.length === 0 && (
        <div className="text-center py-12">
          <Map className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No activities to show on map</p>
          <p className="text-sm text-gray-400">Auto-fill your trip to see activities</p>
        </div>
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
            onAutoFill={() => autoFillDay(day.dayNumber)}
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
    </div>
  );
}

// ============ DAY CARD COMPONENT ============

interface DayCardProps {
  day: GeneratedDay;
  color: typeof DAY_COLORS[0];
  viewMode: 'picture' | 'compact';
  onActivityTap: (activity: GeneratedActivity, index: number) => void;
  onActivityDelete: (activityId: string) => void;
  onAutoFill: () => void;
}

function DayCard({ day, color, viewMode, onActivityTap, onActivityDelete, onAutoFill }: DayCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showHotelPrompt, setShowHotelPrompt] = useState(true);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const activitySummary = day.activities.map(a => a.name).join(' • ');
  const isEmpty = day.activities.length === 0;

  // Calculate total time for day
  const totalMinutes = day.activities.reduce((sum, a) => sum + (a.duration || 60), 0);
  const totalMiles = day.activities.reduce((sum, a) => sum + (a.walkingTimeToNext || 0) * 0.05, 0);

  return (
    <div className="border-b pb-6">
      {/* Day header - clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left py-4"
      >
        <div className="flex items-center gap-3">
          <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
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
              className="flex items-center gap-1.5 text-primary font-medium hover:underline"
            >
              <Sparkles className="w-4 h-4" />
              Auto-fill day
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

          {/* Activities - Picture View */}
          {!isEmpty && viewMode === 'picture' && (
            <div className="space-y-0">
              {day.activities.map((activity, idx) => (
                <div key={activity.id}>
                  {/* Travel time connector between activities - shows travel from PREVIOUS activity */}
                  {idx > 0 && day.activities[idx - 1].walkingTimeToNext && (
                    <TravelTimeConnector
                      minutes={day.activities[idx - 1].walkingTimeToNext || 10}
                      miles={(day.activities[idx - 1].walkingTimeToNext || 10) * 0.05}
                    />
                  )}
                  <ActivityCard
                    activity={activity}
                    index={idx + 1}
                    color={color}
                    onTap={() => onActivityTap(activity, idx + 1)}
                    onDelete={() => onActivityDelete(activity.id)}
                    showTravelTime={false}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Activities - Compact View (no images) */}
          {!isEmpty && viewMode === 'compact' && (
            <div className="space-y-0 ml-4">
              {day.activities.map((activity, idx) => {
                const isActivityExpanded = expandedActivityId === activity.id;
                const walkingTime = activity.walkingTimeToNext || Math.floor(Math.random() * 15) + 5;
                const walkingMiles = (walkingTime * 0.05).toFixed(2);

                return (
                  <div key={activity.id}>
                    {/* Activity row - expandable */}
                    <div className={`bg-gray-100 rounded-lg ${isActivityExpanded ? 'ring-2 ring-violet-300' : ''}`}>
                      <button
                        onClick={() => setExpandedActivityId(isActivityExpanded ? null : activity.id)}
                        className="w-full flex items-center gap-3 p-3 text-left"
                      >
                        {isActivityExpanded && (
                          <>
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <input type="checkbox" className="w-5 h-5 rounded border-gray-300" onClick={(e) => e.stopPropagation()} />
                          </>
                        )}
                        <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-base text-gray-900">{activity.name}</p>
                          {isActivityExpanded && activity.openingHours && (
                            <p className="text-sm text-gray-600">Open {activity.openingHours} • Add notes, links, etc. here</p>
                          )}
                        </div>
                        {isActivityExpanded && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onActivityDelete(activity.id); }}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </button>

                      {/* Expanded content */}
                      {isActivityExpanded && (
                        <div className="px-3 pb-3 space-y-3">
                          {/* Action buttons */}
                          <div className="flex items-center gap-4 text-sm">
                            <button className="flex items-center gap-1 text-violet-600 hover:text-violet-700">
                              <Clock className="w-4 h-4" />
                              Add time
                            </button>
                            <button className="flex items-center gap-1 text-violet-600 hover:text-violet-700">
                              <span className="text-lg">📎</span>
                              Attach
                            </button>
                            <button className="flex items-center gap-1 text-violet-600 hover:text-violet-700">
                              <DollarSign className="w-4 h-4" />
                              Add cost
                            </button>
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                            <span className="font-medium text-gray-900">4.5</span>
                            <span className="text-gray-500">(1,234)</span>
                            <span className="text-blue-500 text-lg">G</span>
                          </div>

                          {/* Address */}
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                            <span>{activity.neighborhood || day.city}</span>
                          </div>

                          {/* Opening hours */}
                          {activity.openingHours && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}: {activity.openingHours}</span>
                            </div>
                          )}

                          {/* Day pills */}
                          <div className="flex items-center gap-1">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                              <span key={d} className="w-7 h-7 flex items-center justify-center text-xs font-medium bg-violet-100 text-violet-700 rounded">
                                {d}
                              </span>
                            ))}
                            <button className="ml-2 text-sm text-violet-600 hover:underline">Show times</button>
                          </div>

                          {/* Duration */}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>⏱</span>
                            <span>People typically spend {activity.duration || 60} min here</span>
                          </div>

                          {/* Added by / View on map */}
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">Added by you</span>
                            <span className="text-gray-300">·</span>
                            <button className="text-violet-600 hover:underline">View on map</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Walking info below each item */}
                    <div className="flex items-center justify-center gap-2 py-2 text-gray-500">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/>
                      </svg>
                      <span className="text-sm">{walkingTime} min · {walkingMiles} mi</span>
                      <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                        <ChevronDown className="w-3 h-3" />
                        Directions
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add a place */}
          <div className="ml-8 flex items-center gap-3 py-3 px-4 bg-muted/30 rounded-xl border-2 border-dashed border-muted">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Add a place"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
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

  if (!activity) return null;

  // Mock Google rating (in real app, this comes from Google Places API)
  const googleRating = 4.5 + Math.random() * 0.4;
  const reviewCount = Math.floor(1000 + Math.random() * 8000);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-end" onClick={onClose}>
      <div className="bg-background w-full sm:w-96 sm:h-full rounded-t-2xl sm:rounded-none overflow-hidden flex flex-col max-h-[85vh] sm:max-h-full" onClick={(e) => e.stopPropagation()}>
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
              className={`flex-1 py-2 text-sm font-medium capitalize ${
                activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'about' && (
            <div className="space-y-4">
              {/* Name + image */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold">
                      {index}
                    </div>
                    <h3 className="font-bold">{activity.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                </div>
                <img src={activity.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover" />
              </div>

              {/* Added button */}
              <Button variant="outline" size="sm" className="w-full">
                <Check className="w-4 h-4 mr-2" />
                Added
              </Button>

              {/* Category tags */}
              <div className="flex flex-wrap gap-1.5">
                {activity.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs capitalize">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Google rating */}
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold">{googleRating.toFixed(1)}</span>
                <span className="text-muted-foreground text-sm">({reviewCount.toLocaleString()})</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">G</span>
              </div>

              {/* Location */}
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <span>{activity.neighborhood}, Thailand</span>
              </div>

              {/* Opening hours */}
              {activity.openingHours && (
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <span>Open {activity.openingHours}</span>
                </div>
              )}

              {/* Match reasons */}
              {activity.matchReasons.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-700 text-sm">{activity.matchScore}% match for you</span>
                  </div>
                  <ul className="space-y-1">
                    {activity.matchReasons.map((reason, idx) => (
                      <li key={idx} className="text-xs text-green-600 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-green-500" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="text-center text-muted-foreground py-8">
              <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Reviews from Google Places</p>
              <p className="text-xs">Coming soon</p>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="grid grid-cols-2 gap-2">
              <img src={activity.imageUrl} alt="" className="rounded-lg aspect-square object-cover" />
              <img src={activity.imageUrl} alt="" className="rounded-lg aspect-square object-cover opacity-70" />
              <img src={activity.imageUrl} alt="" className="rounded-lg aspect-square object-cover opacity-50" />
              <img src={activity.imageUrl} alt="" className="rounded-lg aspect-square object-cover opacity-30" />
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
