'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  X, Star, MapPin, Clock, Phone, Globe,
  ChevronLeft, ChevronRight, Loader2, Info, MessageSquare, Map, Navigation, Locate
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PlaceDetails {
  name: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  formatted_phone_number?: string;
  website?: string;
  url?: string;
  photos?: { url: string; attribution?: string }[];
  reviews?: {
    author_name: string;
    rating: number;
    text: string;
    time: number;
    profile_photo_url?: string;
  }[];
  types?: string[];
  geometry?: {
    location: { lat: number; lng: number };
  };
}

interface PlaceDetailsModalProps {
  location: string;
  onClose: () => void;
}

export function PlaceDetailsModal({ location, onClose }: PlaceDetailsModalProps) {
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('info');

  // Directions state
  const [showDirections, setShowDirections] = useState(false);
  const [startingLocation, setStartingLocation] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [travelMode, setTravelMode] = useState<'driving' | 'walking' | 'transit'>('transit');

  const fetchPlaceDetails = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/places/details?query=${encodeURIComponent(location)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch place details');
      }
      const data = await response.json();
      setPlaceDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load place details');
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchPlaceDetails();
  }, [fetchPlaceDetails]);

  const nextPhoto = () => {
    if (placeDetails?.photos) {
      setCurrentPhotoIndex((prev) => (prev + 1) % placeDetails.photos!.length);
    }
  };

  const prevPhoto = () => {
    if (placeDetails?.photos) {
      setCurrentPhotoIndex((prev) =>
        prev === 0 ? placeDetails.photos!.length - 1 : prev - 1
      );
    }
  };

  const formatPriceLevel = (level?: number) => {
    if (level === undefined) return null;
    return '$'.repeat(level + 1);
  };

  const formatReviewTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return 'Today';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Use a separate, restricted key for Maps Embed only (safe for client-side)
  // This key should ONLY have Maps Embed API enabled and be referrer-restricted
  const getMapEmbedUrl = () => {
    const embedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
    if (!embedKey) {
      // Fallback: return Google Maps URL (will open in new tab instead of embed)
      if (placeDetails?.geometry?.location) {
        const { lat, lng } = placeDetails.geometry.location;
        return `https://www.google.com/maps?q=${lat},${lng}`;
      }
      return `https://www.google.com/maps/search/${encodeURIComponent(location)}`;
    }
    if (placeDetails?.geometry?.location) {
      const { lat, lng } = placeDetails.geometry.location;
      return `https://www.google.com/maps/embed/v1/place?key=${embedKey}&q=${lat},${lng}&zoom=15`;
    }
    return `https://www.google.com/maps/embed/v1/place?key=${embedKey}&q=${encodeURIComponent(location)}`;
  };

  const getDirectionsEmbedUrl = () => {
    const embedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
    const destination = placeDetails?.geometry?.location
      ? `${placeDetails.geometry.location.lat},${placeDetails.geometry.location.lng}`
      : encodeURIComponent(placeDetails?.formatted_address || location);
    const origin = startingLocation ? encodeURIComponent(startingLocation) : 'My+Location';
    if (!embedKey) {
      // Fallback: return Google Maps directions URL
      return `https://www.google.com/maps/dir/${origin}/${destination}`;
    }
    return `https://www.google.com/maps/embed/v1/directions?key=${embedKey}&origin=${origin}&destination=${destination}&mode=${travelMode}`;
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStartingLocation(`${position.coords.latitude},${position.coords.longitude}`);
        setShowDirections(true);
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please enter it manually.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card
        className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">{placeDetails?.name || location}</h2>
            {placeDetails && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {placeDetails.rating && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{placeDetails.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">
                      ({placeDetails.user_ratings_total?.toLocaleString()})
                    </span>
                  </div>
                )}
                {placeDetails.price_level !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    {formatPriceLevel(placeDetails.price_level)}
                  </Badge>
                )}
                {placeDetails.opening_hours && (
                  <Badge
                    variant={placeDetails.opening_hours.open_now ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {placeDetails.opening_hours.open_now ? 'Open' : 'Closed'}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 flex-1">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading place details...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 flex-1">
              <p className="text-destructive mb-4">{error}</p>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Make sure the Google Places API is enabled in your Google Cloud Console.
              </p>
              <Button variant="outline" onClick={fetchPlaceDetails}>
                Try Again
              </Button>
            </div>
          ) : placeDetails ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="w-full justify-start px-4 py-2 h-auto bg-muted/30 shrink-0 rounded-none border-b">
                <TabsTrigger value="info" className="gap-2">
                  <Info className="w-4 h-4" />
                  Info
                </TabsTrigger>
                <TabsTrigger value="map" className="gap-2">
                  <Map className="w-4 h-4" />
                  Map
                </TabsTrigger>
                {placeDetails.reviews && placeDetails.reviews.length > 0 && (
                  <TabsTrigger value="reviews" className="gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Reviews ({placeDetails.reviews.length})
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Info Tab */}
              <TabsContent value="info" className="flex-1 overflow-auto m-0 p-0">
                <div className="space-y-0">
                  {/* Photo Gallery */}
                  {placeDetails.photos && placeDetails.photos.length > 0 && (
                    <div className="relative h-56 bg-muted">
                      <img
                        src={placeDetails.photos[currentPhotoIndex].url}
                        alt={placeDetails.name}
                        className="w-full h-full object-cover"
                      />
                      {placeDetails.photos.length > 1 && (
                        <>
                          <button
                            onClick={prevPhoto}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={nextPhoto}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            {placeDetails.photos.slice(0, 10).map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setCurrentPhotoIndex(idx)}
                                className={cn(
                                  'w-2 h-2 rounded-full transition-colors',
                                  idx === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                                )}
                              />
                            ))}
                          </div>
                          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            {currentPhotoIndex + 1} / {placeDetails.photos.length}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Details */}
                  <div className="p-4 space-y-4">
                    {/* Address */}
                    {placeDetails.formatted_address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 mt-0.5 text-muted-foreground shrink-0" />
                        <span className="text-sm">{placeDetails.formatted_address}</span>
                      </div>
                    )}

                    {/* Opening Hours */}
                    {placeDetails.opening_hours?.weekday_text && (
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="space-y-1">
                          {placeDetails.opening_hours.weekday_text.map((day, idx) => (
                            <div key={idx} className="text-sm text-muted-foreground">{day}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contact Info */}
                    {(placeDetails.formatted_phone_number || placeDetails.website) && (
                      <div className="flex flex-col gap-2">
                        {placeDetails.formatted_phone_number && (
                          <a
                            href={`tel:${placeDetails.formatted_phone_number}`}
                            className="flex items-center gap-3 text-sm text-primary hover:underline"
                          >
                            <Phone className="w-5 h-5" />
                            {placeDetails.formatted_phone_number}
                          </a>
                        )}
                        {placeDetails.website && (
                          <a
                            href={placeDetails.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 text-sm text-primary hover:underline"
                          >
                            <Globe className="w-5 h-5" />
                            Visit Website
                          </a>
                        )}
                      </div>
                    )}

                    {/* Mini Map Preview */}
                    <div
                      className="h-32 rounded-lg overflow-hidden border cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => setActiveTab('map')}
                    >
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0, pointerEvents: 'none' }}
                        loading="lazy"
                        src={getMapEmbedUrl()}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center -mt-2">
                      Click map to expand
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Map Tab - Full Size Embedded Map with Directions */}
              <TabsContent value="map" className="flex-1 m-0 p-0 flex flex-col overflow-hidden">
                {/* Directions Controls */}
                <div className="p-3 border-b bg-muted/30 space-y-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium">Get Directions</span>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Enter starting location..."
                        value={startingLocation}
                        onChange={(e) => setStartingLocation(e.target.value)}
                        className="pr-10 h-9 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && startingLocation) {
                            setShowDirections(true);
                          }
                        }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGetCurrentLocation}
                      disabled={gettingLocation}
                      className="shrink-0 gap-1"
                    >
                      {gettingLocation ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Locate className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">Use GPS</span>
                    </Button>
                    {showDirections && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowDirections(false);
                          setStartingLocation('');
                        }}
                        className="shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Travel Mode Selector */}
                  {showDirections && (
                    <div className="flex gap-1">
                      {(['driving', 'transit', 'walking'] as const).map((mode) => (
                        <Button
                          key={mode}
                          variant={travelMode === mode ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTravelMode(mode)}
                          className="flex-1 capitalize text-xs"
                        >
                          {mode === 'driving' ? '🚗' : mode === 'transit' ? '🚇' : '🚶'} {mode}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Map/Directions Display */}
                <div className="flex-1 min-h-[350px]">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={showDirections ? getDirectionsEmbedUrl() : getMapEmbedUrl()}
                  />
                </div>
              </TabsContent>

              {/* Reviews Tab */}
              {placeDetails.reviews && placeDetails.reviews.length > 0 && (
                <TabsContent value="reviews" className="flex-1 overflow-auto m-0 p-4">
                  <div className="space-y-4">
                    {placeDetails.reviews.map((review, idx) => (
                      <div key={idx} className="p-4 bg-muted/30 rounded-lg space-y-2">
                        <div className="flex items-center gap-3">
                          {review.profile_photo_url ? (
                            <img
                              src={review.profile_photo_url}
                              alt={review.author_name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-lg font-medium text-primary">
                                {review.author_name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{review.author_name}</div>
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={cn(
                                      'w-4 h-4',
                                      i < review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    )}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {formatReviewTime(review.time)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.text}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
