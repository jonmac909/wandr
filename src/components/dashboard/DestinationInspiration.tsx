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
    name: 'Winter',
    months: 'Dec-Feb',
    emoji: '❄️',
    destinations: [
      {
        id: 'vienna-winter',
        destination: 'Vienna',
        country: 'Austria',
        why: 'Christmas markets, opera season, imperial palaces in snow',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
      },
      {
        id: 'tromso-winter',
        destination: 'Tromsø',
        country: 'Norway',
        why: 'Northern lights peak, dog sledding, Arctic adventures',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
      },
      {
        id: 'thailand-winter',
        destination: 'Thailand',
        country: 'Southeast Asia',
        why: 'Dry season, escape winter, temple tours & beaches',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
      },
      {
        id: 'swiss-alps-winter',
        destination: 'Swiss Alps',
        country: 'Switzerland',
        why: 'World-class skiing, fondue, scenic train rides',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
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
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
      },
      {
        id: 'amsterdam-spring',
        destination: 'Amsterdam',
        country: 'Netherlands',
        why: 'Tulip season at Keukenhof, pleasant cycling weather',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
      },
      {
        id: 'paris-spring',
        destination: 'Paris',
        country: 'France',
        why: 'Gardens in bloom, outdoor cafés, fewer tourists than summer',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
      },
      {
        id: 'queenstown-spring',
        destination: 'Queenstown',
        country: 'New Zealand',
        why: 'Autumn colors, wine harvest, adventure sports season',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
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
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
      },
      {
        id: 'dubrovnik-summer',
        destination: 'Dubrovnik',
        country: 'Croatia',
        why: 'Adriatic beaches, Game of Thrones sites, island hopping',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
      },
      {
        id: 'alaska-summer',
        destination: 'Alaska',
        country: 'USA',
        why: 'Wildlife viewing, glacier tours, 20+ hours of daylight',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
      },
      {
        id: 'santorini-summer',
        destination: 'Santorini',
        country: 'Greece',
        why: 'Iconic sunsets, beach clubs, perfect swimming weather',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
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
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
      },
      {
        id: 'vermont-fall',
        destination: 'Vermont',
        country: 'USA',
        why: 'Peak fall foliage, apple picking, cozy inns',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
      },
      {
        id: 'munich-fall',
        destination: 'Munich',
        country: 'Germany',
        why: 'Oktoberfest (late Sep), beer gardens, Bavarian Alps',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
      },
      {
        id: 'patagonia-fall',
        destination: 'Patagonia',
        country: 'Argentina',
        why: 'Spring wildflowers, fewer crowds, baby wildlife',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
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
                  href={`/plan?destination=${encodeURIComponent(dest.destination + ', ' + dest.country)}`}
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
