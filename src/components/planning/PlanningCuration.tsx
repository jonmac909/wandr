'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  MapPin,
  Star,
  Coffee,
  UtensilsCrossed,
  Hotel,
  Compass,
  Building2,
  ChevronRight,
  Plus,
  Check,
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
  const destLower = destination.toLowerCase();

  // Default listings with destination-aware content
  const listings: Record<string, Listing[]> = {
    activities: [
      {
        id: 'act-1',
        name: `${destination} Walking Tour`,
        description: 'Explore the historic streets and hidden gems with a local guide',
        imageUrl: `https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=400&q=80`,
        rating: 4.8,
        priceLevel: '$$',
        category: 'activities',
        tags: ['Walking', 'History', 'Culture'],
      },
      {
        id: 'act-2',
        name: 'Food & Market Tour',
        description: 'Sample local delicacies and visit vibrant markets',
        imageUrl: `https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80`,
        rating: 4.9,
        priceLevel: '$$$',
        category: 'activities',
        tags: ['Food', 'Local', 'Markets'],
      },
      {
        id: 'act-3',
        name: 'Sunset Experience',
        description: 'Watch the sunset from the best viewpoint in the city',
        imageUrl: `https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=400&q=80`,
        rating: 4.7,
        priceLevel: '$',
        category: 'activities',
        tags: ['Scenic', 'Photography', 'Romantic'],
      },
      {
        id: 'act-4',
        name: 'Museum & Art Gallery',
        description: 'Discover world-class art and cultural exhibits',
        imageUrl: `https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=400&q=80`,
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
        description: 'Charming boutique hotel in the heart of the city',
        imageUrl: `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80`,
        rating: 4.7,
        priceLevel: '$$$',
        category: 'hotels',
        neighborhood: 'City Center',
        tags: ['Boutique', 'Central', 'Breakfast included'],
      },
      {
        id: 'hotel-2',
        name: 'Grand Heritage Hotel',
        description: 'Luxurious historic property with modern amenities',
        imageUrl: `https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80`,
        rating: 4.9,
        priceLevel: '$$$$',
        category: 'hotels',
        neighborhood: 'Old Town',
        tags: ['Luxury', 'Historic', 'Spa'],
      },
      {
        id: 'hotel-3',
        name: 'Urban Hostel & Suites',
        description: 'Budget-friendly with private rooms and social vibes',
        imageUrl: `https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&q=80`,
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
        description: 'Historic center with cobblestone streets and landmarks',
        imageUrl: `https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=400&q=80`,
        category: 'neighborhoods',
        tags: ['Historic', 'Touristy', 'Photogenic'],
      },
      {
        id: 'hood-2',
        name: 'Arts District',
        description: 'Trendy area with galleries, cafes, and nightlife',
        imageUrl: `https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&q=80`,
        category: 'neighborhoods',
        tags: ['Trendy', 'Nightlife', 'Art'],
      },
      {
        id: 'hood-3',
        name: 'Waterfront',
        description: 'Scenic promenade with restaurants and views',
        imageUrl: `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80`,
        category: 'neighborhoods',
        tags: ['Scenic', 'Dining', 'Relaxed'],
      },
    ],
    cafes: [
      {
        id: 'cafe-1',
        name: 'Artisan Coffee House',
        description: 'Third-wave coffee and fresh pastries',
        imageUrl: `https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=80`,
        rating: 4.8,
        priceLevel: '$$',
        category: 'cafes',
        neighborhood: 'Old Town',
        tags: ['Specialty Coffee', 'Pastries', 'Cozy'],
      },
      {
        id: 'cafe-2',
        name: 'Garden Terrace Cafe',
        description: 'Beautiful outdoor seating with brunch menu',
        imageUrl: `https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80`,
        rating: 4.6,
        priceLevel: '$$',
        category: 'cafes',
        neighborhood: 'Arts District',
        tags: ['Brunch', 'Outdoor', 'Instagram-worthy'],
      },
      {
        id: 'cafe-3',
        name: 'Local Bakery & Cafe',
        description: 'Traditional pastries and local breakfast favorites',
        imageUrl: `https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80`,
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
        description: 'Authentic local cuisine in a cozy setting',
        imageUrl: `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80`,
        rating: 4.7,
        priceLevel: '$$',
        category: 'restaurants',
        neighborhood: 'Old Town',
        tags: ['Local Cuisine', 'Traditional', 'Cozy'],
      },
      {
        id: 'rest-2',
        name: 'Rooftop Fine Dining',
        description: 'Upscale dining with panoramic city views',
        imageUrl: `https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&q=80`,
        rating: 4.9,
        priceLevel: '$$$$',
        category: 'restaurants',
        neighborhood: 'City Center',
        tags: ['Fine Dining', 'Views', 'Romantic'],
      },
      {
        id: 'rest-3',
        name: 'Street Food Market',
        description: 'Diverse food stalls and casual atmosphere',
        imageUrl: `https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80`,
        rating: 4.5,
        priceLevel: '$',
        category: 'restaurants',
        neighborhood: 'Waterfront',
        tags: ['Street Food', 'Casual', 'Variety'],
      },
      {
        id: 'rest-4',
        name: 'Farm-to-Table Bistro',
        description: 'Seasonal menu with locally sourced ingredients',
        imageUrl: `https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80`,
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

      {/* Expanded Category Listings */}
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

          <div className="space-y-3">
            {(listings[activeCategory] || []).map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorite={favorites.includes(listing.id)}
                onToggleFavorite={() => onToggleFavorite(listing.id)}
                onAddToSchedule={onAddToSchedule ? () => onAddToSchedule(listing) : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ListingCard({
  listing,
  isFavorite,
  onToggleFavorite,
  onAddToSchedule,
}: {
  listing: Listing;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAddToSchedule?: () => void;
}) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex">
        {/* Image */}
        <div className="w-28 h-28 flex-shrink-0 relative">
          <img
            src={listing.imageUrl}
            alt={listing.name}
            className="w-full h-full object-cover"
          />
          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={`absolute top-2 right-2 p-1.5 rounded-full transition-all ${
              isFavorite
                ? 'bg-pink-500 text-white'
                : 'bg-white/80 text-gray-600 hover:bg-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Content */}
        <CardContent className="flex-1 p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm line-clamp-1">{listing.name}</h4>
              {listing.priceLevel && (
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {listing.priceLevel}
                </span>
              )}
            </div>

            {listing.rating && (
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-medium">{listing.rating}</span>
              </div>
            )}

            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {listing.description}
            </p>
          </div>

          {/* Tags */}
          {listing.tags && listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {listing.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 bg-muted rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Add to Schedule Button */}
          {onAddToSchedule && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onAddToSchedule();
              }}
              className="mt-2 h-7 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add to Schedule
            </Button>
          )}
        </CardContent>
      </div>
    </Card>
  );
}

export type { Listing };
