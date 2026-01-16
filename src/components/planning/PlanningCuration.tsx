'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Heart,
  MapPin,
  Star,
  Coffee,
  UtensilsCrossed,
  Hotel,
  Compass,
  Building2,
  Plus,
  X,
} from 'lucide-react';

interface Listing {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rating?: number;
  priceLevel?: string;
  category: string;
  neighborhood?: string;
  tags?: string[];
}

interface PlanningCurationProps {
  destination: string;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onAddToSchedule?: (listing: Listing) => void;
}

// Generate mock listings based on destination
function generateListings(destination: string): Record<string, Listing[]> {
  const listings: Record<string, Listing[]> = {
    activities: [
      {
        id: 'act-1',
        name: `${destination} Walking Tour`,
        description: 'Explore the historic streets and hidden gems with a local guide. Perfect for first-time visitors wanting to get oriented.',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
        rating: 4.8,
        priceLevel: '$$',
        category: 'activities',
        tags: ['Walking', 'History', 'Culture'],
      },
      {
        id: 'act-2',
        name: 'Food & Market Tour',
        description: 'Sample local delicacies and visit vibrant markets with a culinary expert. Tastings included.',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
        rating: 4.9,
        priceLevel: '$$$',
        category: 'activities',
        tags: ['Food', 'Local', 'Markets'],
      },
      {
        id: 'act-3',
        name: 'Sunset Viewpoint Tour',
        description: 'Watch the sunset from the best viewpoint in the city. Includes drinks and appetizers.',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
        rating: 4.7,
        priceLevel: '$',
        category: 'activities',
        tags: ['Scenic', 'Photography', 'Romantic'],
      },
      {
        id: 'act-4',
        name: 'Museum & Art Experience',
        description: 'Discover world-class art and cultural exhibits with skip-the-line access.',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
        rating: 4.6,
        priceLevel: '$$',
        category: 'activities',
        tags: ['Art', 'Museum', 'Indoor'],
      },
    ],
    hotels: [
      {
        id: 'hotel-1',
        name: 'Boutique Hotel Central',
        description: 'Charming boutique hotel in the heart of the city. Rooftop bar, complimentary breakfast, and walkable to major attractions.',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
        rating: 4.7,
        priceLevel: '$$$',
        category: 'hotels',
        neighborhood: 'City Center',
        tags: ['Boutique', 'Central', 'Breakfast included'],
      },
      {
        id: 'hotel-2',
        name: 'Grand Heritage Hotel',
        description: 'Luxurious historic property with modern amenities. Full-service spa, fine dining, and concierge.',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
        rating: 4.9,
        priceLevel: '$$$$',
        category: 'hotels',
        neighborhood: 'Old Town',
        tags: ['Luxury', 'Historic', 'Spa'],
      },
      {
        id: 'hotel-3',
        name: 'Urban Hostel & Suites',
        description: 'Budget-friendly with private rooms and social vibes. Rooftop terrace, bar, and weekly events.',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
        rating: 4.4,
        priceLevel: '$',
        category: 'hotels',
        neighborhood: 'Arts District',
        tags: ['Budget', 'Social', 'Rooftop'],
      },
    ],
    neighborhoods: [
      {
        id: 'hood-1',
        name: 'Old Town',
        description: 'Historic center with cobblestone streets and landmarks. Best for sightseeing and traditional restaurants.',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
        category: 'neighborhoods',
        tags: ['Historic', 'Touristy', 'Photogenic'],
      },
      {
        id: 'hood-2',
        name: 'Arts District',
        description: 'Trendy area with galleries, cafes, and nightlife. Best for creatives and night owls.',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
        category: 'neighborhoods',
        tags: ['Trendy', 'Nightlife', 'Art'],
      },
      {
        id: 'hood-3',
        name: 'Waterfront',
        description: 'Scenic promenade with restaurants and views. Perfect for evening strolls and seafood.',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
        category: 'neighborhoods',
        tags: ['Scenic', 'Dining', 'Relaxed'],
      },
    ],
    cafes: [
      {
        id: 'cafe-1',
        name: 'Artisan Coffee House',
        description: 'Third-wave coffee and fresh pastries in a cozy setting. Known for their pour-overs and croissants.',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
        rating: 4.8,
        priceLevel: '$$',
        category: 'cafes',
        neighborhood: 'Old Town',
        tags: ['Specialty Coffee', 'Pastries', 'Cozy'],
      },
      {
        id: 'cafe-2',
        name: 'Garden Terrace Cafe',
        description: 'Beautiful outdoor seating with brunch menu. Weekend reservations recommended.',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
        rating: 4.6,
        priceLevel: '$$',
        category: 'cafes',
        neighborhood: 'Arts District',
        tags: ['Brunch', 'Outdoor', 'Instagram-worthy'],
      },
      {
        id: 'cafe-3',
        name: 'Local Bakery & Cafe',
        description: 'Traditional pastries and local breakfast favorites. Where the locals go.',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
        rating: 4.7,
        priceLevel: '$',
        category: 'cafes',
        neighborhood: 'Residential',
        tags: ['Local Favorite', 'Bakery', 'Authentic'],
      },
    ],
    restaurants: [
      {
        id: 'rest-1',
        name: 'Traditional Kitchen',
        description: 'Authentic local cuisine in a cozy setting. Family recipes passed down through generations.',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
        rating: 4.7,
        priceLevel: '$$',
        category: 'restaurants',
        neighborhood: 'Old Town',
        tags: ['Local Cuisine', 'Traditional', 'Cozy'],
      },
      {
        id: 'rest-2',
        name: 'Rooftop Fine Dining',
        description: 'Upscale dining with panoramic city views. Tasting menu and sommelier recommended.',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
        rating: 4.9,
        priceLevel: '$$$$',
        category: 'restaurants',
        neighborhood: 'City Center',
        tags: ['Fine Dining', 'Views', 'Romantic'],
      },
      {
        id: 'rest-3',
        name: 'Street Food Market',
        description: 'Diverse food stalls and casual atmosphere. Great for sampling multiple cuisines.',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
        rating: 4.5,
        priceLevel: '$',
        category: 'restaurants',
        neighborhood: 'Waterfront',
        tags: ['Street Food', 'Casual', 'Variety'],
      },
      {
        id: 'rest-4',
        name: 'Farm-to-Table Bistro',
        description: 'Seasonal menu with locally sourced ingredients. Intimate setting, natural wines.',
        imageUrl: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
        rating: 4.8,
        priceLevel: '$$$',
        category: 'restaurants',
        neighborhood: 'Arts District',
        tags: ['Farm-to-Table', 'Seasonal', 'Wine'],
      },
    ],
  };

  return listings;
}

const CATEGORY_CONFIG = [
  { key: 'activities', label: 'Things to Do', icon: Compass, color: 'bg-yellow-50 border-yellow-200' },
  { key: 'hotels', label: 'Places to Stay', icon: Hotel, color: 'bg-purple-50 border-purple-200' },
  { key: 'neighborhoods', label: 'Neighborhoods', icon: Building2, color: 'bg-blue-50 border-blue-200' },
  { key: 'cafes', label: 'Cafes', icon: Coffee, color: 'bg-amber-50 border-amber-200' },
  { key: 'restaurants', label: 'Restaurants', icon: UtensilsCrossed, color: 'bg-orange-50 border-orange-200' },
];

export function PlanningCuration({
  destination,
  favorites,
  onToggleFavorite,
  onAddToSchedule,
}: PlanningCurationProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const listings = generateListings(destination);

  return (
    <div className="space-y-4">
      {/* Favorites Summary */}
      {favorites.length > 0 && (
        <Card className="border-pink-200 bg-pink-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              <span className="font-medium text-sm">{favorites.length} Saved</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Your favorites will be used to personalize your itinerary
            </p>
          </CardContent>
        </Card>
      )}

      {/* Category Grid */}
      <div className="grid grid-cols-2 gap-3">
        {CATEGORY_CONFIG.map(({ key, label, icon: Icon, color }) => {
          const categoryListings = listings[key] || [];
          const savedCount = categoryListings.filter(l => favorites.includes(l.id)).length;

          return (
            <button
              key={key}
              onClick={() => setActiveCategory(activeCategory === key ? null : key)}
              className={`p-4 rounded-xl border transition-all text-left ${color} ${
                activeCategory === key ? 'ring-2 ring-primary' : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5 text-muted-foreground" />
                {savedCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Heart className="w-3 h-3 mr-1 fill-pink-500 text-pink-500" />
                    {savedCount}
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-sm">{label}</h3>
              <p className="text-xs text-muted-foreground">{categoryListings.length} options</p>
            </button>
          );
        })}
      </div>

      {/* Expanded Category Listings - Square Grid */}
      {activeCategory && (
        <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {CATEGORY_CONFIG.find(c => c.key === activeCategory)?.label}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveCategory(null)}
              className="text-xs"
            >
              Close
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(listings[activeCategory] || []).map((listing) => (
              <SquareListingCard
                key={listing.id}
                listing={listing}
                isFavorite={favorites.includes(listing.id)}
                onToggleFavorite={() => onToggleFavorite(listing.id)}
                onClick={() => setSelectedListing(listing)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <ListingDetailModal
        listing={selectedListing}
        isOpen={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        isFavorite={selectedListing ? favorites.includes(selectedListing.id) : false}
        onToggleFavorite={() => selectedListing && onToggleFavorite(selectedListing.id)}
        onAddToSchedule={onAddToSchedule && selectedListing ? () => {
          onAddToSchedule(selectedListing);
          setSelectedListing(null);
        } : undefined}
      />
    </div>
  );
}

// Square card for grid display
function SquareListingCard({
  listing,
  isFavorite,
  onToggleFavorite,
  onClick,
}: {
  listing: Listing;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 text-left"
    >
      {/* Background Image */}
      <img
        src={listing.imageUrl}
        alt={listing.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Favorite Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className={`absolute top-2 right-2 p-1.5 rounded-full transition-all z-10 ${
          isFavorite
            ? 'bg-pink-500 text-white'
            : 'bg-white/80 text-gray-600 hover:bg-white'
        }`}
      >
        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
      </button>

      {/* Rating badge */}
      {listing.rating && (
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 rounded-full px-2 py-0.5">
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          <span className="text-xs font-medium">{listing.rating}</span>
        </div>
      )}

      {/* Content */}
      <div className="absolute inset-0 p-3 flex flex-col justify-end text-white">
        <h4 className="font-bold text-sm leading-tight drop-shadow-md line-clamp-2">
          {listing.name}
        </h4>
        {listing.neighborhood && (
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" />
            <span className="text-[10px] opacity-90">{listing.neighborhood}</span>
          </div>
        )}
        {listing.priceLevel && (
          <span className="text-[10px] mt-0.5 opacity-75">{listing.priceLevel}</span>
        )}
      </div>
    </button>
  );
}

// Detail modal for listing
function ListingDetailModal({
  listing,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  onAddToSchedule,
}: {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAddToSchedule?: () => void;
}) {
  if (!listing) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Hero Image */}
        <div className="relative h-48 w-full">
          <img
            src={listing.imageUrl}
            alt={listing.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Rating badge */}
          {listing.rating && (
            <div className="absolute top-4 left-4 flex items-center gap-1 bg-white/90 rounded-full px-2 py-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-semibold">{listing.rating}</span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          <DialogHeader className="space-y-1">
            <div className="flex items-start justify-between">
              <DialogTitle className="text-lg font-bold">{listing.name}</DialogTitle>
              {listing.priceLevel && (
                <span className="text-sm text-muted-foreground">{listing.priceLevel}</span>
              )}
            </div>
            {listing.neighborhood && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{listing.neighborhood}</span>
              </div>
            )}
          </DialogHeader>

          <p className="text-sm text-muted-foreground">{listing.description}</p>

          {/* Tags */}
          {listing.tags && listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {listing.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant={isFavorite ? 'default' : 'outline'}
              onClick={onToggleFavorite}
              className="flex-1"
            >
              <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
              {isFavorite ? 'Saved' : 'Save'}
            </Button>
            {onAddToSchedule && (
              <Button onClick={onAddToSchedule} className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Add to Trip
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { Listing };
