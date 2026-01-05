'use client';

import { FoodRecommendation } from '@/types/itinerary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Utensils, Star, MapPin, Calendar, AlertTriangle, DollarSign, Trash2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateRestaurantUrl } from '@/lib/booking/urls';

interface FoodLayerProps {
  foods: FoodRecommendation[];
  groupByDay?: boolean;
  onDeleteFood?: (foodId: string) => void;
}

const TYPE_STYLES: Record<string, { bg: string; label: string }> = {
  'local-classic': { bg: 'bg-amber-100 text-amber-800', label: 'Local Classic' },
  'splurge': { bg: 'bg-purple-100 text-purple-800', label: 'Splurge' },
  'casual-backup': { bg: 'bg-gray-100 text-gray-800', label: 'Casual Backup' },
};

export function FoodLayerView({ foods, groupByDay = false, onDeleteFood }: FoodLayerProps) {
  // Group by type
  const localClassics = foods.filter((f) => f.type === 'local-classic');
  const splurges = foods.filter((f) => f.type === 'splurge');
  const backups = foods.filter((f) => f.type === 'casual-backup');
  const skipTheHype = foods.filter((f) => f.skipTheHype);

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Utensils className="w-5 h-5" />
              Restaurant Recommendations
            </h2>
            <div className="flex gap-2">
              <Badge variant="outline">{foods.length} spots</Badge>
              <Badge className="bg-purple-100 text-purple-800">
                {splurges.length} splurges
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Splurges - Special Section */}
      {splurges.length > 0 && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-purple-800">
              <Star className="w-5 h-5" />
              Splurge-Worthy Spots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {splurges.map((food) => (
                <FoodCard key={food.id} food={food} onDelete={onDeleteFood} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Local Classics */}
      {localClassics.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Utensils className="w-5 h-5" />
              Local Classics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {localClassics.map((food) => (
                <FoodCard key={food.id} food={food} onDelete={onDeleteFood} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Casual Backups */}
      {backups.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
              <Utensils className="w-5 h-5" />
              Casual Backups
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Reliable options when you need something easy
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {backups.map((food) => (
                <div
                  key={food.id}
                  className="p-2 bg-muted/50 rounded-lg text-sm"
                >
                  <div className="font-medium">{food.name}</div>
                  <div className="text-xs text-muted-foreground">{food.cuisine}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skip the Hype */}
      {skipTheHype.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
              Skip the Hype
            </CardTitle>
            <p className="text-sm text-amber-700">
              Popular spots that aren&apos;t worth the wait
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {skipTheHype.map((food) => (
                <li key={food.id} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-medium">{food.name}</span>
                    <span className="text-muted-foreground"> — {food.notes}</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface FoodCardProps {
  food: FoodRecommendation;
  onDelete?: (foodId: string) => void;
}

function FoodCard({ food, onDelete }: FoodCardProps) {
  const typeStyle = TYPE_STYLES[food.type] || TYPE_STYLES['casual-backup'];

  return (
    <div className="p-3 bg-card border rounded-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{food.name}</span>
            <Badge className={cn('text-xs', typeStyle.bg)}>
              {typeStyle.label}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">{food.cuisine}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{food.priceRange}</span>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(food.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {food.notes && (
        <p className="text-sm mt-2">{food.notes}</p>
      )}

      <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
        {food.location?.name && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {food.location.name}
          </span>
        )}
        {food.mealTime && (
          <Badge variant="secondary" className="text-xs capitalize">
            {food.mealTime}
          </Badge>
        )}
        {food.reservationRequired && (
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-300">
              Reservation needed
            </Badge>
            <a
              href={generateRestaurantUrl({ restaurantName: food.name, location: food.location?.name })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
              title="Search for reservations on Google"
            >
              <ExternalLink className="w-3 h-3" />
              Book
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
