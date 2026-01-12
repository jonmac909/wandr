'use client';

import { useState, useEffect } from 'react';
import { Heart, Star, MapPin, Wifi, Car, UtensilsCrossed, Dumbbell, Waves, Sparkles, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { HotelInfo, HotelPreferences } from '@/lib/planning/hotel-generator';

interface HotelPickerProps {
  city: string;
  country?: string;
  onSelectHotel: (hotel: HotelInfo) => void;
  favoriteHotelIds?: Set<string>;
  preferences?: HotelPreferences; // User preferences for recommendations
  nearbyActivities?: string[]; // Activities user has favorited in this city
}

// Icon mapping for amenities
const amenityIcons: Record<string, React.ReactNode> = {
  'wifi': <Wifi className="w-3 h-3" />,
  'free wifi': <Wifi className="w-3 h-3" />,
  'parking': <Car className="w-3 h-3" />,
  'restaurant': <UtensilsCrossed className="w-3 h-3" />,
  'gym': <Dumbbell className="w-3 h-3" />,
  'fitness': <Dumbbell className="w-3 h-3" />,
  'pool': <Waves className="w-3 h-3" />,
  'spa': <Sparkles className="w-3 h-3" />,
};

// Get price label
function getPriceLabel(priceRange: string): string {
  switch (priceRange) {
    case '$': return 'Budget';
    case '$$': return 'Mid-Range';
    case '$$$': return 'Upscale';
    case '$$$$': return 'Luxury';
    default: return priceRange;
  }
}

// Get price color
function getPriceColor(priceRange: string): string {
  switch (priceRange) {
    case '$': return 'bg-green-100 text-green-700';
    case '$$': return 'bg-blue-100 text-blue-700';
    case '$$$': return 'bg-purple-100 text-purple-700';
    case '$$$$': return 'bg-amber-100 text-amber-700';
    default: return 'bg-muted';
  }
}

export default function HotelPicker({ city, country, onSelectHotel, favoriteHotelIds = new Set(), preferences, nearbyActivities }: HotelPickerProps) {
  const [hotels, setHotels] = useState<HotelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<HotelInfo | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  // Fetch hotels on mount - use POST with preferences if available
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const fetchHotels = async () => {
      try {
        let data: HotelInfo[];

        // Use POST with preferences if we have them
        if (preferences || nearbyActivities) {
          const fullPrefs: HotelPreferences = {
            ...preferences,
            nearbyActivities: nearbyActivities,
          };

          const res = await fetch('/api/hotels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city, country, preferences: fullPrefs }),
          });

          if (!res.ok) throw new Error('Failed to fetch hotels');
          data = await res.json();
        } else {
          // Simple GET without preferences
          const res = await fetch(`/api/hotels?city=${encodeURIComponent(city)}${country ? `&country=${encodeURIComponent(country)}` : ''}`);
          if (!res.ok) throw new Error('Failed to fetch hotels');
          data = await res.json();
        }

        // Sort by match score if available
        if (data.some(h => h.matchScore !== undefined)) {
          data.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        }

        setHotels(data);
      } catch (err) {
        console.error('Error fetching hotels:', err);
        setError('Unable to load hotel recommendations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotels();
  }, [city, country, preferences, nearbyActivities]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Finding the best hotels in {city}...</p>
      </div>
    );
  }

  if (error || hotels.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">{error || `No hotels found for ${city}`}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {hotels.map(hotel => {
          const isFavorited = favoriteHotelIds.has(hotel.id);
          return (
            <div
              key={hotel.id}
              className="relative rounded-xl overflow-hidden bg-card border cursor-pointer hover:border-primary/30 transition-all group"
              onClick={() => setSelectedHotel(hotel)}
            >
              {/* Image */}
              <div className="aspect-[4/3] relative">
                <img
                  src={hotel.imageUrl}
                  alt={hotel.name}
                  className="w-full h-full object-cover"
                />
                {/* Price badge */}
                <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${getPriceColor(hotel.priceRange)}`}>
                  {hotel.priceRange} {getPriceLabel(hotel.priceRange)}
                </div>
                {/* Match score badge */}
                {hotel.matchScore && hotel.matchScore >= 80 && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500 text-white flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {hotel.matchScore}% match
                  </div>
                )}
                {/* Favorite indicator */}
                {isFavorited && !hotel.matchScore && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                    <Heart className="w-3 h-3 text-white fill-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-2.5">
                <h3 className="font-medium text-sm line-clamp-1">{hotel.name}</h3>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-foreground">{hotel.rating.toFixed(1)}</span>
                  <span>({hotel.reviews.toLocaleString()})</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span className="line-clamp-1">{hotel.neighborhood}</span>
                </div>
                <p className="text-xs text-primary font-medium mt-1.5">{hotel.pricePerNight}/night</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hotel Detail Modal */}
      <Dialog open={!!selectedHotel} onOpenChange={(open) => { if (!open) { setSelectedHotel(null); setImageIndex(0); } }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0">
          {selectedHotel && (
            <>
              {/* Image carousel */}
              <div className="relative aspect-[16/10] bg-muted flex-shrink-0">
                <img
                  src={imageIndex === 0 ? selectedHotel.imageUrl : selectedHotel.images[imageIndex - 1]}
                  alt={selectedHotel.name}
                  className="w-full h-full object-cover"
                />
                {/* Image dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {[selectedHotel.imageUrl, ...selectedHotel.images].slice(0, 4).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === imageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
                {/* Price badge */}
                <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium ${getPriceColor(selectedHotel.priceRange)}`}>
                  {selectedHotel.priceRange} {getPriceLabel(selectedHotel.priceRange)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <h2 className="text-lg font-bold">{selectedHotel.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{selectedHotel.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({selectedHotel.reviews.toLocaleString()} reviews)</span>
                    </div>
                    <Badge variant="secondary" className="text-xs capitalize">{selectedHotel.type}</Badge>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedHotel.neighborhood}, {selectedHotel.city}</span>
                  </div>
                </div>

                {/* Price */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-lg font-bold text-primary">{selectedHotel.pricePerNight}</div>
                  <p className="text-xs text-muted-foreground">per night (avg)</p>
                </div>

                {/* Match Score & Reasons */}
                {selectedHotel.matchScore && selectedHotel.matchReasons && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-700">{selectedHotel.matchScore}% match for you</span>
                    </div>
                    <ul className="space-y-1">
                      {selectedHotel.matchReasons.map((reason, idx) => (
                        <li key={idx} className="text-xs text-green-600 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-green-500" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="font-medium text-sm mb-1.5">About</h3>
                  <p className="text-sm text-muted-foreground">{selectedHotel.description}</p>
                </div>

                {/* Highlights */}
                <div>
                  <h3 className="font-medium text-sm mb-1.5">Highlights</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedHotel.highlights.map((h, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">{h}</Badge>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <h3 className="font-medium text-sm mb-1.5">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedHotel.amenities.slice(0, 8).map((amenity, idx) => {
                      const icon = amenityIcons[amenity.toLowerCase()] || null;
                      return (
                        <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                          {icon}
                          <span>{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ideal For */}
                <div>
                  <h3 className="font-medium text-sm mb-1.5">Ideal For</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedHotel.idealFor.map((ideal, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs capitalize">{ideal}</Badge>
                    ))}
                  </div>
                </div>

                {/* Walking Distance */}
                <div>
                  <h3 className="font-medium text-sm mb-1.5">Walking Distance To</h3>
                  <ul className="space-y-1">
                    {selectedHotel.walkingDistance.map((place, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {place}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action bar */}
              <div className="p-4 border-t bg-background flex-shrink-0">
                <Button
                  className="w-full"
                  onClick={() => {
                    onSelectHotel(selectedHotel);
                    setSelectedHotel(null);
                    setImageIndex(0);
                  }}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Add to Trip
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
