'use client';

import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Plane, Hotel, Camera, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { StoredTrip } from '@/lib/db/indexed-db';
import { tripDb } from '@/lib/db/indexed-db';
import { getDestinationImage } from '@/lib/dashboard/image-utils';
import { cn } from '@/lib/utils';

interface FeaturedTripCardProps {
  trip: StoredTrip | null;
  onTripUpdate?: (trip: StoredTrip) => void;
}

// Country flag mapping
const COUNTRY_FLAGS: Record<string, string> = {
  'thailand': '🇹🇭',
  'japan': '🇯🇵',
  'vietnam': '🇻🇳',
  'korea': '🇰🇷',
  'south korea': '🇰🇷',
  'singapore': '🇸🇬',
  'malaysia': '🇲🇾',
  'indonesia': '🇮🇩',
  'bali': '🇮🇩',
  'philippines': '🇵🇭',
  'taiwan': '🇹🇼',
  'china': '🇨🇳',
  'hong kong': '🇭🇰',
  'india': '🇮🇳',
  'cambodia': '🇰🇭',
  'laos': '🇱🇦',
  'myanmar': '🇲🇲',
  'nepal': '🇳🇵',
  'sri lanka': '🇱🇰',
  'maldives': '🇲🇻',
  'usa': '🇺🇸',
  'united states': '🇺🇸',
  'hawaii': '🇺🇸',
  'canada': '🇨🇦',
  'mexico': '🇲🇽',
  'uk': '🇬🇧',
  'united kingdom': '🇬🇧',
  'england': '🇬🇧',
  'france': '🇫🇷',
  'italy': '🇮🇹',
  'spain': '🇪🇸',
  'germany': '🇩🇪',
  'netherlands': '🇳🇱',
  'portugal': '🇵🇹',
  'greece': '🇬🇷',
  'australia': '🇦🇺',
  'new zealand': '🇳🇿',
  'uae': '🇦🇪',
  'dubai': '🇦🇪',
};

function getFlagForLocation(location: string): string {
  const lower = location.toLowerCase();
  for (const [country, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (lower.includes(country)) return flag;
  }
  return '🌍';
}

function getCountryFromLocation(location: string): string {
  const lower = location.toLowerCase();
  for (const country of Object.keys(COUNTRY_FLAGS)) {
    if (lower.includes(country)) {
      return country.charAt(0).toUpperCase() + country.slice(1);
    }
  }
  return location.split(',').pop()?.trim() || location;
}

export function FeaturedTripCard({ trip, onTripUpdate }: FeaturedTripCardProps) {
  const [customImage, setCustomImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Get countries from bases
    const countries = new Map<string, string>();
    bases.forEach(b => {
      if (b.location) {
        const country = getCountryFromLocation(b.location);
        const flag = getFlagForLocation(b.location);
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
  const destination = itinerary.meta?.destination ||
    itinerary.route?.bases?.[0]?.location?.split(',')[0] || '';
  const photoQuery = destination.split(',')[0]?.trim() || 'travel';
  const defaultImageUrl = getDestinationImage(photoQuery, 600, 400);
  const imageUrl = customImage || trip.itinerary?.meta?.coverImage || defaultImageUrl;

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
        {/* Hero image with gradient overlay */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

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
