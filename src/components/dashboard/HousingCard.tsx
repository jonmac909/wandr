'use client';

import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Base } from '@/types/itinerary';

interface HousingCardProps {
  base: Base;
}

export function HousingCard({ base }: HousingCardProps) {
  const name = base.accommodation?.name || base.location.split(',')[0];
  const address = base.location;
  const photoQuery = base.location.split(',')[0]?.trim().toLowerCase() || 'hotel';

  // Format dates
  const checkIn = formatDate(base.checkIn);
  const checkOut = formatDate(base.checkOut);
  const dateRange = checkIn && checkOut ? `${checkIn} - ${checkOut}` : '';

  // Mock price (in real app, would come from accommodation data)
  const price = base.accommodation?.priceRange
    ? getPriceFromRange(base.accommodation.priceRange, base.nights)
    : null;

  return (
    <Card className="overflow-hidden hover:border-primary/30 transition-colors">
      <div className="flex">
        {/* Thumbnail */}
        <div className="w-24 h-24 flex-shrink-0 overflow-hidden">
          <img
            src={`https://source.unsplash.com/150x150/?${encodeURIComponent(photoQuery)},hotel,accommodation`}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <CardContent className="flex-1 p-3">
          <h4 className="font-semibold text-sm mb-0.5 line-clamp-1">{name}</h4>
          <p className="text-xs text-muted-foreground mb-1 line-clamp-1">{address}</p>
          <p className="text-xs text-muted-foreground mb-2">{dateRange}</p>

          <div className="flex items-center gap-2">
            {price && (
              <span className="text-sm font-semibold">{price}</span>
            )}
            <Badge variant="outline" className="gap-1 text-xs text-green-600 border-green-200 bg-green-50">
              <Check className="w-3 h-3" />
              Paid
            </Badge>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getPriceFromRange(range: string, nights: number): string {
  const priceMap: Record<string, number> = {
    '$': 50,
    '$$': 120,
    '$$$': 250,
    '$$$$': 500,
  };
  const perNight = priceMap[range] || 100;
  const total = perNight * nights;
  return `€${total}`;
}
