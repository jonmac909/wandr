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
  landmark: string; // Iconic landmark for hero image
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
        landmark: 'Vienna Austria cityscape',
      },
      {
        id: 'tromso-winter',
        destination: 'Tromsø',
        country: 'Norway',
        why: 'Northern lights peak, dog sledding, Arctic adventures',
        landmark: 'Tromsø Norway northern lights',
      },
      {
        id: 'thailand-winter',
        destination: 'Bangkok',
        country: 'Thailand',
        why: 'Dry season, escape winter, temple tours & beaches',
        landmark: 'Bangkok Thailand skyline',
      },
      {
        id: 'swiss-alps-winter',
        destination: 'Zermatt',
        country: 'Switzerland',
        why: 'World-class skiing, fondue, scenic train rides',
        landmark: 'Zermatt Matterhorn view',
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
        landmark: 'Kyoto Japan cherry blossoms',
      },
      {
        id: 'amsterdam-spring',
        destination: 'Amsterdam',
        country: 'Netherlands',
        why: 'Tulip season at Keukenhof, pleasant cycling weather',
        landmark: 'Amsterdam Netherlands canals',
      },
      {
        id: 'paris-spring',
        destination: 'Paris',
        country: 'France',
        why: 'Gardens in bloom, outdoor cafés, fewer tourists than summer',
        landmark: 'Paris France cityscape',
      },
      {
        id: 'queenstown-spring',
        destination: 'Queenstown',
        country: 'New Zealand',
        why: 'Autumn colors, wine harvest, adventure sports season',
        landmark: 'Queenstown New Zealand lake mountains',
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
        landmark: 'Iceland landscape waterfall',
      },
      {
        id: 'dubrovnik-summer',
        destination: 'Dubrovnik',
        country: 'Croatia',
        why: 'Adriatic beaches, Game of Thrones sites, island hopping',
        landmark: 'Dubrovnik Croatia old town aerial',
      },
      {
        id: 'alaska-summer',
        destination: 'Anchorage',
        country: 'USA',
        why: 'Wildlife viewing, glacier tours, 20+ hours of daylight',
        landmark: 'Alaska mountains glacier',
      },
      {
        id: 'santorini-summer',
        destination: 'Santorini',
        country: 'Greece',
        why: 'Iconic sunsets, beach clubs, perfect swimming weather',
        landmark: 'Santorini Greece sunset view',
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
        landmark: 'Marrakech Morocco medina',
      },
      {
        id: 'boston-fall',
        destination: 'Boston',
        country: 'USA',
        why: 'Peak fall foliage, apple picking, historic walks',
        landmark: 'Boston Massachusetts fall foliage',
      },
      {
        id: 'munich-fall',
        destination: 'Munich',
        country: 'Germany',
        why: 'Oktoberfest (late Sep), beer gardens, Bavarian Alps',
        landmark: 'Munich Germany cityscape',
      },
      {
        id: 'buenos-aires-fall',
        destination: 'Buenos Aires',
        country: 'Argentina',
        why: 'Spring wildflowers, fewer crowds, tango season',
        landmark: 'Buenos Aires Argentina cityscape',
      },
    ],
  },
];

// Places to avoid right now (would ideally come from an API)
const PLACES_TO_AVOID = [
  {
    id: 'avoid-bali-summer',
    destination: 'Bali',
    landmark: 'Bali Indonesia rice terraces',
    reason: 'Rainy season',
    details: 'Nov-Mar monsoon brings daily heavy rain',
    icon: '🌧️',
  },
  {
    id: 'avoid-caribbean-hurricane',
    destination: 'Caribbean',
    landmark: 'Caribbean beach tropical',
    reason: 'Hurricane season',
    details: 'Jun-Nov peak storm activity',
    icon: '🌀',
  },
  {
    id: 'avoid-europe-august',
    destination: 'Europe',
    landmark: 'Rome Italy cityscape',
    reason: 'Peak crowds',
    details: 'Aug is most crowded & expensive',
    icon: '👥',
  },
  {
    id: 'avoid-india-summer',
    destination: 'India',
    landmark: 'India landscape panorama',
    reason: 'Extreme heat',
    details: 'Apr-Jun temps exceed 40°C',
    icon: '🔥',
  },
];

export function DestinationInspiration({ trips }: DestinationInspirationProps) {
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  // Fetch city images from API (which uses Supabase cache + Google Places)
  useEffect(() => {
    // Fetch seasonal destination images using city name and country
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

    // Fetch images for places to avoid
    PLACES_TO_AVOID.forEach(async (place) => {
      try {
        const res = await fetch(`/api/city-image?city=${encodeURIComponent(place.destination)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.imageUrl) {
            setImageUrls(prev => ({ ...prev, [place.id]: data.imageUrl }));
          }
        }
      } catch (error) {
        console.error(`Failed to fetch image for ${place.destination}:`, error);
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
              className="relative aspect-square rounded-xl overflow-hidden"
            >
              {/* Background Image or Loading State */}
              {imageUrls[place.id] ? (
                <img
                  src={imageUrls[place.id]}
                  alt={place.destination}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 animate-pulse" />
              )}

              {/* Dark overlay for warning effect */}
              <div className="absolute inset-0 bg-black/50" />

              {/* Red warning stripe */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 z-10" />

              {/* Content */}
              <div className="absolute inset-0 p-2 flex flex-col justify-between text-white z-10">
                <span className="text-xl drop-shadow-md">{place.icon}</span>
                <div>
                  <h4 className="font-bold text-xs leading-tight drop-shadow-md">{place.destination}</h4>
                  <p className="text-[9px] text-red-300 font-medium leading-tight drop-shadow-sm">{place.reason}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
