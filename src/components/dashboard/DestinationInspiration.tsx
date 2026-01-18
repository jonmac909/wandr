'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { StoredTrip } from '@/lib/db/indexed-db';

interface DestinationInspirationProps {
  trips: StoredTrip[];
}

interface SeasonalDestination {
  id: string;
  destination: string;
  country: string;
  why: string;
}

interface Season {
  name: string;
  months: string;
  emoji: string;
  destinations: SeasonalDestination[];
}

const SEASONS: Season[] = [
  {
    name: 'Winter',
    months: 'Dec-Feb',
    emoji: '❄️',
    destinations: [
      {
        id: 'vienna-winter',
        destination: 'Vienna',
        country: 'Austria',
        why: 'Christmas markets, opera season, imperial palaces in snow',
      },
      {
        id: 'tromso-winter',
        destination: 'Tromsø',
        country: 'Norway',
        why: 'Northern lights peak, dog sledding, Arctic adventures',
      },
      {
        id: 'thailand-winter',
        destination: 'Bangkok',
        country: 'Thailand',
        why: 'Dry season, escape winter, temple tours & beaches',
      },
      {
        id: 'swiss-alps-winter',
        destination: 'Zermatt',
        country: 'Switzerland',
        why: 'World-class skiing, fondue, scenic train rides',
      },
    ],
  },
  {
    name: 'Spring',
    months: 'Mar-May',
    emoji: '🌸',
    destinations: [
      {
        id: 'kyoto-spring',
        destination: 'Kyoto',
        country: 'Japan',
        why: 'Cherry blossoms peak, mild weather, before Golden Week crowds',
      },
      {
        id: 'amsterdam-spring',
        destination: 'Amsterdam',
        country: 'Netherlands',
        why: 'Tulip season at Keukenhof, pleasant cycling weather',
      },
      {
        id: 'paris-spring',
        destination: 'Paris',
        country: 'France',
        why: 'Gardens in bloom, outdoor cafés, fewer tourists than summer',
      },
      {
        id: 'queenstown-spring',
        destination: 'Queenstown',
        country: 'New Zealand',
        why: 'Autumn colors, wine harvest, adventure sports season',
      },
    ],
  },
  {
    name: 'Summer',
    months: 'Jun-Aug',
    emoji: '☀️',
    destinations: [
      {
        id: 'iceland-summer',
        destination: 'Reykjavik',
        country: 'Iceland',
        why: 'Midnight sun, highland roads open, waterfalls at peak',
      },
      {
        id: 'dubrovnik-summer',
        destination: 'Dubrovnik',
        country: 'Croatia',
        why: 'Adriatic beaches, Game of Thrones sites, island hopping',
      },
      {
        id: 'alaska-summer',
        destination: 'Anchorage',
        country: 'USA',
        why: 'Wildlife viewing, glacier tours, 20+ hours of daylight',
      },
      {
        id: 'santorini-summer',
        destination: 'Santorini',
        country: 'Greece',
        why: 'Iconic sunsets, beach clubs, perfect swimming weather',
      },
    ],
  },
  {
    name: 'Fall',
    months: 'Sep-Nov',
    emoji: '🍂',
    destinations: [
      {
        id: 'marrakech-fall',
        destination: 'Marrakech',
        country: 'Morocco',
        why: 'Cooler 25°C temps, shoulder season prices, perfect for souks',
      },
      {
        id: 'boston-fall',
        destination: 'Boston',
        country: 'USA',
        why: 'Peak fall foliage, apple picking, historic walks',
      },
      {
        id: 'munich-fall',
        destination: 'Munich',
        country: 'Germany',
        why: 'Oktoberfest (late Sep), beer gardens, Bavarian Alps',
      },
      {
        id: 'buenos-aires-fall',
        destination: 'Buenos Aires',
        country: 'Argentina',
        why: 'Spring wildflowers, fewer crowds, tango season',
      },
    ],
  },
];

// Places to avoid right now (would ideally come from an API)
const PLACES_TO_AVOID = [
  {
    id: 'avoid-bali-summer',
    destination: 'Bali',
    reason: 'Rainy season',
    details: 'Nov-Mar monsoon brings daily heavy rain',
    icon: '🌧️',
  },
  {
    id: 'avoid-caribbean-hurricane',
    destination: 'Caribbean',
    reason: 'Hurricane season',
    details: 'Jun-Nov peak storm activity',
    icon: '🌀',
  },
  {
    id: 'avoid-europe-august',
    destination: 'Europe',
    reason: 'Peak crowds',
    details: 'Aug is most crowded & expensive',
    icon: '👥',
  },
  {
    id: 'avoid-india-summer',
    destination: 'India',
    reason: 'Extreme heat',
    details: 'Apr-Jun temps exceed 40°C',
    icon: '🔥',
  },
];

export function DestinationInspiration({ trips }: DestinationInspirationProps) {
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  // Fetch city images from API (which uses Supabase cache + Google Places)
  useEffect(() => {
    const allDestinations = SEASONS.flatMap(s => s.destinations);

    allDestinations.forEach(async (dest) => {
      try {
        const res = await fetch(`/api/city-image?city=${encodeURIComponent(dest.destination)}&country=${encodeURIComponent(dest.country)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.imageUrl) {
            setImageUrls(prev => ({ ...prev, [dest.id]: data.imageUrl }));
          }
        }
      } catch (error) {
        console.error(`Failed to fetch image for ${dest.destination}:`, error);
      }
    });
  }, []);

  // Filter out places already visited
  const visitedPlaces = new Set<string>();
  trips.forEach(trip => {
    const bases = trip.itinerary?.route?.bases || [];
    bases.forEach(base => {
      const city = (base.location || '').split(',')[0].trim().toLowerCase();
      visitedPlaces.add(city);
    });
  });

  return (
    <div className="space-y-6">
      {SEASONS.map((season) => {
        const availableDestinations = season.destinations.filter(
          dest => !visitedPlaces.has(dest.destination.toLowerCase())
        );

        if (availableDestinations.length === 0) return null;

        return (
          <div key={season.name}>
            {/* Season Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{season.emoji}</span>
              <h3 className="font-semibold text-sm">{season.name}</h3>
              <span className="text-xs text-muted-foreground">{season.months}</span>
            </div>

            {/* Destination Cards - 2x2 grid */}
            <div className="grid grid-cols-2 gap-2">
              {availableDestinations.map((dest) => (
                <Link
                  key={dest.id}
                  href={`/plan?destination=${encodeURIComponent(dest.destination + ', ' + dest.country)}`}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                >
                  {/* Background Image or Loading State */}
                  {imageUrls[dest.id] ? (
                    <img
                      src={imageUrls[dest.id]}
                      alt={dest.destination}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 animate-pulse" />
                  )}

                  {/* Gradient for text */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Content */}
                  <div className="absolute inset-0 p-3 flex flex-col justify-end text-white">
                    <h4 className="font-bold text-sm leading-tight drop-shadow-md">
                      {dest.destination}
                    </h4>
                    <p className="text-[10px] opacity-90 drop-shadow-sm">{dest.country}</p>
                    <p className="text-[10px] mt-0.5 opacity-75 line-clamp-2 leading-tight">
                      {dest.why}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      {/* Places to Avoid */}
      <div className="pt-4 border-t">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">⚠️</span>
          <h3 className="font-semibold text-sm">Skip for Now</h3>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {PLACES_TO_AVOID.map((place) => (
            <div
              key={place.id}
              className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900"
            >
              {/* Red warning stripe */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500" />

              {/* Content */}
              <div className="absolute inset-0 p-2 flex flex-col justify-between text-white">
                <span className="text-xl">{place.icon}</span>
                <div>
                  <h4 className="font-bold text-xs leading-tight">{place.destination}</h4>
                  <p className="text-[9px] text-red-300 font-medium leading-tight">{place.reason}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
