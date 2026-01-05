'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  X, Star, MapPin, Loader2, ExternalLink, Plus, Coffee, UtensilsCrossed, Moon, DollarSign
} from 'lucide-react';
import { FoodRecommendation, FoodType, PriceRange } from '@/types/itinerary';
import { cn } from '@/lib/utils';

interface RestaurantResult {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  priceLevel: number;
  cuisine: string;
  mapsUrl: string;
  photoUrl?: string;
  isOpen?: boolean;
}

interface FoodRecommendationModalProps {
  location: string;
  date: string;
  dayId: string;
  onClose: () => void;
  onAddRecommendation: (recommendation: FoodRecommendation) => void;
}

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: Coffee },
  { id: 'lunch', label: 'Lunch', icon: UtensilsCrossed },
  { id: 'dinner', label: 'Dinner', icon: Moon },
] as const;

const BUDGET_TIERS = [
  { id: 'budget', label: 'Budget', icon: '$', description: 'Affordable eats' },
  { id: 'moderate', label: 'Moderate', icon: '$$', description: 'Good value' },
  { id: 'splurge', label: 'Splurge', icon: '$$$', description: 'Special occasion' },
] as const;

const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'rating', label: 'Highest Rated' },
  { id: 'reviews', label: 'Most Reviews' },
] as const;


function priceLevelToRange(level: number): PriceRange {
  switch (level) {
    case 1: return '$';
    case 2: return '$$';
    case 3: return '$$$';
    case 4: return '$$$$';
    default: return '$$';
  }
}

function budgetToFoodType(budget: string): FoodType {
  switch (budget) {
    case 'budget': return 'casual-backup';
    case 'splurge': return 'splurge';
    default: return 'local-classic';
  }
}

export function FoodRecommendationModal({
  location,
  date,
  dayId,
  onClose,
  onAddRecommendation,
}: FoodRecommendationModalProps) {
  const [mealType, setMealType] = useState<string>('dinner');
  const [budget, setBudget] = useState<string>('moderate');
  const [minRating, setMinRating] = useState<number>(4.0);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [restaurants, setRestaurants] = useState<RestaurantResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [displayCount, setDisplayCount] = useState(10);
  const RESULTS_PER_PAGE = 10;

  const searchRestaurants = async () => {
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const params = new URLSearchParams({
        location,
        mealType,
        budget,
        count: '100',
        minRating: minRating.toString(),
        sortBy,
      });

      const response = await fetch(`/api/places/restaurants?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch restaurants');
      }

      const data = await response.json();
      setRestaurants(data.restaurants || []);
      setDisplayCount(RESULTS_PER_PAGE); // Reset pagination on new search
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRestaurant = (restaurant: RestaurantResult) => {
    const recommendation: FoodRecommendation = {
      id: `food-${dayId}-${restaurant.id}`,
      dayId,
      type: budgetToFoodType(budget),
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      location: {
        name: restaurant.name,
        address: restaurant.address,
      },
      priceRange: priceLevelToRange(restaurant.priceLevel),
      reservationRequired: budget === 'splurge',
      skipTheHype: false,
      notes: `${restaurant.rating}⭐ (${restaurant.reviewCount} reviews) - ${restaurant.cuisine}`,
      mealTime: mealType as 'breakfast' | 'lunch' | 'dinner',
    };

    onAddRecommendation(recommendation);
    setAddedIds(new Set([...addedIds, restaurant.id]));
  };

  // Sort restaurants client-side when sortBy changes
  const sortedRestaurants = useMemo(() => {
    if (restaurants.length === 0) return restaurants;

    return [...restaurants].sort((a, b) => {
      switch (sortBy) {
        case 'reviews':
          return b.reviewCount - a.reviewCount;
        case 'rating':
          if (b.rating !== a.rating) return b.rating - a.rating;
          return b.reviewCount - a.reviewCount;
        case 'relevance':
        default:
          // Combined score: rating weighted by log of review count
          const scoreA = a.rating * Math.log10(a.reviewCount + 1);
          const scoreB = b.rating * Math.log10(b.reviewCount + 1);
          return scoreB - scoreA;
      }
    });
  }, [restaurants, sortBy]);

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Restaurant Recommendations</h2>
            <p className="text-sm text-muted-foreground">
              {location} • {formattedDate}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <CardContent className="pt-4 space-y-6">
            {/* Meal Type Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Meal</label>
              <div className="flex gap-2">
                {MEAL_TYPES.map((meal) => (
                  <Button
                    key={meal.id}
                    variant={mealType === meal.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMealType(meal.id)}
                    className="flex-1 gap-2"
                  >
                    <meal.icon className="w-4 h-4" />
                    {meal.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Budget Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Budget</label>
              <div className="flex gap-2">
                {BUDGET_TIERS.map((tier) => (
                  <Button
                    key={tier.id}
                    variant={budget === tier.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBudget(tier.id)}
                    className="flex-1 flex-col h-auto py-2"
                  >
                    <span className="text-lg">{tier.icon}</span>
                    <span className="text-xs">{tier.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Minimum Rating Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Minimum Rating</label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {minRating === 0 ? 'Any rating' : `${minRating.toFixed(1)}+ stars`}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{minRating === 0 ? 'All' : minRating.toFixed(1)}</span>
                  </div>
                </div>
                <Slider
                  value={[minRating]}
                  onValueChange={(values) => setMinRating(values[0])}
                  min={0}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Any</span>
                  <span>5.0</span>
                </div>
              </div>
            </div>

            {/* Sort By Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Sort By</label>
              <div className="flex gap-2">
                {SORT_OPTIONS.map((option) => (
                  <Button
                    key={option.id}
                    variant={sortBy === option.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy(option.id)}
                    className="flex-1"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Search Button */}
            <Button
              onClick={searchRestaurants}
              disabled={loading}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <UtensilsCrossed className="w-4 h-4" />
                  Find {MEAL_TYPES.find(m => m.id === mealType)?.label} Spots
                </>
              )}
            </Button>

            {/* Error */}
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Results */}
            {searched && !loading && (
              <div className="space-y-3">
                {restaurants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No restaurants found for this criteria.</p>
                    <p className="text-sm">Try adjusting the budget or meal type.</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Showing {Math.min(displayCount, restaurants.length)} of {restaurants.length} restaurants
                    </h3>
                    {sortedRestaurants.slice(0, displayCount).map((restaurant) => (
                      <RestaurantCard
                        key={restaurant.id}
                        restaurant={restaurant}
                        isAdded={addedIds.has(restaurant.id)}
                        onAdd={() => handleAddRestaurant(restaurant)}
                      />
                    ))}
                    {displayCount < restaurants.length && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setDisplayCount(prev => prev + RESULTS_PER_PAGE)}
                      >
                        Show More ({restaurants.length - displayCount} remaining)
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  );
}

interface RestaurantCardProps {
  restaurant: RestaurantResult;
  isAdded: boolean;
  onAdd: () => void;
}

function RestaurantCard({ restaurant, isAdded, onAdd }: RestaurantCardProps) {
  return (
    <div className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
      <div className="flex gap-3">
        {/* Photo */}
        {restaurant.photoUrl && (
          <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-muted">
            <img
              src={restaurant.photoUrl}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-medium truncate">{restaurant.name}</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {restaurant.rating.toFixed(1)}
                </span>
                <span>({restaurant.reviewCount})</span>
                <Badge variant="outline" className="text-xs">
                  {'$'.repeat(restaurant.priceLevel || 2)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Badge variant="secondary" className="text-xs">
              {restaurant.cuisine}
            </Badge>
            {restaurant.isOpen !== undefined && (
              <Badge
                variant={restaurant.isOpen ? 'default' : 'secondary'}
                className={cn('text-xs', restaurant.isOpen && 'bg-green-500')}
              >
                {restaurant.isOpen ? 'Open' : 'Closed'}
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground truncate mt-1">
            <MapPin className="w-3 h-3 inline mr-1" />
            {restaurant.address}
          </p>

          {/* Actions */}
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              variant={isAdded ? 'secondary' : 'default'}
              onClick={onAdd}
              disabled={isAdded}
              className="h-7 text-xs gap-1"
            >
              {isAdded ? (
                <>Added ✓</>
              ) : (
                <>
                  <Plus className="w-3 h-3" />
                  Add to Day
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              asChild
              className="h-7 text-xs gap-1"
            >
              <a href={restaurant.mapsUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3" />
                Maps
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
