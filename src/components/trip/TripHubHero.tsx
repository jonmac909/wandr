'use client';

import { useState, useEffect } from 'react';
import { getCountryForCity } from '@/lib/geo/city-country';

interface TripHubHeroProps {
  destinations: string[];
  title: string;
  subtitle?: string;
}

export function TripHubHero({ destinations, title, subtitle }: TripHubHeroProps) {
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  // Fetch hero images for destinations
  useEffect(() => {
    const uniqueDestinations = [...new Set(destinations)].slice(0, 4);

    uniqueDestinations.forEach(async (dest) => {
      try {
        const res = await fetch(`/api/city-image?city=${encodeURIComponent(dest)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.imageUrl) {
            setImageUrls(prev => ({ ...prev, [dest]: data.imageUrl }));
          }
        }
      } catch (error) {
        console.error(`Failed to fetch image for ${dest}:`, error);
      }
    });
  }, [destinations]);

  // Determine if multi-country trip
  const countries = new Set(
    destinations.map(dest => getCountryForCity(dest) || dest)
  );
  const isMultiCountry = countries.size > 1;
  const displayDestinations = destinations.slice(0, 4);

  // Single destination - large hero with title below
  if (displayDestinations.length === 1) {
    return (
      <div className="mb-6">
        <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-muted">
          {imageUrls[displayDestinations[0]] ? (
            <img
              src={imageUrls[displayDestinations[0]]}
              alt={displayDestinations[0]}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 animate-pulse" />
          )}
        </div>
        <div className="mt-4 text-center">
          <h1 className="text-xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    );
  }

  // Multi-destination - 4x1 horizontal strip
  return (
    <div className="mb-6">
      <div className="flex gap-1 rounded-xl overflow-hidden">
        {displayDestinations.map((dest) => (
          <div key={dest} className="relative flex-1 aspect-[3/4] bg-muted">
            {imageUrls[dest] ? (
              <img
                src={imageUrls[dest]}
                alt={dest}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 animate-pulse" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 text-white text-sm font-semibold drop-shadow-lg">
              {dest}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <h1 className="text-xl font-bold">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
