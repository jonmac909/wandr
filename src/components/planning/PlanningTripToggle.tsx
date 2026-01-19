'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Search,
  Heart,
  Lock,
  Unlock,
  Plus,
  X,
  MapPin,
  Clock,
  Star,
  Footprints,
  Car,
  Coffee,
  UtensilsCrossed,
  Compass,
  Hotel,
  Plane,
  ChevronDown,
  Filter,
  Sparkles,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

// Day colors for timeline
const DAY_COLORS = [
  { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-50', border: 'border-orange-200' },
  { bg: 'bg-amber-500', text: 'text-amber-500', light: 'bg-amber-50', border: 'border-amber-200' },
  { bg: 'bg-cyan-500', text: 'text-cyan-500', light: 'bg-cyan-50', border: 'border-cyan-200' },
  { bg: 'bg-pink-500', text: 'text-pink-500', light: 'bg-pink-50', border: 'border-pink-200' },
  { bg: 'bg-violet-500', text: 'text-violet-500', light: 'bg-violet-50', border: 'border-violet-200' },
  { bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200' },
  { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-50', border: 'border-blue-200' },
];

// Category filters
const CATEGORIES = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'activities', label: 'Activities', icon: Compass },
  { id: 'restaurants', label: 'Food', icon: UtensilsCrossed },
  { id: 'cafes', label: 'Cafes', icon: Coffee },
  { id: 'hotels', label: 'Hotels', icon: Hotel },
];

export interface PlanningItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  category: 'activities' | 'restaurants' | 'cafes' | 'hotels' | 'flights' | 'transit';
  rating?: number;
  priceInfo?: string;
  hours?: string;
  duration?: number;
  tips?: string[];
  neighborhood?: string;
  tags?: string[];
  // Planning state
  isFavorited?: boolean;
  isLocked?: boolean; // For booked items
  dayAssigned?: number; // Which day it's assigned to (0-indexed)
  orderInDay?: number; // Order within the day
}

interface PlanningTripToggleProps {
  destination: string;
  duration: number;
  items: PlanningItem[];
  onItemsChange: (items: PlanningItem[]) => void;
  isPlanLocked: boolean;
  onPlanLockChange: (locked: boolean) => void;
}

type ViewMode = 'planning' | 'trip';

export function PlanningTripToggle({
  destination,
  duration,
  items,
  onItemsChange,
  isPlanLocked,
  onPlanLockChange,
}: PlanningTripToggleProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('trip'); // Default to trip view when plan exists
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedDay, setSelectedDay] = useState(0);
  const [addToTripSheet, setAddToTripSheet] = useState(false);

  // Toggle favorite
  const toggleFavorite = (itemId: string) => {
    onItemsChange(
      items.map(item =>
        item.id === itemId ? { ...item, isFavorited: !item.isFavorited } : item
      )
    );
  };

  // Toggle lock
  const toggleLock = (itemId: string) => {
    onItemsChange(
      items.map(item =>
        item.id === itemId ? { ...item, isLocked: !item.isLocked } : item
      )
    );
  };

  // Add item to a specific day
  const addToDay = (itemId: string, dayIndex: number) => {
    const dayItems = items.filter(i => i.dayAssigned === dayIndex);
    onItemsChange(
      items.map(item =>
        item.id === itemId
          ? { ...item, dayAssigned: dayIndex, orderInDay: dayItems.length }
          : item
      )
    );
    setAddToTripSheet(false);
  };

  // Remove from day
  const removeFromDay = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item?.isLocked) return; // Can't remove locked items

    onItemsChange(
      items.map(item =>
        item.id === itemId
          ? { ...item, dayAssigned: undefined, orderInDay: undefined }
          : item
      )
    );
  };

  // Get items for planning view (filtered)
  const getPlanningItems = () => {
    return items.filter(item => {
      const matchesSearch = !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  };

  // Get favorited items not yet assigned
  const getUnassignedFavorites = () => {
    return items.filter(item => item.isFavorited && item.dayAssigned === undefined);
  };

  // Get items for a specific day
  const getDayItems = (dayIndex: number) => {
    return items
      .filter(item => item.dayAssigned === dayIndex)
      .sort((a, b) => (a.orderInDay || 0) - (b.orderInDay || 0));
  };

  const getDayColors = (dayIndex: number) => DAY_COLORS[dayIndex % DAY_COLORS.length];

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl">
        <button
          onClick={() => setViewMode('planning')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            viewMode === 'planning'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Search className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
          Planning
        </button>
        <button
          onClick={() => setViewMode('trip')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            viewMode === 'trip'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MapPin className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
          Trip
          {items.filter(i => i.dayAssigned !== undefined).length > 0 && (
            <Badge variant="secondary" className="ml-1.5 text-xs px-1.5">
              {items.filter(i => i.dayAssigned !== undefined).length}
            </Badge>
          )}
        </button>
      </div>

      {/* Planning View - Search & Discover */}
      {viewMode === 'planning' && (
        <div className="space-y-4">
          {/* Search Prompt Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">Search with AI</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Ask me to find activities, cafes, restaurants, or hidden gems in {destination}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      `Best cafes in ${destination}`,
                      `Hidden gems ${destination}`,
                      `Local food spots`,
                      `Things to do`,
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setSearchQuery(suggestion)}
                        className="text-xs px-2.5 py-1.5 rounded-full bg-background border hover:border-primary/50 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={`Search activities, cafes, restaurants...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-20"
            />
            <Button
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7"
              disabled={!searchQuery.trim()}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Search
            </Button>
          </div>

          {/* Category Quick Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCategoryFilter(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  categoryFilter === id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Favorites Summary - Always visible if have favorites */}
          {items.filter(i => i.isFavorited).length > 0 && (
            <div className="flex items-center justify-between p-3 bg-pink-50 border border-pink-200 rounded-xl">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                <span className="text-sm font-medium">
                  {items.filter(i => i.isFavorited).length} favorites
                </span>
                {getUnassignedFavorites().length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({getUnassignedFavorites().length} not in trip yet)
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => setViewMode('trip')}
              >
                Add to trip →
              </Button>
            </div>
          )}

          {/* Search Results / Discovered Items */}
          {getPlanningItems().length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                {searchQuery ? 'Search Results' : 'Discovered Places'}
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {getPlanningItems().map((item) => (
                  <PlanningItemCard
                    key={item.id}
                    item={item}
                    onToggleFavorite={() => toggleFavorite(item.id)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground mb-1">
                Search for places in {destination}
              </p>
              <p className="text-xs text-muted-foreground">
                Try &quot;best coffee shops&quot; or &quot;unique experiences&quot;
              </p>
            </div>
          )}
        </div>
      )}

      {/* Trip View */}
      {viewMode === 'trip' && (
        <div className="space-y-4">
          {/* Day Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {Array.from({ length: duration }, (_, i) => {
              const colors = getDayColors(i);
              const dayItemCount = getDayItems(i).length;
              const isSelected = selectedDay === i;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(i)}
                  className={`flex-shrink-0 min-w-[70px] px-3 py-2 rounded-xl transition-all ${
                    isSelected
                      ? `${colors.light} ${colors.border} border-2`
                      : 'bg-muted/50 border border-transparent hover:bg-muted'
                  }`}
                >
                  <div className={`text-xs font-medium ${isSelected ? colors.text : 'text-muted-foreground'}`}>
                    Day {i + 1}
                  </div>
                  <div className="text-sm font-bold">
                    {i === 0 ? '✈️' : i === duration - 1 ? '🏠' : dayItemCount > 0 ? dayItemCount : '—'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Day Timeline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getDayColors(selectedDay).bg}`} />
                Day {selectedDay + 1}
                {selectedDay === 0 && <span className="text-xs text-muted-foreground">(Arrival)</span>}
                {selectedDay === duration - 1 && <span className="text-xs text-muted-foreground">(Departure)</span>}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddToTripSheet(true)}
                disabled={getUnassignedFavorites().length === 0}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            {/* Day Timeline */}
            {getDayItems(selectedDay).length === 0 ? (
              <Card className={`${getDayColors(selectedDay).light} ${getDayColors(selectedDay).border} border-dashed`}>
                <CardContent className="py-8 text-center">
                  <MapPin className={`w-6 h-6 mx-auto mb-2 ${getDayColors(selectedDay).text} opacity-50`} />
                  <p className="text-sm text-muted-foreground mb-2">
                    No activities for Day {selectedDay + 1}
                  </p>
                  {getUnassignedFavorites().length > 0 ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddToTripSheet(true)}
                    >
                      Add from favorites
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Favorite items in Planning view first
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-0">
                {getDayItems(selectedDay).map((item, index) => (
                  <div key={item.id}>
                    <TripTimelineCard
                      item={item}
                      dayColors={getDayColors(selectedDay)}
                      onToggleLock={() => toggleLock(item.id)}
                      onRemove={() => removeFromDay(item.id)}
                      isLast={index === getDayItems(selectedDay).length - 1}
                    />
                    {index < getDayItems(selectedDay).length - 1 && (
                      <TravelConnector dayColors={getDayColors(selectedDay)} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trip Summary */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium text-sm mb-3">Trip Summary</h4>
              <div className="space-y-2">
                {Array.from({ length: duration }, (_, i) => {
                  const dayItems = getDayItems(i);
                  const colors = getDayColors(i);
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded-lg p-1.5 -m-1.5"
                      onClick={() => setSelectedDay(i)}
                    >
                      <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
                      <span className="font-medium">Day {i + 1}</span>
                      <span className="text-muted-foreground">·</span>
                      {dayItems.length > 0 ? (
                        <span className="text-muted-foreground truncate">
                          {dayItems.map(d => d.name).join(' → ')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50 italic">Empty</span>
                      )}
                      {dayItems.some(d => d.isLocked) && (
                        <Lock className="w-3 h-3 text-muted-foreground ml-auto" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add to Trip Sheet */}
      <Sheet open={addToTripSheet} onOpenChange={setAddToTripSheet}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle>Add to Day {selectedDay + 1}</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 overflow-y-auto h-[calc(100%-60px)] pb-safe">
            {getUnassignedFavorites().length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No favorites to add</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setAddToTripSheet(false);
                    setViewMode('planning');
                  }}
                >
                  Browse activities
                </Button>
              </div>
            ) : (
              getUnassignedFavorites().map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex gap-3 p-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.imageUrl || `/api/placeholder/city/${encodeURIComponent(item.name)}`}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                        {item.priceInfo && (
                          <p className="text-xs text-muted-foreground">{item.priceInfo}</p>
                        )}
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addToDay(item.id, selectedDay)}
                        className="self-center"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Planning view item card with favorite button
function PlanningItemCard({
  item,
  onToggleFavorite,
}: {
  item: PlanningItem;
  onToggleFavorite: () => void;
}) {
  const getCategoryIcon = () => {
    switch (item.category) {
      case 'restaurants': return UtensilsCrossed;
      case 'cafes': return Coffee;
      case 'hotels': return Hotel;
      case 'flights': return Plane;
      default: return Compass;
    }
  };
  const CategoryIcon = getCategoryIcon();

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex gap-3 p-3">
          {/* Image */}
          <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
            <img
              src={item.imageUrl || `/api/placeholder/city/${encodeURIComponent(item.name)}`}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            {/* Rating badge */}
            {item.rating && (
              <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] text-white font-medium">{item.rating}</span>
              </div>
            )}
            {/* Category badge */}
            <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-sm rounded-full p-1">
              <CategoryIcon className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 py-0.5">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className={`p-1.5 rounded-full transition-all ${
                  item.isFavorited
                    ? 'text-pink-500'
                    : 'text-muted-foreground hover:text-pink-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${item.isFavorited ? 'fill-current' : ''}`} />
              </button>
            </div>

            {item.neighborhood && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {item.neighborhood}
              </p>
            )}

            {item.priceInfo && (
              <p className="text-xs mt-1">
                <span className="bg-muted px-1.5 py-0.5 rounded">{item.priceInfo}</span>
              </p>
            )}

            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {item.description}
            </p>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {item.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Trip view timeline card with lock
function TripTimelineCard({
  item,
  dayColors,
  onToggleLock,
  onRemove,
  isLast,
}: {
  item: PlanningItem;
  dayColors: typeof DAY_COLORS[0];
  onToggleLock: () => void;
  onRemove: () => void;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-3">
      {/* Timeline dot */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${dayColors.bg} ring-4 ring-background z-10`} />
        {!isLast && <div className={`w-0.5 flex-1 ${dayColors.bg} opacity-30`} />}
      </div>

      {/* Card */}
      <div className={`flex-1 mb-2 p-3 rounded-xl ${dayColors.light} ${dayColors.border} border`}>
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={item.imageUrl || `/api/placeholder/city/${encodeURIComponent(item.name)}`}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold text-sm ${dayColors.text} line-clamp-1`}>
              {item.name}
            </h4>
            {item.priceInfo && (
              <p className="text-xs mt-0.5">
                <span className="bg-background/80 px-1.5 py-0.5 rounded">{item.priceInfo}</span>
              </p>
            )}
            {item.hours && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.hours}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1">
            <button
              onClick={onToggleLock}
              className={`p-1.5 rounded-full transition-all ${
                item.isLocked
                  ? 'bg-amber-100 text-amber-600'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
              title={item.isLocked ? 'Unlock' : 'Lock (booked)'}
            >
              {item.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>
            {!item.isLocked && (
              <button
                onClick={onRemove}
                className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Travel time connector
function TravelConnector({
  dayColors,
}: {
  dayColors: typeof DAY_COLORS[0];
}) {
  // Mock travel time - in real app would calculate
  const minutes = Math.floor(Math.random() * 15) + 5;
  const mode = minutes > 10 ? 'drive' : 'walk';

  return (
    <div className="flex gap-3 py-0.5">
      <div className="flex flex-col items-center w-3">
        <div className={`w-0.5 h-6 ${dayColors.bg} opacity-30`} />
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {mode === 'walk' ? (
          <Footprints className="w-3 h-3" />
        ) : (
          <Car className="w-3 h-3" />
        )}
        <span>{minutes} min {mode}</span>
      </div>
    </div>
  );
}
