'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Plane, Hotel, Camera, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { StoredTrip } from '@/lib/db/indexed-db';
import { tripDb } from '@/lib/db/indexed-db';
import { cn } from '@/lib/utils';

interface FeaturedTripCardProps {
  trip: StoredTrip | null;
  onTripUpdate?: (trip: StoredTrip) => void;
}

// City to country mapping for flag lookup
const CITY_TO_COUNTRY: Record<string, { country: string; flag: string }> = {
  // Japan
  'tokyo': { country: 'Japan', flag: '🇯🇵' },
  'narita': { country: 'Japan', flag: '🇯🇵' },
  'osaka': { country: 'Japan', flag: '🇯🇵' },
  'kyoto': { country: 'Japan', flag: '🇯🇵' },
  'onsen': { country: 'Japan', flag: '🇯🇵' },
  'hakone': { country: 'Japan', flag: '🇯🇵' },
  'nara': { country: 'Japan', flag: '🇯🇵' },
  'hiroshima': { country: 'Japan', flag: '🇯🇵' },
  'fukuoka': { country: 'Japan', flag: '🇯🇵' },
  'sapporo': { country: 'Japan', flag: '🇯🇵' },
  // Thailand
  'bangkok': { country: 'Thailand', flag: '🇹🇭' },
  'chiang mai': { country: 'Thailand', flag: '🇹🇭' },
  'phuket': { country: 'Thailand', flag: '🇹🇭' },
  'krabi': { country: 'Thailand', flag: '🇹🇭' },
  'koh samui': { country: 'Thailand', flag: '🇹🇭' },
  'koh phangan': { country: 'Thailand', flag: '🇹🇭' },
  'koh tao': { country: 'Thailand', flag: '🇹🇭' },
  'phi phi': { country: 'Thailand', flag: '🇹🇭' },
  'pattaya': { country: 'Thailand', flag: '🇹🇭' },
  'ayutthaya': { country: 'Thailand', flag: '🇹🇭' },
  // Vietnam
  'hanoi': { country: 'Vietnam', flag: '🇻🇳' },
  'ho chi minh': { country: 'Vietnam', flag: '🇻🇳' },
  'saigon': { country: 'Vietnam', flag: '🇻🇳' },
  'da nang': { country: 'Vietnam', flag: '🇻🇳' },
  'hoi an': { country: 'Vietnam', flag: '🇻🇳' },
  'nha trang': { country: 'Vietnam', flag: '🇻🇳' },
  'hue': { country: 'Vietnam', flag: '🇻🇳' },
  'ha long': { country: 'Vietnam', flag: '🇻🇳' },
  'sapa': { country: 'Vietnam', flag: '🇻🇳' },
  // USA / Hawaii
  'honolulu': { country: 'Hawaii', flag: '🇺🇸' },
  'hawaii': { country: 'Hawaii', flag: '🇺🇸' },
  'oahu': { country: 'Hawaii', flag: '🇺🇸' },
  'maui': { country: 'Hawaii', flag: '🇺🇸' },
  'waikiki': { country: 'Hawaii', flag: '🇺🇸' },
  'kona': { country: 'Hawaii', flag: '🇺🇸' },
  'new york': { country: 'USA', flag: '🇺🇸' },
  'los angeles': { country: 'USA', flag: '🇺🇸' },
  'san francisco': { country: 'USA', flag: '🇺🇸' },
  'las vegas': { country: 'USA', flag: '🇺🇸' },
  // Other SE Asia
  'singapore': { country: 'Singapore', flag: '🇸🇬' },
  'bali': { country: 'Indonesia', flag: '🇮🇩' },
  'ubud': { country: 'Indonesia', flag: '🇮🇩' },
  'jakarta': { country: 'Indonesia', flag: '🇮🇩' },
  'kuala lumpur': { country: 'Malaysia', flag: '🇲🇾' },
  'penang': { country: 'Malaysia', flag: '🇲🇾' },
  'langkawi': { country: 'Malaysia', flag: '🇲🇾' },
  'manila': { country: 'Philippines', flag: '🇵🇭' },
  'cebu': { country: 'Philippines', flag: '🇵🇭' },
  'boracay': { country: 'Philippines', flag: '🇵🇭' },
  'taipei': { country: 'Taiwan', flag: '🇹🇼' },
  'hong kong': { country: 'Hong Kong', flag: '🇭🇰' },
  'seoul': { country: 'South Korea', flag: '🇰🇷' },
  'busan': { country: 'South Korea', flag: '🇰🇷' },
  'siem reap': { country: 'Cambodia', flag: '🇰🇭' },
  'phnom penh': { country: 'Cambodia', flag: '🇰🇭' },
  'luang prabang': { country: 'Laos', flag: '🇱🇦' },
  'vientiane': { country: 'Laos', flag: '🇱🇦' },
  // Europe
  'london': { country: 'UK', flag: '🇬🇧' },
  'paris': { country: 'France', flag: '🇫🇷' },
  'rome': { country: 'Italy', flag: '🇮🇹' },
  'barcelona': { country: 'Spain', flag: '🇪🇸' },
  'amsterdam': { country: 'Netherlands', flag: '🇳🇱' },
  'berlin': { country: 'Germany', flag: '🇩🇪' },
  'lisbon': { country: 'Portugal', flag: '🇵🇹' },
  'athens': { country: 'Greece', flag: '🇬🇷' },
  // Canada
  'vancouver': { country: 'Canada', flag: '🇨🇦' },
  'toronto': { country: 'Canada', flag: '🇨🇦' },
  'kelowna': { country: 'Canada', flag: '🇨🇦' },
  // Australia/NZ
  'sydney': { country: 'Australia', flag: '🇦🇺' },
  'melbourne': { country: 'Australia', flag: '🇦🇺' },
  'auckland': { country: 'New Zealand', flag: '🇳🇿' },
  // Other
  'dubai': { country: 'UAE', flag: '🇦🇪' },
  'mumbai': { country: 'India', flag: '🇮🇳' },
  'delhi': { country: 'India', flag: '🇮🇳' },
  'maldives': { country: 'Maldives', flag: '🇲🇻' },
  'male': { country: 'Maldives', flag: '🇲🇻' },
};

function getFlagAndCountry(location: string): { country: string; flag: string } {
  const lower = location.toLowerCase().trim();

  // Check exact city match first
  for (const [city, data] of Object.entries(CITY_TO_COUNTRY)) {
    if (lower.includes(city)) {
      return data;
    }
  }

  // Fallback - try to extract from location string
  const cityName = location.split(',')[0].trim();
  return { country: cityName, flag: '🌍' };
}

export function FeaturedTripCard({ trip, onTripUpdate }: FeaturedTripCardProps) {
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [fetchedImageUrl, setFetchedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get destination for image fetch (must be before any early returns)
  const destination = trip?.itinerary?.meta?.destination ||
    trip?.itinerary?.route?.bases?.[0]?.location?.split(',')[0] || '';
  const photoQuery = destination.split(',')[0]?.trim() || '';

  // Fetch image from API
  useEffect(() => {
    if (!photoQuery || customImage || trip?.itinerary?.meta?.coverImage) return;
    fetch(`/api/city-image?city=${encodeURIComponent(photoQuery)}`)
      .then(res => res.json())
      .then(data => { if (data.imageUrl) setFetchedImageUrl(data.imageUrl); })
      .catch(() => {});
  }, [photoQuery, customImage, trip?.itinerary?.meta?.coverImage]);

  // Calculate trip stats
  const stats = useMemo(() => {
    if (!trip?.itinerary) return null;

    const { itinerary } = trip;
    const days = itinerary.days || [];
    const bases = itinerary.route?.bases || [];

    // Get all unique locations/cities
    const allLocations = new Set<string>();
    bases.forEach(b => {
      if (b.location) allLocations.add(b.location.split(',')[0].trim());
    });

    // Get countries from bases using city-to-country lookup
    const countries = new Map<string, string>();
    bases.forEach(b => {
      if (b.location) {
        const { country, flag } = getFlagAndCountry(b.location);
        if (!countries.has(country)) {
          countries.set(country, flag);
        }
      }
    });

    // Count flights
    const flightCount = days.reduce((acc, d) =>
      acc + (d.blocks?.filter(b => b.activity?.category === 'flight').length || 0), 0);

    // Count hotels
    const hotelCount = bases.filter(b => b.accommodation?.name).length;

    // Calculate total days
    const startDate = itinerary.meta?.startDate;
    const endDate = itinerary.meta?.endDate;
    let totalDays = days.length;
    if (startDate && endDate) {
      const [y1, m1, d1] = startDate.split('-').map(Number);
      const [y2, m2, d2] = endDate.split('-').map(Number);
      const start = new Date(y1, m1 - 1, d1);
      const end = new Date(y2, m2 - 1, d2);
      totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }

    return {
      totalDays,
      countries: Array.from(countries.entries()),
      cityCount: allLocations.size,
      flightCount,
      hotelCount,
    };
  }, [trip]);

  if (!trip || !trip.itinerary) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-8 text-center">
          <div className="text-5xl mb-4">🌍</div>
          <h3 className="text-xl font-semibold mb-2">No upcoming trips</h3>
          <p className="text-muted-foreground">
            Start planning your next adventure!
          </p>
        </CardContent>
      </Card>
    );
  }

  const { itinerary } = trip;
  const title = itinerary.meta?.title || 'Untitled Trip';
  const imageUrl = customImage || trip.itinerary?.meta?.coverImage || fetchedImageUrl;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Image = event.target?.result as string;
      setCustomImage(base64Image);

      if (trip.itinerary) {
        const updatedItinerary = {
          ...trip.itinerary,
          meta: {
            ...trip.itinerary.meta,
            coverImage: base64Image,
          },
          updatedAt: new Date(),
        };

        const updatedTrip = {
          ...trip,
          itinerary: updatedItinerary,
        };

        await tripDb.save(updatedTrip);
        onTripUpdate?.(updatedTrip);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerImageUpload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  // Format date range nicely
  const formatDateRange = (start?: string, end?: string): string => {
    if (!start) return '';
    const [y1, m1, d1] = start.split('-').map(Number);
    const startDate = new Date(y1, m1 - 1, d1);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (!end) return `${months[m1 - 1]} ${d1}`;

    const [y2, m2, d2] = end.split('-').map(Number);
    if (m1 === m2 && y1 === y2) {
      return `${months[m1 - 1]} ${d1}-${d2}`;
    }
    return `${months[m1 - 1]} ${d1} – ${months[m2 - 1]} ${d2}`;
  };

  return (
    <Link href={`/trip/${trip.id}`} className="block group">
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-md">
        {/* Hero image with gradient overlay - rounded square */}
        <div className="relative aspect-square max-h-48 overflow-hidden rounded-xl m-3 mb-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-xl"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-100 to-purple-200 flex items-center justify-center rounded-xl">
              <span className="text-4xl">✈️</span>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-xl" />

          {/* Upload button */}
          <button
            type="button"
            onClick={triggerImageUpload}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/30"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Title and date overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <Calendar className="w-4 h-4" />
              <span>{formatDateRange(itinerary.meta?.startDate, itinerary.meta?.endDate)}</span>
              <span className="text-white/60">•</span>
              <span>{stats?.totalDays} days</span>
            </div>
          </div>
        </div>

        {/* Stats section */}
        <CardContent className="p-4">
          {/* Countries with flags */}
          {stats && stats.countries.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {stats.countries.map(([country, flag]) => (
                  <span
                    key={country}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted"
                  >
                    <span className="text-base">{flag}</span>
                    {country}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick stats row */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              {stats && stats.cityCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{stats.cityCount} {stats.cityCount === 1 ? 'city' : 'cities'}</span>
                </div>
              )}
              {stats && stats.flightCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Plane className="w-4 h-4" />
                  <span>{stats.flightCount} {stats.flightCount === 1 ? 'flight' : 'flights'}</span>
                </div>
              )}
              {stats && stats.hotelCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Hotel className="w-4 h-4" />
                  <span>{stats.hotelCount} {stats.hotelCount === 1 ? 'hotel' : 'hotels'}</span>
                </div>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
