'use client';

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
  imageUrl: string;
}

interface Season {
  name: string;
  months: string;
  emoji: string;
  destinations: SeasonalDestination[];
}

const SEASONS: Season[] = [
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
        imageUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80',
      },
      {
        id: 'amsterdam-spring',
        destination: 'Amsterdam',
        country: 'Netherlands',
        why: 'Tulip season at Keukenhof, pleasant cycling weather',
        imageUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&q=80',
      },
      {
        id: 'paris-spring',
        destination: 'Paris',
        country: 'France',
        why: 'Gardens in bloom, outdoor cafés, fewer tourists than summer',
        imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
      },
      {
        id: 'queenstown-spring',
        destination: 'Queenstown',
        country: 'New Zealand',
        why: 'Autumn colors, wine harvest, adventure sports season',
        imageUrl: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600&q=80',
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
        destination: 'Iceland',
        country: 'Nordic',
        why: 'Midnight sun, highland roads open, waterfalls at peak',
        imageUrl: 'https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=600&q=80',
      },
      {
        id: 'dubrovnik-summer',
        destination: 'Dubrovnik',
        country: 'Croatia',
        why: 'Adriatic beaches, Game of Thrones sites, island hopping',
        imageUrl: 'https://images.unsplash.com/photo-1555990538-c48479c0e543?w=600&q=80',
      },
      {
        id: 'alaska-summer',
        destination: 'Alaska',
        country: 'USA',
        why: 'Wildlife viewing, glacier tours, 20+ hours of daylight',
        imageUrl: 'https://images.unsplash.com/photo-1531176175280-33d0e250c4e0?w=600&q=80',
      },
      {
        id: 'santorini-summer',
        destination: 'Santorini',
        country: 'Greece',
        why: 'Iconic sunsets, beach clubs, perfect swimming weather',
        imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80',
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
        imageUrl: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=600&q=80',
      },
      {
        id: 'vermont-fall',
        destination: 'Vermont',
        country: 'USA',
        why: 'Peak fall foliage, apple picking, cozy inns',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
      },
      {
        id: 'munich-fall',
        destination: 'Munich',
        country: 'Germany',
        why: 'Oktoberfest (late Sep), beer gardens, Bavarian Alps',
        imageUrl: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600&q=80',
      },
      {
        id: 'patagonia-fall',
        destination: 'Patagonia',
        country: 'Argentina',
        why: 'Spring wildflowers, fewer crowds, baby wildlife',
        imageUrl: 'https://images.unsplash.com/photo-1531761535209-180857e963b9?w=600&q=80',
      },
    ],
  },
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
        imageUrl: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=600&q=80',
      },
      {
        id: 'tromso-winter',
        destination: 'Tromsø',
        country: 'Norway',
        why: 'Northern lights peak, dog sledding, Arctic adventures',
        imageUrl: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=600&q=80',
      },
      {
        id: 'thailand-winter',
        destination: 'Thailand',
        country: 'Southeast Asia',
        why: 'Dry season, escape winter, temple tours & beaches',
        imageUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
      },
      {
        id: 'swiss-alps-winter',
        destination: 'Swiss Alps',
        country: 'Switzerland',
        why: 'World-class skiing, fondue, scenic train rides',
        imageUrl: 'https://images.unsplash.com/photo-1531310197839-ccf54634509e?w=600&q=80',
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
                  href="/plan"
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                >
                  {/* Background Image */}
                  <img
                    src={dest.imageUrl}
                    alt={dest.destination}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />

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
        <div className="grid grid-cols-2 gap-2">
          {PLACES_TO_AVOID.map((place) => (
            <div
              key={place.id}
              className="p-3 rounded-xl bg-muted/50 border border-muted"
            >
              <div className="flex items-start gap-2">
                <span className="text-base">{place.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{place.destination}</div>
                  <div className="text-xs text-destructive font-medium">{place.reason}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{place.details}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
